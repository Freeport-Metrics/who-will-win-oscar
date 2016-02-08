/**
 * Created by Matuszewski on 05/02/16.
 */
angular.module('whoWillWinOscars.components').directive('chart', function(
){
  return{
    restrict: 'E',
    replace: true,
    templateUrl: '/angular_templates/components/chart.html',
    link: function ( scope, el, attrs){

    }
  }
})