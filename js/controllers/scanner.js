'use strict';
/* global angular, qrcode, navigator */
angular.module('carbonkey.controllers').controller('ScannerController', 
  
function($scope, bip39, $location, addressParser,
    bitIDService, onChainService, $ionicPopup, $ionicLoading) {
    
  $scope.$on('$ionicView.enter', function() {
    
    // Start up the service workewr
    $scope.qrcodeWorker = new Worker("js/qrcode_worker.js");
    $scope.qrcodeWorker.postMessage({cmd: 'init'});
    $scope.qrcodeWorker.addEventListener('message', $scope.showResult);
    
    // Normalize the various vendor prefixed versions of getUserMedia.
    navigator.getUserMedia = (navigator.getUserMedia ||
                            navigator.webkitGetUserMedia ||
                            navigator.mozGetUserMedia || 
                            navigator.msGetUserMedia);
       
    try {
      
      if (navigator.getUserMedia) {
        // Request the camera.
        navigator.getUserMedia(
          // Constraints
          {
            video: {facingMode: "environment"}
          },
      
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
            $scope.calculateSquare();
            $scope.scanCode(true)
          },
      
          // Error Callback
          function(err) {
            // Log the error to the console.
            console.log('The following error occurred when trying to use getUserMedia: ' + err);
          }
        );
      
      } else {
        alert('Sorry, your browser does not support getUserMedia');
      }
    } catch(e) {
      alert(e);
    }
  });
  
  $scope.showResult = function(e) {
    var resultData = e.data;
     
    if (resultData !== false) {
          
      navigator.vibrate(200);
      $scope.processQRCode(resultData)
    
    } else {
      // if not found, retry
      $scope.calculateSquare();
      $scope.scanCode();
    }
  }
  
  $scope.scanCode = function(wasSuccess) {
    
    setTimeout(function() {
      
      // capture current snapshot
      $scope.context.drawImage($scope.player, $scope.snapshotSquare.x, 
        $scope.snapshotSquare.y, $scope.snapshotSquare.size, 
        $scope.snapshotSquare.size, 0, 0, 
        $scope.snapshotSquare.size, $scope.snapshotSquare.size);
        
      var imageData = $scope.context.getImageData(0, 0, 
        $scope.snapshotSquare.size, $scope.snapshotSquare.size);
  
      // scan for QRCode
      $scope.qrcodeWorker.postMessage({
          cmd: 'process',
          width: $scope.snapshotSquare.size,
          height: $scope.snapshotSquare.size,
          imageData: imageData
      });
      
    }, wasSuccess ? 2000 : 500);
  }
  
  $scope.calculateSquare = function() {
      // get square of snapshot in the video
      var overlay = document.getElementById('snapshotLimitOverlay');
      var snapshotSize = overlay.offsetWidth;
      $scope.snapshotSquare = {
          'x': ~~(($scope.player.videoWidth - snapshotSize)/2),
          'y': ~~(($scope.player.videoHeight - snapshotSize)/2),
          'size': ~~(snapshotSize)
      };
      
      $scope.canvas.width = $scope.snapshotSquare.size;
      $scope.canvas.height = $scope.snapshotSquare.size;
  };
  
  // Called by the load() function.
  $scope.processQRCode = function(data) {
    if (addressParser.isBitID(data) === true) {
      $scope.processBITID(data);
    } else if(addressParser.isOnChain(data) === true) {
      $scope.processONCHAIN(data);
    } else {
      alert(data)
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
            var message = '';
            if(err && err.data && err.data.message) {
              message = err.data.message
            }
            alert('Authentication failed, try again. ' + message);
          });
        }
      } catch(e) {
        alert(e)
      }
      return;
    });
  };
  
})