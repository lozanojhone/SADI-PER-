(() => {
 'use strict';
 const DEMO_IDS=new Set(['prd_polo','prd_bomber','prd_cargo','prd_hoodie','prd_cap','prd_tee','prd_denim','prd_vest']);
 let unsubProducts=null,unsubSettings=null;
 const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
 function shade(hex,amount){
  const clean=String(hex||'#D4AF37').replace('#',''); if(!/^[0-9a-f]{6}$/i.test(clean))return hex;
  const n=parseInt(clean,16),r=Math.max(0,Math.min(255,(n>>16)+amount)),g=Math.max(0,Math.min(255,((n>>8)&255)+amount)),b=Math.max(0,Math.min(255,(n&255)+amount));
  return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
 }
 function applyTheme(){
  const s=window.state?.settings||{};
  const primary=s.primaryColor||'#D4AF37',secondary=s.secondaryColor||'#FFFFFF',bg=s.backgroundColor||'#080808',text=s.textColor||'#FFFFFF';
  const root=document.documentElement;
  const vars={'--roy-primary':primary,'--roy-primary-dark':shade(primary,-42),'--roy-primary-light':shade(primary,48),'--roy-secondary':secondary,'--roy-background':bg,'--roy-text':text,'--orange':primary,'--orange2':shade(primary,-42),'--green':primary,'--brand-primary':primary,'--brand-secondary':secondary,'--brand-bg':bg,'--brand-text':text,'--bg':bg,'--white':text,'--primary':primary};
  Object.entries(vars).forEach(([k,v])=>root.style.setProperty(k,v));
  document.body.style.backgroundColor=bg; document.body.style.color=text;
  const meta=q('meta[name="theme-color"]'); if(meta)meta.content=primary;
 }
 function stripDemoCache(){
  try{
   ['sadi_products','jhonz_products'].forEach(key=>{const raw=localStorage.getItem(key);if(!raw)return;const rows=JSON.parse(raw);if(Array.isArray(rows)){const clean=rows.filter(x=>!DEMO_IDS.has(x?.id));localStorage.setItem(key,JSON.stringify(clean));}});
  }catch(_){ }
 }
 function normalizeProduct(p){return {...p,gallery:Array.isArray(p.gallery)?p.gallery:[],colorImages:typeof normalizeColorImages==='function'?normalizeColorImages(p.colorImages||{}):(p.colorImages||{}),colors:p.colors?.length?p.colors:['Único'],sizes:p.sizes?.length?p.sizes:['Única']};}
 function renderPublic(){try{renderStore();renderFeatured();renderSale();if(typeof renderUpcoming==='function')renderUpcoming();renderCart();renderAccount();fillCategorySelects();}catch(e){console.warn('Render catálogo:',e.message)}}
 function startRealtime(){
  if(!window._firebaseReady||!window._db||!window._fb?.onSnapshot)return;
  if(unsubProducts)unsubProducts();
  unsubProducts=window._fb.onSnapshot(window._fb.collection(window._db,'sadi_products'),snap=>{
    const rows=snap.docs.map(d=>normalizeProduct({id:d.id,...d.data()}));
    window.state.products=rows;
    localStorage.setItem('sadi_products',JSON.stringify(rows));localStorage.setItem('sadi_products_verified','1');
    renderPublic();
  },err=>console.warn('Catálogo en tiempo real:',err.message));
  if(unsubSettings)unsubSettings();
  unsubSettings=window._fb.onSnapshot(window._fb.doc(window._db,'sadi_settings','main'),snap=>{
    if(!snap.exists())return;
    window.state.settings={...window.state.settings,...snap.data()};
    localStorage.setItem('sadi_settings',JSON.stringify([{id:'main',...window.state.settings}]));
    if(typeof window.applySettings==='function')window.applySettings();applyTheme();
  },err=>console.warn('Configuración en tiempo real:',err.message));
 }
 stripDemoCache();
 const originalApply=window.applySettings;
 if(typeof originalApply==='function')window.applySettings=function(){const r=originalApply.apply(this,arguments);applyTheme();return r;};
 const originalSave=window.saveSettings;
 if(typeof originalSave==='function')window.saveSettings=async function(){const r=await originalSave.apply(this,arguments);applyTheme();return r;};
 document.addEventListener('DOMContentLoaded',()=>{applyTheme();setTimeout(startRealtime,250)},{once:true});
 window.addEventListener('firebase-ready',()=>setTimeout(startRealtime,150));
 window.addEventListener('storage',e=>{if(e.key==='sadi_settings'){try{const v=JSON.parse(e.newValue||'[]');if(v[0]){window.state.settings={...window.state.settings,...v[0]};applyTheme();}}catch(_){}}});
 window.royApplyConfigurableTheme=applyTheme;
})();
