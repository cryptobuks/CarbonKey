'use strict';
/* global angular, Bitcoin */
angular.module('carbonkey.controllers').controller('RestoreController', 
  function($scope, $location, $ionicPopup, bip39) {
    
  $scope.isValid = true;
  
  $scope.restorePassphrase = function(passphrase) {
    
    if(bip39.isValid(passphrase)) {
      $scope.isValid = true;
      
      
      var confirmPopup = $ionicPopup.confirm({
        title: 'Change the passphrase for this key?',
        template: 'Do you want to change passphrase for this key?'
      });
      
      confirmPopup.then(function(res) {
        if(res) {
          window.localStorage.setItem("bip39", passphrase);
          window.localStorage.setItem("wif", bip39.toWIF(passphrase));
          $location.path("/home");
        }
      });
    } else {
      $scope.isValid = false;
    }
  }  
  
})