
(function(){
 const Q=s=>document.querySelector(s), QA=s=>[...document.querySelectorAll(s)];
 const rolePermissions={
  'Administrador':['*'],
  'Ventas':['dashboard','orders','clients','sales','payments','shipping','messages'],
  'Inventario':['dashboard','catalog','inventory','orders'],
  'Contenido':['dashboard','catalog','gallery','promotions','settings'],
  'Atención al cliente':['dashboard','orders','clients','messages','reviews']
 };
 function canView(view){const p=window._firebasePermissions||[];return p.includes('*')||p.includes(view)}
 window.canView=canView;
 const originalRefresh=window.refreshFirebaseAdminSession;
 window.refreshFirebaseAdminSession=async function(){
  if(!window._firebaseReady||!window._auth?.currentUser){window._firebaseAdmin=false;return false}
  try{
   const uid=window._auth.currentUser.uid;
   const adminSnap=await window._fb.getDoc(window._fb.doc(window._db,'sadi_admins',uid));
   const admin=adminSnap.exists()?adminSnap.data():null;
   if(admin?.active===true&&admin.role==='admin'){window._firebaseAdmin=true;window._firebaseRole='Administrador';window._firebasePermissions=['*'];return true}
   let staffSnap=await window._fb.getDoc(window._fb.doc(window._db,'sadi_users',uid));
   if(!staffSnap.exists()&&window._auth.currentUser.email)staffSnap=await window._fb.getDoc(window._fb.doc(window._db,'sadi_users',String(window._auth.currentUser.email).toLowerCase()));
   const staff=staffSnap.exists()?staffSnap.data():null;
   if(staff?.active===true){window._firebaseAdmin=true;window._firebaseRole=staff.role||'Empleado';window._firebasePermissions=Array.isArray(staff.permissions)&&staff.permissions.length?staff.permissions:(rolePermissions[staff.role]||[]);return true}
   window._firebaseAdmin=false;window._firebaseRole=null;window._firebasePermissions=[];return false;
  }catch(e){console.warn(e);window._firebaseAdmin=false;return false}
 };
 const oldShowAdminView=window.showAdminView;
 window.showAdminView=function(name,btn){if(!canView(name)){showToast('Tu rol no tiene permiso para abrir esta sección.');return}return oldShowAdminView.call(this,name,btn)};
 function applyRoleMenu(){QA('#adminMenu button[data-view]').forEach(b=>b.style.display=canView(b.dataset.view)?'':'none');const label=Q('#syncLabel');if(label&&window._firebaseRole)label.textContent='Firebase activo · '+window._firebaseRole}
 const oldShowAdminApp=window.showAdminApp;
 window.showAdminApp=async function(){
  if(!adminSessionValid())return showAdminLoginError('Sesión no autorizada.');
  Q('#adminLogin').classList.add('hidden');Q('#adminApp').classList.remove('hidden');
  renderAllAdmin();applyRoleMenu();setSyncLabel(true);
  reloadProtectedAdminData().then(()=>{renderAllAdmin();applyRoleMenu();setSyncLabel(true)}).catch(console.warn);
 };
 window.openUserForm=function(id=''){
  const u=state.users.find(x=>x.id===id)||{};Q('#userId').value=u.id||'';Q('#userName').value=u.name||'';Q('#userEmail').value=u.email||'';Q('#userEmail').disabled=!!u.id;Q('#userPassword').value='';Q('#userPassword').closest('.form-group').style.display=u.id?'none':'';Q('#userRole').value=u.role||'Ventas';Q('#userActive').value=String(u.active!==false);Q('#userModalTitle').textContent=u.id?'EDITAR USUARIO':'AGREGAR USUARIO';Q('#userSaveStatus').textContent='';openModal('userModal')
 };
 window.saveSystemUser=async function(){
  if(!canView('users'))return showToast('No tienes permiso para administrar usuarios.');
  const id=Q('#userId').value.trim(),name=Q('#userName').value.trim(),email=Q('#userEmail').value.trim().toLowerCase(),pass=Q('#userPassword').value,role=Q('#userRole').value,active=Q('#userActive').value==='true',btn=Q('#saveUserBtn'),status=Q('#userSaveStatus');
  const emailOk=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if(!name||!email)return status.textContent='Completa el nombre y el correo.';
  if(!emailOk)return status.textContent='Escribe un correo válido.';
  if(!id&&pass.length<6)return status.textContent='La contraseña debe tener al menos 6 caracteres.';
  if(!window._firebaseReady||!window._db||!window._auth)return status.textContent='No hay conexión con Firebase. Revisa Internet y vuelve a intentar.';
  btn.disabled=true;btn.classList.add('v27-saving');status.textContent=id?'Actualizando usuario...':'Creando cuenta de acceso...';
  const withTimeout=(promise,ms=25000)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(Object.assign(new Error('La operación tardó demasiado.'),{code:'timeout'})),ms))]);
  let secondary=null,uidValue=id,authCreated=false,docId=id;
  try{
   if(!id){
    try{
     secondary=window._firebaseInitializeApp(window._firebaseConfig,'sadi-user-'+Date.now()+'-'+Math.random().toString(36).slice(2));
     const secondaryAuth=window._firebaseGetAuth(secondary);
     const cred=await withTimeout(window._fb.createUserWithEmailAndPassword(secondaryAuth,email,pass));
     uidValue=cred.user.uid;docId=uidValue;authCreated=true;
     await window._fb.signOut(secondaryAuth).catch(()=>{});
    }catch(e){
     if(e?.code==='auth/email-already-in-use'){
      // Permite asignar rol a una cuenta de Authentication que ya existe.
      docId=email;uidValue='';status.textContent='El correo ya existía. Asignando el rol...';
     }else{throw e}
    }finally{
     if(secondary)await window._firebaseDeleteApp(secondary).catch(()=>{});
    }
   }
   const previous=state.users.find(x=>x.id===id)||{};
   const record={id:docId,uid:uidValue||previous.uid||'',name,email,role,active,permissions:rolePermissions[role]||[],updatedAt:new Date().toISOString(),createdAt:previous.createdAt||new Date().toISOString()};
   status.textContent='Guardando rol y permisos...';
   await withTimeout(window._fb.setDoc(window._fb.doc(window._db,'sadi_users',docId),record,{merge:true}));
   const verify=await withTimeout(window._fb.getDoc(window._fb.doc(window._db,'sadi_users',docId)),12000);
   if(!verify.exists())throw Object.assign(new Error('Firebase no confirmó el registro del usuario.'),{code:'verify-failed'});
   const saved={id:verify.id,...verify.data()};
   const i=state.users.findIndex(x=>x.id===id||x.id===docId||String(x.email||'').toLowerCase()===email);
   if(i>=0)state.users[i]=saved;else state.users.unshift(saved);
   saveLocal('users',state.users);renderUsers();status.textContent='Usuario guardado correctamente.';
   showToast(authCreated?'Usuario creado con acceso y rol.':'Usuario actualizado correctamente.');
   setTimeout(()=>closeModal('userModal'),450);
  }catch(e){
   console.error('No se pudo guardar usuario:',e);
   const messages={
    'auth/operation-not-allowed':'Activa Correo/Contraseña en Firebase → Autenticación → Método de acceso.',
    'auth/weak-password':'La contraseña debe tener al menos 6 caracteres.',
    'auth/invalid-email':'El correo no es válido.',
    'auth/network-request-failed':'No se pudo conectar con Firebase. Revisa Internet.',
    'auth/too-many-requests':'Firebase bloqueó temporalmente los intentos. Espera unos minutos.',
    'permission-denied':'Tu cuenta no tiene permiso para registrar usuarios. Publica las reglas incluidas.',
    'firestore/permission-denied':'Tu cuenta no tiene permiso para registrar usuarios. Publica las reglas incluidas.',
    'timeout':'La operación tardó demasiado. Revisa Internet y vuelve a intentar.'
   };
   status.textContent='NO SE GUARDÓ: '+(messages[e?.code]||firebaseAuthErrorText(e)||e?.message||'Error desconocido.');
  }finally{btn.disabled=false;btn.classList.remove('v27-saving')}
 };
 window.renderUsers=function(){const box=Q('#usersList');if(!box)return;box.innerHTML=state.users.length?state.users.map(u=>`<div class="order-card"><div class="order-top"><div><b>${esc(u.name)}</b><div class="muted" style="font-size:10px;margin-top:4px">${esc(u.email||u.username||'Sin correo')}</div></div><span class="role-badge">${esc(u.role||'Empleado')}</span></div><div class="muted" style="font-size:9px">${u.active!==false?'Cuenta activa':'Cuenta inactiva'} · Acceso: ${(u.permissions||[]).includes('*')?'Todo el sistema':esc((u.permissions||[]).join(', ')||'Según rol')}</div><div class="user-actions"><button class="btn btn-secondary btn-sm" onclick="openUserForm('${u.id}')">Editar</button><button class="btn btn-secondary btn-sm" onclick="toggleSystemUser('${u.id}')">${u.active!==false?'Desactivar':'Activar'}</button><button class="btn btn-danger btn-sm" onclick="deleteSystemUser('${u.id}')">Eliminar acceso</button></div></div>`).join(''):'<div class="empty">No hay usuarios adicionales.</div>'};
 window.toggleSystemUser=async function(id){const u=state.users.find(x=>x.id===id);if(!u)return;u.active=u.active===false;u.updatedAt=new Date().toISOString();await window._fb.setDoc(window._fb.doc(window._db,'sadi_users',id),u,{merge:true});saveLocal('users',state.users);renderUsers();showToast(u.active?'Usuario activado.':'Usuario desactivado.')};
 window.deleteSystemUser=async function(id){if(!confirm('¿Eliminar el acceso de este usuario? La cuenta de Authentication permanecerá, pero ya no podrá entrar al sistema.'))return;await window._fb.deleteDoc(window._fb.doc(window._db,'sadi_users',id));state.users=state.users.filter(x=>x.id!==id);saveLocal('users',state.users);renderUsers();showToast('Acceso eliminado correctamente.')};
 window.renderPayments=function(){const pending=state.orders.filter(o=>o.paymentStatus!=='Confirmado'),confirmed=state.orders.filter(o=>o.paymentStatus==='Confirmado'),totalPending=pending.reduce((s,o)=>s+Number(o.total||0),0);if(Q('#paymentKpis'))Q('#paymentKpis').innerHTML=kpi('Pagos pendientes',pending.length,money(totalPending))+kpi('Pagos confirmados',confirmed.length,money(confirmed.reduce((s,o)=>s+Number(o.total||0),0)))+kpi('Yape',state.orders.filter(o=>o.payment==='Yape').length,'Pedidos')+kpi('Plin',state.orders.filter(o=>o.payment==='Plin').length,'Pedidos');if(Q('#paymentsBody'))Q('#paymentsBody').innerHTML=state.orders.length?state.orders.map(o=>`<tr><td><b>${esc(o.id)}</b></td><td>${esc(o.client?.name)}</td><td>${esc(o.payment)}</td><td class="orange"><b>${money(o.total)}</b></td><td><span class="status ${o.paymentStatus==='Confirmado'?'confirmado':'pendiente'}">${esc(o.paymentStatus||'Pendiente')}</span></td><td>${dateText(o.createdAt)}</td><td><div class="payment-actions">${o.paymentStatus==='Confirmado'?'<span class="status confirmado">Pago confirmado</span>':`<button class="btn btn-primary btn-sm" onclick="confirmPayment('${o.id}')">Confirmar pago</button><button class="btn btn-danger btn-sm" onclick="deletePendingPayment('${o.id}')">Eliminar pendiente</button>`}</div></td></tr>`).join(''):'<tr><td colspan="7" class="muted">Sin pagos.</td></tr>'};
 window.confirmPayment=async function(id){const o=state.orders.find(x=>x.id===id);if(!o||o.paymentStatus==='Confirmado')return;o.paymentStatus='Confirmado';if(o.status==='Pendiente')o.status='Confirmado';o.paymentConfirmedAt=new Date().toISOString();await putRecord('orders',o);saveLocal('orders',state.orders);renderEverything();showToast('Pago confirmado correctamente.')};
 window.deletePendingPayment=async function(id){const o=state.orders.find(x=>x.id===id);if(!o||o.paymentStatus==='Confirmado')return;if(!confirm('¿Eliminar este pago pendiente y su pedido? Esta acción no se puede deshacer.'))return;await removeRecord('orders',id);state.orders=state.orders.filter(x=>x.id!==id);saveLocal('orders',state.orders);renderEverything();showToast('Pago pendiente eliminado.')};
 // Refuerzo de historial: mantiene una barrera interna y vuelve a Inicio antes de abandonar.
 function pageNow(){return QA('.page.active')[0]?.id?.replace('page-','')||'inicio'}
 function ensureGuard(){const base=location.href.split('#')[0];if(!history.state?.royV27){history.replaceState({royV27:true,royPage:'inicio'},'',base+'#inicio');history.pushState({royV27:true,royPage:pageNow()},'',base+'#'+pageNow())}}
 ensureGuard();window.addEventListener('pageshow',ensureGuard);window.addEventListener('popstate',function(e){if(e.state?.royV27)return;showPage('inicio',{fromPop:true});history.pushState({royV27:true,royPage:'inicio'},'',location.href.split('#')[0]+'#inicio')},true);
 document.addEventListener('DOMContentLoaded',()=>{ensureGuard();setTimeout(applyRoleMenu,300)});
})();
