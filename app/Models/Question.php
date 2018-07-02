<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Question extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'required',
        'order',
        'update',
        'section_id',
    ];

    protected $appends = [
        'trim_content',
    ];

    protected $dates = ['deleted_at'];

    public function settings()
    {
        return $this->morphMany(Setting::class, 'settingable')->withTrashed();
    }

    public function withTrashedSettings()
    {
        return $this->morphMany(Setting::class, 'settingable')->withTrashed();
    }

    public function media()
    {
        return $this->morphMany(Media::class, 'mediable')->withTrashed();
    }

    public function withTrashedMedia()
    {
        return $this->morphMany(Media::class, 'mediable');
    }

    public function section()
    {
        return $this->belongsTo(Section::class)->withTrashed();
    }

    public function results()
    {
        return $this->hasManyThrough(Result::class, Answer::class);
    }

    public function answerResults()
    {
        return $this->hasMany(Result::class)->withTrashed();
    }

    public function answers()
    {
        /*
        * Sort the answers of question with the answer orther radio or orther checkbox is last of the list answer in question
        * The config other checkbox will be larger than the type checkbox, orther radio will be larger than the type radio
        * Config radio and checkbox = [1, 2], config orther radio and orther checkbox = [5, 6]
        */
        return $this->hasMany(Answer::class)->withTrashed();
    }

    public function withTrashedAnswers()
    {
        return $this->hasMany(Answer::class)->withTrashed();
    }

    public function duplicate($newQuestion)
    {
        $items = $this->answers;
        foreach ($items as $item) {
            $newQuestion->answers()->create($item->toArray());
        }
    }

    public function getImageAttribute()
    {
        if (empty($this->attributes['image'])) {
            return null;
        }

        $questionImgUrl = $this->attributes['image'];

        return asset(config('settings.image_question_path') . $questionImgUrl);
    }

    public function getTrimContentAttribute()
    {
        return (mb_strlen($this->attributes['title']) > 50) ? mb_substr($this->attributes['title'], 0, 50) . '...' : $this->attributes['title'];
    }

    public function getVideoThumbnailAttribute()
    {
        $videoThumbnail = '';

        if (count($this->media)) {
            $youtubeThumbnail = 'https://img.youtube.com/vi/';
            $rulesURL = '/^(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/(((\w|-){11}))(?:\S+)?$/';
            preg_match($rulesURL, $this->media[0]->url, $informations);

            if (count($informations)) {
                $youtubeId = $informations[1];
                $videoThumbnail = $youtubeThumbnail . $youtubeId . '/hqdefault.jpg';
            }
        }

        return $videoThumbnail;
    }

    public function getTypeAttribute()
    {
        return $this->settings->first()->key;
    }

    public function getValueSettingAttribute()
    {
        return $this->settings->first()->value;
    }

    public function getDateContentAttribute()
    {
        switch (strtolower($this->value_setting)) {
            case strtolower(config('settings.date_format_vn')):
                return trans('lang.date_format_vn');

            case strtolower(config('settings.date_format_en')):
                return trans('lang.date_format_en');

            case strtolower(config('settings.date_format_jp')):
                return trans('lang.date_format_jp');

            default:
                throw new Exception("Error Processing Request", 1);
        }
    }

    public function getUrlMediaAttribute()
    {
        return $this->media->first()->url;
    }

    public function getSectionOrderAttribute()
    {
        return $this->section ? $this->section->order : '';
    }
}
