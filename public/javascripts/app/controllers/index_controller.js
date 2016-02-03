/**
 * Created by Matuszewski on 03/02/16.
 */
angular.module('whoWillWinOscars.controllers')
    .controller('IndexController', function(
        $scope
    ){
      $scope.socket = io.connect('http://localhost:3001');
      $scope.socket.on('tweet', function (data) {
        console.log(data);
      });
    })