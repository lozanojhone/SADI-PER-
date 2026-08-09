(() => {
'use strict';
const $=s=>document.querySelector(s);
let usersViewLoading=false;
function populateProductCategory(){
 const el=$('#pCategory'); if(!el) return;
 const current=el.value||'';
 const cats=[...new Set([...(window.state?.categories||[]).filter(c=>c.active!==false).map(c=>c.name),...(window.state?.products||[]).map(p=>p.category)].filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'es'));
 el.innerHTML='<option value="">Selecciona una categoría</option>'+cats.map(c=>`<option value="${String(c).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">${String(c).replace(/&/g,'&amp;').replace(/</g,'&lt;')}</option>`).join('');
 if(current){if(!cats.includes(current)){const o=document.createElement('option');o.value=current;o.textContent=current;el.appendChild(o)}el.value=current}
}
const oldFill=window.fillCategorySelects;
window.fillCategorySelects=function(){const r=typeof oldFill==='function'?oldFill.apply(this,arguments):undefined;populateProductCategory();return r};
const oldEdit=window.editProduct;
window.editProduct=function(id){if(typeof oldEdit==='function')oldEdit.apply(this,arguments);setTimeout(populateProductCategory,0);setTimeout(()=>{const p=(window.state?.products||[]).find(x=>x.id===id);if(p&&$('#pCategory'))$('#pCategory').value=p.category||''},30)};
const oldOpen=window.openProductForm;
window.openProductForm=function(){const r=typeof oldOpen==='function'?oldOpen.apply(this,arguments):undefined;setTimeout(populateProductCategory,0);return r};
document.addEventListener('DOMContentLoaded',()=>{populateProductCategory();const usersBtn=$('#adminMenu button[data-view="users"]');if(usersBtn)usersBtn.setAttribute('type','button')});
})();
