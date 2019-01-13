<?php

return [
    'title_web' => 'FSurvey',
    'image_system' => '/user/images/',
    'image_user_default' => '/templates/survey/images/default_user.png',
    'background_profile' => '/templates/survey/images/background_profile.jpg',
    'image_default' => 'questionDefault.png',
    'image_path' => '/image/',
    'image_question_path' => '/user/uploads/question/',
    'image_answer_path' => '/user/uploads/answer/',
    'image_path_system' => '/user/images/',
    'path_upload' => 'public/uploads/',
    'path_upload_image' => 'public/uploads/images',
    'path_storage_image_direct' => 'storage/app/public/uploads/images',
    'path_storage_image' => 'storage/uploads/images',
    'path_upload_avatar' => 'public/uploads/avatars',
    'cover-profile' => [
        'default' => 'templates/survey/images/cover-profile.jpg',
        '1' => 'templates/survey/images/cover-profile1.jpg',
        '2' => 'templates/survey/images/cover-profile2.jpg',
        '3' => 'templates/survey/images/cover-profile3.jpg',
        '4' => 'templates/survey/images/cover-profile4.jpg',
        '5' => 'templates/survey/images/cover-profile5.jpg',
        '6' => 'templates/survey/images/cover-profile6.jpg',
        '7' => 'templates/survey/images/cover-profile7.jpg',
        '8' => 'templates/survey/images/cover-profile8.jpg',
    ],
    'choose-cover-profile' => [
        'default' => 'templates/survey/images/choose-cover-profile.jpg',
        '1' => 'templates/survey/images/choose-cover-profile1.jpg',
        '2' => 'templates/survey/images/choose-cover-profile2.jpg',
        '3' => 'templates/survey/images/choose-cover-profile3.jpg',
        '4' => 'templates/survey/images/choose-cover-profile4.jpg',
        '5' => 'templates/survey/images/choose-cover-profile5.jpg',
        '6' => 'templates/survey/images/choose-cover-profile6.jpg',
        '7' => 'templates/survey/images/choose-cover-profile7.jpg',
        '8' => 'templates/survey/images/choose-cover-profile8.jpg',
    ],
    'create_survey_complete' => [
        'header_img' => '/templates/survey/images/event-bottom.png',
        'congrat_img' => '/templates/survey/images/congrat.png',
    ],
    'question' => [
        'not_required' => 0,
        'required' => 1,
    ],
    'paginate' => 9,
    'type_answer' => [
        'radiobutton' => '1',
        'checkbox' => '2',
        'textfield' => '3',
        'selectbox' => '4',
    ],
    'result' => [
        'success' => 'true',
        'fail' => 'false',
    ],
    'feature' => 1,
    'not_feature' => 0,
    'mark' => 1,
    'unmark' => 0,
    'google' => 'google',
    'facebook' => 'facebook',
    'twitter' => 'twitter',
    'framgia' => 'framgia',
    'replace' => 'survey/result/',
    'required' => [
        'true' => 1,
        'false' => 0,
    ],
    'return' => [
        'bool' => 0,
        'view' => 1,
    ],
    'locale' => [
        'en',
        'vn',
        'jp',
    ],
    'language' => [
        'en' => 'English',
        'vn' => 'Việt Nam',
        'jp' => '日本語',
    ],
    'options' => [
        1,
        2,
        3,
    ],
    'key' => [
        'requireAnswer' => 1,
        'limitAnswer' => 2,
        'hideResult' => 3,
        'requireOnce' => 4,
        'tailMail' => 5,
        'reminder' => 6,
    ],
    'require' => [
        'email' => 1,
        'name' => 2,
        'both' => 3,
        'loginWsm' => 4,
    ],
    'reminder' => [
        'week' => 1,
        'month' => 2,
        'quarter' => 3,
    ],
    'listKey' => [
        1,
        2,
        3,
        4,
        5,
        6,
    ],
    'email_unidentified' => 0,
    'name_unidentified' => 0,
    'content_length_default' => 50,
    'name_length_default' => 10,
    'sameFormatDateTime' => [
        'en',
        'jp',
    ],
    'title_length_default' => 50,
    'max_limit' => 10,
    'cookie' => [
        'timeout' => [
            'one_day' => 1440,
        ],
    ],
    'company' => [
        'fb_company' => 'https://www.facebook.com/FramgiaVietnam/?fref=ts',
        'github_company' => 'https://github.com/framgia',
        'linkedin_company' => 'https://www.linkedin.com/company/framgia-vietnam',
        'tools_company' => 'http://wsm.framgia.vn/all-tools',
        'hr_email_company' => 'hr_team@framgia.com',
    ],
    'public_template' => '/templates/survey/',
    'plugins' => '/plugins/',
    'logo_content' => '<span class="highlight">F</span>Survey',
    'counter_default_value' => 0,
    'feature_icon' => [
        'icon_1' => '/templates/survey/images/icon/about1.png',
        'icon_2' => '/templates/survey/images/icon/about2.png',
        'icon_3' => '/templates/survey/images/icon/about3.jpg',
    ],
    'blank_icon' => '/templates/survey/images/icon/blank.gif',
    'page_profile_active' => [
        'information' => '1',
        'list_survey' => '2',
        'list_feedback' => '3',
    ],
    'vn' => 'vn',
    'fsurvey' => 'FSurvey',
    'max_size_image' => 5120,
    'quantity_answer' => [
        'default' => 1,
        'min' => 1,
        'max' => 10,
    ],

    /**
     * Survey settings
     */

    'survey' => [
        'status' => [
            'open' => 1,
            'close' => 2,
            'draft' => 3,
        ],
        'feature' => [
            'default' => 1,
        ],
        'invite_status' => [
            'not_finish' => 0,
            'finished' => 1,
        ],
        'section_update' => [
            'default' => 0,
            'updated' => 1,
        ],
        'question_update' => [
            'default' => 0,
            'updated' => 1,
        ],
        'answer_update' => [
            'default' => 0,
            'updated' => 1,
        ],
        'option' => [
            'first' => 1,
        ],
        'members' => [
            'owner' => 0,
            'editor' => 1,
            'status' => [
                'approve' => 1,
            ],
        ],
        'invited' => 2,
        'send_mail_to_wsm' => [
            'none' => 0,
            'all' => 1,
        ],
        'paginate' => 15,
        'number_answer_default' => 0,
    ],
    'question_type' => [
        'no_type' => 0,
        'short_answer' => 1,
        'long_answer' => 2,
        'multiple_choice' => 3,
        'checkboxes' => 4,
        'date' => 5,
        'time' => 6,
        'title' => 7,
        'image' => 8,
        'video' => 9,
        'redirect' => 10,
    ],
    'survey_setting' => [
        'default' => 0,
        'answer_required' => [
            'none' => 0,
            'login' => 1,
            'login_with_wsm' => 2,
        ],
        'answer_unlimited' => 0,
        'reminder_email' => [
            'none' => 0,
            'by_week' => 1,
            'by_month' => 2,
            'by_quarter' => 3,
            'by_option' => 4,
        ],
        'privacy' => [
            'public' => 2,
            'private' => 1,
        ],
    ],
    'answer_type' => [
        'option' => 1,
        'other_option' => 2,
    ],
    'question_require' => [
        'no_require' => 0,
        'require' => 1,
    ],

    /**
     * Media settings
     */

    'media_type' => [
        'image' => 1,
        'video' => 2,
    ],

    /**
     * Settings type
     */

    'setting_type' => [
        'answer_required' => [
            'content' => 'answer_required',
            'key' => 1,
        ],
        'answer_limited' => [
            'content' => 'answer_limited',
            'key' => 2,
        ],
        'reminder_email' => [
            'content' => 'reminder_email',
            'key' => 3,
        ],
        'privacy' => [
            'content' => 'privacy',
            'key' => 4,
        ],
        'question_type' => [
            'content' => 'question_type',
            'key' => 5,
        ],
        'answer_type' => [
            'content' => 'answer_type',
            'key' => 6,
        ],
        'send_mail_to_wsm' => [
            'content' => 'send_mail_to_wsm',
            'key' => 7,
        ],
        'next_remind_time' => [
            'content' => 'next_time',
            'key' => 8,
        ],
        'option_update_survey' => [
            'content' => 'option_update',
            'key' => 9,
        ],
    ],

    'checkEventOdd' => 2,
    'roundPercent' => 2,
    'number_0' => 0,
    'number_1' => 1,
    'number_100' => 100,
    'limit_answer_content' => 80,
    'detect_page_refresh' => 'max-age=0',
    'section_show_default' => 0,
    'section_order_default' => 0,
    'limit_title_excel' => 25,
    'invited' => 1,
    'date_format_vn' => 'DD/MM/YYYY',
    'date_format_en' => 'MM/DD/YYYY',
    'date_format_jp' => 'YYYY/MM/DD',
    'group_content_result' => '',

    /**
     *  Survey edit
    */

    'option_update' => [
        'dont_send_survey_again' => 0,
        'send_all_question_survey_again' => 1,
        'only_send_updated_question_survey' => 2,
    ],
    'link_doing' => '.../surveys-',
    'link_manage' => '.../management-survey/',
    'feedbacks' => [
        'condition_search' => [
            'all' => 0,
            'by_name' => 1,
            'by_email' => 2,
        ]
    ],
    'index_section' => [
        'start' => 0,
        'middle' => 1,
        'end' => 2,
    ],
];
