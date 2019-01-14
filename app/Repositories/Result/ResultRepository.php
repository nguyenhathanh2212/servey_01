<?php

namespace App\Repositories\Result;

use App\Models\Result;
use App\Repositories\BaseRepository;
use App\Traits\ClientInformation;
use App\Traits\SurveyProcesser;
use Exception;
use DB;
use Auth;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;

class ResultRepository extends BaseRepository implements ResultInterface
{
    use ClientInformation, SurveyProcesser;

    public function getModel()
    {
        return Result::class;
    }

    public function storeResult($data, $survey)
    {
        $surveyToken = $data->get('survey_token');
        $survey = $survey->getSurveyFromToken($surveyToken);
        $survey = $survey->load('results', 'settings', 'invite');

        $clientInfo = $this->processAnswererInformation($data, $survey, $survey->getPrivacy());
        $tokenResult = md5(uniqid(rand(), true));
        $resultsData = [];
        $sections = $data->get('sections');

        foreach ($sections as $section) {
            $temp = [];

            foreach ($section['questions'] as $question) {
                $temp['question_id'] = $question['question_id'];

                foreach ($question['results'] as $result) {
                    $temp['answer_id'] = 0;
                    $temp['content'] = '';
                    $temp['token'] = $tokenResult;

                    if (in_array($question['type'], [
                        config('settings.question_type.short_answer'),
                        config('settings.question_type.long_answer'),
                        config('settings.question_type.date'),
                        config('settings.question_type.time'),
                    ])) {
                        $temp['content'] = $result['content'];
                    } elseif ($result['answer_id']) {
                        $temp['answer_id'] = $result['answer_id'];

                        if ($result['answer_type'] == config('settings.answer_type.other_option')) {
                            $temp['content'] = $result['content'];
                        }
                    }

                    array_push($resultsData, array_merge($temp, $clientInfo));
                }
            }
        }

        $inviter = $survey->invite;
        $sendUpdateMails = collect(!empty($inviter) ? $inviter->send_update_mails_array : []);
        $userMails = Auth::check() ? Auth::user()->email : '';

        // when update result with option update is "only send question update", if user answer many times then delete old results
        if ($survey->isSendUpdateOption() && $sendUpdateMails->contains($userMails)) {
            $timesAnswer = $survey->results->where('user_id', Auth::user()->id)
                ->pluck('token')
                ->unique()->count();

            if ($timesAnswer > 1) {
                $newestCreated = $survey->results->where('user_id', Auth::user()->id)
                    ->sortByDesc('created_at')
                    ->first()->token;

                $survey->results()->where('user_id', Auth::user()->id)
                    ->where('token', '!=', $newestCreated)->forceDelete();
            }
        }

        $survey->results()->createMany($resultsData);

        // update created_at of pairs result has updated
        if ($survey->isSendUpdateOption() && $sendUpdateMails->contains($userMails)) {
            $results = $survey->results()->where('user_id', $clientInfo['user_id'])
                ->orderBy('created_at', 'desc')->get();
            $token = $results->first()->token;
            $createdAt = $results->first()->created_at;
            $resultsId = $results->pluck('id');

            DB::table('results')->whereIn('id', $resultsId)->update([
                'token' => $token,
                'created_at' => $createdAt,
            ]);
        }
    }

    // === old ===
    public function create($answers)
    {
        $input = [];
        foreach ($answers as $answer) {
            $input[] = [
                'sender_id' => $senderId,
                'recever_id' => $receverId,
                'answer_id' => $answer->id,
            ];
        }

        $this->multiCreate($input);
    }

    public function getDetailResultSurvey($request, $survey, $userRepo)
    {
        $results = $survey->results();
        $results = $this->getResultsFollowOptionUpdate($survey, $results, $userRepo)->get();
        $results = $results->groupBy('token');

        $countResult = $results->count();
        $page = isset($request->page) ? $request->page : 1;
        $perPage = 1;

        $paginate = new LengthAwarePaginator(
            $results->forPage($page, $perPage),
            $results->count(),
            $perPage,
            $page,
            ['path' => route('survey.result.detail-result', $survey->token_manage)]
        );

        return [
            'results' => $paginate,
            'countResult' => $countResult,
        ];
    }

    public function closeFromSurvey($survey)
    {
        return $survey->results()->delete();
    }

    public function openFromSurvey($survey)
    {
        return $survey->results()->onlyTrashed()->restore();
    }

    public function deleteFromSurvey($survey)
    {
        return $survey->results()->withTrashed()->forceDelete();
    }
}
