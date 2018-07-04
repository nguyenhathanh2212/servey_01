<?php

namespace App\Console\Commands;

use Mail;
use DateTime;
use Carbon\Carbon;
use App\Mail\ReminderEmail;
use Illuminate\Console\Command;
use App\Repositories\Invite\InviteInterface;
use App\Repositories\Survey\SurveyInterface;
use App\Repositories\Setting\SettingInterface;

class ResendReminderEmailCommand extends Command
{
    protected $surveyRepository;
    protected $inviteRepository;
    protected $settingRepository;

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'command:send-reminder-email';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send reminder email to invited user by week, month, quater or other setup time';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct(
        SurveyInterface $surveyRepository,
        InviteInterface $inviteRepository,
        SettingInterface $settingRepository
    ) {
        parent::__construct();
        $this->surveyRepository = $surveyRepository;
        $this->inviteRepository = $inviteRepository;
        $this->settingRepository = $settingRepository;
    }

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        $surveys = $this->surveyRepository->whereHas('settings', function ($query) {
            return $query->where('key', config('settings.setting_type.next_remind_time.key'))
                ->where('value', '!=', config('settings.survey_setting.reminder_email.none'));
        })
        ->with([
            'members',
            'invite',
            'settings' => function ($query) {
                return $query->whereIn('key', [
                        config('settings.setting_type.reminder_email.key'),
                        config('settings.setting_type.next_remind_time.key'),
                    ])
                    ->where('value', '!=', config('settings.survey_setting.reminder_email.none'));
            },
        ])
        ->where('status', config('settings.survey.status.open'))
        ->get();

        if ($surveys->isNotEmpty()) {
            foreach ($surveys as $survey) {
                $settings = $survey->settings;
                $first = $settings->first();
                $last = $settings->last();
                $reminderTime = $first->key == config('settings.setting_type.next_remind_time.key')
                    ? $first->value : $last->value;
                $reminderBy = $first->key == config('settings.setting_type.reminder_email.key')
                    ? $first->value : $last->value;
                $reminderTime = Carbon::parse($reminderTime);
                $now = Carbon::now();

                if (!empty($reminderTime) &&
                    $reminderTime > $now->subMinutes(1) &&
                    $reminderTime < $now->addMinutes(1)
                ) {
                    $this->queueMail($survey);

                    switch ($reminderBy) {
                        case config('settings.survey_setting.reminder_email.by_week'):
                            $reminderTime->addWeek();
                            break;
                        case config('settings.survey_setting.reminder_email.by_month'):
                            $reminderTime->addMonth();
                            break;
                        case config('settings.survey_setting.reminder_email.by_quarter'):
                            $reminderTime->addQuarter();
                            break;
                        default:
                            break;
                    }

                    $settingId = $first->key == config('settings.setting_type.next_remind_time.key') ? $first->id : $last->id;
                    $nextReminderTime = new Datetime($reminderTime->toDateTimeString());
                    $nextReminderTime = $nextReminderTime->format('Y-m-d H:i:s');
                    $this->settingRepository->update($settingId, ['value' => $nextReminderTime]);
                }
            }
        }
    }

    public function queueMail($survey)
    {
        $inviteEmails = $survey->invite->invite_mails_array;
        $answerEmails = $survey->invite->answer_mails_array;
        $inviteEmails = array_unique(array_merge($inviteEmails, $answerEmails));
        $numberEmails = count($inviteEmails);

        if (count($inviteEmails)) {
            $data = [
                'title' => $survey->invite->subject,
                'messages' => $survey->invite->message,
                'description' => $survey->description,
                'link' => route('survey.create.do-survey', $survey->token),
            ];

            foreach ($inviteEmails as $mail) {
                Mail::to($mail)->queue(new ReminderEmail($data));
            }
            $this->info("Send $numberEmails emails success!");
        }
    }
}
