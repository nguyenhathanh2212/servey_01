<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Result extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'answer_id',
        'user_id',
        'question_id',
        'survey_id',
        'content',
        'client_ip',
        'token',
    ];

    public $timestamps = true;

    protected $dates = ['deleted_at'];

    public function answer()
    {
        return $this->belongsTo(Answer::class)->withTrashed();
    }

    public function question()
    {
        return $this->belongsTo(Question::class)->withTrashed();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function survey()
    {
        return $this->belongsTo(Survey::class)->withTrashed();
    }

    public function getContentAnswerAttribute()
    {
        $answer = $this->answer;

        if ($answer && $answer->type == config('settings.answer_type.option')) {
            return $answer->content;
        }

        return $this->attributes['content'];
    }

    public function getOrderAttribute()
    {
        return $this->question ? $this->question->order : '';
    }
    
    public function getSectionOrderAttribute()
    {
        return $this->question->section_order;
    }

    public function getUpperContentAttribute()
    {
        return strtoupper($this->attributes['content']);
    }
}
