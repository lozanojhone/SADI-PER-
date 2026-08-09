(function(){
'use strict';
const ATTR_KEY='sadi_attribution_v1',SESSION_KEY='sadi_analytics_session_v1',TTL=30*24*60*60*1000;
const q=new URLSearchParams(location.search);
function uid(){return (crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2));}
function session(){let id=sessionStorage.getItem(SESSION_KEY)||q.get('sadi_session');if(!id){id='SES-'+uid()}sessionStorage.setItem(SESSION_KEY,id);return id}
function read(){try{const x=JSON.parse(localStorage.getItem(ATTR_KEY)||'null');if(!x||Date.now()>Number(x.expiresAt||0)){localStorage.removeItem(ATTR_KEY);return null}return x}catch{return null}}
if(q.get('sadi_source')==='qr-oficial'||q.get('sadi_origin')==='catalogo'){localStorage.setItem(ATTR_KEY,JSON.stringify({source:q.get('sadi_source')||'qr-oficial',originChannel:'catalogo',campaign:'catalogo_sadi',startedAt:Date.now(),expiresAt:Date.now()+TTL}));}
function attribution(){return read()||{source:'directo',originChannel:'tienda',campaign:''}}
function device(){const u=navigator.userAgent;return /iPad|Tablet/i.test(u)?'tablet':/Android|iPhone|iPod|Mobile/i.test(u)?'celular':'computadora'}
async function track(eventType,extra={}){if(!window._firebaseReady||!window._db||!window._fb)return;const a=attribution();const journey=a.originChannel==='catalogo'?(eventType==='ORDER_CREATED'?'QR/Catálogo > Tienda > Compra':'QR/Catálogo > Tienda'):'Acceso directo > Tienda';try{await window._fb.addDoc(window._fb.collection(window._db,'sadi_store_events'),{eventType,source:a.source,originChannel:a.originChannel,currentChannel:'tienda',journey,campaign:a.campaign||'',sessionId:session(),device:device(),page:location.hash||'#inicio',productId:String(extra.productId||''),productName:String(extra.productName||''),orderCode:String(extra.orderCode||''),createdAt:window._fb.serverTimestamp(),createdAtIso:new Date().toISOString()})}catch(e){console.warn('Analítica SADI PERÚ:',e.message)}}
window.royTrackStoreEvent=track;window.royGetAttribution=attribution;
function boot(){const key='sadi_store_visit_'+session();if(!sessionStorage.getItem(key)){sessionStorage.setItem(key,'1');track('STORE_VISIT')}
 const wrap=(name,fn)=>{const o=window[name];if(typeof o!=='function'||o.__royWrapped)return;const w=function(...a){try{fn(a)}catch(e){}return o.apply(this,a)};w.__royWrapped=true;window[name]=w};
 wrap('showPage',a=>{if(a[0]==='tienda')track('STORE_BROWSE')});
 wrap('openQuick',a=>{const p=window.state?.products?.find?.(x=>String(x.id)===String(a[0]));track('PRODUCT_VIEW',{productId:a[0],productName:p?.name||''})});
 wrap('addToCart',a=>{const p=window.state?.products?.find?.(x=>String(x.id)===String(a[0]));track('ADD_TO_CART',{productId:a[0],productName:p?.name||''})});
 wrap('openCheckout',()=>track('CHECKOUT_OPEN'));
 const originalFinish=window.finishOrder;if(typeof originalFinish==='function'){window.finishOrder=async function(...args){const before=new Set((window.state?.orders||[]).map(x=>x.id));const result=await originalFinish.apply(this,args);setTimeout(()=>{const order=(window.state?.orders||[]).find(x=>!before.has(x.id));if(order){const a=attribution();order.trafficSource=a.source;order.originChannel=a.originChannel;order.purchaseChannel='tienda';order.customerJourney=a.originChannel==='catalogo'?'QR/Catálogo > Tienda > Compra':'Tienda directa > Compra';try{window._fb.setDoc(window._fb.doc(window._db,'sadi_orders',order.id),order,{merge:true})}catch(e){}track('ORDER_CREATED',{orderCode:order.id})}},150);return result}}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,300));else setTimeout(boot,300);
})();