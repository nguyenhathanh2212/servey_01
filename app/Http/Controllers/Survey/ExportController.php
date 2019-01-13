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

    public function export(Request $request)
    {
        try {
            $survey = $this->surveyRepository->getSurveyFromToken($request->token);

            if (!$survey) {
                throw new Exception('Survey not found', 1);
            }

            $data = $this->surveyRepository->getResultExport($survey, $request->month);
            $title = str_limit($survey->title, config('settings.limit_title_excel'));

            $title = $request->name ? str_limit($request->name, config('settings.limit_title_excel')) : str_limit($survey->title, config('settings.limit_title_excel'));
// return view('clients.export.excel', compact('data'));
            return Excel::create($title, function($excel) use ($title, $data) {
                $excel->sheet($title, function($sheet) use ($data) {
                    $sheet->loadView('clients.export.excel', compact('data'));
                    $sheet->setOrientation('landscape');
                });
                $excel->sheet($title, function($sheet) use ($data) {
                    $sheet->loadView('clients.export.excel', compact('data'));
                    $sheet->setOrientation('landscape');
                });
            })->export($request->type);
        } catch (Exception $e) {
            dd($e);
            return redirect()->back()->with('error', trans('lang.export_error'));
        }
    }
}
