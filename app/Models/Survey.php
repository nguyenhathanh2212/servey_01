<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Survey extends Model
{
    use SoftDeletes;

    const OWNER = 0;
    const APPROVE = 1;

    protected $fillable = [
        'title',
        'description',
        'token',
        'status',
        'end_time',
        'start_time',
        'update',
        'feature',
        'token_manage',
    ];

    protected $appends = [
        'status_custom',
        'trim_title',
        'remaining_time',
    ];

    protected $dates = ['deleted_at'];

    public function invite()
    {
        return $this->hasOne(Invite::class)->withTrashed();
    }

    public function withTrashedInvite()
    {
        return $this->hasOne(Invite::class)->withTrashed();
    }

    public function members()
    {
        return $this->belongsToMany(User::class, 'members', 'survey_id', 'user_id')
            ->withPivot('role', 'status')
            ->withTimestamps();
    }

    public function settings()
    {
        return $this->morphMany(Setting::class, 'settingable')->withTrashed();
    }

    public function withTrashedSettings()
    {
        return $this->morphMany(Setting::class, 'settingable')->withTrashed();
    }

    public function sections()
    {
        return $this->hasMany(Section::class)->withTrashed()->orderBy('order');
    }

    public function withTrashedSections()
    {
        return $this->hasMany(Section::class)->withTrashed()->orderBy('order');
    }

    public function results()
    {
        return $this->hasMany(Result::class)->withTrashed();
    }

    public function withTrashedResults()
    {
        return $this->hasMany(Result::class)->withTrashed();
    }

    public function setStartTimeAttribute($value)
    {
        $this->attributes['start_time'] = !empty($value) ? Carbon::parse($value)->format('Y-m-d H:i:s') : null;
    }

    public function setEndTimeAttribute($value)
    {
        $this->attributes['end_time'] = !empty($value) ? Carbon::parse($value)->format('Y-m-d H:i:s') : null;
    }

    public function getEndTimeAttribute()
    {
        return (!empty($this->attributes['end_time']))
            ? Carbon::parse($this->attributes['end_time'])->format('Y/m/d H:i:s')
            : null;
    }

    public function getRemainingTimeAttribute()
    {
        if (!empty($this->attributes['end_time'])) {
            $now = new Carbon();

            if ($now > $this->attributes['end_time']) {
                return '';
            }
            
            $time = Carbon::parse($this->attributes['end_time'])->diffInDays(Carbon::parse($now));

            if (!$time) {
                $time = Carbon::parse($this->attributes['end_time'])->diffInHours(Carbon::parse($now))
                ? Carbon::parse($this->attributes['end_time'])->diffInHours(Carbon::parse($now)) . trans('survey.remaining_hour')
                : Carbon::parse($this->attributes['end_time'])->diffInMinutes(Carbon::parse($now)) . trans('survey.remaining_minute');
            } else {
                $time .= trans('survey.remaining_date');
            }

            return $time;
        }

        return '';
    }

    public function getTrimTitleAttribute()
    {
        return !empty($this->attributes['title']) ? 
            ucwords(str_limit($this->attributes['title'], config('settings.title_length_default'))) 
            : trans('survey.no_title');
    }

    public function getTitleAttribute()
    {
        return ucwords($this->attributes['title'], config('settings.title_length_default'));
    }

    public function getLimitTitleAttribute()
    {
        return ucfirst(str_limit($this->attributes['title'], config('settings.title_length_default')));
    }

    // public function getIsExpiredAttribute()
    // {
    //     return empty($this->attributes['deadline']) ? false : $this->attributes['deadline'] <= Carbon::now()->toDateTimeString();
    // }

    public function getStatusCustomAttribute()
    {
        switch ($this->attributes['status']) {
            case config('settings.survey.status.open'):
                return trans('profile.open');

            case config('settings.survey.status.close'):
                return trans('profile.closed');

            case config('settings.survey.status.draft'):
                return trans('profile.draft');

            default:
                return '';
        }
    }

    public function getCreatedAtAttribute()
    {
        return Carbon::parse($this->attributes['created_at'])->format(trans('lang.date_format'));
    }

    public function getMemberListAttribute()
    {
        $members = $this->members;
        $memberList = '';

        foreach ($members as $member) {
            if ($member->pivot->role == Survey::OWNER) {
                continue;
            }

            $memberList .= $member->email . ',' . $member->pivot->role . '/';
        }

        return $memberList;
    }

    public function getSetting($key = 0)
    {
        $settings = $this->settings;
        $filtered = $settings->whereIn('key', $key)->all();
        $result = '';

        if (count($filtered)) {
            $result = current($filtered)->value;
        }

        return $result;
    }

    public function isOpen()
    {
        return $this->status == config('settings.survey.status.open');
    }

    public function isClose()
    {
        return $this->status == config('settings.survey.status.close');
    }

    public function isDraft()
    {
        return $this->status == config('settings.survey.status.draft');
    }

    public function getRequiredAttribute()
    {
        return $this->settings()->where('key', config('settings.setting_type.answer_required.key'))->first()->value;
    }

    public function getInvites()
    {
        $invite = $this->invite;

        if (!empty($invite) && $invite->number_answer) {
            return number_format(($invite->number_answer / $invite->number_invite) * 100, 2);
        }

        return 0;
    }

    public function getPrivacy()
    {
        return $this->settings
            ->where('key', config('settings.setting_type.privacy.key'))
            ->first()->value;
    }

    
    public function getNumberInvite()
    {
        $invite = $this->invite;

        if (!empty($invite)) {
            return $invite->number_invite;
        }

        return 0;
    }

    public function getNumberAnswer()
    {
        $invite = $this->invite;

        if (!empty($invite)) {
            return $invite->number_answer;
        }

        return 0;
    }

    public function getOptionUpdate()
    {
        $option = $this->settings
            ->where('key', config('settings.setting_type.option_update_survey.key'))->first();

        return !empty($option) ? $option->value : '';
    }

    public function isSendUpdateOption()
    {
        $optionUpdate = $this->getOptionUpdate();

        return in_array($optionUpdate, [
            config('settings.option_update.only_send_updated_question_survey'),
            config('settings.option_update.dont_send_survey_again'),
        ]);        
    }

    public function showTitleTooltip()
    {
        return strlen($this->attributes['title']) >= config('settings.title_length_default')
            ? $this->attributes['title']
            : '';
    }

    public function getLimitAnswer()
    {
        $limit = $this->settings->where('key', config('settings.setting_type.answer_limited.key'))->first();

        return !empty($limit) ? $limit->value : config('settings.survey_setting.answer_unlimited');
    }

    public function getNameFileExcelAttribute()
    {
        return !empty($this->attributes['title']) ? 
            str_slug(str_limit($this->attributes['title'], config('settings.limit_title_excel'))) :
            trans('survey.no_title');
    }
}
