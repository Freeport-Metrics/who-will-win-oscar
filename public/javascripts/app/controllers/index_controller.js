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

      $scope.movieLabels = {}

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
          initialData['time'] = [];

          $scope.preparedAggregatedData = angular.copy(initialData);
          $scope.aggregatedChart = $scope.createChart('#aggregated_chart', $scope.preparedAggregatedData,
              colors, '%H:%M:%S');
        })
      })

      $scope.socket.on("disconnect", function (socket) {
        console.log("client disconnected from server");
      });

      $scope.socket.on('tweet', function (data) {
        data.date = new Date(); // to synchronize server and ui time
        $scope.uiBackendCommons.updateCache($scope.preparedAggregatedData, true, data);
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
        $interval($scope.reloadAggregatedChart, 1000);
      })

      $scope.createChart = createChart;
      $scope.applyClass = applyClass;
      $scope.applyHighlight = applyHighlight;
      $scope.prepareChart = prepareChart;
      $scope.addTimeDimension = addTimeDimension;
      $scope.reloadAggregatedChart = reloadAggregatedChart;

      function reloadAggregatedChart() {
        $scope.uiBackendCommons.updateCache($scope.preparedAggregatedData, true);
        var sampledData = sampleData($scope.preparedAggregatedData, 1);
        var ticks = [];
        angular.forEach(sampledData.time, function(time){
          if(time.indexOf(':00')!= -1){
            ticks.push(time);
          }
        })
        $scope.aggregatedChart.internal.config.axis_x_tick_values= ticks; // WARNING: using private api
        $scope.aggregatedChart.load({
          json: sampledData
        });
      }

      function createChart(elementId, data, colors, dateFormat) {
        return c3.generate({
          bindto: elementId,
          data: {
            x: 'time',
            xFormat: dateFormat,
            json: data,
            type: 'spline',
            colors: colors
          },
          tooltip: {
            show: false
          },
          point: {
            show: false
          },
          legend: {
            show: false
          },
          axis: {
            x: {
              type: 'timeseries',
              tick: {
                format: dateFormat,
                values:['15:39:00']
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

      function prepareChart(chart, data, chartData) {
        angular.forEach(data, function (value, index) {
          var key = Object.keys(value)[0]
          chartData['time'].push(key)
          angular.forEach(value[key], function (val, key) {
            chartData[key].push(val);
          })
        })
        chart.load({
          json: chartData
        });
      }

      function addTimeDimension(data) {
        var timeDimension = [];
        var date = new Date();
        var lastSecond = new Date(date.getUTCFullYear(), date.getUTCMonth(),
            date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
        for (var i = 0; i < $scope.uiBackendCommons.chartMinutesBack * 60; i++) {
          var second = new Date(lastSecond - i * 1000);
          timeDimension.push(d3.time.format("%H:%M:%S")(second));
        }
        data['time'] = timeDimension;
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

    })