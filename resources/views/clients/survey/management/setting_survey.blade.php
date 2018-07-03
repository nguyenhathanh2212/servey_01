<main class="cd-main-content">
    @include('clients.profile.notice')
    <div class="content-wrapper content-wrapper-management">
        <!-- /Scroll buttons -->
        <div class="offset-md-9">
            @can('delete', $survey)
                <a href="javascript:void(0)" class="btn btn-danger" id="delete-survey"
                    data-toggle="tooltip" title="@lang('survey.delete')"
                    data-url="{{ route('ajax-survey-delete', $survey->token_manage) }}">
                    <i class="fa fa-trash" aria-hidden="true"></i>
                </a>
            @endcan
            <a href="javascript:void(0)" data-url="{{ route('surveys.edit', $survey->token_manage) }}" class="btn btn-info"
                id="edit-survey"
                data-toggle="tooltip" title="@lang('survey.edit')">
                <i class="fa fa-edit" aria-hidden="true"></i>
            </a>
            
            <a href="javascript:void(0)"
                class="btn {{ ($survey->isClose() || $survey->isDraft()) ? 'hide-div' : '' }}"
                id="close-survey"
                data-toggle="tooltip" title="@lang('survey.close')"
                data-url="{{ route('ajax-survey-close', $survey->token_manage) }}">
                <i class="fa fa-lock" aria-hidden="true" style="color: #333;"></i>
            </a>

            <a href="javascript:void(0)"
                class="btn btn-warning {{ ($survey->isOpen() || $survey->isDraft()) ? 'hide-div' : '' }}" 
                id="open-survey"
                data-toggle="tooltip" title="@lang('survey.open')"
                data-url="{{ route('ajax-survey-open', $survey->token_manage) }}">
                <i class="fa fa-unlock" aria-hidden="true"></i>
            </a>

            <a href="javascript:void(0)" class="btn btn-dark"
                id="clone-survey"
                data-toggle="tooltip" title="@lang('survey.coppy')"
                data-url="{{ route('ajax-survey-clone', $survey->token_manage) }}">
                <i class="fa fa-copy"></i>
            </a>
        </div>
        <div class="config-link-survey">
            {!! Form::open() !!}
                <div class="form-group row form-group-custom">
                    {!! Form::label('token', trans('lang.link_doing_survey'), ['class' => 'col-sm-3 col-form-label col-form-label-custom']) !!}
                    <div class="col-sm-9">
                        {!! config('settings.link_doing') . Form::text('token', $survey->token, [
                                'class' => 'form-control-plaintext input-edit-token',
                                'data-survey-id' => $survey->id,
                                'data-token' => $survey->token,
                                'data-url' => route('change-token'),
                                'data-toggle' => 'tooltip',
                                'title' => $survey->token,
                            ]) !!}
                        <span class="complete-content">
                            <a href="{{ $link }}" class="link-survey"></a>
                            <a href="#" class="btn btn-info copy-link-survey">
                                <i class="fa fa-paperclip"></i>
                                <span class="tooltiptext">@lang('lang.copy_link')</span>
                            </a>
                        </span>
                        <a href="javascript:void(0)" class="btn btn-warning edit-token-survey"
                            data-toggle="tooltip" title="@lang('lang.change_token')">
                            <i class="fa fa-edit"></i>
                        </a>
                    </div>
                </div>
                <div class="form-group row form-group-custom">
                    {!! Form::label('token_manage', trans('lang.link_manage_survey'), ['class' => 'col-sm-3 col-form-label col-form-label-custom']) !!}
                    <div class="col-sm-9">
                        {!! config('settings.link_manage') . Form::text('token_manage', $survey->token_manage, [
                                'class' => 'form-control-plaintext input-edit-token-manage',
                                'data-survey-id' => $survey->id,
                                'data-token-manage' => $survey->token_manage,
                                'data-url' => route('change-token-manage'),
                                'data-toggle' => 'tooltip',
                                'title' => $survey->token_manage,
                            ]) !!}
                        <span class="complete-content">
                            <a href="{{ $linkManage }}" class="link-manage"></a>
                            <a href="#" class="btn btn-info copy-link-manage">
                                <i class="fa fa-paperclip"></i>
                                <span class="tooltiptext">@lang('lang.copy_link')</span>
                            </a>
                        </span>
                        <a href="javascript:void(0)" class="btn btn-warning edit-token-manage-survey"
                            data-toggle="tooltip" title="@lang('lang.change_token_manage')">
                            <i class="fa fa-edit"></i>
                        </a>
                    </div>
                </div>
            {!! Form::close() !!} 
        </div>
        @include('clients.survey.detail.detail_survey')
    </div>
    <!-- Content Wrapper  -->
</main>

