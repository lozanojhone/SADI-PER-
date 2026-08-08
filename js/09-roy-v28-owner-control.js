
(function(){
 const OWNER_UID='sr7PqTYzkySBndnmFDcaVz8v6Iz2';
 const Q=s=>document.querySelector(s), QA=s=>[...document.querySelectorAll(s)];
 function isOwner(){return window._auth?.currentUser?.uid===OWNER_UID}
 function grantOwner(){
   if(!isOwner())return false;
   window._firebaseAdmin=true;
   window._firebaseRole='Propietario';
   window._firebasePermissions=['*'];
   return true;
 }
 function updateOwnerInterface(){
   if(!grantOwner())return;
   QA('#adminMenu button[data-view]').forEach(btn=>{btn.style.removeProperty('display');btn.hidden=false});
   const sync=Q('#syncLabel');if(sync)sync.textContent='Firebase activo · Control total';
   const profile=Q('.admin-profile > span:last-child');
   if(profile)profile.innerHTML='<b>Admin SADI</b><br><span class="owner-badge"><i class="fa-solid fa-crown"></i> Propietario</span>';
 }
 const previousRefresh=window.refreshFirebaseAdminSession;
 window.refreshFirebaseAdminSession=async function(){
   if(grantOwner()){updateOwnerInterface();return true}
   return typeof previousRefresh==='function'?previousRefresh.apply(this,arguments):false;
 };
 const previousCanView=window.canView;
 window.canView=function(view){return isOwner()||window._firebasePermissions?.includes('*')||(typeof previousCanView==='function'&&previousCanView(view))};
 const previousShow=window.showAdminApp;
 window.showAdminApp=async function(){
   grantOwner();
   const result=await previousShow.apply(this,arguments);
   updateOwnerInterface();
   setTimeout(updateOwnerInterface,100);
   setTimeout(updateOwnerInterface,700);
   return result;
 };
 const previousView=window.showAdminView;
 window.showAdminView=function(name,btn){
   if(isOwner())grantOwner();
   return previousView.call(this,name,btn);
 };
 window.addEventListener('firebase-auth-changed',()=>{
   if(isOwner()){
     grantOwner();
     updateOwnerInterface();
     if(!Q('#adminApp')?.classList.contains('hidden'))renderAllAdmin();
   }
 });
 document.addEventListener('DOMContentLoaded',()=>{setTimeout(updateOwnerInterface,100);setTimeout(updateOwnerInterface,900)});
 window.forceOwnerControl=function(){grantOwner();updateOwnerInterface();renderAllAdmin();showToast('Control total del propietario activado.')};
})();
