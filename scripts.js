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
  if(dialog){
    const closeBtn = document.getElementById('portfolioModalClose');
    if(ev.target === closeBtn) closePortfolioModal();
    if(ev.target === dialog) closePortfolioModal();
  }
  // video dialog backdrop click
  const vdialog = document.getElementById('videoDialog'); if(vdialog && ev.target === vdialog) closeVideoDetail();
});

// VIDEO DETAIL DIALOG
function openVideoDetail(video){
  const dialog = document.getElementById('videoDialog');
  const inner = document.getElementById('videoDialogInner');
  inner.innerHTML = `
    <h2>${video.title}</h2>
    <div class="embed-wrap" style="margin-top:12px"><iframe src="https://www.youtube.com/embed/${video.youtubeId}" frameborder="0" allowfullscreen></iframe></div>
    <p style="margin-top:12px;color:var(--color-muted)">${video.date?('Posted: '+video.date):''}</p>
    <p>${video.desc||''}</p>
    <div class="card" style="margin-top:12px" id="video-comments">
      <h4>Comments</h4>
      <input placeholder="Your name" id="v-comment-name">
      <textarea placeholder="Your message" id="v-comment-msg"></textarea>
      <button id="v-comment-submit" class="btn">Submit</button>
      <div class="comments-list" id="v-comments-list"></div>
    </div>
  `;

  // show dialog
  if(dialog && dialog.showModal) dialog.showModal(); else if(dialog) dialog.classList.remove('hidden');
  if(dialog) dialog.setAttribute('aria-hidden','false');

  // wire comment submit inside dialog
  document.getElementById('v-comment-submit').addEventListener('click', async function(){
    const name = document.getElementById('v-comment-name').value.trim() || 'Anonymous';
    const message = document.getElementById('v-comment-msg').value.trim();
    if(!message) return alert('Please write a message');
    this.classList.add('pressed'); this.disabled=true; this.innerText='Posting...';
    try{ await saveComment({videoId:video.id,name,message,createdAt:new Date()});
      document.getElementById('v-comment-msg').value='';
      await loadVideoComments(video.id);
    }catch(e){ alert('Error saving comment'); }
    finally{ this.disabled=false; this.classList.remove('pressed'); this.innerText='Submit'; }
  });

  // load comments
  loadVideoComments(video.id);
}

async function closeVideoDetail(){
  const dialog = document.getElementById('videoDialog');
  if(dialog && dialog.close) { dialog.close(); } else if(dialog) { dialog.classList.add('hidden'); }
  const inner = document.getElementById('videoDialogInner'); if(inner) inner.innerHTML='';
}

async function loadVideoComments(videoId){
  const list = document.getElementById('v-comments-list'); if(!list) return; list.innerHTML='Loading...';
  try{
    const comments = await getCommentsForVideo(videoId);
    if(!comments.length){ list.innerHTML='<p>No comments yet.</p>'; return; }
    list.innerHTML='';
    comments.forEach(c=>{ const div=document.createElement('div'); div.className='comment'; div.innerHTML=`<div class="meta">${c.name} • ${fmtDate(c.createdAt)}</div><div class="text">${c.message}</div>`; list.appendChild(div); });
  }catch(e){ list.innerHTML='<p>Error loading comments.</p>'; }
}

// close dialogs on ESC
document.addEventListener('keydown', function(ev){
  if(ev.key === 'Escape'){
    const dialog = document.getElementById('portfolioDialog'); if(dialog && (dialog.open || !dialog.classList.contains('hidden'))) closePortfolioModal();
    const ddialog = document.getElementById('donationDialog'); if(ddialog && (ddialog.open || !ddialog.classList.contains('hidden'))) { if(ddialog.close) ddialog.close(); else ddialog.classList.add('hidden'); }
  }
});

// small admin constants & helpers
const ADMIN_PASSCODE = 'Pamela1969';
function isAdmin(){ return sessionStorage.getItem('gma_admin') === '1'; }
function setAdmin(val){ if(val) sessionStorage.setItem('gma_admin','1'); else sessionStorage.removeItem('gma_admin'); updateAdminUI(); }

function createAdminDialog(){
  if(document.getElementById('adminDialog')) return;
  const d = document.createElement('dialog'); d.id='adminDialog'; d.className='modal hidden'; d.innerHTML = `
    <div class="modal-content">
      <button id="adminDialogClose" class="modal-close" aria-label="Close">✕</button>
      <h3>Admin Login</h3>
      <p>Enter passcode to reveal admin features.</p>
      <input id="adminPassInput" placeholder="Passcode" style="width:100%;padding:10px;margin-top:8px;border-radius:6px;border:1px solid #ccc">
      <div style="margin-top:12px;text-align:right"><button id="adminLoginBtn" class="btn">Unlock</button></div>
      <div id="adminLoginMsg" style="margin-top:10px;color:red;display:none"></div>
    </div>
  `;
  document.body.appendChild(d);
  document.getElementById('adminDialogClose').addEventListener('click', ()=>{ closeAdminDialog(); });
  document.getElementById('adminLoginBtn').addEventListener('click', ()=>{ handleAdminLogin(); });
  document.getElementById('adminPassInput').addEventListener('keyup', (e)=>{ if(e.key==='Enter') handleAdminLogin(); });
}
function showAdminDialog(){ createAdminDialog(); const d=document.getElementById('adminDialog'); if(d.showModal) d.showModal(); else d.classList.remove('hidden'); }
function closeAdminDialog(){ const d=document.getElementById('adminDialog'); if(d.close) d.close(); else d.classList.add('hidden'); document.getElementById('adminPassInput').value=''; document.getElementById('adminLoginMsg').style.display='none'; }
function handleAdminLogin(){ const v = document.getElementById('adminPassInput').value.trim(); const msg = document.getElementById('adminLoginMsg'); if(v===ADMIN_PASSCODE){ setAdmin(true); msg.style.display='none'; closeAdminDialog(); alert('Admin unlocked'); } else { msg.style.display='block'; msg.innerText='Incorrect passcode'; }}

function updateAdminUI(){ const wrapper = document.getElementById('addVideoAdmin'); const toggle = document.getElementById('adminToggle'); if(!toggle) return; if(isAdmin()){ if(wrapper) wrapper.style.display='block'; toggle.innerText = 'Admin (signed in) - Logout'; }else{ if(wrapper) wrapper.style.display='none'; toggle.innerText = 'Admin'; }}

// hamburger menu handler
function initHamburger(){ const btn = document.getElementById('hamburgerBtn'); if(!btn) return; btn.addEventListener('click', ()=>{ const header = btn.closest('.site-header'); if(header.classList.contains('open')) header.classList.remove('open'); else header.classList.add('open'); });
  // close nav on link click
  document.querySelectorAll('.site-header nav.primary a').forEach(a=>a.addEventListener('click', ()=>{ const header = document.querySelector('.site-header'); if(header) header.classList.remove('open'); })); }

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

  initHamburger();
  createAdminDialog();
  updateAdminUI();
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

// Videos: saveVideo, getAllVideos (Firestore with localStorage fallback)
const LOCAL_VIDEOS_KEY = 'gma_videos';
async function saveVideo({youtubeId,title,date,desc,createdAt=new Date()}){
  const entry = {youtubeId,title,date,desc,createdAt};
  if(db){
    return db.collection('videos').add(entry);
  }else{
    const arr = JSON.parse(localStorage.getItem(LOCAL_VIDEOS_KEY)||'[]');
    const v = {...entry,id:Date.now().toString()};
    arr.unshift(v);
    localStorage.setItem(LOCAL_VIDEOS_KEY,JSON.stringify(arr));
    return Promise.resolve(v);
  }
}
async function getAllVideos(){
  if(db){
    const snap = await db.collection('videos').orderBy('createdAt','desc').get();
    return snap.docs.map(d=>({id:d.id, ...d.data()}));
  }else{
    return JSON.parse(localStorage.getItem(LOCAL_VIDEOS_KEY)||'[]');
  }
}

// 4) Utility: format date
function fmtDate(d){ try{ return new Date(d.seconds ? d.seconds*1000 : d).toLocaleString(); }catch(e){ return String(d); }}

// -----------------
// Button press visuals (adds .pressed on pointer/keyboard interactions)
// -----------------
(function(){
  function addPressed(el){ el.classList.add('pressed'); }
  function removePressed(el){ el.classList.remove('pressed'); }
  document.addEventListener('pointerdown', e => { const btn = e.target.closest('button, .btn'); if(btn) addPressed(btn); });
  document.addEventListener('pointerup', e => { const btn = e.target.closest('button, .btn'); if(btn) removePressed(btn); });
  document.addEventListener('pointercancel', e => { const btn = e.target.closest('button, .btn'); if(btn) removePressed(btn); });
  document.addEventListener('keydown', e => {
    if((e.key === ' ' || e.key === 'Enter') && document.activeElement && (document.activeElement.tagName === 'BUTTON' || document.activeElement.classList.contains('btn'))){
      document.activeElement.classList.add('pressed');
    }
  });
  document.addEventListener('keyup', e => {
    if((e.key === ' ' || e.key === 'Enter') && document.activeElement && (document.activeElement.tagName === 'BUTTON' || document.activeElement.classList.contains('btn'))){
      document.activeElement.classList.remove('pressed');
    }
  });
})();
