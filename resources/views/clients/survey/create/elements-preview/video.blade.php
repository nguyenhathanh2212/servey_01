<h4 class="title-question">{!! nl2br(e($question->title)) !!}</h4>

@if ($question->media)
    <div class="img-preview-question-survey videoWrapper">
        <iframe src="{{ $question->media }}"
            frameborder="0">
        </iframe>
    </div>
@endif

<div class="form-group form-group-description-section">
    <span>{!! nl2br(e($question->description)) !!}</span>
</div>