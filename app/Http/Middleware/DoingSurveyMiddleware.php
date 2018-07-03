<?php

namespace App\Http\Middleware;

use Closure;
use App\Repositories\Survey\SurveyInterface;
use Auth;
use Illuminate\Http\Response;
use App\Policies\SurveyPolicy;
use App\Traits\ClientInformation;

class DoingSurveyMiddleware
{
    use ClientInformation;

    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    protected $surveyRepository;

    public function __construct(SurveyInterface $surveyRepository)
    {
        $this->surveyRepository = $surveyRepository;
    }

    public function handle($request, Closure $next)
    {
        $survey = $this->surveyRepository->getSurveyFromToken($request->token);
        $status = $survey->status;
        $limitAnswer = $survey->getLimitAnswer();
        $title = $survey->title;

        if ($status != config('settings.survey.status.open')
            && (!Auth::check() || Auth::user()->cannot('edit', $survey))) {
            $content = trans('lang.you_do_not_have_permission');

            return new Response(view('clients.survey.detail.complete', compact('title', 'content')));
        }

        if (!Auth::check()) {
            $requiredLogin = $survey->required;
            $privacy = $survey->getPrivacy();

            if ($privacy == config('settings.survey_setting.privacy.private')) {
                $requiredLogin = config('settings.survey_setting.answer_required.login');
            }

            if ($requiredLogin) {
                return new Response(view('clients.survey.detail.index', compact('requiredLogin')));
            }
        }

        $inforAnswerer = Auth::check() ? Auth::user()->id : $this->getClientIP();
        $keyCheck = Auth::check() ? 'user_id' : 'client_ip';
        // process limit number of times answer
        $timesAnswer = $survey->results->where($keyCheck, $inforAnswerer)
            ->pluck('created_at')
            ->unique()->count();

        if ($limitAnswer != config('settings.survey_setting.answer_unlimited') 
            && $timesAnswer >= $limitAnswer) {
            return  new Response(view('clients.survey.detail.complete', compact('title')));
        }

        return $next($request);
    }
}
