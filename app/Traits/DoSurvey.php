<?php

namespace App\Traits;
use Auth, Session;

trait DoSurvey
{
    public function getDetailSurvey($survey)
    {
        $sectionIds = $survey->sections->sortBy('order')->pluck('id')->all();
        $section = $this->surveyRepository->getSectionCurrent($survey, $sectionIds[0]);

        return [
            'survey' => $survey,
            'section' => $section,
            'index_section' => config('settings.index_section.start'),
        ];
    }
}
