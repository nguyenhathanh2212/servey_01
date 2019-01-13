<div class="{{ $questionSetting == config('settings.question_type.redirect') ? "redirect-question-{$question->id}" : '' }}">
    @foreach ($question->answers->sortBy('type') as $answer)
        <div class="item-answer"
            data-id="{{ $answer->id }}"
            data-type="{{ $answer->type }}">
            @if ($answer->media->count())
                <div class="img-preview-answer-survey img-radio-preview">
                    {!! Html::image($answer->url_media, '',
                        ['class' => 'img-answer']) !!}
                </div>
            @endif
            @if ($answer->type == config('settings.answer_type.other_option'))
                <label class="container-radio-setting-survey">@lang('lang.other')
                    {!! Form::radio('answer' . $question->id, '', false, ['class' => 'choice-answer radio-answer-preview']) !!}
                    <span class="checkmark-radio"></span>
                </label>
                <div class="magic-box-preview">
                    {!! Form::text('', '', ['class' => 'option-other input-answer-other input-multiple-choice-other']) !!}
                </div>
            @else
                <label class="container-radio-setting-survey">
                    {!! nl2br(e($answer->content)) !!}
                    {!! Form::radio('answer' . $question->id, '', false, ['class' => 'choice-answer radio-answer-preview']) !!}
                    <span class="checkmark-radio"></span>
                </label>
            @endif
        </div>
    @endforeach
</div>
