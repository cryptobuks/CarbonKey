// To get the bitcoinjs we need run the following
// npm install -g browserify
// npm install bitcoinjs-lib
// npm install bitcoinjs-message
// npm install bip39
// browserify lib/index.browserify.bitcoinjs.js --standalone bitcoin > lib/bitcoinjs-lib.js

var Bitcoin = window.Bitcoin || {};

Bitcoin.BitcoinJS = require('bitcoinjs-lib')
Bitcoin.Message = require('bitcoinjs-message')
Bitcoin.Bip39 = require('bip39')

// Replace/Create the global namespace
window.Bitcoin = Bitcoin;