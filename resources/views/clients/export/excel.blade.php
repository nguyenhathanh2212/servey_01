<!DOCTYPE html>
<html>
<head>
    <title></title>
</head>
<body>
    @foreach ($data['sheets'] as $key => $sheet)
        <table class="table-result table" border="1">
            <thead class="thead-default">
                <tr>
                    <th>
                        {{ trans('lang.timestamps') }}
                    </th>
                    @if ($data['requiredSurvey'] != config('settings.survey_setting.answer_required.none'))
                        <th>{{ trans('lang.email') }}</th>
                    @endif
                    @foreach ($sheet as $question)
                        {{-- {{ dump($question->required) }} --}}
                        <th>{!! $question->title !!}{{ $question->required == config('settings.question.required') ? '(*)'  : '' }}</th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @if (count($data['results']))
                    {{-- @foreach ($data['results'] as $result)
                        @php
                            $result = $result->sortBy('order')->sortBy('section_order');
                        @endphp
                        <tr>
                            <td>{{ $result->first()->created_at }}</td>
                            @if ($data['requiredSurvey'] != config('settings.survey_setting.answer_required.none'))
                                <td>{{ $result->first()->user ? $result->first()->user->email : trans('lang.incognito') }}</td>
                            @endif
                            @foreach ($result->groupBy('question_id') as $answers)
                                @if ($answers->count() == 1)
                                    <td>{!! $answers->first()->content_answer !!}</td>
                                @else
                                    <td>
                                        @foreach ($answers as $answer)
                                            {!! $answer->content_answer !!}
                                            {{ ($answer == $answers->last()) ? '' : ',' }}
                                        @endforeach
                                    </td>
                                @endif
                            @endforeach
                        </tr>
                    @endforeach --}}
                    @foreach ($data['results'] as $result)
                        @if ($result->where('answer_id', $key)->count())
                            @php
                                $result = $result->sortBy('order')->sortBy('section_order');
                            @endphp
                            <tr>
                                <td>{{ $result->first()->created_at }}</td>
                                @if ($data['requiredSurvey'] != config('settings.survey_setting.answer_required.none'))
                                    <td>{{ $result->first()->user ? $result->first()->user->email : trans('lang.incognito') }}</td>
                                @endif
                                @foreach ($sheet as $question)
                                    @php
                                        $answers = $question->answerResults->where('token', $result->first()->token);
                                    @endphp
                                    @if ($answers->count() == 1)
                                        <td>{!! $answers->first()->content_answer !!}</td>
                                    @else
                                        <td>
                                            {{ implode(', ', $answers->toArray()) }}
                                        </td>
                                    @endif
                                @endforeach
                            </tr>
                        @endif
                    @endforeach
                @endif
            </tbody>
        </table>
    @endforeach
</body>
</html>
