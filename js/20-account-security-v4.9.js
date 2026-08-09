(() => {
'use strict';
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const now=()=>new Date().toISOString();
function currentUser(){return window._auth?.currentUser||null}
function securityAdmin(){return window._auth?.currentUser && (window._firebasePermissions?.includes('*')||window._firebasePermissions?.includes('users'))}
function setStatus(message,error=false){const box=$('#passwordSecurityStatus');if(box){box.textContent=message;box.dataset.type=error?'error':'ok'}if(typeof showToast==='function')showToast(message)}
function strongPassword(v){return v.length>=12&&/[a-z]/.test(v)&&/[A-Z]/.test(v)&&/\d/.test(v)&&/[^A-Za-z0-9]/.test(v)}
function passwordScore(v){let n=0;if(v.length>=12)n++;if(v.length>=16)n++;if(/[a-z]/.test(v)&&/[A-Z]/.test(v))n++;if(/\d/.test(v))n++;if(/[^A-Za-z0-9]/.test(v))n++;return Math.min(5,n)}
async function audit(action,target,reason,changes){
 if(!window._firebaseReady||!currentUser())return;
 const id='audit_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
 const record={id,action,targetUid:target?.uid||'',targetName:target?.displayName||target?.name||target?.email||'Usuario',targetEmail:target?.email||'',actorUid:currentUser().uid,actorEmail:currentUser().email||'',reason,changes:Array.isArray(changes)?changes:[],createdAt:now(),securityVersion:3};
 await window._fb.setDoc(window._fb.doc(window._db,'sadi_user_audit',id),record);
}
function fillCurrentAccount(){const u=currentUser();const name=$('#securityCurrentName'),email=$('#securityCurrentEmail');if(name)name.textContent=u?.displayName||window._firebaseRole||'Usuario conectado';if(email)email.textContent=u?.email||'Correo no disponible'}
window.openMySecurity=function(){fillCurrentAccount();if(typeof openModal==='function')openModal('mySecurityModal')};
window.toggleSecurityPassword=function(id,button){const input=$('#'+id);if(!input)return;input.type=input.type==='password'?'text':'password';if(button)button.textContent=input.type==='password'?'Ver':'Ocultar'};
window.updatePasswordStrength=function(){const v=$('#newAdminPassword')?.value||'',score=passwordScore(v),fill=$('#passwordStrengthFill'),label=$('#passwordStrengthLabel');if(fill){fill.style.width=(score*20)+'%';fill.style.background=score<3?'#ef4444':score<5?'#f59e0b':'#E4C45C'}if(label)label.textContent=['Muy débil','Débil','Aceptable','Buena','Fuerte','Muy fuerte'][score]||'Aún no evaluada'};
window.changeMyAdminPassword=async function(){
 const user=currentUser(),current=$('#currentAdminPassword')?.value||'',next=$('#newAdminPassword')?.value||'',confirm=$('#confirmAdminPassword')?.value||'',check=$('#confirmPasswordChange'),btn=$('#changeMyPasswordBtn');
 if(!user?.email)return setStatus('No existe una sesión válida. Vuelve a iniciar sesión.',true);
 if(!current||!next||!confirm)return setStatus('Completa los tres campos de contraseña.',true);
 if(next!==confirm)return setStatus('La nueva contraseña y su confirmación no coinciden.',true);
 if(current===next)return setStatus('La nueva contraseña debe ser diferente de la actual.',true);
 if(!strongPassword(next))return setStatus('Usa al menos 12 caracteres, mayúscula, minúscula, número y símbolo.',true);
 const emailPart=String(user.email).split('@')[0].toLowerCase();if(emailPart.length>=4&&next.toLowerCase().includes(emailPart))return setStatus('La contraseña no debe contener tu correo o nombre de usuario.',true);
 if(!check?.checked)return setStatus('Confirma que eres el titular de la cuenta.',true);
 if(btn?.dataset.busy==='1')return;btn.dataset.busy='1';btn.disabled=true;setStatus('Validando tu contraseña actual...');
 try{
   const credential=window._fb.EmailAuthProvider.credential(user.email,current);
   await window._fb.reauthenticateWithCredential(user,credential);
   await window._fb.updatePassword(user,next);
   await audit('PASSWORD_CHANGE',user,'Cambio realizado por el propio titular',['Contraseña actualizada','Sesión cerrada después del cambio']).catch(e=>console.warn('No se pudo registrar la auditoría:',e.message));
   setStatus('Contraseña actualizada correctamente. Cerrando la sesión...');
   ['currentAdminPassword','newAdminPassword','confirmAdminPassword'].forEach(id=>{const e=$('#'+id);if(e)e.value=''});if(check)check.checked=false;
   setTimeout(async()=>{try{await window._fb.signOut(window._auth)}catch(e){};if(typeof closeAdmin==='function')closeAdmin();if(typeof showToast==='function')showToast('Contraseña cambiada. Ingresa nuevamente con la nueva clave.')},900);
 }catch(e){
   const code=String(e?.code||'');const msg=code==='auth/invalid-credential'?'La contraseña actual es incorrecta.':code==='auth/requires-recent-login'?'Por seguridad, cierra sesión e ingresa nuevamente antes de cambiar la contraseña.':code==='auth/weak-password'?'Firebase rechazó la contraseña por ser débil.':code==='auth/too-many-requests'?'Demasiados intentos. Espera unos minutos.':code==='auth/network-request-failed'?'No se pudo conectar con Firebase. Revisa tu internet.':(e?.message||'No se pudo cambiar la contraseña.');setStatus(msg,true)
 }finally{btn.disabled=false;delete btn.dataset.busy}
};
window.sendMyPasswordReset=async function(){const u=currentUser();if(!u?.email)return setStatus('No hay un correo asociado a esta sesión.',true);if(!confirm('Se enviará un enlace de recuperación a '+u.email+'. ¿Continuar?'))return;try{await window._fb.sendPasswordResetEmail(window._auth,u.email);await audit('PASSWORD_RESET_SENT',u,'Solicitud realizada por el propio titular',['Enlace de recuperación enviado']).catch(e=>console.warn('No se pudo registrar la auditoría:',e.message));setStatus('Enlace enviado a '+u.email+'. Revisa también la carpeta de spam.')}catch(e){setStatus('No se pudo enviar el enlace: '+(e?.message||'Error desconocido.'),true)}};
window.sendUserPasswordReset=async function(id){
 if(!securityAdmin())return setStatus('No tienes permiso para gestionar la seguridad de usuarios.',true);
 const u=(window.state?.users||[]).find(x=>x.id===id||x.uid===id);if(!u?.email)return setStatus('Este usuario no tiene un correo válido.',true);
 if(!confirm('Enviar un enlace de recuperación a '+u.email+'?'))return;
 try{await window._fb.sendPasswordResetEmail(window._auth,u.email);await audit('PASSWORD_RESET_SENT',u,'Enlace enviado por un administrador',['Recuperación de contraseña solicitada']).catch(e=>console.warn('No se pudo registrar la auditoría:',e.message));setStatus('Enlace de recuperación enviado a '+u.email+'.');if(typeof window.loadUserAudit==='function')window.loadUserAudit(false)}catch(e){setStatus('No se pudo enviar el enlace: '+(e?.message||'Error desconocido.'),true)}
};
function patchUserCards(){
 const original=window.renderUsers;if(typeof original!=='function'||original.__passwordPatch)return;
 const wrapped=function(){original();document.querySelectorAll('#usersList .v41-user-card').forEach(card=>{const edit=card.querySelector('[onclick^="openUserForm"]');if(!edit)return;const m=edit.getAttribute('onclick').match(/'([^']+)'/);const id=m?.[1];const actions=card.querySelector('.v41-user-actions');if(id&&actions&&!actions.querySelector('.reset-password-btn')){const b=document.createElement('button');b.className='btn btn-secondary btn-sm reset-password-btn';b.type='button';b.textContent='Enviar recuperación';b.onclick=()=>window.sendUserPasswordReset(id);actions.insertBefore(b,actions.firstChild)}})};wrapped.__passwordPatch=true;window.renderUsers=wrapped;
}
function init(){fillCurrentAccount();patchUserCards();window.addEventListener('firebase-auth-changed',()=>{fillCurrentAccount();setTimeout(patchUserCards,50)});document.addEventListener('click',event=>{if(event.target.closest('#adminMenu button[data-view=\"users\"]'))setTimeout(fillCurrentAccount,0)},{capture:true})}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
