
const CACHE_NAME = 'rolley-pwa-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  // Leaflet CDN (cache for offline if already visited; may fail if blocked by CORS)
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', (e)=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});
self.addEventListener('fetch', (e)=>{
  const url = new URL(e.request.url);
  if(ASSETS.includes(url.href) || ASSETS.includes(url.pathname) ){
    e.respondWith(caches.match(e.request).then(res=> res || fetch(e.request)));
    return;
  }
  // Runtime cache for same-origin requests
  if(url.origin === location.origin){
    e.respondWith(caches.match(e.request).then(res=> res || fetch(e.request)));
    return;
  }
  // For third-party (like OSM tiles), use network-first fallback to cache
  e.respondWith(
    fetch(e.request).then(resp=>{
      const clone = resp.clone();
      caches.open(CACHE_NAME).then(cache=> cache.put(e.request, clone)).catch(()=>{});
      return resp;
    }).catch(()=> caches.match(e.request))
  );
});
