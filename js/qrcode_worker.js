self.addEventListener('message', function(e) {
    const input = e.data;

    switch (input.cmd) {
        case 'init':
            init();
            break;
        case 'process':
            process(input);
            break;
        default:
            console.log('Unknown command for QRCode worker.');
            break;
    }
});

function init() {
    self.importScripts(
        '../lib/jsqrcode/grid.js',
        '../lib/jsqrcode/version.js',
        '../lib/jsqrcode/detector.js',
        '../lib/jsqrcode/formatinf.js',
        '../lib/jsqrcode/errorlevel.js',
        '../lib/jsqrcode/bitmat.js',
        '../lib/jsqrcode/datablock.js',
        '../lib/jsqrcode/bmparser.js',
        '../lib/jsqrcode/datamask.js',
        '../lib/jsqrcode/rsdecoder.js',
        '../lib/jsqrcode/gf256poly.js',
        '../lib/jsqrcode/gf256.js',
        '../lib/jsqrcode/decoder.js',
        '../lib/jsqrcode/qrcode.js',
        '../lib/jsqrcode/findpat.js',
        '../lib/jsqrcode/alignpat.js',
        '../lib/jsqrcode/databr.js'
    );
}

function process(input) {
    qrcode.width = input.width;
    qrcode.height = input.height;
    qrcode.imagedata = input.imageData;

    let result = { result: false, error: '' }
    try {
        result.result = qrcode.process();
        
    } catch (e) { result.error = e }

    postMessage(result);
}