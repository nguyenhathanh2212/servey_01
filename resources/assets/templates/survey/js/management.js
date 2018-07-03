$(document).ready(function () {
    // get overview
    $(document).on('click', '#overview-survey', function () {
        var url = $(this).attr('data-url');
        handelManagement($(this));
        $.ajax({
            method: 'GET',
            url: url,
            dataType: 'json',
            success: function (data) {
                $('#div-management-survey').html(data.html).promise().done(function () {
                    getOverviewSurvey();// use to render chart of overview at line 4 of file /resources/assets/templates/survey/js/management-chart.js
                });
            },
        });
    });

    // get result
    $(document).on('click', '#results-survey, #btn-summary-result, #btn-personal-result', function () {
        var url = $(this).attr('data-url');
        handelManagement($(this));
        $.ajax({
            method: 'GET',
            url: url,
            dataType: 'json',
            success: function (data) {
                if (data.success) {
                    $('#div-management-survey').html(data.html).promise().done(function () {
                        results(); // use to render chart of result of survey at line 35 of file resources/assets/templates/survey/js/result.js
                        $(this).find('.ul-result').addClass('ul-result-management');
                    });

                    $('[data-toggle="tooltip"]').tooltip();

                    autoScroll(); // use function autoScroll() from file resources/assets/templates/survey/js/result.js
                    autoAlignChoiceAndCheckboxIcon(); // this function has defined in file resources/assets/templates/survey/js/result.js
                } else {
                    $('.content-section-preview').html(`<span class="message-result">${data.message}</span>`);
                }
            }
        });

        return false;
    });

    // setting survey
    $(document).on('click', '#setting-survey', function () {
        var url = $(this).attr('data-url');
        handelManagement($(this));
        $.ajax({
            method: 'GET',
            url: url,
            dataType: 'json',
            success: function (data) {
                $('#div-management-survey').html(data.html).promise().done(function () {
                    results(); // use to render chart of result of survey at line 35 of file resources/assets/templates/survey/js/result.js
                    $(this).find('.ul-result').addClass('ul-result-management');
                });

                $('[data-toggle="tooltip"]').tooltip();
            }
        });
    });

    // delete survey
    $(document).on('click', '#delete-survey', function () {
        var url = $(this).attr('data-url');
        confirmDanger({message: Lang.get('lang.comfirm_delete_survey')}, function () {
            $.ajax({
                method: 'GET',
                url: url,
                dataType: 'json',
                success: function (data) {
                    if (data.success) {
                        window.location.replace(data.url_redirect);

                        return;
                    }
                    
                    alertDanger({message: data.message});
                }
            });
        });
    });

    // close survey survey
    $(document).on('click', '#close-survey', function () {
        var url = $(this).attr('data-url');
        confirmDanger({message: Lang.get('lang.comfirm_close_survey')}, function () {
            $.ajax({
                method: 'GET',
                url: url,
                dataType: 'json',
                success: function (data) {
                    if (data.success) {
                        $('#close-survey').addClass('hide-div');
                        $('#open-survey').removeClass('hide-div');
                        alertSuccess({message: data.message});
                    } else {                        
                        alertDanger({message: data.message});
                    }
                }
            });
        });
    });

    // open survey survey
    $(document).on('click', '#open-survey', function () {
        var url = $(this).attr('data-url');
        confirmDanger({message: Lang.get('lang.comfirm_open_survey')}, function () {
            $.ajax({
                method: 'GET',
                url: url,
                dataType: 'json',
                success: function (data) {
                    if (data.success) {
                        $('#close-survey').removeClass('hide-div');
                        $('#open-survey').addClass('hide-div');
                        alertSuccess({message: data.message});
                    } else {                        
                        alertDanger({message: data.message});
                    }
                }
            });
        });
    });

    // clone survey survey
    $(document).on('click', '#clone-survey', function () {
        var url = $(this).attr('data-url');
        
        confirmDanger({message: Lang.get('lang.comfirm_clone_survey')}, function () {
            $.ajax({
                method: 'GET',
                url: url,
                dataType: 'json',
                success: function (data) {
                    if (data.success) {
                        alertSuccess(
                            {message: data.message},
                            function () {
                                var redirectWindow = window.open(data.redirect, '_blank');
                                redirectWindow.location;
                            }
                        );
                    } else {
                        alertDanger({message: data.message});
                    }
                }
            });
        });
    });

    // show btn change token survey
    $(document).on('keyup', '.input-edit-token', function () {
        var element = $(this).closest('.form-group-custom').find('.input-edit-token');
        var oldToken = element.data('token');
        var newToken = element.val().replace(' ', '_');

        if (oldToken != newToken && newToken) {
            $('.edit-token-survey').show();
        } else {
            $('.edit-token-survey').hide();
        }
    })

    $(document).on('click', '.edit-token-survey', function () {
        var element = $(this);
        
        if ($('#close-survey').is(':visible')) {
            confirmWarning(
                {message: Lang.get('lang.confirm_close_to_edit')},
                function () {
                    closeSurvey();
                    changeToken(element.closest('.form-group-custom').find('.input-edit-token'));
                }
            );
        } else {
            changeToken(element.closest('.form-group-custom').find('.input-edit-token'));
        }
    })

    // show change token manage survey
    $(document).on('keyup', '.input-edit-token-manage', function () {
        var element = $(this).closest('.form-group-custom').find('.input-edit-token-manage');
        var oldTokenManage = element.data('token-manage');
        var newTokenManage = element.val().replace(' ', '_');

        if (oldTokenManage != newTokenManage && newTokenManage) {
            $('.edit-token-manage-survey').show();
        } else {
            $('.edit-token-manage-survey').hide();
        }
    })

    $(document).on('click', '.edit-token-manage-survey', function () {
        var element = $(this);

        if ($('#close-survey').is(':visible')) {
            confirmWarning(
                {message: Lang.get('lang.confirm_close_to_edit')},
                function () {
                    closeSurvey();
                    changeTokenManage(element.closest('.form-group-custom').find('.input-edit-token-manage'));
                }
            );
        } else {
            changeTokenManage(element.closest('.form-group-custom').find('.input-edit-token-manage'));
        }
    })

    $(document).on('click', '#edit-survey', function(event) {
        event.preventDefault();
        var redirect = $(this).attr('data-url');

        if ($('#close-survey').is(':visible')) {
            confirmWarning(
                {message: Lang.get('lang.confirm_close_to_edit')},
                function () {
                    closeSurvey(redirect);
                }
            );
        } else {
            window.location.href = redirect;
        }

        return false;
    });

});

function handelManagement(event) {
    $('.menu-management').removeClass('active');
    event.addClass('active');
}

function closeSurvey(redirect = '') {
    var url = $('#close-survey').attr('data-url');

    $.ajax({
        method: 'GET',
        url: url,
        dataType: 'json',
        success: function (data) {
            if (data.success) {
                $('#close-survey').addClass('hide-div');
                $('#open-survey').removeClass('hide-div');

                if (redirect) {
                    window.location.href = redirect;
                }
            } else {                        
                alertDanger({message: data.message});
            }
        }
    });
}

function changeToken(element) {
    var oldToken = element.attr('data-token');
    var newToken = element.val().replace(' ', '_');

    if (oldToken != newToken && newToken) {
        confirmInfo(
            {message: Lang.get('lang.confirm_change_token', {token: oldToken, new_token: newToken})},
            function () {
                $.ajaxSetup({
                    headers: {
                        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                    }
                });

                $.ajax({
                    method: 'POST',
                    url: element.data('url'),
                    dataType: 'json',
                    data: {
                        'survey_id': element.data('survey-id'),
                        'token': newToken,
                        'old_token': oldToken,
                    }
                })
                .done(function (data) {
                    if (data.success) {
                        alertSuccess({message: Lang.get('lang.change_success')});
                        $('.next-section-survey').attr('data-url', data.next_section_url);
                        $('.edit-token-survey').hide();
                        $('.input-edit-token').attr('data-token', data.new_token);
                        $('.input-edit-token').attr('data-original-title', data.new_token);
                        $('#setting-survey').attr('data-url', data.setting_url);
                        $('.link-survey').attr('href', data.link_doing);
                        element.val(data.new_token);
                    } else {
                        alertDanger({message: data.message});
                    }
                })
                .fail(function (data) {
                    alertWarning({message: data.responseJSON.token[0]});
                });
            }
        );
    } else {
        element.val(oldToken);
    }
}

function changeTokenManage(element) {
    var oldTokenManage = element.attr('data-token-manage');
    var newTokenManage = element.val().replace(' ', '_');

    if (oldTokenManage != newTokenManage && newTokenManage) {
        confirmInfo(
            {message: Lang.get('lang.confirm_change_token_manage', {token_manage: oldTokenManage, new_token_manage: newTokenManage})},
            function () {
                $.ajaxSetup({
                    headers: {
                        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                    }
                });

                $.ajax({
                    method: 'POST',
                    url: element.data('url'),
                    dataType: 'json',
                    data: {
                        'survey_id': element.data('survey-id'),
                        'token_manage': newTokenManage,
                        'old_token_manage': oldTokenManage,
                    }
                })
                .done(function (data) {
                    if (data.success) {
                        alertSuccess({message: Lang.get('lang.change_success')});
                        $('#overview-survey').attr('data-url', data.overview_url);
                        $('#results-survey').attr('data-url', data.result_url);
                        $('#delete-survey').attr('data-url', data.delete_survey_url);
                        $('#close-survey').attr('data-url', data.close_survey_url);
                        $('#open-survey').attr('data-url', data.open_survey_url);
                        $('#edit-survey').attr('data-url', data.edit_survey_url);
                        $('#clone-survey').attr('data-url', data.clone_survey_url);
                        $('.input-edit-token-manage').attr('data-token-manage', data.new_token_manage);
                        $('.input-edit-token-manage').attr('data-original-title', data.new_token_manage);
                        $('.link-manage').attr('href', data.link_manage);

                        if (typeof (history.pushState) != 'undefined') {
                            var obj = { Page: 'update-url', Url: data.new_token_manage };
                            history.pushState(obj, obj.Page, obj.Url);
                        }

                        $('.edit-token-manage-survey').hide();
                        element.val(data.new_token_manage);
                    } else {
                        alertDanger({message: data.message});
                    }
                })
                .fail(function (data) {
                    alertWarning({message: data.responseJSON.token_manage[0]});
                });
            }
        );
    } else {
        element.val(oldTokenManage);
    }
}
