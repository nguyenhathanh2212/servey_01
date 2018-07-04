<?php

namespace App\Traits;

use Session;
use App\Models\Question;
use App\Models\Answer;
use App\Models\Survey;
use App\Mail\ManageSurvey;
use App\Mail\InviteSurvey;
use Mail;
use Carbon\Carbon;

trait SurveyProcesser
{
    public function formatInviteMailsString($data)
    {
        $invite_mails = '';

        foreach ($data as $mail) {
            $invite_mails .= $mail . '/';
        }

        return $invite_mails;
    }

    public function getKeySetting($content)
    {
        $content = trim($content);

        switch ($content) {
            case config('settings.setting_type.answer_required.content'):
                return config('settings.setting_type.answer_required.key');
            case config('settings.setting_type.answer_limited.content'):
                return config('settings.setting_type.answer_limited.key');
            case config('settings.setting_type.reminder_email.content'):
                return config('settings.setting_type.reminder_email.key');
            case config('settings.setting_type.privacy.content'):
                return config('settings.setting_type.privacy.key');
            case config('settings.setting_type.question_type.content'):
                return config('settings.setting_type.question_type.key');
            case config('settings.setting_type.answer_type.content'):
                return config('settings.setting_type.answer_type.key');
            default:
                throw new Exception("Error Processing Request", 1);
        }
    }

    public function createSettingDataArray($data)
    {
        $resultData = [];

        foreach ($data as $keyContent => $value) {
            $temp = [
                'key' => $this->getKeySetting($keyContent),
                'value' => $value,
            ];

            if ($keyContent == config('settings.setting_type.reminder_email.content')) {
                $temp['value'] = $value['type'];

                if (!empty($value['next_time'])) {
                    $nextRemindTime = [
                        'key' => config('settings.setting_type.next_remind_time.key'),
                        'value' => !empty($value['next_time']) ? Carbon::parse($value['next_time'])->format('Y-m-d H:i:s') : null,
                    ];

                    array_push($resultData, $nextRemindTime);
                }
            }

            array_push($resultData, $temp);
        }

        return $resultData;
    }

    public function cutUrlImage($url)
    {
        $url = trim($url);
        $webUrl = url('/');

        if (strpos($url, $webUrl) === 0) {
            $url = substr($url, strlen($webUrl));
        }

        return $url;
    }

    public function reloadPage($key, $numOfSection, $section_order)
    {
        if (isset($_SERVER['HTTP_CACHE_CONTROL']) && $_SERVER['HTTP_CACHE_CONTROL'] === config('settings.detect_page_refresh')) {
            Session::put($key, $section_order);
        } elseif (!Session::has($key) ||
            Session::get($key) > $numOfSection ||
            Session::get($key) < $section_order) {
                Session::put($key, $section_order);
        }
    }

    public function getUserFromInvite($invite)
    {
        return [
            'inviteMails' => array_pop(explode('/', $invite->invite_mails)),
            'answerMails' => array_pop(explode('/', $invite->answer_mails)),
        ];
    }

    // if option update is "only send updated question survey" or dont have option then get results except results of users in send_update_mails
    public function getResultsFollowOptionUpdate($survey, $results, $userRepo)
    {
        if ($survey->isSendUpdateOption()) {
            $inviter = $survey->invite;
            $sendUpdateMails = !empty($inviter) ? $inviter->send_update_mails_array : [];
            $usersSendUpdateId = $userRepo->whereIn('email', $sendUpdateMails)->pluck('id')->all();

            $results = $results->whereNotIn('user_id', $usersSendUpdateId);
        }

        return $results;
    }

    // get result text question
    public function getTextQuestionResult($question, $survey, $userRepo)
    {
        $temp = [];
        $answerResults = $question->answerResults()->where('content', '<>', config('settings.group_content_result'));
        $answerResults = $this->getResultsFollowOptionUpdate($survey, $answerResults, $userRepo)->get();
        $totalAnswerResults = $answerResults->count();

        if ($totalAnswerResults) {
            $answerResults = $answerResults->groupBy('upper_content');

            foreach ($answerResults as $answerResult) {
                $count = $answerResult->count();

                $temp[] = [
                    'content' => $answerResult->first()->content,
                    'percent' => round(($totalAnswerResults) ?
                        (double)($count * config('settings.number_100')) / ($totalAnswerResults) :
                        config('settings.number_0'), config('settings.roundPercent')),
                ];
            }
        }

        return [
            'temp' => $temp,
            'total_answer_results' => $totalAnswerResults,
        ];
    }

    // get result choice quesion
    public function getResultChoiceQuestion($question, $survey, $userRepo, $resultRepo)
    {
        $temp = [];
        $answers = $question->answers();
        $results = $resultRepo->withTrashed()->whereIn('answer_id', $answers->pluck('id')->all());
        $results = $this->getResultsFollowOptionUpdate($survey, $results, $userRepo)->get();
        $totalAnswerResults = $results->count();

        foreach ($question->answers as $answer) {
            if ($totalAnswerResults) {
                // get choice answer other
                if ($answer->type == config('settings.answer_type.other_option')) {
                    $answerOthers = $results->where('answer_id', $answer->id)->groupBy('content');

                    foreach ($answerOthers as $answerOther) {
                        $count = $answerOther->count();

                        $temp[] = [
                            'answer_id' => $answerOther->first()->answer_id,
                            'answer_type' => config('settings.answer_type.other_option'),
                            'content' => $answerOther->first()->content ? $answerOther->first()->content : trans('result.other'),
                            'percent' => round(($totalAnswerResults) ?
                                (double)($count * config('settings.number_100')) / ($totalAnswerResults) :
                                config('settings.number_0'), config('settings.roundPercent')),
                        ];
                    }
                } else {
                    $answerResults = $results->where('answer_id', $answer->id)->count();

                    $temp[] = [
                        'answer_id' => $answer->id,
                        'answer_type' => config('settings.answer_type.option'),
                        'content' => $answer->content,
                        'percent' => round(($totalAnswerResults) ?
                            (double)($answerResults * config('settings.number_100')) / ($totalAnswerResults) :
                            config('settings.number_0'), config('settings.roundPercent')),
                    ];
                }
            }
        }

        return [
            'temp' => $temp,
            'total_answer_results' => $totalAnswerResults,
        ];
    }

    // create new sections
    public function createNewSections($survey, $sectionsData, $userId)
    {
        // create new sections
        foreach ($sectionsData as $section) {
            $sectionData['title'] = $section['title'];
            $sectionData['description'] = $section['description'];
            $sectionData['order'] = $section['order'];
            $sectionData['update'] = config('settings.survey.section_update.updated');

            $sectionCreated = $survey->sections()->create($sectionData);

            // create questions
            if (isset($section['questions'])) {
                $this->createNewQuestions($sectionCreated, '', $section['questions'], $userId);
            }
        }
    }

    // create new questions in new created section or in old sections
    public function createNewQuestions($sectionCreated, $survey, $questionsData, $userId)
    {
        $orderQuestion = 0;

        // create new questions in old sections
        foreach ($questionsData as $question) {
            $questionData['title'] = $question['title'];
            $questionData['description'] = $question['description'];
            $questionData['required'] = $question['require'];
            $questionData['order'] = !empty($question['order']) ? $question['order'] : ++ $orderQuestion;
            $questionData['update'] = config('settings.survey.question_update.updated');

            if (empty($sectionCreated) && !empty($survey)) {
                $sectionCreated = $survey->sections()->where('id', $question['section_id'])->first();
            }

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

            if (isset($question['answers'])) {
                $this->createNewAnswers($questionCreated, '', $question['answers'], $userId);
            }
        }
    }

    // create new answers in new created questions or old questions
    public function createNewAnswers($questionCreated, $questionRepo, $answersData, $userId)
    {
        // create new answers in old questions
        foreach ($answersData as $answer) {
            $answerData['content'] = $answer['content'];
            $answerData['update'] = config('settings.survey.answer_update.updated');

            if (empty($questionCreated) && !empty($questionRepo)) {
                $questionCreated = $questionRepo->withTrashed()->where('id', $answer['question_id'])->first();
            }

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

    public function updateQuestionMedia($question, $data, $userId)
    {
        $questionMedia['url'] = $this->cutUrlImage($data['media']);
        
        if (!empty($questionMedia['url'])) {
            if ($question->media()->count()) {
                // if question has media and media no change
                if ($questionMedia['url'] == $question->media()->first()->url) {
                    return;
                }

                $question->media()->forceDelete();
            }

            $questionMedia['type'] = config('settings.media_type.image');
            $questionMedia['user_id'] = $userId;

            if ($question->type == config('settings.question_type.video')) {
                $questionMedia['type'] = config('settings.media_type.video');
            }

            $question->media()->create($questionMedia);

            return;
        }

        // if delete media
        if ($question->media()->count()) {
            $question->media()->forceDelete();
        }
    }

    public function updateAnswerMedia($answer, $data, $userId)
    {
        $answerMedia['url'] = $this->cutUrlImage($data['media']);
        
        if (!empty($answerMedia['url'])) {
            if ($answer->media()->count()) {
                // if answer has media and media no change
                if ($answerMedia['url'] == $answer->media()->first()->url) {
                    return;
                }

                $answer->media()->forceDelete();
            }

            $answerMedia['user_id'] = $userId;
            $answerMedia['type'] = config('settings.media_type.image');
            $answer->media()->create($answerMedia);

            return;
        }

        // if delete media
        if ($answer->media()->count()) {
            $answer->media()->forceDelete();
        }
    }

    public function sendMailCreateSurvey($survey, $owner, $userRepo, $data)
    {
        // send mail manage to owner
        $emailData = [
            'name' => $owner->name,
            'title' => $data['subject'],
            'messages' => $data['message'],
            'description' => $survey->description,
            'linkManage' => route('survey.management', $survey->token_manage),
            'link' => route('survey.create.do-survey', $survey->token),
        ];

        Mail::to($owner->email)->queue((new ManageSurvey($emailData))->onConnection('database'));

        // send mail manage to members
        foreach ($data['members'] as $member) {
            $emailData['name'] = $userRepo->where('email', $member['email'])->first()->name;
            Mail::to($member['email'])->queue((new ManageSurvey($emailData))->onConnection('database'));
        }

        // send mail invite
        if (count($data['invite_mails'])) {
            foreach ($data['invite_mails'] as $inviteMail) {
                Mail::to($inviteMail)->queue((new InviteSurvey($emailData))->onConnection('database'));
            }
        }

        // send mail invite to all staff, just be available with accounts login with wsm
        if ($owner->checkLoginWsm() && $data['setting_mail_to_wsm'] == config('settings.survey.send_mail_to_wsm.all')) {
            Mail::to(config('mail.framgia_mail_staff'))->queue((new InviteSurvey($emailData))->onConnection('database'));
        }
    }

    public function sendMailUpdateSurvey($optionUpdate, $survey, $owner, $userRepo)
    {
        $inviter = $survey->invite;
        $message = '';
        $subject = '';
        
        // refresh invite_mails and answer_mail
        if (!empty($inviter)) {
            $message = $inviter->message;
            $subject = $inviter->subject;
            $inviteMails = $inviter->invite_mails_array;
            $answerMails = $inviter->answer_mails_array;
            $inviteMails = array_unique(array_merge($inviteMails, $answerMails));

            $updateData = [
                'invite_mails' => $this->formatInviteMailsString($inviteMails),
                'answer_mails' => '',
                'status' => config('settings.survey.invite_status.not_finish'),
                'number_invite' => count($inviteMails),
                'number_answer' => config('settings.survey.number_answer_default'),
                'send_update_mails' => '',
            ];

            // if option is only send updated question then update send_update_mails column
            if (in_array($optionUpdate, [
                    config('settings.option_update.only_send_updated_question_survey'),
                    config('settings.option_update.dont_send_survey_again'),
                ])) {
                $updateData['send_update_mails'] = $inviter->send_update_mails . $this->formatInviteMailsString($answerMails);
            }

            $survey->invite()->update($updateData);  
        }

        // update or create option update survey
        $optionUpdateSetting = $survey->settings()->where('key', config('settings.setting_type.option_update_survey.key'))->first();
        
        if (empty($optionUpdateSetting)) {
            $survey->settings()->create([
                'key' => config('settings.setting_type.option_update_survey.key'),
                'value' => $optionUpdate,
            ]);
        } else {
            $optionUpdateSetting->update(['value' => $optionUpdate]);
        }

        // if option is dont send survey
        if ($optionUpdate == config('settings.option_update.dont_send_survey_again')) {
            return;
        }

        $members = $survey->members()->wherePivot('role', '!=', Survey::OWNER)->get();
        $settingMailToWsm = $survey->settings()->where('key', config('settings.setting_type.send_mail_to_wsm.key'))->first();
        $settingMailToWsm = !empty($settingMailToWsm) ? $settingMailToWsm->value : '';

        $this->sendMailCreateSurvey($survey, $owner, $userRepo, [
            'message' => $message,
            'subject' => $subject,
            'members' => $members,
            'invite_mails' => !empty($inviteMails) ? $inviteMails : [],
            'setting_mail_to_wsm' => $settingMailToWsm,
        ]);
    }
}
