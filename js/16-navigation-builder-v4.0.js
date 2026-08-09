'use strict';
(function(){
 const DEFAULT_MENU=[
  {id:'menu_inicio',label:'Inicio',type:'page',target:'inicio',active:true,highlight:false,order:10},
  {id:'menu_tienda',label:'Tienda SADI',type:'page',target:'tienda',active:true,highlight:true,order:20},
  {id:'menu_galeria',label:'Galería',type:'page',target:'galeria',active:true,highlight:false,order:30},
  {id:'menu_nosotros',label:'Nosotros',type:'page',target:'nosotros',active:true,highlight:false,order:40},
  {id:'menu_contacto',label:'Contáctanos',type:'page',target:'contacto',active:true,highlight:false,order:50},
  {id:'menu_proximamente',label:'Próximamente',type:'page',target:'proximamente',active:true,highlight:false,order:60},
  {id:'menu_sale',label:'Sale',type:'page',target:'sale',active:true,highlight:true,order:70}
 ];
 const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
 const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const menuItems=()=>{
  const raw=Array.isArray(state?.settings?.navigation)?state.settings.navigation:DEFAULT_MENU;
  return raw.map((x,i)=>({id:x.id||('menu_'+Date.now()+'_'+i),label:x.label||'Sección',type:x.type||'page',target:x.target||'tienda',active:x.active!==false,highlight:!!x.highlight,order:Number(x.order??((i+1)*10)),icon:x.icon||'',description:x.description||'',banner:x.banner||'',slug:x.slug||''})).sort((a,b)=>a.order-b.order);
 };
 function targetAction(item){
  if(item.type==='category')return `openMenuCategory('${String(item.target).replace(/'/g,"\\'")}')`;
  if(item.type==='url')return `openMenuExternal('${String(item.target).replace(/'/g,"\\'")}')`;
  return `showPage('${String(item.target).replace(/'/g,"\\'")}')`;
 }
 function renderPublicMenu(){
  const items=menuItems().filter(x=>x.active);
  const desktop=q('#navLinks');
  if(desktop){desktop.innerHTML=items.map(x=>`<a data-menu-id="${escapeHtml(x.id)}" class="${x.highlight?'orange':''}" onclick="${targetAction(x)}">${x.icon?`<span class="menu-icon">${escapeHtml(x.icon)}</span>`:''}${escapeHtml(x.label)}</a>`).join('');}
  const mobile=q('#mobileMenu nav');
  if(mobile){mobile.innerHTML=items.map(x=>`<a data-menu-id="${escapeHtml(x.id)}" class="${x.highlight?'orange':''}" onclick="${targetAction(x)};closeOverlays()">${x.icon?escapeHtml(x.icon)+' ':''}${escapeHtml(x.label)}</a>`).join('')+`<a onclick="showPage('cuenta');closeOverlays()">♙ Mi cuenta</a>`;}
  syncActiveMenu();
 }
 window.openMenuExternal=function(url){
  const safe=String(url||'').trim(); if(!safe)return;
  if(/^https?:\/\//i.test(safe))window.open(safe,'_blank','noopener'); else location.href=safe;
 };
 window.openMenuCategory=function(category){
  const item=menuItems().find(x=>x.type==='category'&&x.target===category);
  const filter=q('#categoryFilter'); if(filter)filter.value=category;
  if(typeof window.showPage==='function')window.showPage('tienda');
  if(filter){filter.value=category; if(typeof window.renderStore==='function')window.renderStore();}
  const title=q('#page-tienda .title'); if(title)title.innerHTML=`Categoría <span>${escapeHtml(category)}</span>`;
  const desc=q('#page-tienda .section-desc'); if(desc)desc.textContent=item?.description||`Explora todos los productos disponibles en ${category}.`;
  let hero=q('#royCategoryHero');
  if(!hero){hero=document.createElement('div');hero.id='royCategoryHero';hero.className='roy-category-hero';q('#page-tienda .wrap')?.prepend(hero);}
  if(hero){
   if(item?.banner){hero.style.backgroundImage=`linear-gradient(90deg,rgba(0,0,0,.82),rgba(0,0,0,.28)),url("${String(item.banner).replace(/"/g,'')}")`;hero.innerHTML=`<div><small>CATEGORÍA SADI</small><h2>${escapeHtml(item.label)}</h2><p>${escapeHtml(item.description||'Colección seleccionada para ti.')}</p></div>`;hero.hidden=false;}
   else hero.hidden=true;
  }
  syncActiveMenu(item?.id);
 };
 function syncActiveMenu(forceId){
  const page=qa('.page.active')[0]?.id?.replace('page-','');
  qa('#navLinks a,#mobileMenu nav a').forEach(a=>a.classList.remove('active'));
  const item=forceId?menuItems().find(x=>x.id===forceId):menuItems().find(x=>x.type==='page'&&x.target===page);
  if(item)qa(`[data-menu-id="${CSS.escape(item.id)}"]`).forEach(a=>a.classList.add('active'));
 }
 const originalShowPage=window.showPage;
 if(typeof originalShowPage==='function')window.showPage=function(name,opts){
  const out=originalShowPage.call(this,name,opts);
  if(name!=='tienda')q('#royCategoryHero')?.setAttribute('hidden','');
  if(name==='tienda'){
   const title=q('#page-tienda .title');if(title)title.innerHTML='Nuestra <span>tienda</span>';
   const desc=q('#page-tienda .section-desc');if(desc)desc.textContent='Explora el catálogo, abre cada producto y selecciona sus opciones en una ficha de compra clara y profesional.';
  }
  setTimeout(()=>syncActiveMenu(),0); return out;
 };
 function installAdminView(){
  const menu=q('#adminMenu'); if(menu&&!q('[data-view="navigation"]')){
   const settingsBtn=menu.querySelector('[data-view="settings"]');
   const btn=document.createElement('button');btn.dataset.view='navigation';btn.innerHTML='☰ Menú web';btn.onclick=function(){window.showAdminView('navigation',this);renderAdminNavigation();};
   menu.insertBefore(btn,settingsBtn||menu.querySelector('.sep'));
  }
  const content=q('.admin-content'); if(content&&!q('#admin-navigation')){
   const section=document.createElement('section');section.className='admin-view';section.id='admin-navigation';
   section.innerHTML=`<div class="panel-head"><div><h1 class="admin-title">Menú y categorías</h1><p class="admin-sub">Controla qué aparece en el menú superior y vincula categorías sin modificar el código.</p></div><button class="btn btn-primary" onclick="openMenuItemForm()">＋ Agregar opción</button></div>
   <div class="roy-menu-layout"><div class="panel"><div class="panel-head"><h3>Opciones visibles</h3><button class="btn btn-secondary btn-sm" onclick="addAllCategoriesToMenu()">Agregar categorías faltantes</button></div><div id="royMenuAdminList"></div></div>
   <div class="panel"><h3>Vista previa</h3><p class="admin-help">Este orden se mostrará en computadora y celular.</p><div id="royMenuPreview" class="roy-menu-preview"></div><div class="roy-info-box"><b>Asignación de productos</b><br>Al crear o editar un producto, selecciona su categoría. Cuando el cliente pulse esa categoría en el menú, verá únicamente esos productos.</div></div></div>`;
   content.appendChild(section);
  }
  if(!q('#menuItemModal')){
   const modal=document.createElement('div');modal.className='modal';modal.id='menuItemModal';
   modal.innerHTML=`<div class="modal-card roy-menu-modal"><button class="modal-close" onclick="closeModal('menuItemModal')">×</button><div class="eyebrow">NAVEGACIÓN</div><h2 class="title" style="font-size:40px">Opción del <span>menú</span></h2><input type="hidden" id="menuItemId"><div class="admin-form">
   <div class="form-group"><label>Nombre visible</label><input class="field" id="menuItemLabel" placeholder="Ejemplo: Jeans"></div>
   <div class="form-group"><label>Tipo de destino</label><select class="select" id="menuItemType" onchange="renderMenuTargetField()"><option value="page">Página del sistema</option><option value="category">Categoría de productos</option><option value="url">Enlace externo</option></select></div>
   <div class="form-group full" id="menuTargetField"></div>
   <div class="form-group"><label>Icono opcional</label><input class="field" id="menuItemIcon" placeholder="Ejemplo: 🔥"></div>
   <div class="form-group"><label>URL corta / slug</label><input class="field" id="menuItemSlug" placeholder="Ejemplo: jeans"></div>
   <div class="form-group full"><label>Descripción de categoría</label><textarea class="textarea" id="menuItemDescription" placeholder="Texto breve que verá el cliente"></textarea></div>
   <div class="form-group full"><label>Imagen de portada (URL)</label><input class="field" id="menuItemBanner" placeholder="https://..."></div>
   <div class="form-group"><label><input type="checkbox" id="menuItemActive" checked> Visible en el menú</label></div>
   <div class="form-group"><label><input type="checkbox" id="menuItemHighlight"> Resaltar en dorado</label></div>
   <div class="form-group full"><button class="btn btn-primary" onclick="saveMenuItem()">Guardar opción del menú</button></div></div></div>`;
   document.body.appendChild(modal);
  }
 }
 window.renderMenuTargetField=function(value){
  const type=q('#menuItemType')?.value||'page',box=q('#menuTargetField');if(!box)return;
  const pages=[['inicio','Inicio'],['tienda','Tienda'],['galeria','Galería'],['nosotros','Nosotros'],['contacto','Contacto'],['proximamente','Próximamente'],['sale','Sale / Ofertas'],['cuenta','Mi cuenta']];
  if(type==='page')box.innerHTML=`<label>Página</label><select class="select" id="menuItemTarget">${pages.map(([v,l])=>`<option value="${v}" ${value===v?'selected':''}>${l}</option>`).join('')}</select>`;
  else if(type==='category')box.innerHTML=`<label>Categoría</label><select class="select" id="menuItemTarget"><option value="">Selecciona una categoría</option>${(state?.categories||[]).map(c=>`<option value="${escapeHtml(c.name)}" ${value===c.name?'selected':''}>${escapeHtml(c.name)}</option>`).join('')}</select><div class="admin-help">Los productos se vinculan desde el formulario de cada producto.</div>`;
  else box.innerHTML=`<label>Enlace</label><input class="field" id="menuItemTarget" value="${escapeHtml(value||'')}" placeholder="https://...">`;
 };
 window.openMenuItemForm=function(id){
  const item=id?menuItems().find(x=>x.id===id):null;
  q('#menuItemId').value=item?.id||'';q('#menuItemLabel').value=item?.label||'';q('#menuItemType').value=item?.type||'category';
  q('#menuItemIcon').value=item?.icon||'';q('#menuItemSlug').value=item?.slug||'';q('#menuItemDescription').value=item?.description||'';q('#menuItemBanner').value=item?.banner||'';q('#menuItemActive').checked=item?.active!==false;q('#menuItemHighlight').checked=!!item?.highlight;
  renderMenuTargetField(item?.target||'');window.openModal('menuItemModal');
 };
 async function persistNavigation(items,message){
  if(!state?.settings)throw new Error('La configuración aún no está disponible.');
  const normalized=items.map((x,i)=>({...x,order:(i+1)*10}));
  state.settings.navigation=normalized;
  const record={id:'main',...state.settings,navigation:normalized,updatedAt:new Date().toISOString()};
  await window.putRecord('settings',record,{requireFirebase:true});
  if(typeof window.saveLocal==='function')window.saveLocal('settings',[record]);
  renderPublicMenu();renderAdminNavigation();window.showToast?.(message||'Menú guardado correctamente.');
 }
 window.saveMenuItem=async function(){
  try{
   const label=q('#menuItemLabel').value.trim(),type=q('#menuItemType').value,target=q('#menuItemTarget')?.value.trim();
   if(!label||!target)return window.showToast?.('Completa el nombre y el destino.');
   const items=menuItems(),id=q('#menuItemId').value||('menu_'+Date.now().toString(36));
   const item={id,label,type,target,icon:q('#menuItemIcon').value.trim(),slug:q('#menuItemSlug').value.trim(),description:q('#menuItemDescription').value.trim(),banner:q('#menuItemBanner').value.trim(),active:q('#menuItemActive').checked,highlight:q('#menuItemHighlight').checked};
   const i=items.findIndex(x=>x.id===id);if(i>=0)items[i]={...items[i],...item};else items.push({...item,order:(items.length+1)*10});
   await persistNavigation(items,'Opción del menú guardada.');window.closeModal('menuItemModal');
  }catch(e){console.error(e);window.showToast?.('No se pudo guardar: '+(e.message||e));}
 };
 window.deleteMenuItem=async function(id){if(!confirm('¿Eliminar esta opción del menú?'))return;try{await persistNavigation(menuItems().filter(x=>x.id!==id),'Opción eliminada.')}catch(e){window.showToast?.('No se pudo eliminar: '+e.message)}};
 window.toggleMenuItem=async function(id){const items=menuItems(),i=items.findIndex(x=>x.id===id);if(i<0)return;items[i].active=!items[i].active;try{await persistNavigation(items,'Visibilidad actualizada.')}catch(e){window.showToast?.('No se pudo actualizar: '+e.message)}};
 window.moveMenuItem=async function(id,dir){const items=menuItems(),i=items.findIndex(x=>x.id===id),j=i+dir;if(i<0||j<0||j>=items.length)return;[items[i],items[j]]=[items[j],items[i]];try{await persistNavigation(items,'Orden actualizado.')}catch(e){window.showToast?.('No se pudo ordenar: '+e.message)}};
 window.addAllCategoriesToMenu=async function(){
  const items=menuItems(),existing=new Set(items.filter(x=>x.type==='category').map(x=>x.target.toLowerCase()));let added=0;
  (state?.categories||[]).filter(c=>c.active!==false).forEach(c=>{if(!existing.has(String(c.name).toLowerCase())){items.push({id:'menu_cat_'+Date.now().toString(36)+'_'+added,label:c.name,type:'category',target:c.name,active:true,highlight:false,order:(items.length+1)*10,description:`Explora nuestra colección de ${c.name}.`,banner:'',slug:String(c.name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')});added++;}});
  if(!added)return window.showToast?.('Todas las categorías ya están en el menú.');
  try{await persistNavigation(items,`${added} categoría(s) agregada(s) al menú.`)}catch(e){window.showToast?.('No se pudo guardar: '+e.message)}
 };
 window.renderAdminNavigation=function(){
  const list=q('#royMenuAdminList'),preview=q('#royMenuPreview');if(!list||!preview)return;const items=menuItems();
  list.innerHTML=items.length?items.map((x,i)=>`<div class="roy-menu-row"><div class="roy-menu-order"><button onclick="moveMenuItem('${x.id}',-1)" ${i===0?'disabled':''}>▲</button><button onclick="moveMenuItem('${x.id}',1)" ${i===items.length-1?'disabled':''}>▼</button></div><div class="roy-menu-main"><b>${x.icon?escapeHtml(x.icon)+' ':''}${escapeHtml(x.label)}</b><small>${x.type==='category'?'Categoría: ':x.type==='page'?'Página: ':'Enlace: '}${escapeHtml(x.target)}</small></div><span class="status ${x.active?'ok':'cancelled'}">${x.active?'Visible':'Oculto'}</span><div class="roy-menu-actions"><button class="btn btn-sm btn-secondary" onclick="toggleMenuItem('${x.id}')">${x.active?'Ocultar':'Mostrar'}</button><button class="btn btn-sm btn-secondary" onclick="openMenuItemForm('${x.id}')">Editar</button><button class="btn btn-sm btn-danger" onclick="deleteMenuItem('${x.id}')">Eliminar</button></div></div>`).join(''):'<div class="empty">No hay opciones configuradas.</div>';
  preview.innerHTML=items.filter(x=>x.active).map(x=>`<span class="${x.highlight?'highlight':''}">${x.icon?escapeHtml(x.icon)+' ':''}${escapeHtml(x.label)}</span>`).join('');
 };
 function boot(){installAdminView();renderPublicMenu();setTimeout(()=>{renderPublicMenu();renderAdminNavigation();},1200);window.addEventListener('firebase-auth-changed',()=>setTimeout(installAdminView,100));}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
 const oldRenderEverything=window.renderEverything;if(typeof oldRenderEverything==='function')window.renderEverything=function(){const r=oldRenderEverything.apply(this,arguments);setTimeout(renderPublicMenu,0);return r;};
 const oldApplySettings=window.applySettings;if(typeof oldApplySettings==='function')window.applySettings=function(){const r=oldApplySettings.apply(this,arguments);setTimeout(renderPublicMenu,0);return r;};
 let refreshCount=0;const refreshTimer=setInterval(()=>{renderPublicMenu();if(++refreshCount>=8)clearInterval(refreshTimer);},1500);
})();
