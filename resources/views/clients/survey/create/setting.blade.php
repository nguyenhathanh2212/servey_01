<!-- The Modal -->
<div class="modal fade setting-survey" id="setting-survey">
    <div class="modal-dialog">
        <div class="modal-content modal-content-setting-create-survey">
            <div class="modal-header modal-header-setting-survey">
                <h4 class="modal-title title-setting-survey">@lang('lang.settings')</h4>
            </div>
            <ul class="nav nav-tabs nav-setting-survey" role="tablist">
                <li class="nav-item nav-item-setting-survey">
                    <a class="nav-link active" data-toggle="tab" role="tab" href="#general_settings">@lang('lang.general_settings')</a>
                </li>
                <li class="nav-item nav-item-setting-survey">
                    <a class="nav-link" data-toggle="tab" role="tab" href="#tab-add-manager">@lang('lang.manager')</a>
                </li>
                <li class="nav-item nav-item-setting-survey" id="send-survey-setting">
                    <a class="nav-link" data-toggle="tab" role="tab" href="#tab-send-mails">@lang('lang.send_survey')</a>
                </li>
            </ul>

            <!-- start tab settings -->
            <div class="tab-content tab-content-setting">
                <div id="general_settings" class="container tab-pane active"><br>
                    <input type="hidden" name="survey-setting"
                        id="survey-setting"
                        answer-required="{{ config('settings.survey_setting.answer_required.none') }}"
                        answer-limited="{{ config('settings.survey_setting.answer_unlimited') }}"
                        reminder-email="{{ config('settings.survey_setting.reminder_email.none') }}"
                        privacy="{{ config('settings.survey_setting.privacy.public') }}"
                        time="">
                    <div class="setting-email-create-survey">
                        <div class="item-setting">
                            <div class="setting-confirm-reply">
                                <label class="container-checkbox-setting-survey">
                                    <span>@lang('lang.required_infomation')</span>
                                    {!! Form::checkbox('confirm_reply', '', false, [
                                        'class' => 'confirm-reply',
                                        'id' => 'confirm-reply',
                                        'default' => config('settings.survey_setting.answer_required.none'),
                                    ]) !!}
                                    <span class="checkmark-setting-survey"></span>
                                </label><br>
                            </div>
                            <div class="setting-choose-confirm-reply">
                                <label class="container-radio-setting-survey">@lang('lang.login')
                                    {!! Form::radio('radio_request_login', '', true, [
                                        'class' => 'setting-radio-request',
                                        'disabled',
                                        'val' => config('settings.survey_setting.answer_required.login'),
                                    ]) !!}
                                    <span class="checkmark-radio"></span>
                                </label><br>
                                <label class="container-radio-setting-survey">@lang('lang.login_by_wsm')
                                    {!! Form::radio('radio_request_login', '', false, [
                                        'class' => 'setting-radio-request',
                                        'disabled',
                                        'val' => config('settings.survey_setting.answer_required.login_with_wsm'),
                                    ]) !!}
                                    <span class="checkmark-radio"></span>
                                </label>
                            </div>
                        </div>
                        <div class="item-setting">
                            <label class="container-checkbox-setting-survey">
                                <span>@lang('lang.limit_replies')</span>
                                {!! Form::checkbox('limit_number_answer', '', false, [
                                    'class' => 'limit-number-answer',
                                    'id' => 'limit-number-answer',
                                    'default' => config('settings.survey_setting.answer_unlimited'),
                                ]) !!}
                                <span class="checkmark-setting-survey"></span>
                            </label>
                            <div class="number-limit-number-answer content-quantity">
                                <div class="numbers-row">
                                    <div id="btn-minus-quantity" class="dec qtybutton"><i class="fa fa-minus">&nbsp;</i></div>
                                    <input type="number" class="quantity-answer" value="{{ config('settings.quantity_answer.default') }}"
                                        min="{{ config('settings.quantity_answer.min') }}"
                                        max="{{ config('settings.quantity_answer.max') }}" id="quantity-answer" name="quantity-answer">
                                    <div id="btn-plus-quantity" class="inc qtybutton"><i class="fa fa-plus">&nbsp;</i></div>
                                </div>
                            </div>
                        </div>
                        <div class="item-setting">
                            <div class="setting-confirm-reply">
                                <label class="container-checkbox-setting-survey">
                                    <span>@lang('lang.send_a_reminder_email_periodically')</span>
                                    {!! Form::checkbox('checkbox_mail_remind', '', false, [
                                        'class' => 'checkbox-mail-remind',
                                        'id' => 'checkbox-mail-remind',
                                        'default' => config('settings.survey_setting.reminder_email.none')
                                    ]) !!}
                                    <span class="checkmark-setting-survey"></span>
                                </label><br>
                            </div>
                            <div class="setting-mail-remind">
                                <div class="col-sm-6 col-12 setting-mail-remind-option">
                                    <label class="container-radio-setting-survey">@lang('lang.by_week')
                                        {!! Form::radio('radio_mail_remind', '', true, [
                                            'class' => 'radio-mail-remind', 'disabled',
                                            'id' => 'remind-by-week',
                                            'val' => config('settings.survey_setting.reminder_email.by_week'),
                                        ]) !!}
                                        <span class="checkmark-radio"></span>
                                    </label><br>
                                    <label class="container-radio-setting-survey">@lang('lang.by_month')
                                        {!! Form::radio('radio_mail_remind', '', false, [
                                            'class' => 'radio-mail-remind',
                                            'disabled',
                                            'id' => 'remind-by-month',
                                            'val' => config('settings.survey_setting.reminder_email.by_month'),
                                        ]) !!}
                                        <span class="checkmark-radio"></span>
                                    </label><br>
                                    <label class="container-radio-setting-survey">@lang('lang.by_quarter')
                                        {!! Form::radio('radio_mail_remind', '', false, [
                                            'class' => 'radio-mail-remind',
                                            'disabled',
                                            'id' => 'remind-by-quarter',
                                            'val' => config('settings.survey_setting.reminder_email.by_quarter'),
                                        ]) !!}
                                        <span class="checkmark-radio"></span>
                                    </label><br>
                                    <label class="container-radio-setting-survey">@lang('lang.by_option')
                                        {!! Form::radio('radio_mail_remind', '', false, [
                                            'class' => 'radio-mail-remind',
                                            'disabled',
                                            'id' => 'remind-by-option',
                                            'val' => config('settings.survey_setting.reminder_email.by_option'),
                                        ]) !!}
                                        <span class="checkmark-radio"></span>
                                    </label>
                                </div>
                                <div  class="col-sm-6 col-9 next-remind-block">
                                    <label class="next-remind-label">@lang('lang.next_remind_label')</label>
                                    {!! Form::text('next-remind-time', '', [
                                        'class' => 'form-control datetimepicker-input valid',
                                        'id' => 'next-remind-time',
                                        'data-toggle' => 'datetimepicker',
                                        'data-target' => '#next-remind-time',
                                    ]) !!}
                                </div>
                            </div>
                        </div>
                        <div class="item-setting">
                            <label class="container-checkbox-setting-survey col-12">
                                <span>@lang('lang.private_this_survey')</span>
                                {!! Form::checkbox('security_survey', '', false, [
                                    'class' => 'security_survey',
                                    'default' => config('settings.survey_setting.privacy.public'),
                                    'val' => config('settings.survey_setting.privacy.private'),
                                    'id' => 'security-survey',
                                ]) !!}
                                <span class="checkmark-setting-survey"></span>
                            </label>
                        </div>
                        <div class="div-action-setting">
                            <a href="#" class="btn-action-setting-cancel" data-dismiss="modal">@lang('lang.cancel')</a>
                            <a href="#" class="btn-action-setting-save" data-dismiss="modal">@lang('lang.save')</a>
                        </div>
                    </div>
                </div>
                <div id="tab-send-mails" class="container tab-pane"><br>
                    <input type="hidden" name="invite-setting"
                        id="invite-setting"
                        all="{{ config('settings.survey.send_mail_to_wsm.none') }}"
                        invite-data=""
                        subject=""
                        msg="{{ trans('lang.message_default_email') }}">
                    <div class="form-group">
                        <div class="row">
                            <div class="col-md-7">
                                <label for="" class="label-email">@lang('lang.email')</label>
                            </div>
                            @if (Auth::user()->checkLoginWsm())
                                <div class="col-md-5 send-to-all-block">
                                    <label class="container-checkbox-setting-survey send-to-all">
                                        <span>@lang('lang.send_to_all')</span>
                                        {!! Form::checkbox('send_all', '', false, [
                                            'class' => 'send-to-all-wsm-acc',
                                            'id' => 'send-to-all-wsm-acc',
                                            'default' => config('settings.survey.send_mail_to_wsm.none'),
                                            'val' => config('settings.survey.send_mail_to_wsm.all')
                                        ]) !!}
                                        <span class="checkmark-setting-survey"></span>
                                    </label>
                                </div>
                            @endif
                        </div>
                        <div class="row">
                            <div class="col-md-12 div-show-all-email">
                                {!! Form::hidden('emails_invite', '', ['class' => 'emails-invite-hidden']) !!}
                            </div>
                            <div class="col-md-12">
                                {!! Form::text('email', null, [
                                    'class' => 'form-control input-email-send',
                                    'data-url' => route('ajax-suggest-email'),
                                    'autocomplete' => 'off',
                                    'placeholder' => trans('lang.email_placeholder'),
                                    'id' => 'input-email-send',
                                ]) !!}
                                <ul class="live-suggest-email">
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="" class="label-subject">@lang('lang.subject')</label>
                        {!! Form::text('subjectEmail', trans('lang.subject_default_email'), [
                            'class' => 'form-control input-subject-email',
                            'id' => 'input-subject-email',
                            'default' => trans('lang.subject_default_email'),
                            'subject-default' => trans('lang.subject_default_email'),
                        ]) !!}
                    </div>
                    <div class="form-group">
                        <label for="" class="label-message">@lang('lang.message')</label>
                        {!! Form::textarea('messageEmail', '', [
                            'class' => 'form-control input-area auto-resize input-email-message',
                            'data-autoresize',
                            'rows' => 1,
                            'id' => 'input-email-message',
                        ]) !!}
                    </div>
                    <div class="div-action-send-survey">
                        <a href="#" class="btn-action-setting-cancel" data-dismiss="modal">@lang('lang.cancel')</a>
                        <a href="#" class="btn-action-setting-save" data-dismiss="modal">@lang('lang.save')</a>
                    </div>
                </div>
                <div id="tab-add-manager" class="container tab-pane"><br>
                    <input type="hidden" name="members-setting"
                        id="members-setting"
                        members-data="">
                    <div class="form-group">
                        <div class="row">
                            <div class="col-md-8">
                                <label for="" class="label-email">@lang('lang.add_manager')</label>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-12">
                                {!! Form::hidden('emails_member', '', ['class' => 'emails-member-hidden']) !!}
                            </div>
                            <div class="col-md-12">
                                {!! Form::text('email', null, [
                                    'class' => 'form-control input-email-member',
                                    'id' => 'input-email-member',
                                    'data-url' => route('ajax-suggest-email'),
                                    'autocomplete' => 'off',
                                    'placeholder' => trans('lang.email_placeholder'),
                                ]) !!}
                                <ul class="live-suggest-member-email"></ul>
                            </div>
                        </div>
                    </div>
                    <div class="form-group table-member-div" id="style-scroll-custom">
                        <table class="table-show-email-manager" border="1" cellspacing="0">
                            <thead>
                                <tr>
                                    <th>@lang('lang.email')</th>
                                    <th>@lang('lang.role')</th>
                                    <th><i class="fa fa-trash"></i></th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                    <div class="div-action-send-survey">
                        <a href="#" class="btn-action-setting-cancel" data-dismiss="modal">@lang('lang.cancel')</a>
                        <a href="#" class="btn-action-setting-save" data-dismiss="modal">@lang('lang.save')</a>
                    </div>
                </div>
            </div>
            <!-- end tab settings -->
        </div>
    </div>
</div>
