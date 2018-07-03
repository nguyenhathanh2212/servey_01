<?php

namespace App\Repositories\Survey;

use DB;
use Exception;
use App\Repositories\Result\ResultInterface;
use App\Repositories\Question\QuestionInterface;
use App\Repositories\Like\LikeInterface;
use App\Repositories\Invite\InviteInterface;
use App\Repositories\Setting\SettingInterface;
use App\Repositories\User\UserInterface;
use App\Repositories\Section\SectionInterface;
use App\Repositories\BaseRepository;
use App\Models\Question;
use App\Models\Answer;
use App\Models\Result;
use Carbon\Carbon;
use App\Models\Survey;
use Auth;
use App\Traits\SurveyProcesser;
use App\Mail\ManageSurvey;
use App\Mail\InviteSurvey;
use Mail;

class SurveyRepository extends BaseRepository implements SurveyInterface
{
    use SurveyProcesser;

    public function getModel()
    {
        return Survey::class;
    }

    public function getResutlSurvey($survey, $userRepo)
    {
        foreach ($survey->sections as $section) {
            $temp = [];

            foreach ($section->questions as $question) {
                if (!in_array($question->type, [
                    config('settings.question_type.image'),
                    config('settings.question_type.video'),
                ])) {
                    $totalAnswerResults = config('settings.number_0');
                    $questionType = $question->type;
                    $resultQuestion = [];

                    if (in_array($question->type, [
                        config('settings.question_type.short_answer'),
                        config('settings.question_type.long_answer'),
                        config('settings.question_type.date'),
                        config('settings.question_type.time'),
                    ])) {
                        $resultQuestion = $this->getTextQuestionResult($question, $survey, $userRepo);
                    } else {
                        if ($question->answers->count()) {
                            $resultQuestion = $this->getResultChoiceQuestion($question, $survey, $userRepo, app(ResultInterface::class));
                        } else { // title
                            $resultQuestion['temp'] = $question->title;
                            $resultQuestion['total_answer_results'] = $totalAnswerResults;
                        }
                    }

                    $temp = $resultQuestion['temp'];
                    $totalAnswerResults = $resultQuestion['total_answer_results'];
                    $questionResult[] = [
                        'question' => $question,
                        'question_type' => $question->type,
                        'count_answer' => $totalAnswerResults,
                        'answers' => $temp,
                    ];
                    $temp = [];
                }
            }

            $resultsSurveys[] = [
                'section' => $section,
                'question_result' => $questionResult,
            ];
            $questionResult = [];
        }

        return $resultsSurveys;
    }

    public function createSurvey($userId, $data, $status, $userRepo)
    {
        $surveyInputs = [
            'title' => $data->get('title'),
            'description' => $data->get('description'),
            'start_time' => $data->get('start_time'),
            'end_time' => $data->get('end_time'),
        ];
        $data = $data->all();

        $surveyInputs['feature'] = config('settings.survey.feature.default');
        $surveyInputs['token'] = md5(uniqid(rand(), true));
        $surveyInputs['token_manage'] = md5(uniqid(rand(), true));
        $surveyInputs['status'] = $status;

        $survey = parent::create($surveyInputs);

        if (!$survey) {
            throw new Exception('Error Processing Request', 1);
        }

        //create owner
        $owner = $survey->members()->attach($userId, [
            'role' => Survey::OWNER,
            'status' => Survey::APPROVE,
        ]);

        // create members
        foreach ($data['members'] as $member) {
            $memberId = $userRepo->where('email', $member['email'])->first()->id;

            if ($member['role'] == Survey::OWNER) {
                throw new Exception("Role not permited!", 1);
            }

            $survey->members()->attach($memberId, [
                'role' => $member['role'],
                'status' => Survey::APPROVE,
            ]);
        }

        // create invite email
        $inviteData = $data['invited_email'];

        if (count($inviteData['emails'])) {
            $inviteMails = $this->formatInviteMailsString($inviteData['emails']);

            $survey->invite()->create([
                'invite_mails' => $inviteMails,
                'answer_mails' => '',
                'subject' => $inviteData['subject'],
                'message' => $inviteData['message'],
                'status' => config('settings.survey.invite_status.not_finish'),
                'number_invite' => count($inviteData['emails']),
                'number_answer' => config('settings.survey.number_answer_default'),
            ]);
        }

        // create settings of survey
        $settingsData = $this->createSettingDataArray($data['setting']);

        if (Auth::user()->checkLoginWsm()) {
            $settingMailToWsm = [
                'key' => config('settings.setting_type.send_mail_to_wsm.key'),
                'value' => $inviteData['send_mail_to_wsm'],
            ];
            array_push($settingsData, $settingMailToWsm);
        }

        $survey->settings()->createMany($settingsData);

        $orderSection = 0;

        // create sections
        foreach ($data['sections'] as $section) {
            $sectionData['title'] = $section['title'];
            $sectionData['description'] = $section['description'];
            $sectionData['order'] = ++ $orderSection;
            $sectionData['update'] = config('settings.survey.section_update.default');

            $sectionCreated = $survey->sections()->create($sectionData);

            $orderQuestion = 0;

            // create questions
            if (isset($section['questions'])) {
                foreach ($section['questions'] as $question) {
                    $questionData['title'] = $question['title'];
                    $questionData['description'] = $question['description'];
                    $questionData['required'] = $question['require'];
                    $questionData['order'] = ++ $orderQuestion;
                    $questionData['update'] = config('settings.survey.question_update.default');

                    $questionCreated = $sectionCreated->questions()->create($questionData);

                    // create type question in setting
                    $valueSetting = $question['type'] == config('settings.question_type.date') ? $question['date_format'] : '';
                    $questionCreated->settings()->create([
                        'key' => $question['type'],
                        'value' => $valueSetting,
                    ]);

                    // create image or video (media) of question
                    if ($question['media']) {
                        $questionMedia['user_id'] = $userId;
                        $questionMedia['url'] = $this->cutUrlImage($question['media']);
                        $questionMedia['type'] = config('settings.media_type.image');

                        if ($question['type'] == config('settings.question_type.video')) {
                            $questionMedia['type'] = config('settings.media_type.video');
                        }

                        $questionCreated->media()->create($questionMedia);
                    }

                    // create answers
                    if (isset($question['answers'])) {
                        foreach ($question['answers'] as $answer) {
                            $answerData['content'] = $answer['content'];
                            $answerData['update'] = config('settings.survey.answer_update.default');

                            $answerCreated = $questionCreated->answers()->create($answerData);

                            // create type answer in setting
                            $answerCreated->settings()->create([
                                'key' => $answer['type'],
                            ]);

                            // create image (media) of answer
                            if ($answer['media']) {
                                $answerMedia['user_id'] = $userId;
                                $answerMedia['url'] = $this->cutUrlImage($answer['media']);
                                $answerMedia['type'] = config('settings.media_type.image');

                                $answerCreated->media()->create($answerMedia);
                            }
                        }
                    }
                }
            }
        }

        // if survey is create then send mail after created
        if ($status == config('settings.survey.status.open')) {
            $this->sendMailCreateSurvey($survey, Auth::user(), $userRepo, [
                'message' => $data['invited_email']['message'],
                'subject' => $data['invited_email']['subject'],
                'members' => $data['members'],
                'invite_mails' => $inviteData['emails'],
                'setting_mail_to_wsm' => !empty($settingMailToWsm['value']) ? $settingMailToWsm['value'] : '',
            ]);
        }

        return $survey;
    }

    public function updateSettingSurvey($survey, $data, $userRepo)
    {
        $data = $data->all();

        // update members
        $membersData = [];
        $ownerId = $survey->members()->wherePivot('role', Survey::OWNER)->first()->id;

        // only owner can edit members 
        if (Auth::user()->id == $ownerId) {
            foreach ($data['members'] as $member) {
                $memberId = $userRepo->where('email', $member['email'])->first()->id;

                if ($memberId == $ownerId || $member['role'] == Survey::OWNER) {
                    throw new Exception("Can not edit member", 1);
                }

                $membersData[$memberId] = [
                    'role' => $member['role'],
                    'status' => Survey::APPROVE,
                ];
            }

            $survey->members()->wherePivot('role', '!=', Survey::OWNER)->sync($membersData);
        }

        // update invite mail
        $inviteData = $data['invited_email'];
        $inviter = $survey->invite;

        if (!empty($inviter) || !empty($inviteData['emails'])) {
            $answerMails = $answerOld = !empty($inviter) ? $inviter->answer_mails : '';
            
            $answerOld = collect(!empty($answerOld) ? explode('/', trim($answerOld, '/')) : []);
            $answerDelete = $answerOld->diff($inviteData['answer_emails'])->all();

            if (count($answerDelete)) {
                $userIds = $userRepo->whereIn('email', $answerDelete)->pluck('id')->all();
                $isDelete = $survey->results()->whereIn('user_id', $userIds)->forceDelete();

                if (!$isDelete) {
                    throw new Exception("Delete result answers of user failed !", 1);
                }

                $answerMails = $this->formatInviteMailsString($inviteData['answer_emails']);
            }

            $inviteMails = $this->formatInviteMailsString($inviteData['emails']);

            $updateInviteData = [
                'invite_mails' => $inviteMails,
                'answer_mails' => $answerMails,
                'subject' => $inviteData['subject'],
                'message' => $inviteData['message'],
                'status' => config('settings.survey.invite_status.not_finish'),
                'number_invite' => count($inviteData['emails']),
                'number_answer' => count($inviteData['answer_emails']),
            ];

            if (empty($inviter)) {
                $survey->invite()->create($updateInviteData);
            } else {
                if ($survey->isSendUpdateOption()) {
                    $sendUpdateMails = collect($inviter->send_update_mails_array);
                    $inviteMails = $inviteData['emails'];

                    $newSendUpdaateMails = $sendUpdateMails->reject(function ($mail) use ($inviteMails) {
                        return !in_array($mail, $inviteMails);
                    });

                    $sendUpdateMailsDeleted = $sendUpdateMails->diff($newSendUpdaateMails)->all();
                    $userIds = $userRepo->whereIn('email', $sendUpdateMailsDeleted)->pluck('id')->all();
                    $survey->results()->whereIn('user_id', $userIds)->forceDelete();

                    $updateInviteData['send_update_mails'] = join('/', $newSendUpdaateMails->all()) . '/';
                }

                $updateInviteData['number_invite'] = count($inviteData['emails']) + ($inviter->number_answer - count($answerDelete));
                $updateInviteData['number_answer'] = $inviter->number_answer - count($answerDelete);
                
                $survey->invite()->update($updateInviteData);
            }
        }

        // update settings of survey
        $survey->settings()->forceDelete();
        $settingsData = $this->createSettingDataArray($data['setting']);

        if (Auth::user()->checkLoginWsm()) {
            $settingMailToWsm = [
                'key' => config('settings.setting_type.send_mail_to_wsm.key'),
                'value' => $inviteData['send_mail_to_wsm'],
            ];
            array_push($settingsData, $settingMailToWsm);
        }

        $survey->settings()->createMany($settingsData);

        return true;
    }

    public function updateSurveyByObject($survey, $values)
    {
        return $survey->update($values);
    }

    public function updateSurvey($survey, $data, $status, $questionRepo, $answerRepo, $userRepo = null)
    {
        $surveyInputs = [
            'title' => $data->get('title'),
            'description' => $data->get('description'),
            'start_time' => $data->get('start_time'),
            'end_time' => $data->get('end_time'),
        ];
        
        $surveyInputs['status'] = $status;
        $deleteData = $data->get('delete');
        $updateData = $data->get('update');
        $createData = $data->get('create');
        $isDraftToOpen = false;
        $inviter = $survey->invite;
        $isDeleteClientResult = false;

        if (count($createData['sections']) || count($createData['questions']) 
            || count($createData['answers']) || count($deleteData['answers'])) {
            $isDeleteClientResult = true;
        }

        if ($survey->isDraft() && $status == config('settings.survey.status.open')) {
            $isDraftToOpen = true;
        }

        // if option update is "send all question survey again" OR havent invite_list, then set option update of elements to default (no-update)
        if (($status == config('settings.survey.status.open') 
            && $data->get('option') == config('settings.option_update.send_all_question_survey_again')) 
            ||  empty($inviter) || (empty($inviter->answer_mails) && empty($inviter->send_update_mails))) {
            $updateStatus = config('settings.survey.section_update.default');
        }

        // update base information of survey
        $survey->update($surveyInputs);
        
        // delete sections, questions, answers has deleted
        $answerRepo->deleteAnswersById($deleteData['answers']);
        $questionRepo->deleteQuestionsById($deleteData['questions']);
        DB::table('sections')->whereIn('id', $deleteData['sections'])->delete();

        // update sections
        foreach ($updateData['sections'] as $key => $value) {
            if (isset($updateStatus)) {
                $value['update'] = $updateStatus;
            }

            $survey->sections()->where('id', $key)->first()->update($value);
        }

        // update questions
        foreach ($updateData['questions'] as $key => $value) {
            if (!$isDeleteClientResult && !empty($value['update']) 
                && $value['update'] == config('settings.survey.question_update.updated')) {
                $isDeleteClientResult = true;
            }

            if (isset($updateStatus)) {
                $value['update'] = $updateStatus;
            }

            $question = $questionRepo->withTrashed()->where('id', $key)->first();
            $question->update($value);

            if ($question->type == config('settings.question_type.date')) {
                $question->settings()->first()->update([
                    'value' => $value['date_format'],
                ]);
            }

            // update question media if has
            $this->updateQuestionMedia($question, $value, Auth::user()->id);
        }

        // update answers
        foreach ($updateData['answers'] as $key => $value) {
            if (isset($updateStatus)) {
                $value['update'] = $updateStatus;
            }

            $answer = $answerRepo->withTrashed()->where('id', $key)->first();
            $answer->update($value);

            // update answer media if has
            $this->updateAnswerMedia($answer, $value, Auth::user()->id);
        }

        // create new sections, questions, answers when update
        $this->createNewSections($survey, $createData['sections'], Auth::user()->id);

        // create new questions in old sections when update
        $this->createNewQuestions('', $survey, $createData['questions'], Auth::user()->id);

        // create new answers in old questions when update
        $this->createNewAnswers('', $questionRepo, $createData['answers'], Auth::user()->id);

        // if current survey is draft and saved to open
        if ($isDraftToOpen) {
            $inviteMails = [];
            $message = '';
            $subject = '';

            if (!empty($inviter)) {
                $message = $inviter->message;
                $subject = $inviter->subject;
                $inviteMails = $inviter->invite_mails_array;
            }

            $members = $survey->members()->wherePivot('role', '!=', Survey::OWNER)->get();
            $settingMailToWsm = $survey->settings()->where('key', config('settings.setting_type.send_mail_to_wsm.key'))->first();
            $settingMailToWsm = !empty($settingMailToWsm) ? $settingMailToWsm->value : '';

            $this->sendMailCreateSurvey($survey, Auth::user(), $userRepo, [
                'message' => $message,
                'subject' => $subject,
                'members' => $members,
                'invite_mails' => $inviteMails,
                'setting_mail_to_wsm' => $settingMailToWsm,
            ]);

            return;
        }

        // process follow option update
        if ($status == config('settings.survey.status.open')) {
            $optionUpdate = $data->get('option');
            $sectionsId = $survey->sections->pluck('id')->all();
            $updatedQuestionIds = $questionRepo->withTrashed()->whereIn('section_id', $sectionsId)
                ->where('update', config('settings.survey.question_update.updated'))
                ->pluck('id')->all();

            // if option update is "send all question of survey again" then delete all old results
            if ($optionUpdate == config('settings.option_update.send_all_question_survey_again')) {
                $survey->results()->forceDelete();
            } elseif (count($updatedQuestionIds) || $isDeleteClientResult) {
                // if option update is "dont send survey again" OR is "send question has updated" then delete all result of these questions has updated and these resluts incognito
                DB::table('results')->whereIn('question_id', $updatedQuestionIds)->delete();
                DB::table('results')->where('survey_id', $survey->id)
                    ->whereNull('user_id')
                    ->whereNotNull('client_ip')
                    ->delete();
            } elseif (empty($createData['sections']) && empty($createData['questions']) && empty($createData['answers'])) {
                return;
            }

            $this->sendMailUpdateSurvey($optionUpdate, $survey, Auth::user(), $userRepo);
        }
    }

    public function checkCloseSurvey($inviteIds, $surveyIds)
    {
        $ids = array_merge(
            $inviteIds->lists('survey_id')->toArray(),
            $surveyIds->lists('id')->toArray()
        );

        return app(SettingInterface::class)
            ->whereIn('survey_id', $ids)
            ->where([
                'key' => config('settings.key.limitAnswer'),
                'value' => 0,
            ])
            ->lists('survey_id')
            ->toArray();
    }

    public function listsSurvey($userId, $email = null)
    {
        $invites = $inviteIds = app(InviteInterface::class)
            ->where('recevier_id', $userId)
            ->orWhere('mail', $email);
        $surveys = $surveyIds = $this->where('user_id', $userId)->orWhere('mail', $email);
        $settings = $this->checkCloseSurvey($inviteIds, $surveyIds);
        $invites = $invites
            ->orderBy('id', 'desc')
            ->paginate(config('settings.paginate'));
        $surveys = $surveys
            ->orderBy('id', 'desc')
            ->paginate(config('settings.paginate'));

        return compact('surveys', 'surveys', 'settings');
    }

    public function checkSurveyCanAnswer(array $inputs)
    {
        $date = ($inputs['deadline']) ? Carbon::parse($inputs['deadline'])->gt(Carbon::now()) : true;
        $invite = true;
        $email = $inputs['email'];
        $surveyId = $inputs['surveyId'];

        if (!$date || !$inputs['status']) {
            return false;
        } elseif (!$inputs['type']) {
            $invite = app(InviteInterface::class)
                ->where('recevier_id', $inputs['userId'])
                ->where('survey_id', $inputs['surveyId'])
                ->orWhere(function ($query) use ($email, $surveyId) {
                    $query->where('mail', $email)->where('survey_id', $surveyId);
                })
                ->exists();
        }

        return $invite;
    }

    public function getSettings($surveyId)
    {
        if (!$surveyId) {
            return [];
        }

        return app(SettingInterface::class)
            ->where('survey_id', $surveyId)
            ->lists('value', 'key')
            ->toArray();
    }

    public function getHistory($userId, $clientIp, $surveyId, array $options)
    {
        if (!$surveyId) {
            return [
                'history' => [],
                'results' => [],
            ];
        }


        if ($userId) {
            if ($options['type'] == 'history') {
                $results = app(QuestionInterface::class)
                    ->getResultByQuestionIds($surveyId)
                    ->where('sender_id', $userId)
                    ->get();
            } else {
                $email = $options['email'];
                $name = $options['name'];
                $results = app(QuestionInterface::class)
                    ->getResultByQuestionIds($surveyId)
                    ->where(
                        function ($query) use ($userId, $clientIp, $email) {
                            $query->where('sender_id', $userId)
                                ->orWhere(
                                    function ($query) use ($clientIp, $email) {
                                        $query->where('email', $email)
                                            ->where('client_ip', $clientIp);
                                    }
                                );
                        }
                    )
                    ->get()
                    ->toArray();

                if (empty($email) && $name) {
                    $results = app(QuestionInterface::class)
                        ->getResultByQuestionIds($surveyId)
                        ->where(
                            function ($query) use ($userId, $clientIp, $name) {
                                $query->where('sender_id', $userId)
                                    ->orWhere(
                                        function ($query) use ($clientIp, $name) {
                                            $query->where('name', $name)
                                                ->where('client_ip', $clientIp);
                                        }
                                    );
                            }
                        )
                        ->get()
                        ->toArray();
                }

                $collection = collect($results);

                return $collection->groupBy('created_at')->toArray();
            }
        } else {
            if ($options['type'] == 'history') {
                $results = app(QuestionInterface::class)
                    ->getResultByQuestionIds($surveyId)
                    ->where('sender_id', null)
                    ->where('client_ip', $clientIp)
                    ->get();
            }
        }

        if (!$results) {
            return [];
        }

        $history = [];
        $maxCreate = $results->max('created_at');

        foreach ($results as $key => $value) {
            if ($options['type'] == 'history' && $value->created_at == $maxCreate) {
                $history[$value->answer_id] = $value->content;
            }
        }

        return [
            'history' => $history,
            'results' => $results,
        ];
    }

    public function getUserAnswer($token)
    {
        $survey = $this->where('token', $token)->orWhere('token_manage', $token)->first();

        if (!$survey) {
            return false;
        }

        $results = app(QuestionInterface::class)
            ->getResultByQuestionIds($survey->id)
            ->with('sender');
        $results = $results->distinct('created_at')->get([
            'created_at',
            'name',
            'email',
            'sender_id',
            'client_ip',
        ])
        ->toArray();

        if (!$results) {
            return [];
        }
        /*
            Get all user answer survey and group by user id.
            Sender_id can be null.
        */
        $collection = collect($results)->groupBy('sender_id')->toArray();
        //  Get users login when anwser survey with key = user id.
        $userLogin = collect($collection)->except([''])->toArray();
        /*
            Get users not login when answer survey and group by email.
            Email can be set default because user don't need enter email.
        */
        $settings = $this->getSettings($survey->id);

        $userNotLogin = in_array('', array_keys($collection))
                ? collect(collect($collection['']))->groupBy('client_ip')->toArray()
                : [];

        return array_merge($userLogin, $userNotLogin);
    }

    private function chart(array $inputs)
    {
        $results = [];

        foreach ($inputs as $key => $value) {
            $results[] = [
                'answer' => $value['content'],
                'percent' => $value['percent'],
            ];
        }

        return $results;
    }

    public function viewChart($token)
    {
        $results = $this->getResutlSurvey($token);
        $charts = [];

        if (!$results) {
            return [
                'charts' => null,
                'status' => false,
            ];
        }

        foreach ($results as $key => $value) {
            $charts[] = [
                'question' => $value['question'],
                'chart' => ($this->chart($value['answers'])) ?: null,
            ];
        }

        return [
            'charts' => $charts,
            'status' => true,
        ];
    }

    /* new */
    public function getResultExport($survey)
    {
        $requiredSurvey = $survey->required;
        $questions = app(QuestionInterface::class)->withTrashed()
            ->whereIn('section_id', $survey->sections->pluck('id')->all())
            ->with('settings', 'section')->get()->sortBy('order')->sortBy('section_order');
        $results = $this->getResultsFollowOptionUpdate($survey, $survey->results(), app(UserInterface::class));
        $results = $results->with('question.section', 'answer.settings', 'user')->get()->groupBy('token');

        return [
            'questions' => $questions,
            'results' => $results,
            'requiredSurvey' => $requiredSurvey,
        ];
    }

    public function duplicateSurvey($survey)
    {
        $survey->load('questions', 'settings');
        $newSurvey = $survey->replicate();

        $token = md5(uniqid(rand(), true));
        $tokenManage = md5(uniqid(rand(), true));

        $newSurvey->token = $token;
        $newSurvey->token_manage = $tokenManage;

        $newSurvey->deadline = null;
        $newSurvey->status = config('survey.status.block');

        $newSurvey->push();

        foreach ($survey->getRelations() as $relation => $items) {
            foreach ($items as $item) {
                $newItemRelation = $newSurvey->{$relation}()->create($item->toArray());

                if ($newItemRelation instanceof Question) {
                    $item->duplicate($newItemRelation);
                }
            }
        }

        return $newSurvey;
    }

    public function checkExist($token)
    {
        return $this->model->where('token', $token)->exists();
    }

    public function getSurveyByTokenManage($token)
    {
        $survey = $this->model->withTrashed()->with([
            'settings',
            'invite',
            'members',
            'sections' => function ($query) {
                $query->with([
                    'questions' => function ($query) {
                        $query->with([
                            'answers' => function ($query) {
                                $query->with('media', 'settings');
                            }, 
                            'settings', 
                            'media',
                        ]);
                    },
                ]);
            },
        ])->where('token_manage', $token)->first();

        if (!$survey) {
            throw new Exception("Error Processing Request", 1);
        }

        return $survey;
    }

    public function getSurveysByStatus($status)
    {
        return $this->model->where('status', $status);
    }

    public function getAuthSurveys($flag, $data = [])
    {
        $userId = Auth::user()->id;

        $survey = $this->model->withTrashed();

        //check flag
        if ($flag == config('settings.survey.members.owner') ||
            $flag == config('settings.survey.members.editor')) {
            $survey = $survey->whereHas('members', function ($query) use ($flag, $userId) {
                $query->where('role', $flag)
                    ->where('user_id', $userId);
            });
        }

        if ($flag == config('settings.survey.invited')) {
            $survey = $survey->whereHas('invite', function ($query) {
                $query->where('invite_mails', 'LIKE', '%/' . Auth::user()->email . '%')
                    ->orWhere('invite_mails', 'LIKE', Auth::user()->email . '%')
                    ->orWhere('answer_mails', 'LIKE', '%/' . Auth::user()->email . '%')
                    ->orWhere('answer_mails', 'LIKE', Auth::user()->email . '%');
            });
        }

        //check paramater
        if (isset($data['name']) && $data['name']) {
            $survey = $survey->where('title', 'like', '%' . $data['name'] . '%');
        }

        if (isset($data['privacy']) && $data['privacy']) {
            $privacy = $data['privacy'];
            $survey = $survey->whereHas('settings', function ($query) use ($privacy) {
                $query->where('key', config('settings.setting_type.privacy.key'))
                    ->where('value', $privacy);
            });
        }


        if (isset($data['status']) && $data['status']) {
            $survey = $survey->where('status', $data['status']);
        }

        return $survey->with(['settings' => function ($query) {
                $query->where('key', config('settings.setting_type.privacy.key'));
            }])->orderBy('created_at', 'desc')->paginate(config('settings.survey.paginate'));
    }

    //get survey by token
    public function getSurvey($token)
    {
        $survey = $this->model->withTrashed()->where('token', $token)->first();
        $inviter = $survey->invite;
        $sendUpdateMails = collect(!empty($inviter) ? $inviter->send_update_mails_array : []);
        $userMails = Auth::check() ? Auth::user()->email : '';

        if ($survey->isSendUpdateOption() && $sendUpdateMails->contains($userMails)) {
            $survey =  $survey->load([
                'settings',
                'sections' => function ($query) {
                    $query->where('update', config('settings.survey.section_update.updated'))->with([
                        'questions' => function ($query) {
                            $query->where('update', config('settings.survey.question_update.updated'))->with([
                                'settings', 
                                'media', 
                                'answers' => function ($queryAnswer) {
                                    $queryAnswer->with('settings', 'media');
                                }
                            ]);
                        }
                    ]);
                },
            ]);
        } else {
            $survey =  $survey->load([
                'settings',
                'sections.questions' => function ($query) {
                    $query->with(['settings', 'media', 'answers' => function ($queryAnswer) {
                        $queryAnswer->with('settings', 'media');
                    }]);
                }
            ]);
        }

        if (!$survey) {
            throw new Exception("Error Processing Request", 1);
        }

        return $survey;
    }

    //get survey by token
    public function getSurveyFromTokenManage($token_manage)
    {
        $survey = $this->model->withTrashed()->where('token_manage', $token_manage)->first();

        if (!$survey) {
            throw new Exception("Error Processing Request", 1);
        }

        return $survey;
    }

    //get survey by token
    public function getSurveyFromToken($token)
    {
        $survey = $this->model->withTrashed()->where('token', $token)->first();

        if (!$survey) {
            throw new Exception("Error Processing Request", 1);
        }

        return $survey;
    }

    //get section current
    public function getSectionCurrent($survey, $sectionId)
    {
        return $survey->sections->where('id', $sectionId)->first();
    }

    public function deleteSurvey($survey)
    {
        $survey->members()->detach();
        $survey->settings()->withTrashed()->forceDelete();
        $survey->invite()->withTrashed()->forceDelete();

        return $survey->forceDelete();
    }

    public function countSurveyDraftOfUser($userId)
    {
        return $this->model->where('status', config('settings.survey.status.draft'))
            ->whereHas('members', function ($query) use ($userId) {
                $query->where('user_id', $userId)->where('role', Survey::OWNER);
            })->count();
    }
    
    public function closeSurvey($survey)
    {
        $survey->settings()->delete();
        $survey->invite()->delete();

        return $survey->delete();
    }

    public function openSurvey($survey)
    {
        $survey->settings()->onlyTrashed()->restore();
        $survey->invite()->onlyTrashed()->restore();

        return $survey->restore();
    }

    public function getOverviewSurvey($survey)
    {
        $results = $survey->results();
        $results = $this->getResultsFollowOptionUpdate($survey, $results, app(UserInterface::class))->get();
        $results = $results->groupBy(
            function($date) {
                return Carbon::parse($date->created_at)->format('m-d-Y');
            }
        );

        $data = [];

        foreach ($results as $date => $result) {
            $group = $result->groupBy('token');
            $item = collect();
            $item->date = $date;
            $item->number = $group->count();
            array_push($data, $item);
        }

        return collect($data);
    }

    public function getSurveyForResult($tokenManage)
    {
        $result = $this->model->withTrashed()->with([
            'sections.questions' => function ($queryQuestion) {
                $queryQuestion->with([
                    'settings',
                    'media',
                    'answers' => function ($queryAnswer) {
                        $queryAnswer->with([
                            'settings',
                            'media',
                        ]);
                    },
                ]);
            },
            'results',
        ])->where('token_manage', $tokenManage)->first();

        if (empty($result)) {
            throw new Exception("Survey not found", 1);
        }

        return $result;
    }

    public function getSurveyForClone($tokenManage)
    {
        $survey = $this->model->withTrashed()->with([
            'settings',
            'invite',
            'members',
            'sections' => function ($query) {
                $query->with([
                    'questions' => function ($queryQuestion) {
                        $queryQuestion->with([
                            'settings',
                            'media',
                            'answers' => function ($queryAnswer) {
                                $queryAnswer->with([
                                    'media',
                                    'settings',
                                ]);
                            },
                        ]);
                    },
                ]);
            },
        ])->where('token_manage', $tokenManage)->first();

        if (!$survey) {
            throw new Exception("Error Processing Request", 1);
        }

        return $survey;
    }

    public function cloneSurvey($survey)
    {
        // clone survey
        $newSurvey = $survey->replicate();
        $newSurvey->token = md5(uniqid(rand(), true));
        $newSurvey->token_manage = md5(uniqid(rand(), true));
        $newSurvey->status = config('settings.survey.status.close');
        $newSurvey = $this->model->create($newSurvey->toArray());

        // clone members
        $newSurvey->members()->attach(Auth::user()->id, [
            'role' => Survey::OWNER,
            'status' => Survey::APPROVE,
        ]);

        // clone settings
        $dataSettings = $survey->settings->toArray();
        $newSurvey->settings()->createMany($dataSettings);

        return $newSurvey;
    }
}
