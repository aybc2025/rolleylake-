const CACHE_NAME = 'rolley-pwa-v3';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
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
  if(ASSETS.includes(url.href) || ASSETS.includes(url.pathname)){
    e.respondWith(caches.match(e.request).then(res=> res || fetch(e.request)));
    return;
  }
  if(url.origin === location.origin){
    e.respondWith(caches.match(e.request).then(res=> res || fetch(e.request)));
    return;
  }
  // צד שלישי: OSM tiles + PDF host
  e.respondWith(
    fetch(e.request).then(resp=>{
      const clone = resp.clone();
      caches.open(CACHE_NAME).then(cache=> cache.put(e.request, clone)).catch(()=>{});
      return resp;
    }).catch(()=> caches.match(e.request))
  );
});