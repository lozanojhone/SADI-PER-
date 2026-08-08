(() => {
'use strict';
const OWNER_UID='sr7PqTYzkySBndnmFDcaVz8v6Iz2';
const ROLE_DEFAULTS={
 'Administrador':['*'],
 'Ventas':['dashboard','orders','clients','sales','payments','shipping','messages'],
 'Inventario':['dashboard','catalog','inventory','orders'],
 'Contenido':['dashboard','catalog','gallery','promotions','settings'],
 'Atención al cliente':['dashboard','orders','clients','messages','reviews'],
 'Personalizado':[]
};
const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
const clean=v=>String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
const timeout=(p,ms=20000)=>Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(new Error('La operación tardó demasiado.')),ms))]);
function normalizePermissions(v){if(Array.isArray(v))return v.filter(Boolean);if(v&&typeof v==='object')return Object.entries(v).filter(([,x])=>!!x).map(([k])=>k);return String(v||'').split(/[,;|\n]/).map(x=>x.trim()).filter(Boolean)}
function normalizeUser(d){const x=d.data?d.data():d,id=d.id||x.id||x.uid||x.email||'';return {id,uid:x.uid||id,name:x.name||x.fullName||x.nombre||'Usuario',email:x.email||x.correo||x.username||'',role:x.role||x.rol||'Empleado',active:x.active!==false&&x.enabled!==false&&x.disabled!==true,permissions:normalizePermissions(x.permissions||x.permisos),createdAt:x.createdAt||'',updatedAt:x.updatedAt||''}}
function status(msg,type='ok'){const el=q('#userSaveStatus');if(el){el.textContent=msg;el.dataset.type=type}if(typeof showToast==='function')showToast(msg)}
async function fetchUsers(){
 if(!window._firebaseReady||!window._db||!window._fb)throw new Error('Firebase no está disponible.');
 const snap=await timeout(window._fb.getDocs(window._fb.collection(window._db,'sadi_users')));
 const users=snap.docs.map(normalizeUser);
 const byEmail=new Map();
 for(const u of users){const key=(u.email||u.id).toLowerCase();const old=byEmail.get(key);if(!old||(!old.uid&&u.uid))byEmail.set(key,u)}
 return [...byEmail.values()];
}
async function syncUsers(show=true){
 const btn=qa('button').find(b=>/actualizar usuarios y roles/i.test(b.textContent||''));const old=btn?.textContent;
 if(btn){btn.disabled=true;btn.textContent='ACTUALIZANDO...'}
 try{const users=await fetchUsers();state.users=users;saveLocal('users',users);renderUsers();if(show)status(`${users.filter(u=>u.uid!==OWNER_UID).length} usuario(s) cargado(s) correctamente.`);return users}
 catch(e){console.error(e);status('NO SE ACTUALIZÓ: '+e.message,'error');return []}
 finally{if(btn){btn.disabled=false;btn.textContent=old||'ACTUALIZAR USUARIOS Y ROLES'}}
}
window.renderUsers=function(){
 const box=q('#usersList');if(!box)return;
 const users=(state.users||[]).filter(u=>u.uid!==OWNER_UID&&u.id!==OWNER_UID);
 box.innerHTML=users.length?users.map(u=>`<article class="v3-user-card"><div><b>${clean(u.name)}</b><div class="muted">${clean(u.email||'Sin correo')}</div><small>${clean((u.permissions||[]).includes('*')?'Control total':(u.permissions||[]).join(' · ')||'Sin permisos')}</small></div><div class="v3-user-tags"><span>${clean(u.role)}</span><span class="${u.active!==false?'on':'off'}">${u.active!==false?'ACTIVO':'DESHABILITADO'}</span></div><div class="v3-user-actions"><button class="btn btn-secondary btn-sm" onclick="openUserForm('${clean(u.id)}')">Editar</button><button class="btn btn-secondary btn-sm" onclick="toggleSystemUser('${clean(u.id)}')">${u.active!==false?'Deshabilitar':'Activar'}</button><button class="btn btn-danger btn-sm" onclick="deleteSystemUser('${clean(u.id)}')">Eliminar acceso</button></div></article>`).join(''):'<div class="empty">No hay usuarios adicionales guardados.</div>';
};
window.toggleSystemUser=async function(id){
 const u=(state.users||[]).find(x=>x.id===id);if(!u||u.uid===OWNER_UID)return status('La cuenta propietaria está protegida.','error');
 const next=u.active===false;if(!confirm(next?'¿Activar este usuario?':'¿Deshabilitar este usuario?'))return;
 try{const ref=window._fb.doc(window._db,'sadi_users',id);await timeout(window._fb.setDoc(ref,{active:next,enabled:next,updatedAt:new Date().toISOString()},{merge:true}));const v=await timeout(window._fb.getDoc(ref));if(!v.exists()||v.data().active!==next)throw new Error('Firebase no confirmó el estado.');status(next?'Usuario activado correctamente.':'Usuario deshabilitado correctamente.');await syncUsers(false)}catch(e){status('NO SE CAMBIÓ EL ESTADO: '+e.message,'error')}
};
window.deleteSystemUser=async function(id){
 const u=(state.users||[]).find(x=>x.id===id);if(!u||u.uid===OWNER_UID)return status('La cuenta propietaria está protegida.','error');
 if(!confirm('¿Eliminar el acceso, rol y permisos de este usuario?'))return;
 try{const ref=window._fb.doc(window._db,'sadi_users',id);await timeout(window._fb.deleteDoc(ref));const v=await timeout(window._fb.getDoc(ref));if(v.exists())throw new Error('Firebase todavía conserva el documento.');status('Acceso, rol y permisos eliminados correctamente.');await syncUsers(false)}catch(e){status('NO SE ELIMINÓ: '+e.message,'error')}
};
const previousSave=window.saveSystemUser;
window.saveSystemUser=async function(){
 const btn=q('#saveUserBtn');if(btn?.dataset.busy==='1')return;if(btn)btn.dataset.busy='1';
 try{if(typeof previousSave!=='function')throw new Error('No se encontró el formulario de usuarios.');await previousSave();setTimeout(()=>syncUsers(false),700)}finally{if(btn)delete btn.dataset.busy}
};
window.syncUsersFromFirestore=syncUsers;
function hook(){
 const b=qa('button').find(x=>/actualizar usuarios y roles/i.test(x.textContent||''));
 if(b&&!b.dataset.v3){b.dataset.v3='1';b.onclick=e=>{e.preventDefault();syncUsers(true)}}
}
document.addEventListener('DOMContentLoaded',()=>{hook();setTimeout(hook,500)});
window.addEventListener('firebase-ready',()=>setTimeout(()=>{if(q('#admin-users')?.classList.contains('active'))syncUsers(false)},500));
})();