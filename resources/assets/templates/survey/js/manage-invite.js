$(document).ready(function() {
    $('[data-toggle="tooltip"]').tooltip();
    var tokenManage = '';

    $(document).on('click', '.process-bar-survey', function(event) {
        var numberIncognitoAnswer = $(this).attr('data-incognito-answer');

        if (parseInt(numberIncognitoAnswer)) {
            $('.number-incognito-answer').text(Lang.get('lang.count_incognito_answer', {count: numberIncognitoAnswer}));
        }

        event.preventDefault();
        tokenManage = $(this).attr('data-token-manage');
        showStatusAnswer(tokenManage);
    });

    $(document).on('click', '.emails-not-answer', function(event) {
        event.preventDefault();
        showStatusAnswer(tokenManage, 2);
    });

    $(document).on('click', '.emails-answered', function(event) {
        event.preventDefault();
        showStatusAnswer(tokenManage, 1);
    });

    $(document).on('click', '.all-email', function(event) {
        event.preventDefault();
        showStatusAnswer(tokenManage);
    });

    $(document).on('keyup', '.search-mail-invite', function(event) {
        event.preventDefault();
        var text = $(this).val();
        showStatusAnswer(tokenManage, '', text);
    });

    function showStatusAnswer(tokenManage, status = 0, text = '') {
        $.ajax({
            url: $('.process-bar-survey').attr('data-url'),
            type: 'POST',
            data: {
                token_manage: tokenManage,
            },
        })
        .done(function(data) {
            if (data.success) {
                var array = data.data;

                if (text) {
                    array = find(text, array);
                }

                $('.body-table-invite-status').empty();

                if (array.length) {
                    $('.notice-data-empty').hide();
                    $('.table-invite').show();

                    var index = 0;
                    array.forEach(function(item) {
                        if (status == 1 && !item['count']) {
                            return;
                        }

                        if (status == 2 && item['count']) {
                            return;
                        }

                        var element = item['count']
                            ? `<span class="fa fa-circle green"></span>`
                            : `<span class="fa fa-circle blue">`;

                        $('.body-table-invite-status').append(`
                            <tr>
                                <td width="15%">${++ index}</td>
                                <td>${item['email']}</td>
                                <td width="20%"><span class="inviter-description">${element}</span></td>
                                <td width="15%">${item['count']}</td>
                            </tr>
                        `);
                    });
                } else {
                    $('.notice-data-empty').show();
                    $('.table-invite').hide();
                }
            }
        });
    }

    function find(text, array) {
        var result = [];

        for (var index in array) {
            if (array[index]['email'].indexOf(text) >= 0) {
                result.push(array[index]);
            }
        }

        return result;
    }
});
