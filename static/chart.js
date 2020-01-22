google.charts.load('current', {packages: ['corechart', 'line']});
google.charts.setOnLoadCallback(drawBasic);

function drawBasic() {



    const Http = new XMLHttpRequest();
    const url='http://192.168.0.210:3002/load_result';
    Http.open("GET", url);
    Http.send();

    Http.onload = function() {
        var chart = document.getElementById('chart_div');
        if (chart==null) {return;}
        var data = new google.visualization.DataTable();
        data.addColumn('datetime', 'Период');
        data.addColumn('number', 'Скорость');
        data.addColumn('number', 'Ошибки');

        var results1 = JSON.parse(Http.response);
        const new_results_for_chart = results1.map(x => [new Date(x[0]), x[1], x[2]])
        
        data.addRows(new_results_for_chart);
        var options = {  hAxis: {  title: 'Даты' },  vAxis: { title: 'Количество' }, height:500 };
        var chart = new google.visualization.LineChart(document.getElementById('chart_div'));

        chart.draw(data, options);
    }

    }
