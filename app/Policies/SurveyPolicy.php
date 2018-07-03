<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Survey;
use Illuminate\Auth\Access\HandlesAuthorization;

class SurveyPolicy
{
    use HandlesAuthorization;

    public function view(User $user, Survey $survey)
    {
        $settings = $survey->settings->where('key', config('settings.setting_type.privacy.key'))->first();
        $members = $survey->members->pluck('email')->all();
        $invite = $survey->invite;
        $allMembers = $invite ? array_merge(explode('/', $invite->invite_mails), $members) : $members;

        // if survey is draft that's mean only creator, editor can show it.
        if ($survey->isDraft()) {
            if (in_array($user->email, $members)) {
                return true;
            }

            return false;
        }

        // if survey has settings with privacy is private that's mean only creator, editor, inviter can show it.
        if ($settings->value == config('settings.survey_setting.privacy.private')) {
            if (in_array($user->email, $allMembers)) {
                return true;
            }

            return false;
        }

        // if status is open or close and privacy is public that's mean all user can show it.
        return true;
    }

    public function result(User $user, Survey $survey)
    {
        $members = $survey->members->pluck('id')->all();

        // only creator, editor can edit survey.
        if (in_array($user->id, $members)) {
            return true;
        }

        return false;
    }

    public function edit(User $user, Survey $survey)
    {
        $members = $survey->members->pluck('id')->all();

        // only creator, editor can edit survey and just can edit when survey is not open.
        if (in_array($user->id, $members) && $survey->status != config('settings.survey.status.open')) {
            return true;
        }

        return false;
    }

    public function update(User $user, Survey $survey)
    {
        $members = $survey->members->pluck('id')->all();

        // only creator, editor can edit survey and just can edit when survey is not open.
        if (in_array($user->id, $members) && $survey->status != config('settings.survey.status.open')) {
            return true;
        }

        return false;
    }

    public function delete(User $user, Survey $survey)
    {
        $creator = $survey->members->where('role', config('settings.survey.members.owner'))->first();

        // only creator can delete survey.
        if ($user->id == $creator->id) {
            return true;
        }

        return false;
    }

    public function close(User $user, Survey $survey)
    {
        $members = $survey->members->pluck('id')->all();

        // only creator editor can close survey
        if (in_array($user->id, $members)) {
            return true;
        }

        return false;
    }

    public function open(User $user, Survey $survey)
    {
        $members = $survey->members->pluck('id')->all();

        // only creator editor can open survey
        if (in_array($user->id, $members)) {
            return true;
        }

        return false;
    }

    public function viewResult(User $user, Survey $survey)
    {
        $members = $survey->members->pluck('id')->all();

        // only creator, editor can view result survey.
        if (in_array($user->id, $members)) {
            return true;
        }

        return false;
    }

    public function addMember(User $user, Survey $survey)
    {
        $creator = $survey->members->where('role', config('settings.survey.members.owner'))->first();

        // only creator can add member.
        if ($user->id == $creator->id) {
            return true;
        }

        return false;
    }

    public function clone(User $user, Survey $survey)
    {
        $members = $survey->members->pluck('id')->all();

        // only creator, editor can edit survey.
        if (in_array($user->id, $members)) {
            return true;
        }

        return false;
    }
}
