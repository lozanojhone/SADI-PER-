
import {initializeApp,deleteApp} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import {getFirestore,collection,getDocs,addDoc,setDoc,updateDoc,deleteDoc,doc,getDoc,serverTimestamp,writeBatch,onSnapshot} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js';
import {getStorage,ref,uploadBytes,uploadBytesResumable,getDownloadURL} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js';
import {getAuth,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut,onAuthStateChanged,setPersistence,browserSessionPersistence,sendPasswordResetEmail,EmailAuthProvider,reauthenticateWithCredential,updatePassword} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';

/*
  CONFIGURACIÓN FIREBASE DE SADI PERÚ
  Reemplaza estos valores por los de: Firebase Console > Configuracion del proyecto > Tus apps > SDK.
  La apiKey de una app web Firebase no es una contrasena; la seguridad real depende de Authentication,
  las reglas de Firestore y las reglas de Storage incluidas en la guia entregada con este archivo.
*/
const firebaseConfig={apiKey:'AIzaSyALU0cQSg4P6mN0M8n2iZNuXkNV4_8vr_M',authDomain:'sadi-peru.firebaseapp.com',projectId:'sadi-peru',storageBucket:'sadi-peru.firebasestorage.app',messagingSenderId:'977904336611',appId:'1:977904336611:web:f8d37975bb1cd146494fd6',measurementId:'G-TY3SBYL7WX'};
try{
 const app=initializeApp(firebaseConfig),db=getFirestore(app),storage=getStorage(app),auth=getAuth(app);
 await setPersistence(auth,browserSessionPersistence);
 Object.assign(window,{_db:db,_storage:storage,_auth:auth,_firebaseConfig:firebaseConfig,_firebaseInitializeApp:initializeApp,_firebaseDeleteApp:deleteApp,_firebaseGetAuth:getAuth,_fb:{collection,getDocs,addDoc,setDoc,updateDoc,deleteDoc,doc,getDoc,serverTimestamp,writeBatch,onSnapshot,ref,uploadBytes,uploadBytesResumable,getDownloadURL,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut,onAuthStateChanged,sendPasswordResetEmail,EmailAuthProvider,reauthenticateWithCredential,updatePassword},_firebaseReady:true,_firebaseAdmin:false,_firebaseRole:null,_firebasePermissions:[],_firebaseUser:null});
 onAuthStateChanged(auth,async user=>{
   window._firebaseUser=user||null;
   window._firebaseAdmin=false;
   if(user){
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
}catch(error){console.warn('Firebase no disponible; se usara almacenamiento local de lectura.',error);window._firebaseReady=false;window._firebaseAdmin=false;window.dispatchEvent(new Event('firebase-ready'));}
