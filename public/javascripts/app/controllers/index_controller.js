/**
 * Created by Matuszewski on 03/02/16.
 */
angular.module('whoWillWinOscars.controllers')
    .controller('IndexController', function(
        $scope,
        $interval,
        $timeout,
        $filter
    ){
      $scope.socket = io.connect(window.location.href , {
        multiplex: false
      });
      $scope.tweets = [];
      $scope.newVal = null;
      $scope.newValNonAgg = null;
      $scope.tweet = null;
      $scope.tweethide = false;
      $scope.initialized = false;
      $scope.tweetCount = {}
      $scope.counters = [];
      $scope.preparedAggregatedData = {};
      $scope.preparedNotAggregatedData = {};

      $scope.movieLabels = {}

      $scope.socket.on("connect", function(socket){
        console.log("client connected to server");
      });

      $scope.socket.on("structure", function(data){
        $scope.$apply(function(){
          $scope.chartConfig = {
            bindto: '#aggregated_chart',
            data: {
              x: 'time',
              xFormat: '%H:%M',
              json: $scope.preparedAggregatedData,
              type: 'spline',
              colors: {}
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
            axis:{
              x: {
                type: 'timeseries',
                tick: {
                  format: '%H:%M'
                }
              },
              y: {
                show: false,
                padding: {bottom:10}
              },
              y2: {
                show: true
              }
            }
          }
          var index = 0;
          angular.forEach(data.labels, function(value, key){
            $scope.movieLabels[key] = value;
            $scope.chartConfig['data']['colors'][key] = data.colors[key];
            $scope.preparedAggregatedData[key] = [];
            index = index + 1;
          })
          $scope.preparedAggregatedData['time'] = []
          $scope.preparedNotAggregatedData = angular.copy($scope.preparedAggregatedData);

          /* Generating charts */

          $scope.aggregatedChart = c3.generate($scope.chartConfig);
          $scope.chartConfig['bindto'] = '#not_aggregated_chart';
          $scope.chartConfig['data']['json'] = $scope.preparedNotAggregatedData;
          $scope.nonAggregatedChart = c3.generate($scope.chartConfig);
        })
      })

      $scope.socket.on("disconnect", function(socket){
        console.log("client disconnected from server");
      });

      $scope.socket.on('tweet', function(data){
        $scope.$apply(function(){
          if(!$scope.tweet){
            $scope.tweethide = false;
            $scope.tweet = data;
            $scope.tweet.text = $scope.tweet.text.replace(new RegExp($scope.tweet.movies[0].replace(' ', ''), "ig"),
                '<span class="'+$scope.applyClass($scope.tweet.movies[0])+'">'+$scope.tweet.movies[0]+'</span>')
            $scope.initialized = true;
            $timeout(function(){
              $scope.tweethide = true;
              $timeout(function(){
                $scope.tweet = null;
              }, 1500)
            }, 6000)
          }
        });
      });

      $scope.socket.on('initialize_tweet_aggregated', function(data){
        $scope.prepareChart($scope.aggregatedChart, data, $scope.preparedAggregatedData);
        $scope.counters.length = 0;
        var counter_key = Object.keys(data[0])
        $scope.updateCounters(data[0][counter_key]);
        $scope.updateChart($scope.aggregatedChart, $scope.preparedAggregatedData, 'newVal', true);
      })

      $scope.socket.on('initialize_tweet_not_aggregated', function(data){
        $scope.prepareChart($scope.nonAggregatedChart, data, $scope.preparedNotAggregatedData);
        $scope.updateChart($scope.nonAggregatedChart, $scope.preparedNotAggregatedData, 'newValNonAgg', false);
      })

      $scope.socket.on('new_tweets_aggregates', function(data){
        $scope.newVal = data;
      })

      $scope.socket.on('new_tweets', function(data){
        $scope.newValNonAgg = data;
      })

      $scope.applyClass = applyClass;
      $scope.applyHighlight = applyHighlight;
      $scope.prepareChart = prepareChart;
      $scope.updateChart = updateChart;
      $scope.updateCounters = updateCounters;

      function applyHighlight(index){
        return index == 0
      }

      function applyClass(params){
        if(!params){
          return;
        }
        return params.split(' ').join('-').toLowerCase();
      }

      function prepareChart(chart, data, chartData){
        angular.forEach(data, function(value, index){
          var key = Object.keys(value)[0]
          chartData['time'].push(key)
          angular.forEach(value[key], function(val,key){
            chartData[key].push(val);
          })
        })
        chart.load({
          json: chartData
        });
      }

      function updateChart(chart, chartData, newValListener, updateCounters){
        $interval(function(){
          var date = new Date();
          var current_time =  d3.time.format("%H:%M")(new Date(date.getUTCFullYear(), date.getUTCMonth(),
              date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()));
          var time = false;
          angular.forEach(chartData['time'], function(value, index){
            if(value == current_time){
              time = true;
            }
          })
          if(!time){
            chartData['time'].unshift(current_time);
            chartData['time'].pop();
            angular.forEach(chartData, function(value, key){
              if(key != 'time'){
                value.pop();
                value.unshift(value[0]);
              }
            });
            chart.load({
              json: chartData
            });
          }
          if($scope[newValListener]){
            var counter_key = Object.keys($scope[newValListener])[0]
            if(updateCounters){
              $scope.counters.length = 0;
              $scope.updateCounters($scope[newValListener][counter_key])
            }
            angular.forEach($scope[newValListener][counter_key], function(newValue, key){
              if(!time){
                chartData[key].unshift(newValue);
                if(chartData[key].length > 60){
                  chartData[key].pop();
                }
              }else{
                chartData[key][0] = newValue;
              }
            })
            chart.load({
              json: chartData
            });
            $scope[newValListener] = null;
          }
        }, 1000)
      }

      function updateCounters(data){
        angular.forEach(data, function(value, key){
          $scope.counters.push({value: value, name: key})
        });
        $scope.counters = $filter('orderBy')($scope.counters, 'value', true);
      }

    })