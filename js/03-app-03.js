
(function(){
 const nativeToast=window.showToast;
 window.showSaveFeedback=function(message,type='success',duration=3500){const el=document.getElementById('saveFeedback');if(!el)return nativeToast?nativeToast(message):void 0;el.textContent=message;el.className='save-feedback '+type+' show';clearTimeout(el._t);if(type!=='loading')el._t=setTimeout(()=>el.classList.remove('show'),duration)};
 window.showToast=function(msg){const lower=String(msg).toLowerCase();const type=/(no se|error|fall|rechaz|inválid|sesión)/.test(lower)?'error':/(guard|cread|actualiz|elimin|sincroniz|listo|correct)/.test(lower)?'success':'success';showSaveFeedback(msg,type);if(nativeToast)nativeToast(msg)};
 const oldOpen=window.openProductForm;
 window.openProductForm=function(id){oldOpen(id);const p=id?state.products.find(x=>x.id===id):null;setTimeout(()=>{const set=(sel,v)=>{const e=document.querySelector(sel);if(e)e.value=v||''};set('#pMaterial',p?.material);set('#pComposition',p?.composition);set('#pFit',p?.fit);set('#pRise',p?.rise);set('#pGender',p?.gender||'Mujer');set('#pModel',p?.model)},0)};
 const oldSave=window.saveProduct;
 window.saveProduct=async function(){const id=document.querySelector('#productId')?.value.trim();const before=id?state.products.find(x=>x.id===id):null;showSaveFeedback(before?'Actualizando producto en Firebase...':'Guardando producto en Firebase...','loading');try{syncColorImageTextarea();const oldDesc=document.querySelector('#pDescription')?.value||'';await oldSave();const currentId=id||state.products[0]?.id;const p=state.products.find(x=>x.id===currentId)||state.products.find(x=>x.name===document.querySelector('#pName')?.value.trim());if(p){p.material=document.querySelector('#pMaterial')?.value.trim()||'';p.composition=document.querySelector('#pComposition')?.value.trim()||'';p.fit=document.querySelector('#pFit')?.value.trim()||'';p.rise=document.querySelector('#pRise')?.value.trim()||'';p.gender=document.querySelector('#pGender')?.value||'Mujer';p.model=document.querySelector('#pModel')?.value.trim()||'';await putRecord('products',p,{requireFirebase:true});await reloadProductsFromFirebase();renderEverything();showSaveFeedback(before?'Producto actualizado y verificado en Firebase.':'Producto creado y verificado en Firebase.','success')}}catch(e){console.error(e);showSaveFeedback('No se guardó el producto: '+(e.message||e),'error',6000)}};
 
// V23: convierte nombres de colores a tonos visuales para la ficha del producto.
window.royColorStyle=function(name){
 const key=String(name||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 const map={
  negro:['#111111','#111111','#ffffff'], blanco:['#e5e5e5','#ffffff','#202020'], gris:['#8a8f98','#f1f2f3','#30343a'],
  verde:['#18864b','#e9f8ef','#126a3a'], celeste:['#38aee8','#e8f7ff','#1677a8'], azul:['#2166d1','#eaf1ff','#174b9b'],
  rojo:['#df2d38','#fff0f1','#b51f29'], marron:['#7a4a2d','#f5ece7','#653921'], beige:['#c6aa78','#fbf6eb','#755e35'],
  rosado:['#ee77a8','#fff0f6','#b82f69'], rosa:['#ee77a8','#fff0f6','#b82f69'], morado:['#7b46bd','#f4ecff','#61319c'],
  amarillo:['#e4b900','#fff9d9','#705b00'], naranja:['#ee7c1b','#fff0e3','#a84c00'], crema:['#d8c59b','#fffaf0','#715f38'],
  vino:['#751b35','#fbeaf0','#751b35'], fucsia:['#d91a78','#ffeaf5','#a60c58'], turquesa:['#14a9a1','#e5fbfa','#08736e'],
  caqui:['#93845c','#f5f1e6','#615637'], camel:['#b87b42','#f9eee4','#815126'], dorado:['#c79b25','#fff7da','#795b00'],
  plateado:['#a8adb4','#f4f5f6','#555b63']
 };
 const v=map[key]||['#737a84','#f2f4f5','#30353b'];
 return `--chip-color:${v[0]};--chip-bg:${v[1]};--chip-text:${v[2]}`;
};
const oldOpenQuick=window.openQuick;
 window.openQuick=function(id){oldOpenQuick(id);const p=state.products.find(x=>x.id===id);if(!p)return;const specs=[['Material',p.material],['Composición',p.composition],['Corte / fit',p.fit],['Tiro',p.rise],['Género',p.gender],['Modelo',p.model],['Categoría',p.category],['Código',p.sku]].filter(x=>x[1]);const box=document.getElementById('quickSpecifications');if(box)box.innerHTML=specs.length?'<div class="pdp-section-title">Especificaciones principales</div>'+specs.map(x=>'<div class="pdp-spec-item"><b>'+esc(x[0])+'</b><span>'+esc(x[1])+'</span></div>').join(''):''};
 const asyncWrap=(name,label)=>{const fn=window[name];if(typeof fn!=='function')return;window[name]=async function(...args){showSaveFeedback(label+'...','loading');try{const r=await fn.apply(this,args);showSaveFeedback(label.replace(/ando|iendo$/,'ado')+' correctamente.','success');return r}catch(e){showSaveFeedback('No se pudo completar: '+(e.message||e),'error',6000);throw e}}};
 ['saveMedia','savePromotion','saveSettings'].forEach((n)=>asyncWrap(n,n==='saveMedia'?'Guardando contenido':n==='savePromotion'?'Guardando promoción':'Guardando configuración'));
 const origAddCategory=window.addCategory;if(origAddCategory)window.addCategory=async function(){showSaveFeedback('Guardando categoría...','loading');try{await origAddCategory();showSaveFeedback('Categoría guardada correctamente.','success')}catch(e){showSaveFeedback('No se guardó la categoría: '+(e.message||e),'error')}};
 const origShip=window.saveShippingSettings;if(origShip)window.saveShippingSettings=function(){try{origShip();showSaveFeedback('Configuración de envíos guardada.','success')}catch(e){showSaveFeedback('No se guardó la configuración de envíos.','error')}};
})();
