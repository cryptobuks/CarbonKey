'use strict';
/* global angular, Bitcoin */
angular.module('carbonkey.services')
  .factory('onChainService', function(lodash, $http) {
    
    var service = {};
    var _parsed = {};
    var _address = '';
    var _wif ='';

    service.setAddress = function(href) {
      _address = href;
      _parsed = _parseCommand(_address);
    };
    
    service.setWIF = function(wif) {
      _wif = wif;
    };

    var _getExtraParams = function (params) {
      var result = {};
      for (var i = 4; i < params.length; i+=2) {
        result[params[i-1]] = params[i];
      }
      return result;
    };

    var _parseCommand = function _parseCommand(href) {
      var params = href.split("|");
      var result = {};
      if(params.length >= 3) {
        result = {
          cmd: params[0],
          service: params[1],
          post_back: params[2]
        };
        var extras = _getExtraParams(params);
        lodash.extend(result, result, extras);
      }
      return result;
    };

    service.getParsed = function() {
      if(_parsed == '') {
        _parseCommand();
      }
      return _parsed;
    };

    service.getTransaction = function () {
      var reqOptions = service.buildGetTransactionOptions();
      return $http(reqOptions);
    };

    service.buildGetTransactionOptions = function() {
      var reqParams = _getExtraParams(_address.split("|"));
      var callbackURL = service.getParsed().post_back;
      return {
        params: reqParams,
        method: 'GET',
        responseType: 'text',
        url: callbackURL
      };
    };

    service.postSignedRequest = function(sigList) {
      var reqParams = _getExtraParams(_address.split("|"));
      reqParams['meta_data'] = sigList;
      var callbackURL = service.getParsed().post_back;
      return $http({
        method: 'POST',
        url: callbackURL,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        transformRequest: function(obj) {
            var str = [];
            for(var p in obj)
              str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            return str.join("&");
        },
        transformResponse: undefined,
        data: reqParams
      });
    };

    service.signTransaction = function(transactionHex) {
      
      var sigList = null;
      if(transactionHex.indexOf(':') != -1) {
        sigList = transactionHex.substring(transactionHex.indexOf(':') + 1, transactionHex.length);
      }
      if(sigList == null) {
        alert('Error, invalid Transaction');
        return;
      }
      var pk = _getHDWalletDeterministicKey();
      return _signSignatureList(pk.keyPair, sigList);
    };
     
    var _signSignatureList = function(key, sigList) {
      
      // Get a buffer
      
      var sig_list = JSON.parse(sigList);
      
      var address = key.getAddress();
      var full_address = key.getPublicKeyBuffer().toString('hex');
      
      for(var x = 0; x < sig_list.length; x++) {
        
        if(sig_list[x][address] != null) {
          var hash = sig_list[x][address]['hash'];
          
          var hash_buff = Bitcoin.Buffer.from(hash, 'hex');
          
          var signed_hash = key.sign(hash_buff).toDER().toString("hex");
          
          sig_list[x][address]['sig'] = signed_hash;
        } else if(sig_list[x][full_address] != null) {
          var hash = sig_list[x][full_address]['hash'];
          
          var hash_buff = Bitcoin.Buffer.from(hash, 'hex');
          
          var signed_hash = key.sign(hash_buff).toDER().toString("hex");
          
          sig_list[x][full_address]['sig'] = signed_hash;
        }
      }
      return JSON.stringify(sig_list);
    }; 

    var _getHDWalletDeterministicKey = function() {
      
      var keyPair = Bitcoin.BitcoinJS.ECPair.fromWIF(_wif);
      var phex = keyPair.d.toBuffer().toString('hex');
      var hd = Bitcoin.BitcoinJS.HDNode.fromSeedHex(phex);
      
      var derivedByArgument = hd.derivePath("m/0'");
      return derivedByArgument;
    };

    var _generateBITIDAddress = function(wif, site_uri) {
      
      var keyPair = Bitcoin.BitcoinJS.ECPair.fromWIF(wif);
      var phex = keyPair.d.toBuffer().toString('hex');
      var hd = Bitcoin.BitcoinJS.HDNode.fromSeedHex(phex);
        
      var sha256URL = Bitcoin.BitcoinJS.crypto.sha256(site_uri);
      var sha32uri = sha256URL.readInt32LE(1);
      
      var derived = hd.derivePath("m/0'/45342'/"+sha32uri+"/0");
      
      
      
      var pubKeyAddress = derived.keyPair.getAddress();
      return pubKeyAddress;
    };

    service.buildRequestMPKObject = function(mpk, site_uri) {
      var result = lodash.omit(service.getParsed(), ['cmd', 'service', 'post_back']);
      result['mpk'] = mpk;
      result['bitid_address'] = _generateBITIDAddress(_wif, site_uri);
      return result;
    };

    var _getDerivedXpub58 = function () {
      var derivedKey = _getHDWalletDeterministicKey();
      return derivedKey.neutered().toBase58();
    };

    service.processMPK = function() {
      var xpubB58 = _getDerivedXpub58();
      var callbackURL = service.getParsed().post_back;
      var bitidURI = service.getParsed().bitid;
      var reqObj = service.buildRequestMPKObject(xpubB58, bitidURI);
      var req = {
          method: 'POST',
          url: callbackURL,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          transformRequest: function(obj) {
              var str = [];
              for(var p in obj)
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
              return str.join("&");
          },
          transformResponse: undefined,
          data: reqObj
      };

      return $http(req);
    };

    return service;
});
