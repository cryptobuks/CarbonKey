'use strict';
/* global angular, qrcode, navigator */
angular.module('carbonkey.controllers').controller('ScannerController', 
  
function($scope, bip39, $location, addressParser,
    bitIDService, onChainService, $ionicPopup, $ionicLoading) {
    
  $scope.$on('$ionicView.enter', function() {
    
      $scope.stype = 0;
  		$scope.initCanvas(800, 600);
  		qrcode.callback = $scope.read;
      $scope.setwebcam();
  });
  
  // Called by the load() function.
  $scope.processQRCode = function(data) {
    if (addressParser.isBitID(data) === true) {
      $scope.processBITID(data);
    } else if(addressParser.isOnChain(data) === true) {
      $scope.processONCHAIN(data);
    }
    
    $location.path('/home');
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
      
      try {
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
      } catch(e) {
        alert(e)
      }
      return;
    });
  };
  
  /**
   * Everything to do with scanning
   * 
   **/
  
  $scope.stype = 0;
  $scope.v = null;
  $scope.webkit=false;
  $scope.moz=false;
  $scope.gUM=false;
  $scope.gCtx = null;
  $scope.gCanvas = null;
  
  $scope.read = function(a)
  {
      $scope.stype = 0;
      //$scope.stop();
      $scope.processQRCode(a);
  };
	
  $scope.isCanvasSupported = function() {
    var elem = document.createElement('canvas');
    return !!(elem.getContext && elem.getContext('2d'));
  };
  
  $scope.initCanvas = function(w,h)
  {
      $scope.gCanvas = document.getElementById("qr-canvas");
      $scope.gCanvas.style.width = w + "px";
      $scope.gCanvas.style.height = h + "px";
      $scope.gCanvas.width = w;
      $scope.gCanvas.height = h;
      $scope.gCtx = $scope.gCanvas.getContext("2d");
      $scope.gCtx.clearRect(0, 0, w, h);
  };
  
  $scope.setwebcam = function()
  {
  	
  	var options = true;
  	if(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices)
  	{
  		try{
  			navigator.mediaDevices.enumerateDevices()
  			.then(function(devices) {
  			  devices.forEach(function(device) {
  				if (device.kind === 'videoinput') {
  				  if(device.label.toLowerCase().search("back") >-1)
  					options={'deviceId': {'exact':device.deviceId}, 'facingMode':'environment'} ;
  				}
  				console.log(device.kind + ": " + device.label +" id = " + device.deviceId);
  			  });
  			  $scope.setwebcam2(options);
  			});
  		}
  		catch(e)
  		{
  			console.log(e);
  		}
  	}
  	else{
  		console.log("no navigator.mediaDevices.enumerateDevices" );
  		$scope.setwebcam2(options);
  	}
  };

  $scope.setwebcam2 = function(options)
  {
  	console.log(options);
  	
    if($scope.stype==1)
    {
        setTimeout($scope.captureToCanvas, 500);    
        return;
    }
    var n=navigator;
    document.getElementById("outdiv").innerHTML = '<video id="v" autoplay></video>';
    $scope.v = document.getElementById("v");


    if(n.getUserMedia)
  	{
  		$scope.webkit=true;
      n.getUserMedia({video: options, audio: false}, $scope.success, $scope.error);
  	}
    else
    if(n.webkitGetUserMedia)
    {
      $scope.webkit=true;
      n.webkitGetUserMedia({video:options, audio: false}, $scope.success, $scope.error);
    }
    else
    if(n.mozGetUserMedia)
    {
      $scope.moz=true;
      n.mozGetUserMedia({video: options, audio: false}, $scope.success, $scope.error);
    }


    $scope.stype=1;
    setTimeout($scope.captureToCanvas, 500);
  };
  
  
  $scope.success = function(stream) {
      if($scope.webkit)
          $scope.v.src = window.URL.createObjectURL(stream);
      else
      if($scope.moz)
      {
          $scope.v.mozSrcObject = stream;
          $scope.v.play();
      }
      else
          $scope.v.src = stream;
      $scope.gUM=true;
      setTimeout($scope.captureToCanvas, 500);
  };
  
  
  $scope.stop = function() {
    
      if($scope.moz)
      {
          $scope.v.mozSrcObject.getTracks().forEach(function (track) { track.stop(); });
      }
      else
      {
          $scope.v.src.getTracks().forEach(function (track) { track.stop(); });
      }
  };
  		
  $scope.error = function(error) {
      $scope.gUM=false;
      return;
  };
  
  
  $scope.captureToCanvas = function() {
    if($scope.stype!=1)
        return;
    if($scope.gUM)
    {
        try{
            $scope.gCtx.drawImage($scope.v,0,0);
            try{
                qrcode.decode();
            }
            catch(e){       
                console.log(e);
                setTimeout($scope.captureToCanvas, 500);
            }
        }
        catch(e){       
                console.log(e);
                setTimeout($scope.captureToCanvas, 500);
        }
    }
  };
  
})