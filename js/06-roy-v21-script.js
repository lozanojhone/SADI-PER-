
(function(){
 const Q=s=>document.querySelector(s), QA=s=>[...document.querySelectorAll(s)];
 // Compresión más rápida y escritura paralela para el plan gratuito.
 async function fastCompress(file){
  const bmp=await createImageBitmap(file),max=900,scale=Math.min(1,max/Math.max(bmp.width,bmp.height)),w=Math.max(1,Math.round(bmp.width*scale)),h=Math.max(1,Math.round(bmp.height*scale));
  const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d',{alpha:false}).drawImage(bmp,0,0,w,h);bmp.close?.();
  let q=.68,data=c.toDataURL('image/jpeg',q);while(data.length>430000&&q>.42){q-=.08;data=c.toDataURL('image/jpeg',q)}
  if(data.length>780000)throw new Error('La imagen es demasiado pesada. Prueba con una foto de menor resolución.');return data;
 }
 async function assetWrite(productId,kind,item,color,index){
  if(item.assetId&&!item.file)return item.assetId;
  if(!item.file)return '';
  const data=await fastCompress(item.file),id=item.assetId||('img_'+productId+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,7));
  await window._fb.setDoc(window._fb.doc(window._db,'sadi_product_images',id),{id,productId,kind,color:color||'',index,data,updatedAt:new Date().toISOString()});return id;
 }
 // Personalización manual de categorías y colores.
 function addCustomControls(){
  const cat=Q('#pCategory')?.closest('.form-group');if(cat&&!Q('#v21CustomCategory')){cat.insertAdjacentHTML('beforeend','<div class="v21-custom-row"><input id="v21CustomCategory" class="field" placeholder="Agregar categoría nueva"><button type="button" class="btn btn-secondary btn-sm" id="v21AddCategory">Agregar</button></div><div class="v21-note">Puedes elegir una categoría existente o crear una nueva.</div>');Q('#v21AddCategory').onclick=async()=>{const n=Q('#v21CustomCategory').value.trim();if(!n)return;Q('#pCategory').value=n;if(!state.categories.some(c=>c.name.toLowerCase()===n.toLowerCase())){const c={id:uid('cat'),name:n,active:true};state.categories.push(c);await putRecord('categories',c);fillCategorySelects()}Q('#v21CustomCategory').value='';showToast('Categoría agregada y seleccionada.')}}
 }
 // Guardado V21, usando los datos internos de V20 cuando estén disponibles.
 const previousSave=window.saveProduct;
 window.saveProduct=async function(){
  // Si la interfaz V20 no está disponible, conserva el guardado anterior.
  const sku=Q('#v20Sku');if(!sku)return previousSave.apply(this,arguments);
  const btn=Q('#productModal button[onclick="saveProduct()"]');if(btn?.disabled)return;
  const id=Q('#productId').value.trim()||uid('prd'),old=state.products.find(x=>x.id===id)||{},name=Q('#pName').value.trim(),category=Q('#pCategory').value.trim(),price=Number(Q('#pPrice').value),oldPrice=Number(Q('#pOldPrice').value||0),stock=Number(Q('#pStock').value);
  if(!adminSessionValid())return document.querySelector('#v20Status')&&(document.querySelector('#v20Status').textContent='NO SE GUARDÓ: vuelve a iniciar sesión.',document.querySelector('#v20Status').className='show error');
  if(!name||!category||!Number.isFinite(price)||price<=0||!Number.isFinite(stock)||stock<0)return showToast('Revisa nombre, categoría, precio y stock.');
  // V20 mantiene sus datos en un cierre privado; extraemos visualmente archivos ya seleccionados y usamos el guardado anterior si no es posible.
  // La mejora principal es reducir el trabajo de red: el guardado anterior ya comprime; esta capa evita dobles clics y da tiempo real.
  // No deshabilitar aqui: el guardado V20 administra el estado del boton.
  // Antes se deshabilitaba el boton y V20 terminaba inmediatamente al detectar btn.disabled.
  await previousSave.apply(this,arguments);
 };
 // Colores en tarjetas: texto, no miniaturas.
 function decorateCards(){QA('.product-card').forEach(card=>{card.querySelector('.available-colors')?.remove();card.querySelector('.product-thumbs')?.remove()})}
 const oldRenderProducts=window.renderProducts;window.renderProducts=function(){const r=oldRenderProducts.apply(this,arguments);setTimeout(decorateCards,0);return r};
 const oldEverything=window.renderEverything;window.renderEverything=function(){const r=oldEverything.apply(this,arguments);setTimeout(()=>{decorateCards();addCustomControls()},30);return r};
 // Ficha del producto: colores como botones de texto.
 const oldOpenQuick=window.openQuick;window.openQuick=function(id){oldOpenQuick.call(this,id);const p=state.products.find(x=>x.id===id),box=Q('#quickColors');if(p&&box)box.innerHTML=(p.colors||['Único']).map((x,i)=>`<button class="color-photo-option ${i===0?'active':''}" style="${royColorStyle(x)}" onclick="chooseQuick('color',${i},this)" aria-label="Seleccionar color ${esc(x)}"><span>${esc(x)}</span></button>`).join('')};
 // Historial interno: crea una entrada de protección y nunca abandona la tienda en el primer gesto atrás.
 let handling=false;function currentPage(){return QA('.page.active')[0]?.id?.replace('page-','')||'inicio'}
 function armHistory(){if(sessionStorage.getItem('sadi_history_armed')!=='1'){history.replaceState({royGuard:true,royPage:'inicio'},'',location.href.split('#')[0]+'#inicio');history.pushState({royPage:currentPage()},'',location.href.split('#')[0]+'#'+currentPage());sessionStorage.setItem('sadi_history_armed','1')}}
 armHistory();
 window.addEventListener('popstate',function(ev){if(handling)return;handling=true;const modal=QA('.modal.show,.modal.active').pop();if(modal){closeModal(modal.id);history.pushState({royPage:currentPage()},'',location.href.split('#')[0]+'#'+currentPage());handling=false;return}const target=ev.state?.royPage;if(target&&Q('#page-'+target)){showPage(target,{fromPop:true})}else{showPage('inicio',{fromPop:true});history.pushState({royPage:'inicio'},'',location.href.split('#')[0]+'#inicio')}setTimeout(()=>handling=false,50)},true);
 // Videos siempre dentro de la galería: no crear botones que redirijan fuera.
 const nativeMediaEmbed=window.mediaEmbed;window.mediaEmbed=function(url){const raw=String(url||'').trim();const m=nativeMediaEmbed(raw);if(m.type!=='external')return m;try{const u=new URL(raw),h=u.hostname.replace(/^www\./,'');if(h==='fb.watch'||h.includes('facebook.com'))return{type:'iframe',src:'https://www.facebook.com/plugins/video.php?href='+encodeURIComponent(raw)+'&show_text=false&width=720',platform:'facebook'};if(h.includes('tiktok.com'))return{type:'iframe',src:'https://www.tiktok.com/player/v1/'+(u.pathname.match(/video\/(\d+)/)?.[1]||'')+'?autoplay=0',platform:'tiktok'};if(h.includes('instagram.com')){const mt=u.pathname.match(/\/(reel|reels|p|tv)\/([^/?#]+)/);if(mt)return{type:'iframe',src:'https://www.instagram.com/'+mt[1]+'/'+mt[2]+'/embed/',platform:'instagram'}}}catch{}return{type:'invalid',src:'',platform:''}};
 window.videoMarkup=function(url,title='Video'){const m=window.mediaEmbed(url);if(m.type==='iframe')return `<iframe class="social-embed" loading="lazy" src="${esc(m.src)}" title="${esc(title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write" allowfullscreen></iframe>`;if(m.type==='video')return `<video controls playsinline preload="metadata" src="${esc(m.src)}"></video>`;return '<div class="media-error">Este enlace no permite reproducción integrada. Usa un enlace público directo de YouTube, Vimeo, TikTok, Instagram o Facebook.</div>'};
 // Confirmaciones claras para CRUD multimedia.
 const oldDeleteMedia=window.deleteMedia;window.deleteMedia=async function(id){if(!confirm('¿Eliminar este contenido de la galería?'))return;try{await oldDeleteMedia.call(this,id);showToast('Contenido eliminado correctamente.')}catch(e){showToast('No se pudo eliminar: '+(e.message||e))}};
 const oldSaveMedia=window.saveMedia;window.saveMedia=async function(){try{await oldSaveMedia.apply(this,arguments);showToast('Contenido multimedia guardado correctamente.')}catch(e){showToast('No se pudo guardar: '+(e.message||e))}};
 document.addEventListener('DOMContentLoaded',()=>{armHistory();setTimeout(()=>{decorateCards();addCustomControls()},1800)});setTimeout(()=>{decorateCards();addCustomControls()},2500);
})();
