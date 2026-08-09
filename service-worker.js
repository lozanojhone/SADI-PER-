const CACHE='sadi-peru-v3-firestore-only-20260808-v5';
const CORE=[
 './',
 './index.html',
 './admin.html',
 './offline.html',
 './manifest.webmanifest',
  './manifest-admin.webmanifest',
 './css/app.css',
 './css/luxury-final-v5.1.css',
 './css/checkout-client-pro-v6.5.css',
 './js/01-firebase.js',
 './js/02-app-02.js',
 './js/27-config-catalog-realtime-v5.2.js',
 './assets/logo-sadi-dorado-blanco.png',
 './assets/icons/sadi-app-192.png',
 './assets/icons/sadi-app-512.png'
];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 const local=url.origin===location.origin;
 const fresh=event.request.mode==='navigate'||/\.(?:js|css|html)$/.test(url.pathname);
 if(fresh){
  event.respondWith(
   fetch(event.request,{cache:'no-store'})
    .then(response=>{
     if(local&&response.ok)caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));
     return response;
    })
    .catch(()=>caches.match(event.request).then(cached=>cached||caches.match('./offline.html')))
  );
  return;
 }
 event.respondWith(
  caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
   if(local&&response.ok)caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));
   return response;
  }))
 );
});
