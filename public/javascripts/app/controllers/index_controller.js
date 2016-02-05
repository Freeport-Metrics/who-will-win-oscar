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
      $scope.socket.on('tweet', function (data) {
        $scope.$apply(function(){
          console.log('['+data.new_val.movies + ']        ' +JSON.stringify(data.new_val.text));
          $scope.tweets.push('['+data.new_val.movies + ']     ' + data.new_val.text);
        })
      });
    })