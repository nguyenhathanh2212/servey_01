$(document).ready(function () {
    getOverviewSurvey();
});
function getOverviewSurvey() {
    Highcharts.chart('management-chart', {
        chart: {
            zoomType: 'x'
        },

        title: {
            text: Lang.get('result.activity_survey')
        },

        subtitle: {
            //
        },

        xAxis: {
            categories: data['x']
        },

        yAxis: {
            title: {
                text: Lang.get('result.number_user')
            }
        },

        plotOptions: {
            line: {
                dataLabels: {
                    enabled: true
                },
                enableMouseTracking: false
            }
        },

        series: [{
            name: '',
            data: data['y']
        }]
    });
}
