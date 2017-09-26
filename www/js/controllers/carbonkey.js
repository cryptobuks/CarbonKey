'use strict';
/* global angular, Bitcoin */
angular.module('carbonkey.controllers').controller("CarbonKeyController", 
  function($scope, $cordovaBarcodeScanner, isDevice, addressParser,
    bitIDService, onChainService, bip39, $ionicLoading, $ionicPopup, 
    $ionicSideMenuDelegate) {
    
  function initialise() {
	var words = bip39.generateBip39();
	window.localStorage.setItem("bip39", words);
	window.localStorage.setItem("wif", bip39.toWIF(words));
  };
	
  $scope.$on('$ionicView.enter', function() {
    
    if(window.localStorage.getItem("bip39") == null) {
      initialise();
    }
    
    if($scope.mnemonic == null || $scope.mnemonic != window.localStorage.getItem("bip39")) {
      $scope.public_key = new bip39.toECKey(window.localStorage.getItem("bip39")).getAddress();
      $scope.mnemonic = window.localStorage.getItem("bip39");
    }
  });
  
  $scope.imageData = {};
  
  $scope.processQRCode = function(data) {
    if (addressParser.isBitID(data) === true) {
      $scope.processBITID(data);
    } else if(addressParser.isOnChain(data) === true) {
      $scope.processONCHAIN(data);
    }
  };
  
  $scope.toggleLeft = function() {
    $ionicSideMenuDelegate.toggleLeft();
  };
  
  /**
   * Protocol for passing extended public keys to remote services. Can also
   * sign transactions created with that extended public key.
   */
  $scope.processONCHAIN = function(data) {
    
    onChainService.setAddress(data);
    onChainService.setWIF(window.localStorage.getItem("wif"));
    
    if(onChainService.getParsed().cmd == 'mpk') {
      
      var serviceUrl = onChainService.getParsed().service;
      
      var confirmPopup = $ionicPopup.confirm({
        title: 'Share Public Key',
        template: 'Share a public key with '+serviceUrl+'?'
      });
      
      confirmPopup.then(function(res) {
        if(res) {
          $ionicLoading.show({
            template: 'Sharing Extended Public Key with ' + serviceUrl
          });
          var req = onChainService.processMPK();
          req.then(function(data, status, headers, config) {
            alert('Extended Public Key shared');
            $ionicLoading.hide();
          }, function(data, status, headers, config) {
            alert('Error sharing Extended Public Key');
            $ionicLoading.hide();
          });
        }
      });
      
    } else if(onChainService.getParsed().cmd == 'sign') {
      _signTransaction();
    }
  };
  
  var _signTransaction = function() {
    
    var serviceUrl = onChainService.getParsed().service;
    
    var confirmPopup = $ionicPopup.confirm({
      title: 'Share a Transaction',
      template: 'Sign the transaction with ' + serviceUrl + '?'
    });
    
    confirmPopup.then(function(res) {
      if(res) {
        $ionicLoading.show({
          template: 'Signing transaction with ' + serviceUrl
        });
        
        var txReq = onChainService.getTransaction();
        txReq.then(function(data, status, headers, config) {
          
          $ionicLoading.show({
            template: 'Sending Signatures'
          });
          
          try {
            var sigList = onChainService.signTransaction(data.data);
            var postReq = onChainService.postSignedRequest(sigList);
            postReq.then(function(pData, pStatus, pHeaders, pConfig) {
              alert('Transaction signed');
              $ionicLoading.hide();
            }, function(pData, pStatus, pHeaders, pConfig) {
              var message = pData.message || '';
              alert('Error sending signatures. '+message);
              $ionicLoading.hide();
            });
          } catch (err) {
            alert(err);
            $ionicLoading.hide();
          }
        }, function(data, status, headers, config) {
          alert('Error getting transaction');
          $ionicLoading.hide();
        });
      }
    });
  };
  
  /**
   * BITID is a protocol for authentication.
   * https://github.com/bitid/bitid
   */
  $scope.processBITID = function(data) {
    
    bitIDService.setAddress(data);
    
    $scope.site = bitIDService.getSiteAddress();
    
    var bitIDPopup = $ionicPopup.show({
      template: '<p>Do you want to sign in?</p>',
      title: $scope.site + ' is requesting that you identify yourself',
      scope: $scope,
      buttons: [
        { text: 'No' },
        {
          text: '<b>Yes</b>',
          type: 'button-positive',
          onTap: function(e) {
            return true;
          }
        }
      ]
    });
    bitIDPopup.then(function(res) {
      
      if(res != null && res == true) {
        var msg = bitIDService.generateSignatureMessage(
          window.localStorage.getItem("wif"));
          
        $ionicLoading.show({
          template: 'Authenticating...'
        });
        
        bitIDService.postMessage(msg).then(function(resp) {
          $ionicLoading.hide();
          alert('Authentication successful');
        }, function(err) {
          $ionicLoading.hide();
          alert('Authentication failed, try again. ' + err.status);
        });
      }
      return;
    });
  };
  
  /**
   * Scan a bar code. If we are deployed on the ionic server, then
   * ask the user for a value. Easier for debug.
   */  
  $scope.scanBarcode = function() {
    
    // Ask for permission to use the camera
    if(window.cordova) {
      var permissions = window.cordova.plugins.permissions;
      permissions.hasPermission(permissions.CAMERA, function( status ){
        if ( ! status.hasPermission ) {
          
          permissions.requestPermission(permissions.CAMERA, function( status )
            {
              
            }, 
            function()
            {  }
          );
        }
      });
    }
    
    // If we are not on a device with a QR code reader then get the text
    // from the user. Useful for debug purposes.
    if(! isDevice) {
      var noQRReaderPopup = $ionicPopup.show({
        template: '<input type="text" ng-model="imageData.text">',
        title: 'Enter QR data',
        scope: $scope,
        buttons: [
          { text: 'Cancel' },
          {
            text: '<b>OK</b>',
            type: 'button-positive',
            onTap: function(e) {
              return $scope.imageData;
            }
          }
        ]
      });
      noQRReaderPopup.then(function(res) {
        // Wait for it to finish.
        if($scope.imageData.text)
          $scope.processQRCode($scope.imageData.text);
        return;
      });
    } else {
      
      if ($scope.currentlyScanning === true) {
        return;
      }
    
      $scope.currentlyScanning = true;
      $cordovaBarcodeScanner.scan().then(function(imageData) {
        $scope.currentlyScanning = false;
        $scope.imageData = imageData;
        if(!imageData.cancelled) {
          $scope.processQRCode($scope.imageData.text);
        }
      }, function(error) {
        $scope.currentlyScanning = false;
        alert("An error happened -> " + error);
      });
    }
  };
});