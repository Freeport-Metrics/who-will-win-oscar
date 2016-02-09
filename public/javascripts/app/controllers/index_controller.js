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
      $scope.preparedData = {
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

      $scope.applyClass = applyClass;
      $scope.applyHighlight = applyHighlight;

      function applyHighlight(index){
        return index == 0
      }

      function applyClass(params){
        return params.split(' ').join('-')
      }

      var chart = c3.generate({
        bindto: '#chart',
        data: {
          x: 'time',
          json: $scope.preparedData,
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
              format: function(d){
                return d;
              }
            }
            //categories: ['Revenant','Martian','Bridge Of Spies','Spotlight','Mad Max','Room','Brooklyn','Big Short']
          },
          y: {
            show:false
          },
          y2: {
            show: true
          }
        }
      });

      var data = [
        // First series
        {
          label: "Revenant",
          values: [ {time: 1370044800, y: 100}, {time: 1370044801, y: 1000} ],
          range: 'range-l'
        },

        // The second series
        {
          label: "Martian",
          values: [ {time: 1370044800, y: 78}, {time: 1370044801, y: 98}],
          range: 'range-r'
        },
        {
          label: "Bridge Of Spies",
          values: [ {time: 1370044800, y: 78}, {time: 1370044801, y: 98}],
          range: 'range-r'
        },
        {
          label: "Spotlight",
          values: [ {time: 1370044800, y: 78}, {time: 1370044801, y: 98}],
          range: 'range-r'
        },
        {
          label: "Mad Max",
          values: [ {time: 1370044800, y: 78}, {time: 1370044801, y: 98}],
          range: 'range-r'
        },
        {
          label: "Room",
          values: [ {time: 1370044800, y: 78}, {time: 1370044801, y: 98}],
          range: 'range-r'
        },
        {
          label: "Brooklyn",
          values: [ {time: 1370044800, y: 78}, {time: 1370044801, y: 98}],
          range: 'range-r'
        },
        {
          label: "Big Short",
          values: [ {time: 1370044800, y: 78}, {time: 1370044801, y: 98}],
          range: 'range-r'
        },
      ];


      var epochChart = $("#epoch-chart").epoch({
        type: 'time.line',
        data: data,
        axes: ['left', 'right', 'bottom'],
        range: {
          left: 'range-l',
          right: 'range-r'
        },
      });


      $interval(function(){
        epochChart.push([
          {time: new Date().getTime(), y: Math.random() * 100}, // Revenant
          {time: new Date().getTime(), y: Math.random() * 100}, // Martian
          {time: new Date().getTime(), y: Math.random() * 100}, // Bridge Of Spies
          {time: new Date().getTime(), y: Math.random() * 100}, // Spotlight
          {time: new Date().getTime(), y: Math.random() * 100}, // Mad Max
          {time: new Date().getTime(), y: Math.random() * 100}, // Room
          {time: new Date().getTime(), y: Math.random() * 100}, // Brooklyn
          {time: new Date().getTime(), y: Math.random() * 100}, // Big Short
        ]);

        $scope.preparedData['time'].push(new Date())
        if($scope.preparedData['time'].length > 9){
          $scope.preparedData['time'].shift();
        }

        chart.load({
              json:$scope.preparedData
            })
      }, 1000)

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

      $scope.socket.on('tweet_counters_obj', function (data) {
        $scope.$apply(function(){
          angular.forEach(data, function(value, key){
              if($scope.preparedData[key]){
                $scope.preparedData[key].push(value);
                if($scope.preparedData[key].length > 9){
                  $scope.preparedData[key].shift();
                }
              }
          })
        })
        //chart.load({
        //  json: $scope.preparedData
        //});
      });
    })