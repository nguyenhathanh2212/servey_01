<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Repositories\Survey\SurveyInterface;
use App\Repositories\Question\QuestionInterface;
use App\Repositories\Answer\AnswerInterface;
use App\Repositories\Invite\InviteInterface;
use App\Repositories\Setting\SettingInterface;
use App\Repositories\User\UserInterface;
use App\Repositories\Feedback\FeedbackInterface;
use App\Repositories\Result\ResultInterface;
use Illuminate\Foundation\Bus\DispatchesJobs;
use App\Jobs\SendMail;
use Carbon\Carbon;
use LRedis;
use Mail;
use DB;
use Validator;
use Exception;
use Session;
use App\Models\Survey;
use App\Http\Requests\UpdateSurveyRequest;
use Predis\Connection\ConnectionException;
use App\Http\Requests\SurveyRequest;
use App\Http\Requests\ResultRequest;
use App\Http\Requests\UpdateSurveySettingRequest;
use Auth;
use App\Traits\SurveyProcesser;
use App\Traits\DoSurvey;

class SurveyController extends Controller
{
    use DispatchesJobs, SurveyProcesser, DoSurvey;

    protected $surveyRepository;
    protected $questionRepository;
    protected $answerRepository;
    protected $inviteRepository;
    protected $settingRepository;
    protected $userRepository;
    protected $feedbackRepository;
    protected $resultRepository;

    public function __construct(
        SurveyInterface $surveyRepository,
        QuestionInterface $questionRepository,
        AnswerInterface $answerRepository,
        InviteInterface $inviteRepository,
        SettingInterface $settingRepository,
        UserInterface $userRepository,
        FeedbackInterface $feedbackRepository,
        ResultInterface $resultRepository
    ) {
        $this->surveyRepository = $surveyRepository;
        $this->questionRepository = $questionRepository;
        $this->answerRepository = $answerRepository;
        $this->inviteRepository = $inviteRepository;
        $this->settingRepository = $settingRepository;
        $this->userRepository = $userRepository;
        $this->feedbackRepository = $feedbackRepository;
        $this->resultRepository = $resultRepository;
    }

    public function index()
    {
        $data['users'] = count($this->userRepository->lists('id'));
        $data['surveys'] = count($this->surveyRepository->lists('id'));
        $data['surveys_open'] = count($this->surveyRepository->getSurveysByStatus(config('settings.survey.status.open'))->get());
        $data['feedbacks'] = count($this->feedbackRepository->lists('id'));

        return view('clients.home.index', compact('data'));
    }

    public function create()
    {
        return view('clients.survey.create.index');
    }

    public function store(SurveyRequest $request)
    {
        if (!$request->ajax()) {
            return response()->json([
                'success' => false,
            ]);
        }

        DB::beginTransaction();

        try {
            $survey = $this->surveyRepository->createSurvey(
                Auth::user()->id,
                $request->json(),
                config('settings.survey.status.open'),
                $this->userRepository
            );

            if (!$survey) {
                throw new Exception("Create survey failed", 1);
            }

            $request->session()->flash('success', trans('lang.survey_create_success'));

            DB::commit();

            return response()->json([
                'success' => true,
                'redirect' => route('survey.create.complete', $survey->token_manage),
            ]);
        } catch (Exception $e) {
            DB::rollback();

            return response()->json([
                'success' => false,
                'message' => trans('lang.survey_create_failed'),
            ]);
        }
    }

    public function storeTmp(Request $request)
    {
        $value = $request->only([
            'title',
            'feature',
            'start_time',
            'next_reminder_time',
            'deadline',
            'description',
            'txt-question',
            'checkboxRequired',
            'email',
            'emails',
            'setting',
            'name',
            'image',
            'image-url',
            'video-url',
        ]);

        $validator = $this->makeValidator([
            'txt-question' => $value['txt-question'],
            'image' => $value['image'],
        ], true);
        $validator = Validator::make($request->all(), $validator);

        if ($validator->fails()) {
            return redirect()->back()
                ->withInput()
                ->with('message-fail', trans_choice('messages.object_created_unsuccessfully', 1));
        }

        if (!strlen($value['title'])) {
            $value['title'] = config('survey.title_default');
        }

        $token = md5(uniqid(rand(), true));
        $tokenManage = md5(uniqid(rand(), true));
        DB::beginTransaction();
        try {
            $inputs = collect([
                'user_id' => (auth()->id()) ?: null,
                'mail' => (!auth()->id()) ? $value['email'] : null,
                'title' => $value['title'],
                'feature' => empty($value['feature']) ? config('settings.feature') : config('settings.not_feature'),
                'token' => $token,
                'token_manage' => $tokenManage,
                'status' => $value['deadline'],
                'start_time' => $value['start_time'],
                'next_reminder_time' => $value['next_reminder_time'],
                'deadline' => $value['deadline'],
                'description' => $value['description'],
                'user_name' => $value['name'],
            ]);
            $survey = $this->surveyRepository->createSurvey(
                $inputs,
                ($value['setting']) ?: [],
                $value['txt-question'],
                ($value['checkboxRequired']['question']) ?: [],
                ($value['image']) ?: [],
                $this->removeEmptyValue($value['image-url']),
                $this->removeEmptyValue($value['video-url']),
                Session::get('locale')
            );

            if ($survey) {
                $inputInfo = $request->only([
                    'name',
                    'email',
                    'title',
                    'description',
                ]);
                $inputInfo['link'] = action($inputs['feature']
                    ? 'AnswerController@answerPublic'
                    : 'AnswerController@answerPrivate', [
                        'token' => $token,
                    ]);
                $inputInfo['linkManage'] = action('AnswerController@show', [
                    'tokenManage' => $tokenManage,
                ]);
                $job = (new SendMail(collect($inputInfo), 'mailManage'))
                    ->onConnection('database')
                    ->onQueue('emails');
                $isSuccess = ($this->dispatch($job) && $this->inviteUser($request, $survey, config('settings.return.bool')));

                if (!$isSuccess) {
                    throw new Exception('Create Survey is Fail.');
                }
            }

            DB::commit();

            return redirect()->action('SurveyController@complete', $tokenManage);
        } catch (Exception $e) {
            DB::rollback();

            return redirect()->action('SurveyController@index')
                ->withInput()
                ->with('message-fail', trans_choice('messages.object_created_unsuccessfully', 1));
        }
    }

    public function show(Request $request, $token)
    {
        if (!$request->ajax() && Session::has('url_current')) {
            Session::forget('url_current');
        }

        $survey = $this->surveyRepository->getSurvey($token);
        $numOfSection = $survey->sections->count();

        if ($request->ajax()) {
            $currentSection = $request->session()->get('current_section_survey');
            $request->session()->put('current_section_survey', ++ $currentSection);
            $sectionsId = $survey->sections->sortBy('order')->pluck('id')->all();
            $section = $this->surveyRepository->getSectionCurrent($survey, $sectionsId[$currentSection - 1]);
            $sectionOrder = 'section-' . $section->order;

            $data = [
                'section' => $section,
                'currentSection' => $currentSection,
                'numOfSection' => $numOfSection,
                'survey' => $survey,
            ];

            return response()->json([
                'success' => true,
                'html' => view('clients.survey.detail.content-survey', compact('data'))->render(),
                'section_order' => $sectionOrder,
            ]);
        }

        $privacy = $survey->getPrivacy();
        
        if ($privacy == config('settings.survey_setting.privacy.private')
            && !in_array(Auth::user()->id, $survey->members()->pluck('user_id')->all())) {
            $inviter = $survey->invite;

            if (empty($inviter) || !in_array(Auth::user()->email, $inviter->invite_mails_array)) {
                $title = $survey->title;

                if (in_array(Auth::user()->email, $inviter->answer_mails_array)) {
                    $content = trans('lang.you_have_answered_this_survey');
                } else {
                    $content = trans('lang.you_do_not_have_permission');
                }

                return view('clients.survey.detail.complete', compact('title', 'content'));
            }
        }
        // at line 42 of file app/Traits/DoSurvey.php
        $data = $this->getDetailSurvey($survey, $numOfSection);

        return view('clients.survey.detail.index', compact('data'));
    }

    public function edit($tokenManage)
    {
        // check survey owner authorization
        // check survey exists with token manage and get data
        $survey = $this->surveyRepository->getSurveyByTokenManage($tokenManage);

        if (Auth::user()->cannot('edit', $survey)) {
            return view('clients.layout.404');
        }

        if (!$survey) {
            return redirect()->route('survey.survey.show-surveys');
        }

        return view('clients.survey.edit.index', compact('survey'));
    }

    public function update($token, UpdateSurveyRequest $request)
    {
        if (!$request->ajax()) {
            return [
                'success' => fasle,
            ];
        }

        DB::beginTransaction();

        try {
            $survey = $this->surveyRepository->getSurveyFromTokenManage($token);

            if (Auth::user()->cannot('update', $survey)) {
                throw new Exception("Not permitted edit!", 403);
            }

            $this->surveyRepository->updateSurvey(
                $survey, 
                $request->json(),
                config('settings.survey.status.open'),
                $this->questionRepository,
                $this->answerRepository,
                $this->userRepository
            );

            DB::commit();
            
            $request->session()->flash('success', trans('lang.edit_survey_success'));

            return response()->json([
                'success' => true,
                'redirect' => route('survey.management', $survey->token_manage),
            ]);
        } catch (Exception $e) {
            DB::rollback();

            return response()->json([
                'success' => false,
                'message' => trans('lang.edit_survey_error'),
                'redirect' => ($e->getCode() == 403) ? route('403') : '',
            ]);
        }
    }

    public function destroy(Request $request)
    {
        if (!$request->ajax()) {
            return [
                'success' => false,
            ];
        }

        $surveyId = $request->get('idSurvey');
        $this->surveyRepository->delete($surveyId);

        try {
            $redis = LRedis::connection();
            $redis->publish('delete', json_encode([
                'success' => true,
                'surveyId' => $surveyId,
            ]));
        } catch (ConnectionException $e) {
        }

        return [
            'success' => true,
        ];
    }


    public function checkCloseSurvey($inviteIds, $surveyIds)
    {
        $ids = array_merge(
            $inviteIds->lists('survey_id')->toArray(),
            $surveyIds->lists('id')->toArray()
        );

        return $this->settingRepository
            ->whereIn('survey_id', $ids)
            ->where([
                'key' => config('settings.key.limitAnswer'),
                'value' => 0,
            ])
            ->lists('survey_id')
            ->toArray();
    }

    public function listSurveyUser(Request $request)
    {
        $invites = $inviteIds = $this->inviteRepository
            ->where('recevier_id', auth()->id())
            ->orWhere('mail', auth()->user()->email);
        $surveys = $surveyIds = $this->surveyRepository
            ->where('user_id', auth()->id());
        $settings = $this->checkCloseSurvey($inviteIds, $surveyIds);
        $invites = $invites
            ->orderBy('id', 'desc')
            ->paginate(config('settings.paginate'));
        $surveys = $surveys
            ->where('status', config('survey.status.available'))
            ->whereNotIn('id', $settings)
            ->where(function ($query) {
                return $query->where('deadline', '>', Carbon::now()->toDateTimeString())->orWhereNull('deadline');
            })
            ->orderBy('id', 'desc')
            ->paginate(config('settings.paginate'));
        $this->surveyRepository->newQuery(new Survey());
        $surveyCloses = $this->surveyRepository
            ->where('user_id', auth()->id())
            ->where(function ($query) use ($settings) {
                $query->where('status', config('survey.status.block'))
                    ->orWhere('deadline', '<', Carbon::now()->toDateTimeString())
                    ->orWhereIn('id', $settings);
            })
            ->orderBy('id', 'desc')
            ->paginate(config('settings.paginate'));

        if ($request->ajax()) {
            try {
                $viewId = $request->get('viewId');
                $view = null;

                if ($viewId == 'profile-v') {
                    $view = view('user.pages.list-invited', compact('invites', 'settings'))->render();
                } elseif ($viewId == 'home-v') {
                    $view = view('user.pages.your_survey', compact('surveys', 'settings'))->render();
                } else {
                    $view = view('user.pages.list_survey_close', compact('surveyCloses', 'settings'))->render();
                }

                if (!$view) {
                    return response()->json([
                        'success' => false,
                        'messageFail' => trans('messages.paginate_fail'),
                    ]);
                }

                return response()->json([
                    'success' => true,
                    'view' => $view,
                ]);
            } catch (Exception $e) {
                return response()->json([
                    'success' => false,
                    'messageFail' => trans('messages.paginate_fail'),
                ]);
            }
        }

        return view('user.pages.list-survey', compact('surveys', 'invites', 'settings', 'surveyCloses'));
    }

    public function open($id, Request $request)
    {
        if ($request->ajax()) {
            try {
                $survey = $this->surveyRepository->find($id);
                $changeDeadline = $request->get('change_deadline') === 'true' ? true: false;

                if ($changeDeadline && !empty($request->get('deadline'))) {
                    $deadline = Carbon::parse(in_array(Session::get('locale'), config('settings.sameFormatDateTime'))
                        ? str_replace('-', '/', $request->get('deadline'))
                        : $request->get('deadline'))
                        ->toDateTimeString();
                    $this->surveyRepository->update($id, ['status' => config('survey.status.available'), 'deadline' => $deadline]);
                } else {
                    $this->surveyRepository->update($id, ['status' => config('survey.status.available')]);
                }

                $redis = LRedis::connection();
                $redis->publish('open', $id);
            } catch (ConnectionException $e) {
            } catch (Exception $e) {
                return [
                    'success' => false,
                    'message' => trans('home.error'),
                ];
            }

            return [
                'success' => true,
            ];
        }
    }

    public function close($id, Request $request)
    {
        if ($request->ajax()) {
            try {
                $survey = $this->surveyRepository->find($id);

                if ($survey->is_expired) {
                    throw new Exception();
                }

                $this->surveyRepository->update($id, ['status' => config('survey.status.block')]);
                $redis = LRedis::connection();
                $redis->publish('close', $id);
            } catch (ConnectionException $e) {
            } catch (Exception $e) {
                return [
                    'success' => false,
                    'message' => trans('home.error'),
                ];
            }

            return [
                'success' => true,
            ];
        }
    }

    public function duplicate($id, Request $request)
    {
        if ($request->ajax()) {
            DB::beginTransaction();

            try {
                $survey = $this->surveyRepository->find($id);
                $newSurvey = $this->surveyRepository->duplicateSurvey($survey);
                DB::commit();

                $redis = LRedis::connection();
                $redis->publish('duplicate', $id);
            } catch (ConnectionException $e) {
            } catch (Exception $e) {
                DB::rollback();

                return [
                    'success' => false,
                    'message' => trans('home.error'),
                ];
            }

            Session::flash('message', trans('messages.duplicate_successfully'));
            return [
                'success' => true,
                'url' => action('AnswerController@show', ['token' => $newSurvey->token_manage]),
            ];
        }
    }

    private function makeValidator(array $inputs, $flage = false)
    {
        $images = $inputs['image'];
        $validator = [];

        foreach ($inputs['txt-question']['question'] as $questionIndex => $content) {
            $validator['txt-question.question.' . $questionIndex] = 'required|max:255';

            if ($images && array_key_exists('question', $images) && array_key_exists($questionIndex, $images['question'])) {
                $validator['image.quesion.' . $questionIndex] = 'image|mimes:jpg,jpeg,png,gif,bmp,svg|max:1000';
            }

            foreach ($inputs['txt-question']['answers'][$questionIndex] as $answerIndex => $answer) {
                $type = head(array_keys($answer));
                if (in_array($type, [
                    config('survey.type_radio'),
                    config('survey.type_checkbox'),
                ])) {
                    $validator['txt-question.answers.' . $questionIndex] = 'array';
                    $validator['txt-question.answers.' . $questionIndex . '.' . $answerIndex . '.' . $type] = 'required|max:255|distinct';
                }

                if ($images
                    && array_key_exists('answers', $images)
                    && array_key_exists($questionIndex, $images['answers'])
                    && array_key_exists($answerIndex, $images['answers'][$questionIndex])
                ) {
                    $validator['image.answers.' . $questionIndex . '.' . $answerIndex] = 'image|mimes:jpg,jpeg,png,gif,bmp,svg|max:1000';
                }
            }
        }

        if ($flage) {
            $validator['email'] = 'required|email|max:255';
            $validator['name'] = 'required|max:255';
            $validator['emails'] = 'max:255
                |regex:/^([a-zA-Z][a-zA-Z0-9_\.]{2,255}@[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,4}){1,2}[,]{0,1}[,]{0,1}[\s]*)+(?<!,)(?<!\s)$/';
            $validator['title'] = 'required|max:255';
            $realTime = Carbon::now()->addMinutes(30)->format(trans('temp.format_with_trans'));
            $validator['start_time'] = 'date_format:' . trans('temp.format_with_trans');
            $validator['deadline'] = 'date_format:' . trans('temp.format_with_trans') . '|after:start_time|after:' . $realTime;
            $validator['setting.' . config('settings.key.limitAnswer')] = 'numeric
                |digits_between:1,' . config('settings.max_limit');
            $validator['setting.' . config('settings.key.tailMail')] = 'max:255
                |regex:/^(@[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,4}){1,2}[,]{0,1}[,]{0,1}[\s]*)+(?<!,)(?<!\s)$/';
        }

        return $validator;
    }

    private function removeEmptyValue(array $array)
    {
        if (array_key_exists('question', $array)) {
            $array['question'] = array_filter($array['question']);
        }

        if (array_key_exists('answers', $array)) {
            foreach (array_keys($array['answers']) as $key) {
                $array['answers'][$key] = array_filter($array['answers'][$key]);
            }
        }

        return $array;
    }

    // rewrite
    public function complete($token)
    {
        if (!$token) {
            return view('clients.layout.404');
        }

        $survey = $this->surveyRepository->where('token_manage', $token)->first();

        if (!$survey) {
            return view('clients.layout.404');
        }

        $user = Auth::user();
        $linkManage = route('survey.management', $survey->token_manage);
        $link = route('survey.create.do-survey', $survey->token);

        return view('clients.survey.create.complete', compact('user', 'linkManage', 'link'));
    }

    public function inviteUser(Request $request, $surveyId, $type)
    {
        // type nếu là bool thì hàm inviteUser sẽ trả về true hoặc flase, view thì hàm inviteUser sẽ trả về action('SurveyController@listSurveyUser')
        $isSuccess = false;
        $data['email'] = $request->get(($type == config('settings.return.bool')) ? 'email' : 'emailUser') ?: auth()->user()->email;
        $data['emails'] = $request->get(($type == config('settings.return.bool')) ? 'emails' : 'emailsUser');
        $data['feature'] = $request->get('feature');

        if (empty($data['emails'])) {
            return true;
        }

        $data['emails'] = explode(',', $data['emails']);

        if ($data['emails'] && $surveyId) {
            $survey = $this->surveyRepository->find($surveyId);
            $data['name'] = $survey->user_name;
            $invite = $this->inviteRepository->invite(auth()->id(), $data['emails'], $surveyId);
            $data['feature'] = ($type == config('settings.return.bool')) ? $data['feature'] : $survey->feature;

            if ($invite) {
                $inputInfo = [
                    'name' => auth()->check() ? auth()->user()->name : $data['name'],
                    'email' => $data['emails'],
                    'title' => $survey->title,
                    'description' => $survey->description,
                    'link' => action($survey->feature
                        ? 'AnswerController@answerPublic'
                        : 'AnswerController@answerPrivate', [
                            'token' => $survey->token,
                        ]),
                    'emailSender' => $data['email'],
                ];
                $job = (new SendMail(collect($inputInfo), 'mailInvite'))
                    ->onConnection('database')
                    ->onQueue('emails');
                $this->dispatch($job);
                $isSuccess = true;
                try {
                    $redis = LRedis::connection();
                    $redis->publish('invite', json_encode([
                        'success' => $isSuccess,
                        'emails' => replaceEmail($data['emails']),
                        'viewInvite' => view('user.component.invited-user', compact('survey'))->render(),
                    ]));
                } catch (ConnectionException $e) {
                }
            }
        }

        if (!auth()->check() && $type == config('settings.return.view')) {
            return $isSuccess
                ? redirect()->action('AnswerController@show', $survey->token_manage)
                    ->with('message', trans('survey.invite_success'))
                : redirect()->action('AnswerController@show', $survey->token_manage)
                    ->with('message-fail', trans('survey.invite_fail'));
        }

        return ($type == config('setttings.return.bool')) ? $isSuccess : ($isSuccess)
            ? redirect()->action('SurveyController@listSurveyUser')
                ->with('message', trans('survey.invite_success'))
            : redirect()->action('SurveyController@listSurveyUser')
                ->with('message-fail', trans('survey.invite_fail'));
    }

    public function getMailSuggestion(Request $request)
    {
        if ($request->ajax()) {
            $keyword = $request->input('keyword');
            $emails = $this->userRepository->findEmail($keyword);

            if (count($emails)) {
                return response()->json($emails);
            }
        }
    }

    /* store result -new- */
    public function storeResult(ResultRequest $request)
    {
        if (!$request->ajax()) {
            return response()->json([
                'success' => false,
            ]);
        }

        DB::beginTransaction();

        try {
            $this->resultRepository->storeResult($request->json(), $this->surveyRepository);
            $request->session()->forget('current_section_survey');

            DB::commit();
            
            return response()->json([
                'success' => true,
            ]);
        } catch (Exception $e) {
            DB::rollback();

            return response()->json([
                'success' => false,
                'message' => trans('lang.send_result_failed'),
            ]);
        }
    }

    // write new
    public function saveDraft(Request $request)
    {
        if (!$request->ajax()) {
            return [
                'success' => false,
            ];
        }

        $totalDraft = $this->surveyRepository->countSurveyDraftOfUser(Auth::user()->id);

        if ($totalDraft >= config('users.survey_draft_limit')) {
            return response()->json([
                'success' => false,
                'message' => trans('lang.over_limit_save_draft', [
                    'limit' => config('users.survey_draft_limit'),
                ]),
            ]);
        }

        DB::beginTransaction();

        try {
            $survey = $this->surveyRepository->createSurvey(
                Auth::user()->id,
                $request->json(),
                config('settings.survey.status.draft'),
                $this->userRepository
            );

            if (!$survey) {
                throw new Exception("Save survey as draft failed", 1);
            }

            $request->session()->flash('success', trans('lang.save_survey_draft_success'));
            $redirect = route('surveys.edit', $survey->token_manage);

            DB::commit();

            return response()->json([
                'success' => true,
                'redirect' => $redirect,
            ]);
        } catch (Exception $e) {
            DB::rollback();

            return response()->json([
                'success' => false,
                'message' => trans('lang.save_survey_draft_failed'),
            ]);
        }
    }

    public function showCompleteAnswer($token)
    {
        try {
            $survey = $this->surveyRepository->getSurveyFromToken($token);
            $title = $survey->title;

            return view('clients.survey.detail.complete', compact('title'));
        } catch (Exception $e) {
            return redirect()->route('404');
        }
    }

    public function updateSetting(UpdateSurveySettingRequest $request, $token)
    {
        if (!$request->ajax()) {
            return [
                'success' => false,
            ];
        }

        DB::beginTransaction();

        try {
            $survey = $this->surveyRepository->getSurveyFromTokenManage($token);

            if (Auth::user()->cannot('edit', $survey)) {
                throw new Exception("Not permitted edit!", 403);
            }

            $result = $this->surveyRepository->updateSettingSurvey(
                $survey, 
                $request->json(),
                $this->userRepository
            );

            DB::commit();

            return response()->json([
                'success' => true,
            ]);
        } catch (Exception $e) {
            DB::rollback();

            return response()->json([
                'success' => false,
                'message' => trans('lang.error_update_setting_survey'),
                'redirect' => ($e->getCode() == 403) ? route('403') : '',
            ]);
        }
    }

    public function updateDraft($token, Request $request) 
    {
        if (!$request->ajax()) {
            return [
                'success' => fasle,
            ];
        }

        DB::beginTransaction();

        try {
            $survey = $this->surveyRepository->getSurveyFromTokenManage($token);

            if (Auth::user()->cannot('edit', $survey)) {
                throw new Exception("Not permitted edit!", 403);
            }

            $this->surveyRepository->updateSurvey(
                $survey, 
                $request->json(),
                config('settings.survey.status.draft'),
                $this->questionRepository,
                $this->answerRepository
            );

            DB::commit();
            
            $request->session()->flash('success', trans('lang.save_survey_draft_success'));

            return response()->json([
                'success' => true,
                'redirect' => route('surveys.edit', $survey->token_manage),
            ]);
        } catch (Exception $e) {
            DB::rollback();

            return response()->json([
                'success' => false,
                'message' => trans('lang.save_survey_draft_failed'),
                'redirect' => ($e->getCode() == 403) ? route('403') : '',
            ]);
        }
    }
}
