import {initializeApp,deleteApp} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import {getFirestore,collection,getDocs,addDoc,setDoc,updateDoc,deleteDoc,doc,getDoc,serverTimestamp,writeBatch,onSnapshot} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js';
import {getAuth,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut,onAuthStateChanged,setPersistence,browserSessionPersistence,sendPasswordResetEmail,EmailAuthProvider,reauthenticateWithCredential,updatePassword} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';

/*
  SADI PERU - Firebase gratuito (Authentication + Firestore).
  Este proyecto NO usa Firebase Storage.

  Para evitar errores por una apiKey copiada manualmente, cuando el sitio se publica
  en Firebase Hosting se obtiene primero la configuracion oficial desde
  /__/firebase/init.json. Si no esta disponible (por ejemplo GitHub Pages o local),
  se usa la configuracion web de respaldo del proyecto SADI PERU.
*/
const FALLBACK_FIREBASE_CONFIG={
  apiKey:'AIzaSyALU0cQSg4P6mN0M8n2iZNuXkNV4_8vr_M',
  authDomain:'sadi-peru.firebaseapp.com',
  projectId:'sadi-peru',
  messagingSenderId:'977904336611',
  appId:'1:977904336611:web:f8d37975bb1cd146494fd6',
  measurementId:'G-TY3SBYL7WX'
};

async function resolveFirebaseConfig(){
  try{
    const response=await fetch('/__/firebase/init.json',{cache:'no-store'});
    if(response.ok){
      const hosted=await response.json();
      if(hosted&&hosted.apiKey&&hosted.projectId==='sadi-peru'){
        window._firebaseConfigSource='firebase-hosting';
        return {...FALLBACK_FIREBASE_CONFIG,...hosted};
      }
    }
  }catch(_error){}
  window._firebaseConfigSource='embedded-fallback';
  return FALLBACK_FIREBASE_CONFIG;
}

const firebaseConfig=await resolveFirebaseConfig();
const OWNER_UID='sr7PqTYzkySBndnmFDcaVz8v6Iz2';
try{
 const app=initializeApp(firebaseConfig),db=getFirestore(app),auth=getAuth(app);
 await setPersistence(auth,browserSessionPersistence);
 Object.assign(window,{
   _db:db,_auth:auth,_firebaseConfig:firebaseConfig,
   _firebaseInitializeApp:initializeApp,_firebaseDeleteApp:deleteApp,_firebaseGetAuth:getAuth,
   _fb:{collection,getDocs,addDoc,setDoc,updateDoc,deleteDoc,doc,getDoc,serverTimestamp,writeBatch,onSnapshot,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut,onAuthStateChanged,sendPasswordResetEmail,EmailAuthProvider,reauthenticateWithCredential,updatePassword},
   _firebaseReady:true,_firebaseAdmin:false,_firebaseRole:null,_firebasePermissions:[],_firebaseUser:null,_firebaseOwnerUid:OWNER_UID
 });
 onAuthStateChanged(auth,async user=>{
   window._firebaseUser=user||null;
   window._firebaseAdmin=false;
   window._firebaseRole=null;
   window._firebasePermissions=[];
   if(user?.uid===OWNER_UID){
     window._firebaseAdmin=true;
     window._firebaseRole='Propietario';
     window._firebasePermissions=['*'];
   }else if(user){
     try{
       const snap=await getDoc(doc(db,'sadi_admins',user.uid));
       const data=snap.exists()?snap.data():null;
       window._firebaseAdmin=!!(data&&data.active===true&&data.role==='admin');
       window._firebaseRole=window._firebaseAdmin?'Administrador':null;
       window._firebasePermissions=window._firebaseAdmin?['*']:[];
       if(!window._firebaseAdmin){
         let staffSnap=await getDoc(doc(db,'sadi_users',user.uid));
         if(!staffSnap.exists()&&user.email)staffSnap=await getDoc(doc(db,'sadi_users',String(user.email).toLowerCase()));
         const staff=staffSnap.exists()?staffSnap.data():null;
         if(staff&&staff.active===true){window._firebaseAdmin=true;window._firebaseRole=staff.role||'Empleado';window._firebasePermissions=Array.isArray(staff.permissions)?staff.permissions:[];}
       }
     }catch(error){console.warn('No se pudo validar el rol administrativo:',error.message);}
   }
   window.dispatchEvent(new CustomEvent('firebase-auth-changed',{detail:{user:window._firebaseUser,isAdmin:window._firebaseAdmin}}));
 });
 window.dispatchEvent(new Event('firebase-ready'));
}catch(error){
 console.warn('Firebase no disponible:',error);
 window._firebaseReady=false;window._firebaseAdmin=false;
 window._firebaseInitError=error;
 window.dispatchEvent(new Event('firebase-ready'));
}
