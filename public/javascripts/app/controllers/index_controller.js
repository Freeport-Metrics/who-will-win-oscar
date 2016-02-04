/**
 * Created by Matuszewski on 03/02/16.
 */
angular.module('whoWillWinOscars.controllers')
    .controller('IndexController', function(
        $scope
    ){
      $scope.socket = io.connect('http://localhost:3001');
      $scope.tweets = [];
      $scope.socket.on('tweet', function (data) {
        $scope.$apply(function(){
          $scope.tweets.push(JSON.stringify(data));
        })
      });
    })