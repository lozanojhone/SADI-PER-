
'use strict';
const OFFICIAL_SADI_LOGO='assets/logo-sadi-mark.png';
const OFFICIAL_SADI_MARK='assets/logo-sadi-mark.png';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const money=n=>'S/ '+Number(n||0).toFixed(2);
const uid=(p='id')=>p+'_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const esc=v=>String(v??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
const parseList=v=>String(v||'').split(',').map(x=>x.trim()).filter(Boolean);
const parseGallery=v=>String(v||'').split(/[\n,]+/).map(x=>x.trim()).filter(Boolean);
const parseColorImages=v=>Object.fromEntries(String(v||'').split(/\n+/).map(x=>x.split('|').map(y=>y.trim())).filter(x=>x[0]&&x[1]));
const productImages=p=>[p.image,...(p.gallery||[]),...Object.values(normalizeColorImages(p.colorImages||{})).flat()].filter((x,i,a)=>x&&a.indexOf(x)===i);
const colorGallery=(p,color)=>{const own=normalizeColorImages(p.colorImages||{})[color]||[];return (own.length?own:[p.image,...(p.gallery||[])]).filter((x,i,a)=>x&&a.indexOf(x)===i).slice(0,4)};
const colorHex=name=>{const n=String(name||'').toLowerCase();const map={'negro':'#111','blanco':'#f5f5f5','gris':'#888','gris plata':'#aaa','grafito':'#444','rojo':'#c62828','azul':'#2457c5','azul oscuro':'#172b4d','verde':'#2f8f46','verde neón':'#86ff31','naranja':'#a8ff00','arena':'#c7ad82','beige':'#d7c3a0','marrón':'#754c24','morado':'#7b3fb2','rosado':'#e88fac'};return Object.entries(map).find(([k])=>n.includes(k))?.[1]||'#686868'};
const categoryKind=category=>{const c=String(category||'').toLowerCase();if(/pantal|jean|cargo|short|bermuda/.test(c))return 'pants';if(/polo|camisa|hood|casaca|chaleco|sudadera|top|blusa/.test(c))return 'tops';if(/zapat|calzado|zapato|sandalia/.test(c))return 'shoes';return 'other'};
function displaySizes(p){const raw=(p.sizes||[]).map(x=>String(x).trim()).filter(Boolean),kind=categoryKind(p.category),map={XS:'26',S:'28',M:'30',L:'32',XL:'34',XXL:'36'};if(kind==='pants'){const nums=raw.map(x=>map[x.toUpperCase()]||x).filter(x=>/^\d{1,3}$/.test(x));return [...new Set(nums.length?nums:['26','28','30','32','34','36'])]}if(kind==='tops'){const alpha=raw.map(x=>x.toUpperCase()).filter(x=>/^(XS|S|M|L|XL|XXL)$/.test(x));return [...new Set(alpha.length?alpha:['S','M','L','XL'])]}if(kind==='shoes'){const nums=raw.filter(x=>/^\d{1,3}(?:\.5)?$/.test(x));return [...new Set(nums.length?nums:['36','37','38','39','40','41','42'])]}return raw.length?raw:['Única']}

const dateText=v=>{try{return new Date(v).toLocaleDateString('es-PE',{day:'2-digit',month:'short',year:'numeric'})}catch{return v||'—'}};
const DB_PREFIX='sadi_';
const LEGACY_DB_PREFIX='jho'+'nz_';
const COLLECTIONS={products:'products',orders:'orders',categories:'categories',promotions:'promotions',messages:'messages',reviews:'reviews',users:'users',shipping:'shipping',settings:'settings',inventory:'inventory',media:'media'};
const state={products:[],orders:[],categories:[],promotions:[],messages:[],reviews:[],users:[],inventory:[],media:[],cart:JSON.parse(localStorage.getItem('sadi_cart')||localStorage.getItem(LEGACY_DB_PREFIX+'cart')||'[]'),favorites:JSON.parse(localStorage.getItem('sadi_favorites')||localStorage.getItem(LEGACY_DB_PREFIX+'favorites')||'[]'),profile:JSON.parse(localStorage.getItem('sadi_profile')||localStorage.getItem(LEGACY_DB_PREFIX+'profile')||'{}'),settings:{storeName:'SADI PERÚ',whatsapp:'51961400679',email:'',hours:'Lunes a sábado: 9:00 AM a 7:00 PM',address:'Galería Los Fabricantes 718 - La Victoria - Lima',facebook:'',instagram:'',tiktok:'https://www.tiktok.com/@sadiperu.oficial',logo:OFFICIAL_SADI_LOGO,primaryColor:'#6B3A1E',secondaryColor:'#FFFFFF',backgroundColor:'#050505',textColor:'#FFFFFF',brandVersion:30,heroSlides:[{image:'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1800&q=88',kicker:'Nueva colección 2026',title:'Viste tu esencia',highlight:'tu esencia',description:'Moda femenina pensada para expresar tu estilo con comodidad, elegancia y personalidad.',buttonText:'Explorar colección',buttonPage:'tienda'},{image:'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1800&q=88',kicker:'Drop exclusivo',title:'Diseño que impone presencia',highlight:'impone presencia',description:'Siluetas femeninas, detalles actuales y una propuesta creada para destacar con naturalidad.',buttonText:'Ver productos',buttonPage:'tienda'},{image:'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=1800&q=88',kicker:'Estilo SADI PERÚ',title:'Haz que tu estilo hable',highlight:'tu estilo hable',description:'Descubre combinaciones femeninas para cada momento del día.',buttonText:'Ver lookbook',buttonPage:'galeria'}],heroInterval:5500,freeShipping:200,policies:'Cambios coordinados dentro de los 7 días, conservando la prenda sin uso y con etiquetas.',terms:'Los pedidos se confirman al validar disponibilidad y pago.'},payment:'WhatsApp',coupon:null,orderStatusFilter:'Todos'};
window.state=state; // Estado compartido para módulos administrativos y correcciones.
const seedProducts=[];
const seedCategories=['Polos','Casacas','Pantalones','Hoodies','Accesorios'].map((name,i)=>({id:'cat_'+i,name,active:true}));
const seedPromotions=[{id:'promo10',code:'SADI10',discount:10,description:'10% de descuento en tu primera compra',start:'2026-01-01',end:'2027-12-31',active:true}];
const seedUsers=[{id:'usr_admin',name:'Administrador SADI',username:'admin',role:'Administrador',permissions:'Todos los módulos',active:true}];
function localKey(name){return DB_PREFIX+name}
function loadLocal(name,fallback=[]){try{const current=localStorage.getItem(localKey(name));const legacy=localStorage.getItem(LEGACY_DB_PREFIX+name);const raw=current??legacy;if(raw===null)return fallback;const value=JSON.parse(raw);if(Array.isArray(value)){if(current===null&&legacy!==null)saveLocal(name,value);return value}return fallback}catch{return fallback}}
function saveLocal(name,data){localStorage.setItem(localKey(name),JSON.stringify(data))}
async function waitFirebase(){if(window._firebaseReady!==undefined)return;await new Promise(r=>window.addEventListener('firebase-ready',r,{once:true}))}
async function loadCollection(name,fallback=[]){
 const local=loadLocal(name,fallback);
 await waitFirebase();
 if(window._firebaseReady&&window._db&&window._fb){
  try{
   let snap=await window._fb.getDocs(window._fb.collection(window._db,DB_PREFIX+name));
   let remote=snap.docs.map(d=>({id:d.id,...d.data()}));
   if(!remote.length && name!=='products'){
    const legacySnap=await window._fb.getDocs(window._fb.collection(window._db,LEGACY_DB_PREFIX+name));
    remote=legacySnap.docs.map(d=>({id:d.id,...d.data()}));
   }
   if(name==='products'){saveLocal(name,remote);localStorage.setItem('sadi_products_verified','1');return remote}
   if(remote.length){saveLocal(name,remote);return remote}
  }catch(e){console.warn('Lectura Firebase falló:',name,e.message)}
 }
 return local;
}
async function putRecord(name,record,{requireFirebase=false}={}){
 if(!record?.id)throw new Error('El registro no tiene un ID válido.');
 await waitFirebase();
 let savedRemote=false;
 if(window._firebaseReady&&window._db&&window._fb){
  try{
   await window._fb.setDoc(window._fb.doc(window._db,DB_PREFIX+name,record.id),record,{merge:true});
   savedRemote=true;setSyncLabel(true);
  }catch(e){
   console.error('Error al guardar en Firebase:',name,record.id,e);
   setSyncLabel(false);
   if(requireFirebase)throw e;
  }
 }else if(requireFirebase){
  throw new Error('Firebase no está disponible.');
 }
 const list=loadLocal(name,[]);const i=list.findIndex(x=>x.id===record.id);if(i>=0)list[i]=record;else list.unshift(record);saveLocal(name,list);
 return {...record,_savedRemote:savedRemote};
}
async function removeRecord(name,id){const list=loadLocal(name,[]).filter(x=>x.id!==id);saveLocal(name,list);await waitFirebase();if(window._firebaseReady&&window._db&&window._fb){try{await window._fb.deleteDoc(window._fb.doc(window._db,DB_PREFIX+name,id));setSyncLabel(true)}catch(e){setSyncLabel(false)}}}
function setSyncLabel(ok){const el=$('#syncLabel');if(el)el.textContent=ok?'Sistema actualizado':'Modo local seguro'}

function normalizeColorImages(value){const out={};if(!value)return out;for(const [k,v] of Object.entries(value)){out[k]=Array.isArray(v)?v.filter(Boolean):String(v||'').split(/[\n,]/).map(x=>x.trim()).filter(Boolean)}return out}
function renderGalleryUploadSlots(images=[]){const box=$('#pGalleryUploads');if(!box)return;const list=[...images,'','',''].slice(0,3);box.innerHTML=list.map((src,i)=>`<div class="upload-slot"><button type="button" class="upload-remove" title="Quitar imagen" onclick="clearGallerySlot(${i})">✕</button><img id="galleryPreview${i}" src="${esc(src||'https://placehold.co/500x600/202020/888?text=Imagen+'+(i+1))}" onerror="this.src='https://placehold.co/500x600/202020/888?text=Imagen+'+(i+1)"><input class="field gallery-url" id="galleryUrl${i}" value="${esc(src||'')}" placeholder="URL de imagen ${i+1}" oninput="previewGallerySlot(${i})" style="margin-bottom:8px"><label class="btn btn-secondary btn-sm"><i class="fa-solid fa-upload"></i> Subir archivo<input type="file" id="galleryFile${i}" accept="image/*" hidden onchange="handleGalleryFile(this,${i})"></label></div>`).join('')}
function clearGallerySlot(i){const u=$('#galleryUrl'+i),f=$('#galleryFile'+i),img=$('#galleryPreview'+i);if(u)u.value='';if(f){f.value='';delete f.dataset.data}if(img)img.src='https://placehold.co/500x600/202020/888?text=Imagen+'+(i+1)}
function previewGallerySlot(i){const u=$('#galleryUrl'+i).value.trim();if(u)$('#galleryPreview'+i).src=u}
async function handleGalleryFile(input,i){const f=input.files?.[0];if(!f)return;const data=await fileToData(f);input.dataset.data=data;$('#galleryUrl'+i).value='';$('#galleryPreview'+i).src=data}
function collectGalleryImages(){return [0,1,2].map(i=>$('#galleryUrl'+i)?.value.trim()||$('#galleryFile'+i)?.dataset.data||'').filter(Boolean)}
function renderColorImageFields(existing){const box=$('#pColorImageFields');if(!box)return;const current=normalizeColorImages(existing||safeJson($('#pColorImages')?.value,{}));const colors=parseList($('#pColors')?.value||'');box.innerHTML=colors.length?colors.map(color=>`<div class="color-image-row"><b><span class="color-swatch" style="--swatch:${colorHex(color)};display:inline-block;vertical-align:middle;margin-right:8px;width:18px;height:18px"></span>${esc(color)}</b><div class="color-upload-set">${[0,1,2].map(i=>{const src=current[color]?.[i]||'';return `<div class="color-upload-slot"><img id="colorPreview_${slug(color)}_${i}" src="${esc(src||'https://placehold.co/320x380/202020/888?text='+(i+1))}"><input class="field color-image-input" data-color="${esc(color)}" data-index="${i}" value="${esc(src)}" placeholder="URL" oninput="previewColorSlot(this)" style="padding:7px;margin-bottom:6px"><label class="btn btn-secondary btn-sm">Subir<input type="file" accept="image/*" hidden data-color="${esc(color)}" data-index="${i}" onchange="handleColorFile(this,'${esc(color)}',${i})"></label></div>`}).join('')}</div></div>`).join(''):'<div class="muted" style="font-size:10px">Primero escribe los colores del producto.</div>';syncColorImageTextarea()}
function slug(v){return String(v).toLowerCase().replace(/[^a-z0-9]+/g,'_')}
function previewColorSlot(input){const img=$('#colorPreview_'+slug(input.dataset.color)+'_'+input.dataset.index);if(input.value.trim())img.src=input.value.trim();syncColorImageTextarea()}
async function handleColorFile(input,color,i){const f=input.files?.[0];if(!f)return;const data=await fileToData(f);input.dataset.data=data;const field=$$('.color-image-input').find(x=>x.dataset.color===color&&Number(x.dataset.index)===i);if(field){field.value='';field.dataset.data=data}$('#colorPreview_'+slug(color)+'_'+i).src=data;syncColorImageTextarea()}
function collectColorImageArrays(){const out={};$$('.color-image-input').forEach(x=>{const c=x.dataset.color,v=x.value.trim()||x.dataset.data||'';if(v){(out[c]||(out[c]=[]))[Number(x.dataset.index)]=v}});for(const c of Object.keys(out))out[c]=out[c].filter(Boolean).slice(0,3);return out}
function syncColorImageTextarea(){const ta=$('#pColorImages');if(ta)ta.value=JSON.stringify(collectColorImageArrays())}
function safeJson(v,fallback){try{return JSON.parse(v)||fallback}catch{return fallback}}
async function initData(){
 // Inicio limpio: nunca inserta productos de demostración.
 if(!localStorage.getItem(localKey('categories')))saveLocal('categories',seedCategories);
 if(!localStorage.getItem(localKey('promotions')))saveLocal('promotions',seedPromotions);
 if(!localStorage.getItem(localKey('users')))saveLocal('users',seedUsers);
 const localSettings=loadLocal('settings',[])[0]||{};
 const verifiedProducts=localStorage.getItem('sadi_products_verified')==='1'?loadLocal('products',[]):[];
 state.products=verifiedProducts.map(p=>({...p,gallery:p.gallery||[],colorImages:normalizeColorImages(p.colorImages||{}),colors:p.colors?.length?p.colors:['Único'],sizes:p.sizes?.length?p.sizes:['Única']}));
 state.categories=loadLocal('categories',seedCategories);state.orders=loadLocal('orders',[]);state.promotions=loadLocal('promotions',seedPromotions);state.messages=loadLocal('messages',[]);state.reviews=loadLocal('reviews',[]);state.users=loadLocal('users',seedUsers);state.inventory=loadLocal('inventory',[]);state.media=loadLocal('media',[]);
 state.settings={...state.settings,...localSettings};
 if(!state.settings.logo)state.settings.logo=OFFICIAL_SADI_LOGO;
 renderEverything();applySettings();
 document.body.classList.remove('roy-brand-loading');
 requestAnimationFrame(()=>document.getElementById('royFastLoader')?.classList.add('hide'));

 // Actualiza desde Firebase en paralelo, sin bloquear la primera vista.
 const timeout=(promise,ms=9000)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Tiempo de consulta agotado')),ms))]);
 try{
  const [products,categories,orders,promotions,messages,reviews,users,media,settingsRows]=await Promise.all([
   timeout(loadCollection('products',state.products)),timeout(loadCollection('categories',state.categories)),timeout(loadCollection('orders',state.orders)),timeout(loadCollection('promotions',state.promotions)),timeout(loadCollection('messages',state.messages)),timeout(loadCollection('reviews',state.reviews)),timeout(loadCollection('users',state.users)),timeout(loadCollection('media',state.media)),timeout(loadCollection('settings',[]))
  ]);
  state.products=products.map(p=>({...p,gallery:p.gallery||[],colorImages:normalizeColorImages(p.colorImages||{}),colors:p.colors?.length?p.colors:['Único'],sizes:p.sizes?.length?p.sizes:['Única']}));
  state.categories=categories;state.orders=orders;state.promotions=promotions;state.messages=messages;state.reviews=reviews;state.users=users;state.media=media;
  if(settingsRows[0])state.settings={...state.settings,...settingsRows[0]};
  if(!state.settings.logo)state.settings.logo=OFFICIAL_SADI_LOGO;
  const renameBrand=value=>String(value||'').replace(/JHONZ/gi,'SADI PERÚ');
  state.products=state.products.map(p=>({...p,brand:'SADI PERÚ',name:renameBrand(p.name),description:renameBrand(p.description)}));
  state.media=state.media.map(m=>({...m,title:renameBrand(m.title),description:renameBrand(m.description)}));
  state.settings.email=String(state.settings.email||'').replace(/jhonz/gi,'roy');
  saveLocal('products',state.products);saveLocal('media',state.media);saveLocal('settings',[{id:'main',...state.settings}]);
  renderEverything();applySettings();
  startOrdersRealtime();
 }catch(e){console.warn('V24: se mantiene la vista local rápida:',e.message)}
}
let ordersRealtimeUnsubscribe=null;
function startOrdersRealtime(){
 if(ordersRealtimeUnsubscribe||!window._firebaseReady||!window._db||!window._fb||!window._firebaseAdmin)return;
 try{
  ordersRealtimeUnsubscribe=window._fb.onSnapshot(
   window._fb.collection(window._db,DB_PREFIX+'orders'),
   snap=>{
    state.orders=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
    saveLocal('orders',state.orders);
    renderAllAdmin();
   },
   error=>console.warn('No se pudo sincronizar pedidos en tiempo real:',error.message)
  );
 }catch(error){console.warn('No se pudo iniciar pedidos en tiempo real:',error.message)}
}
window.addEventListener('firebase-auth-changed',event=>{if(event.detail?.isAdmin)setTimeout(startOrdersRealtime,50)});
function renderEverything(){fillCategorySelects();renderStore();renderFeatured();renderSale();renderUpcoming();renderCart();renderAccount();renderGallery();renderAllAdmin()}
function fillCategorySelects(){const cats=[...new Set([...state.categories.filter(c=>c.active!==false).map(c=>c.name),...state.products.map(p=>p.category)])].filter(Boolean).sort((a,b)=>String(a).localeCompare(String(b),'es'));['categoryFilter','adminProductCategory','pCategory'].forEach(id=>{const el=document.getElementById(id);if(!el)return;const current=el.value||'';const first=id==='pCategory'?'Selecciona una categoría':'Todas las categorías';el.innerHTML='<option value="">'+first+'</option>'+cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');if(current&&cats.includes(current))el.value=current;else if(id==='pCategory'&&current){const opt=document.createElement('option');opt.value=current;opt.textContent=current;el.appendChild(opt);el.value=current}});const dl=$('#categoryList');if(dl)dl.innerHTML=cats.map(c=>`<option value="${esc(c)}">`).join('')}
function productPublication(p){return String(p?.publication||'store').toLowerCase();}
function isStoreProduct(p){return productPublication(p)!=='upcoming';}
function isUpcomingProduct(p){return ['upcoming','both'].includes(productPublication(p));}
function upcomingCard(p){const date=p.launchDate?new Date(p.launchDate+'T12:00:00').toLocaleDateString('es-PE',{day:'2-digit',month:'long',year:'numeric'}):'';return `<article class="product-card premium-card upcoming-card" data-id="${esc(p.id)}"><div class="product-image"><img loading="lazy" decoding="async" src="${esc(p.image)}" alt="${esc(p.name)}" onerror="this.src='https://placehold.co/600x760/1a1a1a/ffffff?text=SADI'"><span class="tag">PRÓXIMAMENTE</span></div><div class="product-body"><div class="product-brand">${esc(p.brand||'SADI PERÚ')}</div><h3 class="product-name">${esc(p.name)}</h3>${p.description?`<p class="upcoming-description">${esc(p.description)}</p>`:''}${date?`<div class="upcoming-date"><i class="fa-regular fa-calendar"></i> Lanzamiento: ${esc(date)}</div>`:''}<button class="btn btn-secondary choose-options-btn" type="button" disabled><i class="fa-regular fa-clock"></i> Muy pronto</button></div></article>`};
function renderUpcoming(){const list=state.products.filter(isUpcomingProduct).sort((a,b)=>String(a.launchDate||'9999-12-31').localeCompare(String(b.launchDate||'9999-12-31')));const grid=$('#upcomingGrid');if(grid)grid.innerHTML=list.length?list.map(upcomingCard).join(''):'<div class="empty" style="grid-column:1/-1"><div class="big">◷</div>Aún no hay próximos lanzamientos publicados.</div>';}
function productCard(p){const fav=state.favorites.includes(p.id),tag=(p.tags||[])[0]||'',images=productImages(p),discount=p.oldPrice>p.price?Math.round((1-p.price/p.oldPrice)*100):0;return `<article class="product-card premium-card" data-id="${esc(p.id)}"><div class="product-image" onclick="openQuick('${p.id}')"><img loading="eager" fetchpriority="high" decoding="async" id="img-${p.id}" src="${esc(p.image)}" alt="${esc(p.name)}" onerror="this.src='https://placehold.co/600x760/1a1a1a/ffffff?text=SADI'">${tag?`<span class="tag">${esc(tag)}</span>`:''}${discount?`<span class="discount-badge">-${discount}%</span>`:''}<button class="wish ${fav?'active':''}" aria-label="Favorito" onclick="event.stopPropagation();toggleFavorite('${p.id}')">${fav?'♥':'♡'}</button><div class="image-hover-action">Ver producto</div></div><div class="product-body"><div class="product-brand">${esc(p.brand||'SADI PERÚ')}</div><h3 class="product-name" onclick="openQuick('${p.id}')">${esc(p.name)}</h3>${images.length>1?`<div class="product-thumbs">${images.slice(0,4).map((img,i)=>`<button class="product-thumb-btn ${i===0?'active':''}" onclick="event.stopPropagation();changeCardImage('${p.id}',${i},this)"><img src="${esc(img)}" alt="Vista ${i+1}"></button>`).join('')}</div>`:''}<div class="price-row clean-price-row"><div><span class="price">${money(p.price)}</span>${p.oldPrice?` <span class="old-price">${money(p.oldPrice)}</span>`:''}</div></div><button class="btn btn-primary choose-options-btn" ${p.stock<=0?'disabled':''} onclick="openQuick('${p.id}')"><i class="fa-solid fa-bag-shopping"></i>${p.stock>0?'Ver opciones':'Producto agotado'}</button></div></article>`}
function renderStore(){const search=($('#storeSearch')?.value||'').toLowerCase(),cat=$('#categoryFilter')?.value||'',sort=$('#sortFilter')?.value||'featured';let list=state.products.filter(p=>isStoreProduct(p)&&(!search||[p.name,p.sku,p.brand,p.category].join(' ').toLowerCase().includes(search))&&(!cat||p.category===cat));if(sort==='low')list.sort((a,b)=>a.price-b.price);if(sort==='high')list.sort((a,b)=>b.price-a.price);if(sort==='new')list.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));if(sort==='featured')list.sort((a,b)=>(b.tags?.includes('Destacado')?1:0)-(a.tags?.includes('Destacado')?1:0));const grid=$('#storeGrid');if(grid)grid.innerHTML=list.length?list.map(productCard).join(''):'<div class="empty" style="grid-column:1/-1"><div class="big">⌕</div>No encontramos productos con esos filtros.</div>';if($('#productResultsMeta'))$('#productResultsMeta').textContent=list.length+' producto(s) encontrados.'}
function renderFeatured(){const list=state.products.filter(p=>isStoreProduct(p)&&p.tags?.includes('Destacado')).slice(0,4);if($('#featuredGrid'))$('#featuredGrid').innerHTML=(list.length?list:state.products.filter(isStoreProduct).slice(0,4)).map(productCard).join('')||'<div class="empty" style="grid-column:1/-1">Aún no hay productos publicados.</div>'}
function renderSale(){const list=state.products.filter(p=>isStoreProduct(p)&&(p.tags?.includes('Oferta')||Number(p.oldPrice)>Number(p.price)));if($('#saleGrid'))$('#saleGrid').innerHTML=list.length?list.map(productCard).join(''):'<div class="empty" style="grid-column:1/-1">No hay ofertas activas.</div>'}
function clearFilters(){if($('#storeSearch'))$('#storeSearch').value='';if($('#categoryFilter'))$('#categoryFilter').value='';if($('#sortFilter'))$('#sortFilter').value='featured';renderStore()}
function openCategory(cat){showPage('tienda');setTimeout(()=>{if($('#categoryFilter'))$('#categoryFilter').value=cat;renderStore()},30)}
function focusStoreSearch(){showPage('tienda');setTimeout(()=>$('#storeSearch')?.focus(),100)}
function showPage(name){$$('.page').forEach(x=>x.classList.remove('active'));$('#page-'+name)?.classList.add('active');$$('#navLinks a').forEach(x=>x.classList.toggle('active',x.dataset.page===name));window.scrollTo({top:0,behavior:'smooth'});if(name==='cuenta')renderAccount()}
function openMobileMenu(){$('#mobileMenu').classList.add('open');$('#drawerOverlay').classList.add('open')}
function openCart(){renderCart();$('#cartDrawer').classList.add('open');$('#drawerOverlay').classList.add('open')}
function closeOverlays(){$('#cartDrawer').classList.remove('open');$('#mobileMenu').classList.remove('open');$('#drawerOverlay').classList.remove('open')}
function openModal(id){$('#'+id)?.classList.add('open')}
function closeModal(id){$('#'+id)?.classList.remove('open')}
function showToast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove('show'),3200)}
function addFromCard(id){const p=state.products.find(x=>x.id===id);if(!p||p.stock<=0)return showToast('Producto agotado.');openQuick(id)}
function addToCart(productId,color,size,qty=1){const p=state.products.find(x=>x.id===productId);if(!p||p.stock<=0)return;const key=productId+'|'+color+'|'+size,found=state.cart.find(x=>x.key===key);if(found)found.qty=Math.min(found.qty+qty,p.stock);else state.cart.push({key,productId,color,size,qty});persistCart();showToast('✓ Producto añadido al carrito');renderCart()}
function persistCart(){localStorage.setItem('sadi_cart',JSON.stringify(state.cart));renderCartCount()}
function renderCartCount(){const count=state.cart.reduce((s,x)=>s+x.qty,0);if($('#cartCount'))$('#cartCount').textContent=count;if($('#cartTitleCount'))$('#cartTitleCount').textContent='('+count+')'}
function cartDetails(){return state.cart.map(i=>({...i,product:state.products.find(p=>p.id===i.productId)})).filter(x=>x.product)}
function cartSubtotal(){return cartDetails().reduce((s,x)=>s+x.product.price*x.qty,0)}
function renderCart(){renderCartCount();const list=cartDetails();const box=$('#cartList');if(box)box.innerHTML=list.length?list.map(x=>`<div class="cart-item"><img src="${esc(x.product.image)}"><div><h4>${esc(x.product.name)}</h4><small>${esc(x.color)} · ${esc(x.size)}</small><b class="orange">${money(x.product.price*x.qty)}</b><div class="qty" style="margin-top:8px"><button onclick="changeQty('${x.key}',-1)">−</button><span>${x.qty}</span><button onclick="changeQty('${x.key}',1)">＋</button></div></div><button class="remove" onclick="removeCart('${x.key}')">✕</button></div>`).join(''):'<div class="empty"><div class="big">▣</div>Tu carrito está vacío.<br><button class="btn btn-primary" style="margin-top:15px" onclick="closeOverlays();showPage(\'tienda\')">Ver productos</button></div>';const sub=cartSubtotal();if($('#cartSubtotal'))$('#cartSubtotal').textContent=money(sub);if($('#cartTotal'))$('#cartTotal').textContent=money(sub)}
function changeQty(key,d){const i=state.cart.find(x=>x.key===key);if(!i)return;const p=state.products.find(x=>x.id===i.productId);i.qty=Math.max(1,Math.min((p?.stock||99),i.qty+d));persistCart();renderCart();updateCheckout()}
function removeCart(key){state.cart=state.cart.filter(x=>x.key!==key);persistCart();renderCart();updateCheckout()}
let currentQuickId='',quickColor='',quickSize='',quickQty=1,quickImageIndex=0,quickImageList=[];
function renderQuickGallery(p,color){quickImageList=colorGallery(p,color);quickImageIndex=0;$('#quickImage').src=quickImageList[0]||p.image;$('#quickThumbs').innerHTML=quickImageList.map((img,i)=>`<button class="quick-thumb ${i===0?'active':''}" onclick="chooseQuickImage(${i},this)"><img src="${esc(img)}" alt="Vista ${i+1} de ${esc(color)}" onerror="this.src='https://placehold.co/160x190/202020/888?text=Vista'"></button>`).join('')}
function openQuick(id){const p=state.products.find(x=>x.id===id);if(!p)return;currentQuickId=id;quickQty=1;quickColor=p.colors?.[0]||'Único';const sizes=displaySizes(p);quickSize=sizes[0]||'Única';renderQuickGallery(p,quickColor);$('#quickSku').textContent='SKU: '+(p.sku||'—');$('#quickBrand').textContent=p.brand||'SADI PERÚ';$('#quickName').textContent=p.name;$('#quickPrice').textContent=money(p.price);$('#quickOldPrice').textContent=p.oldPrice&&p.oldPrice>p.price?money(p.oldPrice):'';const discount=p.oldPrice>p.price?Math.round((1-p.price/p.oldPrice)*100):0;$('#quickDiscount').textContent=discount?'-'+discount+'%':'';$('#quickDiscount').classList.toggle('hidden',!discount);$('#quickDescription').textContent=p.description||'';$('#quickColorLabel').textContent=quickColor;$('#quickColors').className='color-photo-options';$('#quickColors').innerHTML=(p.colors||['Único']).map((x,i)=>{const preview=colorGallery(p,x)[0]||p.image;return `<button class="color-photo-option ${i===0?'active':''}" title="${esc(x)}" onclick="chooseQuick('color',${i},this)"><img src="${esc(preview)}" alt="${esc(x)}"><span>${esc(x)}</span></button>`}).join('');$('#quickSizes').innerHTML=sizes.map((x,i)=>`<button class="chip ${i===0?'active':''}" onclick="chooseQuickSize('${esc(x)}',this)">${esc(x)}</button>`).join('');$('#quickQty').textContent='1';$('#quickStock').textContent=p.stock>0?'Disponible para compra':'Producto agotado';$('#quickAddBtn').disabled=p.stock<=0;$('#quickAddBtn').style.opacity=p.stock<=0?'.45':'1';setupProductZoom();openModal('quickModal')}
function chooseQuickImage(index,el){quickImageIndex=index;$('#quickImage').src=quickImageList[index]||quickImageList[0];$$('#quickThumbs .quick-thumb').forEach(x=>x.classList.remove('active'));el?.classList.add('active')}
function navigateQuickImage(dir){if(!quickImageList.length)return;quickImageIndex=(quickImageIndex+dir+quickImageList.length)%quickImageList.length;chooseQuickImage(quickImageIndex,$$('#quickThumbs .quick-thumb')[quickImageIndex])}
function chooseQuick(type,index,el){const p=state.products.find(x=>x.id===currentQuickId);if(!p)return;if(type==='color'){quickColor=(p.colors||['Único'])[index];$('#quickColorLabel').textContent=quickColor;$$('#quickColors .color-photo-option').forEach(x=>x.classList.remove('active'));el.classList.add('active');renderQuickGallery(p,quickColor);setupProductZoom()}else{quickSize=displaySizes(p)[index]||'Única';$$('#quickSizes .chip').forEach(x=>x.classList.remove('active'));el.classList.add('active')}}
function chooseQuickSize(value,el){quickSize=value;$$('#quickSizes .chip').forEach(x=>x.classList.remove('active'));el.classList.add('active')}
function setupProductZoom(){const frame=$('.quick-main-image'),img=$('#quickImage');if(!frame||!img)return;frame.onmousemove=e=>{const r=frame.getBoundingClientRect(),x=((e.clientX-r.left)/r.width)*100,y=((e.clientY-r.top)/r.height)*100;img.style.transformOrigin=`${x}% ${y}%`;frame.classList.add('zooming')};frame.onmouseleave=()=>{frame.classList.remove('zooming');img.style.transformOrigin='50% 50%'};frame.onclick=e=>{if(matchMedia('(hover: none)').matches){const r=frame.getBoundingClientRect(),x=((e.clientX-r.left)/r.width)*100,y=((e.clientY-r.top)/r.height)*100;img.style.transformOrigin=`${x}% ${y}%`;frame.classList.toggle('zooming')}}}
function changeQuickQty(delta){const p=state.products.find(x=>x.id===currentQuickId);quickQty=Math.max(1,Math.min(p?.stock||1,quickQty+delta));$('#quickQty').textContent=quickQty}
function quickAdd(){addToCart(currentQuickId,quickColor,quickSize,quickQty);closeModal('quickModal')}
function toggleFavorite(id){state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];localStorage.setItem('sadi_favorites',JSON.stringify(state.favorites));renderStore();renderFeatured();renderSale();renderAccount()}
function openCheckout(){if(!state.cart.length)return showToast('Agrega al menos un producto.');closeOverlays();const p=state.profile;$('#checkoutName').value=p.name||'';$('#checkoutPhone').value=p.phone||'';if($('#checkoutDni'))$('#checkoutDni').value=p.dni||'';$('#checkoutDelivery').value='pickup';renderCheckout();applyDeliveryMode();openModal('checkoutModal')}
function applyDeliveryMode(){
 const delivery=$('#checkoutDelivery')?.value||'pickup',cfg=getShippingConfig(),city=$('#checkoutCity'),address=$('#checkoutAddress');
 const cityLabel=$('#checkoutCityLabel'),addressLabel=$('#checkoutAddressLabel'),notice=$('#pickupNotice'),summary=$('#checkoutPickupSummary');
 if(delivery==='pickup'){
  if(cityLabel)cityLabel.innerHTML='<i class="fa-solid fa-location-dot"></i> Ciudad de recojo';
  if(addressLabel)addressLabel.innerHTML='<i class="fa-solid fa-map-location-dot"></i> Dirección de recojo';
  if(city){city.value=cfg.pickupCity||'La Victoria';city.readOnly=true;city.placeholder='';}
  if(address){address.value=cfg.pickupAddress||state.settings.address||'Dirección pendiente de configurar';address.readOnly=true;address.placeholder='';}
  if(summary)summary.textContent=(cfg.pickupAddress||state.settings.address||'Dirección pendiente')+' · '+(cfg.pickupCity||'La Victoria');
  if(notice)notice.classList.remove('hidden');
 }else{
  if(cityLabel)cityLabel.innerHTML='<i class="fa-solid fa-location-dot"></i> Ciudad / distrito de entrega';
  if(addressLabel)addressLabel.innerHTML='<i class="fa-solid fa-map-location-dot"></i> Dirección exacta';
  if(city){city.value=state.profile.city||'';city.readOnly=false;city.placeholder='Ejemplo: Lima, Cusco, La Victoria';}
  if(address){address.value=state.profile.address||'';address.readOnly=false;address.placeholder='Calle, número, urbanización y referencia';}
  if(notice)notice.classList.add('hidden');
 }
}
function renderCheckout(){const list=cartDetails();if($('#checkoutProducts'))$('#checkoutProducts').innerHTML=list.map(x=>`<div class="checkout-product"><img src="${esc(x.product.image)}"><div><h5>${esc(x.product.name)}</h5><small>${esc(x.color)} · ${esc(x.size)} · Cant. ${x.qty}</small></div><b>${money(x.product.price*x.qty)}</b></div>`).join('');updateCheckout()}
function calcCheckout(){const subtotal=cartSubtotal(),shipping=0,discount=state.coupon?subtotal*(Number(state.coupon.discount)/100):0;return{subtotal,shipping,discount,total:Math.max(0,subtotal-discount)}}
function updateCheckout(){const c=calcCheckout();if($('#checkoutSubtotal'))$('#checkoutSubtotal').textContent=money(c.subtotal);if($('#checkoutShipping'))$('#checkoutShipping').textContent=c.shipping?money(c.shipping):'Gratis';if($('#checkoutDiscount'))$('#checkoutDiscount').textContent='- '+money(c.discount);if($('#checkoutTotal'))$('#checkoutTotal').textContent=money(c.total)}
function selectPayment(name,el){state.payment=name;$$('.pay-card').forEach(x=>x.classList.remove('active'));el.classList.add('active');$('#qrWrap').classList.toggle('hidden',name==='WhatsApp');if(name!=='WhatsApp')makeQrCodes()}
function makeQrCodes(){const y=$('#yapeQr'),p=$('#plinQr');if(y&&!y.getAttribute('src'))y.alt='Yape pendiente de configurar';if(p&&!p.getAttribute('src'))p.alt='Plin pendiente de configurar'}
function applyCoupon(){const code=($('#couponInput').value||'').trim().toUpperCase(),now=new Date();const promo=state.promotions.find(p=>p.active!==false&&String(p.code).toUpperCase()===code&&(!p.start||new Date(p.start)<=now)&&(!p.end||new Date(p.end+'T23:59:59')>=now));if(!promo){state.coupon=null;updateCheckout();return showToast('Cupón inválido o vencido.')}state.coupon=promo;updateCheckout();showToast('Cupón aplicado: '+promo.discount+'% de descuento')}
let finishingOrder=false;
const PENDING_ORDER_KEY='sadi_pending_orders';
function getPendingOrders(){
 try{return JSON.parse(localStorage.getItem(PENDING_ORDER_KEY)||'[]')}catch{return []}
}
function queuePendingOrder(order){
 const list=getPendingOrders().filter(x=>x.id!==order.id);
 list.unshift(order);
 localStorage.setItem(PENDING_ORDER_KEY,JSON.stringify(list.slice(0,30)));
}
function removePendingOrder(id){
 localStorage.setItem(PENDING_ORDER_KEY,JSON.stringify(getPendingOrders().filter(x=>x.id!==id)));
}
async function saveOrderInBackground(order){
 try{
  await Promise.race([
   putRecord('orders',order,{requireFirebase:true}),
   new Promise((_,reject)=>setTimeout(()=>reject(new Error('Tiempo de registro agotado')),10000))
  ]);
  removePendingOrder(order.id);
  setSyncLabel(true);
  return true;
 }catch(error){
  console.error('Pedido pendiente de sincronización:',order.id,error);
  setSyncLabel(false);
  return false;
 }
}
async function retryPendingOrders(){
 const pending=getPendingOrders();
 if(!pending.length||!window._firebaseReady)return;
 for(const order of pending){
  const saved=await saveOrderInBackground(order);
  if(!saved)break;
 }
}
function buildWhatsAppUrl(message){
 const number=normalizePhone(state.settings.whatsapp);
 return 'https://wa.me/'+encodeURIComponent(number)+'?text='+encodeURIComponent(message);
}
function clearCheckoutFieldError(input){
 if(!input)return;
 const field=input.closest('.client-field');
 if(!field)return;
 field.classList.remove('has-error');
 input.removeAttribute('aria-invalid');
 const error=field.querySelector('.client-field-error');
 if(error)error.remove();
}
function setCheckoutFieldError(input,message){
 if(!input)return;
 const field=input.closest('.client-field');
 if(!field)return;
 clearCheckoutFieldError(input);
 field.classList.add('has-error');
 input.setAttribute('aria-invalid','true');
 const error=document.createElement('div');
 error.className='client-field-error';
 error.setAttribute('role','alert');
 error.innerHTML='<i class="fa-solid fa-circle-exclamation"></i><span>'+esc(message)+'</span>';
 field.appendChild(error);
}
function clearCheckoutErrors(){
 document.querySelectorAll('#checkoutModal .client-field.has-error').forEach(field=>{
  field.classList.remove('has-error');
  const input=field.querySelector('.field,.select');
  if(input)input.removeAttribute('aria-invalid');
  field.querySelectorAll('.client-field-error').forEach(error=>error.remove());
 });
 const summary=document.getElementById('checkoutValidationSummary');
 if(summary)summary.remove();
}
function showCheckoutValidationSummary(firstInvalid){
 const card=document.querySelector('#checkoutModal .client-data-card');
 if(!card)return;
 let summary=document.getElementById('checkoutValidationSummary');
 if(!summary){
  summary=document.createElement('div');
  summary.id='checkoutValidationSummary';
  summary.className='checkout-validation-summary';
  summary.setAttribute('role','alert');
  summary.innerHTML='<i class="fa-solid fa-triangle-exclamation"></i><span>Revisa los campos marcados en rojo antes de continuar.</span>';
  card.appendChild(summary);
 }
 if(firstInvalid){
  firstInvalid.scrollIntoView({behavior:'smooth',block:'center'});
  window.setTimeout(()=>firstInvalid.focus({preventScroll:true}),280);
 }
}
function validateCheckoutCustomer(){
 clearCheckoutErrors();
 const nameInput=$('#checkoutName'),dniInput=$('#checkoutDni'),phoneInput=$('#checkoutPhone'),deliveryInput=$('#checkoutDelivery'),cityInput=$('#checkoutCity'),addressInput=$('#checkoutAddress');
 const delivery=deliveryInput?.value||'pickup';
 const checks=[];
 const name=nameInput?.value.trim()||'';
 const dni=(dniInput?.value||'').replace(/\D/g,'');
 const phone=(phoneInput?.value||'').replace(/\D/g,'');
 const city=cityInput?.value.trim()||'';
 const address=addressInput?.value.trim()||'';
 if(name.length<3)checks.push([nameInput,'Ingresa tu nombre completo (mínimo 3 letras).']);
 if(!/^\d{8}$/.test(dni))checks.push([dniInput,'El DNI debe tener exactamente 8 dígitos.']);
 if(phone.length<9)checks.push([phoneInput,'Ingresa un celular válido de al menos 9 dígitos.']);
 if(delivery==='delivery'&&!city)checks.push([cityInput,'Indica la ciudad o distrito de entrega.']);
 if(delivery==='delivery'&&!address)checks.push([addressInput,'Escribe la dirección exacta para el envío.']);
 checks.forEach(([input,message])=>setCheckoutFieldError(input,message));
 if(checks.length){showCheckoutValidationSummary(checks[0][0]);return false;}
 return true;
}
document.addEventListener('input',function(event){
 if(event.target?.matches('#checkoutModal .client-field .field'))clearCheckoutFieldError(event.target);
});
document.addEventListener('change',function(event){
 if(event.target?.matches('#checkoutModal .client-field .select')){clearCheckoutFieldError(event.target);if(event.target.id==='checkoutDelivery')clearCheckoutErrors();}
});
async function finishOrder(){
 if(finishingOrder)return;
 if(!validateCheckoutCustomer())return;

 const name=$('#checkoutName')?.value.trim()||'';
 const dni=($('#checkoutDni')?.value||'').replace(/\D/g,'');
 const phone=$('#checkoutPhone')?.value.trim()||'';
 const delivery=$('#checkoutDelivery')?.value||'pickup';
 const cfg=getShippingConfig();
 const reference=$('#checkoutReference')?.value.trim()||'';
 const address=delivery==='pickup'
  ? (cfg.pickupAddress||state.settings.address||'Dirección pendiente')
  : ($('#checkoutAddress')?.value.trim()||'');
 const city=delivery==='pickup'
  ? (cfg.pickupCity||'La Victoria')
  : ($('#checkoutCity')?.value.trim()||'');

 const items=cartDetails().map(x=>({
  productId:x.productId,
  name:x.product.name,
  sku:x.product.sku,
  color:x.color,
  size:x.size,
  qty:x.qty,
  price:Number(x.product.price||0),
  subtotal:Number(x.product.price||0)*Number(x.qty||0),
  image:x.product.image
 }));
 if(!items.length)return showToast('El carrito está vacío.');

 const c=calcCheckout();
 const orderId='SADI-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
 const now=new Date().toISOString();
 const order={
  id:orderId,
  orderCode:orderId,
  source:'SADI Catalogo web',
  channel:'WhatsApp',
  currency:'PEN',
  client:{
   name,dni,phone,
   email:state.profile.email||'',
   address,city,reference,
   deliveryMode:delivery
  },
  items,
  itemCount:items.reduce((sum,item)=>sum+Number(item.qty||0),0),
  payment:state.payment||'WhatsApp',
  paymentStatus:'Pendiente',
  delivery:delivery==='pickup'?'Recojo en tienda':'Envío a domicilio',
  shipping:Number(c.shipping||0),
  shippingCost:Number(c.shipping||0),
  subtotal:Number(c.subtotal||0),
  discount:Number(c.discount||0),
  total:Number(c.total||0),
  status:'Pendiente',
  saleStatus:'Pendiente',
  createdAt:now,
  updatedAt:now,
  coupon:state.coupon?.code||'',
  couponCode:state.coupon?.code||'',
  trafficSource:(window.royGetAttribution?.().source||'directo'),
  originChannel:(window.royGetAttribution?.().originChannel||'tienda'),
  purchaseChannel:'tienda',
  customerJourney:(window.royGetAttribution?.().originChannel==='catalogo'?'QR/Catálogo > Tienda > Compra':'Tienda directa > Compra')
 };

 const msg=buildWhatsAppOrder(order);
 const whatsappUrl=buildWhatsAppUrl(msg);
 finishingOrder=true;
 const button=document.querySelector('#checkoutModal .checkout-side .btn-primary');
 const originalButtonHtml=button?.innerHTML||'';
 if(button){
  button.disabled=true;
  button.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> ABRIENDO WHATSAPP...';
 }

 // Guarda una copia local antes de abrir WhatsApp. Si la red falla,
 // el sistema reintentará automáticamente al volver a cargar la tienda.
 queuePendingOrder(order);

 // Abre WhatsApp directamente desde el clic, sin esperar a Firebase
 // y sin crear primero una pestaña about:blank.
 let whatsappOpened=false;
 try{
  const link=document.createElement('a');
  link.href=whatsappUrl;
  link.target='_blank';
  link.rel='noopener noreferrer';
  link.style.display='none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  whatsappOpened=true;
 }catch(error){
  console.warn('No se pudo abrir WhatsApp en una nueva pestaña:',error);
 }

 // El pedido aparece de inmediato en el estado local y en las secciones
 // Pedidos, Clientes y Ventas del panel cuando se sincroniza Firebase.
 if(!state.orders.some(x=>x.id===order.id))state.orders.unshift(order);
 saveLocal('orders',state.orders);
 renderAllAdmin();

 // Guarda en Firebase en segundo plano. No retrasa WhatsApp.
 saveOrderInBackground(order);

 state.profile={
  ...state.profile,
  name,dni,phone,
  address:delivery==='delivery'?address:state.profile.address||'',
  city:delivery==='delivery'?city:state.profile.city||''
 };
 localStorage.setItem('sadi_profile',JSON.stringify(state.profile));

 // Se limpia únicamente después de haber dejado el pedido en la cola segura.
 state.cart=[];
 persistCart();
 closeModal('checkoutModal');
 renderEverything();
 showToast('Pedido enviado. Se registrará automáticamente en el panel.');

 if(!whatsappOpened){
  window.setTimeout(()=>{window.location.href=whatsappUrl;},50);
 }

 finishingOrder=false;
 if(button){
  button.disabled=false;
  button.innerHTML=originalButtonHtml||'<i class="fa-brands fa-whatsapp"></i> FINALIZAR COMPRA POR WHATSAPP';
 }
}
function buildWhatsAppOrder(o){return `Hola SADI PERÚ 👋 Quiero confirmar mi pedido ${o.id}\n\nCliente: ${o.client.name}\nDNI: ${o.client.dni||'No indicado'}\nWhatsApp: ${o.client.phone}\nEntrega: ${o.delivery}\nDirección: ${o.client.address||'Recojo en tienda'} ${o.client.city||''}\nPago: ${o.payment}\n\n${o.items.map(i=>`• ${i.name} | ${i.color} | Talla ${i.size} | x${i.qty} = ${money(i.subtotal)}`).join('\n')}\n\nEnvío: ${money(o.shipping)}\nDescuento: ${money(o.discount)}\nTOTAL: ${money(o.total)}\n\n${o.payment==='WhatsApp'?'Deseo coordinar el pago.':'Adjuntaré mi comprobante de '+o.payment+'.'}`}
function normalizePhone(v){let s=String(v||'').replace(/\D/g,'');if(s.length===9)s='51'+s;return s||'51961400679'}
function openWhatsApp(){window.open('https://wa.me/'+normalizePhone(state.settings.whatsapp)+'?text='+encodeURIComponent('Hola SADI PERÚ, deseo información sobre sus prendas.'),'_blank')}
function openSocial(network){const raw=state.settings?.[network]||'';const defaults={facebook:'https://www.facebook.com/',instagram:'https://www.instagram.com/',tiktok:'https://www.tiktok.com/'};let url=String(raw).trim()||defaults[network];if(!/^https?:\/\//i.test(url))url='https://'+url.replace(/^@/,'');window.open(url,'_blank','noopener,noreferrer')}
function openSupport(section='help'){
 const name=state.settings.storeName||'SADI PERÚ';
 const data={
  help:{title:'Centro de ayuda',intro:'Resuelve rápidamente tus dudas antes o después de comprar.',body:`<div class="support-grid"><button class="support-card" onclick="openSupport('sizes')"><i class="fa-solid fa-ruler"></i><b>Guía de tallas</b><span>Equivalencias y recomendaciones.</span></button><button class="support-card" onclick="openSupport('changes')"><i class="fa-solid fa-rotate-left"></i><b>Cambios</b><span>Condiciones y plazo de atención.</span></button><button class="support-card" onclick="openSupport('privacy')"><i class="fa-solid fa-shield-halved"></i><b>Privacidad</b><span>Uso y protección de tus datos.</span></button><button class="support-card" onclick="openSupport('claims')"><i class="fa-regular fa-clipboard"></i><b>Reclamaciones</b><span>Canal formal de atención.</span></button></div>`},
  sizes:{title:'Guía de tallas',intro:'Selecciona tu talla según el tipo de prenda.',body:`<div class="legal-section"><h3>Prendas superiores</h3><p>Polos, hoodies, casacas y chalecos usan tallas alfabéticas: XS, S, M, L, XL y XXL. Revisa el ajuste indicado en cada producto.</p><div class="size-table"><span>XS</span><span>S</span><span>M</span><span>L</span><span>XL</span><span>XXL</span><b>26</b><b>28</b><b>30</b><b>32</b><b>34</b><b>36</b></div><h3>Pantalones, jeans y cargos</h3><p>La equivalencia referencial es XS=26, S=28, M=30, L=32, XL=34 y XXL=36. Para mayor precisión, compara cintura y largo con una prenda que te quede bien.</p></div>`},
  changes:{title:'Cambios y devoluciones',intro:'Queremos que tu compra te quede bien.',body:`<div class="legal-section"><h3>Condiciones</h3><ul><li>Solicita el cambio dentro de los 7 días posteriores a la entrega.</li><li>La prenda debe conservar etiquetas, empaque y no presentar señales de uso.</li><li>Los costos de traslado pueden variar según ciudad y motivo del cambio.</li><li>La disponibilidad de otra talla o modelo se confirma al atender la solicitud.</li></ul><p>${esc(state.settings.policies||'Coordina cualquier cambio directamente con nuestro equipo.')}</p></div>`},
  privacy:{title:'Política de privacidad',intro:'Tus datos se usan únicamente para brindarte el servicio.',body:`<div class="legal-section"><h3>Uso de la información</h3><ul><li>Procesar y enviar pedidos.</li><li>Contactarte sobre el estado de tu compra.</li><li>Enviar promociones solo cuando lo autorices.</li><li>Mejorar la experiencia de navegación.</li></ul><h3>Protección</h3><p>${name} no comparte información personal con terceros con fines publicitarios. Puedes solicitar la actualización o eliminación de tus datos mediante nuestros canales de atención.</p></div>`},
  terms:{title:'Términos y condiciones',intro:'Reglas básicas para una compra transparente.',body:`<div class="legal-section"><ul><li>Los precios pueden cambiar sin previo aviso.</li><li>El stock se confirma al procesar el pedido.</li><li>La compra se considera confirmada después de validar disponibilidad y pago.</li><li>El contenido, fotografías y logotipo pertenecen a ${name}.</li></ul><p>${esc(state.settings.terms||'Los pedidos se confirman al validar disponibilidad y pago.')}</p></div>`},
  claims:{title:'Libro de reclamaciones',intro:'Registra una queja o reclamo para recibir atención formal.',body:`<form class="form-grid" onsubmit="submitClaim(event)"><div class="form-group"><label>Nombre completo</label><input class="field" id="claimName" required></div><div class="form-group"><label>Documento</label><input class="field" id="claimDocument" required></div><div class="form-group"><label>WhatsApp</label><input class="field" id="claimPhone" required></div><div class="form-group"><label>Pedido, si aplica</label><input class="field" id="claimOrder"></div><div class="form-group full"><label>Tipo</label><select class="select" id="claimType"><option>Reclamo</option><option>Queja</option></select></div><div class="form-group full"><label>Detalle</label><textarea class="textarea" id="claimDetail" required></textarea></div><div class="form-group full"><button class="btn btn-primary" type="submit">Registrar solicitud</button></div></form>`}
 };
 const item=data[section]||data.help;$('#supportTitle').innerHTML=esc(item.title)+' <span>'+esc(name)+'</span>';$('#supportIntro').textContent=item.intro;$('#supportBody').innerHTML=item.body;openModal('supportModal');
}
async function submitClaim(e){e.preventDefault();const claim={id:uid('claim'),name:$('#claimName').value.trim(),document:$('#claimDocument').value.trim(),phone:$('#claimPhone').value.trim(),order:$('#claimOrder').value.trim(),type:$('#claimType').value,detail:$('#claimDetail').value.trim(),status:'Nuevo',createdAt:new Date().toISOString()};await putRecord('messages',{...claim,message:`${claim.type}: ${claim.detail}`,email:''});state.messages.unshift({...claim,message:`${claim.type}: ${claim.detail}`,email:''});closeModal('supportModal');showToast('Solicitud registrada. Nuestro equipo se comunicará contigo.');}
async function sendContact(e){e.preventDefault();const msg={id:uid('msg'),name:$('#contactName').value.trim(),phone:$('#contactPhone').value.trim(),email:$('#contactEmail').value.trim(),message:$('#contactMessage').value.trim(),status:'Nuevo',createdAt:new Date().toISOString()};await putRecord('messages',msg);state.messages.unshift(msg);e.target.reset();showToast('Consulta enviada. Te responderemos pronto.')}
function subscribeDrop(){const email=$('#soonEmail').value.trim();if(!email||!email.includes('@'))return showToast('Ingresa un correo válido.');putRecord('messages',{id:uid('sub'),name:'Suscripción Next Drop',phone:'',email,message:'Solicitud de aviso para próximo lanzamiento',status:'Nuevo',createdAt:new Date().toISOString()});showToast('Te avisaremos antes del próximo drop.');$('#soonEmail').value=''}
function openProfileEdit(){const p=state.profile;$('#profileName').value=p.name||'';$('#profilePhone').value=p.phone||'';$('#profileEmail').value=p.email||'';$('#profileAddress').value=p.address||'';openModal('profileModal')}
function saveProfile(){state.profile={name:$('#profileName').value.trim(),phone:$('#profilePhone').value.trim(),email:$('#profileEmail').value.trim(),address:$('#profileAddress').value.trim()};localStorage.setItem('sadi_profile',JSON.stringify(state.profile));closeModal('profileModal');renderAccount();showToast('Perfil guardado en este dispositivo.')}
function renderAccount(){const p=state.profile;if($('#accountNameView'))$('#accountNameView').textContent=p.name||'Cliente SADI';if($('#accountPhoneView'))$('#accountPhoneView').textContent=p.phone||'Completa tus datos para guardar tus pedidos.';if($('#accountAvatar'))$('#accountAvatar').textContent=(p.name||'J').charAt(0).toUpperCase();const orders=state.orders.filter(o=>!p.phone||o.client?.phone===p.phone);if($('#accountOrders'))$('#accountOrders').innerHTML=orders.length?orders.map(o=>`<article class="order-card"><div class="order-top"><div><b>${esc(o.id)}</b><div class="muted" style="font-size:9px;margin-top:3px">${dateText(o.createdAt)} · ${o.items.length} producto(s)</div></div><span class="status ${String(o.status).toLowerCase().replaceAll(' ','')}">${esc(o.status)}</span></div><div style="display:flex;justify-content:space-between;font-size:11px"><span>${esc(o.payment)} · ${esc(o.delivery)}</span><b class="orange">${money(o.total)}</b></div></article>`).join(''):'<div class="empty">Aún no tienes pedidos guardados en este dispositivo.</div>';const favs=state.products.filter(x=>state.favorites.includes(x.id));if($('#accountFavorites'))$('#accountFavorites').innerHTML=favs.length?`<div class="product-grid">${favs.map(productCard).join('')}</div>`:'<div class="empty">Tu lista de favoritos está vacía.</div>';if($('#accountAddresses'))$('#accountAddresses').innerHTML=p.address?`<div class="order-card"><b>Dirección principal</b><p class="muted" style="font-size:11px;margin-top:8px">${esc(p.address)}</p></div>`:'<div class="empty">Aún no registraste una dirección.</div>'}
function accountTab(name,btn){$$('.account-content .tab').forEach(x=>x.classList.remove('active'));btn.classList.add('active');['Orders','Favorites','Addresses'].forEach(x=>$('#account'+x).classList.add('hidden'));$('#account'+name.charAt(0).toUpperCase()+name.slice(1)).classList.remove('hidden')}
const brandTextOriginals=new WeakMap();
function applyBrandText(name){
 const root=document.body;if(!root)return;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){const p=node.parentElement;if(!p||['SCRIPT','STYLE','TEXTAREA','OPTION'].includes(p.tagName))return NodeFilter.FILTER_REJECT;return /\bROY\b/.test(node.nodeValue||'')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT}});
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 nodes.forEach(node=>{if(!brandTextOriginals.has(node))brandTextOriginals.set(node,node.nodeValue);node.nodeValue=brandTextOriginals.get(node).replace(/\bROY\b/g,name)});
}
function normalizeLuxuryPrimary(value){
 const v=String(value||'').trim().toLowerCase();
 const legacy=['#a8ff00','#8cff00','#84ff00','#95ff00','#9cff00','#72d900','#8ee600','#b7ff28'];
 return !v||legacy.includes(v)?'#D4AF37':value;
}
function applySettings(){
 const s=state.settings,name=(s.storeName||'SADI PERÚ').trim()||'SADI PERÚ';
 const primary=normalizeLuxuryPrimary(s.primaryColor),secondary=s.secondaryColor||'#FFFFFF',background=s.backgroundColor||'#050505',text=s.textColor||'#FFFFFF';
 const root=document.documentElement;
 root.style.setProperty('--brand-primary',primary);root.style.setProperty('--brand-secondary',secondary);root.style.setProperty('--brand-bg',background);root.style.setProperty('--brand-text',text);
 root.style.setProperty('--orange',primary);root.style.setProperty('--green',primary);root.style.setProperty('--white',text);root.style.setProperty('--bg',background);
 document.body.style.backgroundColor=background;document.body.style.color=text;
 const theme=document.querySelector('meta[name="theme-color"]');if(theme)theme.setAttribute('content',primary);
 $$('.logo-word').forEach(x=>{const admin=!!x.closest('#adminLogin,#adminApp');x.textContent=admin?name+' ADMIN':name});
 $$('.logo-mark').forEach(mark=>{if(s.logo){const official=String(s.logo).includes('logo-sadi-peru.png');const displayLogo=official?OFFICIAL_SADI_MARK:s.logo;mark.classList.add('has-image');mark.innerHTML='<img src="'+esc(displayLogo)+'" alt="Logo '+esc(name)+'">'}else{mark.classList.remove('has-image');mark.textContent=(name.replace(/[^A-Za-z0-9]/g,'').slice(0,2)||'S').toUpperCase()}});
 applyBrandText(name);document.title=name+' | Tienda Oficial';
 $('#publicAddress')&&($('#publicAddress').textContent=s.address);$('#publicHours')&&($('#publicHours').textContent=s.hours);$('#publicPhone')&&($('#publicPhone').textContent='+'+normalizePhone(s.whatsapp));$('#publicEmail')&&($('#publicEmail').textContent=s.email);
 renderHeroSlider();
}

function mediaEmbed(url){
 const raw=String(url||'').trim();if(!raw)return{type:'invalid',src:'',platform:''};
 if(raw.startsWith('data:video/'))return{type:'video',src:raw,platform:'archivo'};
 try{
  const u=new URL(raw,location.href),host=u.hostname.replace(/^www\./,'').toLowerCase(),parts=u.pathname.split('/').filter(Boolean);
  if(host==='youtu.be'){const id=parts[0];return id?{type:'iframe',src:'https://www.youtube.com/embed/'+id,platform:'youtube'}:{type:'invalid',src:'',platform:''}}
  if(host.includes('youtube.com')){let id=u.searchParams.get('v');if(!id&&u.pathname.includes('/shorts/'))id=u.pathname.split('/shorts/')[1]?.split('/')[0];if(!id&&u.pathname.includes('/embed/'))id=u.pathname.split('/embed/')[1]?.split('/')[0];return id?{type:'iframe',src:'https://www.youtube.com/embed/'+id,platform:'youtube'}:{type:'invalid',src:'',platform:''}}
  if(host.includes('vimeo.com')){const id=parts.find(x=>/^\d+$/.test(x));return id?{type:'iframe',src:'https://player.vimeo.com/video/'+id,platform:'vimeo'}:{type:'invalid',src:'',platform:''}}
  if(host.includes('tiktok.com')){const match=u.pathname.match(/\/video\/(\d+)/);return match?{type:'iframe',src:'https://www.tiktok.com/player/v1/'+match[1]+'?autoplay=0&loop=0',platform:'tiktok'}:{type:'external',src:raw,platform:'tiktok'}}
  if(host.includes('instagram.com')){const match=u.pathname.match(/\/(reel|reels|p|tv)\/([^/?#]+)/);return match?{type:'iframe',src:'https://www.instagram.com/'+match[1]+'/'+match[2]+'/embed/captioned/',platform:'instagram'}:{type:'external',src:raw,platform:'instagram'}}
  if(host.includes('facebook.com')||host.includes('fb.watch')){return{type:'iframe',src:'https://www.facebook.com/plugins/video.php?href='+encodeURIComponent(raw)+'&show_text=false&width=560',platform:'facebook'}}
  if(/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(raw))return{type:'video',src:raw,platform:'directo'};
  return{type:'external',src:raw,platform:'enlace'};
 }catch{return{type:'invalid',src:'',platform:''}}
}
function youtubeEmbed(url){const m=mediaEmbed(url);return m.type==='iframe'?m.src:String(url||'')}
function videoMarkup(url,title='Video'){
 const m=mediaEmbed(url);
 if(m.type==='iframe')return `<iframe class="social-embed" loading="lazy" src="${esc(m.src)}" title="${esc(title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
 if(m.type==='video')return `<video controls playsinline preload="metadata" src="${esc(m.src)}" onerror="this.outerHTML='<div class=&quot;media-error&quot;>No se pudo reproducir el archivo. Verifica el formato o vuelve a subirlo.</div>'"></video>`;
 if(m.type==='external')return `<div class="media-error"><p>Esta plataforma no permite incrustar este enlace directamente.</p><a class="btn btn-secondary btn-sm" href="${esc(m.src)}" target="_blank" rel="noopener">Abrir publicación</a></div>`;
 return '<div class="media-error">Enlace de video no válido.</div>'
}
function renderGallery(){const imgs=state.media.filter(x=>x.active!==false&&x.type==='image');const vids=state.media.filter(x=>x.active!==false&&x.type==='video');const fallback=[['City essentials','https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=700&q=85'],['Bold energy','https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=700&q=85'],['Street neutral','https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=700&q=85']];$('#lookbookImages').innerHTML=(imgs.length?imgs:fallback.map((x,i)=>({id:'f'+i,title:x[0],url:x[1]}))).map(x=>`<figure><img src="${esc(x.url)}" alt="${esc(x.title)}"><figcaption>${esc(x.title)}</figcaption></figure>`).join('');$('#galleryVideos').innerHTML=vids.map(v=>`<article>${videoMarkup(v.url,v.title)}<div class="caption">${esc(v.title)}</div></article>`).join('')}
function renderAdminMedia(){const box=$('#adminMediaGrid');if(!box)return;const q=($('#mediaSearch')?.value||'').toLowerCase(),type=$('#mediaTypeFilter')?.value||'';const list=state.media.filter(x=>(!q||[x.title,x.description,x.type].join(' ').toLowerCase().includes(q))&&(!type||x.type===type));box.innerHTML=list.length?list.map(m=>`<article class="media-card"><div class="media-preview">${m.type==='image'?`<img src="${esc(m.url)}">`:videoMarkup(m.url,m.title)}</div><div class="media-body"><h4>${esc(m.title)}</h4><p class="muted" style="font-size:10px;min-height:30px">${esc(m.description||'')}</p><div class="action-row" style="margin-top:10px"><button class="btn btn-secondary btn-sm" onclick="editMedia('${m.id}')">Editar</button><button class="btn btn-secondary btn-sm" onclick="toggleMedia('${m.id}')">${m.active===false?'Publicar':'Ocultar'}</button><button class="btn btn-danger btn-sm" onclick="deleteMedia('${m.id}')">Eliminar</button></div></div></article>`).join(''):'<div class="empty" style="grid-column:1/-1">No hay contenido multimedia.</div>'}
function openMediaForm(){['mediaId','mediaTitle','mediaUrl','mediaDescription'].forEach(id=>$('#'+id).value='');$('#mediaType').value='image';$('#mediaActive').checked=true;delete $('#mediaFile').dataset.data;delete $('#mediaFile').dataset.kind;$('#mediaFile').value='';$('#mediaFileName').textContent='';$('#mediaFormTitle').innerHTML='Nuevo <span>contenido</span>';toggleMediaFields();openModal('mediaModal')}
function editMedia(id){const m=state.media.find(x=>x.id===id);if(!m)return;$('#mediaId').value=m.id;$('#mediaType').value=m.type;$('#mediaTitle').value=m.title;$('#mediaUrl').value=m.url;$('#mediaDescription').value=m.description||'';$('#mediaActive').checked=m.active!==false;delete $('#mediaFile').dataset.data;delete $('#mediaFile').dataset.kind;$('#mediaFile').value='';$('#mediaFileName').textContent='';$('#mediaFormTitle').innerHTML='Editar <span>contenido</span>';toggleMediaFields();openModal('mediaModal')}
function toggleMediaFields(){const video=$('#mediaType').value==='video',input=$('#mediaFile'),group=$('#mediaFileGroup');group.classList.toggle('hidden',video);input.accept='image/*';$('#mediaFileLabel').textContent='O subir archivo de imagen';$('#mediaUploadHelp').textContent=video?'En el plan gratuito pega un enlace público; el video se reproducirá dentro de la tienda.':'La imagen se comprime y guarda directamente en Firestore.'}
async function readFileData(file){return await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}
async function compressMediaImage(file,maxBytes=650000){
 const data=await readFileData(file);const img=await new Promise((resolve,reject)=>{const x=new Image();x.onload=()=>resolve(x);x.onerror=reject;x.src=data});
 let max=1100,quality=.72,result='';
 for(let pass=0;pass<7;pass++){
  const ratio=Math.min(1,max/img.width,max/img.height),w=Math.max(1,Math.round(img.width*ratio)),h=Math.max(1,Math.round(img.height*ratio));
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;canvas.getContext('2d',{alpha:false}).drawImage(img,0,0,w,h);
  result=canvas.toDataURL('image/jpeg',quality);
  const bytes=Math.ceil((result.length-result.indexOf(',')-1)*.75);
  if(bytes<=maxBytes)return result;
  if(quality>.46)quality-=.08;else max=Math.round(max*.82);
 }
 throw new Error('La imagen sigue siendo demasiado pesada. Prueba con otra fotografía.');
}
async function handleMediaFile(input){
 const f=input.files?.[0];if(!f)return;const video=$('#mediaType').value==='video';
 if(video){input.value='';delete input.dataset.data;$('#mediaFileName').textContent='En el plan gratuito, agrega el enlace público del video.';return showToast('Para videos usa un enlace público. La imagen sí puede subirse directamente.');}
 if(!f.type.startsWith('image/'))return showToast('Selecciona una imagen válida.');
 $('#mediaFileName').textContent=f.name+' · optimizando...';
 try{input.dataset.kind='image';input.dataset.data=await compressMediaImage(f);const kb=Math.round(input.dataset.data.length*.75/1024);$('#mediaFileName').textContent=f.name+' · '+kb+' KB optimizada';$('#mediaUrl').value=''}catch(e){input.value='';delete input.dataset.data;$('#mediaFileName').textContent='';showToast(e.message||'No se pudo procesar la imagen.')}
}
async function uploadMediaFile(id){
 // V24: no intenta Firebase Storage. El proyecto gratuito guarda imágenes optimizadas en Firestore.
 const input=$('#mediaFile');return input?.dataset.data||'';
}
async function saveMedia(){
 const id=$('#mediaId').value||uid('media'),type=$('#mediaType').value,title=$('#mediaTitle').value.trim();
 if(!title)throw new Error('Escribe un título.');
 let url=$('#mediaUrl').value.trim();const uploaded=await uploadMediaFile(id);if(uploaded)url=uploaded;
 if(!url)throw new Error(type==='video'?'Agrega el enlace público del video.':'Selecciona una imagen o agrega una URL.');
 if(type==='video'&&mediaEmbed(url).type==='invalid')throw new Error('Enlace inválido. Usa YouTube, TikTok, Instagram, Facebook o Vimeo.');
 if(type==='image'&&url.startsWith('data:')&&url.length>900000)throw new Error('La imagen supera el límite de Firestore incluso después de optimizarse.');
 const old=state.media.find(x=>x.id===id)||{},m={...old,id,type,title,url,description:$('#mediaDescription').value.trim(),active:$('#mediaActive').checked,updatedAt:new Date().toISOString(),createdAt:old.createdAt||new Date().toISOString()};
 const timeout=(promise,ms=15000)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Firebase tardó demasiado. Revisa tu conexión.')),ms))]);
 await timeout(putRecord('media',m,{requireFirebase:true}));
 const i=state.media.findIndex(x=>x.id===id);if(i>=0)state.media[i]=m;else state.media.unshift(m);saveLocal('media',state.media);
 closeModal('mediaModal');renderGallery();renderAdminMedia();showToast(old.id?'Contenido actualizado correctamente.':'Contenido guardado correctamente.');
}
async function toggleMedia(id){const m=state.media.find(x=>x.id===id);if(!m)return;m.active=m.active===false;await putRecord('media',m);renderGallery();renderAdminMedia()}
async function deleteMedia(id){if(!confirm('¿Eliminar este contenido?'))return;await removeRecord('media',id);state.media=state.media.filter(x=>x.id!==id);renderGallery();renderAdminMedia()}
/* ADMINISTRACIÓN SEGURA CON FIREBASE AUTH */
function adminSessionValid(){return !!(window._firebaseReady&&window._auth?.currentUser&&window._firebaseAdmin===true)}
async function refreshFirebaseAdminSession(){
 if(!window._firebaseReady||!window._auth?.currentUser){window._firebaseAdmin=false;return false}
 try{
  const snap=await window._fb.getDoc(window._fb.doc(window._db,'sadi_admins',window._auth.currentUser.uid));
  const data=snap.exists()?snap.data():null;
  window._firebaseAdmin=!!(data&&data.active===true&&data.role==='admin');
  return window._firebaseAdmin;
 }catch(e){console.warn('Validacion de administrador fallida:',e.message);window._firebaseAdmin=false;return false}
}
function firebaseAuthErrorText(error){
 const code=String(error?.code||'');
 const map={
  'auth/invalid-credential':'Correo o contraseña incorrectos.',
  'auth/invalid-email':'El correo no tiene un formato válido.',
  'auth/user-disabled':'Esta cuenta fue deshabilitada.',
  'auth/too-many-requests':'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.',
  'auth/network-request-failed':'No se pudo conectar con Firebase. Revisa tu conexión.',
  'auth/operation-not-allowed':'Activa el proveedor Correo/Contraseña en Firebase Authentication.',
  'auth/api-key-not-valid.-please-pass-a-valid-api-key.':'Firebase rechazó la API key. Si publicas en Firebase Hosting, esta versión carga automáticamente la configuración oficial del proyecto SADI PERÚ.',
  'auth/invalid-api-key':'Firebase rechazó la API key. Verifica la configuración web de SADI PERÚ.'
 };
 return map[code]||error?.message||'No se pudo iniciar sesión.';
}
function openAdminFromAccount(){
 if(!$('#page-cuenta')?.classList.contains('active')){showPage('cuenta');showToast('El acceso administrativo está disponible únicamente desde Mi cuenta.');return}
 openAdmin(true);
}
async function openAdmin(fromAccount=false){
 const accountVisible=$('#page-cuenta')?.classList.contains('active');
 if(!fromAccount&&!accountVisible){showPage('cuenta');showToast('Ingresa al administrador desde la sección Mi cuenta.');return}
 document.body.style.overflow='auto';
 $('#storeApp').classList.add('hidden');
 const valid=await refreshFirebaseAdminSession();
 if(valid)showAdminApp();else{$('#adminLogin').classList.remove('hidden');$('#adminApp').classList.add('hidden');setTimeout(()=>$('#adminUser')?.focus(),80)}
}
function closeAdmin(){$('#adminLogin').classList.add('hidden');$('#adminApp').classList.add('hidden');$('#storeApp').classList.remove('hidden');showPage('cuenta')}
async function adminLogin(){
 const err=$('#adminError'),email=$('#adminUser').value.trim(),pass=$('#adminPass').value;
 err.classList.remove('show');
 if(!window._firebaseReady||!window._auth)return showAdminLoginError('Firebase no está configurado. Sigue la guía de instalación incluida.');
 if(!email||!pass)return showAdminLoginError('Completa el correo y la contraseña.');
 try{
  await window._fb.signInWithEmailAndPassword(window._auth,email,pass);
  const allowed=await refreshFirebaseAdminSession();
  if(!allowed){await window._fb.signOut(window._auth);return showAdminLoginError('La cuenta existe, pero no tiene el rol de administrador activo.');}
  err.classList.remove('show');$('#adminPass').value='';showAdminApp();showToast('Sesión administrativa iniciada con Firebase.');
 }catch(error){showAdminLoginError(firebaseAuthErrorText(error))}
}
function showAdminLoginError(message){const err=$('#adminError');err.textContent=message;err.classList.add('show')}
async function requestPasswordReset(){
 const email=$('#adminUser').value.trim();
 if(!email)return showAdminLoginError('Escribe primero el correo administrativo.');
 if(!window._firebaseReady||!window._auth)return showAdminLoginError('Firebase Authentication no está disponible.');
 try{await window._fb.sendPasswordResetEmail(window._auth,email);showToast('Firebase envió el enlace de recuperación al correo.');}
 catch(error){showAdminLoginError(firebaseAuthErrorText(error))}
}
async function reloadProtectedAdminData(){
 if(!adminSessionValid())return;
 const names=['orders','messages','reviews','users','inventory'];
 for(const name of names){
  try{
   const snap=await window._fb.getDocs(window._fb.collection(window._db,DB_PREFIX+name));
   const rows=snap.docs.map(d=>({id:d.id,...d.data()}));
   state[name]=rows;
   saveLocal(name,rows);
  }catch(error){console.warn('No se pudo recargar '+name+':',error.message)}
 }
}
async function showAdminApp(){
 if(!adminSessionValid())return showAdminLoginError('Sesión no autorizada.');
 $('#adminLogin').classList.add('hidden');$('#adminApp').classList.remove('hidden');
 const label=$('#syncLabel');if(label)label.textContent='Cargando datos seguros...';
 await reloadProtectedAdminData();
 renderAllAdmin();setSyncLabel(true);
}
async function adminLogout(){try{if(window._auth)await window._fb.signOut(window._auth)}catch(e){console.warn(e)}window._firebaseAdmin=false;$('#adminApp').classList.add('hidden');$('#adminLogin').classList.remove('hidden');showToast('Sesión administrativa cerrada.')}
window.addEventListener('firebase-auth-changed',event=>{
 const isAdmin=!!event.detail?.isAdmin;
 if(!isAdmin&&!$('#adminApp').classList.contains('hidden'))adminLogout();
 const label=$('#syncLabel');if(label&&event.detail?.user)label.textContent=isAdmin?'Firebase seguro · Administrador':'Firebase conectado · Sin rol admin';
});
function toggleAdminSide(){$('#adminSide').classList.toggle('open')}
function showAdminView(name,btn){if(!adminSessionValid()){showAdminLoginError('Tu sesión expiró o no tiene permisos.');adminLogout();return}$$('.admin-view').forEach(x=>x.classList.remove('active'));$('#admin-'+name)?.classList.add('active');$$('#adminMenu button[data-view]').forEach(x=>x.classList.toggle('active',x.dataset.view===name));$('#adminSide').classList.remove('open');renderAdminView(name);touchAdmin()}
function renderAdminView(name){const map={dashboard:renderDashboard,catalog:renderAdminProducts,gallery:renderAdminMedia,inventory:renderInventory,orders:renderAdminOrders,clients:renderClients,sales:renderSales,promotions:renderPromotions,shipping:renderShipping,payments:renderPayments,messages:renderMessages,reviews:renderReviews,users:renderUsers,reports:()=>{},settings:renderSettings};map[name]?.()}
function renderAllAdmin(){renderDashboard();renderAdminProducts();renderAdminMedia();renderInventory();renderAdminOrders();renderClients();renderSales();renderPromotions();renderShipping();renderPayments();renderMessages();renderReviews();renderUsers();renderSettings()}
function orderStatusClass(v){return String(v||'pendiente').toLowerCase().replaceAll(' ','')}
function kpi(label,value,sub,icon=''){return `<div class="kpi"><label>${icon} ${esc(label)}</label><strong>${esc(value)}</strong><small>${esc(sub)}</small></div>`}
function completedOrders(){return state.orders.filter(o=>['Confirmado','Enviado','Entregado'].includes(o.status))}
function renderDashboard(){const sales=completedOrders().reduce((s,o)=>s+Number(o.total||0),0),pending=state.orders.filter(o=>o.status==='Pendiente').length,shipped=state.orders.filter(o=>o.status==='Enviado').length,out=state.products.filter(p=>p.stock<=0).length,clients=uniqueClients().length,best=bestSeller();$('#dashboardKpis').innerHTML=kpi('Ventas del mes',money(sales),'Datos registrados','S/')+kpi('Pedidos pendientes',pending,'Por atender','▣')+kpi('Pedidos enviados',shipped,'En tránsito','▱')+kpi('Productos agotados',out,'Reponer stock','◇')+kpi('Clientes registrados',clients,'Compradores únicos','♙')+kpi('Más vendido',best?.name||'Sin datos',(best?.qty||0)+' unidades','★');const recent=state.orders.slice().sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,6);$('#recentOrdersBody').innerHTML=recent.length?recent.map(o=>`<tr><td><b>${esc(o.id)}</b></td><td>${esc(o.client?.name)}</td><td>${esc(o.payment)}</td><td>${esc(o.delivery)}</td><td><span class="status ${orderStatusClass(o.status)}">${esc(o.status)}</span></td><td class="orange"><b>${money(o.total)}</b></td></tr>`).join(''):'<tr><td colspan="6" class="muted">Aún no hay pedidos.</td></tr>';const low=state.products.filter(p=>p.stock<=5).slice(0,6);$('#lowStockList').innerHTML=low.length?low.map(p=>`<div class="stock-item"><img src="${esc(p.image)}"><div><strong>${esc(p.name)}</strong><small>${esc(p.sku)}</small></div><span class="stock-bad">${p.stock}</span></div>`).join(''):'<div class="muted" style="font-size:11px">Stock saludable.</div>';const vals=lastSalesValues();$('#salesChart').innerHTML=vals.map(v=>`<div class="bar" data-value="${money(v)}" style="height:${Math.max(8,v/Math.max(...vals,1)*100)}%"></div>`).join('')}
function lastSalesValues(){const arr=Array(14).fill(0);completedOrders().forEach(o=>{const d=Math.floor((Date.now()-new Date(o.createdAt))/86400000);if(d>=0&&d<14)arr[13-d]+=Number(o.total||0)});return arr.some(Boolean)?arr:[80,120,95,160,130,210,170,260,190,230,180,280,240,200]}
function bestSeller(){const map={};state.orders.forEach(o=>(o.items||[]).forEach(i=>map[i.productId]=(map[i.productId]||0)+Number(i.qty||0)));const id=Object.keys(map).sort((a,b)=>map[b]-map[a])[0];const p=state.products.find(x=>x.id===id);return p?{name:p.name,qty:map[id]}:null}
function catalogTab(name,btn){$$('#admin-catalog .tab').forEach(x=>x.classList.remove('active'));btn.classList.add('active');['Products','Categories','Attributes'].forEach(x=>$('#catalog'+x).classList.add('hidden'));$('#catalog'+name.charAt(0).toUpperCase()+name.slice(1)).classList.remove('hidden');if(name==='categories')renderCategories();if(name==='attributes')renderAttributes()}
function renderAdminProducts(){const q=($('#adminProductSearch')?.value||'').toLowerCase(),cat=$('#adminProductCategory')?.value||'';const list=state.products.filter(p=>(!q||[p.name,p.sku].join(' ').toLowerCase().includes(q))&&(!cat||p.category===cat));if($('#adminProductsBody'))$('#adminProductsBody').innerHTML=list.length?list.map(p=>`<tr><td><div style="display:flex;gap:10px;align-items:center"><img class="thumb" src="${esc(p.image)}"><div><b>${esc(p.name)}</b><br><small class="muted">${esc(p.brand)}</small></div></div></td><td>${esc(p.sku)}</td><td>${esc(p.category)}</td><td class="orange"><b>${money(p.price)}</b></td><td class="${p.stock<=3?'stock-bad':''}">${p.stock}</td><td>${isUpcomingProduct(p)?'<span class="status pendiente">PRÓXIMAMENTE</span> ':''}${(p.tags||[]).map(t=>`<span class="status pendiente">${esc(t)}</span>`).join(' ')}</td><td><div class="action-row"><button class="btn btn-secondary btn-sm" onclick="editProduct('${p.id}')">Editar</button><button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')">Eliminar</button></div></td></tr>`).join(''):'<tr><td colspan="7" class="muted">Sin productos.</td></tr>'}
function openProductForm(){['productId','pName','pSku','pCategory','pOldPrice','pTags','pColors','pSizes','pDescription','pImageUrl','pGallery','pColorImages','pLaunchDate'].forEach(id=>$('#'+id).value='');$('#pPublication').value='store';$('#pBrand').value='SADI PERÚ';$('#pPrice').value='';$('#pStock').value='';$('#pImagePreview').src='https://placehold.co/400x500/1a1a1a/ffffff?text=SADI';$('#productFormTitle').innerHTML='Nuevo <span>producto</span>';delete $('#pImageFile').dataset.data;renderGalleryUploadSlots([]);renderColorImageFields({});openModal('productModal')}
function editProduct(id){const p=state.products.find(x=>x.id===id);if(!p)return;fillCategorySelects();$('#productId').value=p.id;$('#pName').value=p.name;$('#pSku').value=p.sku;$('#pCategory').value=p.category;$('#pBrand').value=p.brand||'SADI PERÚ';$('#pPrice').value=p.price;$('#pOldPrice').value=p.oldPrice||'';$('#pStock').value=p.stock;$('#pTags').value=(p.tags||[]).join(', ');$('#pPublication').value=productPublication(p);$('#pLaunchDate').value=p.launchDate||'';$('#pColors').value=(p.colors||[]).join(', ');$('#pSizes').value=(p.sizes||[]).join(', ');$('#pDescription').value=p.description||'';$('#pImageUrl').value=p.image&&!p.image.startsWith('data:')?p.image:'';$('#pGallery').value=JSON.stringify(p.gallery||[]);$('#pColorImages').value=JSON.stringify(normalizeColorImages(p.colorImages||{}));$('#pImagePreview').src=p.image;$('#productFormTitle').innerHTML='Editar <span>producto</span>';delete $('#pImageFile').dataset.data;renderGalleryUploadSlots(p.gallery||[]);renderColorImageFields(normalizeColorImages(p.colorImages||{}));openModal('productModal')}
function previewProductImage(){const u=$('#pImageUrl').value.trim();if(u)$('#pImagePreview').src=u}
async function fileToData(file,max=1000){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=e=>{const img=new Image();img.onload=()=>{let w=img.width,h=img.height;if(w>max||h>max){const ratio=Math.min(max/w,max/h);w=Math.round(w*ratio);h=Math.round(h*ratio)}const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);resolve(c.toDataURL('image/jpeg',.78))};img.onerror=reject;img.src=e.target.result};r.onerror=reject;r.readAsDataURL(file)})}
async function handleProductImage(input){const file=input.files?.[0];if(!file)return;if(file.size>8*1024*1024)return showToast('La imagen supera 8 MB.');const data=await fileToData(file);input.dataset.data=data;$('#pImagePreview').src=data;$('#pImageUrl').value=''}
async function uploadProductFile(id){const input=$('#pImageFile'),file=input.files?.[0];if(!file)return input?.dataset.data||'';return input?.dataset.data||await fileToData(file,900)}
async function uploadImageAsset(file,path){
 // Compatibilidad de plan gratuito: no usa Firebase Storage.
 // Las imagenes de producto reales se guardan por el modulo V20 en sadi_product_images.
 // Esta funcion queda como respaldo para portada/flujo antiguo usando imagen comprimida.
 if(!file)return '';
 return await fileToData(file,1000);
}
async function resolveProductGalleryUploads(id){
 const result=[];
 for(let i=0;i<3;i++){
  const url=$('#galleryUrl'+i)?.value.trim()||'';
  const file=$('#galleryFile'+i)?.files?.[0];
  if(file){
   const ext=(file.name.split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,'').toLowerCase();
   result.push(await uploadImageAsset(file,`sadi/products/${id}/gallery/${i}_${Date.now()}.${ext}`));
  }else if(url)result.push(url);
 }
 return result.filter(Boolean).slice(0,3);
}
async function resolveProductColorUploads(id){
 const result={};
 const colors=parseList($('#pColors').value);
 for(const color of colors){
  const values=[];
  for(let i=0;i<3;i++){
   const field=$$('.color-image-input').find(x=>x.dataset.color===color&&Number(x.dataset.index)===i);
   const file=$$(`input[type="file"][data-color]`).find(x=>x.dataset.color===color&&Number(x.dataset.index)===i)?.files?.[0];
   if(file){
    const ext=(file.name.split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,'').toLowerCase();
    values.push(await uploadImageAsset(file,`sadi/products/${id}/colors/${slug(color)}/${i}_${Date.now()}.${ext}`));
   }else{
    const value=field?.value.trim()||field?.dataset.data||'';
    // No guardar base64 en Firestore: si es una imagen local antigua debe volver a subirse.
    if(value&&!value.startsWith('data:'))values.push(value);
   }
  }
  if(values.length)result[color]=values.slice(0,3);
 }
 return result;
}
async function reloadProductsFromFirebase(){
 if(!window._firebaseReady||!window._db||!window._fb)return;
 const snap=await window._fb.getDocs(window._fb.collection(window._db,DB_PREFIX+'products'));
 state.products=snap.docs.map(d=>({id:d.id,...d.data()}));
 saveLocal('products',state.products);
}
async function saveProduct(){
 const saveBtn=$('#productModal .btn-primary');
 if(saveBtn?.disabled)return;
 syncColorImageTextarea();
 const id=$('#productId').value.trim()||uid('prd'),name=$('#pName').value.trim(),sku=$('#pSku').value.trim()||'SADI-'+Date.now().toString().slice(-6),category=$('#pCategory').value.trim(),price=Number($('#pPrice').value),stock=Number($('#pStock').value);
 if(!adminSessionValid())return showToast('Tu sesión administrativa no está activa. Vuelve a iniciar sesión.');
 if(!name||!category)return showToast('Completa nombre y categoría.');
 if(!Number.isFinite(price)||price<=0)return showToast('Ingresa un precio válido mayor que cero.');
 if(!Number.isFinite(stock)||stock<0)return showToast('El stock no puede ser negativo.');
 if(saveBtn){saveBtn.disabled=true;saveBtn.dataset.label=saveBtn.innerHTML;saveBtn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';}
 try{
  const old=state.products.find(x=>x.id===id)||{};
  let image=$('#pImageUrl').value.trim()||old.image||'';
  const mainFile=$('#pImageFile')?.files?.[0];
  if(mainFile){
   const ext=(mainFile.name.split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,'').toLowerCase();
   image=await uploadImageAsset(mainFile,`sadi/products/${id}/main_${Date.now()}.${ext}`);
  }
  if(!image||image.startsWith('data:'))throw new Error('Selecciona o sube una imagen principal válida.');
  const [gallery,colorImages]=await Promise.all([resolveProductGalleryUploads(id),resolveProductColorUploads(id)]);
  const colors=parseList($('#pColors').value),sizes=parseList($('#pSizes').value);
  const publication=$('#pPublication')?.value||'store',launchDate=$('#pLaunchDate')?.value||'';
  const p={...old,id,name,sku,category,brand:$('#pBrand').value.trim()||'SADI PERÚ',price,oldPrice:Number($('#pOldPrice').value||0),stock,tags:parseList($('#pTags').value),publication,launchDate,colors:colors.length?colors:['Único'],sizes:sizes.length?sizes:['Única'],description:$('#pDescription').value.trim(),image,gallery:gallery.filter(x=>x&&x!==image).slice(0,3),colorImages,createdAt:old.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),updatedBy:window._firebaseUser?.uid||''};
  await putRecord('products',p,{requireFirebase:true});
  const verify=await window._fb.getDoc(window._fb.doc(window._db,DB_PREFIX+'products',id));
  if(!verify.exists())throw new Error('Firebase no confirmó el producto guardado.');
  await reloadProductsFromFirebase();
  closeModal('productModal');renderEverything();
  showToast(old.id?'✓ Producto actualizado en Firebase.':'✓ Producto creado en Firebase.');
 }catch(error){
  console.error('No se pudo guardar el producto:',error);
  const code=String(error?.code||'');
  let message=error?.message||'Error desconocido.';
  if(code.includes('permission-denied'))message='Firebase rechazó la edición. Revisa que las reglas permitan update en sadi_products.';
  else if(code.includes('unauthorized'))message='Firebase rechazó la operación. Revisa Authentication y las reglas de Firestore.';
  else if(code.includes('resource-exhausted'))message='El producto o sus imágenes superan el límite permitido.';
  showToast('No se guardaron los cambios: '+message);
 }finally{
  if(saveBtn){saveBtn.disabled=false;saveBtn.innerHTML=saveBtn.dataset.label||'Guardar producto';}
 }
}

async function deleteProduct(id){const p=state.products.find(x=>x.id===id);if(!confirm('¿Eliminar '+(p?.name||'este producto')+'?'))return;await removeRecord('products',id);state.products=state.products.filter(x=>x.id!==id);renderEverything();showToast('Producto eliminado.')}
function renderCategories(){const box=$('#catalogCategories');box.innerHTML=`<div class="panel"><div class="panel-head"><h3>Categorías</h3><div style="display:flex;gap:7px"><input class="field" id="newCategory" placeholder="Nueva categoría"><button class="btn btn-primary btn-sm" onclick="addCategory()">Agregar</button></div></div><div>${state.categories.map(c=>`<div class="order-card" style="display:flex;justify-content:space-between;align-items:center"><b>${esc(c.name)}</b><div><span class="status confirmado">${c.active!==false?'Activa':'Inactiva'}</span> <button class="btn btn-danger btn-sm" onclick="deleteCategory('${c.id}')">Eliminar</button></div></div>`).join('')}</div></div>`}
async function addCategory(){const name=$('#newCategory').value.trim();if(!name)return;const c={id:uid('cat'),name,active:true};state.categories.push(c);await putRecord('categories',c);fillCategorySelects();renderCategories();showToast('Categoría agregada.')}
async function deleteCategory(id){const c=state.categories.find(x=>x.id===id);if(state.products.some(p=>p.category===c?.name))return showToast('No se puede eliminar: tiene productos asociados.');await removeRecord('categories',id);state.categories=state.categories.filter(x=>x.id!==id);fillCategorySelects();renderCategories()}
function renderAttributes(){const brands=[...new Set(state.products.map(p=>p.brand).filter(Boolean))],colors=[...new Set(state.products.flatMap(p=>p.colors||[]))],sizes=[...new Set(state.products.flatMap(p=>p.sizes||[]))];$('#catalogAttributes').innerHTML=`<div class="settings-grid"><div class="panel"><h3>Marcas</h3><div class="chips" style="margin-top:14px">${brands.map(x=>`<span class="chip">${esc(x)}</span>`).join('')}</div></div><div class="panel"><h3>Colores</h3><div class="chips" style="margin-top:14px">${colors.map(x=>`<span class="chip">${esc(x)}</span>`).join('')}</div></div><div class="panel"><h3>Tallas</h3><div class="chips" style="margin-top:14px">${sizes.map(x=>`<span class="chip">${esc(x)}</span>`).join('')}</div></div><div class="panel"><h3>Variantes</h3><p class="admin-sub">Cada producto combina talla y color, con stock general en esta versión. Se puede ampliar a stock independiente por variante.</p></div></div>`}
function renderInventory(){const total=state.products.reduce((s,p)=>s+p.stock,0),low=state.products.filter(p=>p.stock>0&&p.stock<=5).length,out=state.products.filter(p=>p.stock<=0).length;$('#inventoryKpis').innerHTML=kpi('Unidades en stock',total,'Stock total')+kpi('Stock bajo',low,'5 o menos')+kpi('Agotados',out,'Sin existencias')+kpi('Entradas',state.inventory.filter(x=>x.type==='Entrada').reduce((s,x)=>s+Math.abs(x.qty),0),'Movimientos')+kpi('Salidas',state.inventory.filter(x=>x.type==='Salida').reduce((s,x)=>s+Math.abs(x.qty),0),'Movimientos')+kpi('Productos',state.products.length,'Catálogo activo');$('#inventoryBody').innerHTML=state.products.map(p=>`<tr><td><div style="display:flex;gap:9px;align-items:center"><img class="thumb" src="${esc(p.image)}"><b>${esc(p.name)}</b></div></td><td>${esc(p.sku)}</td><td><b class="${p.stock<=3?'stock-bad':''}">${p.stock}</b></td><td><span class="status ${p.stock<=0?'cancelado':p.stock<=5?'pendiente':'confirmado'}">${p.stock<=0?'Agotado':p.stock<=5?'Stock bajo':'Disponible'}</span></td><td><div style="display:flex;gap:5px"><input class="field" id="adj-${p.id}" type="number" value="1" style="width:75px;padding:8px"><button class="btn btn-secondary btn-sm" onclick="adjustStock('${p.id}','Entrada')">＋</button><button class="btn btn-danger btn-sm" onclick="adjustStock('${p.id}','Salida')">−</button></div></td><td><button class="btn btn-secondary btn-sm" onclick="showProductHistory('${p.id}')">Ver</button></td></tr>`).join('');renderInventoryHistory()}
async function addInventoryMove(p,type,qty,reason){const m={id:uid('mov'),productId:p.id,product:p.name,sku:p.sku,type,qty,reason,stockAfter:p.stock,createdAt:new Date().toISOString()};state.inventory.unshift(m);saveLocal('inventory',state.inventory);return m}
async function adjustStock(id,type){const p=state.products.find(x=>x.id===id),q=Math.abs(Number($('#adj-'+id).value||0));if(!p||!q)return;const delta=type==='Entrada'?q:-q;p.stock=Math.max(0,p.stock+delta);await putRecord('products',p);await addInventoryMove(p,type,delta,'Ajuste manual de administrador');renderEverything();showToast('Stock actualizado: '+p.stock)}
function renderInventoryHistory(filterId=''){const list=state.inventory.filter(x=>!filterId||x.productId===filterId).slice(0,30);$('#inventoryHistory').innerHTML=list.length?list.map(x=>`<div class="order-card"><div class="order-top"><b>${esc(x.product)}</b><span class="status ${x.type==='Entrada'?'confirmado':'pendiente'}">${esc(x.type)} ${x.qty>0?'+':''}${x.qty}</span></div><small class="muted">${dateText(x.createdAt)} · ${esc(x.reason)} · Stock final: ${x.stockAfter}</small></div>`).join(''):'<div class="empty">No hay movimientos registrados.</div>'}
function showProductHistory(id){renderInventoryHistory(id);$('#inventoryHistory').scrollIntoView({behavior:'smooth'})}
function renderAdminOrders(){const statuses=['Todos','Pendiente','Confirmado','En preparación','Enviado','Entregado','Cancelado','Devolución'];if($('#orderStatusTabs'))$('#orderStatusTabs').innerHTML=statuses.map(s=>`<button class="tab ${state.orderStatusFilter===s?'active':''}" onclick="setOrderStatusFilter('${s}',this)">${s}</button>`).join('');const q=($('#orderSearch')?.value||'').toLowerCase(),date=$('#orderDate')?.value||'';const list=state.orders.filter(o=>(state.orderStatusFilter==='Todos'||o.status===state.orderStatusFilter)&&(!q||[o.id,o.client?.name,o.client?.phone].join(' ').toLowerCase().includes(q))&&(!date||String(o.createdAt).slice(0,10)===date));if($('#ordersBody'))$('#ordersBody').innerHTML=list.length?list.map(o=>`<tr><td><b>${esc(o.id)}</b><br><small class="muted">${dateText(o.createdAt)}</small></td><td>${esc(o.client?.name)}<br><small class="muted">${esc(o.client?.phone)}</small></td><td>${(o.items||[]).map(i=>`<small>${esc(i.name)} x${i.qty}</small>`).join('<br>')}</td><td>${esc(o.payment)}<br><span class="status ${o.paymentStatus==='Confirmado'?'confirmado':'pendiente'}">${esc(o.paymentStatus||'Pendiente')}</span></td><td>${esc(o.delivery)}<br><small class="muted">${esc(o.client?.city||'')}</small></td><td><select class="select" style="padding:7px;font-size:9px" onchange="updateOrderStatus('${o.id}',this.value)">${statuses.slice(1).map(s=>`<option ${s===o.status?'selected':''}>${s}</option>`).join('')}</select></td><td class="orange"><b>${money(o.total)}</b></td><td><div class="action-row"><button class="btn btn-secondary btn-sm" onclick="orderPDF('${o.id}')">PDF</button><button class="btn btn-secondary btn-sm" onclick="contactOrder('${o.id}')">WhatsApp</button><button class="btn btn-danger btn-sm" onclick="deleteOrder('${o.id}')">Eliminar</button></div></td></tr>`).join(''):'<tr><td colspan="8" class="muted">No hay pedidos con estos filtros.</td></tr>'}
function setOrderStatusFilter(s){state.orderStatusFilter=s;renderAdminOrders()}
async function updateOrderStatus(id,status){const o=state.orders.find(x=>x.id===id);if(!o)return;o.status=status;if(status==='Confirmado'&&o.paymentStatus==='Pendiente')o.paymentStatus='Confirmado';await putRecord('orders',o);renderEverything();showToast('Pedido actualizado a '+status)}
async function deleteOrder(id){if(!confirm('¿Eliminar este pedido?'))return;await removeRecord('orders',id);state.orders=state.orders.filter(x=>x.id!==id);renderEverything()}
function contactOrder(id){const o=state.orders.find(x=>x.id===id);if(o)window.open('https://wa.me/'+normalizePhone(o.client?.phone)+'?text='+encodeURIComponent('Hola '+o.client.name+', te contactamos de SADI PERÚ respecto a tu pedido '+o.id+'.'),'_blank')}
function orderPDF(id){const o=state.orders.find(x=>x.id===id);if(!o)return;const {jsPDF}=window.jspdf,doc=new jsPDF();doc.setFillColor(10,10,10);doc.rect(0,0,210,38,'F');doc.setTextColor(255,77,0);doc.setFontSize(23);doc.text('SADI PERÚ',15,18);doc.setTextColor(255,255,255);doc.setFontSize(11);doc.text('COMPROBANTE DE PEDIDO '+o.id,15,29);doc.setTextColor(20,20,20);doc.setFontSize(10);let y=50;[['Fecha',dateText(o.createdAt)],['Cliente',o.client?.name],['WhatsApp',o.client?.phone],['Entrega',o.delivery],['Dirección',(o.client?.address||'Recojo en tienda')+' '+(o.client?.city||'')],['Pago',o.payment+' · '+o.paymentStatus],['Estado',o.status]].forEach(([k,v])=>{doc.setFont('helvetica','bold');doc.text(k+':',15,y);doc.setFont('helvetica','normal');doc.text(String(v||'—'),50,y);y+=7});y+=7;doc.setFont('helvetica','bold');doc.text('PRODUCTOS',15,y);y+=8;doc.setFont('helvetica','normal');(o.items||[]).forEach(i=>{doc.text(`${i.qty} x ${i.name} | ${i.color} | Talla ${i.size}`,15,y);doc.text(money(i.subtotal),190,y,{align:'right'});y+=7});y+=8;doc.setFont('helvetica','bold');doc.setFontSize(15);doc.setTextColor(255,77,0);doc.text('TOTAL: '+money(o.total),190,y,{align:'right'});doc.save('pedido_'+o.id+'.pdf')}
function uniqueClients(){const map={};state.orders.forEach(o=>{const key=o.client?.phone||o.client?.email||o.client?.name;if(!key)return;if(!map[key])map[key]={...o.client,orders:0,total:0,last:o.createdAt};map[key].orders++;map[key].total+=Number(o.total||0);if(String(o.createdAt)>String(map[key].last))map[key].last=o.createdAt});return Object.values(map)}
function renderClients(){const list=uniqueClients(),frequent=list.filter(c=>c.orders>=2).length,total=list.reduce((s,c)=>s+c.total,0);if($('#clientKpis'))$('#clientKpis').innerHTML=kpi('Clientes',list.length,'Registrados por compras')+kpi('Frecuentes',frequent,'Dos o más pedidos')+kpi('Ventas acumuladas',money(total),'Total comprado')+kpi('Ticket promedio',money(list.length?total/list.length:0),'Por cliente');if($('#clientsBody'))$('#clientsBody').innerHTML=list.length?list.map(c=>`<tr><td><b>${esc(c.name)}</b><br><small class="muted">Última compra: ${dateText(c.last)}</small></td><td>${esc(c.phone)}</td><td>${esc(c.email||'—')}</td><td>${esc(c.address||'—')}</td><td>${c.orders}</td><td class="orange"><b>${money(c.total)}</b></td><td><span class="status ${c.orders>=2?'confirmado':'pendiente'}">${c.orders>=2?'Frecuente':'Nuevo'}</span></td></tr>`).join(''):'<tr><td colspan="7" class="muted">Aún no hay clientes.</td></tr>'}
function filteredSales(){const from=$('#salesFrom')?.value,to=$('#salesTo')?.value;return state.orders.filter(o=>(!from||String(o.createdAt).slice(0,10)>=from)&&(!to||String(o.createdAt).slice(0,10)<=to))}
function renderSales(){const list=filteredSales(),total=list.filter(o=>o.status!=='Cancelado').reduce((s,o)=>s+Number(o.total||0),0),confirmed=list.filter(o=>o.paymentStatus==='Confirmado').reduce((s,o)=>s+Number(o.total||0),0);if($('#salesKpis'))$('#salesKpis').innerHTML=kpi('Ventas registradas',money(total),list.length+' pedidos')+kpi('Pagos confirmados',money(confirmed),'Monto validado')+kpi('Pendiente de pago',money(total-confirmed),'Por revisar')+kpi('Ticket promedio',money(list.length?total/list.length:0),'Promedio por venta');if($('#salesBody'))$('#salesBody').innerHTML=list.length?list.map(o=>`<tr><td>${dateText(o.createdAt)}</td><td><b>${esc(o.id)}</b></td><td>${esc(o.client?.name)}</td><td>${o.items?.reduce((s,i)=>s+i.qty,0)||0}</td><td>${esc(o.payment)}</td><td><span class="status ${orderStatusClass(o.status)}">${esc(o.status)}</span></td><td class="orange"><b>${money(o.total)}</b></td><td><button class="btn btn-secondary btn-sm" onclick="orderPDF('${o.id}')">Descargar</button></td></tr>`).join(''):'<tr><td colspan="8" class="muted">Sin ventas en este periodo.</td></tr>'}
function renderPromotions(){const box=$('#promotionsGrid');if(!box)return;box.innerHTML=state.promotions.length?state.promotions.map(p=>`<div class="order-card"><div class="order-top"><div><b style="font-size:18px">${esc(p.code)}</b><div class="muted" style="font-size:10px;margin-top:4px">${esc(p.description||'')}</div></div><span class="status ${p.active!==false?'confirmado':'cancelado'}">${p.active!==false?'Activa':'Inactiva'}</span></div><div style="display:flex;justify-content:space-between;align-items:center"><span class="orange"><b>${p.discount}% de descuento</b></span><div><small class="muted">${p.start||'—'} a ${p.end||'—'}</small> <button class="btn btn-danger btn-sm" onclick="deletePromotion('${p.id}')">Eliminar</button></div></div></div>`).join(''):'<div class="empty">No hay promociones.</div>'}
function openPromotionForm(){['promoCode','promoDiscount','promoStart','promoEnd','promoDescription'].forEach(id=>$('#'+id).value='');openModal('promotionModal')}
async function savePromotion(){const code=$('#promoCode').value.trim().toUpperCase(),discount=Number($('#promoDiscount').value||0);if(!code||discount<=0)return showToast('Completa código y descuento.');const p={id:uid('promo'),code,discount,start:$('#promoStart').value,end:$('#promoEnd').value,description:$('#promoDescription').value.trim(),active:true};state.promotions.unshift(p);await putRecord('promotions',p);closeModal('promotionModal');renderPromotions();showToast('Promoción creada.')}
async function deletePromotion(id){await removeRecord('promotions',id);state.promotions=state.promotions.filter(x=>x.id!==id);renderPromotions()}
function getShippingConfig(){const remote=state.shipping?.find?.(x=>x.id==='main')||state.shipping?.[0];if(remote)return {...remote,local:0,national:0,freeShipping:true};const saved=JSON.parse(localStorage.getItem('sadi_shipping_config')||'{"id":"main","pickup":true,"pickupAddress":"Galería Los Fabricantes 718 - La Victoria - Lima","pickupCity":"La Victoria","agency":"Shalom / Olva Courier","delivery":true}');return {...saved,local:0,national:0,freeShipping:true}}
function renderShipping(){const c=getShippingConfig();if($('#shippingSettings'))$('#shippingSettings').innerHTML=`<div class="form-group full"><label>Dirección oficial de la tienda y punto de recojo</label><input class="field" id="shipPickupAddress" value="${esc(c.pickupAddress||state.settings.address||'')}" placeholder="Avenida, calle, número y referencia"><small class="muted">Esta ubicación aparecerá automáticamente en todo el sistema y será fija para el cliente que elija recojo.</small></div><div class="form-group"><label>Ciudad del punto de recojo</label><input class="field" id="shipPickupCity" value="${esc(c.pickupCity||'La Victoria')}" placeholder="La Victoria"></div><div class="form-group"><label>Delivery local</label><input class="field" value="GRATIS" readonly></div><div class="form-group"><label>Envío nacional</label><input class="field" value="GRATIS" readonly></div><div class="form-group"><label>Empresas de transporte</label><input class="field" id="shipAgency" value="${esc(c.agency)}"></div><div class="switch"><span>Recojo en tienda</span><input type="checkbox" id="shipPickup" ${c.pickup?'checked':''}></div><div class="switch"><span>Delivery disponible</span><input type="checkbox" id="shipDelivery" ${c.delivery?'checked':''}></div>`;const list=state.orders.filter(o=>['En preparación','Enviado'].includes(o.status));if($('#shippingTracking'))$('#shippingTracking').innerHTML=list.length?list.map(o=>`<div class="order-card"><div class="order-top"><b>${esc(o.id)} · ${esc(o.client?.name)}</b><span class="status ${orderStatusClass(o.status)}">${esc(o.status)}</span></div><small class="muted">${esc(o.delivery)} · ${esc(o.client?.address||'Recojo')} · ${esc(o.client?.city||'')}</small></div>`).join(''):'<div class="empty">No hay pedidos en preparación o enviados.</div>'}
async function saveShippingSettings(){const c={id:'main',pickupAddress:$('#shipPickupAddress').value.trim(),pickupCity:$('#shipPickupCity').value.trim(),local:0,national:0,freeShipping:true,agency:$('#shipAgency').value.trim(),pickup:$('#shipPickup').checked,delivery:$('#shipDelivery').checked,updatedAt:new Date().toISOString()};if(!c.pickupAddress||!c.pickupCity)return showToast('Completa la dirección y ciudad del punto de recojo.');try{await putRecord('shipping',c);state.shipping=[c];state.settings.address=c.pickupAddress;saveLocal('settings',[{id:'main',...state.settings}]);await putRecord('settings',{id:'main',...state.settings,updatedAt:new Date().toISOString()});localStorage.setItem('sadi_shipping_config',JSON.stringify(c));renderEverything();showToast('Ubicación y envíos guardados correctamente.');}catch(e){console.error(e);showToast('NO SE GUARDÓ la ubicación: '+(e.message||'Error de Firebase'));}}
function renderPayments(){const pending=state.orders.filter(o=>o.paymentStatus!=='Confirmado'),confirmed=state.orders.filter(o=>o.paymentStatus==='Confirmado'),totalPending=pending.reduce((s,o)=>s+Number(o.total||0),0);if($('#paymentKpis'))$('#paymentKpis').innerHTML=kpi('Pagos pendientes',pending.length,money(totalPending))+kpi('Pagos confirmados',confirmed.length,money(confirmed.reduce((s,o)=>s+Number(o.total||0),0)))+kpi('Yape',state.orders.filter(o=>o.payment==='Yape').length,'Pedidos')+kpi('Plin',state.orders.filter(o=>o.payment==='Plin').length,'Pedidos');if($('#paymentsBody'))$('#paymentsBody').innerHTML=state.orders.length?state.orders.map(o=>`<tr><td><b>${esc(o.id)}</b></td><td>${esc(o.client?.name)}</td><td>${esc(o.payment)}</td><td class="orange"><b>${money(o.total)}</b></td><td><span class="status ${o.paymentStatus==='Confirmado'?'confirmado':'pendiente'}">${esc(o.paymentStatus||'Pendiente')}</span></td><td>${dateText(o.createdAt)}</td><td><button class="btn btn-secondary btn-sm" onclick="confirmPayment('${o.id}')">${o.paymentStatus==='Confirmado'?'Marcar pendiente':'Confirmar'}</button></td></tr>`).join(''):'<tr><td colspan="7" class="muted">Sin pagos.</td></tr>'}
async function confirmPayment(id){const o=state.orders.find(x=>x.id===id);if(!o)return;o.paymentStatus=o.paymentStatus==='Confirmado'?'Pendiente':'Confirmado';if(o.paymentStatus==='Confirmado'&&o.status==='Pendiente')o.status='Confirmado';await putRecord('orders',o);renderEverything();showToast('Estado de pago actualizado.')}
function renderMessages(){if($('#messagesList'))$('#messagesList').innerHTML=state.messages.length?state.messages.map(m=>`<div class="order-card"><div class="order-top"><div><b>${esc(m.name)}</b><div class="muted" style="font-size:9px;margin-top:3px">${esc(m.phone||m.email||'Sin contacto')} · ${dateText(m.createdAt)}</div></div><span class="status ${m.status==='Leído'?'confirmado':'pendiente'}">${esc(m.status||'Nuevo')}</span></div><p style="font-size:11px;line-height:1.6;color:#bbb">${esc(m.message)}</p><div class="action-row" style="margin-top:10px"><button class="btn btn-secondary btn-sm" onclick="markMessage('${m.id}')">Marcar leído</button><button class="btn btn-danger btn-sm" onclick="deleteMessage('${m.id}')">Eliminar</button></div></div>`).join(''):'<div class="empty">No hay mensajes.</div>'}
async function markMessage(id){const m=state.messages.find(x=>x.id===id);if(!m)return;m.status='Leído';await putRecord('messages',m);renderMessages()}
async function deleteMessage(id){await removeRecord('messages',id);state.messages=state.messages.filter(x=>x.id!==id);renderMessages()}
function renderReviews(){if($('#reviewsList'))$('#reviewsList').innerHTML=state.reviews.length?state.reviews.map(r=>`<div class="order-card"><div class="order-top"><b>${esc(r.client||'Cliente')} · ${'★'.repeat(Number(r.rating||5))}</b><span class="status ${r.approved?'confirmado':'pendiente'}">${r.approved?'Aprobada':'Pendiente'}</span></div><p class="muted" style="font-size:11px">${esc(r.comment)}</p><div class="action-row" style="margin-top:10px"><button class="btn btn-secondary btn-sm" onclick="approveReview('${r.id}')">${r.approved?'Ocultar':'Aprobar'}</button><button class="btn btn-danger btn-sm" onclick="deleteReview('${r.id}')">Eliminar</button></div></div>`).join(''):'<div class="empty">Aún no hay opiniones.</div>'}
async function approveReview(id){const r=state.reviews.find(x=>x.id===id);if(!r)return;r.approved=!r.approved;await putRecord('reviews',r);renderReviews()}
async function deleteReview(id){await removeRecord('reviews',id);state.reviews=state.reviews.filter(x=>x.id!==id);renderReviews()}
function renderUsers(){if($('#usersList'))$('#usersList').innerHTML=state.users.map(u=>`<div class="order-card"><div class="order-top"><div><b>${esc(u.name)}</b><div class="muted" style="font-size:9px">${esc(u.username)} · ${esc(u.permissions)}</div></div><span class="status confirmado">${esc(u.role)}</span></div></div>`).join('')}
async function addDemoUser(){const name=prompt('Nombre del empleado:');if(!name)return;const role=prompt('Rol (Empleado / Ventas / Inventario):','Empleado')||'Empleado',u={id:uid('usr'),name,username:'usuario'+(state.users.length+1),role,permissions:'Acceso demostrativo',active:true};state.users.push(u);await putRecord('users',u);renderUsers();showToast('Usuario demostrativo agregado.')}

let heroSlideIndex=0,heroSlideTimer=null;
function normalizedHeroSlides(){
 const fallback=[
  {image:'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1800&q=88',kicker:'Nueva colección 2026',title:'Viste tu esencia',highlight:'tu esencia',description:'Moda femenina pensada para expresar tu estilo con comodidad, elegancia y personalidad.',buttonText:'Explorar colección',buttonPage:'tienda'},
  {image:'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1800&q=88',kicker:'Drop exclusivo',title:'Diseño que impone presencia',highlight:'impone presencia',description:'Siluetas femeninas, detalles actuales y una propuesta creada para destacar con naturalidad.',buttonText:'Ver productos',buttonPage:'tienda'},
  {image:'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=1800&q=88',kicker:'Estilo SADI PERÚ',title:'Haz que tu estilo hable',highlight:'tu estilo hable',description:'Descubre combinaciones femeninas para cada momento del día.',buttonText:'Ver lookbook',buttonPage:'galeria'}
 ];
 const current=Array.isArray(state.settings.heroSlides)?state.settings.heroSlides:[];
 return fallback.map((base,i)=>({...base,...(current[i]||{}),image:(current[i]?.image||base.image)}));
}
function heroTitleHtml(slide){
 const title=esc(slide.title||'SADI PERÚ');const highlight=String(slide.highlight||'').trim();
 if(!highlight)return title;
 const pos=String(slide.title||'').toLowerCase().indexOf(highlight.toLowerCase());
 if(pos<0)return title+' <span>'+esc(highlight)+'</span>';
 const raw=String(slide.title||'');return esc(raw.slice(0,pos))+'<span>'+esc(raw.slice(pos,pos+highlight.length))+'</span>'+esc(raw.slice(pos+highlight.length));
}
function renderHeroSlider(){
 const track=$('#heroSliderTrack'),dots=$('#heroDots');if(!track||!dots)return;
 const slides=normalizedHeroSlides();const duration=Math.max(3000,Math.min(15000,Number(state.settings.heroInterval||5500)));
 document.documentElement.style.setProperty('--hero-duration',duration+'ms');
 heroSlideIndex=Math.min(heroSlideIndex,slides.length-1);
 track.innerHTML=slides.map((slide,i)=>`<article class="hero-slide ${i===heroSlideIndex?'active':''}" data-hero-index="${i}"><div class="hero-slide-bg" style="background-image:url('${esc(slide.image).replaceAll("'",'%27')}')"></div><div class="wrap hero-slide-content"><div class="hero-slide-copy"><div class="hero-kicker">● ${esc(slide.kicker||'SADI PERÚ')}</div><h1>${heroTitleHtml(slide)}</h1><p>${esc(slide.description||'')}</p><div class="hero-ctas"><button class="btn btn-primary" onclick="showPage('${esc(slide.buttonPage||'tienda')}')">${slide.buttonPage==='galeria'?'IR A GALERÍA':'IR A TIENDA'} →</button><button class="btn btn-secondary" onclick="showPage('${slide.buttonPage==='galeria'?'tienda':'galeria'}')">${slide.buttonPage==='galeria'?'IR A TIENDA':'IR A GALERÍA'}</button></div></div></div></article>`).join('');
 dots.innerHTML=slides.map((_,i)=>`<button class="hero-dot ${i===heroSlideIndex?'active':''}" onclick="goToHeroSlide(${i})" aria-label="Mostrar banner ${i+1}"></button>`).join('');
 restartHeroTimer();
}
function goToHeroSlide(index){const slides=normalizedHeroSlides();heroSlideIndex=(index+slides.length)%slides.length;$$('.hero-slide').forEach((x,i)=>x.classList.toggle('active',i===heroSlideIndex));$$('.hero-dot').forEach((x,i)=>{x.classList.remove('active');if(i===heroSlideIndex){void x.offsetWidth;x.classList.add('active')}});restartHeroTimer()}
function changeHeroSlide(direction){goToHeroSlide(heroSlideIndex+direction)}
function restartHeroTimer(){clearInterval(heroSlideTimer);if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const duration=Math.max(3000,Math.min(15000,Number(state.settings.heroInterval||5500)));heroSlideTimer=setInterval(()=>goToHeroSlide(heroSlideIndex+1),duration)}
function renderHeroAdmin(){
 const grid=$('#heroAdminGrid');if(!grid)return;const slides=normalizedHeroSlides();
 grid.innerHTML=slides.map((slide,i)=>`<article class="hero-admin-card"><img id="heroPreview${i}" src="${esc(slide.image)}" alt="Banner ${i+1}"><label>URL de imagen</label><input class="field hero-url" id="heroImage${i}" value="${esc(slide.image)}" oninput="previewHeroAdmin(${i})" placeholder="https://..."><div class="hero-admin-file"><label class="btn btn-secondary btn-sm"><i class="fa-solid fa-upload"></i> Subir archivo<input type="file" id="heroFile${i}" accept="image/*" hidden onchange="handleHeroFile(${i},this)"></label><button class="btn btn-danger btn-sm" type="button" onclick="clearHeroFile(${i})">Quitar</button></div><div class="hero-admin-status" id="heroStatus${i}"></div><label>Etiqueta pequeña</label><input class="field" id="heroKicker${i}" value="${esc(slide.kicker||'')}"><label>Título principal</label><input class="field" id="heroTitle${i}" value="${esc(slide.title||'')}"><label>Texto resaltado</label><input class="field" id="heroHighlight${i}" value="${esc(slide.highlight||'')}"><label>Descripción</label><textarea class="textarea" id="heroDescription${i}" style="min-height:80px">${esc(slide.description||'')}</textarea><label>Texto del botón</label><input class="field" id="heroButtonText${i}" value="${esc(slide.buttonText||'')}"><label>Destino del botón</label><select class="select" id="heroButtonPage${i}"><option value="tienda" ${slide.buttonPage==='tienda'?'selected':''}>Tienda</option><option value="galeria" ${slide.buttonPage==='galeria'?'selected':''}>Galería</option><option value="sale" ${slide.buttonPage==='sale'?'selected':''}>Ofertas</option><option value="contacto" ${slide.buttonPage==='contacto'?'selected':''}>Contacto</option></select></article>`).join('');
}
function previewHeroAdmin(i){const url=$('#heroImage'+i)?.value.trim();if(url)$('#heroPreview'+i).src=url}
async function handleHeroFile(i,input){const file=input.files?.[0];if(!file)return;if(file.size>10*1024*1024){input.value='';return showToast('La imagen del banner supera 10 MB.')}const data=await fileToData(file,1800);input.dataset.preview=data;$('#heroPreview'+i).src=data;$('#heroImage'+i).value='';$('#heroStatus'+i).textContent=file.name}
function clearHeroFile(i){const input=$('#heroFile'+i);if(input){input.value='';delete input.dataset.preview}$('#heroImage'+i).value='';$('#heroPreview'+i).src='https://placehold.co/1600x800/111111/a8ff00?text=SADI';$('#heroStatus'+i).textContent='Imagen pendiente'}
async function resolveHeroSlidesForSave(){
 const current=normalizedHeroSlides(),slides=[];
 for(let i=0;i<3;i++){
  const input=$('#heroFile'+i),file=input?.files?.[0];let image=$('#heroImage'+i)?.value.trim()||current[i].image;
  if(file){image=input?.dataset.preview||await compressMediaImage(file,220000)}
  slides.push({image,kicker:$('#heroKicker'+i)?.value.trim()||'',title:$('#heroTitle'+i)?.value.trim()||'SADI PERÚ',highlight:$('#heroHighlight'+i)?.value.trim()||'',description:$('#heroDescription'+i)?.value.trim()||'',buttonText:$('#heroButtonText'+i)?.value.trim()||'Ver colección',buttonPage:$('#heroButtonPage'+i)?.value||'tienda'});
 }
 return slides;
}

function renderSettings(){const s=state.settings;const fields={setStoreName:s.storeName,setLogoUrl:s.logo,setPrimaryColor:normalizeLuxuryPrimary(s.primaryColor),setSecondaryColor:s.secondaryColor||'#ffffff',setBackgroundColor:s.backgroundColor||'#080808',setTextColor:s.textColor||'#ffffff',setWhatsapp:s.whatsapp,setEmail:s.email,setHours:s.hours,setAddress:s.address,setFacebook:s.facebook,setInstagram:s.instagram,setTiktok:s.tiktok,setFreeShipping:s.freeShipping,setPolicies:s.policies,setTerms:s.terms,setHeroInterval:Math.round(Number(s.heroInterval||5500)/1000)};Object.entries(fields).forEach(([id,v])=>{if($('#'+id))$('#'+id).value=v??''});renderHeroAdmin();if($('#setLogoPreview'))$('#setLogoPreview').src=s.logo||'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANgAAAB6CAYAAADd9J0IAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAACt1SURBVHhe7Z17kBXF+fe/M3Puuyy7LIgoKIqIobyRCIL8EEFFpDSxjKXxEuNiIki8C6IlKFoJVrxGCYKC92iB0SImJtGqqIl3LFS8y0WMCirKRWD33ObM9PtPP/32PvScnXP27LIL51PVtXtmup9+uvt5pqd7enosIYQAAPmnKJZlqf+FEK3S2LatjpeDZVmtZOp5lUKl5OxKuM5BdcrjgbULP0+/9TjUbkRQXu3FlDfXzwSP01H6dRStazcEVEHdraC7I9U26PpYpfRgxdCvUN0NrjO/apoQQsCyrFY9Ju8NTPC8TITNvxJwOaa8TccInp7wfV+lK5a+u0HtDc0GitG2RVQJTZCxtRdyYD1UCrpIUKgkYQywuxK2DaoOVmE6wgk6knIdrC2Ht207VI++u1OtgW4Ad4JSHKEt2nIUGOJQvKD40HTe01EOVq2M9sEdoLvUp8lxSqGtNN2lHjoKNclRDKr8MF2+SRwda+9UfjmYGjhs/nraMGkoPsU15U2Df9M5olj6UuA6hylPUJ66AwbF6SroevI26Wx2ewdrD8UMspiRtdcQ25u+I+hODtaVaNtjqlQU7qi7Ct1hdkf0nmtXlrPqYGVCDacHju/7O4WguB2BST8hhNJD16cz9epoulIPW9KDZpPivu+3+m2K09UJo7MQAp7nKcO0bXsn4+S30KY6DZMXj2OS0x4s7WGpfgwAIpGIKkuhUEAkEilLHx6Hy9hTaJeDkWHp8DjdgTA6k3MBQD6fRzQa3akHcBynVRqTXH5BgqHuTek4YdLwOJFIRB2nc6SPJScEHMdR/+tOpsPlmuBxTPrtCZTtYCbnQjetSK6zqVwAsHLlSrz44otIpVLYtm0bCoUChOzREEKOZVk7GSsAtEplqD8uB4a8TI5rsziejKNfGEgOOdX555+Pfv36QQiBWCymzumY9KlipiwHC3IuGBqjO8B1NpVPCIH3338fU6dOxcqVK1vdIpqMOyw8HxhWuJND6HCd+W8YZFMPS8fpLzkXABx77LFYuHAh+vbti0QioXo0HS7XRDlpdkeqDmbQ2VQ+13XhOA7WrFmDiy66CG+//TaEHJdZlgXf91vdItIxLof/5nmHhcsxwWWbHIp+63/Hjh2Lhx56CA0NDXAcB9FotFXa9uS9p1F0FlE3NKpY3kg8lAuXa8JkFJWAylWsfI7jwPM8DBkyBHfffTdGjx4NS45TfPnwuFAowPM8+NqMYVvwvMOGcuDtZGltSsG2bbzxxhtoamrCZ599BsgxJ2RPSmNR0oHXEwUud1dTjj6mcpZKUQer8v+xbRvxeBzZbBaHHXYY5s2bh2OOOQau6yKVSkFo4xnRztvGSsGNioyF/9URQiCdTuPVV1/FxRdfjC+//BJCCGSz2Z1uXau0TbXGSkAIgUQiAcuycOCBB+Kuu+7C8ccfj0wmg2g0Ctu2y77SdRa6c5kcrFAoIBaLwfd9vPbaa/jFL36BTz/9FJ7nIZ/Pd4kLR3ei6mAhodsez/Ng2zZc18WQIUMwf/58jBs3DkLeXnUlJ+O9lx6CcBwH+XxejTnfe+89XHrppdi8ebMqf5XwlDTJEQaTnM40Np5XkD66ofE0xRDyVlAIgXw+D8dxsG7dOkybNg3Lly9XBmjJMZmebldBZW3rFo/XC5XVtm2MGDECCxYswJAhQ9SjBpLXmWUjnXRdefuZ9CknTiUoXuNlQIXXQ1elHN0ojRAC0WgUnudh0KBBePjhhzF69Gj4vo94PI58Pr+TAZoatSPRy6cbpB50+G865jgO3nzzTUyZMgXr1q2D67qtnqVVCabiPZjJaCslOww8f1PeupOUC8nwPA+u68K2baxbtw4XX3wxXn/9dUQiEeRyOWXYkPm11YtUEl5OU3l5fcEQ37IsxGIxuK6LYcOGYcmSJdh///3hui4SiUSruB2NqFAP1llUvLWp0HroqrS30unZVzweh+d5OOigg3Dvvfdi5MiRagxD7Ip6oPLpjsZDGHzfRy6XQyKRwCeffIKmpiZ89NFHiEajyOfzoeV0JchJ9dAR7NEOhnY6mW7AyWRSPSe75557MGrUKDXjxg29HMIYAjcYXvd0TJdjaiNdX8uykEqlYFkW8vk8CoUC3n33XUyZMgXvv/8+bNtWz8m4nI6Al5//7mqUdItoapRKFpAaPwh+LozOHQXXBWxB8HvvvYerr74ab7zxBpLJpBq3mNKVA5djqgsex7ZtpWMul0MkEmk1KcPjE3TOkhMelmXBdV38+Mc/xu9+9zuMHz9e2QQtreL2YdIviHLSdFW6lYN1JYL09H0fzc3NSKVSWLlyJWbMmIG3335bnS9nmts0buPPo0xxOD169MC2bduQyWSQTCaRyWR2cixTuXQHgyxDPB5HOp3GsGHD8Pzzz6OhoaHqYAa6lYNxHYvF7WhMeXtyXSKkrp7nIZvNqhlFGrOVCneCsPA027Ztw4YNGzB16lR88skniEQircZQImAShsux5DrLeDyOZDKJl156CT/60Y+qDmag6mBlYspbyCVS5BC0NpH+F0IYX1fpKHgv57ou4vE4Xn31VVx00UX48ssvlTPo7cnLpv8mJ/J9H5FIBA0NDVi+fLl6xaXqYK0pycHCYJLDG6yjactRK4FJPjdoaPURZDT6RAg3ZMLUq5igZ1OQ8ng6oa3EePnllzFlyhR88cUXiEajyOVyJfWutnxd58wzz8SiRYsQiURUelPdlIteb5VsV94OqLDeRLiWq1I23HFsuZyKQiQSUcFxHBX04yRDD1wOlxWJRHY6T7J938e4cePwyCOP4OCDD4Yvt0AwXSBMUP6RSAR77bUXYrFYK+M3Ge+eStXByoSuqHrgThAm6PK4bF++HlIKJIfS80DO67ouhg8fjrlz56pp+Ijcj6MtLDkG8zxPPWiuYqbqYGXCnSusg3EorY4e3w64PeR583MmhLxFJCcDgGHDhqFnz55w5PtuJh05lnw/zrZtRKNRfrqKhrn1JG0ZhwmeJmy6cggyslLzDJJRTE655eM6W9qzpWLxeECADnQ7yNuA8iGH1eOQ03EdgqDJG2HYj4TrUwxTmTi8vGHR45pk87opRXZb6LKKOlg5cKUrqXhbmCqyFHQjKYX2lDMoXVv1F6as3IC5oeryRRkTCHzcVmr6jkLXI0w9dRRCiMo7WHdEN+awRsKvumHTlUJHyCwHk5NWgnLqvbtRdbAKUGnj6GjHLZWqg5VP1cG0La5LMaBS4pZKR8oula6iR3dFORi/gliGF/TCwNOETcfhVzeuX9g4YaDnQySjmO4Uh2bRoBkhj0+Oy9H1NcXhkx76syy9nDw/jp6O0tLkhC0X/hYKBXVxMT1otrTJEb1+IPPX39oulUrYiQldXnvsgutn0tGUl/67y/ZgvGCmwu1qdEcB05nOkxPqafhvHicMPM8w6GsiC4UCbNvGjh07EJGr6kt95lalbUpv2U6CO1dYI+LoTsCNu9LoeobV16RTsXLz+GHKJeR0uuM4EPJVFdu2sWnTJtx5553YsGFDq168SuXosg7GKbfhixlre/B9H67rIp/PI5fLqZcR6ZjrunBdV52j3zzkcrmd4uTz+VZBP05xc7kcXNdVt3zFoLJb2ir4zz//HL/73e+wdOlStRxLX1lfpTIEOljYiu6oHsIkl/5W2lnCOqEVMC615NiGxlO0jIiO0ViHHtDS/658CZPH4eiyKU8at5GTkj50XI/L623r1q24/fbbcd9996kxGN0+ErycQlupQuMxX66o16mkDcDQQ3OddL30uFR2klEOXK5JDs9TzxeowGp6nmm5csJgGV6t6Ewsbb9513XxxhtvYMeOHTvpRZjGVmF05mMhSqM3JvU6Bx54IAYMGLDTJA3dDpIOuvM/+eSTuPDCC5FMJpFOp5XeNvvmGWR76vnTX5okmTVrFmbNmgXBXsXhdVEuen2Z6hiGeqaLjF5fpnSdQbsdrDPhhhzGWCuJpTnYli1bcMopp2DlypUVrzsuz1ROcqD+/fvjoYcewsiRI5HL5ZBMJgHN6HQDy+VyiEajeOeddzB9+nS88sorauEv7RpFM4lhHWz27Nm4/vrrO83BTPD66UoOtvMltkTI4HXD3xOg7aXj8ThsuejVNkyL88DjhAmm9AAQjUbx1Vdf4bLLLsM777yjdnmi203d8CzLQjweh+/7OOqoo3D33Xfj6KOPBgC1ZwjlFRbdgDsTXqddmXY72J6KL99cFnKFOhm2HvTbMgo8jinwNDxQr0L7Lq5atQoXXngh1q5dC0v2sibD8+Si3qz8gMUDDzyAQw45BNB6pTDoF1KeT0dfZHl+XZ1wNVqEoKstitwzh0FPSzL57yD0eJWG9KJeQneIYoZXKYScyHBdF0I+6M3n81i7di2amprw4YcfAnLFO+lD+tI4jT5/O3jwYNxxxx3Yf//94TgOYrGYcjJbvlBJzkyOSyGZTEIIgXg8rtqG4iKgjeiY6VxYKJ9iQZcfdKwj0fNqt4NV6Rr4vo93330XTU1NeO+995BIJNT0PjkA2MXH932MHz8eixYtwgEHHKDiknHQw2ghHZmMNRaLIZ1O4+STT8Zpp50GT34QwwTJKtehiEo5RaXkhMVcK10AfsXp7Irpbvi+j1QqhdWrV+Oiiy7Cm2++qRzL077CSVdzyJlI13UxcuRI3HfffTjooIOUQ1FvR9sBROSWBtSznXXWWViwYAEOOOAA5YjQDFhvr0o5V5ANkK3oNtNVqDrYbkIikUBzczOi0ShWr16Ns88+Gy+//LIac3nsgTQ5XzQaRTabxdixY3HnnXeisbERkUhETZLQrT/NWtbU1ODMM8/E3Llz0a9fP+zYsQPJZFLJ0+G/y6Et54LhtrEr0W4H0wvEC9meK0q5ckQZm6/wK2BQMKWhPPgMnK4HP6Yf57/D6kxQ+mw2i1gshmw2CwD46quvMGPGDLz66qvKyUzjRNu2UVNTA9d1ccIJJ2DRokVobGyE4zhIJpPqy5b04cHzzjsPc+fOxd577w3f99HQ0KCcl8oRZBM8cPS65vXC67JUKE8utxhcF1O6YmWyuvJi33IxVUJbFKukICw269ZWvrrcsHmUgiX3XtT/fvjhh7j00kuxYsUK1NTUwGPfLtPXHtIzrDFjxuC2225DfX090uk0YrEY4vE4crkcrr76atxwww1obGyEJd8ogHwm1xm0VcddAd62u6WDldoQ3MF4JZkodlUjSI5Jtp5el1NMXqnE43GsWrUK06ZNw4oVK2DJ9Ya+76uZRDBdkskkTj/9dNx6662or69HIpFAJBLBddddhxtvvBF9+vTZqbfek+FtyOtlt3OwcuAVxCvJRNh4ulMJOcWuOxlRSt5hyWaziMfjWLNmDX7729/i448/VuMrsI1SLW11RiQSwZlnnolbbrkFjuNgxowZuOqqq9RqD4pbSV27K9xueJ1UZKkUCW2PjEqh6yIM4yATYeIQNN5oaWnBSSedhA8++ADZbFZNAujwHgxag5CBcn31dO0lFospfW3bxpAhQ/DEE09g8ODBgLaeUcfXvgW2Y8cOrF69GkOGDEEqlVKzhXyrtkrpy3VBBWWXQxh9THF0SurBdOFBxmGCG5gJkscD2C1Wsbi6bKuElQn08FQ38KBgyeluPZ5lmEGj8ySXQiwWA+QyJ0t7M1oPuh6RSKSVDF+uYKc4vNw6uVxOOZjnefjwww8xZcoUfPrpp/DlCnrXdVV8cqB4PI5CoYBkMokjjjgCqVRKHY9Go63Ko+uKIvrwdjLF4XJJZkeg69BWXlTveo+vnysWVA9GkcOgV06YNCLEk3RThcNQ+KDGCcKUF4fikOxiaYR86JrJZDBhwgR88MEHyOfzRp24IwJA7969sd9++6llUab8yMkcx8EPP/yAjRs3wpfLrGz5wTuaoChWp7zeo9EoCoUCjjrqKCxbtgy1tbWIRqPKaUgX3ZgovX5LGCYvHsdUPzxOZ6Lrqbd/qXHaopWDcfgpLpyfL4ae1pSOyyb0wqGbOhg02eeddx5uv/32Vr0rz8/S1hN+9913uOyyy9QzLVp/KNowaDqmx6HbO9/3cfbZZ+O2225DTU0NHPk2M9W1Xud62lLy4nFM9cPjdDX0svD6CEu4eygDeqZtUapSuxNkdGSgtbW16NWrF1KpFOrr61FXV4f6+nr07NkTdXV1qKurQyKRQCKRQCqVwuDBg/H444/jxBNPbNVzlYMQQs0iLl26FFdddRUymYxaqExxdGMqN6+uTmeVUzmYfuUK4zylKBVGLo9jqgB+RTGFcuDyTejn9d6nWFpyKhpnWdq40ApYH2jJ5UmpVEq9ElNTU4OFCxdiwoQJsLWvpOjjNRO8vnz5FRX6f8mSJbj55pvheR5c10U6nVY6UBy9bMXqmMfhwS9xWzyiWP0SXMcw8DSmdPrxtnQIouweDFql7kmUUuH6efqfZu7o4axuQHqgc47jIB6Po0+fPliwYAEmTJigztGUOo3l2sLSJmiox3rooYdw0003IZPJtJrCt+WES1jZHFN5TEa8u1OSg/Gr0u5SYVSOrlIe6u0sbS2gEAK9e/fGn/70J0yaNAm2XL5UKBRUT9cW1GZ6b5JOp7Fo0SJcf/312LZtG3w5uwjpJHpvXQrcwcpxUp3uam8l1R53ru5YYBN6Wbpimcg4I/KDd4sWLcLJJ58Mz/PUpEUYA9ady5ezkpZ8cfORRx7BnDlzsH37drXKvj1tzO2kEnK6IyU52O5MV2pEXQ8hexl6HhaNRhGPx7FgwQIcd9xx6lYvDNzgLXmbSc70wAMP4Nprr1X7Jran5+F5VYJKyelMSnIw3uWXW/kmwsilq28xymlYug0LypejTy4U05eM39W2ZxPac6Yg/XR5lmUhlUrBcRwkEgnYcvV7Q0MDFixYgLFjx7bSwZITFKYFuHo5KR71ZHRb+MQTT2DmzJnYvn07stkscrmcuv20tI+58/KHDdDayHQuCCvE7SrF0es1jGwOtQ+hl7VUimvcxSingLsrnuehb9++uO+++zBmzBjYtq1ejrTlw+gwkAH62nbaixcvxuzZs5HJZADNwHzDPohdEbKTcu2lHKcMots5WHsrr6tBvYoewhCRbxjvu+++WLBgAUaPHg3XddV7W3y9YBB6z0BOBgCPPfYYrrnmGrVvIl3Rg3rdctB7c73HaC/cQUrVmeqkEjYWrjW7ELzy9lSotxFCYP/998eSJUswYcIE5HK5knoZulUjgxJy3aLneVi6dCmuuOIK7Nixo9X+HpWiVMMvB/12NiyVLGO7HYwKUE5BdMLK4fHaCuVATqwHT3vlXmizcZa2hTTPkxqKDJefa6sheVn0EI/H4Wg7QcXjcTW7WCgU1LiN8g7qGXWdyGEprhACTz/9NGbOnIlCoYBcLodMJtMqTSmTLEGEqQuCt4tet6ZAacKgp6Hf0NLr58JirvUqbSKkc9GbwdlsdqeGRQmNWyq6Udpy4qO+vh4LFizAz3/+c2zfvl0Zn+M48ItM5ZsMRy/Hk08+iSuvvFJtR0AXF1+uDKGLj6n8YQnSrbtTdTAD3FiE4b2yZDKJPn36qPEDH/OUY2Qc3YnaQsgNbHr27Ilbb70V5557Lmz5MJr0C6OTfrUmpywUCnj00Ucxffp0bNmyRY3V9Di8vjoKnk9H5lUJqg4WAG9EMnYKyWQSs2bNwrBhw9StlX4+6JYsDOUYjuM4apKjT58+uOeee3Dqqaeqh9H6e19hIB08ucGq4zhYsmQJrr32WmzduhWO46Ag9/4whY6Ct0up9dTZlG8FuzHFGk03nmHDhuGxxx5T+wnqoT1OViz/IPL5POLxONLptFrdMX/+fIwdO1aNEcNC+ZODCbkKP5lMYunSpbj88svVblPUg3eWg3U3lAXwCgpbSWHShInD4WlM6fj5cgOHn9fjWexh5sCBA/HnP/8ZI0aMgK29Tk8GTWnJ8YQ2iWAZbq2EdjvKr9BcF/0YTXb06NEDAFBXV4cePXpg0aJFOPHEE1VvQ2k8uZU2/Sb9CD1vXz6MbmlpgW3beOaZZ3DFFVdg8+bNqocT2sSPrhfX1wQvZzG4XJNsfr6tOPxYMX3akssp7xK7Cwgq8K6Cbr0A4LDDDsPixYsxatQodZtGBk16cydqL1yO3ti2fKXFsiz07t0b8+bNw/HHHw/HcRCNRpVz0TOvMFjsYfSjjz6Ka665Bps2bYIlHZZ6bj/kMy0yUkpnolSDLpVKtEUxlIPRFYiCKWNe2I4oMMH16WrQqx1kUAMHDsS8efMwZswYpNNp2HJ2Dcy5qCym+i0V7mR0jKD22XvvvfHggw9i/Pjx8OUnl0TAcqogqHcT8nbRtm385S9/wfTp07Fp0ybYtq2m8Hnoiui66e3SFqWWLbAHC5O4I+H589+7mkKhoFZT0DtegwcPxkMPPYQxY8aoKzPXm/8ulyA5ZCyWnP2LxWKwLAv19fV4+OGHMWHCBNX7hunByJAs+W6ao20tEI1GsWzZMlxyySXYsGGDejctrAHq8YLihonTHjpCpk4rB+O9E++peGFNwUSYOByev2UYr4SBpzGFMPA0ZGikmyPfMO7Xrx8WL16M//u//1M6QxuT0QNp/VxY9Pz12ypeFpJNzkW789bW1mLhwoWYNGkSfN9HbW2tchrqofSeissjaLwm5K5Xzz33HK666iqk02m14oOcnGQFQXHCwm3CZBemEATlX6oeYQnswboKVIldEb1xyOgsy8K+++6Le++9F6NGjUJUbs+Wz+cRiUSUAaMNwwuDqV70Y/r/tvwqSkNDA+69916cccYZaGlpUWMyPg4qZphk1DSUsG0bzz77LC644AJs3LgRkOlp8sOkJwL03xV0pI11eQcrFaqsjqy0IGw57nIcB/vssw8efvhhjB8/Hpb8fOuu0ouwZG/Wo0cP3H777Tj33HMhhEAqlYKrfZ8ZAb2ixfYXEdpzMgB49tlncfHFF2P9+vXwtRc6w45vdkd2Owfb1ejjsn79+mH+/Pk45ZRTAGm0eg/W2djyuVUymURDQwPuuusunHbaaXBdVz074z2XycnoAkG9mCffJ4tGo3jxxRcxbdo0fPvtt2U94N7d2HWt3UHoV17dUDoLMlKa+Ojbty8WL16MiRMnQhS5XeoMXNdFRG4HEI/HkUwm8cc//hHjx49XM54c3alId5OTReV3xmKxGF555RU0NTWhubm51VhsT8SZM2fOHH6wPXRkZfLG1hs5iI7UxwTdPlnarFskEsG4ceOwZcsW9OzZE+PGjQMqfO/P6yVIrs32lk8mkzjhhBPw9ddfY+3atUrfqNzxNxaLIRqNqp6Zxpq2fNZGcR25sp/KvXHjRrzzzjsYPnw4GhoajDqZekYewlBOmjCY7CqMfD1dRT7+UAm44mH0sdhTdy6jKyDkYD8ajWL79u345ptvcPDBB6vxWmfeMlIPSvXmy4+p27aNrVu34uWXX0Zzc3OrNLZ8U1qHJi90hJxZpQtMNBpFc3MzjjnmGAwePBi+XHnP06CNCw3Pp7vRbgfjFdPZctpqpLByOgIyZGj7PJCO9MyIG1174GU11YcOORzd2uVyOR4lNLwdaIKDVvPTY4piaUzwMnU2XK8w+uhpdhsHCzLUsHI6Asuy1AQCoc/W8TK3B1M5uXxyeHIsyCVf9GyOjvN0JtlhyMrvk9mGB+7oBg5m0imMPoEOxiu4VGFBhJWjx9N10BsiDHq8MHl3FFzftsoRpKspflBcHZ7OlEbImU26hTPF4dBEDmEFvDnA25TL5voRQcdhkBEWnk63c4LHMREmjV7unWulwpgUKIbYRbN/nYGpUXc1pA85COkYFExxaNzFgx53V8N16wydhBDtdzByCJNjmI5V6b7obdkRhhpkR5WAOxe327B5lpqmwxyM/67SvaG2FIa3u01wuyjFFspJ0xZcF1MIQ6lp2u1gVfYcwhhUEEGOyGlPHsUo1TEqRdFZRDpGlUN/dSV5xYWJEwZTGr6mzRSnHMLI4fVjKicf6PM05WLSj8s26cPT8d/F4HLaSsv1KSUtwWWEJajslmHWtLMp2oORkqVU0p5GtW6qFKOog1UJR9XJqgRR1MGoe9W73ipmqg5WxUSbY7A9zXCozHq5hVy358i3mDlBdWSKWw5cF/pLD4hJN8hxqkl/aHJM5yqBLpeWSgU9xCb9i1FJ3XYVRR1sT4EmT8ggyKF0HLn9NBmLyVg5lapTk0NY2guPurHq57kBi4CLR6Ug56Z89bWXBOUXlC/pR+mC4nUXqg5muPKaDIMci7C1fSkQ4GiVqlPd2HSZ+jtc+gWBLgD6CguK0xEOJrR96n1tGwGSHZFf56S49NcK2OuDMLVDd6PqYJrhklEGNax+jHozMib9dXui0nWqG6eQvRe9iZzP51UZaIEt3abxclXawaD1qAQtIqZ9FGkrBdKd0uj6kP4med2VqoNpV8psNot///vf+O6779SVVDcCet8pkUigb9++GDBgAPbee291hSYD0q/elUSwW9f169djxYoVePfdd7F+/Xpks1mkUikMHToUhx12GIYNG4bGxkZlrLxHI5nloKdrbm7Ga6+9hs2bNwMAEokEevXqhTFjxqgttyGdznEctcXAv/71L7UTled5GDp0KIYPHw6rhA8IdnmExPf9PS4QhUJBtLS0iFwuJ4444giRSCRELBYT0WhUxONxFWpqakQqlRLJZFI0NjaKQw45RFx55ZVi3bp1Ip/PC8/zlFzP85R8Ha6DKXBc1xW+74tcLidc1xXr168X1113nRg0aJDSKRqNilQqJRKJhIjH46KxsVGMHTtWzJ8/X3z//fcil8uJXC4nCoWCkkv6hgk6nucJz/NEoVAQruuKTCYjZsyYISKRiKirqxOpVEoccMAB4oUXXhDZbFZkMhnheZ5wXVe0tLSITCYjHn/8cdGrVy/hOI6IxWJir732EkuWLBGe54nm5mbh+76xDrleXT3s0T0YXck9z1NfhhwxYgTWrFmj9q8QcoNN27ZbfeExHo8DAFpaWjB69Gg89thj6NOnj5JLvZneW4TFlCadTiOZTOLNN9/EVVddhZUrVyKRSKit12pqauC6ripHOp1GTU0N8vk8Jk6ciFtvvRX7778/InLrOP32NgwmnYT2COd///sfJk6ciI0bN6oXSUeMGIFly5apLQUcx8G2bduwdetWnHHGGVi3bh0KhQI8z8NPf/pTPP744ygUCuozuCa6m52Gq909DBrb0F6GQr72T2MJ13Xxww8/oLm5GZZlYfny5ZgzZw587RV8MgTdCMuF3jj+6KOPcOWVV2LlypXqNoscuVAoIJlMIplMIpPJKCdzHAf/+Mc/cPnll2Pz5s0oFArqlf+wzlUMS769PGDAANxyyy2tbgPfeustzJ8/H47cBz+bzaKhoQH3338/Vq1ahVwuByEEevXqhenTpyOXy6mxbHvrrKtQ7cECejDHcZDJZDB9+nQceeSRsOREQT6fx9dff41Fixbhs88+gyM/srDPPvvgpZdeQv/+/ZVcYejB+G8TPE42m0U+n8fUqVPx9NNPI5VKIZvNwvd9HHroobj88svVdt3ffPMNXnzxRSxcuBAbN25UW3z7vo8ZM2bgpptuUjqb8gqCx9MvIJZlKaf+9a9/jSVLliAid9VqbGzEkiVLMGLECLiui48//hinnnoqtm7dqpzo97//PaZNmwbI8RuNZ4vl223ozHvbUvLSxzM6+nlT4HJMgaOPwYYNGybq6upEMpkUsVhMPPXUU6KlpUWk02mRyWREOp0W6XRaPP/886K+vl7U1NSIWCwmksmkeOmll0Q2mxWFQqFsXQiflfHZZ58VPXv2FMlkUiQSCZFMJsWvfvUr8cUXXyj9aIyWyWTEp59+KoYOHSpisZiIxWKisbFR7LPPPmLFihUin8+rcR2vv3LGPZ7niVwuJ7Zt2yY+/vhjMXjwYJFMJkUymRTxeFycc845YvPmzWL9+vXi2GOPFbFYTKRSKVFbWysmTZokNm3aJFpaWpQsLr/UoNsCYTrG4XIqEdp/j9BB8CuXTkdfxfQpZZqCt+V2Z478BNDhhx+O2tpadQUvFArYsWOH6h14KAW6sgs5FQ8AL730Enbs2AFI/YYPH45rrrkG/fr1g+/7SCQSrWbe+vfvj1mzZqmPoafTaWzZsgX/+c9/YMlZxVL1CkLIHaVqa2sxaNAgTJ8+XdWZZVn45z//ieeeew5PPfUUXnvtNRV/n332wezZs1FfX99q1rYj6Wj5nE5xMN1gwsIN05SWG3ElKo+m7Ck/i32cjpzus88+QyaTabVzLW2PXQnIuWha/vXXX0dU7nNvWRZOP/10HHzwwfB9H6lUqlX5SecJEyZg+PDhcF1XfaT9hRdegC+/80XOq8P11x8LBEGORGPPc889F8cff7x6Ntfc3Iw5c+bgzjvvhCefj2UyGZxzzjkYPnw40uk0YrFYqLy6G53mYKb/wxKUhjsXN45SoYsAGaRlWVizZg0+/PBDrFmzBmvXrsXnn3+OZ555BjfccAO2b9+unK93794YOHAgstmscowgvdtCL4sQAt999x2++uorZYS+7+PII49U21Vbcv93MtBIJIJYLIa6ujqMHDlS9bqWZeHzzz9HOp2GJXvdYpRSBrrQUN4zZ85Enz59IOSzuzVr1mDDhg2Iyu20DzvsMEyePFlNKOkXsd2JLl+isA1cKajnsOSWa3PmzMFxxx2Ho48+GiNGjMDRRx+NpqYm/Pe//1UOSb1F//79W91ShnH4oPLpTtbS0oKWlhb4cotqx3GQSCQAw36L+t9oNIr99tsPABCNRiGEQCaTQSaTUfkEEaRXEPF4HJ6cnhdC4Mgjj8RvfvMbdctMEy2RSAQ9evTAzJkz0a9fPwghEI/Hkc/nuciKY+2C1SGd4mBhjU2HjJcfg2Z8FEcPdE430LBQDyDktDfkeIfy9eSXRMhALdlzjBgxArNmzVJXbyqvrhfB9TUd0+NDOoctn12R8+dyOdXDkL5COjsZue/7+P7771U9OI6Duro6JBIJJYcH0gdaPfOejKehdJSvI595/fKXv8Shhx6qZhRt20Y2m8X48ePVXv0RuSGpfvvL5ZYKL4tg401e16Y6rxSd4mDdBb0RyCgsuYQqn8+rHsT3fcRiMaRSKUyePBmPPvoo+vbtG8ogSjEeildfX4/evXtDyN7Vtm0sX75c3TLmcjnVs1nyuZTrushkMli+fDmEEOqZ08CBA1FfX6962bbg+obRG9KIBw4ciMmTJyMi97WncMkll6jlU9zwdzfaruE9CDIkMr5IJIKf/exnuOGGGzB79myMHDlSrZBwXRcDBgzADTfcgLq6OvXhA0vruUyEdS7IuLZto7a2FocffrjqpTzPw5IlS9Sayaj8HCwf+73xxhtYvny56gGFEBg1alQrhwxDqc5FZDIZ7LvvvrDkLSLV6QEHHABfe+2nVLndiaqDGa6cZBC+7+OUU07BjBkzMH36dNx0001obGxEPp9HKpXCxx9/jOuvvx5C3qJ1xNWYDPD4449XOvm+j48++gg33ngjtm7dCtd1kc/n4bouCoUCfN9HS0sLbr75ZmzatAmFQgGpVAp1dXWYMGGCctRSDLuUuNAuDqR/Xn443ZcPkfXzuzPKwfQrSbErcFeHdC9WBh6Hyk2NToGOQY7PRo4cicsuuwyOfEYWj8exbNky/P3vf98pL318ZAq6bA61hSM/D5TL5TBp0iQcc8wxsLVXY5YuXYqzzjoLf/vb3/DFF19gw4YNWL16NR588EFMmDABb731lpKVTqdx9tln45BDDlHjRL3sxeoLhjrjAVr90R2A7/tqzSbVZ0QuPSMnI7geFEh/3T45YeLsKqo9mGwg3rC+9naubduIx+MQQmDq1Kk49thjkc1mATnDd+edd6plSXS8kg0thEC/fv0wd+5cDBw4EIVCAa780Phrr72GpqYmjB49GscccwzGjRuHK664AqtWrQKkQedyOYwaNarVA2BOJfWF1oOTM9P4i3otOr+7s3NN74Hwqx85GOTaOFv7lldNTQ1mzJiB3r17q7QfffQRbr75ZjW20WceK0EymUShUMBPfvIT3HHHHTjwwANVD0B/XddFc3OzejbnydUoruvipJNOwt13343evXurC4anPWSmclfSyag+yaFc+c4X9exh8+IXPhNh4uwqqg4W8HayLT88Z8lZRCFva/L5PEaOHInJkyer+LZt46mnnsJf//pX2NomL5Uin8+rHnTixIlYtmwZLrjgAtTV1cGSs4bZbBau6yojsywLgwYNwvXXX48HH3wQQ4cObXXrRuM5IqzBh4X0iEajiMfjiMfjaqKDzochjPOEibOrUKvpUUKhS4XLNRkfjxMGniaskZji0SD8D3/4A7Zu3YpYLAYhBM4//3wMGjRI3eL48pWUdDqNefPmIZ1Oqx5ryJAhaGpqapUHz4v/DjpGUBld+Z0x+pvL5bB27Vo899xzWLlyJb799lt4nodEIoEBAwZg1KhROO6449C/f3+48j02WsrVVn56vRaLa4LiCznxs3HjRtx///3qlrZQKGD27Nno2bMnT9puSO9SdS6FUm2uU15X4bI7ysEQosAIiEOGJeTtoWADbJpY4PGoF9DjUJow+vHfOpTeJId6Scuy0NLSAiEN2vd9JJNJxOPxVnEotIXeqxFh0ulQ/YClpTrlx9sLyaJ8Kymbw9uirbyqDiahxhHaVmjUa3EjEZpzkQ50q4gA+QQ/x3/rkGxTOQn9+Rc5EelMOhXLgyiWF0/Pf+vQ2I7iUB2RXNILAXZQDpQX5VNMv86m6mASahy9kSjoaXRj4XH1eHSew/Pmv3X0fDiUJ/U4tPQJWvywDlYsHxh05L8JXn/6Mb2OCP67XEx5dRX+H/5TGsNvHcAqAAAAAElFTkSuQmCC'}

function previewStoreLogo(){const url=$('#setLogoUrl').value.trim();if(url)$('#setLogoPreview').src=url}
async function handleStoreLogo(input){const file=input.files?.[0];if(!file)return;if(file.size>5*1024*1024)return showToast('El logo supera 5 MB.');const data=await fileToData(file,700);input.dataset.data=data;$('#setLogoPreview').src=data;$('#setLogoUrl').value=''}
function removeStoreLogo(){state.settings.logo='';if($('#setLogoUrl'))$('#setLogoUrl').value='';if($('#setLogoFile')){delete $('#setLogoFile').dataset.data;$('#setLogoFile').value=''}if($('#setLogoPreview'))$('#setLogoPreview').src='data:image/png;base64,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';showToast('Logo retirado. Guarda la configuración para aplicar el cambio.')}
async function saveSettings(){
 const button=$('#admin-settings .btn-primary');const previous=button?.innerHTML;if(button){button.disabled=true;button.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Guardando portada...'}
 try{
  if(!adminSessionValid())throw new Error('La sesión administrativa no está activa.');
  const logoData=$('#setLogoFile')?.dataset.data||'';
  const heroSlides=await resolveHeroSlidesForSave();
  state.settings={...state.settings,storeName:$('#setStoreName').value.trim()||'SADI PERÚ',logo:logoData||$('#setLogoUrl').value.trim()||state.settings.logo||OFFICIAL_SADI_LOGO,primaryColor:$('#setPrimaryColor')?.value||'#6B3A1E',secondaryColor:$('#setSecondaryColor')?.value||'#ffffff',backgroundColor:$('#setBackgroundColor')?.value||'#050505',textColor:$('#setTextColor')?.value||'#ffffff',brandVersion:30,heroSlides,heroInterval:Math.max(3000,Math.min(15000,Number($('#setHeroInterval').value||6)*1000)),whatsapp:$('#setWhatsapp').value.trim(),email:$('#setEmail').value.trim(),hours:$('#setHours').value.trim(),address:$('#setAddress').value.trim(),facebook:$('#setFacebook').value.trim(),instagram:$('#setInstagram').value.trim(),tiktok:$('#setTiktok').value.trim(),freeShipping:Number($('#setFreeShipping').value||200),policies:$('#setPolicies').value.trim(),terms:$('#setTerms').value.trim()};
  const row={id:'main',...state.settings,updatedAt:new Date().toISOString()};
  saveLocal('settings',[row]);localStorage.setItem('sadi_brand_cache',JSON.stringify({storeName:row.storeName,logo:row.logo,primaryColor:row.primaryColor,secondaryColor:row.secondaryColor,backgroundColor:row.backgroundColor,textColor:row.textColor}));applySettings();await putRecord('settings',row,{requireFirebase:true});renderSettings();showToast('Marca, colores, portada y configuración guardados correctamente.');
 }catch(error){console.error('Error guardando configuración:',error);showToast('No se pudo guardar: '+(error.message||error));}
 finally{if(button){button.disabled=false;button.innerHTML=previous||'Guardar configuración'}}
}
async function syncAllToFirebase(){if(!window._firebaseReady)return showToast('Firebase no está disponible. Revisa la configuración.');if(!adminSessionValid())return showToast('Debes iniciar sesión como administrador para sincronizar.');showToast('Sincronizando con Firebase...');try{for(const [name] of Object.entries(COLLECTIONS)){const list=name==='settings'?[{id:'main',...state.settings}]:name==='inventory'?state.inventory:state[name]||[];for(const record of list){if(record?.id)await window._fb.setDoc(window._fb.doc(window._db,DB_PREFIX+name,record.id),record,{merge:true})}}setSyncLabel(true);showToast('Todos los datos se sincronizaron con Firebase.')}catch(e){console.error(e);setSyncLabel(false);showToast('No se pudo sincronizar. Revisa las reglas de Firestore.')}}
function adminGlobalFilter(){const q=$('#adminGlobalSearch').value.toLowerCase();if(!q)return;const p=state.products.find(x=>[x.name,x.sku].join(' ').toLowerCase().includes(q));if(p){showAdminView('catalog');$('#adminProductSearch').value=q;renderAdminProducts();return}const o=state.orders.find(x=>[x.id,x.client?.name,x.client?.phone].join(' ').toLowerCase().includes(q));if(o){showAdminView('orders');$('#orderSearch').value=q;renderAdminOrders()}}
function rowsToCSV(rows){if(!rows.length)return 'Sin datos';const keys=Object.keys(rows[0]);return '\ufeff'+[keys.join(';'),...rows.map(r=>keys.map(k=>'"'+String(r[k]??'').replaceAll('"','""')+'"').join(';'))].join('\n')}
function downloadBlob(content,name,type='text/csv;charset=utf-8'){const blob=new Blob([content],{type}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function exportProductsCSV(){downloadBlob(rowsToCSV(state.products.map(p=>({SKU:p.sku,Producto:p.name,Categoria:p.category,Marca:p.brand,Precio:p.price,PrecioAnterior:p.oldPrice,Stock:p.stock,Colores:(p.colors||[]).join(', '),Tallas:(p.sizes||[]).join(', '),Etiquetas:(p.tags||[]).join(', ')}))),'productos_sadi.xls','application/vnd.ms-excel')}
function exportInventoryCSV(){downloadBlob(rowsToCSV(state.products.map(p=>({SKU:p.sku,Producto:p.name,Categoria:p.category,Stock:p.stock,Estado:p.stock<=0?'Agotado':p.stock<=5?'Stock bajo':'Disponible'}))),'inventario_sadi.xls','application/vnd.ms-excel')}
function exportOrdersCSV(){downloadBlob(rowsToCSV(state.orders.map(o=>({Pedido:o.id,Fecha:dateText(o.createdAt),Cliente:o.client?.name,DNI:o.client?.dni||'',WhatsApp:o.client?.phone,Productos:(o.items||[]).map(i=>i.name+' x'+i.qty).join(', '),Pago:o.payment,EstadoPago:o.paymentStatus,Entrega:o.delivery,Estado:o.status,Total:o.total}))),'pedidos_sadi.xls','application/vnd.ms-excel')}
function exportSalesCSV(){downloadBlob(rowsToCSV(filteredSales().map(o=>({Fecha:dateText(o.createdAt),Pedido:o.id,Cliente:o.client?.name,Pago:o.payment,Estado:o.status,Total:o.total}))),'ventas_sadi.xls','application/vnd.ms-excel')}
function exportClientsCSV(){downloadBlob(rowsToCSV(uniqueClients().map(c=>({Cliente:c.name,DNI:c.dni||'',WhatsApp:c.phone,Correo:c.email,Direccion:c.address,Pedidos:c.orders,Total:c.total,UltimaCompra:dateText(c.last)}))),'clientes_sadi.xls','application/vnd.ms-excel')}
function exportSalesPDF(){const list=filteredSales(),{jsPDF}=window.jspdf,doc=new jsPDF({orientation:'landscape'});doc.setFillColor(10,10,10);doc.rect(0,0,297,25,'F');doc.setTextColor(255,77,0);doc.setFontSize(20);doc.text('SADI PERÚ · REPORTE DE VENTAS',14,16);doc.setTextColor(30,30,30);doc.setFontSize(9);let y=36;doc.setFont('helvetica','bold');doc.text('FECHA',14,y);doc.text('PEDIDO',45,y);doc.text('CLIENTE',80,y);doc.text('PAGO',155,y);doc.text('ESTADO',195,y);doc.text('TOTAL',270,y,{align:'right'});y+=7;doc.setFont('helvetica','normal');list.forEach(o=>{if(y>195){doc.addPage('landscape');y=20}doc.text(dateText(o.createdAt),14,y);doc.text(o.id,45,y);doc.text(String(o.client?.name||'').slice(0,30),80,y);doc.text(o.payment||'',155,y);doc.text(o.status||'',195,y);doc.text(money(o.total),270,y,{align:'right'});y+=7});doc.setFont('helvetica','bold');doc.setTextColor(255,77,0);doc.text('TOTAL: '+money(list.reduce((s,o)=>s+Number(o.total||0),0)),270,y+6,{align:'right'});doc.save('reporte_ventas_sadi_peru.pdf')}
function exportRowsFor(name){if(name==='products')exportProductsCSV();if(name==='orders')exportOrdersCSV();if(name==='clients')exportClientsCSV()}
function renderEverythingAfterRemote(){renderEverything();showToast('Datos actualizados.')}
window.addEventListener('keydown',e=>{if(e.key==='Escape'){closeOverlays();$$('.modal.open').forEach(x=>x.classList.remove('open'))}});
window.addEventListener('click',e=>{if(e.target.classList.contains('modal'))e.target.classList.remove('open')});
window.addEventListener('firebase-ready',()=>{setSyncLabel(!!window._firebaseReady);setTimeout(retryPendingOrders,150);});
window.addEventListener('online',()=>setTimeout(retryPendingOrders,150));
if(adminSessionValid())touchAdmin();
setTimeout(()=>{if(window._firebaseReady===undefined){window._firebaseReady=false;window.dispatchEvent(new Event('firebase-ready'));}},2500);
setTimeout(retryPendingOrders,1200);
initData().catch(e=>{console.error(e);state.products=[];state.categories=loadLocal('categories',seedCategories);state.promotions=loadLocal('promotions',seedPromotions);renderEverything();showToast('No se pudo sincronizar el catálogo.');});

document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInterval(heroSlideTimer);else restartHeroTimer()});
document.addEventListener('mouseover',e=>{if(e.target.closest?.('#heroSlider'))clearInterval(heroSlideTimer)});
document.addEventListener('mouseout',e=>{if(e.target.closest?.('#heroSlider'))restartHeroTimer()});
