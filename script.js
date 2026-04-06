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
// FONCTIONS UTILITAIRES
// =============================================
function escapeHtml(unsafe) {
  return unsafe.replace(/[&<>"']/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    if (m === '"') return '&quot;';
    if (m === "'") return '&#039;';
    return m;
  });
}

function applyT() {
  const t = T[currentLang] || T.fr;
  const elements = document.querySelectorAll('[data-i18n]');
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const key = el.getAttribute('data-i18n');
    if (t[key]) {
      if (t[key].includes('<')) el.innerHTML = t[key];
      else el.textContent = t[key];
    }
  }
}

// Fallback for requestIdleCallback
window.requestIdleCallback = window.requestIdleCallback || function(cb) {
  return setTimeout(cb, 1);
};

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
  if (loader) loader.classList.add('hidden');

  requestIdleCallback(() => {
    emailjs.init("T2hyMnAwBLpQZwbz0");
    if (!currentUser) {
      toggleAuthModal();
      const authModal = document.getElementById('authModal');
      if (authModal) {
        authModal.onclick = (e) => { if (e.target === authModal) showToast('🔑', 'Veuillez vous connecter pour continuer', 'warning'); };
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
  });
});

function regSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW failed:', err));
    });
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
  if (el.type === 'password') {
    el.type = 'text';
    btn.textContent = '🙈';
  } else {
    el.type = 'password';
    btn.textContent = '👁️';
  }
}
const loadedPages = new Set(['home']);

async function navigate(p) {
  document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-item').forEach(x => x.classList.remove('active'));
  document.getElementById('page-' + p)?.classList.add('active');
  document.querySelector(`.bottom-nav-item[data-page="${p}"]`)?.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (!loadedPages.has(p)) {
    switch(p) {
      case 'bible': loadBible(); break;
      case 'meditation': loadMedHist(); loadJournalEntries(); break;
      case 'sermons': await loadSermonsFromDB(); renderYoutubeList(); break;
      case 'gallery': loadGalleryFromStorage(); break;
      case 'chat': loadChatMessages(); break;
    }
    loadedPages.add(p);
  }
}
function startQuickMed() { navigate('meditation'); setDur(3, null); setTimeout(() => startMed(), 300); }
function showToast(icon, msg, type = 'info') {
  const c = document.getElementById('toastContainer'), el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icon}</span><span>${escapeHtml(msg)}</span>`;
  c.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(100%)';
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
  b.textContent = parseInt(b.textContent || '0') + 1;
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
  const s = Math.floor((new Date() - new Date(d)) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  return Math.floor(s / 86400) + 'j';
}
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
document.querySelectorAll('.modal-overlay').forEach(m => m.addEventListener('click', function (e) { if (e.target === this) this.classList.remove('show'); }));

function renderAboutPage() {
  const aboutDiv = document.getElementById('aboutContent');
  const content = aboutContent[currentLang] || aboutContent.fr;
  aboutDiv.innerHTML = `<div class="about-text">${content.replace(/\n/g, '<br>')}</div>`;
}

// =============================================
// 📖 BIBLE
// =============================================
let bCache = {};
function updateChapters() {
  const b = document.getElementById('bibleBook').value, s = document.getElementById('bibleChapter');
  s.innerHTML = '';
  for (let i = 1; i <= (BC[b] || 50); i++) s.innerHTML += `<option value="${i}">${i}</option>`;
}
async function loadBible() {
  const b = document.getElementById('bibleBook').value, c = document.getElementById('bibleChapter').value,
    ref = `${b} ${c}`, el = document.getElementById('bibleContent');
  el.innerHTML = '<div class="empty-state"><div class="loader-spinner" style="margin:0 auto 8px"></div></div>';
  if (bCache[ref]) { renderVerses(bCache[ref], ref); return; }
  try {
    const r = await fetch(`https://bible-api.com/${encodeURIComponent(ref)}?translation=lsg`);
    const d = await r.json();
    bCache[ref] = d;
    renderVerses(d, ref);
  } catch (e) {
    el.innerHTML = '<div class="empty-state"><p>⚠️ Erreur chargement</p><button class="btn btn-gold btn-sm" onclick="loadBible()">🔄 Réessayer</button></div>';
  }
}
function renderVerses(d, ref) {
  const el = document.getElementById('bibleContent');
  el.innerHTML = `<div style="margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--border-glass)"><strong style="color:var(--gold)">${escapeHtml(d.reference)}</strong></div>` +
    d.verses.map(v => `<div class="verse"><span class="verse-number">${v.verse}</span>${escapeHtml(v.text)} <span onclick="copyV('${escapeHtml(d.reference)}:${v.verse}','${escapeHtml(v.text)}')">📋</span> <span onclick="toggleFav('${escapeHtml(d.reference)}:${v.verse}','${escapeHtml(v.text)}')">⭐</span></div>`).join('');
}
function copyV(r, t) { navigator.clipboard.writeText(`${r} — ${t}`).then(() => showToast('📋', tr('copiedVerse'), 'success')); }
function toggleFav(ref, text) {
  let favs = JSON.parse(localStorage.getItem('bibleFavs') || '[]');
  const idx = favs.findIndex(f => f.ref === ref);
  if (idx !== -1) favs.splice(idx, 1);
  else favs.unshift({ ref, text, date: new Date().toISOString() });
  localStorage.setItem('bibleFavs', JSON.stringify(favs));
}

// =============================================
// IndexedDB
// =============================================
const DB_NAME = 'CER_DB';
const DB_VERSION = 3;
let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('sermons')) db.createObjectStore('sermons', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('videos')) db.createObjectStore('videos', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('gallery')) db.createObjectStore('gallery', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('chat')) db.createObjectStore('chat', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('announcements')) db.createObjectStore('announcements', { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
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

// Gallery
async function loadGalleryFromStorage() {
  const photos = await dbGetAll('gallery');
  photos.sort((a,b) => b.id - a.id);
  const g = document.getElementById('galGrid');
  const isAdmin = currentUser && (currentUser.role === 'superadmin' || currentUser.role === 'admin');
  const displayPhotos = photos.slice(0, 20);
  g.innerHTML = displayPhotos.length ? displayPhotos.map(p =>
    `<div class="gallery-item" onclick="zoomImg('${p.url}')"><img src="${p.url}" loading="lazy">
      ${isAdmin ? `<div class="delete-overlay" onclick="event.stopPropagation();deletePhoto('${p.id}')">🗑</div>` : ''}
    </div>`
  ).join('') : `<div class="empty-state"><p>${tr('noPhotos')}</p></div>`;
  
  if (photos.length > 20) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-secondary btn-block';
    btn.style.marginTop = '10px';
    btn.textContent = 'Voir plus...';
    btn.onclick = () => {
      btn.remove();
      g.innerHTML += photos.slice(20).map(p =>
        `<div class="gallery-item" onclick="zoomImg('${p.url}')"><img src="${p.url}" loading="lazy">
          ${isAdmin ? `<div class="delete-overlay" onclick="event.stopPropagation();deletePhoto('${p.id}')">🗑</div>` : ''}
        </div>`
      ).join('');
    };
    g.after(btn);
  }
}
window.deletePhoto = async (id) => { if (confirm('Supprimer ?')) { await dbDelete('gallery', id); loadGalleryFromStorage(); } };
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

// Announcements
async function loadAnnouncements() {
  const list = await dbGetAll('announcements');
  list.sort((a,b) => new Date(b.date) - new Date(a.date));
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
  const title = document.getElementById('annTitle').value, text = document.getElementById('annText').value;
  if (!title || !text) return;
  await dbPut('announcements', { id: Date.now(), title, text, date: new Date().toISOString(), admin: currentUser.name });
  loadAnnouncements();
}
async function deleteAnnouncement(id) { await dbDelete('announcements', id); loadAnnouncements(); }

// Chat
let currentChatMedia = null;
async function loadChatMessages() {
  const chat = await dbGetAll('chat');
  const container = document.getElementById('chatMessages');
  if (!container) return;
  container.innerHTML = chat.sort((a,b) => a.id - b.id).map(m => `
    <div style="align-self: ${currentUser && m.userId === currentUser.id ? 'flex-end' : 'flex-start'}">
      <div class="glass-card" style="padding: 8px">
        <p style="font-size: 10px; color: var(--gold)">${escapeHtml(m.userName)}</p>
        <p>${escapeHtml(m.text)}</p>
        ${m.media ? `<img src="${m.media.data}" style="max-width:100%">` : ''}
      </div>
    </div>
  `).join('');
  container.scrollTop = container.scrollHeight;
}
async function sendChatMessage() {
  const text = document.getElementById('chatInput').value;
  if (!text && !currentChatMedia) return;
  await dbPut('chat', { id: Date.now(), userId: currentUser.id, userName: currentUser.name, text, media: currentChatMedia, date: new Date().toISOString() });
  document.getElementById('chatInput').value = '';
  loadChatMessages();
}

// Sermons
async function loadSermonsFromDB() {
  const sermons = await dbGetAll('sermons');
  const container = document.getElementById('sermonsList');
  if (!container) return;
  container.innerHTML = sermons.length ? sermons.map(s => `
    <div class="glass-card">
      <div class="card-header">
        <h3 style="color:var(--gold)">${escapeHtml(s.title)}</h3>
        <p style="font-size:12px; color:var(--text-muted)">${new Date(s.date).toLocaleDateString()}</p>
      </div>
      <div id="video-container-${s.id}" class="video-placeholder" style="aspect-ratio:16/9; background:#000; display:flex; align-items:center; justify-content:center; cursor:pointer; border-radius:8px" onclick="playSermon('${s.id}')">
        <span style="font-size:40px">▶️</span>
      </div>
    </div>
  `).join('') : '<div class="empty-state"><p>Aucun sermon</p></div>';
}

async function playSermon(id) {
  const placeholder = document.getElementById(`video-container-${id}`);
  placeholder.innerHTML = '<div class="loader-spinner"></div>';
  try {
    const db = await getDB();
    const res = await db.transaction('videos').objectStore('videos').get(id);
    if (res && res.blob) {
      const url = URL.createObjectURL(res.blob);
      placeholder.innerHTML = `<video controls src="${url}" style="width:100%; border-radius:8px" autoplay></video>`;
      placeholder.onclick = null;
      placeholder.style.cursor = 'default';
    }
  } catch (e) { console.error(e); }
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
  const e = document.getElementById('loginEmail').value.toLowerCase(), p = document.getElementById('loginPass').value;
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
  const n = document.getElementById('regName').value.trim(),
    e = document.getElementById('regEmail').value.toLowerCase(),
    p = document.getElementById('regPass').value;
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

function manageUsers() {
  document.getElementById('userManageModal').classList.add('show');
  renderUserList();
}

function renderUserList() {
  const users = getAppUsers();
  const list = document.getElementById('userList');
  list.innerHTML = users.map(u => `
    <div class="calendar-event" style="margin-bottom:10px; padding:10px">
      <div class="event-info">
        <h4 style="color:var(--gold)">${escapeHtml(u.name)}</h4>
        <p style="font-size:11px">${escapeHtml(u.email)}</p>
        <div style="margin-top:8px; display:flex; gap:5px; align-items:center">
          <select class="form-select" style="width:auto; padding:2px 5px; font-size:11px" onchange="changeUserRole('${u.id}', this.value)">
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
  let users = getAppUsers();
  users = users.filter(u => u.id !== uid);
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
      if (playerContainer.innerHTML === '') {
        const yId = live.url.includes('v=') ? live.url.split('v=')[1].split('&')[0] : null;
        playerContainer.innerHTML = yId ? `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${yId}?autoplay=1" allowfullscreen></iframe>` : `<a href="${live.url}" target="_blank" class="btn btn-gold">Rejoindre</a>`;
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
  const title = document.getElementById('liveTitleInput').value, url = document.getElementById('liveStreamUrl').value;
  localStorage.setItem(LIVE_KEY, JSON.stringify({ active:true, title, url }));
  checkLiveStatus();
}
function handleStopLive() { localStorage.removeItem(LIVE_KEY); checkLiveStatus(); }

setInterval(() => {
  checkLiveStatus();
  if (document.getElementById('page-chat').classList.contains('active')) loadChatMessages();
}, 10000);

function zoomImg(u) { document.getElementById('zoomImg').src = u; document.getElementById('imageZoomModal').classList.add('show'); }
function loadMedStats() {
  const s = JSON.parse(localStorage.getItem('medSess') || '[]');
  const tot = s.reduce((a, x) => a + (x.duration || 0), 0);
  document.getElementById('totalMedTime').textContent = Math.round(tot / 60);
  document.getElementById('totalMedSessions').textContent = s.length;
}
function loadMedHist() {
  const s = JSON.parse(localStorage.getItem('medSess') || '[]'), c = document.getElementById('medHistory');
  if (!c) return;
  c.innerHTML = s.slice(0, 10).map(x => `<div class="med-history-item"><h4>${x.mode}</h4><p>${timeAgo(x.date)}</p></div>`).join('');
}
function loadJournalEntries() {
  const e = JSON.parse(localStorage.getItem('medJ') || '[]'), c = document.getElementById('journalEntries');
  if (!c) return;
  c.innerHTML = e.slice(0, 5).map(x => `<div class="favorite-item"><p>${escapeHtml(x.text.substring(0, 50))}...</p></div>`).join('');
}
function renderYoutubeList() {
  const s = JSON.parse(localStorage.getItem('ytSermons') || '[]');
  const c = document.getElementById('ytList');
  if (!c) return;
  c.innerHTML = s.map(v => `<div class="glass-card"><h3>${escapeHtml(v.title)}</h3><iframe src="https://www.youtube.com/embed/${v.youtubeId}"></iframe></div>`).join('');
}
