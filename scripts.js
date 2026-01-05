// Shared JS for site: nav helpers, Firebase initialization, and Firestore helpers

// 1) NAV: highlight current page (simple)
(function(){
  const links = document.querySelectorAll('nav a');
  for(const a of links){
    if(a.href === location.href || a.href === location.pathname.split('/').pop()){
      a.style.textDecoration = 'underline';
    }
  }
})();

// 2) FIREBASE: your project's configuration (pasted from Firebase console)
//    Ensure Firestore is enabled in the Firebase console.

const firebaseConfig = {
  apiKey: "AIzaSyCBNrmVhy0sHHsgrJAU9KEP3oBCxkKb2Wk",
  authDomain: "pamelaministry.firebaseapp.com",
  projectId: "pamelaministry",
  storageBucket: "pamelaministry.firebasestorage.app",
  messagingSenderId: "1042958201724",
  appId: "1:1042958201724:web:3e80068a8d1f5cb4ebaaf9",
  measurementId: "G-Z9EFB8T3D4"
};


// Use the compat libs in the page to initialize (pages include the CDN script tags).
function initFirebase(){
  if(!window.firebase){
    console.warn('Firebase SDK not loaded. Add Firebase scripts to your pages or check your network.');
    return null;
  }
  try{
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    console.log('Firestore initialized for project:', firebaseConfig.projectId);
    return db;
  }catch(e){
    // maybe already initialized
    try{ const db = firebase.firestore(); console.log('Firestore already initialized'); return db; }catch(err){ console.error('Firestore init error',err); return null }
  }
}

const db = initFirebase();

// 3) Firestore helpers
const LOCAL_COMMENTS_KEY = 'gma_comments';
const LOCAL_MESSAGES_KEY = 'gma_messages';
const LOCAL_EVENTS_KEY = 'gma_events';

// Events: saveEvent, getUpcomingEvents (Firestore with localStorage fallback)
async function saveEvent({title,date,location,link,createdAt=new Date()}){
  if(db){
    return db.collection('events').add({title,date,location,link,createdAt});
  }else{
    const arr = JSON.parse(localStorage.getItem(LOCAL_EVENTS_KEY) || '[]');
    const entry = {id:Date.now().toString(),title,date,location,link,createdAt};
    arr.unshift(entry);
    localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(arr));
    return Promise.resolve(entry);
  }
}
async function getUpcomingEvents(){
  if(db){
    const snap = await db.collection('events').orderBy('date','asc').get();
    return snap.docs.map(d=>({id:d.id,...d.data()}));
  }else{
    const arr = JSON.parse(localStorage.getItem(LOCAL_EVENTS_KEY)||'[]');
    // sort by date ascending
    return arr.sort((a,b)=> (a.date<b.date ? -1 : (a.date>b.date?1:0)));
  }
}

async function saveComment({videoId,name,message,createdAt=new Date()}){
  if(db){
    return db.collection('comments').add({videoId,name,message,createdAt});
  }else{
    const arr = JSON.parse(localStorage.getItem(LOCAL_COMMENTS_KEY) || '[]');
    const entry = {id:Date.now().toString(),videoId,name,message,createdAt};
    arr.unshift(entry);
    localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(arr));
    return Promise.resolve(entry);
  }
}
async function getCommentsForVideo(videoId){
  if(db){
    const snap = await db.collection('comments').where('videoId','==',videoId).orderBy('createdAt','desc').get();
    return snap.docs.map(d=>({id:d.id,...d.data()}));
  }else{
    const arr = JSON.parse(localStorage.getItem(LOCAL_COMMENTS_KEY)||'[]');
    return arr.filter(x=>x.videoId===videoId);
  }
}
async function saveContactMessage(data){
  if(db){
    return db.collection('messages').add(data);
  }else{
    const arr = JSON.parse(localStorage.getItem(LOCAL_MESSAGES_KEY)||'[]');
    const entry = {...data,id:Date.now().toString()};
    arr.unshift(entry);
    localStorage.setItem(LOCAL_MESSAGES_KEY,JSON.stringify(arr));
    return Promise.resolve(entry);
  }
}

// 4) Utility: format date
function fmtDate(d){ try{ return new Date(d.seconds ? d.seconds*1000 : d).toLocaleString(); }catch(e){ return String(d); }}
