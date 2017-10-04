'use strict';
/* global angular */
angular.module('carbonkey.controllers').controller("CarbonKeyController", 
  function($scope, $ionicSideMenuDelegate, $ionicLoading, bip39) {
  
  // Called if no private key is set so far.  
  function initialise() {
  	var words = bip39.generateBip39();
  	console.log(bip39.toSeed(words));
  	try {
    	window.localStorage.setItem("bip39", words);
    	window.localStorage.setItem("wif", bip39.toWIF(words));
    	
      $ionicLoading.show({
        template: 'Success Initialising Key'
      });
      setTimeout(function(){ $ionicLoading.hide(); }, 5000);
    
  	} catch(e) {
      $ionicLoading.show({
        template: 'Problem ' + e
      });
  	}
  };
	
  $scope.$on('$ionicView.enter', function() {
    
  	if(window.localStorage.getItem("bip39") == null || window.localStorage.getItem("wif") == null) {
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