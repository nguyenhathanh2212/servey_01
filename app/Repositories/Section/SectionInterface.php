<?php

namespace App\Repositories\Section;

interface SectionInterface
{
    public function deleteSections($ids);

    public function closeFromSurvey($survey);

    public function openFromSurvey($survey);

    public function deleteFromSurvey($survey);
}
