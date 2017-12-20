// Set a name for the current cache
var cacheName = 'v1.15'; 

// Default files to always cache
var cacheFiles = [
	'./index.html',
	'./js/app.js',
	'./js/routes.js',
	'./js/controllers/app.js',
	'./js/controllers/backup.js',
	'./js/controllers/carbonkey.js',
	'./js/controllers/restore.js',
	'./js/controllers/scanner.js',
	'./js/services/addressParser.js',
	'./js/services/bip39.js',
	'./js/services/bitIDService.js',
	'./js/services/isDevice.js',
	'./js/services/onChainService.js',
	'./lib/ionic/js/ionic.bundle.js',
	'./lib/ngCordova/dist/ng-cordova.js',
	'./lib/ng-lodash/build/ng-lodash.js',
    './lib/jsqrcode/grid.js',
    './lib/jsqrcode/version.js',
    './lib/jsqrcode/detector.js',
    './lib/jsqrcode/formatinf.js',
    './lib/jsqrcode/errorlevel.js',
    './lib/jsqrcode/bitmat.js',
    './lib/jsqrcode/datablock.js',
    './lib/jsqrcode/bmparser.js',
    './lib/jsqrcode/datamask.js',
    './lib/jsqrcode/rsdecoder.js',
    './lib/jsqrcode/gf256poly.js',
    './lib/jsqrcode/gf256.js',
    './lib/jsqrcode/decoder.js',
    './lib/jsqrcode/qrcode.js',
    './lib/jsqrcode/findpat.js',
    './lib/jsqrcode/alignpat.js',
    './lib/jsqrcode/databr.js',
	'./lib/ionic/css/ionic.css',
	'./lib/ionic/fonts/ionicons.eot',
	'./lib/ionic/fonts/ionicons.svg',
	'./lib/ionic/fonts/ionicons.ttf',
	'./lib/ionic/fonts/ionicons.woff',
	'./css/style.css',
	'./img/header.jpg',
	'./img/important.png',
	'./img/qr-phone.png',
	'./img/drawable-xhdpi-icon.png',
	'./img/drawable-xxhdpi-icon.png',
	'./img/drawable-xxxhdpi-icon.png',
	'./img/qr-bg.jpg',
	'./fonts/lato/Lato-Bold.ttf',
	'./fonts/lato/Lato-Regular.ttf',
	'./fonts/lato/Lato-Semibold.ttf',
	'./fonts/ubuntu/nubuntumono-b-webfont.woff2',
	'./fonts/ubuntu/nubuntumono-r-webfont.woff2',
]


self.addEventListener('install', function(e) {
    console.log('[ServiceWorker] Installed');

    // e.waitUntil Delays the event until the Promise is resolved
    e.waitUntil(

    	// Open the cache
	    caches.open(cacheName).then(function(cache) {

	    	// Add all the default files to the cache
			console.log('[ServiceWorker] Caching cacheFiles');
			return cache.addAll(cacheFiles);
	    })
	); // end e.waitUntil
});


self.addEventListener('activate', function(e) {
    console.log('[ServiceWorker] Activated');

    e.waitUntil(

    	// Get all the cache keys (cacheName)
		caches.keys().then(function(cacheNames) {
			return Promise.all(cacheNames.map(function(thisCacheName) {

				// If a cached item is saved under a previous cacheName
				if (thisCacheName !== cacheName) {

					// Delete that cached file
					console.log('[ServiceWorker] Removing Cached Files from Cache - ', thisCacheName);
					return caches.delete(thisCacheName);
				}
			}));
		})
	); // end e.waitUntil

});


self.addEventListener('fetch', function(e) {
	console.log('[ServiceWorker] Fetch', e.request.url);

	// e.respondWidth Responds to the fetch event
	e.respondWith(

		// Check in cache for the request being made
		caches.match(e.request)


			.then(function(response) {

				// If the request is in the cache
				if ( response ) {
					console.log("[ServiceWorker] Found in Cache", e.request.url, response);
					// Return the cached version
					return response;
				}

				// If the request is NOT in the cache, fetch and cache

				var requestClone = e.request.clone();
				fetch(requestClone)
					.then(function(response) {

						if ( !response ) {
							console.log("[ServiceWorker] No response from fetch ")
							return response;
						}

						var responseClone = response.clone();

						//  Open the cache
						caches.open(cacheName).then(function(cache) {

							// Put the fetched response in the cache
							cache.put(e.request, responseClone);
							console.log('[ServiceWorker] New Data Cached', e.request.url);

							// Return the response
							return response;
			
				        }); // end caches.open

					})
					.catch(function(err) {
						console.log('[ServiceWorker] Error Fetching & Caching New Data', err);
					});


			}) // end caches.match(e.request)
	); // end e.respondWith
});