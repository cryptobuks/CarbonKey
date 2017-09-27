'use strict';
/* global angular, Bitcoin */
angular.module('carbonkey.controllers').controller("CarbonKeyController", 
  function($scope, $cordovaBarcodeScanner, isDevice, addressParser,
    bitIDService, onChainService, bip39, $ionicLoading, $ionicPopup, 
    $ionicSideMenuDelegate) {
  
  // Called if no private key is set so far.  
  function initialise() {
  	var words = bip39.generateBip39();
  	console.log(bip39.toSeed(words));
  	window.localStorage.setItem("bip39", words);
  	window.localStorage.setItem("wif", bip39.toWIF(words));
  };
	
  $scope.$on('$ionicView.enter', function() {
    
    if(window.localStorage.getItem("bip39") == null) {
      initialise();
    }
    
    if($scope.mnemonic == null || $scope.mnemonic != window.localStorage.getItem("bip39")) {
      
      console.log(window.localStorage.getItem("bip39"));
      console.log(bip39.toWIF(window.localStorage.getItem("bip39")));
      
      $scope.public_key = new bip39.toECKey(window.localStorage.getItem("bip39")).getAddress();
      $scope.mnemonic = window.localStorage.getItem("bip39");
    }
  });
  
  $scope.imageData = {};
  
  $scope.toggleLeft = function() {
    $ionicSideMenuDelegate.toggleLeft();
  };
  
});