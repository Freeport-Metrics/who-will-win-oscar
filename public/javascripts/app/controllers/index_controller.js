/**
 * Created by Matuszewski on 03/02/16.
 */
angular.module('whoWillWinOscars.controllers')
    .controller('IndexController', function ($scope, $interval, $timeout, $filter) {
      $scope.socket = io.connect(window.location.href, {
        multiplex: false
      });
      $scope.tweets = [];
      $scope.tweet = null;
      $scope.tweethide = false;
      $scope.initialized = false;
      $scope.preparedAggregatedData = {};
      $scope.aggregatedChart = null;
      $scope.counters = [];
      $scope.uiBackendCommons = uiBackendCommonsInit();
      $scope.counters = [];
      $scope.countersObject = {};
      $scope.movieLabels = {};
      $scope.countersObjectHighlight = {};
      $scope.counterHighlightTimout = {};
      $scope.intervalTimer = 0;
      $scope.aggregatedChartInterval = $interval;
      $scope.reloadFlag = 0;

      $scope.socket.on("connect", function (socket) {
        console.log("client connected to server");
      });

      $scope.socket.on("structure", function (data) {
        $scope.$apply(function () {
          var index = 0;
          var initialData = {};
          var colors = {};
          angular.forEach(data.labels, function (value, key) {
            $scope.movieLabels[key] = value;
            colors[key] = data.colors[key];
            initialData[key] = [];
            index = index + 1;
          })
          $scope.countersObject = data.counters;
          updateCounters(data.counters);
          initialData['time'] = [];

          $scope.preparedAggregatedData = angular.copy(initialData);
          $scope.aggregatedChart = $scope.createChart('#aggregated_chart', $scope.preparedAggregatedData,
              colors, '%H:%M:%S');
        })
      })

      $( window ).blur( function(){
        console.log("Killing chart")
        $scope.socket.disconnect();
        $interval.cancel($scope.aggregatedChartInterval);
        if(document.hidden){
          $("#aggregated_chart").remove();
        }
      });

      $(window).focus( function(){
        console.log("reloading...");
        if ( navigator.userAgent.toLowerCase().indexOf('chrome') > -1){
          location.reload();
        }
        if($scope.reloadFlag > 0){
          location.reload();
        }
        $scope.reloadFlag++;
      });

      $scope.socket.on("disconnect", function (socket) {
        console.log("client disconnected from server");
      });

      $scope.socket.on('tweet', function (data) {
        data.date = new Date(); // to synchronize server and ui time
        $scope.uiBackendCommons.updateCache($scope.preparedAggregatedData, true, data);
        $scope.uiBackendCommons.updateCounter($scope.countersObject, data);
        $scope.counters = [];
        updateCounters($scope.countersObject);
        var movie = data.movies[0]; // naive assumption, one movie per tweet, should be true most of the time
        $scope.countersObjectHighlight[movie] = true;
        if($scope.counterHighlightTimout[movie]){
          $timeout.cancel($scope.counterHighlightTimout[movie]);
        }
        $scope.counterHighlightTimout[movie] = $timeout(function () {
          $scope.countersObjectHighlight[movie] = false;
        },2000);
        $scope.$apply(function () {
          if (!$scope.tweet) {
            $scope.tweethide = false;
            $scope.tweet = data;
            $scope.tweet.text = $scope.tweet.text.replace(new RegExp($scope.tweet.movies[0].replace(' ', ''), "ig"),
                    '<span class="' + $scope.applyClass($scope.tweet.movies[0]) + '">' + $scope.tweet.movies[0] + '</span>')
            $scope.initialized = true;
            $timeout(function () {
              $scope.tweethide = true;
              $timeout(function () {
                $scope.tweet = null;
              }, 1500)
            }, 6000)
          }
        });
      });

      $scope.socket.on('initialize_tweet_aggregated', function (data) {
        $scope.preparedAggregatedData = data;
        $scope.addTimeDimension($scope.preparedAggregatedData);
        $scope.aggregatedChartInterval = $interval($scope.reloadAggregatedChart, 1000);
      });

      $scope.createChart = createChart;
      $scope.applyClass = applyClass;
      $scope.applyHighlight = applyHighlight;
      $scope.prepareChart = prepareChart;
      $scope.addTimeDimension = addTimeDimension;
      $scope.reloadAggregatedChart = reloadAggregatedChart;
      $scope.leadingDigits = leadingDigits;
      $scope.lastDigit = lastDigit;

      function reloadAggregatedChart() {
        $scope.uiBackendCommons.updateCache($scope.preparedAggregatedData, true);

        $scope.intervalTimer = $scope.intervalTimer + 1;

        if ($scope.intervalTimer > 59){
          $scope.intervalTimer = 0;
          var ticks = [];
          for (i = 0 ; i < 5; i++){
            var date = new Date();
            var minutes = date.getMinutes() - i;
            date.setMinutes(minutes);
            date.setSeconds("00");
            ticks.push(date);

          }
          $scope.aggregatedChart.internal.config.axis_x_tick_values = ticks;


        }


        // WARNING: using private api
        $scope.aggregatedChart.load({
          json: $scope.preparedAggregatedData
        });
      }

      function createChart(elementId, data, colors, dateFormat) {
        return c3.generate({
          bindto: elementId,
          data: {
            x: 'time',
            json: data,
            type: 'line',
            colors: colors
          },
          tooltip: {
            show: false
          },
          point: {
            show: false
          },
          padding:{
            left: 0,
            bottom: 20
          },
          axis: {
            x: {
              type: 'timeseries',
              tick: {
                format: dateFormat,
                culling:{
                  max: 5
                }
              }
            },
            y: {
              show: false,
              padding: {bottom: 10}
            },
            y2: {
              show: true
            }
          }
        });
      }

      function applyHighlight(index) {
        return index == 0
      }

      function applyClass(params) {
        if (!params) {
          return;
        }
        return params.split(' ').join('-').toLowerCase();
      }

      function leadingDigits(digits) {
        var digitsString = digits.toString();
        return digitsString.substring(0, digitsString.length - 1);
      }

      function lastDigit(digits) {
        var digitsString = digits.toString();
        return digitsString.substring(digitsString.length - 1);
      }

      function prepareChart(chart, data, chartData) {
        chart.load({
          json: chartData
        });
      }

      function addTimeDimension(data) {
        var keys = $scope.uiBackendCommons.generateKeys($scope.uiBackendCommons.chartMinutesBack*60,new Date());
        data.time = keys;
      }


      // assuming data in reverse order
      function sampleData(data, divider) {
        var result = {};
        angular.forEach(data, function (value, key) {
          var sampled = [];
          for (var i = 0; i < value.length; i++) {
            if ((i % divider) == 0) {
              sampled.push(value[i]);
            }
          }
          result[key] = sampled;
        });
        return result;
      }

      function updateCounters(data) {
        angular.forEach(data, function (value, key) {
          $scope.counters.push({value: value, name: key})
        });
        $scope.counters = $filter('orderBy')($scope.counters, 'value', true);
      }

    })