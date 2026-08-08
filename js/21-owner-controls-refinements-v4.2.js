(() => {
'use strict';
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const now=()=>new Date().toISOString();
window.toggleStoreSearch=function(){const box=$('.store-search-compact');if(!box)return;box.classList.toggle('search-open');if(box.classList.contains('search-open'))setTimeout(()=>$('#storeSearch')?.focus(),30)};
window.goDirectlyToStore=function(){try{if(typeof closeAdmin==='function')closeAdmin();setTimeout(()=>{if(typeof showPage==='function')showPage('tienda');location.hash='tienda';window.scrollTo({top:0,behavior:'smooth'})},60)}catch(e){location.href='index.html#tienda'}};

async function auditRelevant(action,targetName,changes=[]){
 try{const u=window._auth?.currentUser;if(!u||!window._firebaseReady)return;const id='audit_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);await window._fb.setDoc(window._fb.doc(window._db,'sadi_user_audit',id),{id,action,targetUid:'',targetName:targetName||'Sistema',targetEmail:'',actorUid:u.uid,actorEmail:u.email||'',reason:'Operación administrativa',changes,createdAt:now(),securityVersion:4})}catch(e){console.warn('Auditoría no disponible:',e.message)}
}
window.openCategoryEditor=function(id){const c=(window.state?.categories||[]).find(x=>x.id===id);if(!c)return;$('#editCategoryId').value=c.id;$('#editCategoryName').value=c.name||'';$('#editCategoryActive').value=String(c.active!==false);$('#editCategoryUpdateProducts').checked=true;openModal('categoryEditModal')};
window.saveCategoryEdition=async function(){
 const id=$('#editCategoryId')?.value,name=$('#editCategoryName')?.value.trim(),active=$('#editCategoryActive')?.value==='true',updateProducts=$('#editCategoryUpdateProducts')?.checked;
 const c=(window.state?.categories||[]).find(x=>x.id===id);if(!c||!name)return showToast('Completa el nombre de la categoría.');
 if(window.state.categories.some(x=>x.id!==id&&String(x.name).toLowerCase()===name.toLowerCase()))return showToast('Ya existe una categoría con ese nombre.');
 const oldName=c.name;c.name=name;c.active=active;c.updatedAt=now();
 try{await putRecord('categories',c);if(updateProducts&&oldName!==name){const affected=window.state.products.filter(p=>p.category===oldName);for(const p of affected){p.category=name;p.updatedAt=now();await putRecord('products',p)}}fillCategorySelects();renderCategories();renderAdminProducts();closeModal('categoryEditModal');showToast('Categoría actualizada correctamente.');auditRelevant('CATEGORY_UPDATE',name,[`Nombre: ${oldName} → ${name}`,`Estado: ${active?'Activa':'Inactiva'}`,updateProducts?'Productos relacionados actualizados':'Productos no modificados'])}catch(e){showToast('No se pudo editar la categoría: '+(e.message||e))}
};
window.renderCategories=function(){const box=$('#catalogCategories');if(!box)return;box.innerHTML=`<div class="panel"><div class="panel-head"><h3>Categorías</h3><div style="display:flex;gap:7px;flex-wrap:wrap"><input class="field" id="newCategory" placeholder="Nueva categoría"><button class="btn btn-primary btn-sm" onclick="addCategory()">Agregar</button></div></div><div>${(window.state?.categories||[]).map(c=>`<div class="category-admin-row"><div><b>${esc(c.name)}</b><div class="muted" style="font-size:9px;margin-top:4px">${c.active!==false?'Visible en la tienda':'Oculta en la tienda'}</div></div><div class="category-admin-actions"><span class="status ${c.active!==false?'confirmado':'cancelado'}">${c.active!==false?'Activa':'Inactiva'}</span><button class="btn btn-secondary btn-sm" onclick="openCategoryEditor('${esc(c.id)}')">Editar</button><button class="btn btn-danger btn-sm" onclick="deleteCategory('${esc(c.id)}')">Eliminar</button></div></div>`).join('')||'<div class="empty">No hay categorías.</div>'}</div></div>`};

function wrap(name,action,describe){const original=window[name];if(typeof original!=='function'||original.__auditWrapped)return;const wrapped=async function(...args){const before=describe?.(...args)||name;const result=await original.apply(this,args);auditRelevant(action,before,[`Función: ${name}`]);return result};wrapped.__auditWrapped=true;window[name]=wrapped}
function installAudit(){
 [['saveProduct','PRODUCT_SAVE',()=>$('#pName')?.value||'Producto'],['deleteProduct','PRODUCT_DELETE',id=>(window.state?.products||[]).find(x=>x.id===id)?.name||id],['addCategory','CATEGORY_CREATE',()=>$('#newCategory')?.value||'Categoría'],['deleteCategory','CATEGORY_DELETE',id=>(window.state?.categories||[]).find(x=>x.id===id)?.name||id],['updateOrderStatus','ORDER_STATUS',(id,s)=>`${id}: ${s}`],['confirmPayment','PAYMENT_STATUS',id=>id],['saveSettings','SETTINGS_UPDATE',()=> 'Configuración general'],['saveShippingSettings','SHIPPING_UPDATE',()=> 'Configuración de envíos']].forEach(x=>wrap(...x));
}
function renameHeroDefaults(){document.querySelectorAll('.hero-ctas button').forEach(b=>{const t=b.textContent.trim().toLowerCase();if(t.includes('lookbook'))b.textContent='IR A GALERÍA';else if(t.includes('explorar')||t.includes('productos')||t.includes('colección'))b.textContent='IR A TIENDA'})}
const originalRenderHero=window.renderHeroSlider;if(typeof originalRenderHero==='function'){window.renderHeroSlider=function(){const r=originalRenderHero.apply(this,arguments);setTimeout(renameHeroDefaults,0);return r}}
function init(){installAudit();renameHeroDefaults();if(location.hash==='#tienda')setTimeout(()=>showPage?.('tienda'),150)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
