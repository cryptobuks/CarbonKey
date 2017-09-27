'use strict';
/* global angular, Bitcoin */
angular.module('carbonkey.controllers').controller('BackupController', 
  
function($scope, bip39) {
    
  $scope.$on('$ionicView.enter', function() {
  
    if($scope.mnemonic == null || $scope.mnemonic != window.localStorage.getItem("bip39")) {
      $scope.mnemonic = window.localStorage.getItem("bip39");
        
      $scope.seed = bip39.toSeed($scope.mnemonic);
      
      $scope.address = bip39.toECKey($scope.mnemonic).getAddress();
    }
  });
  
})