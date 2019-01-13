<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ResultRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        $questionTypes = implode(',', [
            config('settings.question_type.short_answer'),
            config('settings.question_type.long_answer'),
            config('settings.question_type.multiple_choice'),
            config('settings.question_type.checkboxes'),
            config('settings.question_type.date'),
            config('settings.question_type.time'),
            config('settings.question_type.redirect'),
        ]);

        $rules = [
            'survey_token' => 'required',
            'email' => 'email',
            'user_id' => 'integer|min:0',
            'sections.*.questions.*.question_id' => 'required|integer|distinct',
            'sections.*.questions.*.type' => "required|integer|in:{$questionTypes}",
            'sections.*.questions.*.require' => 'required|integer|between:0,1',
        ];

        $sections = $this->json()->get('sections');

        foreach ($sections as $sectionIndex => $sectionVal) {
            foreach ($sectionVal['questions'] as $questionIndex => $questionVal) {
                $rules = $this->checkQuestionType($sectionIndex, $questionIndex, $questionVal, $rules);
            }
        }

        return $rules;
    }

    /**
     * Get data to be validated from the request.
     *
     * @return array
     */
    protected function validationData()
    {
        return $this->json()->all();
    }

    public function checkQuestionType($sectionIndex, $questionIndex, $question, $rules)
    {
        if ($question['require'] == config('settings.question_require.require')) {
            if (in_array($question['type'], [
                config('settings.question_type.short_answer'),
                config('settings.question_type.long_answer'),
                config('settings.question_type.date'),
                config('settings.question_type.time'),
            ])) {
                $rules['sections.' . $sectionIndex . '.questions.' . $questionIndex . '.results.*.content'] = 'required';
            } else {
                $rules['sections.' . $sectionIndex . '.questions.' . $questionIndex . '.results.*.answer_id'] = 'required|integer|distinct';

                foreach ($question['results'] as $resultIndex => $resultVal) {
                    if ($resultVal['answer_type'] == config('settings.answer_type.other_option')) {
                        $rules['sections.' . $sectionIndex . '.questions.' . $questionIndex . '.results.' . $resultIndex . '.content'] = 'required';
                    }
                }
            }
        }

        return $rules;
    }
}
