'use strict';
/* global angular, navigator */
angular.module('carbonkey.controllers').controller('ScannerController', 
  
function($scope, bip39, $location, addressParser,
    bitIDService, onChainService, $ionicPopup, $ionicLoading) {
    
  $scope.$on('$ionicView.enter', function() {
    
    // Start up the service workewr
    $scope.qrcodeWorker = new Worker("js/qrcode_worker.js?v=1");
    $scope.qrcodeWorker.postMessage({cmd: 'init'});
    $scope.qrcodeWorker.addEventListener('message', $scope.showResult);
    
    // Normalize the various vendor prefixed versions of getUserMedia.
    navigator.getUserMedia = (navigator.getUserMedia ||
                            navigator.webkitGetUserMedia ||
                            navigator.mozGetUserMedia || 
                            navigator.msGetUserMedia);
       
    try {
      
      if (navigator.mediaDevices.getUserMedia) {
        // Request the camera.
        navigator.mediaDevices.enumerateDevices()
  			.then(function (devices) {
  				var device = devices.filter(function(device) {
  					if (device.kind == "videoinput") {
  						return device;
  					}
  				});
  
  				if (device.length > 1) {
  					var constraints = {
  						video: {
  							mandatory: {
  								sourceId: device[1].deviceId ? device[1].deviceId : null
  							}
  						},
  						audio: false
  					};
            $scope.startCapture(constraints);
  				}
  				else if (device.length) {
  					constraints = {
  						video: {
  							mandatory: {
  								sourceId: device[0].deviceId ? device[0].deviceId : null
  							}
  						},
  						audio: false
  					};
            $scope.startCapture(constraints);
  				}
  			})
  			.catch(function (error) {
  				alert("Error occurred : ", error);
  			});
      
      } else {
        alert('Sorry, your browser does not support getUserMedia');
      }
    } catch(e) {
      alert(e);
    }
  });
  
  $scope.startCapture = function(constraints) {
    navigator.getUserMedia(constraints,
  
      // Success Callback
      function(localMediaStream) {
        document.getElementById('about').style.display = 'none';
        // Get a reference to the video element on the page.
        var vid = document.getElementById('camera-stream');
        
        // Create an object URL for the video stream and use this 
        // to set the video source.
        vid.src = window.URL.createObjectURL(localMediaStream);
        
        $scope.player = vid;
        $scope.localMediaStream = localMediaStream;
        $scope.canvas = document.getElementById('qr-canvas');
        $scope.context = $scope.canvas.getContext('2d');
        $scope.scanCode(true);
      },
  
      // Error Callback
      function(err) {
        // Log the error to the console.
        console.log('The following error occurred when trying to use getUserMedia: ' + err);
      }
    );
  }
  
  $scope.$on('$ionicView.beforeLeave', function(){
    console.log('Switching off camera.');
    $scope.player.pause();
    $scope.player.src = "";
    $scope.localMediaStream.getTracks()[0].stop();
  });
  
  $scope.toast = function(text) {
    
    $ionicLoading.show({
      template: text
    });
    setTimeout(function(){ $ionicLoading.hide(); }, 3000);
      
  };
  
  $scope.showResult = function(e) {
    var resultData = e.data;
     
    if (resultData.result !== false) {
      
      navigator.vibrate(200);
      $scope.processQRCode(resultData.result);
    
    } else {
      // if not found, retry
    
      if($scope.scans == null)
        $scope.scans = 0;
      $scope.scans = $scope.scans + 1;
      document.getElementById('scans').innerHTML = resultData.error + ' ' + $scope.scans;
      
      $scope.scanCode();
    }
  };
  
  $scope.scanCode = function(wasSuccess) {
    
    setTimeout(function() {
      
      var width = $scope.player.videoWidth;
      var height =$scope.player.videoHeight;
      
      $scope.canvas.width = width;
      $scope.canvas.height = height;
      
      // capture current snapshot
      $scope.context.drawImage($scope.player, 0, 0, width, height);
        
      var imageData = $scope.context.getImageData(0, 0, width, height);
  
      // scan for QRCode
      $scope.qrcodeWorker.postMessage({
          cmd: 'process',
          width: width,
          height: height,
          imageData: imageData
      });
      
    }, wasSuccess ? 2000 : 500);
  };
  
  // Called by the load() function.
  $scope.processQRCode = function(data) {
    if (addressParser.isBitID(data) === true) {
      $scope.processBITID(data);
    } else if(addressParser.isOnChain(data) === true) {
      $scope.processONCHAIN(data);
    } else {
      $scope.toast(data);
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
            $scope.toast('Extended Public Key shared');
          }, function(data, status, headers, config) {
            $scope.toast('Error sharing Extended Public Key');
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
        
        var success = function(data, status, headers, config) {
          $ionicLoading.show({
            template: 'Sending Signatures'
          });
          
          try {
            var sigList = onChainService.signTransaction(data.data);
            var postReq = onChainService.postSignedRequest(sigList);
            postReq.then(function(pData, pStatus, pHeaders, pConfig) {
              $scope.toast('Transaction signed');
              $ionicLoading.hide();
            }, function(pData, pStatus, pHeaders, pConfig) {
              var message = pData.message || '';
              $scope.toast('Error sending signatures. '+message);
              $ionicLoading.hide();
            });
          } catch (err) {
            $scope.toast(err);
          }
        }
        
        var failure = function(data, status, headers, config) {
          $scope.toast('Error getting transaction ' + status + ' ' + data);
        }
        
        // We get failure I don't know why. Just process it anyway.
        txReq.then(success, success);
      }
    });
  };
  
  /**
   * BITID is a protocol for authentication.
   * https://github.com/bitid/bitid
   */
  $scope.processBITID = function(bitid_qr_code) {
    
    console.log(bitid_qr_code);
    
    bitIDService.setAddress(bitid_qr_code);
    $scope.site = bitIDService.getSiteAddress();
    
    var confirmPopup = $ionicPopup.confirm({
      title: 'Do you want to sign in?',
      template: $scope.site + " is requesting that you identify yourself"
    });
    
    confirmPopup.then(function(res) {
      if(res) {
        try {
              
          $ionicLoading.show({
            template: 'Authenticating...'
          });
          
          const success = function(data) {
            $scope.toast('Authentication successful');
          };
          
          const failure = function(error) {
              
            $ionicLoading.hide();
            
            let msg = error;
            if(error.message)
              msg = error.message;
            $scope.toast('Authentication failed, try again. ' + msg);
          };
          
          bitIDService.authorize(window.localStorage.getItem("wif"), 
            success, failure);
            
        } catch(e) {
          $scope.toast(e);
        }
      }
    });
  };
  
})