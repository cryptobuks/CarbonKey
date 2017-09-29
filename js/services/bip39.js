'use strict';
/* global angular, Mnemonic, Bitcoin */

angular.module('carbonkey.services')

.factory('bip39', function() {

  var service = {};

  service.generateBip39 = function() {
    
    return Bitcoin.Bip39.generateMnemonic()
  };

  service.isValid = function(words) {
    
    if(words == null)
      words = '';
      
    return Bitcoin.Bip39.validateMnemonic(words);
  };

  service.toSeed = function(words) {
    
    return Bitcoin.Bip39.mnemonicToSeedHex(words);
  };

  service.toWIF = function(words) {
    var hd = Bitcoin.BitcoinJS.HDNode.fromSeedHex(service.toSeed(words));
    return hd.keyPair.toWIF();
  };

  service.toECKey = function(words) {
    var hd = Bitcoin.BitcoinJS.HDNode.fromSeedHex(service.toSeed(words));
    return hd.keyPair;
  };

  return service;

});
