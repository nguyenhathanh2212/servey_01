<?php

namespace App\Http\Controllers\Survey;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Repositories\Survey\SurveyInterface;
use Excel;
use Exception;

class ExportController extends Controller
{
    protected $surveyRepository;

    public function __construct(SurveyInterface $surveyRepository)
    {
        $this->surveyRepository = $surveyRepository;
    }

    public function export($token, $type, $name)
    {
        try {
            $survey = $this->surveyRepository->getSurveyFromToken($token);

            if (!$survey) {
                throw new Exception('Survey not found', 1);
            }

            $data = $this->surveyRepository->getResultExport($survey);
            $title = str_limit($survey->title, config('settings.limit_title_excel'));

            $title = $name ? $name : str_limit($survey->title, config('settings.limit_title_excel'));

            return Excel::create($title, function($excel) use ($title, $data) {
                $excel->sheet($title, function($sheet) use ($data) {
                    $sheet->loadView('clients.export.excel', compact('data'));
                    $sheet->setOrientation('landscape');
                });
            })->export($type);
        } catch (Exception $e) {
            return redirect()->back()->with('error', trans('lang.export_error'));
        }
    }
}
