$(document).ready(function() {
    $.ajaxSetup({
        headers: {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
        }
    });

    $(`.description-question,
        .description-section,
        .description-survey,
        .title-section,
        .title-question,
        .title-survey-preview,
        .container-checkbox-setting-survey,
        .container-radio-setting-survey`).linkify({
        target: '_blank',
    });

    function autoAlignChoiceAndCheckboxIcon()
    {
        // auto align center multi-choice icon
        $('.li-question-review .item-answer .checkmark-radio').each(function () {
            var height = $(this).parent().height();
            var top = 12.5 * (height / 25 - 1);
            $(this).css('top', top + 'px');
        });

        // auto align center checkboxes icon
        $('.li-question-review .item-answer .checkmark-setting-survey').each(function () {
            var height = $(this).parent().height();
            var top = 12.5 * (height / 25 - 1);
            $(this).css('top', top + 'px');
        });
    }

    autoAlignChoiceAndCheckboxIcon();

    $('.datepicker-preview').each(function() {
        var dateFormat = $(this).attr('data-dateformat');

        $(this).datetimepicker({
            format: dateFormat,
        });
    })

    $('.timepicker-preview').datetimepicker({
        format: 'HH:mm',
    });

    //event click img answer
    $(document).on('click', '.img-checkbox-preview', function(event) {
        event.preventDefault();
        var selector = $(this).next('label').children('input');

        if (selector.prop('checked')) {
            $(selector).prop('checked', false);
            $(this).css('border', 'none');
        } else {
            $(selector).prop('checked', true);
            $(this).css('border', '2px solid #43add1');
        }
    });

    $(document).on('click', '.img-radio-preview', function(event) {
        event.preventDefault();
        var selector = $(this).next('label').children('input');

        if (!selector.prop('checked')) {
            $(selector).prop('checked', true);
            $(this).css('border', '2px solid #43add1');
            $(this).closest('.li-question-review').find('.notice-required').hide();
        }

        //turn off radio others

        $('.radio-answer-preview').each(function () {
            if (!$(this).prop('checked')) {
                var selector = $(this).parent('.container-radio-setting-survey')
                    .prev('.img-preview-answer-survey');

                if ($(selector).length) {
                    $(selector).css('border', 'none');
                }
            }
        })
    });

    $(document).on('change', '.checkbox-answer-preview', function(event) {
        event.preventDefault();
        var selector = $(this).parent('.container-checkbox-setting-survey')
            .prev('.img-preview-answer-survey');

        if ($(selector).length) {
            if ($(this).prop('checked')) {
                $(selector).css('border', '2px solid #43add1');
            } else {
                $(selector).css('border', 'none');
            }
        }
    });

    $(document).on('change', '.radio-answer-preview', function(event) {
        event.preventDefault();
        if ($(this).prop('checked')) {
            var selector = $(this).parent('.container-radio-setting-survey')
                .prev('.img-preview-answer-survey');

            if ($(selector).length) {
                $(selector).css('border', '2px solid #43add1');
            }
        }

        //turn off radio others

        $('.radio-answer-preview').each(function () {
            if (!$(this).prop('checked')) {
                var selector = $(this).parent('.container-radio-setting-survey')
                    .prev('.img-preview-answer-survey');

                if ($(selector).length) {
                    $(selector).css('border', 'none');
                }
            }
        })
    });

    // This is for resize window
    $(function () {
        // auto resize textarea
        autoResizeTextarea();

        $(window).bind('load resize', function () {
            var width = (this.window.innerWidth > 0) ? this.window.innerWidth : this.screen.width;

            if (width < 1170) {
                $('body').addClass('content-wrapper');
            } else {
                $('body').removeClass('content-wrapper');
            }
        });
    });

    $('.input-checkbox-other').on('click', function(event) {
        event.preventDefault();
        checkCheckbox(this);
    });

    $('.input-multiple-choice-other').on('click', function(event) {
        event.preventDefault();
        checkRadio(this);
    });

    /*
        doing-survey
    */

   $('.content-section-preview').on('click', '.previous-section-survey', function(event) {
        event.preventDefault();
        event.stopPropagation();
        var selector = $(this).closest('.ul-content-preview');

        if (selector) {
            showLoaderSection();
            $(selector).hide();
            $(`#${$(selector).attr('data-prev')}`).show();
            autoAlignChoiceAndCheckboxIcon();
            hideLoaderSection();
        }

        return false;
    });

   var redirectIds = [0];

    $(document).on('click', '.next-section-survey', function(event) {
        event.preventDefault();
        event.stopPropagation();
        var selector = $(this).closest('.ul-content-preview');

        if($('.page-doing-survey').is(':visible')) {
            if (!validateDoingSection(selector)) {
                return false;
            }
        }

        showLoaderSection();

        var redirectId = 0;
        var currentId = selector.attr('data-current-id');
        var answerRedirects = [];

        if ($(this).closest('.ul-content-preview').find('.redirect-question').length) {
            var questionId = $('.redirect-question').attr('data-id');
            $(`input[name='answer${questionId}']`).each(function() {
                answerRedirects.push($(this).closest('.item-answer').attr('data-id'));
            });

            redirectId = $(`input[name='answer${questionId}']:checked`).closest('.item-answer').attr('data-id');
        }

        if (redirectId && redirectIds.indexOf(redirectId) == -1) {
            for (var i = 0; i < answerRedirects.length; i++) {
                var index = redirectIds.indexOf(answerRedirects[i]);

                if (index > -1) {
                    redirectIds.splice(index, redirectIds.length - index);
                    selector.nextAll('.ul-content-preview').remove();
                    break;
                }
            }

            redirectIds.push(redirectId);
        }

        if ($(selector).attr('data-next') && redirectId && redirectId == $(`#${$(selector).attr('data-next')}`).attr('data-redirect-id')) {
            $(selector).hide();
            $(`#${$(selector).attr('data-next')}`).show();
            autoAlignChoiceAndCheckboxIcon();
            hideLoaderSection();
        } else {
            var sectionOrderPrev = $(selector).attr('id');
            var dataUrl = $(this).attr('data-url');

            $.ajax({
                url: dataUrl,
                type: 'get',
                dataType: 'json',
                data: {
                    redirect_ids: redirectIds,
                    current_section_id: currentId,
                },
            })
            .done(function(data) {
                if (data.success) {
                    $(selector).attr('data-next', data.section_order);
                    $('.content-section-preview').append(data.html);
                    var locale = $('.datepicker-preview').attr('locale');

                    $('.datepicker-preview').each(function() {
                        var dateFormat = $(this).attr('data-dateformat');

                        $(this).datetimepicker({
                            format: dateFormat,
                        });
                    })

                    $('.timepicker-preview').datetimepicker({
                        format: 'HH:mm',
                    });

                    $('.ul-content-preview').each(function () {
                        if($(this).attr('id') != data.section_order) {
                            $(this).hide();
                        } else {
                            $(this).attr('data-prev', sectionOrderPrev);
                        }
                    })

                    $('.input-checkbox-other').on('click', function(event) {
                        checkCheckbox(this);
                    });

                    $('.input-multiple-choice-other').on('click', function(event) {
                        event.preventDefault();
                        checkRadio(this);
                    });

                    $('.input-answer-other').on('input', function() {
                        checkHideNoticeRequired(this);
                    })

                    $('.choice-answer').click(function() {
                        checkCheckboxCheckRequired(this);
                    })

                    autoAlignChoiceAndCheckboxIcon();
                    autoResizeTextarea();
                    hideLoaderSection();
                }
            })
        }

        return false;
    });

    $('.input-answer-other').on('input', function() {
        checkHideNoticeRequired(this);
    })

    $('.choice-answer').click(function() {
        checkCheckboxCheckRequired(this);
    })

    $('.content-section-preview').on('click', '.btn-action-preview-submit', function(event) {
        event.preventDefault();
        event.stopPropagation();
        var selector = $(this).closest('.ul-content-preview');

        if($('.page-doing-survey').is(':visible')) {
            if (!validateDoingSection(selector)) {
                return false;
            }
        }

        var redirect = $(this).attr('data-redirect');
        var dataUrl = $(this).attr('data-url');
        var obj = {};
        obj.survey_token = $('#id-survey-preview').attr('data-token');
        obj.email = '';
        obj.user_id = $('#user-id').attr('data-user-id');
        obj.sections = getSections();
        var result = JSON.stringify(obj);
        showLoaderSection();

        $.ajax({
            url: dataUrl,
            type: 'post',
            dataType: 'json',
            data: result,
        })
        .done(function(data) {
            if (data.success) {
                $(window).attr('location', redirect);
            } else {
                swal({
                    buttons: true,
                    text: data.message,
                    icon: 'error'
                }).then(function (isConfirm) {
                    if (isConfirm) {
                        window.location.reload();
                    } else {
                        hideLoaderSection();
                    }
                });
            }
        })

        return false;
    });

    $(document).on('keyup blur', '.short-answer-text', function() {
        var text = $(this).val();
        var countChar = text.length;

        if (countChar > 100) {
            $(this).closest('.li-question-review.form-line').find('.notice-max-length').addClass('show');
        } else {
            $(this).closest('.li-question-review.form-line').find('.notice-max-length').removeClass('show');
        }
    })

    function hideLoaderSection() {
        $('html, body').scrollTop(0);
        setTimeout(function() {
            $('#loader-section-survey-doing').removeClass('show');
            document.body.style.overflow = 'visible';
        }, 300);
    }

    function showLoaderSection() {
        $('#loader-section-survey-doing').addClass('show');
        document.body.style.overflow = 'hidden';
    }

    function checkCheckboxCheckRequired(selector) {
        if ($(selector).prop('checked') &&
            $(selector).closest('.li-question-review.form-line').find('.question-survey').hasClass('required-question')) {
            $(selector).closest('.li-question-review.form-line').find('.notice-required').hide();
        }
    }

    function checkHideNoticeRequired(selector) {
        if ($(selector).closest('.li-question-review.form-line').find('.question-survey').hasClass('required-question')) {
            if ($(selector).val()) {
                if ($(selector).closest('.magic-box-preview').length) {
                    $(selector).closest('.magic-box-preview').removeClass('change-css-required');
                } else {
                    $(selector).removeClass('change-css-required');
                }

                $(selector).closest('.li-question-review.form-line').find('.notice-required').hide();
            }
        }
    }

    function getSections() {
        var sections = [];

        $('.ul-content-preview').each(function() {
            var section = {};
            section.questions = getQuestions($(this).find('.question-survey'));
            sections.push(section);
        })

        return sections;
    }

    function getQuestions(selector) {
        var questions = [];

        $(selector).each(function() {
            var question = {};
            question.question_id = $(this).attr('data-id');
            question.type = $(this).attr('data-type');
            question.require = $(this).attr('data-required');
            element = $(this).closest('.li-question-review.form-line');
            question.results = getResults(element);
            questions.push(question);
        });

        return questions;
    }

    function getResults(element) {
        var results = [];
        var checkResult = false;

        $(element).find('.item-answer').each(function () {
            var answerId = $(this).attr('data-id');
            if (!answerId) {
                checkResult = true;
                var result = {};
                result.answer_id = '';
                result.answer_type = '';
                result.content = $(this).find('.input-answer-other').val();
                results.push(result);
            } else {
                var selectorAnswer = $(this).find('.choice-answer');
                var answerType = $(this).attr('data-type');

                if ($(selectorAnswer).is(':checked')) {
                    checkResult = true;
                    var result = {};
                    result.answer_id = answerId;
                    result.answer_type = answerType;
                    result.content = (answerType == 2) ? $(this).find('.input-answer-other').val() : '';
                    results.push(result);
                }
            }
        });

        if (!checkResult) {
            var result = {};
            result.answer_id = '';
            result.answer_type = '';
            result.content = '';
            results.push(result);
        }

        return results;
    }

    function validateDoingSection(selector) {
        var check = true;

        selector.find('.required-question').each(function() {
            var selectorQuestion = $(this).closest('.li-question-review.form-line');

            if (selectorQuestion.find('.answer-text').length &&
                !selectorQuestion.find('.answer-text').val()) {
                selectorQuestion.find('.input-answer-other').addClass('change-css-required');
                selectorQuestion.find('.magic-box-preview').addClass('change-css-required');
                $(selectorQuestion).find('.notice-required').show();
                check = false;
            }

            if (selectorQuestion.find('.choice-answer').length) {
                var checkChoiceAnswer = false;

                selectorQuestion.find('.choice-answer').each(function() {
                    if ($(this).prop('checked')) {
                        if ($(this).closest('.item-answer').attr('data-type') == 2) {
                            if (!$(this).closest('.item-answer').find('.option-other').val()) {
                                checkChoiceAnswer = false;
                                selectorQuestion.find('.magic-box-preview').addClass('change-css-required');
                            } else {
                                checkChoiceAnswer = true;
                            }
                        } else {
                            checkChoiceAnswer = true;
                        }
                    }
                });

                if (!checkChoiceAnswer) {
                    check = false;
                    $(selectorQuestion).find('.notice-required').show();
                } else {
                    selectorQuestion.find('.magic-box-preview').removeClass('change-css-required');
                    $(selectorQuestion).find('.notice-required').hide();
                }
            }

            if (selectorQuestion.find('.notice-max-length').is(':visible')) {
                check = false;
            }
        })

        if (!check) {
            $(selector).find('.notice-required, .notice-max-length').each(function() {
                if ($(this).is(':visible')) {
                    $('html, body').animate({
                        scrollTop: $(this).offset().top - 150
                    }, 1000);

                    return false;
                }
            })

            return false;
        }

        return true;
    }

    $('.answer-redirect').click(function() {
        if ($(this).prop('checked') &&
            $(this).closest('.li-question-review').find('.question-redirect').length) {
            $(this).closest('.li-question-review').find('.notice-required').hide();
        }
    })

    $(document).on('click', '.btn-action-preview-survey', function(event) {
        event.preventDefault();
        var currentRedirectId = $('input:hidden[name=redirect_id]').val();
        var answerRedirectId = 0;
        var location = '';

        if ($(this).hasClass('btn-action-next') && $('.content-section-preview').find('.question-redirect').length) {
            var checkQuestionRequire = false;

            $('.answer-redirect').each(function () {
                if ($(this).prop('checked')) {
                    checkQuestionRequire = true;
                    answerRedirectId = $(this).attr('redirect-id');

                    return;
                }
            });

            if (!checkQuestionRequire) {
                $('.content-section-preview').find('.notice-required').show();
            } else {
                showLoaderSection();
                hideLoaderSection();
                window.location = `${$(this).attr('href')}?answer_redirect_id=${answerRedirectId}`;
            }
        } else {
            showLoaderSection();
            hideLoaderSection();
            window.location = `${$(this).attr('href')}?current_redirect_id=${currentRedirectId}`;
        }
    });

    function checkCheckbox(selector) {
        event.preventDefault();
        var parent = $(selector).closest('.item-answer');
        var pictureSelector = $(parent).children('.img-preview-answer-survey');
        var inputSelector = $(parent).children('label').children('input');

        if ($(pictureSelector).length) {
            $(pictureSelector).css('border', '2px solid #43add1');
        }

        $(inputSelector).prop('checked', true);
    }

    function checkRadio(selector) {
        var parent = $(selector).closest('.item-answer');
        var pictureSelector = $(parent).children('.img-preview-answer-survey');
        var inputSelector = $(parent).children('label').children('input');

        if ($(pictureSelector).length) {
            $(pictureSelector).css('border', '2px solid #43add1');
        }

        $(inputSelector).prop('checked', true);

        $('.radio-answer-preview').each(function () {
            if (!$(selector).prop('checked')) {
                var selector = $(selector).parent('.container-radio-setting-survey')
                    .prev('.img-preview-answer-survey');

                if ($(selector).length) {
                    $(selector).css('border', 'none');
                }
            }
        })
    }
});

function getTimeZone(locale) {
    if (locale === 'vn') {
        return 'DD-MM-YYYY';
    }

    if (locale === 'jp') {
        return 'YYYY-MM-DD';
    }

    return 'MM-DD-YYYY';
}

// auto resize textarea
function autoResizeTextarea() {
    $.each($('textarea[data-autoresize], .input-answer-other'), function() {
        var offset = this.offsetHeight - this.clientHeight;

        var resizeTextarea = function(el) {
            $(el).css('height', 'auto').css('height', el.scrollHeight + offset);
        };

        $(this).on('keyup input', function() { resizeTextarea(this); }).removeAttr('data-autoresize');
    });
}
