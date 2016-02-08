/**
 * Created by Matuszewski on 03/02/16.
 */
angular.module('whoWillWinOscars.controllers')
    .controller('IndexController', function(
        $scope
    ){
      $scope.socket = io.connect('http://localhost:3001');
      $scope.tweets = [];
      $scope.tweetCount = {
        'Revenant': 10,
        'Brooklyn': 15

      }
      $scope.preparedData = {
        'Big Short': [],
        'Brooklyn': [],
        'Room': [],
        'Mad Max': [],
        'Spotlight': [],
        'Revenant': [],
        'Bridge Of Spies': [],
        'Martian': []
      }
      var chart = c3.generate({
        bindto: '#chart',
        data: {
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
          position: 'right'
        },
        axis:{
          x: {
            type: 'categories',
            categories: ['Revenant','Martian','Bridge Of Spies','Spotlight','Mad Max','Room','Brooklyn','Big Short']
          },
          y: {
            show:false
          },
          y2: {
            show: true
          }
        }
      });


      $scope.socket.on('tweet', function (data) {
          angular.forEach(data, function(value, key){
            $scope.$apply(function(){
              if($scope.preparedData[key]){
                if($scope.preparedData[key].length >= 10){
                  $scope.preparedData[key].shift();
                  chart.tooltip.show({x:0});
                }
                $scope.preparedData[key].push(value);
              }
            })
          })
        chart.load({
          json: $scope.preparedData
        });
      });
    })