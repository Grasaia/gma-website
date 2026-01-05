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

// -----------------
// Portfolio gallery
// -----------------
const portfolioItems = [
  {id:'p1',title:'Sunday Service Highlights',desc:'A short collection of moments from Sunday services.',img:'img/gma-pfp.jpg'},
  {id:'p2',title:'Mission Trip 2025',desc:'Photos and short clips from the mission trip.',img:'img/gma-pfp.jpg'},
  {id:'p3',title:'Teaching Gallery',desc:'Selected sermon snapshots and resources.',img:'img/gma-pfp.jpg'}
];

function renderPortfolio(){
  const grid = document.getElementById('portfolioGrid');
  if(!grid) return;
  grid.innerHTML='';
  portfolioItems.forEach(item=>{
    const div = document.createElement('div'); div.className='gallery-item card';
    div.innerHTML = `<img src="${item.img}" alt="${item.title}"><div class="overlay"><strong>${item.title}</strong><div style="font-size:13px;margin-top:4px">${item.desc}</div></div>`;
    div.addEventListener('click',()=> openPortfolioModal(item));
    grid.appendChild(div);
  });
}

function openPortfolioModal(item){
  const dialog = document.getElementById('portfolioDialog');
  const inner = document.getElementById('portfolioModalInner');
  inner.innerHTML = `<h2>${item.title}</h2><p>${item.desc}</p>`;
  // if youtube id present, embed video
  if(item.youtubeId){ inner.innerHTML += `<div class="embed-wrap" style="margin-top:12px"><iframe src="https://www.youtube.com/embed/${item.youtubeId}" frameborder="0" allowfullscreen></iframe></div>`; }
  else if(item.img){ inner.innerHTML += `<img src="${item.img}" alt="${item.title}" style="margin-top:12px">`; }
  if(item.link) inner.innerHTML += `<p style="margin-top:8px"><a href="${item.link}" target="_blank">Open resource</a></p>`;
  if(dialog && dialog.showModal) { dialog.showModal(); } else if(dialog) { dialog.classList.remove('hidden'); }
  if(dialog) dialog.setAttribute('aria-hidden','false');
}
function closePortfolioModal(){
  const dialog = document.getElementById('portfolioDialog');
  if(dialog && dialog.close) { dialog.close(); } else if(dialog) { dialog.classList.add('hidden'); }
  const inner = document.getElementById('portfolioModalInner'); inner.innerHTML='';
}

// attach modal close handler
document.addEventListener('click', function(ev){
  const dialog = document.getElementById('portfolioDialog');
  if(!dialog) return;
  const closeBtn = document.getElementById('portfolioModalClose');
  if(ev.target === closeBtn) closePortfolioModal();
  if(ev.target === dialog) closePortfolioModal();
});

// close dialogs on ESC
document.addEventListener('keydown', function(ev){
  if(ev.key === 'Escape'){
    const dialog = document.getElementById('portfolioDialog'); if(dialog && (dialog.open || !dialog.classList.contains('hidden'))) closePortfolioModal();
    const ddialog = document.getElementById('donationDialog'); if(ddialog && (ddialog.open || !ddialog.classList.contains('hidden'))) { if(ddialog.close) ddialog.close(); else ddialog.classList.add('hidden'); }
  }
});

// render portfolio when DOM ready
document.addEventListener('DOMContentLoaded', function(){ renderPortfolio();

  // donation demo modal handlers
  const openDonateBtn = document.getElementById('openDonateDemo');
  if(openDonateBtn){
    const dmodal = document.getElementById('donationModal');
    const dclose = document.getElementById('donationClose');
    const donateSimBtn = document.getElementById('donateSimBtn');
    const result = document.getElementById('donationResult');
    const amounts = document.querySelectorAll('.donation-amounts button');
    let selectedAmount = 25;
    amounts.forEach(a=>a.addEventListener('click',()=>{ amounts.forEach(x=>x.style.opacity=0.6); a.style.opacity=1; selectedAmount = a.getAttribute('data-amount'); }));
    openDonateBtn.addEventListener('click',function(){ dmodal.classList.remove('hidden'); dmodal.setAttribute('aria-hidden','false'); result.style.display='none'; result.innerHTML=''; });
    dclose.addEventListener('click',()=>{ dmodal.classList.add('hidden'); dmodal.setAttribute('aria-hidden','true'); });
    donateSimBtn.addEventListener('click',async function(){
      donateSimBtn.disabled = true; donateSimBtn.innerText = 'Processing...';
      // Simulate network delay
      await new Promise(r=>setTimeout(r,1200));
      donateSimBtn.disabled = false; donateSimBtn.innerText = 'Simulate Payment';
      result.style.display='block'; result.innerHTML = `Payment successful (demo). Amount donated: $${selectedAmount}`;
    });
  }
});

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
