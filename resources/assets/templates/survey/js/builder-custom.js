jQuery(document).ready(function () {
    // confirm when reload or leave page
    window.onbeforeunload = function() {
        return 'Confirm reload';
    }

    var questionSelected = null;
    var surveyData = $('#survey-data');
    var isClickSendSurvey = false;

    // get oldSsurveyData in edit-page
    if (surveyData.data('page') == 'edit') {
        var isUpdate = false;
        var oldSurveyData = getSections($('form.survey-form').serializeArray());
        var isUpdate = true;

        var sectionsUpdate = {};
        var questionsUpdate = {};
        var answersUpdate = {};

        var sectionsCreate = [];
        var questionsCreate = [];
        var answersCreate = [];

        var sectionsUpdateId = [];
        var questionsUpdateId = [];
        var answersUpdateId = [];

        $('.form-line').map(function() {
            var type = $(this).attr('data-question-type');
            var id = $(this).attr('id');

            if (id) {
                // add sortable to answer of question multiple choice
                if (type == 3) {
                    multipleChoiceSortable(id);
                }
                // add sortable to answer of question checkboxes
                if (type == 4) {
                    checkboxesSortable(id);
                }
            }
        })
    }

    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    function generateId() {
        return s4() + $.now();
    }

    function refreshSectionId() {
        surveyData.data('section-id', generateId());

        return surveyData.data('section-id');
    }

    function refreshQuestionId() {
        surveyData.data('question-id', generateId());

        return surveyData.data('question-id');
    }

    function refreshAnswerId() {
        surveyData.data('answer-id', generateId());

        return surveyData.data('answer-id');
    }

    function formSortable() {
        checkRemoveSort();

        $('.survey-form ul.sortable').sortable({
            axis: 'y',
            handle: '.draggable-area',
            cursor: 'move',
            classes: {
                'ui-sortable-helper': 'hightlight'
            },
            connectWith: '.page-section',
            items: '> li:not(:first, :last)',
            forcePlaceholderSize: true,
            cancel: 'li.remove-softable',
            start: function(e, ui) {
                if (ui.item.height() > 240) {
                    ui.item.offset(ui.placeholder.offset());
                    ui.item.height(240);
                    ui.placeholder.height(240);
                } else {
                    ui.placeholder.height(ui.item.height());
                }
                ui.item.find('.image-question-url').hide();
            },
            stop: function (event, ui) {
                $(ui.item).removeAttr('style');
                ui.item.find('.image-question-url').show();

                // when move question, refresh name of question follow new section
                var sectionId = ui.item.closest('ul.page-section.sortable').data('section-id');
                var questionId = ui.item.data('question-id');
                var name = `[section_${sectionId}][question_${questionId}]`;
                ui.item.find('.question-input').attr('name', 'title' + name);
                ui.item.find('.question-description-input').attr('name', 'description' + name);
                ui.item.find('.checkbox-question-required').attr('name', 'require' + name);
                ui.item.find('.image-question-hidden').attr('name', 'media' + name);
                ui.item.find('.input-image-section-hidden').attr('name', 'media' + name);
                ui.item.find('.video-section-url-hidden').attr('name', 'media' + name);

                checkRemoveSort();
            },
        });
    }

    function checkRemoveSort() {
        $('.survey-form ul.sortable').map(function() {
            var questions = $(this).find('li.form-line');

            if (questions.length <= 1) {
                questions.addClass('remove-softable');
            } else {
                questions.map(function() {
                    questions.removeClass('remove-softable');
                });
            }
        });
    }

    function multipleChoiceSortable(question) {
        $(`li#${question} .multiple-choice-block`).sortable({
            axis: 'y',
            handle: '.radio-choice-icon',
            containment: `#${question} .multiple-choice-block`,
            cursor: 'move',
            items: '.choice-sortable',
            classes: {
                'ui-sortable-helper': 'hightlight'
            },
            forcePlaceholderSize: true,
            start: function(e, ui) {
                ui.item.find('.answer-image-url').hide();
                ui.item.height(40);
                ui.placeholder.height(40);
            },
            stop: function (event, ui) {
                $(ui.item).removeAttr('style');
                ui.item.find('.answer-image-url').show();
            },
        });
    }

    function checkboxesSortable(question) {
        $(`li#${question} .checkboxes-block`).sortable({
            axis: 'y',
            handle: '.square-checkbox-icon',
            containment: `#${question} .checkboxes-block`,
            cursor: 'move',
            items: '.checkbox-sortable',
            classes: {
                'ui-sortable-helper': 'hightlight'
            },
            forcePlaceholderSize: true,
            start: function(e, ui) {
                ui.item.find('.answer-image-url').hide();
                ui.item.height(40);
                ui.placeholder.height(40);
            },
            stop: function (event, ui) {
                $(ui.item).removeAttr('style');
                ui.item.find('.answer-image-url').show();
            },
        });
    }

    function setScrollButtonTop(selector, offset) {
        var width = (this.window.innerWidth > 0) ? this.window.innerWidth : this.screen.width;
        if (width > 768) {
            selector.css('top', offset);
        } else {
            selector.css('top', '');
        }
    }

    function setScrollButtonTopByScroll(selector) {
        var currentScrollTop = $(this).scrollTop();
        var elementPosition = currentScrollTop + 5;
        setScrollButtonTop(selector, elementPosition);
    }

    // auto resize textarea
    function autoResizeTextarea() {
        $.each($('textarea[data-autoresize]'), function() {
            var offset = this.offsetHeight - this.clientHeight;

            var resizeTextarea = function(el) {
                $(el).css('height', 'auto').css('height', el.scrollHeight + offset);
            };

            $(this).on('keyup input', function() { resizeTextarea(this); }).removeAttr('data-autoresize');
        });
    }

    // validate url image
    function checkTimeLoadImage(e, t, i) {
        var o, i = i || 3e3,
            n = !1,
            r = new Image;
        r.onerror = r.onabort = function () {
            n || (clearTimeout(o), t('error'))
        }, r.onload = function () {
            n || (clearTimeout(o), t('success'))
        }, r.src = e, o = setTimeout(function () {
            n = !0, t('timeout')
        }, i)
    }

    // preview image in modal
    function setPreviewImage(src) {
        $('.img-preview-in-modal').attr('src', src);
    }

    // show messages validate in modal
    function showMessageImage(message, type) {
        $('.messages-validate-image').removeClass('hidden');
        $('.messages-validate-image').text(message);

        if (type == 'success') {
            $('.messages-validate-image').removeClass('messages-error');
            $('.messages-validate-image').addClass('messages-success');
        } else {
            $('.messages-validate-image').removeClass('messages-success');
            $('.messages-validate-image').addClass('messages-error');
        }
    }

    // check type file image
    function checkTypeImage(input) {
        var fileExtension = [
            'jpeg',
            'jpg',
            'png',
            'gif',
            'bmp',
            'svg',
        ];
        var fileName = input.name;
        var fileNameExt = fileName.substr(fileName.lastIndexOf('.') + 1);

        if ($.inArray(fileNameExt.toLowerCase(), fileExtension) == -1) {
            return false;
        }

        return true;
    }

    // validate video url, support youtube
    function validateVideoUrl(url) {
        var rulesURL = /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?=.*v=((\w|-){11}))(?:\S+)?$/;

        return url.match(rulesURL) ? RegExp.$1 : false;
    }

    // show messages video validate
    function showMessageVideo(message, type) {
        $('.messages-validate-video').removeClass('hidden');
        $('.messages-validate-video').text(message);

        if (type == 'success') {
            $('.messages-validate-video').removeClass('messages-error');
            $('.messages-validate-video').addClass('messages-success');
        } else {
            $('.messages-validate-video').removeClass('messages-success');
            $('.messages-validate-video').addClass('messages-error');
        }
    }

    // preview video in modal
    function setPreviewVideo(src, thumbnailVideo) {
        $('.video-preview').attr('src', src);
        $('.video-preview').attr('data-thumbnail', thumbnailVideo);
    }

    // upload image
    function uploadImage(formData, url) {
        $.ajax({
            method: 'POST',
            url: url,
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
        })
        .done(function (response) {
            if (response) {
                showMessageImage(Lang.get('lang.image_preview'), 'success');
                setPreviewImage(response);
            } else {
                showMessageImage(Lang.get('lang.upload_image_fail'));
                setPreviewImage('');
            }
        })
        .fail(function (response) {
            var errors = JSON.parse(response.responseText)
            showMessageImage(errors.image);
            setPreviewImage('');
        });
    }

    // reset modal image
    function resetModalImage() {
        $('.input-url-image').val('');
        $('.messages-validate-image').text('');
        $('.img-preview-in-modal').attr('src', '');
        $('.input-upload-image').val('');
    }

    // reset modal video
    function resetModalVideo() {
        $('.input-url-video').val('');
        $('.messages-validate-video').text('');
        $('.video-preview').attr('src', '');
        $('.video-preview').attr('data-thumbnail', '');
    }

    function showLoaderAnimation()
    {
        $('#send-modal-loader').addClass('show');
        $('body').append('<div class="modal-backdrop send-loader fade show"></div>');
        $('body').css('overflow', 'hidden');
    }

    function hideLoaderAnimation()
    {
        $('#send-modal-loader').removeClass('show');
        $('.send-loader').remove();
        $('body').css('overflow', '');
    }

    /**
     * Get survey data
     */

    // get all answers by question
    function getAnswers(data, parentElement, questionId, sectionId = 0) {
        var answers = [];

        $(parentElement).find('.element-content .option').each(function (index, element) {
            var answer = {};
            var answerId = $(element).data('answer-id');

            answer.id = answerId.toString();

            var content = data.find(item => item.name.includes(`answer[question_${questionId}][answer_${answerId}]`));
            answer.content = content !== undefined ? content.value : '';
            answer.content = answer.content.trim();

            var media = data.find(item => item.name.includes(`media[question_${questionId}][answer_${answerId}]`));
            answer.media = media !== undefined ? media.value : '';

            var type = 2; // Other option

            if ($(element).hasClass('choice-sortable') || $(element).hasClass('checkbox-sortable')) {
                type = 1; // Option
            }

            answer.type = type; // 1: Option, 2: Other option

            // get update status of answer in edit-page and get answers update data
            if (surveyData.data('page') == 'edit' && isUpdate) {
                answer.status = getUpdateStatusOfAnswer(sectionId, questionId, answer);
                var tempData = {};

                // if answer is no edit, small edit, and big edit
                if (answer.status == 0 || answer.status == 1) {
                    tempData.type = answer.type;
                    tempData.content = answer.content;
                    tempData.media = answer.media;

                    if (answer.status == 1) {
                        tempData.update = answer.status;
                    }

                    answersUpdate[answerId] = tempData;
                    answersUpdateId.push(answerId);
                } else if (answer.status == 2) {        // if is create
                    var oldSesion = collect(oldSurveyData).where('id', sectionId);
                    var oldQuestions = collect(!oldSesion.isEmpty() ? oldSesion.first().questions : []);
                    var oldQuestion = oldQuestions.where('id', questionId);

                    if (!oldQuestion.isEmpty()) {
                        answer.question_id = questionId;

                        answersCreate.push(answer);
                    }
                }

            }

            if (!$.isEmptyObject(answer)) {
                answers.push(answer);
            }
        });

        return answers;
    }

    // get all questions by section
    function getQuestions(data, parentElement, sectionId) {
        var questions = [];
        var orderQuestion = 0; // orderQuestion of edit page

        $(parentElement).find('li.form-line.sort').each(function (index, element) {
            var question = {};
            var questionId = $(element).data('question-id');

            question.id = questionId.toString();

            var title = data.find(item => item.name === `title[section_${sectionId}][question_${questionId}]`);
            question.title = title !== undefined ? title.value : '';

            var description = data.find(item => item.name === `description[section_${sectionId}][question_${questionId}]`);
            question.description = description !== undefined ? description.value : '';

            var media = data.find(item => item.name === `media[section_${sectionId}][question_${questionId}]`);
            question.media = media !== undefined ? media.value : '';

            var type = $(element).data('question-type');
            question.type = type;

            if (type == 5) {
                var dateFormat = $(element).find('.date-format-question').attr('data-dateformat');
                question.date_format = dateFormat;
            }

            // require if is redirect question
            if (type == 10) {
                question.require = 1;
            } else {
                var require = data.find(item => item.name === `require[section_${sectionId}][question_${questionId}]`);
                question.require = require !== undefined ? parseInt(require.value) : 0; // 0: No require, 1: Require
            }

            question.answers = getAnswers(data, element, questionId, sectionId);

            // get update status of question in edit-page and get questions update data
            if (surveyData.data('page') == 'edit' && isUpdate) {
                question.status = getUpdateStatusOfQuestion(sectionId, question);
                var tempData = {};
                ++ orderQuestion;

                // if questions is no edit, small edit, and big edit
                if (question.status == 0 || question.status == 1) {
                    tempData.title = question.title;
                    tempData.description = question.description;
                    tempData.media = question.media;
                    tempData.order = orderQuestion;
                    tempData.required = question.require;

                    if (question.status == 1) {
                        tempData.update = question.status;
                    }

                    if (type == 5) {
                        tempData.date_format = question.date_format;
                    }

                    questionsUpdate[questionId] = tempData;
                    questionsUpdateId.push(questionId);
                } else if (question.status == 2) {       // if is create
                    var oldSection = collect(oldSurveyData).where('id', sectionId);

                    if (!oldSection.isEmpty()) {
                        question.section_id = sectionId;
                        question.order = orderQuestion;

                        questionsCreate.push(question);
                    }
                }
            }

            if (!$.isEmptyObject(question)) {
                questions.push(question);
            }
        });

        return questions;
    }

    // get all sections
    function getSections(data) {
        var sections = [];
        var orderSection = 0;  // orderSection of edit page

        $('.survey-form ul.page-section.sortable').each(function (index, element) {
            var section = {};

            var sectionId = $(element).data('section-id');
            section.id = sectionId.toString();

            var title = data.find(item => item.name === `title[section_${sectionId}]`);
            section.title = title !== undefined ? title.value : '';

            var description = data.find(item => item.name === `description[section_${sectionId}]`);
            section.description = description !== undefined ? description.value : '';
            section.questions = getQuestions(data, element, sectionId);
            section.redirect_id = null; // temp default redirect id value

            if ($(element).closest('.redirect-section-block').length) {
                section.redirect_id = $(element).closest('.redirect-section-block').data('redirect-id');
            }

            // get update status of section in edit-page and get sections update data
            if (surveyData.data('page') == 'edit' && isUpdate) {
                section.status = getUpdateStatusOfSection(section);
                var tempData = {};
                ++ orderSection;

                // if sections is no edit, small edit, and big edit
                if (section.status == 0 || section.status == 1) {
                    tempData.title = section.title;
                    tempData.description = section.description;
                    tempData.order = orderSection;

                    if (section.status == 1) {
                        tempData.update = section.status;
                    }

                    sectionsUpdate[sectionId] = tempData;
                    sectionsUpdateId.push(sectionId);
                } else if (section.status == 2) {       // if is create
                    section.order = orderSection;
                    sectionsCreate.push(section);
                }
            }

            if (!$.isEmptyObject(section)) {
                sections.push(section);
            }
        });

        return sections;
    }

    // get all setting
    function getSettings() {
        var answerRequired = $('#survey-setting').attr('answer-required');
        var answerLimited = $('#survey-setting').attr('answer-limited');
        var reminderEmail = $('#survey-setting').attr('reminder-email');
        var nextTime = $('#survey-setting').attr('time');
        var privacy = $('#survey-setting').attr('privacy');

        var settings = {
            "answer_required" : answerRequired,
            "answer_limited" : answerLimited,
            "reminder_email" : {
                "type" : reminderEmail,
                "next_time" : nextTime
            },
            "privacy" : privacy
        }

        return settings;
    }

    //  get all member
    function getMembers() {
        var members = [];
        var membersData = $('#members-setting').attr('members-data');
        membersData = membersData.split('/').filter(Boolean);

        membersData.forEach(function (data) {
            data = data.split(',');
            var member = {};
            // data[0] - mail suggest, data[1] - role
            var mail = data[0].trim();
            var role = parseInt(data[1].trim());

            if (isEmail(mail) && !isNaN(role)) {
                member.email = mail;
                member.role = role;
                members.push(member);
            }
        });

        return members;
    }

    function getInvitedEmail() {
        var invitedEmail = {};
        subject = $('#invite-setting').attr('subject');

        if (!subject) {
            subject = $('#survey-title').val();
        }

        invitedEmail.subject = subject;
        invitedEmail.message = $('#invite-setting').attr('msg');

        emails = $('#invite-setting').attr('invite-data');
        invitedEmail.emails = emails.split('/').filter(Boolean);
        invitedEmail.send_mail_to_wsm = $('#invite-setting').attr('all');

        if (surveyData.data('page') == 'edit') {
            emailsAnswer = $('#invite-setting').attr('answer-data');
            invitedEmail.answer_emails = emailsAnswer.split('/').filter(Boolean);
        }

        return invitedEmail;
    }

    function getSurvey(data = []) {
        try {
            var obj = {};

            var title = data.find(item => item.name === 'title');
            obj.title = title !== undefined ? title.value : '';

            var startTime = data.find(item => item.name === 'start_time');
            obj.start_time = startTime !== undefined && startTime.value != '' ? moment(startTime.value, 'DD/MM/YYYY h:mm A').format('MM/DD/YYYY h:mm A') : '';

            var endTime = data.find(item => item.name === 'end_time');
            obj.end_time = endTime !== undefined && endTime.value != '' ? moment(endTime.value, 'DD/MM/YYYY h:mm A').format('MM/DD/YYYY h:mm A') : '';

            var description = data.find(item => item.name === 'description');
            obj.description = description !== undefined ? description.value : '';

            // invited emails
            obj.invited_email = getInvitedEmail();

            // settings
            obj.setting = getSettings();

            // members
            obj.members = getMembers();

            // sections
            obj.sections = getSections(data);

            return obj;
        } catch (error) {
            return null;
        }
    }

    // change question elements
    function changeQuestion(option) {
        var currentQuestion = option.closest('li.sort');
        var questionType = currentQuestion.data('question-type');
        var answers = [];
        var otherAnswers = false;

        if (questionType == 10) {
            option.closest('.redirect-question-block').find('.redirect-section-block').remove();
            option.closest('.form-wrapper.page-section').unwrap();
        }

        // get answers if is multi choice
        if (questionType == 3) {
            currentQuestion.find('.option.choice').each(function() {
                if (!$(this).hasClass('choice-sortable')) {
                    otherAnswers = true;

                    return;
                }

                answers.push($(this).find('.image-answer-hidden').prev().val());
            });
        }

        // get answers if is checkboxes
        if (questionType == 4) {
            currentQuestion.find('.option.checkbox').each(function() {
                if (!$(this).hasClass('checkbox-sortable')) {
                    otherAnswers = true;

                    return;
                }

                answers.push($(this).find('.image-answer-hidden').prev().val());
            });
        }

        var questionData = {
            'content': currentQuestion.find('.question-input').val(),
            'description': currentQuestion.find('.question-description-input').val()
        }

        imageURL = currentQuestion.find('.image-question-hidden').val();

        var sectionId = refreshSectionId();
        var questionId = refreshQuestionId();
        var questionType = option.data('type');
        var answerId = refreshAnswerId();

        if (window.questionSelected == null) {
            var endSection = $('.survey-form').find('ul.sortable').last().find('.end-section').first();
            sectionId = endSection.closest('ul.page-section.sortable').data('section-id');
        } else {
            sectionId = window.questionSelected.closest('ul.page-section.sortable').data('section-id');
        }

        $.ajax({
            method: 'POST',
            url: option.data('url'),
            data : {
                sectionId: sectionId,
                questionId: questionId,
                answerId: answerId,
                imageURL: imageURL,
            }
        })
        .done(function (data) {
            if (data.success) {
                var element = $('<div></div>').html(data.html).children().first();

                if (window.questionSelected === null) {
                    window.questionSelected = $(element).insertBefore(endSection);
                } else {
                    // remove validation tooltip
                    currentQuestion.find('textarea[data-toggle="tooltip"], input[data-toggle="tooltip"]').each(function () {
                        $(`#${$(this).attr('aria-describedby')}`).remove();
                    });

                    currentQuestion.replaceWith(element);
                    window.questionSelected = element;
                }

                window.questionSelected.find('div.survey-select-styled').
                    html(window.questionSelected.find(`ul.survey-select-options li[data-type="${questionType}"]`).html());
                window.questionSelected.click();

                // add sortable event for multiple choice
                if (questionType == 3) {
                    multipleChoiceSortable(`question_${questionId}`);
                    if (answers.length) {
                        element.find('.option.choice .image-answer-hidden').prev().val(answers[0]);

                        for (var i = 0; i < answers.length - 1; i++) {
                            element.find('.other-choice .other-choice-block .add-choice').click();
                            element.find('.option.choice .image-answer-hidden').last().prev().val(answers[i + 1]);
                        }
                    }

                    if (otherAnswers) {
                        element.find('.add-other-choice').click();
                    }
                }

                // add sortable event for checkboxes
                if (questionType == 4) {
                    checkboxesSortable(`question_${questionId}`);
                    if (answers.length) {
                        element.find('.option.checkbox .image-answer-hidden').prev().val(answers[0]);

                        for (var i = 0; i < answers.length - 1; i++) {
                            element.find('.other-checkbox .other-checkbox-block .add-checkbox').click();
                            element.find('.option.checkbox .image-answer-hidden').last().prev().val(answers[i + 1]);
                        }
                    }

                    if (otherAnswers) {
                        element.find('.add-other-checkbox').click();
                    }
                }

                // auto resize for new textarea
                autoResizeTextarea();

                // set old question value
                var image = data.image
                $(image).insertAfter(element.find('.description-input'));

                element.find('.question-input').val(questionData['content']);
                element.find('.question-input').keyup();
                element.find('.answer-option-input').keyup();

                if (questionData['description']) {
                    element.find('.question-description-input').val(questionData['description']);
                    element.find('.description-input').addClass('active');
                    element.find('.option-menu-selected').addClass('active');
                    element.find('.question-description-input').keyup();
                }

                // add validation rules for question
                addValidationRuleForQuestion(questionId);
            }
        });
    }

    // change redirect question element
    function changeRedirectQuestion(option)
    {
        var currentQuestion = option.closest('li.sort');
        var isRediectSection = currentQuestion.closest('.redirect-section-block').length;

        if (isRediectSection > 0) {
            alertWarning({message: Lang.get('lang.redirect_message.can_not_add_redirect')});

            return;
        }

        var isHasRedirectQuestion = currentQuestion.closest('.redirect-question-block').length;

        if (isHasRedirectQuestion > 0) {
            alertWarning({message: Lang.get('lang.redirect_message.only_can_contain_one_redirect')});

            return;
        }

        var questionData = {
            'content': currentQuestion.find('.question-input').val(),
            'description': currentQuestion.find('.question-description-input').val()
        }

        var imageURL = currentQuestion.find('.image-question-hidden').val();
        var questionType = option.data('type');
        var sectionId = null;
        var questionId = refreshQuestionId();
        var redirectSectionData = [];
        redirectSectionData.push(makeRedirectSectionData());
        redirectSectionData.push(makeRedirectSectionData());

        if (window.questionSelected == null) {
            var endSection = $('.survey-form').find('ul.sortable').last().find('.end-section').first();
            sectionId = endSection.closest('ul.page-section.sortable').data('section-id');
        } else {
            sectionId = window.questionSelected.closest('ul.page-section.sortable').data('section-id');
        }

        $.ajax({
            method: 'POST',
            url: option.data('url'),
            data : {
                sectionId: sectionId,
                questionId: questionId,
                imageURL: imageURL,
                redirectSectionData: redirectSectionData
            }
        })
        .done(function (data) {
            if (data.success) {
                // append redirect question
                option.closest('.form-wrapper.page-section').wrap('<div class="redirect-question-block"></div>');
                var parentElement = option.closest('.redirect-question-block');
                var redirectQuestionElement = $('<div></div>').html(data.view_question).children().first();
                var sectionIndex = parentElement.prevAll('.page-section, .redirect-question-block').length + 1;

                // append redirect question
                data.view_sections.forEach(function (section, index) {
                    parentElement.append(section);
                    parentElement.find('.redirect-section-block .section-index').last().html(`${sectionIndex}.${index + 1}.1`);
                });

                parentElement.find('.redirect-section-block').data('number-redirect-section', 1);
                parentElement.find('.redirect-section-block .total-section').html(1);

                if (window.questionSelected === null) {
                    window.questionSelected = $(redirectQuestionElement).insertBefore(endSection);
                } else {
                    // remove validation tooltip
                    currentQuestion.find('textarea[data-toggle="tooltip"], input[data-toggle="tooltip"]').each(function () {
                        $(`#${$(this).attr('aria-describedby')}`).remove();
                    });

                    currentQuestion.replaceWith(redirectQuestionElement);
                    window.questionSelected = redirectQuestionElement;
                }

                window.questionSelected.find('div.survey-select-styled').
                    html(window.questionSelected.find(`ul.survey-select-options li[data-type="${questionType}"]`).html());
                window.questionSelected.click();

                // auto resize for new textarea
                autoResizeTextarea();

                // set old question value
                var image = data.image
                $(image).insertAfter(redirectQuestionElement.find('.description-input'));

                redirectQuestionElement.find('.question-input').val(questionData['content']);
                redirectQuestionElement.find('.question-input').keyup();
                redirectQuestionElement.find('.answer-option-input').keyup();

                if (questionData['description']) {
                    redirectQuestionElement.find('.question-description-input').val(questionData['description']);
                    redirectQuestionElement.find('.description-input').addClass('active');
                    redirectQuestionElement.find('.option-menu-selected').addClass('active');
                    redirectQuestionElement.find('.question-description-input').keyup();
                }

                // add validation rules for question
                addValidationRuleForQuestion(questionId);

                // add validation rules for answer and section redirect
                redirectSectionData.forEach(function (redirectSection) {
                    addValidationRuleForAnswer(redirectSection.answerRedirectId);
                    addValidationRuleForSection(redirectSection.sectionId);
                    addValidationRuleForQuestion(redirectSection.questionId);
                    addValidationRuleForAnswer(redirectSection.answerId);

                    var color = makeRandomRedirectColor();
                    $(`.redirect-choice-${redirectSection.answerRedirectId}`).css('color', color).attr('color', color);
                    $(`.redirect-section-${redirectSection.answerRedirectId}`).css('border-color', color);
                    $(`.redirect-section-label-${redirectSection.answerRedirectId}`).css('border-color', color).css('background', color);
                });
            }
        });
    }

    // make redirect section data for redirect question
    function makeRedirectSectionData()
    {
        return {
            answerRedirectId: refreshAnswerId(),
            sectionId: refreshSectionId(),
            questionId: refreshQuestionId(),
            answerId: refreshQuestionId(),
        }
    }

    // make random color for redirect question
    function makeRandomRedirectColor() {
        var color = '#fff';
        var check = true;

        while (check) {
            color = '#' + Math.floor(Math.random() * 16777215).toString(16);
            check = false;

            $('.redirect-choice .radio-choice-icon').each(function () {
                if ($(this).attr('color') == color) {
                    check = true;

                    return;
                }
            });
        }

        return color;
    }

    /**
     * Scroll to question element (question, image, video)
     */

    function scrollToQuestion(questionId) {
        $('.survey-form').one('click', '#question_' + questionId, function() {
            $('html, body').animate({scrollTop: $(this).offset().top - 80}, 1200);
        });

        $('#question_' + questionId).click();
    }

    /**
     * Scroll to section
     */

    function scrollToSection(sectionId) {
        $('.survey-form').one('click', '#section_' + sectionId, function() {
            $('html, body').animate({scrollTop: $(this).offset().top - 80}, 1200);
        });

        $('#section_' + sectionId).click();
    }

    /**
     * Remove element
     */

    function removeElement(event, element) {
        event.preventDefault();
        window.questionSelected = element.closest('li.question-active').prev('li.form-line.sort');

        if (!window.questionSelected.length) {
            window.questionSelected = element.closest('li.question-active').next('li.form-line.sort');
        }

        // remove validation tooltip
        element.closest('li.form-line').find('textarea[data-toggle="tooltip"], input[data-toggle="tooltip"]').each(function () {
            $(`#${$(this).attr('aria-describedby')}`).remove();
        });
        element.closest('li.form-line').fadeOut(300).remove();
        window.questionSelected.click();
    }

    /**
     * Survey validation
     */

    $.validator.setDefaults({
        errorPlacement: function(error, element) {
            if (!$(element).hasClass('datetimepicker-input')) {
                $(element).attr('data-toggle', 'tooltip');
                $(element).attr('data-original-title', error.text());
                $(element).attr('data-placement', 'auto');
                $(element).attr('data-template', `
                    <div class="tooltip" role="tooltip">
                        <div class="arrow tooltip-arrow-validate"></div>
                        <div class="tooltip-inner tooltip-inner-validate"></div>
                    </div>
                `);
                $('.errorHighlight[data-toggle="tooltip"]').tooltip('show');
            } else if ($(element).hasClass('start-time')) {
                $('#start-time-error').text(error.text());
            } else {
                $('#end-time-error').text(error.text());
            }

            $('html, body').animate({scrollTop: $('.errorHighlight').offset().top - 100}, 500);
        },
        highlight: function(element){
            $(element).removeClass("successHighlight");
            $(element).addClass("errorHighlight");
        },
        unhighlight: function(element){
            $(element).removeClass("errorHighlight");
            $(element).addClass("successHighlight");

            if (!$(element).hasClass('datetimepicker-input')) {
                $(element).removeAttr('data-original-title');
                $(element).removeAttr('data-placement');
                $(element).removeAttr('data-template');
                $(`#${$(element).attr('aria-describedby')}`).remove();
            } else if ($(element).hasClass('start-time')) {
                $('#start-time-error').empty();
            } else {
                $('#end-time-error').empty();
            }
        }
    });

    // validate custom rules
    $.validator.addMethod('start_time_after_now', function (value, element) {
        var today = new Date();
        var dateChoose = value;

        dateChoose = dateChoose.split('/')[1] + '-' + dateChoose.split('/')[0] + dateChoose.substring(5);

        var startTime = new Date(Date.parse(dateChoose));
        var validateTime = today.getTime() - startTime.getTime();

        if (!startTime.length && startTime.getTime() <= today.getTime() && validateTime > 60000) {
            return false;
        }

        return true;
    }, Lang.get('validation.msg.start_time_after_now'));

    $.validator.addMethod('more_than_30_minutes', function (value, element) {
        var today = new Date();
        var dateChoose = value;

        dateChoose = dateChoose.split('/')[1] + '-' + dateChoose.split('/')[0] + dateChoose.substring(5);

        var endTime = new Date(Date.parse(dateChoose));
        var validateTime = endTime.getTime() - today.getTime();

        if (!endTime.length && validateTime < 1800000) {
            return false;
        }

        return true;
    }, Lang.get('validation.msg.more_than_30_minutes'));

    $.validator.addMethod('after_start_time', function (value, element) {
        var startTime = $('#start-time').val();

        if (!startTime.length) {
            return true;
        }

        var dateChoose = value;
        startTime = startTime.split('/')[1] + '-' + startTime.split('/')[0] + startTime.substring(5);
        dateChoose = dateChoose.split('/')[1] + '-' + dateChoose.split('/')[0] + dateChoose.substring(5);

        startTime = new Date(Date.parse(startTime));
        var endTime = new Date(Date.parse(dateChoose));
        var validateTime = endTime.getTime() - startTime.getTime();

        if (!endTime.length && validateTime <= 0) {
            return false;
        }

        return true;
    }, Lang.get('validation.msg.after_start_time'));

    // section unique rule
    $.validator.addMethod('sectionunique', function (value, element) {
        var parentForm = $(element).closest('form');
        var timeRepeated = 0;

        if (value.trim()) {
            $(parentForm.find('div.form-header textarea:regex(name, ^title\\[section_.*\\]$)')).each(function () {
                if ($(this).val() === value) {
                    timeRepeated++;
                }
            });
        }

        return timeRepeated === 1 || timeRepeated === 0;

    }, Lang.get('validation.msg.duplicate_section_title'));

    // question unique rule
    $.validator.addMethod('questionunique', function (value, element) {
        var parentForm = $(element).closest('form');
        var timeRepeated = 0;

        if (value.trim()) {
            $(parentForm.find('li.form-line.sort div.form-row textarea:regex(name, ^title\\[section_.*\\]\\[question_.*\\]$)')).each(function () {
                if ($(this).val() === value) {
                    timeRepeated++;
                }
            });
        }

        return timeRepeated === 1 || timeRepeated === 0;

    }, Lang.get('validation.msg.duplicate_question_title'));

    // answer unique rule
    $.validator.addMethod('answerunique', function (value, element) {
        var parentForm = $(element).closest('li div.element-content');
        var timeRepeated = 0;

        if (value.trim()) {
            $(parentForm.find('textarea:regex(name, ^answer\\[question_.*\\]\\[answer_.*\\]\\[option_.*\\]$)')).each(function () {
                if ($(this).val() === value) {
                    timeRepeated++;
                }
            });
        }

        return timeRepeated === 1 || timeRepeated === 0;

    }, Lang.get('validation.msg.duplicate_answer_title'));

    // add validation rule for section input element
    function addValidationRuleForSection(sectionId) {
        $(`#section_${sectionId} textarea:regex(name, ^title\\[section_.*\\]$)`).each(function () {
            $(this).rules('add', {
                required: true,
                maxlength: 255,
                sectionunique: true,
            });
        });
    }

    // add validation rule for question input element
    function addValidationRuleForQuestion(questionId) {
        $(`#question_${questionId} textarea:regex(name, ^title\\[section_.*\\]\\[question_.*\\]$)`).each(function () {
            $(this).rules('add', {
                required: true,
                maxlength: 255,
                questionunique: true,
            });
        });
    }

    // add validation rule for answer input element
    function addValidationRuleForAnswer(answerId) {
        $(`#answer_${answerId} textarea:regex(name, ^answer\\[question_.*\\]\\[answer_.*\\]\\[option_.*\\]$)`).each(function () {
            $(this).rules('add', {
                required: true,
                maxlength: 255,
                answerunique: true,
            });
        });
    }

    // validation i18n
    $.extend($.validator.messages, {
        required: Lang.get('validation.msg.required'),
        maxlength: $.validator.format(Lang.get('validation.msg.maxlength'))
    } );

    var form = $(".survey-form");

    if (surveyData.data('page') === 'create' || $('#update-survey-draft').length) {
        var validator = form.validate({
            debug: false,
            rules: {
                title: {
                    required: true,
                    maxlength: 255
                },
                end_time: {
                    more_than_30_minutes: true,
                    after_start_time: true
                },
                start_time: {
                    start_time_after_now: true
                },
            }
        });
    } else {
        var validator = form.validate({
            debug: false,
            rules: {
                title: {
                    required: true,
                    maxlength: 255
                },
            }
        });
    }

    function validateSurvey() {
        if (!form.valid()) {
            return false;
        }

        return true;
    }

    /* Selecting form components*/
    $('.survey-form').on('click', 'ul.sortable li.sort', function () {
        $('.form-line').removeClass('liselected');
        $(this).addClass('liselected');
        setScrollButtonTop($('.button-group-sidebar'), $(this).position().top - 96);
        window.questionSelected = $(this);
    });

    // This is for resize window
    $(function () {
        // auto resize textarea
        autoResizeTextarea();

        // add new section when page loaded
        if (surveyData.data('page') === 'create') {
            $('#add-section-btn').click();
        }

        $(window).bind('load resize', function () {
            var width = (this.window.innerWidth > 0) ? this.window.innerWidth : this.screen.width;
            if (width < 1170) {
                $('body').addClass('content-wrapper');
            } else {
                $('body').removeClass('content-wrapper');
            }
        });
    });

    /* Datetimepicker */

    $('#start-time').datetimepicker({
        format: 'DD/MM/YYYY h:mm A',
    });

    $('#end-time').datetimepicker({
        format: 'DD/MM/YYYY h:mm A',
    });

    $('#start-time').data('datetimepicker').date(new Date($('#start-time').data('time')));
    $('#end-time').data('datetimepicker').date(new Date($('#end-time').data('time')));

    // select start-time
    $('.page-section-header').on('change.datetimepicker', '#start-time', function (e) {
        if ($(this).val() == '') {
            $('#end-time').data('datetimepicker').clear();

            return;
        }

        var dateSelect = new Date(e.date);
        var dateNow = new Date();
        var diffdateNow = Math.round((dateNow - dateSelect) / (1000 * 60));

        // if start-time select <= time now
        if (diffdateNow >= 0) {
            // start-time must after time now 30 min
            dateSelect =  new Date(dateNow.getTime() + 30 * 1000 * 60);
            $(this).data('datetimepicker').date(dateSelect);

            return;
        }
    });

    // select end-time
    $('.page-section-header').on('change.datetimepicker', '#end-time', function (e) {
        if ($(this).val() == '') {
            return;
        }

        var dateSelect = new Date(e.date);
        var startDate = $('#start-time').val();

        // if start-time is empty then add start-time
        if (startDate == '') {
            $('#start-time').data('datetimepicker').date(new Date());
            startDate = $('#start-time').val();
        }

        startDate = startDate.split('/')[1] + '-' + startDate.split('/')[0] + startDate.substring(5);
        startDate = new Date(startDate);
        var diffdateNow = Math.round((startDate - dateSelect) / (1000 * 60));

        // if end-time select <= start-time
        if (diffdateNow >= 0) {
            // end-time must after start-time now 30 min
            dateSelect =  new Date(startDate.getTime() + 30 * 1000 * 60);
            $(this).data('datetimepicker').date(dateSelect);
        }
    });

    $('#next-remind-time').datetimepicker({
        format: 'DD/MM/YYYY h:mm A',
    });

    /**
     * Scroll button
     */

    $(window).scroll(function() {
        setScrollButtonTopByScroll($('.button-group-sidebar'));
    });

    $(window).resize(function() {
        setScrollButtonTopByScroll($('.button-group-sidebar'));
    });

    /**
     * Form sortable
     */

    formSortable();

    /**
     * Select text in the input element when focus
     */

    $('.survey-form').on('focus', '.page-section input', function (e) {
        $(this).select();
    });

    $('.content-wrapper form').on('click', '.remove-element', function (event) {
        event.preventDefault();
        event.stopPropagation();

        var element = $(this);
        var question = element.closest('.page-section.sortable.ui-sortable').find('li.form-line.sort');
        var section = $('.page-section.sortable.ui-sortable');

        // if just have 1 question in section
        if (question.length == 1) {
            // if just have 1 section in page, then can not delete
            if (section.length == 1) {
                alertDanger({message: Lang.get('lang.can_not_remove_last_question')})

                return false;
            }

            selectSection = element.closest('.page-section.sortable.ui-sortable').prev('.page-section.sortable.ui-sortable');

            if (!selectSection.length) {
                selectSection = element.closest('.page-section.sortable.ui-sortable').next('.page-section.sortable.ui-sortable');
            }

            selectSection.find('li.form-line.sort').click();
            element.closest('.page-section.sortable.ui-sortable').find('.delete-section').click();

            return false;
        }

        if ($(element).closest('li.form-line.sort').find('.question-input').val() != '') {
            confirmWarning({message: Lang.get('lang.confirm_remove_question')}, function () {
                removeElement(event, element);
            });
        } else {
            removeElement(event, element);
        }
    });

    // dropdown menu select element
    $('.survey-form').on('click', '.survey-select-styled', function(e) {
        e.stopPropagation();
        $('.survey-select-options').hide();
        $('ul.option-menu-dropdown').hide();
        $('.section-select-options').hide();
        $('div.survey-select-styled.active').not(this).each(function() {
            $(this).removeClass('active').next('ul.survey-select-options').hide();
        });
        $(this).toggleClass('active').next('ul.survey-select-options').toggle();
    });

    $('.survey-form').on('click', '.survey-select-options li', function(e) {
        e.stopPropagation();
        $('div.survey-select-styled').html($(this).html()).removeClass('active');
        $('.survey-select-options').hide();
        $('.survey-select-styled').removeClass('active');

        // change question type and content
        if ($(this).data('type') == 10) {
            changeRedirectQuestion($(this));

            return;
        }

        changeQuestion($(this));
    });

    $(document).click(function() {
        $('.survey-select-styled').removeClass('active');
        $('.survey-select-options').hide();
    });

    // required btn
    $('.survey-form').on('click', '.question-required-checkbox label .toggle', function () {
        $(this).toggleClass('active');
        var checked = $(this).prev().attr('checked');
        $(this).prev().attr('checked', !checked);
        $(this).prev().val(checked ? 0 : 1);
    });

    // hide-show element block
    $('.survey-form').on('click', '.page-section .form-line', function () {
        $('.form-line').each(function () {
            $(this).removeClass('question-active');
            $(this).find('.question-input').addClass('active');
            $(this).find('.question-input').parent().addClass('col-xl-12');
            $(this).find('.element-content').removeClass('hidden');
            $(this).find('.question-description-input').removeClass('hidden');
            $(this).find('.question-description-input').addClass('active');

            // mark question required
            markQuestionRequired();
        });

        $(this).closest('.survey-form').find('.zoom-btn').removeClass('zoom-out-btn');
        $(this).closest('.survey-form').find('.zoom-btn').addClass('zoom-in-btn');
        $(this).addClass('question-active');
        $(this).find('.question-input').removeClass('active');
        $(this).find('.question-input').parent().removeClass('col-xl-12');
        $(this).find('.question-description-input').removeClass('active');
    });

    $('.survey-form').on('focus', '.question-input', function () {
        $(this).parent().parent().parent().click();
    });

    // survey option menu
    $('.survey-form').on('click', '.option-menu-group', function(e) {
        e.stopPropagation();
        $('.survey-select-options').hide();
        $('ul.option-menu-dropdown').hide();
        $('.section-select-options').hide();
        hideMenuSection();
        $(this).children('.option-menu').toggleClass('active').next('ul.option-menu-dropdown').toggle();

        return false;
    });

    $(document).click(function() {
        $('.option-menu').removeClass('active');
        $('.option-menu-dropdown').hide();
    });

    $('.survey-form').on('click', '.option-menu-dropdown li', function(e) {
        e.stopPropagation();
        $(this).children('.option-menu-selected').toggleClass('active');
        $(this).parent().hide();

        if ($(this).children('.option-menu-selected').hasClass('active')) {
            $(this).closest('li.form-line').find('.description-input').addClass('active');
        } else {
            $(this).closest('li.form-line').find('.description-input .question-description-input').val('');
            $(this).closest('li.form-line').find('.description-input').removeClass('active');
        }

        $(this).closest('li.form-line').find('.description-input .question-description-input').keyup();
    });

    $('.survey-form').on('keydown', '.question-input, .question-description-input', function(e) {
        if (((e.keyCode || e.which) === 13) && !e.shiftKey) {
            return false;
        }
    });

    /**
     * multiple choice
     */

    $('.survey-form').on('keydown', '.form-line .multiple-choice-block .choice', function (e) {
        if ($(this).hasClass('other-choice-option')) {
            return;
        }

        if (e.keyCode === 13 && !e.shiftKey) {
            // reshow remove button when copy answer element from first element
            $(this).find('.remove-choice-option').removeClass('hidden');

            var nextElement = $(this).clone().insertAfter($(this));

            var questionElement = $(this).closest('li.form-line.sort');
            var questionId = questionElement.data('question-id');
            var answerId = refreshAnswerId();
            nextElement.data('answer-id', answerId);
            nextElement.attr('id', `answer_${answerId}`);
            var numberOfAnswers = questionElement.data('number-answer');
            var optionId = numberOfAnswers + 1;
            nextElement.data('option-id', optionId);
            questionElement.data('number-answer', numberOfAnswers + 1);

            // remove image answer
            nextElement.find('div.image-answer').remove();

            // show image button for answer element
            nextElement.find('.upload-choice-image').removeClass('invisible');

            // change and reset input, image value, focus, select
            var image = nextElement.find('input.image-answer-hidden');
            image.attr('name', `media[question_${questionId}][answer_${answerId}][option_${optionId}]`);
            image.val('');

            var input = nextElement.find('.answer-option-input');
            input.attr('name', `answer[question_${questionId}][answer_${answerId}][option_${optionId}]`);
            input.val(Lang.get('lang.option', {index: nextElement.index() + 1}));
            input.attr('data-autoresize', 'data-autoresize');
            autoResizeTextarea();
            input.select();
            input.focus();

            // add validation rule for answer input element
            addValidationRuleForAnswer(answerId);
            e.preventDefault();
        } else if (e.keyCode == 8 || e.keyCode == 46) {
            var currentInput = $(this).find('.answer-option-input');
            var previousElement = $(this).prev();

            if (!currentInput.val() && $(this).parent().find('.choice').length > 1) {
                var parentElement = $(this).closest('.multiple-choice-block');
                $(this).fadeOut(500).remove();

                if (parentElement.find('.remove-choice-option').length <= 1) {
                    parentElement.find('.remove-choice-option').addClass('hidden');
                }

                // focus next element
                previousElement.find('.answer-option-input').select();
                // deny key action
                e.preventDefault();
            }
        }
    });

    $('.survey-form').on('click', '.form-line .multiple-choice-block .choice', function (e) {
        var input = $(this).find('.answer-option-input');
        input.select();

        if (input.val() == '') {
            input.val(Lang.get('lang.option', {index: $(this).index() + 1}));
        }
    });

    // remove choice option
    $('.survey-form').on('click', '.form-line .multiple-choice-block .remove-choice-option', function (e) {
        e.preventDefault();
        var option = $(this).closest('.choice.choice-sortable');

        if ($(this).closest('.multiple-choice-block').find('.choice.choice-sortable').length > 1) {
            var parentElement = option.closest('.multiple-choice-block');
            option.fadeOut(500).remove();

            if (parentElement.find('.remove-choice-option').length <= 1) {
                parentElement.find('.remove-choice-option').addClass('hidden');
            }
        }
    });

    $('.survey-form').on('click', '.form-line .multiple-choice-block .remove-other-choice-option', function (e) {
        e.preventDefault();
        var option = $(this).closest('.choice');
        $(this).closest('.multiple-choice-block').find('.other-choice .other-choice-btn').first().removeClass('hidden');
        option.fadeOut(500).remove();
    });

    $('.survey-form').on('click', '.form-line .multiple-choice-block .other-choice .other-choice-block .add-choice', function (e) {
        var multipleChoiceBlock = $(this).closest('.multiple-choice-block');
        var choice = $(this).closest('.multiple-choice-block').find('.choice').first();
        var nextElement;

        otherChoiceOption = multipleChoiceBlock.find('.other-choice-option');

        if (otherChoiceOption.length) {
            nextElement = choice.clone().insertBefore(otherChoiceOption);
        } else {
            nextElement = choice.clone().insertBefore($(this).closest('.other-choice'));
        }


        // reshow remove button when copy answer element from first element
        $(this).closest('li.form-line.sort').find('.remove-choice-option').removeClass('hidden');

        var questionElement = $(this).closest('li.form-line.sort');
        var questionId = questionElement.data('question-id');
        var answerId = refreshAnswerId();
        nextElement.data('answer-id', answerId);
        nextElement.attr('id', `answer_${answerId}`);
        var numberOfAnswers = questionElement.data('number-answer');
        var optionId = numberOfAnswers + 1;
        nextElement.data('option-id', optionId);
        questionElement.data('number-answer', numberOfAnswers + 1);

        // remove image answer
        nextElement.find('div.image-answer').remove();

        // show image button for answer element
        nextElement.find('.upload-choice-image').removeClass('invisible');

        // change and reset input, image value, focus, select
        var image = nextElement.find('input.image-answer-hidden');
        image.attr('name', `media[question_${questionId}][answer_${answerId}][option_${optionId}]`);
        image.val('');

        var input = nextElement.find('.answer-option-input');
        input.attr('name', `answer[question_${questionId}][answer_${answerId}][option_${optionId}]`);
        input.val(Lang.get('lang.option', {index: nextElement.index() + 1}));
        input.select();
        input.focus();

        // add validation rule for answer input element
        addValidationRuleForAnswer(answerId);
    });

    $('.survey-form').on('click', '.form-line .multiple-choice-block .other-choice .other-choice-block .add-other-choice', function (e) {
        var multipleChoiceBlock = $(this).closest('.multiple-choice-block');

        if (!multipleChoiceBlock.find('.other-choice-option').first().length) {
            var otherChoice = $(this).closest('.other-choice');
            var otherChoiceOption = $('#element-clone').find('.other-choice-option').clone();
            otherChoiceOption.insertBefore(otherChoice);
            otherChoice.find('.other-choice-btn').addClass('hidden');

            var questionElement = multipleChoiceBlock.closest('li.form-line.sort');
            var questionId = questionElement.data('question-id');
            var answerId = refreshAnswerId();
            otherChoiceOption.data('answer-id', answerId);
            otherChoiceOption.attr('id', `answer_${answerId}`);
            var numberOfAnswers = questionElement.data('number-answer');
            var optionId = numberOfAnswers + 1;
            otherChoiceOption.attr('data-option-id', optionId);
            questionElement.data('number-answer', numberOfAnswers + 1);

            var input = otherChoiceOption.find('.answer-option-input');
            input.attr('name', `answer[question_${questionId}][answer_${answerId}][option_${optionId}]`);
        }
    });

    /**
     * checkboxes
     */

    $('.survey-form').on('keydown', '.form-line .checkboxes-block .checkbox', function (e) {
        if ($(this).hasClass('other-checkbox-option')) {
            return;
        }

        if (e.keyCode === 13 && !e.shiftKey) {
            // reshow remove button when copy answer element from first element
            $(this).find('.remove-checkbox-option').removeClass('hidden');

            var nextElement = $(this).clone().insertAfter($(this));

            var questionElement = $(this).closest('li.form-line.sort');
            var questionId = questionElement.data('question-id');
            var answerId = refreshAnswerId();
            nextElement.data('answer-id', answerId);
            nextElement.attr('id', `answer_${answerId}`);
            var numberOfAnswers = questionElement.data('number-answer');
            var optionId = numberOfAnswers + 1;
            nextElement.data('option-id', optionId);
            questionElement.data('number-answer', numberOfAnswers + 1);

            // remove image answer
            nextElement.find('div.image-answer').remove();

            // show image button for answer element
            nextElement.find('.upload-checkbox-image').removeClass('invisible');

            // change and reset input, image value, focus, select
            var image = nextElement.find('input.image-answer-hidden');
            image.attr('name', `media[question_${questionId}][answer_${answerId}][option_${optionId}]`);
            image.val('');

            var input = nextElement.find('.answer-option-input');
            input.attr('name', `answer[question_${questionId}][answer_${answerId}][option_${optionId}]`);
            input.val(Lang.get('lang.option', {index: nextElement.index() + 1}));
            input.attr('data-autoresize', 'data-autoresize');
            autoResizeTextarea();
            input.select();
            input.focus();

            // add validation rule for answer input element
            addValidationRuleForAnswer(answerId);
            e.preventDefault();
        } else if (e.keyCode == 8 || e.keyCode == 46) {
            var currentInput = $(this).find('.answer-option-input');
            var previousElement = $(this).prev();

            if (!currentInput.val() && $(this).parent().find('.checkbox').length > 1) {
                var parentElement = $(this).closest('.checkboxes-block');
                $(this).fadeOut(500).remove();

                if (parentElement.find('.remove-checkbox-option').length <= 1) {
                    parentElement.find('.remove-checkbox-option').addClass('hidden');
                }

                // focus next element
                previousElement.find('.answer-option-input').select();
                // deny key action
                e.preventDefault();
            }
        }
    });

    $('.survey-form').on('click', '.form-line .checkboxes-block .checkbox', function (e) {
        var input = $(this).find('.answer-option-input');
        input.select();

        if (input.val() == '') {
            input.val(Lang.get('lang.option', {index: $(this).index() + 1}));
        }
    });

    // remove checkbox option
    $('.survey-form').on('click', '.form-line .checkboxes-block .remove-checkbox-option', function (e) {
        e.preventDefault();
        var option = $(this).closest('.checkbox.checkbox-sortable');

        if ($(this).closest('.checkboxes-block').find('.checkbox.checkbox-sortable').length > 1) {
            var parentElement = option.closest('.checkboxes-block');
            option.fadeOut(500).remove();

            if (parentElement.find('.remove-checkbox-option').length <= 1) {
                parentElement.find('.remove-checkbox-option').addClass('hidden');
            }
        }
    });

    $('.survey-form').on('click', '.form-line .checkboxes-block .remove-other-checkbox-option', function (e) {
        e.preventDefault();
        var option = $(this).closest('.checkbox');
        $(this).closest('.checkboxes-block').find('.other-checkbox .other-checkbox-btn').first().removeClass('hidden');
        option.fadeOut(500).remove();
    });

    $('.survey-form').on('click', '.form-line .checkboxes-block .other-checkbox .other-checkbox-block .add-checkbox', function (e) {
        var checkboxBlock = $(this).closest('.checkboxes-block');
        var checkbox = $(this).closest('.checkboxes-block').find('.checkbox').first();
        var nextElement;

        otherCheckboxOption = checkboxBlock.find('.other-checkbox-option');

        if (otherCheckboxOption.length) {
            nextElement = checkbox.clone().insertBefore(otherCheckboxOption);
        } else {
            nextElement = checkbox.clone().insertBefore($(this).closest('.other-checkbox'));
        }

        // reshow remove button when copy answer element from first element
        $(this).closest('li.form-line.sort').find('.remove-checkbox-option').removeClass('hidden');

        var questionElement = $(this).closest('li.form-line.sort');
        var questionId = questionElement.data('question-id');
        var answerId = refreshAnswerId();
        nextElement.data('answer-id', answerId);
        nextElement.attr('id', `answer_${answerId}`);
        var numberOfAnswers = questionElement.data('number-answer');
        var optionId = numberOfAnswers + 1;
        nextElement.data('option-id', optionId);
        questionElement.data('number-answer', numberOfAnswers + 1);

        // remove image answer
        nextElement.find('div.image-answer').remove();

        // show image button for answer element
        nextElement.find('.upload-checkbox-image').removeClass('invisible');

        // change and reset input, image value, focus, select
        var image = nextElement.find('input.image-answer-hidden');
        image.attr('name', `media[question_${questionId}][answer_${answerId}][option_${optionId}]`);
        image.val('');

        var input = nextElement.find('.answer-option-input');
        input.attr('name', `answer[question_${questionId}][answer_${answerId}][option_${optionId}]`);
        input.val(Lang.get('lang.option', {index: nextElement.index() + 1}));
        input.select();
        input.focus();

        // add validation rule for answer input element
        addValidationRuleForAnswer(answerId);
    });

    $('.survey-form').on('click', '.form-line .checkboxes-block .other-checkbox .other-checkbox-block .add-other-checkbox', function (e) {
        var checkboxBlock = $(this).closest('.checkboxes-block');

        if (!checkboxBlock.find('.other-checkbox-option').first().length) {
            var otherCheckbox = $(this).closest('.other-checkbox');
            var otherCheckboxOption = $('#element-clone').find('.other-checkbox-option').clone();
            otherCheckboxOption.insertBefore(otherCheckbox);
            otherCheckbox.find('.other-checkbox-btn').addClass('hidden');

            var questionElement = checkboxBlock.closest('li.form-line.sort');
            var questionId = questionElement.data('question-id');
            var answerId = refreshAnswerId();
            otherCheckboxOption.data('answer-id', answerId);
            otherCheckboxOption.attr('id', `answer_${answerId}`);
            var numberOfAnswers = questionElement.data('number-answer');
            var optionId = numberOfAnswers + 1;
            otherCheckboxOption.attr('data-option-id', optionId);
            questionElement.data('number-answer', numberOfAnswers + 1);

            var input = otherCheckboxOption.find('.answer-option-input');
            input.attr('name', `answer[question_${questionId}][answer_${answerId}][option_${optionId}]`);
        }
    });

    /**
     * Redirect choice option
     */

    function addSectionRedirect(redirectElement, answerRedirectId, answerRedirectContent) {
        var sectionId = refreshSectionId();
        var questionId = refreshQuestionId();
        var answerId = refreshAnswerId();

        $.ajax({
            method: 'POST',
            url: $('#add-section-btn').data('redirect-section-url'),
            data : {
                answerRedirectId: answerRedirectId,
                answerRedirectContent: answerRedirectContent,
                sectionId: sectionId,
                questionId: questionId,
                answerId: answerId
            }
        })
        .done(function (data) {
            if (data.success) {
                var element = $('<div class></div>').html(data.html).children().first();
                var parentElement = redirectElement.closest('.redirect-question-block');
                var sectionIndex = parentElement.prevAll('.page-section').length + parentElement.prevAll('.redirect-question-block').length + 1;

                parentElement.append(element);
                element.data('number-redirect-section', 1);

                var redirectIndex = parentElement.find('.redirect-section-block').length;
                element.find('.section-index').html(`${sectionIndex}.${redirectIndex}.1`);
                element.find('.total-section').html(1);

                formSortable();
                // add multiple sortable event
                multipleChoiceSortable(`question_${questionId}`);

                $(`#section_${sectionId} textarea:regex(name, ^title\\[section_.*\\])`).each(function () {
                    $(this).rules('add', {
                        required: true,
                        maxlength: 255,
                    });
                });

                // add validation rules for section and question
                addValidationRuleForSection(sectionId);
                addValidationRuleForQuestion(questionId);
                addValidationRuleForAnswer(answerId);

                var color = makeRandomRedirectColor();

                $(`.redirect-choice-${answerRedirectId}`).css('color', color).attr('color', color);
                $(`.redirect-section-${answerRedirectId}`).css('border-color', color);
                $(`.redirect-section-label-${answerRedirectId}`).css('border-color', color).css('background', color);

                // auto resize for new textarea
                autoResizeTextarea();
            }
        });
    }

    // add redirect option and redirect section
    $('.survey-form').on('keydown', '.form-line .redirect-choice-block .redirect-choice', function (e) {
        if (e.keyCode === 13 && !e.shiftKey) {
            // reshow remove button when copy answer element from first element
            $(this).closest('.redirect-choice-block').find('.remove-choice-option').removeClass('hidden');

            var nextElement = $(this).clone().insertAfter($(this));
            var questionElement = $(this).closest('li.form-line.sort');
            var questionId = questionElement.data('question-id');
            var answerId = refreshAnswerId();

            nextElement.data('answer-id', answerId);
            nextElement.attr('data-answer-id', answerId);
            nextElement.attr('id', `answer_${answerId}`);

            var numberOfAnswers = questionElement.data('number-answer');
            var optionId = numberOfAnswers + 1;

            nextElement.data('option-id', optionId);
            questionElement.data('number-answer', numberOfAnswers + 1);
            nextElement.find('.radio-choice-icon').attr('class', `radio-choice-icon redirect-choice-${answerId}`);

            // remove image answer
            nextElement.find('div.image-answer').remove();

            // show image button for answer element
            nextElement.find('.upload-choice-image').removeClass('invisible');

            // change and reset input, image value, focus, select
            var image = nextElement.find('input.image-answer-hidden');
            image.attr('name', `media[question_${questionId}][answer_${answerId}][option_${optionId}]`);
            image.val('');

            var input = nextElement.find('.answer-option-input');
            input.attr('name', `answer[question_${questionId}][answer_${answerId}][option_${optionId}]`);
            var answerContent = Lang.get('lang.redirect_option_content', {index: nextElement.index() + 1});
            input.val(answerContent);
            input.attr('data-autoresize', 'data-autoresize');
            autoResizeTextarea();
            input.select();
            input.focus();

            // add validation rule for answer input element
            addValidationRuleForAnswer(answerId);
            addSectionRedirect($(this), answerId, answerContent);

            e.preventDefault();
        } else if (e.keyCode == 8 || e.keyCode == 46) {
            var currentInput = $(this).find('.answer-option-input');
            var previousElement = $(this).prev();
            var optionElement = $(this);

            if (!currentInput.val() && optionElement.parent().find('.redirect-choice').length > 2) {
                confirmWarning({message: Lang.get('lang.redirect_message.confirm_remove_option_and_section_redirect')}, function () {
                    var parentElement = optionElement.closest('.redirect-choice-block');
                    $(`.redirect-section-${optionElement.data('answer-id')}`).remove();
                    optionElement.fadeOut(500).remove();

                    if (parentElement.find('.remove-choice-option').length <= 2) {
                        parentElement.find('.remove-choice-option').addClass('hidden');
                    }

                    // focus next element
                    previousElement.find('.answer-option-input').select();
                });

                // deny key action
                e.preventDefault();
            }
        }
    });

    // update default content
    $('.survey-form').on('click', '.form-line .redirect-choice-block .redirect-choice', function (e) {
        var input = $(this).find('.answer-option-input');
        input.select();

        if (input.val() == '') {
            input.val(Lang.get('lang.redirect_option_content', {index: $(this).index() + 1}));
        }
    });

    // remove redirect option
    $('.survey-form').on('click', '.form-line .redirect-choice-block .remove-choice-option', function (e) {
        e.preventDefault();
        var optionElement = $(this).closest('.redirect-choice');

        if ($(this).closest('.redirect-choice-block').find('.redirect-choice').length > 2) {
            confirmWarning({message: Lang.get('lang.redirect_message.confirm_remove_option_and_section_redirect')}, function () {
                var parentElement = optionElement.closest('.redirect-choice-block');
                $(`.redirect-section-${optionElement.data('answer-id')}`).remove();
                optionElement.fadeOut(500).remove();

                if (parentElement.find('.remove-choice-option').length <= 2) {
                    parentElement.find('.remove-choice-option').addClass('hidden');
                }
            });
        }
    });

    // add redirect option
    $('.survey-form').on('click', '.form-line .redirect-choice-block .other-choice .add-choice', function (e) {
        var e = $.Event('keydown');
        e.keyCode = 13;  // ENTER KEY
        $(this).closest('.redirect-choice-block').find('.redirect-choice').last().trigger(e);
    });

    $('.survey-form').on('keyup change blur', '.form-line .redirect-choice-block .redirect-choice', function (e) {
        var value = $(this).find('.answer-option-input').val();
        $(`.redirect-section-label-${$(this).data('answer-id')}`).text(value);
        $(`.redirect-section-label-${$(this).data('answer-id')}`).attr('title', value);
    });

    /**
     * Sidebar scroll group button
     */

    $('#add-question-btn').click(function (e) {
        e.preventDefault();

        var sectionId = refreshSectionId();
        var questionId = refreshQuestionId();
        var answerId = refreshAnswerId();

        if (window.questionSelected == null) {
            var endSection = $('.survey-form').find('ul.sortable').last().find('.end-section').first();
            sectionId = endSection.closest('ul.page-section.sortable').data('section-id');
        } else {
            sectionId = window.questionSelected.closest('ul.page-section.sortable').data('section-id');
        }

        $.ajax({
            method: 'POST',
            url: $(this).data('url'),
            data : {
                sectionId: sectionId,
                questionId: questionId,
                answerId: answerId,
            }
        })
        .done(function (data) {
            if (data.success) {
                var element = $('<div></div>').html(data.html).children().first();

                if (window.questionSelected == null) {
                    window.questionSelected = $(element).insertBefore(endSection);
                } else {
                    window.questionSelected = $(element).insertAfter(window.questionSelected);
                }

                window.questionSelected.click();

                // add sortable event for multiple choice
                multipleChoiceSortable(`question_${questionId}`);

                // auto resize for new textarea
                autoResizeTextarea();

                // scroll to question element
                scrollToQuestion(questionId);

                // add validation rules for question
                addValidationRuleForQuestion(questionId);

                // mark question required
                markQuestionRequired();
            }
        });
    });

    $('#add-title-description-btn').click(function (e) {
        e.preventDefault();

        var sectionId = refreshSectionId();
        var questionId = refreshQuestionId();

        if (window.questionSelected == null) {
            var endSection = $('.survey-form').find('ul.sortable').last().find('.end-section').first();
            sectionId = endSection.closest('ul.page-section.sortable').data('section-id');
        } else {
            sectionId = window.questionSelected.closest('ul.page-section.sortable').data('section-id');
        }

        $.ajax({
            method: 'POST',
            url: $(this).data('url'),
            data : {
                sectionId: sectionId,
                questionId: questionId,
            }
        })
        .done(function (data) {
            if (data.success) {
                var element = $('<div></div>').html(data.html).children().first();

                if (window.questionSelected == null) {
                    window.questionSelected = $(element).insertBefore(endSection);
                } else {
                    window.questionSelected = $(element).insertAfter(window.questionSelected);
                }

                window.questionSelected.click();

                // auto resize for new textarea
                autoResizeTextarea();

                // scroll to title description element
                scrollToQuestion(questionId);

                // add validation rules for question
                addValidationRuleForQuestion(questionId);
            }
        });
    });

    $('#add-section-btn').click(function (e) {
        e.preventDefault();

        var numberOfSections = surveyData.data('number-section');
        var sectionId = refreshSectionId();
        var questionId = refreshQuestionId();
        var answerId = refreshAnswerId();

        $.ajax({
            method: 'POST',
            url: $(this).data('url'),
            data : {
                sectionId: sectionId,
                questionId: questionId,
                answerId: answerId
            }
        })
        .done(function (data) {
            if (data.success) {
                var element = $('<div></div>').html(data.html).children().first();
                var redirectSectionElement = $('li.sort.question-active').closest('.redirect-section-block');

                if (redirectSectionElement.length) {
                    redirectSectionElement.append(element);
                    var parentElement = redirectSectionElement.closest('.redirect-question-block');
                    var sectionIndex = parentElement.prevAll('.page-section, .redirect-question-block').length + 1;
                    var numberOfRedirectSections = redirectSectionElement.data('number-redirect-section') + 1;
                    var redirectIndex = redirectSectionElement.prevAll('.redirect-section-block').length + 1;

                    redirectSectionElement.data('number-redirect-section', numberOfRedirectSections);
                    element.find('.section-index').html(`${sectionIndex}.${redirectIndex}.${numberOfRedirectSections}`);
                    redirectSectionElement.find('.total-section').html(numberOfRedirectSections);
                } else {
                    element.addClass('normal-section');
                    $('.survey-form').append(element);
                    surveyData.data('number-section', numberOfSections + 1);
                    element.find('.section-index').html(numberOfSections + 1);
                    $('.survey-form ul.normal-section .total-section').html(numberOfSections + 1);
                }

                formSortable();
                element.find('li.sort').first().click();

                // add multiple sortable event
                multipleChoiceSortable(`question_${questionId}`);

                $(`#section_${sectionId} textarea:regex(name, ^title\\[section_.*\\])`).each(function () {
                    $(this).rules('add', {
                        required: true,
                        maxlength: 255,
                    });
                });

                // add validation rules for section and question
                addValidationRuleForSection(sectionId);
                addValidationRuleForQuestion(questionId);
                addValidationRuleForAnswer(answerId);


                // auto resize for new textarea
                autoResizeTextarea();

                // scroll to section
                if (numberOfSections) {
                    scrollToSection(sectionId);
                }
            }
        });
    });

    $('#setting-btn').click(function (e) {
        e.preventDefault();

        $('[data-toggle="tooltip"]').tooltip('hide');
    });

    // insert image to section
    $('#add-image-section-btn').click(function (e) {
        e.preventDefault();

        $('[data-toggle="tooltip"]').tooltip('hide');

        var url = $(this).data('url');
        $('.btn-insert-image').remove();
        $('.btn-group-image-modal').append(`
            <button class="btn btn-default btn-insert-image"
            id="btn-insert-image-section" data-dismiss="modal">${Lang.get('lang.insert_image')}</button>`
        );
        $('#modal-insert-image').modal('show');

        $('#btn-insert-image-section').click(function () {
            var imageURL = $('.img-preview-in-modal').attr('src');
            var sectionId = 0;
            var questionId = refreshQuestionId();

            if (window.questionSelected == null) {
                var endSection = $('.survey-form').find('ul.sortable').last().find('.end-section').first();
                sectionId = endSection.closest('ul.page-section.sortable').data('section-id');
            } else {
                sectionId = window.questionSelected.closest('ul.page-section.sortable').data('section-id');
            }

            if (imageURL) {
                $.ajax({
                    method: 'POST',
                    url: url,
                    dataType: 'json',
                    data: {
                        imageURL: imageURL,
                        sectionId: sectionId,
                        questionId: questionId
                    }
                })
                .done(function (data) {
                    if (data.success) {
                        var element = data.html;

                        if (window.questionSelected == null) {
                            window.questionSelected = $(element).insertBefore(endSection);
                        } else {
                            window.questionSelected = $(element).insertAfter(window.questionSelected);
                        }

                        autoResizeTextarea();
                        window.questionSelected.click();

                        // scroll to image element
                        scrollToQuestion(questionId);
                    }
                });
            } else {
                $('#modal-insert-image').modal('hide');
            }

            resetModalImage();
        });
    });

    // insert video to section
    $('#add-video-section-btn').click(function (e) {
        e.preventDefault();

        $('[data-toggle="tooltip"]').tooltip('hide');

        var url = $(this).data('url');
        $('.btn-insert-video').remove();
        $('.btn-group-video-modal').append(`
            <button class="btn btn-default btn-insert-video"
            id="btn-insert-video-section" data-dismiss="modal">${Lang.get('lang.insert_video')}</button>`)
        $('#modal-insert-video').modal('show');

        $('#btn-insert-video-section').click(function () {
            var thumbnailVideo = $('.video-preview').data('thumbnail');
            var urlEmbed = $('.video-preview').attr('src');

            if (urlEmbed) {
                var sectionId = 0;
                var questionId = refreshQuestionId();

                if (window.questionSelected == null) {
                    var endSection = $('.survey-form').find('ul.sortable').last().find('.end-section').first();
                    sectionId = endSection.closest('ul.page-section.sortable').data('section-id');
                } else {
                    sectionId = window.questionSelected.closest('ul.page-section.sortable').data('section-id');
                }

                $.ajax({
                    method: 'POST',
                    url: url,
                    dataType: 'json',
                    data: {
                        thumbnailVideo: thumbnailVideo,
                        urlEmbed: urlEmbed,
                        sectionId: sectionId,
                        questionId: questionId
                    }
                })
                .done(function (data) {
                    if (data.success) {
                        var element = data.html;

                        if (window.questionSelected == null) {
                            window.questionSelected = $(element).insertBefore(endSection);
                        } else {
                            window.questionSelected = $(element).insertAfter(window.questionSelected);
                        }

                        autoResizeTextarea();
                        window.questionSelected.click();
                        $('#modal-insert-video').modal('hide');

                        // scroll to video element
                        scrollToQuestion(questionId);
                    }
                });
            } else {
                resetModalVideo();
                $('#modal-insert-video').modal('hide');
            }
        });
    });

    // add image to question
    $('.survey-form').on('click', '.question-image-btn', function (e) {
        e.preventDefault();
        var btnQuestionnImage = $(this);
        var questionInsert = $(this).closest('.form-line').find('.description-input');
        var imageQuestionHidden = $(this).closest('.form-line').find('.image-question-hidden');
        var url = $(this).data('url');
        $('.btn-insert-image').remove();
        $('.btn-group-image-modal').append(`
            <button class="btn btn-default btn-insert-image"
            id="btn-insert-image-question" data-dismiss="modal">${Lang.get('lang.insert_image')}</button>`
        );
        $('#modal-insert-image').modal('show');

        $('#btn-insert-image-question').click(function () {
            var imageURL = $('.img-preview-in-modal').attr('src');

            if (imageURL) {
                $.ajax({
                    method: 'POST',
                    url: url,
                    dataType: 'json',
                    data: {
                        imageURL: imageURL,
                    }
                })
                .done(function (data) {
                    if (data.success) {
                        var element = data.html
                        $(element).insertAfter(questionInsert);
                        $(imageQuestionHidden).val(data.imageURL);
                        $(btnQuestionnImage).addClass('hidden');
                    }
                });
            }

            $('#modal-insert-image').modal('hide');
            resetModalImage();
        });
    });

    // add image to multi choice
    $('.survey-form').on('click', '.upload-choice-image', function (e) {
        e.preventDefault();
        var url = $(this).data('url');
        var answerInsert = $(this).parent();
        var imageAnswerHidden = $(this).closest('.choice-sortable').find('.image-answer-hidden');
        var uploadChoiceTag = $(this);
        $('.btn-insert-image').remove();
        $('.btn-group-image-modal').append(`
            <button class="btn btn-default btn-insert-image"
            id="btn-insert-image-answer" data-dismiss="modal">${Lang.get('lang.insert_image')}</button>`
        );
        $('#modal-insert-image').modal('show');

        $('#btn-insert-image-answer').click(function () {
            var imageURL = $('.img-preview-in-modal').attr('src');

            if (imageURL) {
                $.ajax({
                    method: 'POST',
                    url: url,
                    dataType: 'json',
                    data: {
                        imageURL: imageURL,
                    }
                })
                .done(function (data) {
                    if (data.success) {
                        var element = data.html;
                        $(element).insertAfter(answerInsert);
                        $(imageAnswerHidden).val(data.imageURL);
                        $(uploadChoiceTag).addClass('invisible');
                        $('#modal-insert-image').modal('hide');
                    }
                });
            }

            $('#modal-insert-image').modal('hide');
            resetModalImage();
        });
    });

    // add image to checkbox
    $('.survey-form').on('click', '.upload-checkbox-image', function (e) {
        e.preventDefault();
        var url = $(this).data('url');
        var answerInsert = $(this).parent();
        var imageAnswerHidden = $(this).closest('.checkbox-sortable').find('.image-answer-hidden');
        var uploadChoiceTag = $(this);
        $('.btn-insert-image').remove();
        $('.btn-group-image-modal').append(`
            <button class="btn btn-default btn-insert-image"
            id="btn-insert-image-answer" data-dismiss="modal">${Lang.get('lang.insert_image')}</button>`
        );
        $('#modal-insert-image').modal('show');

        $('#btn-insert-image-answer').click(function () {
            var imageURL = $('.img-preview-in-modal').attr('src');

            if (imageURL) {
                $.ajax({
                    method: 'POST',
                    url: url,
                    dataType: 'json',
                    data: {
                        imageURL: imageURL,
                    }
                })
                .done(function (data) {
                    if (data.success) {
                        var element = data.html;
                        $(element).insertAfter(answerInsert);
                        $(imageAnswerHidden).val(data.imageURL);
                        $(uploadChoiceTag).addClass('invisible');
                        $('#modal-insert-image').modal('hide');
                    }
                });
            }

            $('#modal-insert-image').modal('hide');
            resetModalImage();
        });
    });

    function removeImage(url, imageURL) {
        $.ajax({
            method: 'POST',
            url: url,
            dataType: 'json',
            data: {
                imageURL: imageURL,
            }
        });
    }

    // remove image choice answer
    $('.survey-form').on('click', '.remove-image-answer', function () {
        var btUploadChoiceImage = $(this).closest('.choice-sortable').find('.answer-image-btn-group').children('.upload-choice-image');
        var btUploadCheckboxImage = $(this).closest('.checkbox-sortable').find('.answer-image-btn-group').children('.upload-checkbox-image');
        var inputImageChoiceHidden = $(this).closest('.choice-sortable').find('.image-answer-hidden');
        var inputImageCheckboxHidden = $(this).closest('.checkbox-sortable').find('.image-answer-hidden');

        if ($(btUploadChoiceImage).attr('class')) {
            $(btUploadChoiceImage).removeClass('invisible');
            $(inputImageChoiceHidden).val('');
        } else {
            $(btUploadCheckboxImage).removeClass('invisible');
            $(inputImageCheckboxHidden).val('');
        }

        var url = $(this).data('url');
        var imageAnswerTag = $(this).parent().children('.answer-image-url');
        var imageURL = $(imageAnswerTag).attr('src');

        if (surveyData.data('page') == 'create') {
            removeImage(url, imageURL);
        }

        $(this).closest('.image-answer').remove();
    });

    // show option image section
    $('.survey-form').on('click', '.option-image-section', function (e) {
        e.stopPropagation();
        var optionMenuSelected = $(this).children('.option-menu-image');
        $(optionMenuSelected).toggleClass('show');
    });

    // hide option image section
    $(document).on('click', function () {
        $('.option-menu-image').removeClass('show');
    });

    // show option image question
    $('.survey-form').on('click', '.option-image-question', function (e) {
        e.stopPropagation();
        var optionMenuSelected = $(this).children('.option-menu-image');
        $((optionMenuSelected)).toggleClass('show');
    });

    // hide option image question
    $(document).on('click', function () {
        $('.option-menu-image').removeClass('show');
    });

    // remove image question
    $('.survey-form').on('click', '.remove-image', function (e) {
        e.stopPropagation();
        var btQuestionImage = $(this).closest('.form-line').find('.question-image-btn');
        var imageQuestionTag = $(this).closest('.show-image-question').children('.image-question-url');
        var imageURL = $(imageQuestionTag).attr('src');
        var url = $(this).data('url');

        if (surveyData.data('page') == 'create') {
            removeImage(url, imageURL);
        }

        var imageQuestionHidden = $(this).closest('.form-line').find('.image-question-hidden');
        $(imageQuestionHidden).val('');
        $(btQuestionImage).removeClass('hidden');
        $(this).closest('.image-question').remove();
    });

    // remove image section
    $('.survey-form').on('click', '.remove-image-section', function (e) {
        e.stopPropagation();
        var imageSectionTag = $(this).closest('.box-show-image').children('.show-image-insert-section');
        var imageURL = $(imageSectionTag).attr('src');
        var url = $(this).data('url');

        if (surveyData.data('page') == 'create') {
            removeImage(url, imageURL);
        }

        $(this).closest('.section-show-image-insert').remove();
    });

    // show video option
    $('.survey-form').on('click', '.option-image-video', function (e) {
        e.stopPropagation();
        $(this).children('.option-menu-image').toggleClass('show');
    });

    // remove video section
    $('.survey-form').on('click', '.remove-video', function (e) {
        e.stopPropagation();
        $(this).closest('.section-show-image-insert').remove();
    });

    // change image question
    $('.survey-form').on('click', '.change-image', function (e) {
        e.stopPropagation();
        var imageQuestion = $(this).closest('.show-image-question').children('.image-question-url');
        var inputImageHidden = $(this).closest('.form-line').find('.image-question-hidden');
        $('.btn-insert-image').remove();
        $('.btn-group-image-modal').append(`
            <button class="btn btn-default btn-insert-image"
            id="btn-change-image-question" data-dismiss="modal">${Lang.get('lang.insert_image')}</button>`
        );
        $('#modal-insert-image').modal('show');

        $('#btn-change-image-question').click(function () {
            var imageURL = $('.img-preview-in-modal').attr('src');

            if (imageURL) {
                $(imageQuestion).attr('src', imageURL);
                $(inputImageHidden).val(imageURL);
            }

            resetModalImage();
            $('#modal-insert-image').modal('hide');
        });
    });

    // change image section
    $('.survey-form').on('click', '.change-image-section', function (e) {
        e.stopPropagation();
        var imageSection = $(this).closest('.box-show-image').children('.show-image-insert-section');
        var inputImageHidden = $(this).closest('.box-show-image').children('.input-image-section-hidden');
        $('.btn-insert-image').remove();
        $('.btn-group-image-modal').append(`
            <button class="btn btn-default btn-insert-image"
            id="btn-change-image-section" data-dismiss="modal">${Lang.get('lang.insert_image')}</button>`
        );
        $('#modal-insert-image').modal('show');

        $('#btn-change-image-section').click(function () {
            var imageURL = $('.img-preview-in-modal').attr('src');

            if (imageURL) {
                $(imageSection).attr('src', imageURL);
                $(inputImageHidden).val(imageURL);
            } else {
                $('#modal-insert-image').modal('hide');
            }

            resetModalImage();
        });
    });

    // change video section
    $('.survey-form').on('click', '.change-video', function (e) {
        e.stopPropagation();
        var imageVideo = $(this).closest('.box-show-image').children('.show-image-insert-section');
        var inputVideoURL = $(this).closest('.box-show-image').children('.video-section-url-hidden');
        $('.btn-insert-video').remove();
        $('.btn-group-video-modal').append(`
            <button class="btn btn-default btn-insert-video"
            id="btn-change-video-section" data-dismiss="modal">${Lang.get('lang.insert_video')}</button>`)
        $('#modal-insert-video').modal('show');

        $('#btn-change-video-section').click(function () {
            var thumbnailVideo = $('.video-preview').attr('data-thumbnail');
            var urlEmbed = $('.video-preview').attr('src');

            if (thumbnailVideo) {
                $(imageVideo).attr('src', thumbnailVideo);
                $(inputVideoURL).val(urlEmbed);
            }

            resetModalVideo();
            $('#modal-insert-video').modal('hide');
        });
    });

    $('#submit-survey-btn').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var valid = validateSurvey();

        if (!valid) {
            return;
        }

        $('#setting-survey .btn-action-setting-save').text(Lang.get('lang.send'));
        isClickSendSurvey = true;
        $('#survey-setting-btn').click();
    });

    function sendSurvey()
    {
        var dataArray = $('form.survey-form').serializeArray();
        var survey = getSurvey(dataArray);

        if (!survey) {
            return;
        }

        showLoaderAnimation();
        var data = JSON.stringify(survey);

        $.ajax({
            method: 'POST',
            url: $('#submit-survey-btn').data('url'),
            data: data
        })
        .done(function (data) {
            if (data.success) {
                window.onbeforeunload = null;
                $(window).attr('location', data.redirect);
            } else {
                hideLoaderAnimation();
                alertDanger({message: data.message});
            }
        })
        .fail(function (data) {
            hideLoaderAnimation();
            alertDanger({message: Lang.get('lang.wrong_data')});
        });
    }

    //preview

    $('#preview-survey-btn').click(function (e) {
        e.preventDefault();

        var valid = validateSurvey();
        var urlLocation = $(this).attr('url-location');
        var dataArray = $('form.survey-form').serializeArray();
        var survey = getSurvey(dataArray);
        var data = JSON.stringify(survey);

        if (!valid || !survey) {
            return;
        }

        var redirectWindow = window.open(urlLocation, '_blank');

        $.ajax({
            method: 'POST',
            url: $(this).data('url'),
            data: {
                data: data
            }
        })
        .done(function (data) {
            if (data.success) {
                redirectWindow.location;
            }
        });
    });

    // live suggest email
    var indexActiveLi = 0; // store index of li tag is active

    $('.input-email-send').keyup(function (e) {
        var keyword = $(this).val().trim();
        var url = $(this).data('url');
        var emailsSuggested = $('input:hidden[name=emails_invite]').val();
        var emails = emailsSuggested.split(',');
        indexActiveLi = 0;

        if (keyword) {
            $.ajax({
                method: 'POST',
                url: url,
                dataType: 'json',
                data: {
                    keyword: keyword,
                    emails: emails,
                }
            })
            .done(function (data) {
                if (data.success) {
                    $('.live-suggest-email').empty();
                    data.emails.forEach(el => {
                        $('.live-suggest-email').append(`
                            <li class="email-li-item"><i class="fa fa-envelope"></i>&ensp;<span class="email-span-item">${el}</span></li>
                        `);
                    });
                    $('.live-suggest-email .email-li-item:nth-child(1)').addClass('email-li-item-active');
                    indexActiveLi = 1;
                }
            });
        } else {
            $('.live-suggest-email').empty();
        }
    });

    $(document).keydown(function (e) {
        if ($('#tab-send-mails').is(':visible')) {
            if (e.keyCode == 40) {
                e.preventDefault();
                $('.input-email-send').blur();

                if (indexActiveLi == $('.live-suggest-email').children('li').length) {
                    indexActiveLi = 0;
                    $('.live-suggest-email .email-li-item:nth-child(' + indexActiveLi + ')').removeClass('email-li-item-active');
                    $('.input-email-send').focus();
                } else {
                    indexActiveLi ++;
                    $('.live-suggest-email').find('.email-li-item').removeClass('email-li-item-active');
                    $('.live-suggest-email .email-li-item:nth-child(' + indexActiveLi + ')').addClass('email-li-item-active');
                }
            }

            if (e.keyCode == 38) {
                e.preventDefault();
                $('.input-email-send').blur();

                if (indexActiveLi == 0) {
                    indexActiveLi = $('.live-suggest-email').children('li').length;
                    $('.live-suggest-email').find('.email-li-item').removeClass('email-li-item-active');
                    $('.live-suggest-email .email-li-item:nth-child(' + indexActiveLi + ')').addClass('email-li-item-active');
                } else if (indexActiveLi == 1) {
                    $('.live-suggest-email .email-li-item:nth-child(' + indexActiveLi + ')').removeClass('email-li-item-active');
                    $('.input-email-send').focus();
                    indexActiveLi = 0;
                } else {
                    indexActiveLi --;
                    $('.live-suggest-email').find('.email-li-item').removeClass('email-li-item-active');
                    $('.live-suggest-email .email-li-item:nth-child(' + indexActiveLi + ')').addClass('email-li-item-active');
                }
            }

            if (e.keyCode == 13) {
                var liActive = $('.live-suggest-email').find('.email-li-item-active');
                var emailSuggest = $(liActive).children('.email-span-item').text().trim();

                if (isEmail(emailSuggest)) {
                    addLabelEmail(emailSuggest);
                } else {
                    var email = $('.input-email-send').val().trim();

                    if (isEmail(email)) {
                        addLabelEmail(email);
                    }
                }
            }
        }

        //key down show mail -- add member
        if ($('#tab-add-manager').is(':visible')) {
            if (e.keyCode == 40) {
                e.preventDefault();
                $('#input-email-member').blur();

                if (indexActiveLi == $('.live-suggest-member-email').children('li').length) {
                    indexActiveLi = 0;
                    $('.live-suggest-member-email .email-li-item:nth-child(' + indexActiveLi + ')').removeClass('email-li-item-member-active');
                    $('#input-email-member').focus();
                } else {
                    indexActiveLi++;
                    $('.live-suggest-member-email').find('.email-li-item').removeClass('email-li-item-member-active');
                    $('.live-suggest-member-email .email-li-item:nth-child(' + indexActiveLi + ')').addClass('email-li-item-member-active');
                }
            }

            if (e.keyCode == 38) {
                e.preventDefault();
                $('#input-email-member').blur();

                if (indexActiveLi == 0) {
                    indexActiveLi = $('.live-suggest-member-email').children('li').length;
                    $('.live-suggest-member-email').find('.email-li-item').removeClass('email-li-item-member-active');
                    $('.live-suggest-member-email .email-li-item:nth-child(' + indexActiveLi + ')').addClass('email-li-item-member-active');
                } else if (indexActiveLi == 1) {
                    $('.live-suggest-member-email .email-li-item:nth-child(' + indexActiveLi + ')').removeClass('email-li-item-member-active');
                    $('#input-email-member').focus();
                    indexActiveLi = 0;
                } else {
                    indexActiveLi--;
                    $('.live-suggest-member-email').find('.email-li-item').removeClass('email-li-item-member-active');
                    $('.live-suggest-member-email .email-li-item:nth-child(' + indexActiveLi + ')').addClass('email-li-item-member-active');
                }
            }

            if (e.keyCode == 13) {
                e.preventDefault();

                var liActive = $('.live-suggest-member-email').find('.email-li-item-member-active');
                var emailSuggest = $(liActive).children('.email-span-item').text().trim();

                if (isEmail(emailSuggest)) {
                    addEmailToTable(emailSuggest);
                }
            }
        }
    });

    //Setting add mail member manage survey
    if ($('.table-show-email-manager tr').length <= 1) {
        $('.table-show-email-manager').hide();
    } else {
        $('.table-show-email-manager').show();
    }

    $('#input-email-member').keyup(function (e) {
        var keyword = $(this).val().trim();
        var url = $(this).data('url');
        var emailsMember = [];
        $('.emails-member').each(function() {
            emailsMember.push($(this).text());
        });
        indexActiveLi = 0;

        if (keyword) {
            $.ajax({
                method: 'POST',
                url: url,
                dataType: 'json',
                data: {
                    keyword: keyword,
                    emails: emailsMember,
                }
            })
            .done(function (data) {
                if (data.success) {
                    $('.live-suggest-member-email').empty();
                    data.emails.forEach(el => {
                        $('.live-suggest-member-email').append(`
                            <li class="email-li-item"><i class="fa fa-envelope"></i>&ensp;<span class="email-span-item">${el}</span></li>
                        `);
                    });
                    $('.live-suggest-member-email .email-li-item:nth-child(1)').addClass('email-li-item-member-active');
                    indexActiveLi = 1;
                }
            });
        } else {
            $('.live-suggest-member-email').empty();
        }
    });

    // add email
    $('.live-suggest-email').on('click', '.email-li-item', function (e) {
        e.stopPropagation();
        var email = $(this).find('.email-span-item').text();
        addLabelEmail(email);
    });

    // add email member
    $('.live-suggest-member-email').on('click', '.email-li-item', function (e) {
        e.stopPropagation();
        var email = $(this).find('.email-span-item').text();
        addEmailToTable(email);
    });

    // remove email
    $('.div-show-all-email').on('click', '.delete-label-email', function () {
        var labelEmail = $(this).closest('.label-show-email');
        var email = $(labelEmail).data('email');

        if (labelEmail.hasClass('active')) {
            removeEmailAnswered(email, labelEmail);
        } else {
            removeEmail(email);
            $(labelEmail).remove();
            $('.input-email-send').focus();
        }
    });

    $(document).click(function (e) {
        $('.live-suggest-email').empty();
    });

    // function common suggest email
    function addLabelEmail(email) {
        var emails = $('.emails-invite-hidden').val();
        var arrayEmail = emails.split(',');

        if (arrayEmail.length > 8) {
            $('.div-show-all-email').addClass('overflow-y-scroll');
        }

        var isExist = $.inArray(email, arrayEmail);
        var isAnswer = '';

        if (surveyData.data('page') == 'edit') {
            var mailsAnswer = $('#invite-setting').attr('answer-data').split('/');

            if ($.inArray(email, mailsAnswer) != -1) {
                isAnswer = 'active';
            }
        }

        if (isExist == -1) {
            arrayEmail.push(email);
            $('.div-show-all-email').append(`
                <label data-email="${email}" class="label-show-email ${isAnswer}">
                    ${email}&ensp;<i class="fa fa-times delete-label-email"></i>
                </label>
            `);
        }

        $('.emails-invite-hidden').val(arrayEmail.join());
        $('.live-suggest-email').empty();
        $('.input-email-send').val(null);
        $('.input-email-send').focus();
    }

    // function add email to table
    function addEmailToTable(email, role = 1) {
        var emailsMember = [];
        $('.emails-member').each(function() {
            emailsMember.push($(this).text());
        });
        var isExist = jQuery.inArray(email, emailsMember);

        if (isExist == -1) {
            emailsMember.push(email);
            var colDelete = $('#input-email-member').length
                ? `<td><a href="#" class="delete-member"><i class="fa fa-times"></i></a></td>`
                : '';

            $('.table-show-email-manager tbody').append(`
                <tr>
                    <td class="emails-member">${email}</td>
                    <td class="roles-member" val="${role}">${Lang.get('lang.editor')}</td>
                    ${colDelete}
                </tr>
            `);
        }

        $('.emails-member-hidden').val(emailsMember.join());
        $('.live-suggest-member-email').empty();
        $('#input-email-member').val(null);
        $('#input-email-member').focus();

        if ($('.table-show-email-manager tr').length <= 1) {
            $('.table-show-email-manager').hide();
        } else {
            $('.table-show-email-manager').show();
        }
    }

    //function remove email member
    $('.table-show-email-manager').on('click', '.delete-member', function() {
        var selector = $(this).closest('tr');
        $(selector).remove();

        if ($('.table-show-email-manager tr').length <= 1) {
            $('.table-show-email-manager').hide();
        } else {
            $('.table-show-email-manager').show();
        }

        return false;
    });

    function removeEmail(email) {
        var emails = $('.emails-invite-hidden').val();
        var arrayEmail = emails.split(',').filter(Boolean);
        var index = jQuery.inArray(email, arrayEmail);

        if (index != -1) {
            delete arrayEmail[index];
            $('.emails-invite-hidden').val(arrayEmail.join());
        }
    }

    function isEmail(email) {
        var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;

        return regex.test(email);
    }

    /**
     * add Section
     */

    // section header dropdown
    $('.survey-form').on('click', '.section-select-styled', function(e) {
        e.stopPropagation();
        $('.survey-select-options').hide();
        $('ul.option-menu-dropdown').hide();
        $('.section-select-options').hide();
        $('div.section-select-styled.active').not(this).each(function() {
            $(this).removeClass('active').next('ul.section-select-options').hide();
        });
        $(this).toggleClass('active').next('ul.section-select-options').toggle();
    });

    $('.survey-form').on('click', '.section-select-options li', function(e) {
        e.stopPropagation();
        $('div.section-select-styled').html($(this).html()).removeClass('active');
        $('.section-select-options').hide();
        $('.section-select-styled').removeClass('active');
    });

    $(document).click(function() {
        $('.section-select-styled').removeClass('active');
        $('.section-select-options').hide();
    });

    // section zoom-in zoom-out btn
    $('.survey-form').on('click', '.zoom-btn', function () {
        if ($(this).hasClass('zoom-in-btn')) {
            $(this).removeClass('zoom-in-btn');
            $(this).addClass('zoom-out-btn');

            $(this).closest('.page-section').find('.form-line').each(function () {
                $(this).removeClass('liselected');
                $(this).removeClass('question-active');
                $(this).find('.question-input').addClass('active');
                $(this).find('.question-input').parent().addClass('col-xl-12');
                $(this).find('.question-description-input').addClass('hidden');
                $(this).find('.element-content').addClass('hidden');
            });
        } else {
            $(this).removeClass('zoom-out-btn');
            $(this).addClass('zoom-in-btn');

            $(this).closest('.page-section').find('.form-line').each(function () {
                $(this).find('.question-input').addClass('active');
                $(this).find('.question-input').parent().addClass('col-xl-12');
                $(this).find('.question-description-input').removeClass('hidden');
                $(this).find('.question-description-input').addClass('active');
                $(this).find('.element-content').removeClass('hidden');
            });
        }

        return false;
    });

    // insert image by url
    $('.input-url-image').on('keyup', function () {
        var urlImage = $(this).val().trim();

        if (!urlImage) {
            showMessageImage(Lang.get('lang.url_is_required'));
        } else {
            var expression = /^http+/;
            var regex = new RegExp(expression);

            if (!urlImage.match(regex)) {
                setPreviewImage('');
                showMessageImage(Lang.get('lang.url_is_invalid'));

                return false;
            }

            checkTimeLoadImage(urlImage, function (result) {
                if (result == 'success') { // is image url
                    setPreviewImage(urlImage);
                    showMessageImage(Lang.get('lang.image_preview'), 'success');
                } else { // timeout or not image url
                    setPreviewImage('');
                    showMessageImage(Lang.get('lang.url_is_invalid'));
                }
            });
        }
    });

    // insert image by upload from local
    $(document).on('click', '.btn-upload-image', function () {
        $('.input-upload-image').trigger('click');

        $(document).on('change', '.input-upload-image', function () {
            var formData = new FormData();
            var url = $(this).data('url');
            formData.append('image', this.files[0]);
            uploadImage(formData, url);
        });
    });

    // insert url video
    $('.input-url-video').on('keyup', function () {
        var urlVideo = $(this).val().trim();
        var videoInfo = { url: urlVideo };
        var thumbnailYoutube = 'https://img.youtube.com/vi/';
        var embedYoutube = 'https://www.youtube.com/embed/';

        if (!urlVideo) {
            showMessageVideo(Lang.get('lang.url_is_required'));
            setPreviewVideo('', '');
        } else {
            var rulesURL = /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?=.*v=((\w|-){11}))(?:\S+)?$/;

            if (urlVideo.match(rulesURL)) {
                videoInfo.type = 'video';
                videoInfo.id = RegExp.$1;
                var thumbnailVideo = thumbnailYoutube + videoInfo.id + '/hqdefault.jpg';
                videoInfo.thumbnail = thumbnailVideo;
                showMessageVideo(Lang.get('lang.video_preview'), 'success');
                var embedURLVideo = embedYoutube + videoInfo.id;
                setPreviewVideo(embedURLVideo, thumbnailVideo);
            } else {
                showMessageVideo(Lang.get('lang.url_is_invalid'));
                setPreviewVideo('', '');
            }
        }
    });

    /*
        setting survey
    */

    if ($('#confirm-reply').prop('checked')) {
        $('.setting-choose-confirm-reply').show('300');
        $('.setting-radio-request').removeAttr('disabled');
    }

    if ($('#checkbox-mail-remind').prop('checked')) {
        $('.setting-choose-confirm-reply').show('300');
        $('.setting-radio-request').removeAttr('disabled');
    }

    if ($('#limit-number-answer').prop('checked')) {
        $('.number-limit-number-answer').show('300');
    }

    //disable event enter

    $('#quantity-answer').keypress(function(event) {
        if (event.keyCode == 13) {
            event.preventDefault();
        }
    });

    $('#confirm-reply').change(function () {
        var check = $(this).prop('checked');

        if (check) {
            $('.setting-choose-confirm-reply').show('300');
            $('.setting-radio-request').removeAttr('disabled');
        } else {
            $('.setting-choose-confirm-reply').hide('300');
            $('.setting-radio-request').attr('disabled', true);
        }
    });

    function getNextRemindTime($type) {
        var startTime = $('#start-time').val();
        var nextTime = new Date();

        if (startTime.length) {
            startTime = startTime.split('/')[1] + '-' + startTime.split('/')[0] + startTime.substring(5);
            nextTime = new Date(Date.parse(startTime));
        }

        switch ($type) {
            case 'week':
                nextTime.setDate(nextTime.getDate() + 7);
                break;
            case 'month':
                nextTime.setMonth(nextTime.getMonth() + 1);
                break;
            case 'quarter':
                nextTime.setMonth(nextTime.getMonth() + 3);
                break;
            default:
                break;
        }

        return nextTime;
    }

    $('#checkbox-mail-remind').change(function(event) {
        var check = $(this).prop('checked');

        if (check) {
            $('.setting-mail-remind').show('300');
            $('.radio-mail-remind').removeAttr('disabled');
            $('#next-remind-time').data('datetimepicker').date(getNextRemindTime('week'));
        } else {
            $('.setting-mail-remind').hide('300');
            $('.radio-mail-remind').attr('disabled', true);
        }
    });

    $('.setting-mail-remind-option').on('click', '#remind-by-week', function () {
        $('#next-remind-time').data('datetimepicker').date(getNextRemindTime('week'));
    });

    $('.setting-mail-remind-option').on('click', '#remind-by-month', function () {
        $('#next-remind-time').data('datetimepicker').date(getNextRemindTime('month'));
    });

    $('.setting-mail-remind-option').on('click', '#remind-by-quarter', function () {
        $('#next-remind-time').data('datetimepicker').date(getNextRemindTime('quarter'));
    });

    $('.setting-mail-remind-option').on('click', '#remind-by-option', function () {
        $('#next-remind-time').data('datetimepicker').date(new Date());
    });

    $('.next-remind-block').on('change.datetimepicker', '#next-remind-time', function () {
        var dateSelect = $(this).val();
        dateSelect = dateSelect.split('/')[1] + '-' + dateSelect.split('/')[0] + dateSelect.substring(5);
        dateSelect = new Date(dateSelect);
        var dateStart = $('#start-time').val();
        var dateRemindByWeek = getNextRemindTime('week');
        var dateRemindByMonth = getNextRemindTime('month');
        var dateRemindByQuarter = getNextRemindTime('quarter');

        // if have start time
        if (dateStart.length) {
            dateStart = dateStart.split('/')[1] + '-' + dateStart.split('/')[0] + dateStart.substring(5);
            dateStart = new Date(Date.parse(dateStart));

            // next remind time must after start time 30 min
            dateStart = new Date(dateStart.getTime() + 30 * 1000 * 60);
            var diffdateStart = Math.round((dateStart - dateSelect) / (1000 * 60));

            if (diffdateStart > 0) {
                $('#next-remind-time').data('datetimepicker').date(dateStart);
                return;
            }
        }

        var dateNow = new Date();
        var diffdateNow = Math.round((dateNow - dateSelect) / (1000 * 60));

        // if time select <= time now
        if (diffdateNow >= 0) {
            // next remind time must after time now 30 min
            dateRemindMin =  new Date(dateNow.getTime() + 30 * 1000 * 60);
            $('#next-remind-time').data('datetimepicker').date(dateRemindMin);

            return;
        }

        var diffByWeek = Math.round(Math.abs(dateRemindByWeek - dateSelect) / (1000 * 60));
        var diffByMonth = Math.round(Math.abs(dateRemindByMonth - dateSelect) / (1000 * 60));
        var diffByQuarter = Math.round(Math.abs(dateRemindByQuarter - dateSelect) / (1000 * 60));

        if (diffByQuarter > 1) {
            if (diffByMonth > 1) {
                if (diffByWeek > 1) {
                    $('#remind-by-option').prop('checked', 'checked');
                } else {
                    $('#remind-by-week').prop('checked', 'checked');
                }
            } else {
                $('#remind-by-month').prop('checked', 'checked');
            }
        } else {
            $('#remind-by-quarter').prop('checked', 'checked');
        }
    });

    $('#limit-number-answer').change(function () {
        var check = $(this).prop('checked');

        if (check) {
            $('.number-limit-number-answer').show('300');
        } else {
            $('.number-limit-number-answer').hide('300');
        }
    });

    var minAnswer = parseInt($('#quantity-answer').attr('min'));
    var maxAnswer = parseInt($('#quantity-answer').attr('max'));

    $('#btn-minus-quantity').click(function () {
        var quantity = parseInt($('#quantity-answer').val());

        if (!isNaN(quantity) && quantity > minAnswer) {
            $('#quantity-answer').val(--quantity);
        }

        return false;
    });

    $('#btn-plus-quantity').click(function(event) {
        var quantity = parseInt($('#quantity-answer').val());
        if (!isNaN(quantity) && quantity < maxAnswer) {
            $('#quantity-answer').val(++quantity);
        }

        return false;
    });

    $('#quantity-answer').blur(function(event) {
        if (parseInt($(this).val()) < minAnswer || parseInt($(this).val()) > maxAnswer) {
            $(this).val(minAnswer);
        }
    });

    // duplicate question
    $('.survey-form').on('click', '.copy-element', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var questionType = $(this).closest('.form-line').data('question-type');
        var cloneElement = $(this).closest('.form-line').clone();
        var sectionId = $(this).closest('ul.page-section.sortable').data('section-id');
        var questionId = refreshQuestionId();

        window.questionSelected = $(cloneElement).insertAfter($(this).closest('.form-line'));

        $(window.questionSelected).attr('id', `question_${questionId}`);
        $(window.questionSelected).data('question-id', questionId);

        $(window.questionSelected).find('.question-input').attr('name', `title[section_${sectionId}][question_${questionId}]`);
        $(window.questionSelected).find('.question-input').attr('data-autoresize', 'data-autoresize');

        $(window.questionSelected).find('.image-question-hidden').attr('name', `media[section_${sectionId}][question_${questionId}]`);
        $(window.questionSelected).find('.checkbox-question-required').attr('name', `require[section_${sectionId}][question_${questionId}]`);
        $(window.questionSelected).find('.input-image-section-hidden').attr('name', `media[section_${sectionId}][question_${questionId}]`);
        $(window.questionSelected).find('.video-section-url-hidden').attr('name', `media[section_${sectionId}][question_${questionId}]`);

        $(window.questionSelected).find('.question-description-input').attr('name', `description[section_${sectionId}][question_${questionId}]`);
        $(window.questionSelected).find('.question-description-input').attr('data-autoresize', 'data-autoresize');

        $(window.questionSelected).find('.element-content .option').each(function (i) {
            i ++;
            var answerId = refreshAnswerId();
            $(this).attr('id', `answer_${answerId}`);
            $(this).data('answer-id', answerId);
            $(this).find('.answer-option-input').attr('name', `answer[question_${questionId}][answer_${answerId}][option_${i}]`);
            $(this).find('input[type=hidden]').attr('name', `media[question_${questionId}][answer_${answerId}][option_${i}]`);
            $(this).find('.answer-option-input').attr('data-autoresize', 'data-autoresize');
        });

        // select duplicating question
        window.questionSelected.click();
        scrollToQuestion(questionId);

        // auto resize for new textarea
        autoResizeTextarea();
    });

    $('[data-toggle="tooltip"]').tooltip();

    // duplicate section
    $('.survey-form').on('click', '.copy-section', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var element = $(this);
        var sectionDuplicate = null;
        var isHaveRedirectQuestion = !element.closest('.redirect-section-block').length && element.closest('.redirect-question-block').length;

        if (isHaveRedirectQuestion) {
            sectionDuplicate = element.closest('.redirect-question-block').clone();
            sectionDuplicate.insertAfter(element.closest('.redirect-question-block'));

            sectionDuplicate.find('.page-section').each(function () {
                refreshIdSectionDuplicate($(this));
            });

            sectionDuplicate = sectionDuplicate.children('.page-section');
        } else {
            sectionDuplicate = element.closest('.page-section').clone();
            sectionDuplicate.insertAfter(element.closest('.page-section'));
            refreshIdSectionDuplicate(sectionDuplicate);
        }

        formSortable();
        reloadSectionIndex();

        sectionDuplicate.find('.form-line').first().click();
        scrollToSection(sectionDuplicate.data('section-id'));

        // auto resize for new textarea
        autoResizeTextarea();
    });

    function refreshIdSectionDuplicate(sectionDuplicate) {
        var sectionId = refreshSectionId();
        sectionDuplicate.attr('id', `section_${sectionId}`);
        sectionDuplicate.data('section-id', sectionId);

        sectionDuplicate.find('.section-header-title').attr('name', `title[section_${sectionId}]`);
        sectionDuplicate.find('.section-header-title').attr('data-autoresize', 'data-autoresize');

        sectionDuplicate.find('.section-header-description').attr('name', `description[section_${sectionId}]`);
        sectionDuplicate.find('.section-header-description').attr('data-autoresize', 'data-autoresize');

        sectionDuplicate.find('.form-line').each(function () {
            var questionId = refreshQuestionId();
            var questionElement = $(this);

            questionElement.attr('id', `question_${questionId}`);
            questionElement.data('question-id', questionId);

            questionElement.find('.question-input').attr('name', `title[section_${sectionId}][question_${questionId}]`);
            questionElement.find('.question-input').attr('data-autoresize', 'data-autoresize');

            questionElement.find('.image-question-hidden').attr('name', `media[section_${sectionId}][question_${questionId}]`);
            questionElement.find('.checkbox-question-required').attr('name', `require[section_${sectionId}][question_${questionId}]`);
            questionElement.find('.input-image-section-hidden').attr('name', `media[section_${sectionId}][question_${questionId}]`);
            questionElement.find('.video-section-url-hidden').attr('name', `media[section_${sectionId}][question_${questionId}]`);

            questionElement.find('.question-description-input').attr('name', `description[section_${sectionId}][question_${questionId}]`);
            questionElement.find('.question-description-input').attr('data-autoresize', 'data-autoresize');
            questionElement.find('.element-content .option').each(function (i) {
                i ++;
                var answerElement = $(this);
                var answerId = refreshAnswerId();

                if (answerElement.hasClass('redirect-choice')) {
                    var oldAnswerRedirectId = answerElement.data('answer-id');
                    var color = makeRandomRedirectColor();
                    sectionDuplicate = sectionDuplicate.closest('.redirect-question-block');

                    sectionDuplicate.find(`.redirect-choice-${oldAnswerRedirectId}`)
                        .removeClass(`redirect-choice-${oldAnswerRedirectId}`)
                        .addClass(`redirect-choice-${answerId}`)
                        .css('color', color).attr('color', color);
                    sectionDuplicate.find(`.redirect-section-${oldAnswerRedirectId}`)
                        .removeClass(`redirect-section-${oldAnswerRedirectId}`)
                        .addClass(`redirect-section-${answerId}`)
                        .css('border-color', color)
                        .attr('data-redirect-id', answerId);
                    sectionDuplicate.find(`.redirect-section-label-${oldAnswerRedirectId}`)
                        .removeClass(`redirect-section-label-${oldAnswerRedirectId}`)
                        .addClass(`redirect-section-label-${answerId}`)
                        .css('border-color', color).css('background', color);
                }

                answerElement.attr('id', `answer_${answerId}`);
                answerElement.attr('data-answer-id', answerId);
                answerElement.data('answer-id', answerId);
                answerElement.find('.answer-option-input').attr('name', `answer[question_${questionId}][answer_${answerId}][option_${i}]`);
                answerElement.find('input[type=hidden]').attr('name', `media[question_${questionId}][answer_${answerId}][option_${i}]`);
                answerElement.find('.answer-option-input').attr('data-autoresize', 'data-autoresize');

                addValidationRuleForAnswer(answerId);
            });

            addValidationRuleForQuestion(questionId);
        });

        addValidationRuleForSection(sectionId);
    }

    // remove section
    $('.survey-form').on('click', '.delete-section', function (e) {
        var element = $(this);
        var numberOfSections = surveyData.data('number-section');

        if (element.closest('.redirect-section-block').length) {
            numberOfSections = element.closest('.redirect-section-block').data('number-redirect-section');
        }

        if (numberOfSections == 1) {
            alertDanger({message: Lang.get('lang.can_not_remove_last_section')});

            return false;
        }

        var currentSectionSelected = element.closest('.page-section');

        if (!element.closest('.redirect-section-block').length && element.closest('.redirect-question-block').length) {
            currentSectionSelected = element.closest('.redirect-question-block');
        }

        var checkHasData = false;

        currentSectionSelected.find('.section-header-title, .section-header-description, li.form-line.sort .question-input').each(function () {
            if ($(this).val() != '') {
                checkHasData = true;

                return;
            }
        });

        if (checkHasData) {
            confirmWarning({message: Lang.get('lang.confirm_remove_last_question')}, function () {
                deleteSection(currentSectionSelected);
            });

            return false;
        }

        deleteSection(currentSectionSelected);
    });

    function deleteSection(currentSectionSelected) {
        // remove validation tooltip
        currentSectionSelected.find('textarea[data-toggle="tooltip"], input[data-toggle="tooltip"]').each(function () {
            $(`#${$(this).attr('aria-describedby')}`).remove();
        });


        var prevSection = currentSectionSelected.prev().hasClass('page-section-header')
            ? currentSectionSelected.next()
            : currentSectionSelected.prev();

        var prevSectionId = prevSection.hasClass('redirect-question-block')
            ? prevSection.children('.page-section').data('section-id')
            : prevSection.data('section-id');

        currentSectionSelected.remove();
        reloadSectionIndex();

        prevSection.find('.form-line.sort').first().click();
        scrollToSection(prevSectionId);
    }

    function reloadSectionIndex() {
        var numberOfSections = $('.survey-form ul.normal-section').length;
        surveyData.data('number-section', numberOfSections);
        $('.survey-form ul.normal-section .total-section').text(numberOfSections);

        $('.survey-form ul.normal-section').each(function (i) {
            $(this).find('.section-index').text(i + 1);
        });

        $('.survey-form .redirect-question-block').each(function () {
            $(this).find('.redirect-section-block').each(function (i) {
                var sectionIndex = $(this).closest('.redirect-question-block').prevAll('.page-section, .redirect-question-block').length + 1;
                redirectSectionsElement = $(this).find('.page-section');
                $(this).data('number-redirect-section', redirectSectionsElement.length);
                redirectSectionsElement.find('.total-section').text(redirectSectionsElement.length);

                redirectSectionsElement.each(function (j) {
                    $(this).find('.section-index').text(`${sectionIndex}.${i + 1}.${j + 1}`);
                });
            });
        });
    }

    // merge section with above
    $('.survey-form').on('click', '.merge-with-above', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var currentSection = $(this).closest('.page-section');
        var isHasRedirectQuestion = currentSection.closest('.redirect-question-block').length;
        var prevSection = null

        if (isHasRedirectQuestion) {
            if (currentSection.closest('.redirect-question-block').prev('.redirect-question-block').length) {
                alertWarning({message: Lang.get('lang.redirect_message.can_not_merge_section')});

                return;
            }

            prevSection = currentSection.closest('.redirect-question-block').prev('.page-section');
        } else {
            prevSection = currentSection.prev('.page-section, .redirect-question-block');

            if (prevSection.hasClass('redirect-question-block')) {
                prevSection = prevSection.children('.normal-section.page-section');
            }
        }

        var prevSectionId = prevSection.data('section-id');

        if (prevSection.length) {
            currentSection.children('.form-line.sort').each(function () {
                var questionElement = $(this);
                var questionId = questionElement.data('question-id');

                questionElement.find('.question-input').attr('name', `title[section_${prevSectionId}][question_${questionId}]`);
                questionElement.find('.image-question-hidden').attr('name', `media[section_${prevSectionId}][question_${questionId}]`);
                questionElement.find('.question-description-input').attr('name', `description[section_${prevSectionId}][question_${questionId}]`)
                questionElement.find('.checkbox-question-required').attr('name', `require[section_${prevSectionId}][question_${questionId}]`);
                questionElement.find('.input-image-section-hidden').attr('name', `media[section_${prevSectionId}][question_${questionId}]`);
                questionElement.find('.video-section-url-hidden').attr('name', `media[section_${prevSectionId}][question_${questionId}]`);
                questionElement.insertAfter(prevSection.find('.form-line.sort').last());
            });

            // remove validation tooltip
            currentSection.find('textarea[data-toggle="tooltip"], input[data-toggle="tooltip"]').each(function () {
                $(`#${$(this).attr('aria-describedby')}`).remove();
            });

            if (isHasRedirectQuestion) {
                prevSection.wrap('<div class="redirect-question-block"></div>');
                var parentElement = prevSection.closest('.redirect-question-block');
                currentSection = currentSection.closest('.redirect-question-block');

                currentSection.find('.redirect-section-block').each(function () {
                    parentElement.append($(this));
                });
            }

            currentSection.remove();
            reloadSectionIndex();

            prevSection.find('.form-line.sort').last().click();
            var questionId = prevSection.children('.form-line.sort').last().data('question-id');
            scrollToQuestion(questionId);
        }
    });

    // show subject default when subject-input empty
    $('#input-subject-email').on('change', function () {
        if ($(this).val() == '') {
            $(this).val($(this).attr('default'));
        }
    });

    // delete message validate error
    $('#input-email-send').on('focus', function () {
        $(this).removeClass('error');
        $(this).next('.error-mail-send').remove();
    });

    // btn save setting
    $('.btn-action-setting-save').click(function () {
        // validate required email invite if checked reminder time]
        if ($('#checkbox-mail-remind').prop('checked') || $('#security-survey').prop('checked')) {
            var mailInvite = $('.div-show-all-email label.label-show-email');

            $('.error-mail-send').each(function () {
                $(this).remove();
            });

            if (!mailInvite.length) {
                $('#setting-survey .nav-item-setting-survey .nav-link').last().click();
                $('#input-email-send').addClass('error');
                $('<div class="error-mail-send">'+ Lang.get('lang.mail_send_validate') +'</div>').insertAfter('#input-email-send');

                return false;
            }
        }

        // save survey setting tab
        if ($('#confirm-reply').prop('checked')) {
            $('.setting-radio-request').each(function () {
                if ($(this).prop('checked')) {
                    $('#survey-setting').attr('answer-required', $(this).attr('val'));
                }
            });
        } else {
            $('#survey-setting').attr('answer-required', $('#confirm-reply').attr('default'));
        }

        if ($('#limit-number-answer').prop('checked')) {
            $('#survey-setting').attr('answer-limited', $('#quantity-answer').val());
        } else {
            $('#survey-setting').attr('answer-limited', $('#limit-number-answer').attr('default'));
        }

        if ($('#checkbox-mail-remind').prop('checked')) {
            $('.radio-mail-remind').each(function () {
                if ($(this).prop('checked')) {
                    $('#survey-setting').attr('reminder-email', $(this).attr('val'));
                    var nextTime = $('#next-remind-time').val();
                    nextTime = moment(nextTime, 'DD/MM/YYYY h:mm A').format('MM/DD/YYYY h:mm A');
                    $('#survey-setting').attr('time', nextTime);
                }
            });
        } else {
            $('#survey-setting').attr('reminder-email', $('#checkbox-mail-remind').attr('default'));
            $('#survey-setting').attr('time', '');
        }

        if ($('#security-survey').prop('checked')) {
            $('#survey-setting').attr('privacy', $('#security-survey').attr('val'));
        } else {
            $('#survey-setting').attr('privacy', $('#security-survey').attr('default'));
        }

        // save member setting tab
        var memberMailLists = '';

        $('.table-show-email-manager .emails-member').each(function () {
            var role = $(this).next().attr('val');
            memberMailLists += $(this).text() + ',' + role + '/';
        });

        $('#members-setting').attr('members-data', memberMailLists);

        // save invite setting tab
        if ($('#send-to-all-wsm-acc').prop('checked')) {
            $('#invite-setting').attr('all', $('#send-to-all-wsm-acc').attr('val'));
        } else {
            $('#invite-setting').attr('all', $('#send-to-all-wsm-acc').attr('default'));
        }
            // save mailList
        var mailSendLists = '';
        var mailAnswerLists = '';

        $('.div-show-all-email .label-show-email').each(function () {
            if (surveyData.data('page') == 'edit' && $(this).hasClass('active')) {
                mailAnswerLists += $(this).attr('data-email') + '/';
            } else {
                mailSendLists += $(this).attr('data-email') + '/';
            }
        });

        $('#invite-setting').attr('invite-data', mailSendLists);
        $('#invite-setting').attr('answer-data', mailAnswerLists);

            // save title mail
        var subject = $('#input-subject-email').val();

        if (!subject) {
            subject = $('#input-subject-email').attr('default');
        }

        $('#invite-setting').attr('subject', subject);
            // save message mail
        $('#invite-setting').attr('msg', $('#input-email-message').val());
        if (surveyData.data('page') == 'create' && isClickSendSurvey) {
            sendSurvey();

            return;
        }

        if (surveyData.data('page') == 'edit') {
            var data = {};
            // invited emails
            data.invited_email = getInvitedEmail();

            // settings
            data.setting = getSettings();

            // members
            data.members = getMembers();

            showLoaderAnimation();
            var check = isClickSendSurvey;

            $.ajax({
                method: 'PUT',
                url: $('#setting-survey').data('url'),
                data: JSON.stringify(data),
            })
            .done(function (data) {
                hideLoaderAnimation();

                if (!data.success) {
                    if (data.redirect == '') {
                        alertDanger({message: data.message});

                        return;
                    }

                    window.onbeforeunload = null;
                    $(window).attr('location', data.redirect);
                }

                if (check) {
                    if ($('#option-update-modal').length) {
                        showUpdateModal();
                    } else {
                        $('#update-survey-draft-to-open').next('#edit-survey-btn').click();
                    }

                }
            })
            .fail(function (data) {
                hideLoaderAnimation();
                alertDanger({message: Lang.get('lang.wrong_data')});
            });
        }
    });

    // btn open menu survey setting
    $('#survey-setting-btn').on('click', function () {
        $('#setting-survey .nav-item-setting-survey .nav-link').first().click();
        $('#input-email-send').removeClass('error');
        $('#input-email-send').next('.error-mail-send').remove();

        // survey setting tab
        var answerRequired = $('#survey-setting').attr('answer-required');
        var answerLimited = $('#survey-setting').attr('answer-limited');
        var reminderEmail = $('#survey-setting').attr('reminder-email');
        var privacy = $('#survey-setting').attr('privacy');

        if (answerRequired != $('#confirm-reply').attr('default')) {
            $('#confirm-reply').prop('checked', 'checked');
            $('.setting-choose-confirm-reply').show();
            $('.setting-radio-request').removeAttr('disabled');
            $('.setting-radio-request').each(function () {
                if (answerRequired == $(this).attr('val')) {
                    $(this).prop('checked', 'checked');
                }
            });
        } else {
            $('#confirm-reply').prop('checked', '');
            $('.setting-choose-confirm-reply').hide();
            $('.setting-radio-request').attr('disabled', true);
        }

        if (answerLimited != $('#limit-number-answer').attr('default')) {
            $('.number-limit-number-answer').show();
            $('#limit-number-answer').prop('checked', 'checked');
            $('#quantity-answer').val(answerLimited);
        } else {
            $('#limit-number-answer').prop('checked', '');
            $('.number-limit-number-answer').hide();
        }

        if (reminderEmail != $('#checkbox-mail-remind').attr('default')) {
            $('#checkbox-mail-remind').prop('checked', 'checked');
            $('.setting-mail-remind').show();
            $('.radio-mail-remind').removeAttr('disabled');
            var remindTime = $('#survey-setting').attr('time');
            $('#next-remind-time').data('datetimepicker').date(new Date(Date.parse(remindTime)));
        } else {
            $('#checkbox-mail-remind').prop('checked', '');
            $('.setting-mail-remind').hide();
            $('.radio-mail-remind').attr('disabled', true);
        }

        if (privacy != $('#security-survey').attr('default')) {
            $('#security-survey').prop('checked', 'checked');
        } else {
            $('#security-survey').prop('checked', '');
        }

        // member setting tab
        $('.table-show-email-manager tbody').text('');
        $('.table-show-email-manager').hide();
        var membersData = $('#members-setting').attr('members-data');
        membersData = membersData.split('/').filter(Boolean);

        membersData.forEach(function (data) {
            data = data.split(',');
            // data[0] - mail suggest, data[1] - role
            var mail = data[0].trim();
            var role = data[1].trim();

            if (isEmail(mail)) {
                addEmailToTable(mail, role);
            }
        });

        // invite setting tab
        var sendMailAllWsm = $('#invite-setting').attr('all');
        $('.div-show-all-email').find('.emails-invite-hidden').val('');
        $('.div-show-all-email').find('.label-show-email').remove();
        $('.div-show-all-email').removeClass('overflow-y-scroll');

        if (sendMailAllWsm != '' && sendMailAllWsm != $('#send-to-all-wsm-acc').attr('default')) {
            $('#send-to-all-wsm-acc').prop('checked', 'checked');
        } else {
            $('#send-to-all-wsm-acc').prop('checked', '');
        }

        var mailSendLists = $('#invite-setting').attr('invite-data') + $('#invite-setting').attr('answer-data');
        mailSendLists = mailSendLists.split('/').filter(Boolean);

        mailSendLists.forEach(function (mail) {
            if (isEmail(mail)) {
                addLabelEmail(mail);
            }
        });

        var subject = $('#survey-title').val();

        if (subject == '') {
            subject = $('#input-subject-email').attr('subject-default');
        }

        $('#input-subject-email').attr('default', subject);
        $('#input-subject-email').val(subject);

        if ($('#invite-setting').attr('subject') != '') {
            $('#input-subject-email').val($('#invite-setting').attr('subject'));
        }

        $('#input-email-message').val($('#invite-setting').attr('msg'));
    });

    $('.btn-action-setting-cancel').on('click', function () {
        isClickSendSurvey = false;
        $('#setting-survey .btn-action-setting-save').text(Lang.get('lang.save'));
    });

    $('#setting-survey').on('hide.bs.modal', function (e) {
        e.stopPropagation();
        isClickSendSurvey = false;
        $('#setting-survey .btn-action-setting-save').text(Lang.get('lang.save'));
    });

    // move section
    $('.survey-form').on('click', '.move-section', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var numberOfSections = surveyData.data('number-section');
        $('.wrap-item-section-reorder').empty();

        $('.wrap-item-section-reorder').sortable({
            containment: '.wrap-item-section-reorder',
            handle: '.reorder-draggable-area',
            cursor: 'move',
            classes: {
                'ui-sortable-helper': 'hight-light'
            },
        });

        var blockSection = $(this).closest('.redirect-section-block').length
            ? $(this).closest('.redirect-section-block')
            : $('.survey-form');

        $(blockSection).find('.page-section').each(function () {
            if ($(blockSection).attr('class') == 'survey-form' && $(this).closest('.redirect-section-block').length) {
                return;
            }

            var sectionID = $(this).data('section-id');
            var sectionTitle = $(this).find('.section-header-title').val();
            var sectionIndex = $(this).find('.section-index').text();

            $('.wrap-item-section-reorder').append(`
                <li class="list-group-item item-reorder ui-sortable" id="section_${sectionID}" data-section-id="${sectionID}">
                    <div class="item-row-reorder reorder-draggable-area ui-sortable-handle">
                        <i class="fa fa-ellipsis-v"></i>
                        <i class="fa fa-ellipsis-v"></i>
                    </div>
                    <div class="item-row-reorder section-info">
                        <label class="reorder-section-title">${sectionTitle}</label><br>
                        <label class="reorder-section-info">${Lang.get('lang.section')}&nbsp;
                            <span class="reorder-section-index">${sectionIndex}</span>&nbsp;
                            ${Lang.get('lang.of')}&nbsp;<span>${numberOfSections}</span></label>
                    </div>
                    <div class="item-row-reorder reorder-action">
                         <div class="btn-move-section bt-move-section-up">
                            <i class="fa fa-chevron-up"></i>
                        </div>
                        <div class="btn-move-section bt-move-section-down">
                            <i class="fa fa-chevron-down bt-move-section-down"></i>
                        </div>
                    </div>
                </li>
            `);
        });

        markBtnDisableClick();
        $('#modal-reorder-section').modal('show');
    });

    $('.wrap-item-section-reorder').on("sortstop", function (event, ui) {
        markBtnDisableClick();
        $(this).find('.item-reorder').each(function (i) {
            $(this).find('.reorder-section-index').text(i+1);
        });
    });

    $('.wrap-item-section-reorder').on('click', '.bt-move-section-up', function (e) {
        e.stopPropagation();
        var currentItemSelector = $(this).closest('.list-group-item.item-reorder');
        var prevItemSelector = $(currentItemSelector).prev('.list-group-item.item-reorder');

        if (prevItemSelector.length) {
            var currentItem = $(currentItemSelector).detach();
            $(currentItem).insertBefore(prevItemSelector);
            $('.wrap-item-section-reorder').find('.item-reorder').each(function (i) {
                $(this).find('.reorder-section-index').text(i + 1);
            });
            markBtnDisableClick();
        }
    });

    $('.wrap-item-section-reorder').on('click', '.bt-move-section-down', function (e) {
        e.stopPropagation();
        var currentItemSelector = $(this).closest('.list-group-item.item-reorder');
        var afterItemSelector = $(currentItemSelector).next('.list-group-item.item-reorder');

        if (afterItemSelector.length) {
            var currentItem = $(currentItemSelector).detach();
            $(currentItem).insertAfter(afterItemSelector);
            $('.wrap-item-section-reorder').find('.item-reorder').each(function (i) {
                $(this).find('.reorder-section-index').text(i + 1);
            });
            markBtnDisableClick();
        }
    });

    $('#btn-save-reorder').click(function (e) {
        e.stopPropagation();
        var prevSectionID = null;
        var element = $(this);

        $('.wrap-item-section-reorder').find('.list-group-item.item-reorder').each(function (){
            var sectionID = $(this).attr('id');
            var pageSection = $('.survey-form').find(`#${sectionID}`)
            var blockReorder = $(pageSection).closest('.redirect-question-block').length && !$(pageSection).closest('.redirect-section-block').length
                ? $(pageSection).closest('.redirect-question-block')
                : $(pageSection);

            var blockReorderClone = $(blockReorder).clone();

            if (prevSectionID) {
                $('.survey-form').find(`#${prevSectionID}`).closest('.redirect-question-block').length && !$('.survey-form').find(`#${prevSectionID}`).closest('.redirect-section-block').length
                    ? $(blockReorderClone).insertAfter($('.survey-form').find(`#${prevSectionID}`).closest('.redirect-question-block'))
                    : $(blockReorderClone).insertAfter($('.survey-form').find(`#${prevSectionID}`));
            } else {
                $(pageSection).closest('.redirect-section-block').length
                    ? $(blockReorderClone).insertAfter($(blockReorder).closest('.redirect-section-block').find('.redirect-section-label'))
                    : $(blockReorderClone).insertAfter($('.survey-form').find('.page-section-header'));
            }

            $(blockReorder).remove()
            prevSectionID = sectionID;
        });

        reloadSectionIndex();
        formSortable();
        $('#modal-reorder-section').modal('hide');
    });

    function markBtnDisableClick() {
        $('.wrap-item-section-reorder').find('.bt-move-section-up').removeClass('btn-cursor-default');
        $('.wrap-item-section-reorder').find('.bt-move-section-down').removeClass('btn-cursor-default');
        var firstItem = $('.wrap-item-section-reorder').find('.list-group-item.item-reorder').first();
        $(firstItem).find('.bt-move-section-up').addClass('btn-cursor-default');
        var lastItem = $('.wrap-item-section-reorder').find('.list-group-item.item-reorder').last();
        $(lastItem).find('.bt-move-section-down').addClass('btn-cursor-default');
    }

    // hide menu merge with above if section is first section
    function hideMenuSection() {
        $('.survey-form').find('.merge-with-above').removeClass('hidden');
        $('.survey-form').find('.move-section').removeClass('hidden');
        var firstSection = $('.survey-form').find('.page-section').first();
        $(firstSection).find('.merge-with-above').addClass('hidden');

        // for redirect question
        $('.survey-form .redirect-question-block .redirect-section-block').each(function () {
            var redirectSections = $(this).find('.page-section');
            redirectSections.first().find('.merge-with-above').addClass('hidden');

            if (redirectSections.length == 1) {
                redirectSections.find('.move-section').addClass('hidden');
            }
        });

        var numberOfSections = surveyData.data('number-section');

        if (numberOfSections == 1) {
            $(firstSection).find('.move-section').addClass('hidden');
        }
    }

    // mark question required
    function markQuestionRequired()
    {
        $('.survey-form').find('.mark-question-required').remove();
        $('.survey-form').find('.form-line.sort').each(function (i) {
            if ($(this).find('.checkbox-question-required').is(':checked')) {
                $(`<span class="mark-question-required">&#42;<span>`).insertBefore($(this).find('.question-input'));
            }
        });
        var questionSelected = $('.survey-form').find('.liselected.question-active');

        if ($(questionSelected).find('.checkbox-question-required').is(':checked')) {
            $(questionSelected).find('.mark-question-required').remove();
        }
    }

    $('.survey-form').on('click', '.form-line.sort', function (e) {
        markQuestionRequired();
    });

    // if click header section
    $('.survey-form').on('click', '.section-header-title, .section-header-description', function (e) {
        var active = false;
        var question = $(this).closest('.page-section').find('.form-line.sort');

        question.each(function () {
            if ($(this).hasClass('question-active')) {
                active = true;

                return;
            }
        });

        if (!active) {
            question.first().click();
        }
    });

    // choose date format
    $('.content-wrapper').on('click', '.date-answer-icon, .date-format-question', function (e) {
        e.stopPropagation();
        $(this).closest('.date-answer-input').find('.menu-choice-dateformat ul').show();
    })

    $('.content-wrapper').on('click', '.date-format', function () {
        var selector = $(this).closest('.date-answer-input').find('.date-format-question');
        $(selector).attr('data-dateformat', $(this).attr('data-dateformat'));
        $(selector).text($(this).text());
        $(this).closest('.menu-choice-dateformat ul').hide();
    })

    $(document).click(function () {
        $('.menu-choice-dateformat ul').hide();
    })

    // save survey as draft
    $('#save-draft-btn').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var url = $(this).data('url');

        confirmInfo({message: Lang.get('lang.confirm_save_as_draft')}, function () {
            var dataArray = $('form.survey-form').serializeArray();
            var survey = getSurvey(dataArray);

            if (!survey) {
                return;
            }

            showLoaderAnimation();
            var data = JSON.stringify(survey);

            $.ajax({
                method: 'POST',
                url: url,
                data: data,
                success: function (data) {
                    if (data.success) {
                        window.onbeforeunload = null;
                        $(window).attr('location', data.redirect);
                    } else {
                        hideLoaderAnimation();
                        alertDanger({message: data.message});
                    }
                }
            })
        });
    });

    /*
     *  SURVEY EDIT PAGE
     */

    if (surveyData.data('page') == 'edit') {
        // re-load event
        $('.input-area, .answer-option-input').each(function () {
            if ($(this).hasClass('input-email-message')) {
                return;
            }

            autoResizeTextarea();
            $(this).focus();
            $(this).keyup();
        });

        $('.question-required-checkbox label .toggle').each(function () {
            var checked = parseInt($(this).prev().val());
            $(this).prev().attr('checked', checked ? true : false);

            if (checked) {
                $(this).addClass('active');
                markQuestionRequired();
            }
        });

        // focus first section title
        $('.input-area.section-header-title').first().focus();
        $('.input-area.section-header-title').first().click();
        $('.question-input.input-area').first().click();

        // re-load validation
        $('ul.page-section').each(function () {
            addValidationRuleForSection($(this).data('section-id'));

            $(this).find('li.form-line').each(function () {
                var questionType = parseInt($(this).data('question-type'));

                if (questionType > 0 && questionType <= 7) {
                    addValidationRuleForQuestion($(this).data('question-id'));

                    $(this).find('div.form-row.option').each(function () {
                        addValidationRuleForAnswer($(this).data('answer-id'));
                    });
                }
            });
        });

        // some of function of edit-page

        function removeEmailAnswered(email, labelEmail) {
            confirmWarning({message: Lang.get('lang.confirm_delete_answered_email')}, function () {
                removeEmail(email);
                $(labelEmail).remove();
                $('.input-email-send').focus();
            });
        }

        // 0: no-edit   1: edit    2: create
        function getUpdateStatusOfAnswer(sectionId, questionId, answer) {
            var status = 0; // no-edit

            var oldSesion = collect(oldSurveyData).where('id', sectionId);
            var oldQuestions = collect(!oldSesion.isEmpty() ? oldSesion.first().questions : []);
            var oldQuestion = oldQuestions.where('id', questionId);
            var oldAnswers = collect(!oldQuestion.isEmpty() ? oldQuestion.first().answers : []);
            var oldAnswer = oldAnswers.where('id', answer.id);
            oldAnswer = !oldAnswer.isEmpty() ? oldAnswer.first() : '';

            if (oldAnswer == '') {
                status = 2; //create
            } else if (oldAnswer.type != answer.type || oldAnswer.content != answer.content || oldAnswer.media != answer.media) {
                status = 1; //edit
            }

            return status;
        }

        // 0: no-edit   1: edit    2: create
        function getUpdateStatusOfQuestion(sectionId, question) {
            var status = 0; // no-edit

            var oldSection = collect(oldSurveyData).where('id', sectionId);
            var oldQuestions = collect(!oldSection.isEmpty() ? oldSection.first().questions : [])
            var oldQuestion = oldQuestions.where('id', question.id);
            oldQuestion = !oldQuestion.isEmpty() ? oldQuestion.first() : '';

            if (oldQuestion == '') {
                status = 2; // create
            } else if (oldQuestion.title != question.title || oldQuestion.media != question.media || oldQuestion.require != question.require) {
               status = 1; // edit
            }

            // check edit if type question is date
            if (!status && question.type == 5 && oldQuestion.date_format != question.date_format) {
                status = 1;
            }

            // check answers of this question is change ?
            var answersId = [];

            if (!status) {
                collect(question.answers).each(function (answer) {
                    if (answer.status) {
                        status = 1;

                        return;
                    }

                    answersId.push(answer.id);
                });
            }

            if (!status) {
                var oldAnswersId = collect(oldQuestion.answers).pluck('id');
                var answersDeleteId = oldAnswersId.diff(answersId);

                if (!answersDeleteId.isEmpty()) {
                    status = 1;
                }
            }

            return status;
        }

        // 0: no-edit   1: edit    2: create
        function getUpdateStatusOfSection(section) {
            var status = 0; // no-edit

            var oldSection = collect(oldSurveyData).where('id', section.id);

            if (oldSection.isEmpty()) {
                status = 2; // create
            } else {
                // check questions of this section is change ?
                collect(section.questions).each(function (question) {
                    if (question.status) {
                        status = 1;

                        return;
                    }
                });
            }

            return status;
        }

        // get list id of element (section, question, answer) has deleted
        function getElementsDeleteId(elementsOldId, elementsUpdateId) {

            for (var i = 0; i < elementsUpdateId.length; i ++) {
                var index = elementsOldId.indexOf(elementsUpdateId[i]);

                if (index != -1) {
                    elementsOldId.splice(index, 1);
                }
            }

            return elementsOldId;
        }

        // get update, create, delete data to edit survey
        function getSurveyUpdateData() {
            var updateData = {};

            // refresh variables data before use
            sectionsUpdate = {};
            questionsUpdate = {};
            answersUpdate = {};

            sectionsCreate = [];
            questionsCreate = [];
            answersCreate = [];

            sectionsUpdateId = [];
            questionsUpdateId = [];
            answersUpdateId = [];

            var dataArray = $('form.survey-form').serializeArray();
            var survey = getSurvey(dataArray);

            // get update data of survey
            updateData.title = survey.title;
            updateData.start_time = survey.start_time;
            updateData.end_time = survey.end_time;
            updateData.description = survey.description;

            // get update data and create data of sections, questions, answers
            updateData.update = {
                sections:  sectionsUpdate,
                questions: questionsUpdate,
                answers: answersUpdate
            };

            updateData.create = {
                sections: sectionsCreate,
                questions: questionsCreate,
                answers: answersCreate
            };

            // get list id of old sections, questions, answers
            var oldSections = collect(oldSurveyData);
            var oldSectionsId = oldSections.pluck('id').all();
            var oldQuestionsId = [];
            var oldAnswersId = [];

            oldSections.each(section => {
                var questionsId = collect(section.questions).pluck('id').all();
                oldQuestionsId = [... new Set(oldQuestionsId.concat(questionsId))];

                var oldQuestions = collect(section.questions);

                oldQuestions.each(question => {
                    var answersId = collect(question.answers).pluck('id').all();
                    oldAnswersId = [... new Set(oldAnswersId.concat(answersId))];
                });
            });

            // get list id of sections, questions, answers has deleted
            var sectionsDeleteId = getElementsDeleteId(oldSectionsId, sectionsUpdateId);
            var questionsDeleteId = getElementsDeleteId(oldQuestionsId, questionsUpdateId);
            var answersDeleteId = getElementsDeleteId(oldAnswersId, answersUpdateId);

            updateData.delete = {
                sections: sectionsDeleteId,
                questions: questionsDeleteId,
                answers: answersDeleteId
            };

            return updateData;
        }

        function exportOldResult() {
            window.onbeforeunload = null;
            $('#export-form').submit();
        }

        $('#export-form').on('keydown', '.result-file-name', function(event) {
            if (event.keyCode == 13) {
                event.preventDefault();
            }
        });

        // check change value sections questions, answers
        function isUpdate() {
            var surveyUpdateData = getSurveyUpdateData();
            var isUpdate = false;

            collect(surveyUpdateData.update.sections).each(function (section) {
                if (section.update != undefined && section.update != 0) {
                    isUpdate = true;

                    return;
                }
            })

            if (isUpdate) {
                return isUpdate;
            }

            var createData = surveyUpdateData.create;

            if (!createData.sections.length && !createData.questions.length && !createData.answers.length) {
                return false;
            }

            return true;
        }

        function showUpdateModal()
        {
            if (isUpdate()) {
                $('#option-update-modal .only-send-update').show();
            } else {
                $('#option-update-modal .only-send-update').hide();
            }

            $('#option-update-modal .container-radio-setting-survey input').first().prop('checked', true);
            $('#option-update-modal').modal('show');
        }

        // validate survey data when open modal option
        $('#open-send-option-modal').on('click', function () {
            if (!validateSurvey()) {
                return false;
            }

            isClickSendSurvey = true;
            $('#survey-setting-btn').click();
        });

        $('#update-survey-draft-to-open').on('click', function () {
            if (!validateSurvey()) {
                return false;
            }

            $('#setting-survey .btn-action-setting-save').text(Lang.get('lang.send'));
            isClickSendSurvey = true;
            $('#survey-setting-btn').click();
        });

        // close modal option and click btn edit survey
        $('#send-update-btn').on('click', function (e) {
            $(this).closest('.option-update-content').find('.option-save-result').each(function () {
                if($(this).prop('checked') && $(this).hasClass('save')) {
                    exportOldResult();
                }
            });

            $(this).closest('.option-update-content').find('.option-send-survey').each(function () {
                if ($(this).prop('checked')) {
                    $(this).closest('.option-update-content').attr('val', $(this).attr('val'));
                }
            });

            setTimeout(function() {
                $('#send-update-btn').next('#edit-survey-btn').click();
            }, 200);
        });

        // edit and send survey
        $('#edit-survey-btn').on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            var surveyUpdateData = getSurveyUpdateData();
            var option = $('#option-update-modal .option-update-content').attr('val');

            if (!isUpdate() && parseInt(option) == 2) {
                return;
            }

            surveyUpdateData.option = option;

            if (!surveyUpdateData) {
                return;
            }

            showLoaderAnimation();

            $.ajax({
                method: 'PUT',
                url: $(this).data('url'),
                type: 'json',
                data: JSON.stringify(surveyUpdateData)
            })
            .done(function (data) {
                if (data.success) {
                    window.onbeforeunload = null;
                    $(window).attr('location', data.redirect);
                } else {
                    if (data.redirect != '') {
                        window.onbeforeunload = null;
                        $(window).attr('location', data.redirect);

                        return;
                    }

                    hideLoaderAnimation();
                    alertDanger({message: data.message});
                }
            })
            .fail(function (data) {
                hideLoaderAnimation();
                alertDanger({message: Lang.get('lang.wrong_data')});
            });
        });

        // update survey with draft
        $('#update-survey-draft').on('click', function () {
            var surveyUpdateData = getSurveyUpdateData();
            showLoaderAnimation();

            $.ajax({
                method: 'PUT',
                url: $(this).data('url'),
                type: 'json',
                data: JSON.stringify(surveyUpdateData)
            })
            .done(function (data) {
                if (data.success) {
                    window.onbeforeunload = null;
                    $(window).attr('location', data.redirect);
                } else {
                    if (data.redirect != '') {
                        window.onbeforeunload = null;
                        $(window).attr('location', data.redirect);

                        return;
                    }

                    hideLoaderAnimation();
                    alertDanger({message: data.message});
                }
            })
        });

        $('.option-save-result').change(function () {
            if ($(this).hasClass('save')) {
                $('.save-old-result').show('300');
            } else {
                $('.save-old-result').hide('300');
            }
        });
    }
});
