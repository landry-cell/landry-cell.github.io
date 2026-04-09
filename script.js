// =============================================
// 🧘 MEDITATION (calcul à la demande)
// =============================================
function getDailyVerse(index = null) {
  if (index === null) {
    index = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  }
  const i = index % 800;
  const base = baseMeditations[i % baseMeditations.length];
  const suffix = i < 365 ? '' : ` (${Math.floor(i/365)+1})`;
  return {
    text: base.text + suffix,
    ref: base.ref + suffix
  };
}

// =============================================
// 👤 AUTHENTIFICATION & ÉTAT GLOBAL
// =============================================
const USERS_KEY = 'church_users';
const LIVE_KEY = 'current_church_live';

let currentUser = null;
try {
  currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
} catch(e) {
  localStorage.removeItem('currentUser');
}

function getAppUsers() {
  try {
    let users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.length === 0) {
      const admin = {
        id: 'admin_1',
        name: 'Super Admin',
        email: 'landrytchonda@gmail.com',
        pass: 'L@ndry#!123',
        role: 'superadmin',
        date: new Date().toISOString()
      };
      users.push(admin);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
    return users;
  } catch(e) { return []; }
}

let currentLang = localStorage.getItem('appLang') || 'fr';
let darkMode = localStorage.getItem('darkMode') !== 'false';
let mediaRecorder = null;
let recordedChunks = [];
let cameraStream = null;
let currentCameraFacing = 'user';
let blobUrls = [];

// Méditation
let medMode = 'breathing', medDur = 5, medRemaining = 300;
let medInterval = null, medRunning = false, medPaused = false;
let breathPhase = 0, breathTimeout = null;
let currentAmb = null, audioCtx = null, ambGain = null, ambNode = null;
const breathPatterns = { breathing:[4,4,4,4], prayer:[4,7,8,0], scripture:[5,3,5,3], gratitude:[4,2,6,2] };

// =============================================
// FONCTIONS UTILITAIRES — optimisées
// =============================================

// escapeHtml via élément DOM (plus rapide que regex sur grands textes)
const _escDiv = document.createElement('div');
function escapeHtml(unsafe) {
  _escDiv.textContent = unsafe;
  return _escDiv.innerHTML;
}

// Debounce utilitaire
function debounce(fn, delay) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

function applyT() {
  const t = T[currentLang] || T.fr;
  const elements = document.querySelectorAll('[data-i18n]');
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const key = el.getAttribute('data-i18n');
    const val = t[key];
    if (val) {
      if (val.includes('<')) el.innerHTML = val;
      else el.textContent = val;
    }
  }
}

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  if (!darkMode) { 
    document.body.classList.add('light-mode'); 
    const tb = document.getElementById('themeBtn');
    if (tb) tb.textContent = '☀️'; 
  }
  
  applyT();
  updateLangMenu();
  loadDailyVerse();
  updateChapters();

  const loader = document.getElementById('loader');
  if (loader) {
    // Cacher le loader après un court délai (évite le flash)
    setTimeout(() => loader.classList.add('hidden'), 200);
  }

  // Initialisation différée — ne bloque pas le rendu initial
  setTimeout(() => {
    emailjs.init("T2hyMnAwBLpQZwbz0");

    if (!currentUser) {
      toggleAuthModal();
      const authModal = document.getElementById('authModal');
      if (authModal) {
        authModal.addEventListener('click', (e) => {
          if (e.target === authModal) showToast('🔑', 'Veuillez vous connecter pour continuer', 'warning');
        });
        const closeBtn = authModal.querySelector('.btn-secondary.btn-block:last-child');
        if (closeBtn) closeBtn.style.display = 'none';
      }
    }

    renderAboutPage();
    loadMedStats();
    checkLiveStatus();
    loadAnnouncements();
    updateUIByRole();
    regSW();
  }, 0);
});

function regSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => console.warn('SW failed:', err));
  }
}

function tr(k) { return (T[currentLang] || T.fr)[k] || k; }

function setLanguage(l) {
  currentLang = l;
  localStorage.setItem('appLang', l);
  applyT(); updateLangMenu(); closeLangMenu();
  renderAboutPage();
}

function toggleLangMenu() { document.getElementById('langMenu').classList.toggle('show'); }
function closeLangMenu() { document.getElementById('langMenu').classList.remove('show'); }
function updateLangMenu() {
  document.querySelectorAll('.lang-option').forEach(o => o.classList.toggle('active', o.dataset.lang === currentLang));
}
document.addEventListener('click', e => { if (!e.target.closest('.lang-dropdown')) closeLangMenu(); });

function toggleDarkMode() {
  darkMode = !darkMode;
  document.body.classList.toggle('light-mode', !darkMode);
  document.getElementById('themeBtn').textContent = darkMode ? '🌙' : '☀️';
  localStorage.setItem('darkMode', darkMode);
}

function togglePass(id, btn) {
  const el = document.getElementById(id);
  if (el.type === 'password') { el.type = 'text'; btn.textContent = '🙈'; }
  else { el.type = 'password'; btn.textContent = '👁️'; }
}

// =============================================
// NAVIGATION — optimisée avec lazy loading
// =============================================
const loadedPages = new Set(['home']);

async function navigate(p) {
  document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-item').forEach(x => x.classList.remove('active'));
  const page = document.getElementById('page-' + p);
  if (page) page.classList.add('active');
  document.querySelector(`.bottom-nav-item[data-page="${p}"]`)?.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (!loadedPages.has(p)) {
    loadedPages.add(p);
    switch(p) {
      case 'bible': loadBible(); break;
      case 'meditation': loadMedHist(); loadJournalEntries(); break;
      case 'sermons': loadSermonsFromDB(); renderYoutubeList(); break;
      case 'gallery': loadGalleryFromStorage(); break;
      case 'chat': loadChatMessages(); break;
    }
  }
}

function startQuickMed() { navigate('meditation'); setDur(3, null); setTimeout(() => startMed(), 300); }

// =============================================
// TOAST — pool de messages
// =============================================
function showToast(icon, msg, type = 'info') {
  const c = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  // Utiliser textContent + icône séparée pour éviter XSS et accélérer le rendu
  el.innerHTML = `<span>${icon}</span><span></span>`;
  el.lastElementChild.textContent = msg;
  c.appendChild(el);
  setTimeout(() => {
    el.style.cssText += 'opacity:0;transform:translateX(100%);transition:opacity .3s,transform .3s';
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

function showWelcomeMessage() {
  const overlay = document.getElementById('welcomeOverlay');
  overlay.classList.add('show');
  setTimeout(() => overlay.classList.remove('show'), 2000);
}

let notifs = [];
function showNotifications() { document.getElementById('notifModal').classList.add('show'); renderNotifs(); }
function addNotif(i, m) {
  notifs.unshift({ icon: i, message: m, time: new Date() });
  const b = document.getElementById('notifBadge');
  b.textContent = (parseInt(b.textContent || '0') + 1).toString();
  b.style.display = 'flex';
  showToast(i, m, 'info');
}
function renderNotifs() {
  const c = document.getElementById('notifList');
  c.innerHTML = notifs.length ? notifs.map(n =>
    `<div class="calendar-event"><div class="event-date" style="min-width:36px;font-size:22px">${escapeHtml(n.icon)}</div><div class="event-info"><h4>${escapeHtml(n.message)}</h4><p>${escapeHtml(timeAgo(n.time))}</p></div></div>`
  ).join('') : '<div class="empty-state"><p>—</p></div>';
}
function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  return Math.floor(s / 86400) + 'j';
}
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
document.querySelectorAll('.modal-overlay').forEach(m => m.addEventListener('click', function(e) { if (e.target === this) this.classList.remove('show'); }));

function renderAboutPage() {
  const aboutDiv = document.getElementById('aboutContent');
  const content = aboutContent[currentLang] || aboutContent.fr;
  // Utiliser un fragment pour éviter les reflows multiples
  const div = document.createElement('div');
  div.className = 'about-text';
  div.textContent = content; // textContent = sécurisé et rapide
  aboutDiv.innerHTML = '';
  aboutDiv.appendChild(div);
}

// =============================================
// 📖 BIBLE
// =============================================
let bCache = {};

function updateChapters() {
  const b = document.getElementById('bibleBook').value;
  const s = document.getElementById('bibleChapter');
  const max = BC[b] || 50;
  // Construire en une seule fois avec un fragment
  const frag = document.createDocumentFragment();
  for (let i = 1; i <= max; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i;
    frag.appendChild(opt);
  }
  s.innerHTML = '';
  s.appendChild(frag);
}

async function loadBible() {
  const b = document.getElementById('bibleBook').value;
  const c = document.getElementById('bibleChapter').value;
  const ref = `${b} ${c}`;
  const el = document.getElementById('bibleContent');
  el.innerHTML = '<div class="empty-state"><div class="loader-spinner" style="margin:0 auto 8px"></div></div>';
  if (bCache[ref]) { renderVerses(bCache[ref], ref); return; }
  try {
    const r = await fetch(`https://bible-api.com/${encodeURIComponent(ref)}?translation=lsg`);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    bCache[ref] = d;
    renderVerses(d, ref);
  } catch(e) {
    el.innerHTML = '<div class="empty-state"><p>⚠️ Erreur chargement</p><button class="btn btn-gold btn-sm" onclick="loadBible()">🔄 Réessayer</button></div>';
  }
}

function renderVerses(d, ref) {
  const el = document.getElementById('bibleContent');
  // Construire via fragment pour éviter reflows
  const frag = document.createDocumentFragment();
  const header = document.createElement('div');
  header.style.cssText = 'margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--border-glass)';
  const strong = document.createElement('strong');
  strong.style.color = 'var(--gold)';
  strong.textContent = d.reference;
  header.appendChild(strong);
  frag.appendChild(header);

  d.verses.forEach(v => {
    const vDiv = document.createElement('div');
    vDiv.className = 'verse';
    const vNumStr = escapeHtml(d.reference + ':' + v.verse);
    const vText = escapeHtml(v.text);
    const refEsc = escapeHtml(d.reference);
    vDiv.innerHTML = `<span class="verse-number">${v.verse}</span>${vText} <span onclick="copyV('${refEsc}:${v.verse}','${vText}')">📋</span> <span onclick="toggleFav('${refEsc}:${v.verse}','${vText}')">⭐</span>`;
    frag.appendChild(vDiv);
  });

  el.innerHTML = '';
  el.appendChild(frag);
}

function copyV(r, t) {
  navigator.clipboard.writeText(`${r} — ${t}`).then(() => showToast('📋', tr('copiedVerse'), 'success'));
}
function toggleFav(ref, text) {
  let favs = JSON.parse(localStorage.getItem('bibleFavs') || '[]');
  const idx = favs.findIndex(f => f.ref === ref);
  if (idx !== -1) favs.splice(idx, 1);
  else favs.unshift({ ref, text, date: new Date().toISOString() });
  localStorage.setItem('bibleFavs', JSON.stringify(favs));
}

// Recherche avec debounce pour éviter les appels à chaque frappe
const searchBible = debounce(function() {
  const q = document.getElementById('bibleSearch').value.trim().toLowerCase();
  if (!q) return;
  const verses = document.querySelectorAll('#bibleContent .verse');
  verses.forEach(v => {
    v.style.display = v.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}, 250);

// =============================================
// IndexedDB — singleton avec pool de connexion
// =============================================
const DB_NAME = 'CER_DB';
const DB_VERSION = 3;
let _db = null;

function getDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('sermons')) db.createObjectStore('sermons', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('videos')) db.createObjectStore('videos', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('gallery')) db.createObjectStore('gallery', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('chat')) db.createObjectStore('chat', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('announcements')) db.createObjectStore('announcements', { keyPath: 'id' });
    };
    request.onsuccess = () => { _db = request.result; resolve(_db); };
    request.onerror = () => reject(request.error);
  });
}

async function dbGetAll(s) {
  const db = await getDB();
  return new Promise((res, rej) => {
    const req = db.transaction(s, 'readonly').objectStore(s).getAll();
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}
async function dbPut(s, d) {
  const db = await getDB();
  return new Promise((res, rej) => {
    const req = db.transaction(s, 'readwrite').objectStore(s).put(d);
    req.onsuccess = () => res();
    req.onerror = () => rej(req.error);
  });
}
async function dbDelete(s, id) {
  const db = await getDB();
  db.transaction(s, 'readwrite').objectStore(s).delete(id);
}

// =============================================
// GALLERY — avec IntersectionObserver pour lazy load
// =============================================
async function loadGalleryFromStorage() {
  const photos = await dbGetAll('gallery');
  photos.sort((a, b) => b.id - a.id);
  const g = document.getElementById('galGrid');
  const isAdmin = currentUser && (currentUser.role === 'superadmin' || currentUser.role === 'admin');

  if (!photos.length) {
    g.innerHTML = `<div class="empty-state"><p>${tr('noPhotos')}</p></div>`;
    return;
  }

  // Construire avec fragment
  const frag = document.createDocumentFragment();
  photos.slice(0, 20).forEach(p => {
    const div = document.createElement('div');
    div.className = 'gallery-item';
    div.innerHTML = `<img src="${p.url}" loading="lazy">${isAdmin ? `<div class="delete-overlay" onclick="event.stopPropagation();deletePhoto('${p.id}')">🗑</div>` : ''}`;
    div.addEventListener('click', () => zoomImg(p.url));
    frag.appendChild(div);
  });
  g.innerHTML = '';
  g.appendChild(frag);

  if (photos.length > 20) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-secondary btn-block';
    btn.style.marginTop = '10px';
    btn.textContent = 'Voir plus...';
    btn.onclick = () => {
      btn.remove();
      const frag2 = document.createDocumentFragment();
      photos.slice(20).forEach(p => {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.innerHTML = `<img src="${p.url}" loading="lazy">${isAdmin ? `<div class="delete-overlay" onclick="event.stopPropagation();deletePhoto('${p.id}')">🗑</div>` : ''}`;
        div.addEventListener('click', () => zoomImg(p.url));
        frag2.appendChild(div);
      });
      g.appendChild(frag2);
    };
    g.after(btn);
  }
}

window.deletePhoto = async (id) => {
  if (confirm('Supprimer ?')) { await dbDelete('gallery', id); loadGalleryFromStorage(); }
};

function handleGalUp(ev) {
  Array.from(ev.target.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      await dbPut('gallery', { url: e.target.result, id: Date.now() + Math.random() });
      loadGalleryFromStorage();
    };
    reader.readAsDataURL(file);
  });
}

// =============================================
// ANNOUNCEMENTS
// =============================================
async function loadAnnouncements() {
  const list = await dbGetAll('announcements');
  list.sort((a, b) => new Date(b.date) - new Date(a.date));
  const container = document.getElementById('announcementsList');
  if (!container) return;
  const isAdmin = currentUser && (currentUser.role === 'superadmin' || currentUser.role === 'admin');
  container.innerHTML = list.length ? list.map(a => `
    <div class="glass-card">
      <div class="card-header"><h3>${escapeHtml(a.title)}</h3>${isAdmin ? `<button onclick="deleteAnnouncement(${a.id})">🗑</button>` : ''}</div>
      <p>${escapeHtml(a.text)}</p>
    </div>
  `).join('') : '<p>Aucune info</p>';
}
async function postAnnouncement() {
  const title = document.getElementById('annTitle').value;
  const text = document.getElementById('annText').value;
  if (!title || !text) return;
  await dbPut('announcements', { id: Date.now(), title, text, date: new Date().toISOString(), admin: currentUser.name });
  loadAnnouncements();
}
async function deleteAnnouncement(id) { await dbDelete('announcements', id); loadAnnouncements(); }

// =============================================
// CHAT
// =============================================
let currentChatMedia = null;
async function loadChatMessages() {
  const chat = await dbGetAll('chat');
  const container = document.getElementById('chatMessages');
  if (!container) return;
  const frag = document.createDocumentFragment();
  chat.sort((a,b) => a.id - b.id).forEach(m => {
    const div = document.createElement('div');
    div.style.alignSelf = (currentUser && m.userId === currentUser.id) ? 'flex-end' : 'flex-start';
    div.innerHTML = `<div class="glass-card" style="padding:8px"><p style="font-size:10px;color:var(--gold)">${escapeHtml(m.userName)}</p><p>${escapeHtml(m.text)}</p>${m.media ? `<img src="${m.media.data}" style="max-width:100%">` : ''}</div>`;
    frag.appendChild(div);
  });
  container.innerHTML = '';
  container.appendChild(frag);
  container.scrollTop = container.scrollHeight;
}
async function sendChatMessage() {
  const text = document.getElementById('chatInput').value;
  if (!text && !currentChatMedia) return;
  await dbPut('chat', { id: Date.now(), userId: currentUser.id, userName: currentUser.name, text, media: currentChatMedia, date: new Date().toISOString() });
  document.getElementById('chatInput').value = '';
  loadChatMessages();
}

// =============================================
// SERMONS
// =============================================
async function loadSermonsFromDB() {
  const sermons = await dbGetAll('sermons');
  const container = document.getElementById('sermonsList');
  if (!container) return;
  container.innerHTML = sermons.length ? sermons.map(s => `
    <div class="glass-card">
      <div class="card-header">
        <h3 style="color:var(--gold)">${escapeHtml(s.title)}</h3>
        <p style="font-size:12px;color:var(--text-muted)">${new Date(s.date).toLocaleDateString()}</p>
      </div>
      <div id="video-container-${s.id}" class="video-placeholder" style="aspect-ratio:16/9;background:#000;display:flex;align-items:center;justify-content:center;cursor:pointer;border-radius:8px" onclick="playSermon('${s.id}')">
        <span style="font-size:40px">▶️</span>
      </div>
    </div>
  `).join('') : '<div class="empty-state"><p>Aucun sermon</p></div>';
}

async function playSermon(id) {
  const placeholder = document.getElementById(`video-container-${id}`);
  if (!placeholder) return;
  placeholder.innerHTML = '<div class="loader-spinner"></div>';
  try {
    const db = await getDB();
    const res = await new Promise((resolve, reject) => {
      const req = db.transaction('videos', 'readonly').objectStore('videos').get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (res && res.blob) {
      const url = URL.createObjectURL(res.blob);
      blobUrls.push(url);
      placeholder.innerHTML = `<video controls src="${url}" style="width:100%;border-radius:8px" autoplay></video>`;
      placeholder.onclick = null;
      placeholder.style.cursor = 'default';
    }
  } catch(e) { console.error(e); }
}

// =============================================
// AUTH & RÔLES
// =============================================
function toggleAuthModal() { document.getElementById('authModal').classList.add('show'); updateAuthUI(); }
function updateAuthUI() {
  if (currentUser) {
    showAuthPage('profile');
    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('profileEmail').textContent = currentUser.email;
    const rb = document.getElementById('profileRoleBadge');
    if (rb) {
      rb.textContent = currentUser.role.toUpperCase();
      rb.style.background = currentUser.role === 'superadmin' ? 'var(--gold)' : (currentUser.role === 'admin' ? 'var(--primary)' : 'var(--text-muted)');
    }
    const authModal = document.getElementById('authModal');
    const closeBtn = authModal.querySelector('.btn-secondary.btn-block:last-child');
    if (closeBtn) closeBtn.style.display = 'block';
    authModal.onclick = (e) => { if (e.target === authModal) closeModal('authModal'); };

    const isAdmin = currentUser.role === 'superadmin';
    document.getElementById('adminPanel').classList.toggle('hidden', !isAdmin);
    if (isAdmin) {
      document.getElementById('adminStatUsers').textContent = getAppUsers().length;
      const live = JSON.parse(localStorage.getItem(LIVE_KEY) || 'null');
      const statLive = document.getElementById('adminStatLive');
      if (statLive) {
        statLive.textContent = (live && live.active) ? 'ON' : 'OFF';
        statLive.style.color = (live && live.active) ? 'var(--success)' : 'var(--danger)';
      }
    }
    showProfileEdit(false);
  } else {
    showAuthPage('login');
  }
}

function showProfileEdit(show) {
  document.getElementById('profileView').classList.toggle('hidden', show);
  document.getElementById('profileEdit').classList.toggle('hidden', !show);
  if (show) {
    document.getElementById('editName').value = currentUser.name;
    document.getElementById('editPass').value = '';
  }
}

async function handleUpdateProfile() {
  const newName = document.getElementById('editName').value.trim();
  const newPass = document.getElementById('editPass').value;
  if (!newName) return showToast('⚠️', 'Nom requis', 'error');
  let users = getAppUsers();
  const idx = users.findIndex(u => u.id === currentUser.id);
  if (idx !== -1) {
    users[idx].name = newName;
    if (newPass) users[idx].pass = newPass;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    currentUser = users[idx];
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showToast('✅', 'Profil mis à jour', 'success');
    updateAuthUI();
  }
}

function handleLogin() {
  const e = document.getElementById('loginEmail').value.toLowerCase();
  const p = document.getElementById('loginPass').value;
  const user = getAppUsers().find(u => u.email.toLowerCase() === e && u.pass === p);
  if (user) {
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    showWelcomeMessage();
    updateAuthUI();
    updateUIByRole();
    setTimeout(() => closeModal('authModal'), 1000);
  } else showToast('❌', 'Email ou mot de passe incorrect', 'error');
}

function handleRegister() {
  const n = document.getElementById('regName').value.trim();
  const e = document.getElementById('regEmail').value.toLowerCase();
  const p = document.getElementById('regPass').value;
  if (!n || !e || !p) return showToast('⚠️', 'Champs requis', 'error');
  let users = getAppUsers();
  if (users.find(u => u.email === e)) return showToast('⚠️', 'Email déjà utilisé', 'error');
  const newUser = { id: 'u_' + Date.now(), name: n, email: e, pass: p, role: 'user', date: new Date().toISOString() };
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  currentUser = newUser;
  localStorage.setItem('currentUser', JSON.stringify(newUser));
  showWelcomeMessage();
  updateAuthUI();
  updateUIByRole();
  setTimeout(() => closeModal('authModal'), 1000);
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  updateAuthUI();
  updateUIByRole();
  showToast('👋', 'Déconnecté', 'info');
}

function showAuthPage(p) {
  document.getElementById('authLogin').classList.toggle('hidden', p !== 'login');
  document.getElementById('authRegister').classList.toggle('hidden', p !== 'register');
  document.getElementById('authProfile').classList.toggle('hidden', p !== 'profile');
}

function manageUsers() { document.getElementById('userManageModal').classList.add('show'); renderUserList(); }

function renderUserList() {
  const users = getAppUsers();
  const list = document.getElementById('userList');
  list.innerHTML = users.map(u => `
    <div class="calendar-event" style="margin-bottom:10px;padding:10px">
      <div class="event-info">
        <h4 style="color:var(--gold)">${escapeHtml(u.name)}</h4>
        <p style="font-size:11px">${escapeHtml(u.email)}</p>
        <div style="margin-top:8px;display:flex;gap:5px;align-items:center">
          <select class="form-select" style="width:auto;padding:2px 5px;font-size:11px" onchange="changeUserRole('${u.id}', this.value)">
            <option value="user" ${u.role === 'user' ? 'selected' : ''}>Utilisateur</option>
            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
            <option value="superadmin" ${u.role === 'superadmin' ? 'selected' : ''}>Superadmin</option>
          </select>
          ${u.email !== 'landrytchonda@gmail.com' ? `<button class="btn btn-danger btn-sm" style="padding:2px 8px" onclick="deleteUser('${u.id}')">🗑</button>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

function changeUserRole(uid, newRole) {
  let users = getAppUsers();
  const idx = users.findIndex(u => u.id === uid);
  if (idx !== -1) {
    users[idx].role = newRole;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    if (currentUser && currentUser.id === uid) {
      currentUser.role = newRole;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      updateUIByRole();
    }
    showToast('✅', 'Rôle mis à jour', 'success');
    renderUserList();
    updateAuthUI();
  }
}

function deleteUser(uid) {
  if (!confirm('Supprimer cet utilisateur ?')) return;
  let users = getAppUsers().filter(u => u.id !== uid);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  renderUserList();
  showToast('🗑', 'Utilisateur supprimé', 'info');
}

function updateUIByRole() {
  const isAdmin = currentUser && (currentUser.role === 'superadmin' || currentUser.role === 'admin');
  document.getElementById('liveAdminControls').classList.toggle('hidden', !isAdmin);
  document.getElementById('adminAnnouncementForm')?.classList.toggle('hidden', !isAdmin);
  const activePage = document.querySelector('.page.active')?.id.replace('page-', '');
  if (activePage === 'gallery') loadGalleryFromStorage();
  if (activePage === 'chat') loadChatMessages();
  if (activePage === 'sermons') loadSermonsFromDB();
  if (activePage === 'home') loadAnnouncements();
  checkLiveStatus();
}

// =============================================
// LIVE
// =============================================
function checkLiveStatus() {
  const live = JSON.parse(localStorage.getItem(LIVE_KEY) || 'null');
  const ind = document.getElementById('homeLiveIndicator');
  if (live && live.active) {
    if (ind) ind.classList.remove('hidden');
    document.getElementById('liveActive').classList.remove('hidden');
    document.getElementById('noLiveActive').classList.add('hidden');
    document.getElementById('currentLiveTitle').textContent = live.title;
    if (document.getElementById('page-live').classList.contains('active')) {
      const playerContainer = document.getElementById('livePlayerContainer');
      if (!playerContainer.hasChildNodes() || playerContainer.innerHTML === '') {
        const yId = live.url.includes('v=') ? live.url.split('v=')[1].split('&')[0] : null;
        playerContainer.innerHTML = yId
          ? `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${yId}?autoplay=1" allowfullscreen></iframe>`
          : `<a href="${live.url}" target="_blank" class="btn btn-gold">Rejoindre</a>`;
      }
    }
  } else {
    if (ind) ind.classList.add('hidden');
    document.getElementById('noLiveActive').classList.remove('hidden');
    document.getElementById('liveActive').classList.add('hidden');
    document.getElementById('livePlayerContainer').innerHTML = '';
  }
}

function handleStartLive() {
  const title = document.getElementById('liveTitleInput').value;
  const url = document.getElementById('liveStreamUrl').value;
  localStorage.setItem(LIVE_KEY, JSON.stringify({ active: true, title, url }));
  checkLiveStatus();
}
function handleStopLive() { localStorage.removeItem(LIVE_KEY); checkLiveStatus(); }

// =============================================
// POLLING — réduit et optimisé
// Vérification live toutes les 15s (au lieu de 10s)
// Chat seulement si la page est visible
// =============================================
let _pollInterval = null;
function startPolling() {
  if (_pollInterval) return;
  _pollInterval = setInterval(() => {
    checkLiveStatus();
    // Chat: seulement si la page chat est active ET le document visible
    if (!document.hidden && document.getElementById('page-chat').classList.contains('active')) {
      loadChatMessages();
    }
  }, 15000);
}
startPolling();

// Pause polling quand onglet en arrière-plan
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    clearInterval(_pollInterval);
    _pollInterval = null;
  } else {
    startPolling();
    checkLiveStatus();
  }
});

// =============================================
// UTILITAIRES
// =============================================
function zoomImg(u) { document.getElementById('zoomImg').src = u; document.getElementById('imageZoomModal').classList.add('show'); }

function loadMedStats() {
  const s = JSON.parse(localStorage.getItem('medSess') || '[]');
  const tot = s.reduce((a, x) => a + (x.duration || 0), 0);
  document.getElementById('totalMedTime').textContent = Math.round(tot / 60);
  document.getElementById('totalMedSessions').textContent = s.length;
}

function loadMedHist() {
  const s = JSON.parse(localStorage.getItem('medSess') || '[]');
  const c = document.getElementById('medHistory');
  if (!c) return;
  c.innerHTML = s.slice(0, 10).map(x =>
    `<div class="med-history-item"><h4>${escapeHtml(x.mode)}</h4><p>${escapeHtml(timeAgo(x.date))}</p></div>`
  ).join('');
}

function loadJournalEntries() {
  const e = JSON.parse(localStorage.getItem('medJ') || '[]');
  const c = document.getElementById('journalEntries');
  if (!c) return;
  c.innerHTML = e.slice(0, 5).map(x =>
    `<div class="favorite-item"><p>${escapeHtml(x.text.substring(0, 50))}...</p></div>`
  ).join('');
}

function renderYoutubeList() {
  const s = JSON.parse(localStorage.getItem('ytSermons') || '[]');
  const c = document.getElementById('ytList');
  if (!c) return;
  c.innerHTML = s.map(v =>
    `<div class="glass-card"><h3>${escapeHtml(v.title)}</h3><iframe class="youtube-embed" src="https://www.youtube.com/embed/${escapeHtml(v.youtubeId)}" loading="lazy"></iframe></div>`
  ).join('');
}

// =============================================
// FONCTIONS MÉDITATION (stubs — garder compatibilité)
// =============================================
function loadDailyVerse() {
  const v = getDailyVerse();
  const textEl = document.getElementById('dailyVerseText');
  const refEl = document.getElementById('dailyVerseRef');
  if (textEl) textEl.textContent = `"${v.text}"`;
  if (refEl) refEl.textContent = v.ref;
  const scriptureText = document.getElementById('scriptureText');
  const scriptureRef = document.getElementById('scriptureRef');
  if (scriptureText) scriptureText.textContent = `"${v.text}"`;
  if (scriptureRef) scriptureRef.textContent = v.ref;
}

function showBibleTab(tab, el) {
  document.querySelectorAll('#page-bible .tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('#page-bible .tab-content').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById(`bible-tab-${tab}`)?.classList.add('active');
  if (tab === 'favorites') renderBibleFavs();
}

function renderBibleFavs() {
  const favs = JSON.parse(localStorage.getItem('bibleFavs') || '[]');
  const c = document.getElementById('bibleFavorites');
  if (!c) return;
  c.innerHTML = favs.length ? favs.map(f =>
    `<div class="favorite-item"><div><strong style="color:var(--gold);font-size:11px">${escapeHtml(f.ref)}</strong><p style="font-size:13px;margin-top:2px">${escapeHtml(f.text.substring(0,80))}...</p></div><span onclick="toggleFav('${escapeHtml(f.ref)}','${escapeHtml(f.text)}');renderBibleFavs()">⭐</span></div>`
  ).join('') : `<div class="empty-state"><div class="empty-icon">⭐</div><p>${tr('noFavorites')}</p></div>`;
}

function showSermonTab(tab, el) {
  document.querySelectorAll('#page-sermons .tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('#page-sermons .tab-content').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById(`sermon-tab-${tab}`)?.classList.add('active');
}

function addYT() {
  const url = document.getElementById('ytUrl').value.trim();
  const title = document.getElementById('ytTitle').value.trim();
  if (!url || !title) return showToast('⚠️', 'URL et titre requis', 'error');
  const match = url.match(/v=([^&]+)/);
  if (!match) return showToast('❌', 'URL YouTube invalide', 'error');
  const youtubeId = match[1];
  let s = JSON.parse(localStorage.getItem('ytSermons') || '[]');
  s.unshift({ id: Date.now(), title, youtubeId });
  localStorage.setItem('ytSermons', JSON.stringify(s));
  document.getElementById('ytUrl').value = '';
  document.getElementById('ytTitle').value = '';
  renderYoutubeList();
  showToast('✅', 'Vidéo ajoutée', 'success');
}

async function handleVidUp(event) {
  const file = event.target.files[0];
  const title = document.getElementById('vidTitle').value || file.name;
  if (!file) return;
  const prog = document.getElementById('vidProg');
  const progBar = document.getElementById('vidProgBar');
  const progTxt = document.getElementById('vidProgTxt');
  prog.classList.remove('hidden');
  progTxt.classList.remove('hidden');
  progTxt.textContent = 'Sauvegarde en cours...';
  progBar.style.width = '30%';
  const id = 'v_' + Date.now();
  await dbPut('sermons', { id, title, date: new Date().toISOString() });
  progBar.style.width = '60%';
  await dbPut('videos', { id, blob: file });
  progBar.style.width = '100%';
  progTxt.textContent = 'Terminé !';
  setTimeout(() => { prog.classList.add('hidden'); progTxt.classList.add('hidden'); }, 1500);
  loadSermonsFromDB();
  showToast('✅', 'Vidéo sauvegardée', 'success');
}

// Méditation — stubs pour les fonctions utilisées dans le HTML
function selectMedMode(mode, el) {
  medMode = mode;
  document.querySelectorAll('.meditation-mode').forEach(m => m.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById('breathingArea').classList.toggle('hidden', mode !== 'breathing' && mode !== 'prayer');
  document.getElementById('scriptureArea').classList.toggle('hidden', mode !== 'scripture');
  document.getElementById('gratitudeArea').classList.toggle('hidden', mode !== 'gratitude');
}

function setDur(min, el) {
  medDur = min;
  medRemaining = min * 60;
  document.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const m = Math.floor(medRemaining / 60).toString().padStart(2,'0');
  const s = (medRemaining % 60).toString().padStart(2,'0');
  const txt = `${m}:${s}`;
  ['medTimer','scriptureTimer','gratTimer'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  });
}

function startMed() {
  if (medRunning) return;
  medRunning = true; medPaused = false;
  ['btnStartMed','btnStartS','btnStartG'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
  ['btnPauseMed','btnPauseS','btnPauseG'].forEach(id => document.getElementById(id)?.classList.remove('hidden'));
  ['btnStopMed','btnStopS','btnStopG'].forEach(id => document.getElementById(id)?.classList.remove('hidden'));
  const circle = document.getElementById('breathCircle');
  if (circle) circle.style.willChange = 'transform';
  medInterval = setInterval(() => {
    medRemaining--;
    updateTimerDisplay();
    if (medRemaining <= 0) completeMed();
  }, 1000);
  if (medMode === 'breathing' || medMode === 'prayer') runBreathCycle();
}

function pauseMed() {
  if (!medRunning) return;
  medPaused = !medPaused;
  if (medPaused) { clearInterval(medInterval); clearTimeout(breathTimeout); }
  else { medInterval = setInterval(() => { medRemaining--; updateTimerDisplay(); if (medRemaining <= 0) completeMed(); }, 1000); runBreathCycle(); }
}

function stopMed() {
  clearInterval(medInterval); clearTimeout(breathTimeout);
  medRunning = false; medPaused = false;
  medRemaining = medDur * 60;
  updateTimerDisplay();
  ['btnStartMed','btnStartS','btnStartG'].forEach(id => document.getElementById(id)?.classList.remove('hidden'));
  ['btnPauseMed','btnPauseS','btnPauseG'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
  ['btnStopMed','btnStopS','btnStopG'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
  const circle = document.getElementById('breathCircle');
  if (circle) { circle.classList.remove('inhale','hold','exhale'); circle.style.willChange = ''; }
  const phase = document.getElementById('breathPhase');
  if (phase) phase.textContent = tr('readyStart');
  const instr = document.getElementById('breathInstr');
  if (instr) instr.innerHTML = tr('pressStart');
}

function completeMed() {
  const dur = medDur * 60;
  clearInterval(medInterval); clearTimeout(breathTimeout);
  medRunning = false;
  const sessions = JSON.parse(localStorage.getItem('medSess') || '[]');
  sessions.unshift({ mode: medMode, duration: dur, date: new Date().toISOString() });
  localStorage.setItem('medSess', JSON.stringify(sessions.slice(0, 100)));
  loadMedStats();
  const overlay = document.getElementById('completionOverlay');
  const sub = document.getElementById('completionSub');
  if (sub) sub.textContent = `${medDur} min — ${medMode}`;
  if (overlay) overlay.classList.add('show');
  stopMed();
}

function closeCompletion() {
  document.getElementById('completionOverlay')?.classList.remove('show');
}

function runBreathCycle() {
  if (!medRunning || medPaused) return;
  const pattern = breathPatterns[medMode] || breathPatterns.breathing;
  const phases = [tr('inhale'), tr('holdBreath'), tr('exhale'), tr('holdBreath')];
  const classes = ['inhale', 'hold', 'exhale', 'hold'];
  const circle = document.getElementById('breathCircle');
  const phaseEl = document.getElementById('breathPhase');
  const instrEl = document.getElementById('breathInstr');
  let idx = breathPhase % 4;
  const dur = pattern[idx];
  if (dur === 0) { breathPhase++; runBreathCycle(); return; }
  if (circle) { circle.classList.remove('inhale','hold','exhale'); circle.classList.add(classes[idx]); }
  if (phaseEl) phaseEl.textContent = phases[idx];
  if (instrEl) instrEl.textContent = phases[idx];
  breathTimeout = setTimeout(() => { breathPhase++; runBreathCycle(); }, dur * 1000);
}

function meditateOnVerse() { navigate('meditation'); }

function saveJournal() {
  const text = document.getElementById('medJournal').value.trim();
  if (!text) return;
  const entries = JSON.parse(localStorage.getItem('medJ') || '[]');
  entries.unshift({ text, date: new Date().toISOString() });
  localStorage.setItem('medJ', JSON.stringify(entries.slice(0, 50)));
  document.getElementById('medJournal').value = '';
  loadJournalEntries();
  showToast('💾', tr('entrySaved'), 'success');
}

function toggleAmbient(type, el) {
  document.querySelectorAll('.ambient-btn').forEach(b => b.classList.remove('active'));
  if (currentAmb === type) { currentAmb = null; stopAmbient(); return; }
  el.classList.add('active');
  currentAmb = type;
  playAmbient(type);
}

function playAmbient(type) {
  stopAmbient();
  if (type === 'silence') return;
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  ambGain = audioCtx.createGain();
  ambGain.gain.value = (document.getElementById('ambVol')?.value || 50) / 100;
  ambGain.connect(audioCtx.destination);
  const bufferSize = 2 * audioCtx.sampleRate;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  ambNode = audioCtx.createBufferSource();
  ambNode.buffer = buffer;
  ambNode.loop = true;
  ambNode.connect(ambGain);
  ambNode.start();
}

function stopAmbient() { try { ambNode?.stop(); ambNode?.disconnect(); } catch(e) {} ambNode = null; }

function setAmbVol(v) { if (ambGain) ambGain.gain.value = v / 100; }

function speakBible() {
  const content = document.getElementById('bibleContent');
  if (!content) return;
  const text = content.innerText;
  const speed = parseFloat(document.getElementById('speechSpeed')?.value || '1');
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'fr-FR'; utt.rate = speed;
  window.speechSynthesis.speak(utt);
}
function pauseSpeech() { window.speechSynthesis.pause(); }
function stopSpeech() { window.speechSynthesis.cancel(); }

function startPreview() {
  navigator.mediaDevices.getUserMedia({ video: { facingMode: currentCameraFacing }, audio: false })
    .then(stream => {
      cameraStream = stream;
      const vid = document.getElementById('livePreview');
      if (vid) { vid.srcObject = stream; }
    }).catch(e => showToast('❌', 'Caméra non disponible', 'error'));
}

function toggleCamera() {
  currentCameraFacing = currentCameraFacing === 'user' ? 'environment' : 'user';
  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop());
    startPreview();
  }
}

function previewChatMedia(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = e.target.result;
    currentChatMedia = { type: file.type.startsWith('image') ? 'image' : 'video', data };
    const preview = document.getElementById('chatPreview');
    const imgPrev = document.getElementById('chatImgPreview');
    const vidPrev = document.getElementById('chatVidPreview');
    preview.classList.remove('hidden');
    if (file.type.startsWith('image')) { imgPrev.src = data; imgPrev.style.display = 'block'; vidPrev.style.display = 'none'; }
    else { vidPrev.src = data; vidPrev.style.display = 'block'; imgPrev.style.display = 'none'; }
  };
  reader.readAsDataURL(file);
}

function clearChatMedia() {
  currentChatMedia = null;
  document.getElementById('chatPreview')?.classList.add('hidden');
  document.getElementById('chatMedia').value = '';
}

function askAIBible() {
  const query = document.getElementById('aiBibleQuery').value.trim();
  if (!query) return;
  const resp = document.getElementById('aiBibleResponse');
  resp.classList.remove('hidden');
  resp.textContent = '⏳ Recherche...';
  // Placeholder — intégration API à connecter
  setTimeout(() => {
    resp.textContent = `💡 Pour "${query}", voici quelques versets : Jean 3:16, Psaume 23:1, Jérémie 29:11. Consultez ces passages dans la Bible ci-dessous.`;
  }, 800);
}
