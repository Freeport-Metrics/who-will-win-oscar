/**
 * Created by Matuszewski on 03/02/16.
 */
angular.module('whoWillWinOscars.controllers')
    .controller('IndexController', function(
        $scope,
        $interval,
        $timeout
    ){
      $scope.socket = io.connect('http://localhost:3001', {
        'force new connection':true
      });
      $scope.tweets = [];
      $scope.tweet = null;
      $scope.tweethide = false;
      $scope.initialized = false;
      $scope.tweetCount = {}
      $scope.counters = [];
      $scope.preparedAggregatedData = {
        'Big Short': [],
        'Brooklyn': [],
        'Room': [],
        'Mad Max': [],
        'Spotlight': [],
        'Revenant': [],
        'Bridge Of Spies': [],
        'Martian': [],
        'time': [0,0,0,0,0,0,0,0]
      }
      $scope.preparedNotAggregatedData = angular.copy($scope.preparedAggregatedData);

      $scope.applyClass = applyClass;
      $scope.applyHighlight = applyHighlight;

      function applyHighlight(index){
        return index == 0
      }

      function applyClass(params){
        return params.split(' ').join('-')
      }

      var chartConfig = {
        bindto: '#aggregated_chart',
        data: {
          x: 'time',
          xFormat: '%H:%M',
          json: $scope.preparedAggregatedData,
          type: 'spline',
          colors: {
            'Revenant': '69788C',
            'Martian': 'AA5A28',
            'Bridge Of Spies': '821E1E',
            'Spotlight': 'DCDCDC',
            'Mad Max': 'E1BE32',
            'Room': '648CAA',
            'Brooklyn': '87A096',
            'Big Short': '82643C',
          }
        },
        tooltip: {
          show: false,
          //contents: function (d, defaultTitleFormat, defaultValueFormat, color) {
          //  return "<div class='tweet'>Tooltip</div>"
          //}
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
            show:false
          },
          y2: {
            show: true
          }
        }
      }

      var aggregatedChart = c3.generate(chartConfig);

      chartConfig['bindto'] = '#not_aggregated_chart';
      chartConfig['data']['json'] = $scope.preparedNotAggregatedData;
      var nonAggregatedChart = c3.generate(chartConfig);

      $scope.socket.on("connect", function(socket){
        console.log("client connected to server");
      });

      $scope.socket.on("disconnect", function(socket){
        console.log("client disconnected from server");
      });

      $scope.socket.on('tweet_counters', function(data){
        $scope.$apply(function(){
          $scope.counters = data;
        });
      });

      $scope.socket.on('tweet', function(data){
        $scope.$apply(function(){
          if(!$scope.tweet){
            $scope.tweethide = false;
            $scope.tweet = data.new_val;
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

      $scope.socket.on('tweet_aggregated', function(data){
        angular.forEach(data, function(value,key){
          $scope.preparedAggregatedData['time'].push(key);
          if($scope.preparedAggregatedData['time'].length > 59){
            $scope.preparedAggregatedData['time'].shift();
          }

          angular.forEach(data[key], function(value,key){
            $scope.preparedAggregatedData[key].push(value);
            if($scope.preparedAggregatedData[key].length > 59){
              $scope.preparedAggregatedData[key].shift();
            }
          })
        })
        aggregatedChart.load({
          json: $scope.preparedAggregatedData
        });
      })

      $scope.socket.on('tweet_not_aggregated', function(data){
        angular.forEach(data, function(value,key){
          $scope.preparedNotAggregatedData['time'].push(key);
          if($scope.preparedNotAggregatedData['time'].length > 59){
            $scope.preparedNotAggregatedData['time'].shift();
          }
          angular.forEach(data[key], function(value,key){
            $scope.preparedNotAggregatedData[key].push(value);
            if($scope.preparedNotAggregatedData[key].length > 59){
              $scope.preparedNotAggregatedData[key].shift();
            }
          })
        })
        nonAggregatedChart.load({
          json: $scope.preparedNotAggregatedData
        });
      })
    })