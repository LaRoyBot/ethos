// === FIREBASE CONFIGURATION ===
// NOTE: Client-side Firebase keys are designed to be public.
// Project safety is guaranteed by strict Database Security Rules (Issue 2/9)
// and API restrictions/App Check set up in the Firebase Console.
const firebaseConfig = {
  apiKey: "AIzaSyCOQmc-GacWr2OrGqRKaU3Na4NAePe7_T4",
  authDomain: "ethos-jet.firebaseapp.com",
  projectId: "ethos-jet",
  storageBucket: "ethos-jet.firebasestorage.app",
  messagingSenderId: "936086701935",
  appId: "1:936086701935:web:0b891975a9ee1a5bfe0a9a",
  databaseURL: "https://ethos-jet-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
  try {
    firebase.initializeApp(firebaseConfig);
  } catch (e) {
    console.error("Firebase initialization failed:", e);
  }
}

// === STATE ===
function escapeHtml(s) {
  if (typeof s !== 'string') return s;
  return s.replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
}

function load(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch{return d;}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}

let S = load('mathInit_state', {
  routines: DEFAULT_ROUTINES,
  ethosGroups: JSON.parse(JSON.stringify(ETHOS_GROUPS)),
  papers: DEFAULT_PAPERS,
  skills: {}, xp: 0, xpToday: 0, streak: 0,
  totalHours: 0, weekHours: 0,
  todayNote: '', paperNote: '',
  logs: [], contrib: [], lastDate: '', theme: 'default',
  weekOffset: 0, history: {}, activeDate: new Date().toDateString(),
  activeGroupFilter: 'all',
  swimHistory: DEFAULT_SWIM_HISTORY,
  waterLogs: Object.assign({}, DEFAULT_WATER_LOGS),
  weightLogs: [{ date: '2026-05-19', weight: 70.0, uricAcid: 5.0, hdl: 50, eosinophils: 2.0 }],
  trilumaStartDate: '2026-01-01',
  todayOnlyToggle: true,
  swimFilter: 'all',
  swimSearchQuery: '',
  authEmail: '',
  authUsername: '',
  lastUpdated: 0
});

function sanitizeStateArrays(state) {
  if (!state) return;
  const ensureArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'object') {
      return Object.keys(val)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(k => val[k]);
    }
    return [];
  };
  state.logs = ensureArray(state.logs);
  state.contrib = ensureArray(state.contrib);
  state.swimHistory = ensureArray(state.swimHistory);
  state.weightLogs = ensureArray(state.weightLogs);
  state.reminders = ensureArray(state.reminders);
  state.oracleHistory = ensureArray(state.oracleHistory);
  state.papers = ensureArray(state.papers);
  if (state.routines) {
    state.routines = ensureArray(state.routines);
    state.routines.forEach(r => {
      if (r) r.ethe = ensureArray(r.ethe);
    });
  }
  
  // Safeguards for empty objects stripped by Firebase
  state.history = state.history || {};
  state.skills = state.skills || {};
  state.unlockedAchievements = state.unlockedAchievements || {};
  state.notificationSettings = state.notificationSettings || { enabled: false, sound: 'cyber_pulse', volume: 0.6 };
}
sanitizeStateArrays(S);


// === MIGRATION ===
// Old key migration
if (!S.routines && localStorage.getItem('mathInit')) {
  const old = load('mathInit', null);
  if (old) {
    S = old;
    localStorage.removeItem('mathInit');
  }
}
// habits[] -> ethe[] migration
if (S.groups && !S.routines) {
  S.routines = S.groups.map(g => {
    const r = Object.assign({}, g);
    if (r.habits) { r.ethe = r.habits; delete r.habits; }
    if (!r.ethe) r.ethe = [];
    r.ethe.forEach(e => { if (!e.groupId) e.groupId = 'math'; });
    return r;
  });
  delete S.groups;
}
if (S.habits && !S.routines) {
  S.routines = DEFAULT_ROUTINES;
  delete S.habits;
}
// Ensure routines have ethe not habits
if (S.routines) {
  S.routines.forEach(r => {
    if (r.habits && !r.ethe) { r.ethe = r.habits; delete r.habits; }
    if (!r.ethe) r.ethe = [];
    r.ethe.forEach(e => { if (!e.groupId) e.groupId = 'math'; });
  });
}
// Migration: Ensure habit ID 303 is named "Swimming session (90 min)" if it was set to the default "Cardio / aerobic conditioning" or "Swimming"
if (S.routines) {
  S.routines.forEach(r => {
    if (r.ethe) {
      r.ethe.forEach(e => {
        if (Number(e.id) === 303 && (e.name === 'Cardio / aerobic conditioning' || e.name === 'Swimming')) {
          e.name = 'Swimming session (90 min)';
        }
      });
    }
  });
}
if (!S.ethosGroups) S.ethosGroups = JSON.parse(JSON.stringify(ETHOS_GROUPS));
if (S.weekOffset === undefined) S.weekOffset = 0;
if (!S.history) S.history = {};
if (!S.activeDate) S.activeDate = new Date().toDateString();
if (!S.activeGroupFilter) S.activeGroupFilter = 'all';
SKILLS.forEach(s => { if (S.skills[s.key] === undefined) S.skills[s.key] = 0; });
if (!S.focusStats) S.focusStats = { sessions: 0, totalMins: 0, maxSessionMins: 0 };
if (!S.unlockedAchievements) S.unlockedAchievements = {};

// Safe migrations for lifestyle parameters
if (S.swimHistory === undefined) S.swimHistory = DEFAULT_SWIM_HISTORY;
if (S.waterLogs === undefined) S.waterLogs = {};
if (S.weightLogs === undefined) S.weightLogs = [{ date: '2026-05-19', weight: 70.0, uricAcid: 5.0, hdl: 50, eosinophils: 2.0 }];
if (S.trilumaStartDate === undefined) S.trilumaStartDate = '2026-01-01';
if (S.todayOnlyToggle === undefined) S.todayOnlyToggle = true;
if (S.swimFilter === undefined) S.swimFilter = 'all';
if (S.swimSearchQuery === undefined) S.swimSearchQuery = '';

// v2.3.0 migrations
if (S.crtEnabled === undefined) S.crtEnabled = false;
if (!S.cmdHistory) S.cmdHistory = [];
var historyIdx = -1;

// v2.4.0 migrations
if (!S.ethosViewMode) S.ethosViewMode = 'groups';
if (!S.protocolCollapsed) S.protocolCollapsed = {};

// Cloud Sync migrations
if (S.authEmail === undefined) S.authEmail = '';
if (S.authUsername === undefined) S.authUsername = '';
if (S.lastUpdated === undefined) S.lastUpdated = 0;
if (S.pushCount === undefined) S.pushCount = 0;
if (S.customSyncProxy === undefined) S.customSyncProxy = '';
if (S.customSyncKey === undefined) S.customSyncKey = '';

// PWA & Reminders migrations
if (!S.reminders) S.reminders = [];
if (!S.notificationSettings) S.notificationSettings = { enabled: false, sound: 'cyber_chime', volume: 0.5 };

// Oracle AI Conversational Engine migrations
if (S.geminiKey === undefined) S.geminiKey = '';
if (!S.oracleHistory) S.oracleHistory = [];

// ECRE Session Memory migrations
if (!S.ecreMemory) S.ecreMemory = {
  lastObservations: [],     // Last 7 observations
  namedPatterns: [],        // Explicitly named patterns
  openQuestions: [],        // Diagnostic questions posed: { question, answer, date, sessionAsked }
  userPromises: [],         // Promises made by user: { promise, date, targetGroup, fulfilled }
  sessionCount: 0,
  patternViolationActive: false
};
S.ecreMemory.sessionCount = (S.ecreMemory.sessionCount || 0) + 1;
ss(true);

let TODAY = new Date().toDateString();

function checkDailyReset(skipFirebase = false) {
  const currentToday = new Date().toDateString();
  if (S.lastDate !== currentToday) {
    if (S.lastDate) {
      S.history[S.lastDate] = {};
      S.routines.forEach(r => r.ethe.forEach(e => { S.history[S.lastDate][e.id] = e.done; }));
    }
    S.routines.forEach(r => r.ethe.forEach(e => { if(!e.isWater) e.done = false; }));
    S.xpToday = 0; S.lastDate = currentToday; S.activeDate = currentToday;
    ss(skipFirebase);
  } else {
    S.routines.forEach(r => r.ethe.forEach(e => {
      if(!e.isWater) {
        e.done = S.history[S.activeDate] ? !!S.history[S.activeDate][e.id] : (S.activeDate === TODAY ? e.done : false);
      }
    }));
  }
}

function updateTodayDate() {
  const currentToday = new Date().toDateString();
  if (TODAY !== currentToday) {
    TODAY = currentToday;
    checkDailyReset(false);
    render();
    addLog('info', `system clock: new day detected (${TODAY}). rolled over lifestyle parameters.`);
  }
}
setInterval(updateTodayDate, 30000);

function getNetworkErrorTip(err) {
  const isNetworkErr = (err && (err.code === 'auth/network-request-failed' || 
                                (err.message && err.message.toLowerCase().includes('network'))));
  if (isNetworkErr) {
    return '<div style="margin-top: 8px; padding: 10px; background: rgba(255, 68, 68, 0.08); border: 1px solid rgba(255, 68, 68, 0.3); border-radius: 4px; font-size: 11px; line-height: 1.4; color: var(--text);">' +
           '<strong style="color:var(--red);">[NETWORK BLOCK DETECTED]</strong><br>' +
           '// Connection to Firebase Auth servers (googleapis.com) was blocked.<br>' +
           '<b>Probable Causes & Solutions:</b><br>' +
           ' 1. <b>Ad Blockers / Privacy Shields:</b> Extensions like uBlock Origin, Privacy Badger, or Brave Shields often block googleapis.com. Disable them temporarily for this app.<br>' +
           ' 2. <b>DNS Blockers:</b> Using custom DNS (AdGuard DNS, NextDNS, Pi-hole)? They might block googleapis.com. Try using standard DNS (e.g. 1.1.1.1 or 8.8.8.8) or cellular hotspot.<br>' +
           ' 3. <b>Firewall / VPN:</b> A VPN or custom firewall rules might be filtering network traffic.<br>' +
           ' 4. <b>Inspection:</b> Press F12 to open Developer Tools, click the "Console" or "Network" tab, and look for red failed connection logs to identify the exact blocked host.' +
           '</div>';
  }
  return '';
}

// Run daily reset on boot locally without bumping timestamp
checkDailyReset(true);

let _bootSyncLocked = true; // Prevent ss() from bumping lastUpdated during boot pull
function unlockBootSync() {
  _bootSyncLocked = false;
}

function ss(skipFirebase = false) {
  if (!skipFirebase && !_bootSyncLocked) {
    S.lastUpdated = Date.now();
  }
  save('mathInit_state', S);
  if (!skipFirebase && !_bootSyncLocked && typeof firebase !== 'undefined' && firebase.auth().currentUser) {
    queueFirebaseSyncPush();
  }
}

let _syncPushTimer = null;
function queueFirebaseSyncPush() {
  if (_syncPushTimer) clearTimeout(_syncPushTimer);
  _syncPushTimer = setTimeout(function() {
    _syncPushTimer = null;
    firebaseSyncPush();
  }, 1200);
}

function getStateStats(state) {
  var routines = Array.isArray(state && state.routines) ? state.routines : [];
  var etheCount = 0;
  routines.forEach(function(r) {
    if (r && Array.isArray(r.ethe)) etheCount += r.ethe.length;
  });
  return {
    pushCount: (state && state.pushCount) || 0,
    xp: (state && state.xp) || 0,
    etheCount: etheCount,
    size: state ? JSON.stringify(state).length : 0
  };
}

function backupLocalStateBeforeCloudReplace(reason) {
  try {
    var stamp = new Date().toISOString().replace(/[:.]/g, '-');
    localStorage.setItem('mathInit_state_backup_' + stamp, JSON.stringify({
      reason: reason || 'cloud_replace',
      savedAt: Date.now(),
      state: S
    }));
  } catch (e) {
    console.warn('[Sync] Could not save pre-replace local backup:', e);
  }
}

// === FIREBASE CLOUD SYNC CORE ===
// Same-origin Vercel API gateway: the best sync path.
// Priority: 1) /api/sync (same domain, zero CORS) → 2) customSyncProxy → 3) direct Firebase REST → 4) Firebase WebSocket
let _vercelGatewayAvailable = null; // null = untested, true/false = cached probe result

function getCleanSyncKey() {
  return (S.customSyncKey || '').trim().replace(/^["']|["']$/g, '');
}

function getSyncGatewayUrl(uid) {
  const cleanKey = getCleanSyncKey();
  if (_vercelGatewayAvailable !== false) {
    return { url: '/api/sync', type: 'gateway', headers: {} };
  }
  if (S.customSyncProxy && cleanKey) {
    var host = S.customSyncProxy.replace(/\/$/, '');
    return { url: host + '/sync/' + uid + '.json', type: 'proxy', headers: { 'x-sync-key': cleanKey } };
  }
  return null;
}

function getSyncRequestHeaders(gw) {
  var baseHeaders = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
  if (gw && gw.type === 'gateway') {
    var user = typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser;
    if (!user) return Promise.reject(new Error('User not authenticated'));
    return user.getIdToken(false).then(function(token) {
      return Object.assign(baseHeaders, { 'Authorization': 'Bearer ' + token });
    });
  }
  return Promise.resolve(Object.assign(baseHeaders, gw ? gw.headers : {}));
}

function getSyncPathReport() {
  var user = typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser;
  var uid = user ? user.uid : '<not-authenticated>';
  var gw = user ? getSyncGatewayUrl(uid) : null;
  var cleanKey = getCleanSyncKey();
  return {
    uid: uid,
    path: gw ? gw.type.toUpperCase() : 'DIRECT FIREBASE',
    url: gw ? gw.url : firebaseConfig.databaseURL + '/sync/' + uid,
    clientKeyLength: cleanKey.length,
    auth: gw && gw.type === 'gateway' ? 'Firebase ID token' : (cleanKey ? 'sync key' : 'Firebase direct')
  };
}

function getSyncErrorMessage(err) {
  var msg = (err && err.message) ? err.message : String(err);
  if (msg.indexOf('HTTP 401') !== -1) {
    return msg + '. The sync gateway rejected the Firebase login token. Sign out, sign back in, then try sync again.';
  }
  return msg;
}

function probeGateway() {
  if (_vercelGatewayAvailable !== null) return Promise.resolve(_vercelGatewayAvailable);
  return fetch('/api/health', { method: 'GET', cache: 'no-store' })
    .then(function(r) { _vercelGatewayAvailable = r.ok; console.log('[Sync] Gateway probe:', _vercelGatewayAvailable ? 'AVAILABLE' : 'NOT AVAILABLE'); return _vercelGatewayAvailable; })
    .catch(function() { _vercelGatewayAvailable = false; console.log('[Sync] Gateway probe: NOT AVAILABLE (fetch error)'); return false; });
}
probeGateway();

function firebaseDirectRestPush(uid, callback) {
  if (typeof firebase === 'undefined') { if (callback) callback(false, 'Firebase not loaded'); return; }
  if (!firebase.auth().currentUser) { if (callback) callback(false, 'User not authenticated'); return; }
  S.pushCount = (S.pushCount || 0) + 1;
  firebase.auth().currentUser.getIdToken(false)
    .then(function(idToken) {
      var restUrl = firebaseConfig.databaseURL + '/sync/' + uid + '.json?auth=' + encodeURIComponent(idToken);
      var syncableState = Object.assign({}, S);
      delete syncableState.cmdHistory;
      return fetch(restUrl, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ state: syncableState, lastUpdated: S.lastUpdated, pushCount: S.pushCount }) });
    })
    .then(function(response) { if (!response.ok) throw new Error('Direct REST push HTTP ' + response.status); return response.json(); })
    .then(function(data) { console.log('[Sync] Direct REST push succeeded:', data); if (callback) callback(true, 'pushed'); })
    .catch(function(err) { console.error('[Sync] Direct REST push failed:', err); if (callback) callback(false, err); });
}

function firebaseDirectRestPull(uid, callback, forcePull, isDirectCall) {
  var statusEl = document.getElementById('auth-sync-status');
  if (typeof firebase === 'undefined' || !firebase.auth().currentUser) {
    if (statusEl) statusEl.textContent = 'Status: not authenticated';
    unlockBootSync();
    if (callback) callback(false, 'Not authenticated');
    return;
  }
  firebase.auth().currentUser.getIdToken(false)
    .then(function(idToken) {
      var restUrl = firebaseConfig.databaseURL + '/sync/' + uid + '.json?auth=' + encodeURIComponent(idToken);
      return fetch(restUrl, { method: 'GET', headers: { 'Accept': 'application/json' }, cache: 'no-store' });
    })
    .then(function(response) { if (!response.ok) throw new Error('Direct REST HTTP ' + response.status); return response.json(); })
    .then(function(val) { console.log('[Sync] Direct REST pull succeeded:', val ? 'data found' : 'no data'); applyCloudState(val, forcePull, callback); })
    .catch(function(err) {
      console.error('[Sync] Direct REST pull failed:', err);
      if (statusEl) statusEl.textContent = 'Status: sync error (REST failed) - ' + err.message;
      unlockBootSync();
      if (callback) callback(false, err);
      if (isDirectCall) { var tip = getNetworkErrorTip(err); if (tip) printTerm(tip, 'info'); }
    });
}

function firebaseRestPush(uid, callback) {
  var gw = getSyncGatewayUrl(uid);
  if (gw) {
    S.pushCount = (S.pushCount || 0) + 1;
    var syncableState = Object.assign({}, S);
    delete syncableState.cmdHistory;
    getSyncRequestHeaders(gw).then(function(headers) {
      return fetch(gw.url, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({ state: syncableState, lastUpdated: S.lastUpdated, pushCount: S.pushCount })
      });
    })
    .then(function(response) { if (!response.ok) throw new Error(gw.type + ' push HTTP ' + response.status); return response.json(); })
    .then(function(data) { console.log('[Sync] ' + gw.type + ' push succeeded:', data); if (callback) callback(true, 'pushed'); })
    .catch(function(err) {
      console.error('[Sync] ' + gw.type + ' push failed:', err);
      if (callback) callback(false, getSyncErrorMessage(err));
    });
    return;
  }
  firebaseDirectRestPush(uid, callback);
}

function firebaseSyncPush(callback) {
  if (typeof firebase === 'undefined') { if (callback) callback(false, 'Firebase not loaded'); return; }
  var user = firebase.auth().currentUser;
  if (!user) { if (callback) callback(false, 'User not authenticated'); return; }
  var gw = getSyncGatewayUrl(user.uid);
  if (gw) { firebaseRestPush(user.uid, callback); return; }
  try { firebase.database().goOnline(); } catch (e) { console.warn("Firebase goOnline failed:", e); }
  S.pushCount = (S.pushCount || 0) + 1;
  try {
    var syncableState = Object.assign({}, S);
    delete syncableState.cmdHistory;
    firebase.database().ref('sync/' + user.uid).set({ state: syncableState, lastUpdated: S.lastUpdated, pushCount: S.pushCount })
      .then(function() { if (callback) callback(true, 'pushed'); })
      .catch(function(err) { console.error("Firebase push failed:", err); if (callback) callback(false, err); });
  } catch (err) { console.error("Firebase database push initialization failed:", err); if (callback) callback(false, err); }
}

// === ROBUST CLOUD PULL ENGINE ===
// Applies cloud state to the local app. Shared by both WebSocket and REST paths.
function applyCloudState(val, forcePull, callback) {
  const statusEl = document.getElementById('auth-sync-status');
  if (val && val.state) {
    const cloudTime = val.lastUpdated || val.state.lastUpdated || 0;
    const cloudPushCount = val.pushCount || val.state.pushCount || 0;
    const localTime = S.lastUpdated || 0;
    const localPushCount = S.pushCount || 0;

    const cloudIsNewer = cloudTime > localTime
      || (cloudTime === localTime && cloudPushCount > localPushCount);
    const localIsNewer = localTime > cloudTime
      || (localTime === cloudTime && localPushCount > cloudPushCount);

    if (forcePull || cloudIsNewer) {
      const prevAuthEmail = S.authEmail;
      const prevAuthUsername = S.authUsername;
      const prevCmdHistory = S.cmdHistory || [];
      const prevCustomSyncProxy = S.customSyncProxy || '';
      const prevCustomSyncKey = S.customSyncKey || '';
      const prevGeminiKey = S.geminiKey || '';
      const localStats = getStateStats(S);
      const cloudStats = getStateStats(val.state);

      if (forcePull && localStats.pushCount > cloudStats.pushCount && localStats.size > cloudStats.size) {
        const msg = 'Refused forced cloud pull because remote state looks older/smaller than local. Local pushCount=' + localStats.pushCount + ', remote pushCount=' + cloudStats.pushCount + '.';
        console.warn('[Sync] ' + msg);
        addLog('warn', 'Cloud sync: ' + msg);
        if (statusEl) statusEl.textContent = 'Status: pull refused (remote state looks stale)';
        unlockBootSync();
        if (callback) callback(false, msg);
        return;
      }

      backupLocalStateBeforeCloudReplace(forcePull ? 'force_pull' : 'cloud_newer');
      S = val.state;
      sanitizeStateArrays(S);
      S.authEmail = prevAuthEmail;
      S.authUsername = prevAuthUsername;
      S.cmdHistory = prevCmdHistory;
      S.customSyncProxy = prevCustomSyncProxy;
      S.customSyncKey = prevCustomSyncKey;
      S.geminiKey = prevGeminiKey || S.geminiKey || '';

      // DO NOT run checkDailyReset here — the cloud state's done flags
      // are the source of truth. Running daily reset would wipe them.
      ss(true);
      render();
      addLog('info', 'Cloud sync: Pulled state from cloud.');
      if (statusEl) statusEl.textContent = 'Status: synced (pulled cloud state)';
      unlockBootSync();
      if (callback) callback(true, 'pulled');
    } else if (localIsNewer) {
      firebaseSyncPush();
      addLog('info', 'Cloud sync: Pushed newer local state to cloud.');
      if (statusEl) statusEl.textContent = 'Status: synced (pushed newer state)';
      unlockBootSync();
      if (callback) callback(true, 'pushed');
    } else {
      if (statusEl) statusEl.textContent = 'Status: synced (up to date)';
      unlockBootSync();
      if (callback) callback(true, 'synced');
    }
  } else {
    firebaseSyncPush();
    addLog('info', 'Cloud sync: Initialized cloud backup with local state.');
    if (statusEl) statusEl.textContent = 'Status: synced (created cloud backup)';
    unlockBootSync();
    if (callback) callback(true, 'pushed_initial');
  }
}

// REST API pull — uses gateway → proxy → direct Firebase REST.
function firebaseRestPull(uid, callback, forcePull, isDirectCall) {
  var statusEl = document.getElementById('auth-sync-status');
  if (isDirectCall) {
    if (statusEl) statusEl.textContent = 'Status: pulling via REST API...';
    console.log('[Sync] Direct REST API pull initiated.');
  } else {
    if (statusEl) statusEl.textContent = 'Status: WebSocket timed out, trying REST API...';
    addLog('warn', 'Cloud sync: WebSocket hung — falling back to REST API.');
    console.warn('[Sync] WebSocket once(value) timed out. Using REST API fallback.');
  }
  var gw = getSyncGatewayUrl(uid);
  if (gw) {
    getSyncRequestHeaders(gw).then(function(headers) {
      delete headers['Content-Type'];
      return fetch(gw.url, { method: 'GET', headers: headers, cache: 'no-store' });
    })
    .then(function(response) { if (!response.ok) throw new Error(gw.type + ' HTTP ' + response.status); return response.json(); })
    .then(function(val) { console.log('[Sync] ' + gw.type + ' pull succeeded:', val ? 'data found' : 'no data'); applyCloudState(val, forcePull, callback); })
    .catch(function(err) {
      console.error('[Sync] ' + gw.type + ' pull failed:', err);
      if (statusEl) statusEl.textContent = 'Status: sync error (' + gw.type + ' failed) - ' + err.message;
      unlockBootSync();
      if (callback) callback(false, getSyncErrorMessage(err));
    });
    return;
  }
  firebaseDirectRestPull(uid, callback, forcePull, isDirectCall);
}

function firebaseSyncPull(callback, forcePull = false) {
  if (typeof firebase === 'undefined') {
    if (callback) callback(false, 'Firebase not loaded');
    return;
  }
  const user = firebase.auth().currentUser;
  if (!user) {
    if (callback) callback(false, 'User not authenticated');
    return;
  }

  // Bypasses direct Firebase WebSocket check entirely if Same-Origin Gateway is active
  var gw = getSyncGatewayUrl(user.uid);
  if (gw) {
    firebaseRestPull(user.uid, callback, forcePull, true);
    return;
  }

  try {
    firebase.database().goOnline();
  } catch (e) {
    console.warn("Firebase goOnline failed:", e);
  }

  const statusEl = document.getElementById('auth-sync-status');
  if (statusEl) statusEl.textContent = 'Status: syncing with cloud...';
  console.log('[Sync] Starting pull — racing WebSocket vs 10s timeout...');

  // Create a timeout promise that resolves with a sentinel value after 10 seconds
  const SYNC_TIMEOUT_MS = 10000;
  const TIMEOUT_SENTINEL = Symbol('TIMEOUT');
  const timeoutPromise = new Promise(resolve => {
    setTimeout(() => resolve(TIMEOUT_SENTINEL), SYNC_TIMEOUT_MS);
  });

  try {
    const wsPromise = firebase.database().ref('sync/' + user.uid).once('value')
      .then(snapshot => snapshot.val());

    Promise.race([wsPromise, timeoutPromise])
      .then(result => {
        if (result === TIMEOUT_SENTINEL) {
          // WebSocket hung — fall back to REST
          console.warn('[Sync] WebSocket timed out after ' + SYNC_TIMEOUT_MS + 'ms');
          firebaseRestPull(user.uid, callback, forcePull);
        } else {
          // WebSocket succeeded
          console.log('[Sync] WebSocket pull succeeded');
          applyCloudState(result, forcePull, callback);
        }
      })
      .catch(err => {
        console.error('[Sync] WebSocket pull errored, trying REST:', err);
        firebaseRestPull(user.uid, callback, forcePull);
      });
  } catch (err) {
    console.error("Firebase database pull initialization failed:", err);
    if (statusEl) statusEl.textContent = 'Status: database error - ' + err.message;
    unlockBootSync();
    if (callback) callback(false, err);
  }
}

function renderSyncPanel() {
  const usernameEl = document.getElementById('auth-profile-username');
  const emailEl = document.getElementById('auth-profile-email');
  const statusEl = document.getElementById('auth-sync-status');
  if (usernameEl) {
    usernameEl.textContent = S.authUsername ? '@' + S.authUsername : (S.authEmail ? '@' + S.authEmail.split('@')[0] : 'unknown');
  }
  if (emailEl) {
    emailEl.textContent = S.authEmail ? '(' + S.authEmail + ')' : '';
  }
  if (statusEl && !S.authEmail) {
    statusEl.textContent = 'Status: unauthenticated';
  }
}

function handleLogout() {
  addLog('info', 'Deauthorizing current terminal session...');
  const clearDemoAndReload = () => {
    S.authEmail = '';
    S.authUsername = '';
    save('mathInit_state', S);
    window.location.reload();
  };
  
  if (currentUser && currentUser.uid === 'demo-session') {
    clearDemoAndReload();
    return;
  }
  
  if (typeof firebase === 'undefined') {
    clearDemoAndReload();
    return;
  }
  
  firebase.auth().signOut().then(() => {
    clearDemoAndReload();
  }).catch(err => {
    console.error("Sign out failed:", err);
    clearDemoAndReload();
  });
}

// === v2 LIFESTYLE MIGRATION ===
// Replaces dummy data with real lifestyle + study routines
if (!S.v2LifestyleLoaded) {
  S.routines = DEFAULT_ROUTINES;
  S.ethosGroups = JSON.parse(JSON.stringify(ETHOS_GROUPS));
  S.papers = DEFAULT_PAPERS;
  S.streak = 0;
  S.xp = 0;
  S.xpToday = 0;
  S.totalHours = 0;
  S.weekHours = 0;
  S.logs = [];
  S.contrib = [];
  S.skills = {};
  SKILLS.forEach(s => { S.skills[s.key] = 0; });
  S.history = {};
  S.unlockedAchievements = {};
  S.focusStats = { sessions: 0, totalMins: 0, maxSessionMins: 0 };
  S.dummyLoaded = false;
  S.v2LifestyleLoaded = true;
  S.swimHistory = DEFAULT_SWIM_HISTORY;
  S.waterLogs = Object.assign({}, DEFAULT_WATER_LOGS);
  S.weightLogs = [{ date: '2026-05-19', weight: 91.0, uricAcid: 7.2, hdl: 42, eosinophils: 5.5 }];
  S.trilumaStartDate = '2026-05-01';
  S.todayOnlyToggle = true;
  S.swimFilter = 'all';
  S.swimSearchQuery = '';
  S.routines.forEach(r => r.ethe.forEach(e => { e.done = false; e.streak = 0; }));
  ss();
}

// === v2.2.0 WATER SEED MIGRATION ===
if (!S.v22WaterSeeded) {
  S.waterLogs = Object.assign({}, DEFAULT_WATER_LOGS);
  S.v22WaterSeeded = true;
  ss();
}

// === v2.3.2 HISTORY KEY FORMAT MIGRATION ===
if (!S.historyKeysMigrated) {
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
  const newHistory = {};
  Object.keys(S.history || {}).forEach(key => {
    let normalizedKey = key;
    if (isoRegex.test(key)) {
      // Convert "2026-05-21" → "Thu May 21 2026"
      const d = new Date(key + 'T00:00:00');
      normalizedKey = d.toDateString();
    }
    if (!newHistory[normalizedKey]) {
      newHistory[normalizedKey] = S.history[key];
    } else {
      // Merge: true wins over false
      newHistory[normalizedKey] = Object.assign({}, newHistory[normalizedKey], S.history[key]);
      Object.keys(S.history[key]).forEach(id => {
        if (S.history[key][id] === true) {
          newHistory[normalizedKey][id] = true;
        }
      });
    }
  });
  S.history = newHistory;
  S.historyKeysMigrated = true;
  ss(true); // save locally, don't push yet
}

// === BOOT & AUTH GATEWAY CONTROL ===
let bootFinished = false;
let authStateFetched = false;
let currentUser = null;

function tryDismissBoot() {
  if (!bootFinished || !authStateFetched) return;
  
  const bootEl = document.getElementById('boot');
  if (currentUser) {
    if (bootEl) {
      bootEl.classList.add('done');
      setTimeout(() => bootEl.remove(), 600);
    }
    try {
      init();
    } catch (e) {
      console.error("Downstream initialization failed, but boot transition succeeded:", e);
    }
  } else {
    const authGate = document.getElementById('auth-gate');
    if (authGate) {
      authGate.style.display = 'block';
    }
  }
}

// Start boot timer
setTimeout(() => {
  bootFinished = true;
  tryDismissBoot();
}, document.getElementById('boot') ? 2200 : 0);

// Double-tap 't' to fast boot into terminal if authenticated
let lastTKeyPress = 0;
document.addEventListener('keydown', function(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
    return;
  }
  
  if (e.key.toLowerCase() === 't') {
    const now = Date.now();
    if (now - lastTKeyPress < 500) {
      if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
        bootFinished = true;
        authStateFetched = true;
        currentUser = firebase.auth().currentUser;
        
        // Remove boot gate immediately
        const bootEl = document.getElementById('boot');
        if (bootEl) {
          bootEl.classList.add('done');
          bootEl.remove();
        }
        
        try {
          init();
        } catch (err) {
          console.error("Downstream init failed during fast boot:", err);
        }
        
        // Launch interactive terminal instantly
        const terminalEl = document.getElementById('interactive-terminal');
        if (terminalEl) {
          terminalEl.classList.add('open');
          const tvInput = document.getElementById('tv-input');
          if (tvInput) tvInput.focus();
          const outInner = document.getElementById('tv-output-inner');
          if (outInner && outInner.innerHTML === '') {
            var welcomeLogo = 
              '<div style="font-family: monospace; white-space: pre; line-height: 1.4; color: var(--text-dim);">' +
              '  ███████╗████████╗██╗  ██╗ ██████╗ ███████╗\n' +
              '  ██╔════╝╚══██╔══╝██║  ██║██╔═══██╗██╔════╝\n' +
              '  █████╗     ██║   ███████║██║   ██║███████╗\n' +
              '  ██╔══╝     ██║   ██╔══██║██║   ██║╚════██║\n' +
              '  ███████╗   ██║   ██║  ██║╚██████╔╝███████║\n' +
              '  ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝\n' +
              '</div>' +
              '<div style="margin-top: 8px;">' + ('ethos.init v2.4.0 interactive mode. type "help" for commands.') + '</div>';
            printTermTyped(welcomeLogo, 'sys');
          }
        }
      }
    }
    lastTKeyPress = now;
  }
});

// === INIT ===
let initCalled = false;
function init() {
  if (initCalled) return;
  initCalled = true;
  if (S.theme && S.theme !== 'default') document.documentElement.setAttribute('data-theme', S.theme);
  // CRT overlay init
  var crtEl = document.getElementById('crt-screen-effect');
  if (crtEl) { if (S.crtEnabled) crtEl.classList.add('crt-active'); else crtEl.classList.remove('crt-active'); }
  initTabs(); initButtons(); render(); startClock(); startFlowerAnimation();
  
  // v2.4.0 PWA & Reminders Init
  initPWANotifications();
  startReminderTicker();

  // ECRE Waveform and diagnostics boot
  if (typeof initCoherenceWave === 'function') initCoherenceWave();
  if (typeof printECREDiagnosticBoot === 'function') printECREDiagnosticBoot();

  // Global Ctrl+Alt+C shortcut for CRT toggle
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      toggleCRT();
    }
  });
}

// === INTERACTIVE TERMINAL AUTH PORTAL ===
let isSignUpMode = false;

function initAuthGate() {
  const submitBtn = document.getElementById('auth-submit-btn');
  const switchBtn = document.getElementById('auth-switch-btn');
  const emailInput = document.getElementById('auth-email');
  const usernameInput = document.getElementById('auth-username');
  const usernameRow = document.getElementById('auth-username-row');
  const passwordInput = document.getElementById('auth-password');
  const errorDisplay = document.getElementById('auth-error-display');
  const toggleDesc = document.getElementById('auth-toggle-desc');
  
  if (!submitBtn || !switchBtn) return;
  
  switchBtn.onclick = () => {
    isSignUpMode = !isSignUpMode;
    if (usernameRow) {
      usernameRow.style.display = isSignUpMode ? 'block' : 'none';
    }
    if (isSignUpMode) {
      submitBtn.textContent = 'register --account';
      switchBtn.textContent = '[sign in]';
      toggleDesc.textContent = '// Enter a valid email and new passphrase to provision a new security profile.';
    } else {
      submitBtn.textContent = 'authorize --session';
      switchBtn.textContent = '[register]';
      toggleDesc.textContent = '// Authentication credentials required to synchronize mathematical mastery records.';
    }
    if (errorDisplay) errorDisplay.style.display = 'none';
  };
  
  submitBtn.onclick = () => {
    const rawIdentity = emailInput.value.trim();
    const password = passwordInput.value;
    const rawUsername = usernameInput ? usernameInput.value.trim() : '';
    
    if (!rawIdentity || !password) {
      showAuthError('ERROR: Identity and passphrase fields cannot be blank.');
      return;
    }
    
    if (rawIdentity.toLowerCase() === 'demo' && password.trim().toLowerCase() === 'omed') {
      currentUser = { uid: 'demo-session', displayName: 'demo', email: 'demo@ethos.io' };
      authStateFetched = true;
      if (typeof seedDemoData === 'function') {
        seedDemoData();
      } else {
        S.authEmail = 'demo@ethos.io';
        S.authUsername = 'demo';
        ss(true);
      }
      addLog('ok', 'Demo security clearance granted.');
      tryDismissBoot();
      return;
    }
    
    // Resolve email and username
    const isEmailFormat = rawIdentity.includes('@');
    const mappedEmail = isEmailFormat ? rawIdentity : (rawIdentity.toLowerCase() + '@ethos.io');
    
    let mappedUsername = rawUsername;
    if (!mappedUsername) {
      mappedUsername = isEmailFormat ? rawIdentity.split('@')[0] : rawIdentity;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = isSignUpMode ? 'provisioning...' : 'authorizing...';
    if (errorDisplay) errorDisplay.style.display = 'none';
    
    // Add a safety timeout to prevent getting stuck in "authorizing..." state if database/auth hangs
    const authTimeout = setTimeout(() => {
      if (submitBtn.disabled && (submitBtn.textContent === 'authorizing...' || submitBtn.textContent === 'provisioning...')) {
        submitBtn.disabled = false;
        submitBtn.textContent = isSignUpMode ? 'register --account' : 'authorize --session';
        showAuthError('AUTH_TIMEOUT: The authorization server took too long to respond. Please check your connection or try again.');
      }
    }, 6000); // 6 second safety timeout
    
    if (isSignUpMode) {
      firebase.auth().createUserWithEmailAndPassword(mappedEmail, password)
        .then(userCredential => {
          clearTimeout(authTimeout);
          const user = userCredential.user;
          user.updateProfile({
            displayName: mappedUsername
          }).then(() => {
            S.authUsername = mappedUsername;
            ss();
            
            // Save username-to-email mapping in DB
            if (typeof firebase !== 'undefined') {
              firebase.database().ref('usernames/' + mappedUsername.toLowerCase()).set(mappedEmail)
                .catch(err => console.error("Failed to save username mapping:", err));
            }
            
            addLog('ok', 'Security credentials provisioned with handle: @' + mappedUsername);
          }).catch(err => {
            clearTimeout(authTimeout);
            submitBtn.disabled = false;
            submitBtn.textContent = 'register --account';
            showAuthError('REGISTRATION_FAILED: Profile update failed: ' + err.message);
          });
        })
        .catch(err => {
          clearTimeout(authTimeout);
          submitBtn.disabled = false;
          submitBtn.textContent = 'register --account';
          showAuthError('REGISTRATION_FAILED: ' + err.message);
        });
    } else {
      const signInWithResolvedEmail = (email, pwd) => {
        firebase.auth().signInWithEmailAndPassword(email, pwd)
          .then(userCredential => {
            clearTimeout(authTimeout);
            addLog('ok', 'Security clearance granted.');
          })
          .catch(err => {
            clearTimeout(authTimeout);
            submitBtn.disabled = false;
            submitBtn.textContent = 'authorize --session';
            showAuthError('AUTH_FAILED: ' + err.message);
          });
      };

      if (typeof firebase !== 'undefined' && !isEmailFormat) {
        // Look up registered email from the usernames database directory
        firebase.database().ref('usernames/' + rawIdentity.toLowerCase()).once('value')
          .then(snapshot => {
            const resolvedEmail = snapshot.val();
            const emailToUse = resolvedEmail || mappedEmail; // fallback to username@ethos.io
            signInWithResolvedEmail(emailToUse, password);
          })
          .catch(err => {
            clearTimeout(authTimeout); // Make sure to clear or handle the timeout error here too
            console.warn("Username database lookup failed, using fallback:", err);
            signInWithResolvedEmail(mappedEmail, password);
          });
      } else {
        signInWithResolvedEmail(mappedEmail, password);
      }
    }
  };
  
  [emailInput, usernameInput, passwordInput].forEach(input => {
    if (input) {
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          submitBtn.click();
        }
      });
    }
  });
}

function showAuthError(msg) {
  const errorDisplay = document.getElementById('auth-error-display');
  if (errorDisplay) {
    let finalMsg = '// ' + msg;
    if (msg.includes('auth/configuration-not-found') || msg.includes('auth/operation-not-allowed')) {
      finalMsg += '\n\n// DEVELOPER TIP: The Email/Password sign-in provider is disabled.';
      finalMsg += '\n// Please enable it in your Firebase Console under:';
      finalMsg += '\n// Authentication -> Sign-in method -> Email/Password';
      finalMsg += '\n// Direct Link: https://console.firebase.google.com/project/ethos-jet/authentication/providers';
    }
    errorDisplay.textContent = finalMsg;
    errorDisplay.style.display = 'block';
    errorDisplay.style.animation = 'none';
    errorDisplay.offsetHeight; // trigger reflow
    errorDisplay.style.animation = 'shake 0.3s ease';
  }
}

// Wire up authorization gate on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initAuthGate();
  });
} else {
  initAuthGate();
}

// Wire up Auth Observer
let activeSyncRef = null;
if (typeof firebase !== 'undefined') {
  firebase.auth().onAuthStateChanged(user => {
    authStateFetched = true;
    if (user) {
      currentUser = user;
      const wasGuest = !S.authEmail; // Check if we were a guest session before logging in
      S.authEmail = user.email;
      let extractedUsername = user.displayName;
      if (!extractedUsername && user.email) {
        extractedUsername = user.email.split('@')[0];
      }
      S.authUsername = extractedUsername || 'unknown';
      ss(true); // Save locally
      
      // Dismiss boot gate immediately for snappy responsiveness
      tryDismissBoot();
      
      // Sync from cloud in the background. Do not force-pull on reload:
      // a missing local auth marker or missing gateway key can otherwise
      // overwrite a rich local state with a stale/default cloud record.
      firebaseSyncPull(null, false);
      
      // Real-time synchronization across devices (Issue 8/8)
      attachFirebaseWebSocketListener(user);
    } else {
      if (activeSyncRef) {
        activeSyncRef.off();
        activeSyncRef = null;
      }
      if (S.authUsername === 'demo') {
        currentUser = { uid: 'demo-session', displayName: 'demo', email: 'demo@ethos.io' };
        tryDismissBoot();
      } else {
        currentUser = null;
        S.authEmail = '';
        S.authUsername = '';
        tryDismissBoot();
      }
      unlockBootSync();
    }
  });
} else {
  authStateFetched = true;
  if (S.authUsername === 'demo') {
    currentUser = { uid: 'demo-session', displayName: 'demo', email: 'demo@ethos.io' };
  }
  tryDismissBoot();
  unlockBootSync();
}

// Force background sync pull on tab focus/visibility change
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    const user = typeof firebase !== 'undefined' && firebase.auth().currentUser;
    if (user) {
      // Pull quietly without forcing (timestamp / pushCount still wins)
      firebaseSyncPull(null, false);
    }
  }
});

function initTabs() {
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
      render();
    });
  });
}

function initButtons() {
  document.getElementById('save-note-btn').onclick = saveNote;
  document.getElementById('log-hours-btn').onclick = logHours;
  document.getElementById('add-paper-btn').onclick = addPaper;
  document.getElementById('save-paper-note-btn').onclick = savePaperNote;
  document.getElementById('add-log-btn').onclick = addManualLog;
  document.getElementById('reset-btn').onclick = resetAll;
  document.getElementById('week-prev').onclick = () => { S.weekOffset--; renderEtheTab(); };
  document.getElementById('week-next').onclick = () => { if (S.weekOffset < 0) { S.weekOffset++; renderEtheTab(); } };

  // Group filter tabs
  document.querySelectorAll('.group-filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.group-filter-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      S.activeGroupFilter = btn.dataset.group;
      ss(); renderEtheTab();
    });
  });

  // Protocol / Groups view toggle
  var viewGroupsBtn = document.getElementById('view-groups-btn');
  var viewProtocolBtn = document.getElementById('view-protocol-btn');
  function setViewMode(mode) {
    S.ethosViewMode = mode;
    viewGroupsBtn.classList.toggle('active', mode === 'groups');
    viewProtocolBtn.classList.toggle('active', mode === 'protocol');
    document.getElementById('ethos-routines').style.display = mode === 'groups' ? '' : 'none';
    document.getElementById('protocol-view').style.display = mode === 'protocol' ? '' : 'none';
    // Hide group filter bar in protocol mode (protocol ignores group filter)
    var gfb = document.getElementById('group-filter-bar');
    if (gfb) gfb.style.display = mode === 'protocol' ? 'none' : '';
    ss(); renderEtheTab();
  }
  if (viewGroupsBtn) viewGroupsBtn.onclick = function() { setViewMode('groups'); };
  if (viewProtocolBtn) viewProtocolBtn.onclick = function() { setViewMode('protocol'); };
  // Apply saved view mode on init
  if (S.ethosViewMode === 'protocol') setViewMode('protocol');

  // Add ethos modal
  document.getElementById('hbb-add-ethos').onclick = () => {
    const sel = document.getElementById('hm-routine');
    sel.innerHTML = '';
    S.routines.forEach(r => {
      const o = document.createElement('option');
      o.value = r.id; o.textContent = r.title; sel.appendChild(o);
    });
    document.getElementById('ethos-modal').classList.add('open');
    document.getElementById('hm-name').focus();
  };

  // Add routine modal
  document.getElementById('hbb-add-routine').onclick = () => {
    document.getElementById('routine-modal').classList.add('open');
    document.getElementById('rm-name').focus();
  };

  // Save ethos
  document.getElementById('hm-save').onclick = () => {
    const name = document.getElementById('hm-name').value.trim();
    if (!name) return;
    const rid = document.getElementById('hm-routine').value;
    const xp = parseInt(document.getElementById('hm-xp').value);
    const gid = document.getElementById('hm-group-select').value;
    const r = S.routines.find(x => x.id === rid);
    if (r) {
      r.ethe.push({ id: Date.now(), name, icon: '', color: '', note: '', xp, done: false, streak: 0, groupId: gid });
      addLog('ok', 'ethos added: "' + name + '"');
      ss(); renderEtheTab();
    }
    document.getElementById('ethos-modal').classList.remove('open');
    document.getElementById('hm-name').value = '';
  };

  // Save routine
  document.getElementById('rm-save').onclick = () => {
    const name = document.getElementById('rm-name').value.trim();
    if (!name) return;
    S.routines.push({ id: 'g' + Date.now(), title: name, icon: '', color: '#00ff88', subtitle: '', collapsed: false, ethe: [] });
    addLog('ok', 'routine added: "' + name + '"');
    ss(); renderEtheTab();
    document.getElementById('routine-modal').classList.remove('open');
    document.getElementById('rm-name').value = '';
  };

  // ECRE Radar Click trigger and Modal Close bindings (Proper Lifecycle Fix)
  const radarCard = document.getElementById('dashboard-radar-card');
  if (radarCard) {
    radarCard.onclick = () => {
      const modalOverlay = document.getElementById('radar-modal-overlay');
      if (modalOverlay) {
        modalOverlay.classList.add('open');
        renderCOHERENCE();
      }
    };
  }

  const radarModalCloseBtn = document.getElementById('radar-modal-close-btn');
  if (radarModalCloseBtn) {
    radarModalCloseBtn.onclick = () => {
      const modalOverlay = document.getElementById('radar-modal-overlay');
      if (modalOverlay) {
        modalOverlay.classList.remove('open');
      }
    };
  }

  const radarModalOverlay = document.getElementById('radar-modal-overlay');
  if (radarModalOverlay) {
    radarModalOverlay.onclick = (e) => {
      if (e.target === radarModalOverlay) {
        radarModalOverlay.classList.remove('open');
      }
    };
  }

  // Backup & Restore settings bindings
  const backupBtn = document.getElementById('backup-btn');
  if (backupBtn) {
    backupBtn.onclick = exportStateData;
  }

  const restoreImportBtn = document.getElementById('restore-import-btn');
  if (restoreImportBtn) {
    restoreImportBtn.onclick = () => {
      const importModal = document.getElementById('import-modal');
      if (importModal) {
        importModal.style.display = 'flex';
        importModal.classList.add('open');
        const errDisplay = document.getElementById('import-error-display');
        if (errDisplay) {
          errDisplay.style.display = 'none';
          errDisplay.textContent = '';
        }
        const ta = document.getElementById('import-text-area');
        if (ta) {
          ta.value = '';
          ta.focus();
        }
      }
    };
  }

  const importCancelBtn = document.getElementById('import-cancel-btn');
  if (importCancelBtn) {
    importCancelBtn.onclick = () => {
      const importModal = document.getElementById('import-modal');
      if (importModal) {
        importModal.style.display = 'none';
        importModal.classList.remove('open');
      }
    };
  }

  const importConfirmBtn = document.getElementById('import-confirm-btn');
  if (importConfirmBtn) {
    importConfirmBtn.onclick = () => {
      const ta = document.getElementById('import-text-area');
      if (ta) {
        importStateData(ta.value);
      }
    };
  }

  const dragZone = document.getElementById('import-drag-zone');
  const fileInput = document.getElementById('import-file-input');
  const ta = document.getElementById('import-text-area');
  const errDisplay = document.getElementById('import-error-display');

  if (dragZone && fileInput) {
    dragZone.onclick = () => fileInput.click();

    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (ta) ta.value = evt.target.result;
        if (errDisplay) {
          errDisplay.style.display = 'none';
          errDisplay.textContent = '';
        }
      };
      reader.onerror = () => {
        if (errDisplay) {
          errDisplay.style.display = 'block';
          errDisplay.textContent = '// ERROR: Failed to read file.';
        }
      };
      reader.readAsText(file);
    };

    // Drag over highlights
    dragZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dragZone.classList.add('dragover');
    });

    dragZone.addEventListener('dragleave', () => {
      dragZone.classList.remove('dragover');
    });

    dragZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dragZone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (ta) ta.value = evt.target.result;
        if (errDisplay) {
          errDisplay.style.display = 'none';
          errDisplay.textContent = '';
        }
      };
      reader.onerror = () => {
        if (errDisplay) {
          errDisplay.style.display = 'block';
          errDisplay.textContent = '// ERROR: Failed to read file.';
        }
      };
      reader.readAsText(file);
    });
  }

  // Modal cancel / close programmatic event listeners (CSP Compliance Fix)
  const ethosModalCancelBtn = document.getElementById('ethos-modal-cancel-btn');
  if (ethosModalCancelBtn) {
    ethosModalCancelBtn.onclick = () => {
      document.getElementById('ethos-modal').classList.remove('open');
    };
  }

  const routineModalCancelBtn = document.getElementById('routine-modal-cancel-btn');
  if (routineModalCancelBtn) {
    routineModalCancelBtn.onclick = () => {
      document.getElementById('routine-modal').classList.remove('open');
    };
  }

  const closeTermBtn = document.getElementById('close-term-btn');
  if (closeTermBtn) {
    closeTermBtn.onclick = () => {
      document.getElementById('interactive-terminal').classList.remove('open');
    };
  }

  // Interactive terminal
  const termBtn = document.getElementById('open-term-btn');
  if (termBtn) {
    termBtn.onclick = () => {
      document.getElementById('interactive-terminal').classList.add('open');
      document.getElementById('tv-input').focus();
      const outInner = document.getElementById('tv-output-inner');
      if (outInner && outInner.innerHTML === '') {
        var welcomeLogo = 
          '<div style="font-family: monospace; white-space: pre; line-height: 1.4; color: var(--text-dim);">' +
          '  ███████╗████████╗██╗  ██╗ ██████╗ ███████╗\n' +
          '  ██╔════╝╚══██╔══╝██║  ██║██╔═══██╗██╔════╝\n' +
          '  █████╗     ██║   ███████║██║   ██║███████╗\n' +
          '  ██╔══╝     ██║   ██╔══██║██║   ██║╚════██║\n' +
          '  ███████╗   ██║   ██║  ██║╚██████╔╝███████║\n' +
          '  ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝\n' +
          '</div>' +
          '<div style="margin-top: 8px;">' + ('ethos.init v2.4.0 interactive mode. type "help" for commands.') + '</div>';
        printTermTyped(welcomeLogo, 'sys');
      }
    };
  }
  const tvInput = document.getElementById('tv-input');
  if (tvInput) {
    var CLI_COMMANDS = ['help','clear','exit','quit','stats','groups','theme','log','check','uncheck','skills','achievements','ranks','focus','sysinfo','neofetch','crt','water','swim','protocol','auth','logout','demo','backup','export','restore','import'];
    tvInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        var val = tvInput.value.trim();
        if (val) {
          // Avoid duplicate consecutive entries
          if (S.cmdHistory.length === 0 || S.cmdHistory[S.cmdHistory.length - 1] !== val) {
            S.cmdHistory.push(val);
            if (S.cmdHistory.length > 50) S.cmdHistory.shift();
            ss();
          }
        }
        handleCommand(tvInput.value);
        tvInput.value = '';
        historyIdx = S.cmdHistory.length;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (S.cmdHistory.length > 0) {
          if (historyIdx > 0) historyIdx--;
          tvInput.value = S.cmdHistory[historyIdx] || '';
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIdx < S.cmdHistory.length - 1) {
          historyIdx++;
          tvInput.value = S.cmdHistory[historyIdx] || '';
        } else {
          historyIdx = S.cmdHistory.length;
          tvInput.value = '';
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        var prefix = tvInput.value.trim().toLowerCase();
        if (prefix) {
          var matches = CLI_COMMANDS.filter(function(c) { return c.indexOf(prefix) === 0; });
          if (matches.length === 1) {
            tvInput.value = matches[0];
          } else if (matches.length > 1) {
            printTerm('matches: ' + matches.join(', '), 'sys');
          }
        }
      }
    });
  }

  // Enter key bindings
  ['hm-name', 'rm-name', 'new-paper-input', 'manual-log-input'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          if (id === 'hm-name') document.getElementById('hm-save').click();
          else if (id === 'rm-name') document.getElementById('rm-save').click();
          else { const f = el.closest('.add-ethos-form'); if (f) f.querySelector('.btn').click(); }
        }
      });
    }
  });

  // Skill Tree node clicking
  document.querySelectorAll('.skill-node').forEach(node => {
    node.onclick = () => {
      const key = node.dataset.skill;
      selectSkillNode(key);
    };
  });
  
  // HUD update button
  const shUpdateBtn = document.getElementById('sh-update-btn');
  if (shUpdateBtn) {
    shUpdateBtn.onclick = () => {
      const input = document.getElementById('sh-input-val');
      const val = Math.max(0, Math.min(100, parseInt(input.value) || 0));
      if (window.selectedSkillKey) {
        S.skills[window.selectedSkillKey] = val;
        input.value = '';
        addLog('info', 'skill matrix updated: ' + window.selectedSkillKey + ' → ' + val + '%');
        checkAchievements();
        ss();
        render();
      }
    };
    // Support Enter key on sh-input-val
    document.getElementById('sh-input-val').addEventListener('keydown', e => {
      if (e.key === 'Enter') shUpdateBtn.click();
    });
  }

  // Focus Timer Click Bindings
  document.getElementById('focus-start-btn').onclick = toggleFocusSession;
  document.getElementById('focus-pause-btn').onclick = pauseFocusSession;
  document.getElementById('focus-abort-btn').onclick = abortFocusSession;
  
  // Duration selectors click bindings
  document.querySelectorAll('.fhud-durations button').forEach(el => {
    el.onclick = () => {
      const id = el.id;
      const mins = parseInt(id.replace('fd-', ''));
      const type = (mins === 5 || mins === 15) ? 'break' : 'focus';
      setFocusDuration(mins, type);
    };
  });

  // Today only checkbox
  const todayOnlyCheckbox = document.getElementById('today-only-checkbox');
  if (todayOnlyCheckbox) {
    todayOnlyCheckbox.checked = !!S.todayOnlyToggle;
    todayOnlyCheckbox.onchange = (e) => {
      S.todayOnlyToggle = e.target.checked;
      ss();
      renderEtheTab();
    };
  }

  // Swim listeners
  const swimLogBtn = document.getElementById('swim-log-btn');
  if (swimLogBtn) swimLogBtn.onclick = logSwimSession;
  
  const swimSearchInput = document.getElementById('swim-search-input');
  if (swimSearchInput) {
    swimSearchInput.value = S.swimSearchQuery || '';
    swimSearchInput.oninput = (e) => {
      S.swimSearchQuery = e.target.value;
      ss();
      renderSwimTab();
    };
  }

  document.querySelectorAll('.swim-filter-tab').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.swim-filter-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      S.swimFilter = btn.dataset.filter;
      ss();
      renderSwimTab();
    };
  });

  // Biometrics logger
  const bioLogBtn = document.getElementById('bio-log-btn');
  if (bioLogBtn) bioLogBtn.onclick = logBiometrics;

  // Set default dates for logs on load
  const swimDateInput = document.getElementById('swim-input-date');
  if (swimDateInput) swimDateInput.value = new Date().toISOString().split('T')[0];
  
  const bioDateInput = document.getElementById('bio-date');
  if (bioDateInput) bioDateInput.value = new Date().toISOString().split('T')[0];

  // Cloud Sync Settings listeners
  const logoutBtn = document.getElementById('auth-logout-btn');
  if (logoutBtn) {
    logoutBtn.onclick = handleLogout;
  }
}

// === INTERACTIVE TERMINAL ===
function scrollToBottom(element, smooth) {
  if (!element) return;
  if (smooth) {
    element.scrollTo({
      top: element.scrollHeight,
      behavior: 'smooth'
    });
  } else {
    element.scrollTop = element.scrollHeight;
  }
}

function printTerm(msg, type) {
  type = type || 'sys';
  const outInner = document.getElementById('tv-output-inner');
  const out = document.getElementById('tv-output');
  if (!outInner || !out) return;
  const div = document.createElement('div');
  div.className = 'tv-output-line ' + type;
  div.innerHTML = msg;
  outInner.appendChild(div);
  scrollToBottom(out, true);
}

// Typewriter effect for ASCII art terminal output
// Reveals HTML content character-by-character at ~3ms per char
var _twQueue = Promise.resolve();
function printTermTyped(html, type) {
  type = type || 'sys';
  _twQueue = _twQueue.then(function() {
    return new Promise(function(resolve) {
      var outInner = document.getElementById('tv-output-inner');
      var out = document.getElementById('tv-output');
      if (!outInner || !out) { resolve(); return; }
      var div = document.createElement('div');
      div.className = 'tv-output-line ' + type;
      outInner.appendChild(div);
      
      // Get plain text of the output block to stream line-by-line
      var temp = document.createElement('div');
      temp.innerHTML = html;
      var plainText = temp.textContent || temp.innerText || '';
      
      // Split by line break
      var lines = plainText.split('\n');
      
      var cursor = document.createElement('span');
      cursor.className = 'tv-typewriter-cursor';
      div.appendChild(cursor);
      
      var lineIdx = 0;
      var delay = 12; // ms per line delay for rapid streaming
      var textNode = document.createTextNode('');
      div.insertBefore(textNode, cursor);
      
      div.style.fontFamily = 'monospace';
      div.style.whiteSpace = 'pre-wrap';
      
      function tickLine() {
        if (lineIdx < lines.length) {
          var line = lines[lineIdx];
          textNode.textContent += line + (lineIdx < lines.length - 1 ? '\n' : '');
          lineIdx++;
          scrollToBottom(out, false); // Instant scroll during line streaming to prevent stutters
          setTimeout(tickLine, delay);
        } else {
          // Done streaming lines — swap in the full beautiful structured HTML
          div.removeChild(textNode);
          if (div.contains(cursor)) div.removeChild(cursor);
          div.innerHTML = html;
          div.style.fontFamily = '';
          div.style.whiteSpace = '';
          scrollToBottom(out, true); // Smooth scroll once completed!
          resolve();
        }
      }
      tickLine();
    });
  });
}


function getSyncDetailsReport(state) {
  if (!state) return '  No state data available.<br>';
  var syncPath = getSyncPathReport();
  var ts = state.lastUpdated ? new Date(state.lastUpdated).toLocaleString() : 'N/A';
  var pushCount = state.pushCount || 0;
  var size = JSON.stringify(state).length;
  var username = state.authUsername || 'N/A';
  var email = state.authEmail || 'N/A';
  
  var totalEthe = 0;
  var doneEthe = 0;
  var routinesList = [];
  if (state.routines) {
    state.routines.forEach(function(r) {
      var rDone = 0;
      var rTotal = 0;
      if (r.ethe) {
        r.ethe.forEach(function(e) {
          totalEthe++;
          rTotal++;
          if (e.done) {
            doneEthe++;
            rDone++;
          }
        });
      }
      routinesList.push(r.title + ' (' + rDone + '/' + rTotal + ')');
    });
  }
  
  var groupsList = [];
  if (state.ethosGroups) {
    state.ethosGroups.forEach(function(g) {
      groupsList.push(g.label + ' [streak: ' + (g.streak || 0) + ']');
    });
  }
  
  var rpt = '  Timestamp: <span style="color:var(--accent)">' + ts + '</span><br>' +
            '  Active Path: <span style="color:var(--accent)">' + syncPath.path + '</span><br>' +
            '  UID: <span style="color:var(--accent)">' + syncPath.uid + '</span><br>' +
            '  Auth: <span style="color:var(--accent)">' + syncPath.auth + '</span><br>' +
            '  Size: <span style="color:var(--accent)">' + (size / 1024).toFixed(2) + ' KB</span> (' + size + ' bytes)<br>' +
            '  Push Count: <span style="color:var(--accent)">' + pushCount + '</span><br>' +
            '  User: <span style="color:var(--accent)">' + escapeHtml(username) + ' (' + escapeHtml(email) + ')</span><br>' +
            '  XP: <span style="color:var(--accent)">' + (state.xp || 0) + ' (today: ' + (state.xpToday || 0) + ')</span><br>' +
            '  Completed Ethe: <span style="color:var(--accent)">' + doneEthe + ' / ' + totalEthe + '</span><br>' +
            '  Groups: ' + (groupsList.length ? groupsList.join(', ') : 'none') + '<br>' +
            '  Routines: ' + (routinesList.length ? routinesList.join(', ') : 'none') + '<br>';
  return rpt;
}

function attachFirebaseWebSocketListener(user) {
  if (activeSyncRef) {
    activeSyncRef.off();
    activeSyncRef = null;
  }
  if (typeof firebase === 'undefined' || !user) return;
  const gw = getSyncGatewayUrl(user.uid);
  if (gw) {
    console.log("[Sync] Same-origin Gateway active. Firebase WebSocket listener bypassed.");
    return;
  }
  try {
    activeSyncRef = firebase.database().ref('sync/' + user.uid);
    activeSyncRef.on('value', snapshot => {
      if (getSyncGatewayUrl(user.uid)) {
        console.log("[Sync] Gateway became active; detaching stale Firebase WebSocket listener.");
        if (activeSyncRef) {
          activeSyncRef.off();
          activeSyncRef = null;
        }
        return;
      }
      const val = snapshot.val();
      if (val && val.state) {
        const cloudTime = val.lastUpdated || val.state.lastUpdated || 0;
        const cloudPushCount = val.pushCount || val.state.pushCount || 0;
        const localTime = S.lastUpdated || 0;
        const localPushCount = S.pushCount || 0;
        
        const cloudIsNewer = cloudTime > localTime
          || (cloudTime === localTime && cloudPushCount > localPushCount);
        
        if (cloudIsNewer) {
          const prevAuthEmail = S.authEmail;
          const prevAuthUsername = S.authUsername;
          const prevCmdHistory = S.cmdHistory || [];
          
          S = val.state;
          sanitizeStateArrays(S);
          S.authEmail = prevAuthEmail;
          S.authUsername = prevAuthUsername;
          S.cmdHistory = prevCmdHistory;
          
          ss(true);
          render();
          
          const statusEl = document.getElementById('auth-sync-status');
          if (statusEl) statusEl.textContent = 'Status: synced (auto-pulled newer state)';
          addLog('info', 'Cloud sync: Real-time update auto-pulled from cloud.');
        }
      }
    });
    console.log("[Sync] Attached Firebase WebSocket listener successfully.");
  } catch (e) {
    console.warn("[Sync] Failed to attach Firebase WebSocket listener:", e);
  }
}

function handleCommand(cmd) {
  cmd = cmd.trim();
  if (!cmd) return;
  printTerm('<span class="cmd-echo">$ ' + escapeHtml(cmd) + '</span>');
  const args = cmd.split(' ').filter(x => x);
  const action = args[0].toLowerCase();

  if (action === 'clear') {
    const outInner = document.getElementById('tv-output-inner');
    if (outInner) outInner.innerHTML = '';
  } else if (action === 'exit' || action === 'quit') {
    document.getElementById('interactive-terminal').classList.remove('open');
  } else if (action === 'help') {
    
      printTerm('ethos.init commands:<br>- check [ethos] : mark ethos as done<br>- uncheck [ethos] : mark ethos as not done<br>- log [hours] : log study hours<br>- stats : show current stats<br>- groups : show group summary<br>- theme [name] : change theme<br>- skills : show organic mathematical knowledge matrix<br>- focus [mins/pause/resume/abort] : built-in pomodoro focus timer<br>- remind [list|test|sound|delete|HH:MM] : retro task & routine alerts<br>- oracle [query|--key|--clear] : converse with retro-cyberpunk LLM math tutor<br>- achievements : display imperial training ranks & badges<br>- protocol : show sequential daily guided flow checklist<br>- crt [on|off|toggle] : toggle CRT scanline overlay<br>- auth [status|logout] : terminal security authorization control<br>- backup / export : backup state data to file and clipboard<br>- restore / import : open restoration/import dialog<br>- logout : gracefully log out of active session<br>- sysinfo / neofetch : system dashboard<br>- clear : clear terminal<br>- exit : close terminal');
    
  } else if (action === 'stats') {
    var level = 0, cum = 0;
    for (var i = 0; i < LEVELS.length - 1; i++) { if (S.xp >= cum + LEVELS[i].next) { cum += LEVELS[i].next; level++; } else break; }
    var lvl = LEVELS[level];
    var inLvl = S.xp - cum, pct = lvl.next === Infinity ? 100 : Math.round(inLvl / lvl.next * 100);
    var blocks = Math.round(pct / 5);
    var asciiBar = '[' + '█'.repeat(blocks) + '░'.repeat(20 - blocks) + '] ' + (pct < 10 ? '0'+pct : pct) + '%';
    var pad = function(n, len) { return n.toString().padStart(len, '0'); };
    
    var graphHtml = '<div class="ts-graph" style="display:flex;align-items:flex-end;gap:4px;height:24px;margin-top:6px">';
    var now = new Date();
    for (var d = 6; d >= 0; d--) {
      var checkDate = new Date(now);
      checkDate.setDate(now.getDate() - d);
      var entry = (S.contrib || []).find(function(c) { return c.date === checkDate.toDateString(); });
      var lv = entry ? entry.level : 0;
      var h = Math.max(10, lv * 25);
      var col = lv > 0 ? 'var(--accent)' : 'var(--border2)';
      var glow = lv > 0 ? 'box-shadow: 0 0 ' + (lv*3) + 'px ' + col : '';
      graphHtml += '<div style="flex:1; height:' + h + '%; background:' + col + '; border-radius:1px; ' + glow + '"></div>';
    }
    graphHtml += '</div>';

    var html = '<div class="term-stats-box">\n' +
      '<div class="ts-header"><span style="color:var(--text-faint)">///</span> <span class="ts-title">SYS_STATS_DIAGNOSTIC</span> <span class="ts-line"></span></div>\n' +
      '<div class="ts-grid">\n' +
        '<div class="ts-cell"><div class="ts-label">GLOBAL_STREAK</div><div class="ts-val" style="color:var(--amber)">' + pad(S.streak, 4) + ' <span class="ts-unit">CYC</span></div></div>\n' +
        '<div class="ts-cell"><div class="ts-label">NET_EXPERIENCE</div><div class="ts-val" style="color:var(--accent)">' + pad(S.xp, 6) + ' <span class="ts-unit">PTS</span></div></div>\n' +
        '<div class="ts-cell"><div class="ts-label">TODAY_YIELD</div><div class="ts-val" style="color:var(--blue)">+' + pad(S.xpToday, 3) + ' <span class="ts-unit">XP</span></div></div>\n' +
        '<div class="ts-cell"><div class="ts-label">UPTIME_HOURS</div><div class="ts-val" style="color:var(--red)">' + (Math.round(S.totalHours * 10) / 10).toFixed(1).padStart(5, '0') + ' <span class="ts-unit">HRS</span></div></div>\n' +
      '</div>\n' +
      '<div style="display:flex; gap:16px;">\n' +
        '<div class="ts-bar-row" style="flex:1">\n' +
          '<div class="ts-label">LVL ' + pad(level+1, 2) + ' MATRIX_PROGRESS</div>\n' +
          '<div class="ts-ascii-bar">' + asciiBar + '</div>\n' +
        '</div>\n' +
        '<div class="ts-bar-row" style="flex:1; max-width: 120px;">\n' +
          '<div class="ts-label">ACTIVITY_WAVEFORM</div>\n' +
          graphHtml + '\n' +
        '</div>\n' +
      '</div>\n' +
    '</div>';
    printTermTyped(html, 'sys');

    // Fetch dynamic cognitive vector details and print inline to terminal chat
    const vector = compileCognitiveVector();
    const docStyles = getComputedStyle(document.documentElement);
    let activeColor = '#00ff88'; // Nephtrite green default
    if (vector.state === 'DEEP_SYNC') {
      activeColor = docStyles.getPropertyValue('--accent').trim() || '#00ff88';
    } else if (vector.state === 'TURBULENT') {
      activeColor = docStyles.getPropertyValue('--amber').trim() || '#ffb700';
    } else if (vector.state === 'DEGRADED') {
      activeColor = docStyles.getPropertyValue('--red').trim() || '#ff4444';
    }

    const termCritique = 
      '<div style="margin-top: 10px; padding: 10px; background: ' + activeColor + '08; border-radius: 4px; border: 1px solid ' + activeColor + '20; font-family: var(--font); font-size: 11px;">\n' +
        '<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed ' + activeColor + '30; padding-bottom:6px; margin-bottom:8px;">\n' +
          '<strong style="color:var(--text); letter-spacing:0.5px;">/// ECRE COGNITIVE APPRAISAL v2.6.2</strong>\n' +
          '<span style="color:' + activeColor + '; font-weight:bold; letter-spacing:1px; background:' + activeColor + '15; padding:2px 6px; border-radius:3px; font-size:9px;">' + vector.state + '</span>\n' +
        '</div>\n' +
        '<div style="margin-bottom:8px; line-height:1.4; color:var(--text-dim)">\n' +
          '// CNS consistency index evaluated at <span style="color:var(--text); font-weight:600">' + vector.compliancePct + '%</span>. Active streak remains at <span style="color:var(--text); font-weight:600">' + S.streak + ' days</span>.\n' +
        '</div>\n' +
        '<div style="margin-bottom:8px;">\n' +
          '<div style="color:' + activeColor + '; font-weight:bold; text-transform:uppercase; font-size:9px; margin-bottom:4px; letter-spacing:0.5px;">[Positive Integrations]</div>\n' +
          '<div style="display:flex; flex-direction:column; gap:4px; padding-left:4px;">\n' +
            vector.positiveNotes.map(n => '<div style="display:flex; gap:6px; align-items:start;"><span style="color:' + activeColor + '">✔</span><span style="color:var(--text-dim); line-height:1.3;">' + n + '</span></div>').join('\n') + '\n' +
          '</div>\n' +
        '</div>\n' +
        '<div style="margin-bottom:8px;">\n' +
          '<div style="color:var(--red); font-weight:bold; text-transform:uppercase; font-size:9px; margin-bottom:4px; letter-spacing:0.5px;">[Diagnostic Anomalies]</div>\n' +
          '<div style="display:flex; flex-direction:column; gap:4px; padding-left:4px;">\n' +
            vector.advisories.map(n => '<div style="display:flex; gap:6px; align-items:start;"><span style="color:var(--red)">⚠</span><span style="color:var(--text-dim); line-height:1.3;">' + n + '</span></div>').join('\n') + '\n' +
          '</div>\n' +
        '</div>\n' +
        '<div style="margin-top:10px; border-top:1px dashed ' + activeColor + '20; padding-top:8px;">\n' +
          '<div style="color:' + activeColor + '; font-weight:bold; text-transform:uppercase; font-size:9px; margin-bottom:4px; letter-spacing:0.5px;">[Cybernetic Directive]</div>\n' +
          '<div style="color:var(--text); font-style:italic; padding-left:4px; line-height:1.4;">' + vector.directive + '</div>\n' +
        '</div>\n' +
      '</div>';

    printTermTyped(termCritique, 'sys');
  } else if (action === 'demo') {
    const sub = args[1] ? args[1].toLowerCase() : 'seed';
    if (sub === 'rewind') {
      const historyDates = Object.keys(S.history || {}).sort((a,b) => new Date(a) - new Date(b));
      if (historyDates.length === 0) {
        printTerm('// ECRE REWIND: No historical snapshots found in S.history to replay.', 'err');
      } else {
        printTerm('// DOCKING CORE: Initiating ECRE telemetry rewind replay... [' + historyDates.length + ' snapshots]', 'ok');
        
        let delay = 0;
        historyDates.forEach((dateStr, idx) => {
          setTimeout(() => {
            const dateObj = new Date(dateStr);
            const vec = compileCognitiveVector(dateObj);
            
            const docStyles = getComputedStyle(document.documentElement);
            let activeColor = '#00ff88';
            if (vec.state === 'DEEP_SYNC') activeColor = docStyles.getPropertyValue('--accent').trim() || '#00ff88';
            else if (vec.state === 'TURBULENT') activeColor = docStyles.getPropertyValue('--amber').trim() || '#ffb700';
            else if (vec.state === 'DEGRADED') activeColor = docStyles.getPropertyValue('--red').trim() || '#ff4444';
            
            const appraisalHtml = 
              `<div class="term-stats-box" style="margin-top: 10px; border-left: 2px solid ${activeColor}; padding-left: 10px;">\n` +
              `  <div style="font-weight:bold; color:var(--text); letter-spacing:0.5px;">` +
              `    &lt;&lt;&lt; REWINDING ECRE STATE: ${dateStr.toUpperCase()} &gt;&gt;&gt;` +
              `  </div>\n` +
              `  <div style="font-family: var(--font); font-size: 11px; color: var(--text-dim); line-height: 1.4; margin-top: 4px;">\n` +
              `    CNS: <strong>${vec.compliancePct}%</strong> | state: <strong style="color:${activeColor};">${vec.state}</strong><br>\n` +
              `    Appraisal: ${vec.critique}<br>\n` +
              `    // Directive: "${vec.directive}"\n` +
              `  </div>\n` +
              `</div>`;
            printTermTyped(appraisalHtml, 'sys');
          }, delay);
          delay += 1500;
        });
      }
    } else if (sub === 'seed' || sub === 'sync' || sub === 'turbulent' || sub === 'degraded') {
      if (typeof seedDemoDataVariant === 'function') {
        seedDemoDataVariant(sub);
      } else {
        seedDemoData();
      }
      printTerm('Demo environment updated to status: ' + sub.toUpperCase(), 'ok');
      printTerm('Active living comment: "' + compileCognitiveVector().livingComment + '"', 'sys');
    } else {
      printTerm('Usage: demo [seed | sync | turbulent | degraded | rewind]', 'err');
    }
  } else if (action === 'groups') {
    S.ethosGroups.forEach(g => {
      const all = getAllEthe().filter(e => e.groupId === g.id);
      const done = all.filter(e => e.done).length;
      const label = g.label;
      const doneLabel = `done:${done}/${all.length}`;
      const streakLabel = `streak:${g.streak}`;
      printTerm(`${label} | ${streakLabel} | ${doneLabel}`, 'ok');
    });
  } else if (action === 'theme') {
    if (args[1]) {
      const t = THEMES.find(x => x.id === args[1] || x.name === args[1]);
      if (t) { 
        S.theme = t.id; 
        document.documentElement.setAttribute('data-theme', t.id === 'default' ? '' : t.id); 
        ss(); 
        renderThemes(); 
        printTerm('theme set to ' + t.name, 'ok'); 
      }
      else printTerm('theme not found. available: ' + THEMES.map(x => x.id).join(', '), 'err');
    } else printTerm('usage: theme [name]', 'err');
  } else if (action === 'log') {
    const hrs = parseFloat(args[1]);
    if (isNaN(hrs)) printTerm('usage: log [hours]', 'err');
    else { 
      document.getElementById('hours-input').value = hrs; 
      logHours(); 
      printTerm('logged ' + hrs + ' hours. total: ' + (Math.round(S.totalHours * 10) / 10) + 'h', 'ok'); 
    }
  } else if (action === 'check' || action === 'uncheck') {
    const query = args.slice(1).join(' ').toLowerCase();
    if (!query) { printTerm('usage: ' + action + ' [ethos name]', 'err'); return; }
    var target = null, targetRIdx = -1;
    S.routines.forEach(function(r, rIdx) { r.ethe.forEach(function(e) { if (e.name.toLowerCase().includes(query)) { target = e; targetRIdx = rIdx; } }); });
    if (target) {
      if (action === 'check' && !target.done) toggleEthos(targetRIdx, target.id);
      else if (action === 'uncheck' && target.done) toggleEthos(targetRIdx, target.id);
      const actionText = action === 'check' ? ('checked') : ('unchecked');
      printTerm(`${actionText}: ${target.name}`, 'ok');
    } else printTerm('ethos not found matching "' + query + '"', 'err');
  } else if (action === 'skills') {
    var txt = '<div style="font-family: monospace; white-space: pre; line-height: 1.25; color: var(--accent);">';
    
      txt += '           KNOWLEDGE MATRIX (SKILL TREE)\n';
      txt += '           =============================\n\n';
    
    
    var getBar = function(key) {
      var v = S.skills[key] || 0;
      var blocks = Math.round(v / 10);
      return '[' + '█'.repeat(blocks) + '░'.repeat(10 - blocks) + '] ' + (v < 100 ? ' ' + v : v) + '%';
    };
    
    
      txt += '┌─────────────────┐\n';
      txt += '│ linear_algebra  │ ─┐\n';
      txt += '│ ' + getBar('linear_algebra') + ' │  │   ┌─────────────────┐\n';
      txt += '└─────────────────┘  ├──>│  optimization   │ ─┐\n';
      txt += '┌─────────────────┐  │   │ ' + getBar('optimization') + ' │  │\n';
      txt += '│     mv_calc     │ ─┘   └─────────────────┘  │\n';
      txt += '│ ' + getBar('mv_calc') + ' │                           │   ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐\n';
      txt += '└─────────────────┘                           ├──>│    attention    │ ───>  │   transformer   │ ───>  │      lora       │\n';
      txt += '┌─────────────────┐                           │   │ ' + getBar('attention') + ' │       │ ' + getBar('transformer') + ' │       │ ' + getBar('lora') + ' │\n';
      txt += '│    backprop     │ ──────────────────────────┘   └─────────────────┘       └─────────────────┘       └─────────────────┘\n';
      txt += '│ ' + getBar('backprop') + ' │\n';
      txt += '└─────────────────┘\n';
      txt += '┌─────────────────┐\n';
      txt += '│   probability   │ ────────────────────────────────────────────────────────┐\n';
      txt += '│ ' + getBar('probability') + ' │                                                         v\n';
      txt += '└─────────────────┘                                                [MASTER LEVEL LOGIC]\n';
    
    txt += '</div>';
    printTermTyped(txt, 'sys');
  } else if (action === 'ranks' || action === 'achievements') {
    var txt = '<div style="font-family: monospace; line-height: 1.4; color: var(--text); width: 100%; box-sizing: border-box;">';
    txt += '  <div style="color: var(--accent); font-weight: bold; text-align: center; margin-bottom: 16px;">\n';
    
      txt += '    /// IMPERIAL ACADEMY ACHIEVEMENT DECK ///\n';
      txt += '    =========================================\n';
    
    txt += '  </div>\n\n';
    txt += '  <div style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; width: 100%; box-sizing: border-box;">\n';
    
    if (!S.unlockedAchievements) S.unlockedAchievements = {};
    ACHIEVEMENTS.forEach(a => {
      const unlockedDate = S.unlockedAchievements[a.id];
      const isUnlocked = !!unlockedDate;
      const col = isUnlocked ? 'var(--accent)' : 'var(--text-dim)';
      const borderCol = isUnlocked ? 'var(--accent)' : 'var(--border)';
      const bgCol = isUnlocked ? 'var(--accent-faint)' : 'var(--bg2)';
      const shadow = isUnlocked ? 'box-shadow: 0 0 8px var(--accent-faint);' : '';
      
      const aName = a.name;
      const aDesc = a.desc;
      const dateText = isUnlocked 
        ? ('✓ UNLOCKED (' + unlockedDate + ')')
        : ('[ LOCKED ]');

      txt += '    <div style="flex: 1 1 200px; max-width: 250px; border: 1px solid ' + borderCol + '; border-radius: 4px; padding: 12px; background: ' + bgCol + '; color: ' + col + '; ' + shadow + ' display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; min-height: 200px;">\n';
      txt += '      <div>\n';
      txt += '        <div style="font-weight: bold; font-size: 12px; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">\n';
      txt += '          <span>' + aName.toUpperCase() + '</span>\n';
      txt += '        </div>\n';
      txt += '        <div style="color: var(--text-dim); font-size: 11px; margin-bottom: 12px; text-align: left; line-height: 1.3;">' + aDesc + '</div>\n';
      txt += '      </div>\n';
      txt += '      <div style="margin: auto 0; text-align: center;">\n';
      txt += '        <pre style="font-family: monospace; font-size: 11px; margin: 0; line-height: 1.2; display: inline-block; text-align: left;">' + a.badge + '</pre>\n';
      txt += '      </div>\n';
      txt += '      <div style="font-size: 10px; margin-top: 12px; text-align: center; border-top: 1px dashed ' + (isUnlocked ? 'var(--accent-dim)' : 'var(--border)') + '; padding-top: 6px;">\n';
      txt += '        ' + dateText + '\n';
      txt += '      </div>\n';
      txt += '    </div>\n';
    });
    txt += '  </div>\n';
    txt += '</div>';
    printTermTyped(txt, 'sys');
  } else if (action === 'focus') {
    const sub = args[1] ? args[1].toLowerCase() : '';
    if (!sub) {
      printTerm('focus usage:<br>- focus [minutes] : start focus session (e.g. focus 25)<br>- focus pause : pause current session<br>- focus resume : resume current session<br>- focus abort : cancel current session', 'err');
    } else if (sub === 'pause') {
      if (focusSession.active) {
        pauseFocusSession();
        printTerm('focus session paused via CLI.', 'ok');
      } else {
        printTerm('no active focus session to pause.', 'err');
      }
    } else if (sub === 'resume') {
      if (focusSession.paused) {
        startFocusSession();
        printTerm('focus session resumed via CLI.', 'ok');
      } else {
        printTerm('no paused focus session to resume.', 'err');
      }
    } else if (sub === 'abort' || sub === 'cancel') {
      if (focusSession.active || focusSession.paused) {
        abortFocusSession();
        printTerm('focus session aborted via CLI.', 'ok');
      } else {
        printTerm('no running focus session to abort.', 'err');
      }
    } else {
      const mins = parseFloat(sub);
      if (isNaN(mins) || mins <= 0) {
        printTerm('invalid duration: ' + sub + '. usage: focus [minutes]', 'err');
      } else {
        setFocusDuration(mins, 'focus');
        startFocusSession();
        printTerm('focus session started via CLI: ' + mins + ' minutes.', 'ok');
      }
    }
  } else if (action === 'crt') {
    var sub = args[1] ? args[1].toLowerCase() : 'toggle';
    if (sub === 'on') { S.crtEnabled = true; }
    else if (sub === 'off') { S.crtEnabled = false; }
    else { S.crtEnabled = !S.crtEnabled; }
    var crtEl = document.getElementById('crt-screen-effect');
    if (crtEl) { if (S.crtEnabled) crtEl.classList.add('crt-active'); else crtEl.classList.remove('crt-active'); }
    ss();
    printTerm('CRT scanline overlay: ' + (S.crtEnabled ? '<span style="color:var(--accent)">ENABLED</span>' : '<span style="color:var(--red)">DISABLED</span>'), 'ok');
  } else if (action === 'sysinfo' || action === 'neofetch') {
    renderSysinfoCommand();
  } else if (action === 'protocol') {
    renderProtocolCommand();
  } else if (action === 'auth') {
    const sub = args[1] ? args[1].toLowerCase() : '';
    if (sub === 'status' || !sub) {
      const isLoaded = typeof firebase !== 'undefined';
      const email = S.authEmail || '<none>';
      const username = S.authUsername || '<none>';
      const lastUp = S.lastUpdated ? new Date(S.lastUpdated).toLocaleString() : '<never>';
      printTerm('<span style="color:var(--accent); font-weight:bold;">=== SECURITY CLEARANCE DIODE ===</span><br>' +
                'Firebase Client: ' + (isLoaded ? '<span style="color:var(--accent)">ONLINE</span>' : '<span style="color:var(--red)">OFFLINE (NOT LOADED)</span>') + '<br>' +
                'Active Identity: <span style="color:var(--amber)">@' + username + '</span><br>' +
                'Active Email:    <span style="color:var(--text-dim)">' + email + '</span><br>' +
                'Last Sync Merge: <span style="color:var(--blue)">' + lastUp + '</span>', 'info');
    } else if (sub === 'username' || sub === 'handle') {
      const newName = args.slice(2).join(' ').trim();
      if (!newName) {
        printTerm('Usage: auth username &lt;new_handle&gt;', 'err');
      } else if (typeof firebase === 'undefined' || !firebase.auth().currentUser) {
        printTerm('Error: Session is unauthenticated. Cannot change handle.', 'err');
      } else {
        printTerm('Updating developer handle to: @' + newName + '...', 'info');
        firebase.auth().currentUser.updateProfile({
          displayName: newName
        }).then(() => {
          S.authUsername = newName;
          ss();
          render();
          printTerm('Developer handle successfully updated to: @' + newName, 'ok');
        }).catch(err => {
          printTerm('Failed to update developer handle: ' + err.message, 'err');
        });
      }
    } else if (sub === 'logout' || sub === 'deauthorize') {
      printTerm('Initiating session deauthorization...', 'info');
      handleLogout();
    } else if (sub === 'sync') {
      printTerm('Initiating safe database synchronization check...', 'info');
      firebaseSyncPull((success, result) => {
        if (success) {
          if (result === 'pulled') {
            printTerm('Sync complete: Pulled newer state from the cloud.', 'ok');
          } else if (result === 'pushed') {
            printTerm('Sync complete: Pushed newer local state to the cloud.', 'ok');
          } else if (result === 'synced') {
            printTerm('Sync complete: Local and cloud states are fully in sync.', 'ok');
          } else {
            printTerm('Sync complete: Status is ' + result, 'ok');
          }
        } else {
          printTerm('Sync failed: ' + result, 'err');
        }
      }, false);
    } else if (sub === 'push') {
      printTerm('Forcing local state push to cloud database...', 'info');
      firebaseSyncPush((success, result) => {
        if (success) {
          printTerm('Local state successfully pushed to cloud database.', 'ok');
          printTerm('<span style="color:var(--accent); font-weight:bold;">--- PUSH SUMMARY ---</span><br>' + getSyncDetailsReport(S), 'info');
        } else {
          printTerm('Push failed: ' + (result.message || result), 'err');
        }
      });
    } else if (sub === 'pull') {
      printTerm('Forcing cloud state pull (overwriting local)...', 'info');
      const user = typeof firebase !== 'undefined' && firebase.auth().currentUser;
      const gw = user && getSyncGatewayUrl(user.uid);
      if (gw) {
        printTerm('<span style="color:var(--text-dim)">Pulling directly from Vercel sync gateway...</span>', 'info');
      } else {
        printTerm('<span style="color:var(--text-dim)">Trying WebSocket first, REST API fallback after 10s...</span>', 'info');
      }
      firebaseSyncPull((success, result) => {
        if (success) {
          printTerm('Cloud state successfully pulled and applied. (' + result + ')', 'ok');
          printTerm('<span style="color:var(--accent); font-weight:bold;">--- PULL SUMMARY ---</span><br>' + getSyncDetailsReport(S), 'info');
        } else {
          printTerm('Pull failed: ' + (result.message || result), 'err');
        }
      }, true);
    } else if (sub === 'rest-pull') {
      // Direct REST API pull — bypasses WebSocket entirely
      const user = firebase.auth().currentUser;
      if (!user) {
        printTerm('Not authenticated.', 'err');
      } else {
        printTerm('Forcing direct REST API pull (bypassing WebSocket)...', 'info');
        firebaseRestPull(user.uid, (success, result) => {
          if (success) {
            printTerm('REST pull succeeded: ' + result, 'ok');
            printTerm('<span style="color:var(--accent); font-weight:bold;">--- PULL SUMMARY ---</span><br>' + getSyncDetailsReport(S), 'info');
          } else {
            printTerm('REST pull failed: ' + result, 'err');
          }
        }, true, true);
      }
    } else if (sub === 'diag') {
      var diagUser = typeof firebase !== 'undefined' && firebase.auth().currentUser;
      var diagUid = diagUser ? diagUser.uid : (S.authUsername || 'default_user');
      printTerm('Running sync gateway diagnostics...', 'info');
      fetch('/api/health', { method: 'GET', cache: 'no-store' })
        .then(function(r) { return r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)); })
        .catch(function(err) { return { status: 'unreachable', error: err.message }; })
        .then(function(health) {
          var gwOk = health && health.status === 'ok';
          _vercelGatewayAvailable = gwOk;
          var rpt = '<span style="color:var(--accent); font-weight:bold;">--- GATEWAY HEALTH ---</span><br>' +
            '  /api/health: ' + (gwOk ? '<span style="color:var(--accent)">ONLINE</span>' : '<span style="color:var(--red)">OFFLINE</span> (' + (health.error || 'unknown') + ')') + '<br>';
          if (gwOk) {
            var storageConfigured = health.kv_configured || health.firebase_configured;
            var storageType = health.kv_configured ? 'Vercel KV' : (health.firebase_configured ? 'Firebase' : 'None');
            rpt += '  Storage configured: ' + (storageConfigured ? '<span style="color:var(--accent)">YES</span> (' + storageType + ')' : '<span style="color:var(--red)">NO</span>') + '<br>';
            rpt += '  Auth mode: <span style="color:var(--accent)">' + (health.auth_type || 'firebase-id-token') + '</span><br>';
          }
          rpt += '  Proxy override: ' + (escapeHtml(S.customSyncProxy) || '&lt;none&gt;') + '<br>';
          var gw = getSyncGatewayUrl(diagUid);
          rpt += '  UID: <span style="color:var(--amber)">' + diagUid + '</span><br>';
          rpt += '  Active path: <span style="color:var(--amber)">' + (gw ? gw.type.toUpperCase() + ' \u2192 ' + gw.url.substring(0, 60) : 'DIRECT FIREBASE') + '</span>';
          printTerm(rpt, 'info');
          function showDiag(val) {
            if (!val || !val.state) { printTerm('Cloud: No state found.', 'warn'); return; }
            var cT = val.lastUpdated || val.state.lastUpdated || 0, cPC = val.pushCount || val.state.pushCount || 0;
            var lT = S.lastUpdated || 0, lPC = S.pushCount || 0;
            var cDone = 0, cEthe = [];
            if (val.state.routines) val.state.routines.forEach(function(r) { if (r.ethe) r.ethe.forEach(function(e) { cEthe.push(e); if (e.done) cDone++; }); });
            var lDone = 0;
            if (S.routines) S.routines.forEach(function(r) { if (r.ethe) r.ethe.forEach(function(e) { if (e.done) lDone++; }); });
            var eD = '';
            cEthe.slice(0, 15).forEach(function(e) { eD += '  - [' + (e.done ? 'x' : ' ') + '] ' + e.name + ' (' + e.groupId + ')<br>'; });
            if (cEthe.length > 15) eD += '  - ... and ' + (cEthe.length - 15) + ' more<br>';
            printTerm('<span style="color:var(--accent); font-weight:bold;">--- CLOUD STATE ---</span><br>' +
              '<b>Cloud:</b> updated ' + new Date(cT).toLocaleString() + ' | pushCount ' + cPC + ' | done ' + cDone + '/' + cEthe.length + '<br>' +
              '<b>Local:</b> updated ' + new Date(lT).toLocaleString() + ' | pushCount ' + lPC + ' | done ' + lDone + '/' + getAllEthe().length + '<br>' +
              '<b>Verdict:</b> cloud newer=' + (cT > lT || (cT === lT && cPC > lPC)) + ' | local newer=' + (lT > cT || (lT === cT && lPC > cPC)) + '<br>' +
              '<b>First 15 cloud ethe:</b><br>' + eD, 'info');
          }
          if (gw) {
            getSyncRequestHeaders(gw).then(function(headers) {
              delete headers['Content-Type'];
              return fetch(gw.url, { method: 'GET', headers: headers, cache: 'no-store' });
            })
              .then(function(r) { if (!r.ok) throw new Error(gw.type + ' HTTP ' + r.status); return r.json(); })
              .then(function(v) { showDiag(v); })
              .catch(function(e) { printTerm('Diag fetch failed (' + gw.type + '): ' + e.message, 'err'); });
          } else if (diagUser) {
            firebase.auth().currentUser.getIdToken(false)
              .then(function(t) { return fetch(firebaseConfig.databaseURL + '/sync/' + diagUid + '.json?auth=' + encodeURIComponent(t), { method: 'GET', headers: { 'Accept': 'application/json' }, cache: 'no-store' }); })
              .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
              .then(function(v) { showDiag(v); })
              .catch(function(e) { printTerm('Diag fetch failed (direct): ' + e.message, 'err'); });
          } else {
            printTerm('Cannot fetch cloud state: no gateway and not authenticated.', 'err');
          }
        });
    } else if (sub === 'proxy') {
      const pUrl = args[2] ? args[2].trim() : '';
      const pKey = args[3] ? args[3].trim() : '';
      if (!pUrl) {
        if (S.customSyncProxy) {
          printTerm('Active sync proxy: ' + escapeHtml(S.customSyncProxy), 'info');
          if (S.customSyncKey) {
            printTerm('Active proxy key: registered (hidden)', 'info');
          }
        } else {
          printTerm('No custom sync proxy configured. Using default Firebase connection.', 'info');
        }
        printTerm('Usage: auth proxy gateway (same-origin token sync) OR auth proxy &lt;url&gt; [&lt;key&gt;] (legacy external proxy) OR auth proxy clear', 'info');
      } else if (pUrl.toLowerCase() === 'clear') {
        S.customSyncProxy = '';
        S.customSyncKey = '';
        ss(true);
        printTerm('Custom sync proxy and key cleared. Using same-origin Firebase-token gateway.', 'ok');
      } else if (pUrl.toLowerCase() === 'gateway' || pUrl.toLowerCase() === 'same-origin') {
        S.customSyncProxy = '';
        S.customSyncKey = '';
        ss(true);
        if (activeSyncRef) {
          activeSyncRef.off();
          activeSyncRef = null;
        }
        printTerm('Same-origin gateway selected. Firebase login token will be used automatically.', 'ok');
        printTerm('<span style="color:var(--text-dim)">Checking cloud for latest state...</span>', 'info');
        firebaseSyncPull(function(success, result) {
          if (success) {
            printTerm('Cloud state successfully retrieved and applied.', 'ok');
            printTerm('<span style="color:var(--accent); font-weight:bold;">--- PULL SUMMARY ---</span><br>' + getSyncDetailsReport(S), 'info');
          } else {
            printTerm('Initial pull failed: ' + (result.message || result), 'warn');
          }
        }, false);
      } else {
        if (!pUrl.startsWith('http://') && !pUrl.startsWith('https://')) {
          printTerm('Invalid URL. Proxy URL must start with http:// or https:// (or use "auth proxy gateway" for same-origin token sync)', 'err');
        } else {
          S.customSyncProxy = pUrl;
          S.customSyncKey = pKey;
          ss(true);
          if (activeSyncRef) {
            activeSyncRef.off();
            activeSyncRef = null;
          }
          printTerm('Custom sync proxy successfully configured to: ' + escapeHtml(S.customSyncProxy), 'ok');
          if (S.customSyncKey) {
            printTerm('Edge authentication key successfully registered.', 'ok');
          }
          printTerm('<span style="color:var(--text-dim)">Forcing cloud pull to retrieve existing state...</span>', 'info');
          firebaseSyncPull(function(success, result) {
            if (success) {
              printTerm('Cloud state successfully retrieved and applied.', 'ok');
              printTerm('<span style="color:var(--accent); font-weight:bold;">--- PULL SUMMARY ---</span><br>' + getSyncDetailsReport(S), 'info');
            } else {
              printTerm('Initial pull failed: ' + (result.message || result), 'warn');
            }
          }, true);
        }
      }
    } else {
      printTerm('<span style="color:var(--accent); font-weight:bold;">=== CLI SECURITY CONTROL ===</span><br>' +
                'Usage:<br>' +
                '  auth status                   Show current clearance status<br>' +
                '  auth username &lt;new_handle&gt;  Update your active developer handle<br>' +
                '  auth sync                     Run a safe timestamp-based sync check<br>' +
                '  auth push                     Force push local state to the cloud<br>' +
                '  auth pull                     Force pull cloud state to local (overwrites)<br>' +
                '  auth rest-pull                Direct REST API pull (bypasses WebSocket)<br>' +
                '  auth diag                     Fetch and compare cloud vs local state details<br>' +
                '  auth proxy &lt;url&gt; [&lt;key&gt;]       Configure first-party serverless sync proxy<br>' +
                '  auth logout                   Deauthorize current terminal session', 'info');
    }
  } else if (action === 'logout') {
    printTerm('Initiating session deauthorization...', 'info');
    handleLogout();
  }  else if (action === 'remind') {
    const sub = args[1] ? args[1].toLowerCase() : '';
    if (!sub || sub === 'list') {
      if (S.reminders.length === 0) {
        printTerm('// no reminders scheduled. type "remind [time] [msg]" to set one.', 'info');
      } else {
        let txt = '<span style="color:var(--accent); font-weight:bold;">=== SCHEDULED ALARMS ===</span><br>';
        S.reminders.forEach((r, idx) => {
          txt += `[${idx}] <span style="color:var(--accent)">${r.time}</span> - "${escapeHtml(r.message)}" [${r.active ? '<span style="color:var(--accent)">ACTIVE</span>' : '<span style="color:var(--text-dim)">OFF</span>'}]<br>`;
        });
        printTerm(txt, 'info');
      }
    } else if (sub === 'test') {
      triggerNotification("ethos.init // DIAGNOSTIC", "Alert test successful. Audio context synthesized.");
      printTerm("sent test alert frame. sound synthesized offline.", "ok");
    } else if (sub === 'delete' || sub === 'remove') {
      const idx = parseInt(args[2]);
      if (isNaN(idx) || idx < 0 || idx >= S.reminders.length) {
        printTerm("usage: remind delete [index]", "err");
      } else {
        const deleted = S.reminders.splice(idx, 1)[0];
        ss();
        renderRemindersList();
        printTerm(`deleted reminder: ${deleted.time} - "${deleted.message}"`, "ok");
      }
    } else if (sub === 'sound') {
      const preset = args[2];
      if (['cyber_chime', 'cyber_pulse', 'cyber_radar', 'none'].includes(preset)) {
        S.notificationSettings.sound = preset;
        ss();
        const presetEl = document.getElementById('notif-sound-preset');
        if (presetEl) presetEl.value = preset;
        playSynthSound(preset);
        printTerm(`reminder sound set to ${preset}`, "ok");
      } else {
        printTerm("unknown preset. available: cyber_chime, cyber_pulse, cyber_radar, none", "err");
      }
    } else if (sub === 'volume') {
      const pct = parseInt(args[2]);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        printTerm("usage: remind volume [0-100]", "err");
      } else {
        const volVal = pct / 100;
        S.notificationSettings.volume = volVal;
        ss();
        const sliderEl = document.getElementById('notif-vol-slider');
        if (sliderEl) sliderEl.value = volVal;
        playSynthSound(S.notificationSettings.sound);
        printTerm(`reminder volume set to ${pct}%`, "ok");
      }
    } else {
      const timeVal = args[1];
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(timeVal)) {
        printTerm("invalid time format. must be HH:MM (24-hour), e.g., 08:30", "err");
        return;
      }
      const msg = args.slice(2).join(' ').trim() || "Ethos Routine Alarm";
      S.reminders.push({
        id: Date.now().toString(),
        time: timeVal,
        message: msg,
        active: true,
        once: false,
        lastFiredDate: ''
      });
      ss();
      renderRemindersList();
      printTerm(`added routine reminder for ${timeVal}: "${escapeHtml(msg)}"`, "ok");
    }
  } else if (action === 'oracle') {
    const sub = args[1] ? args[1].toLowerCase() : '';
    if (sub === '--key') {
      const keyVal = args[2] || '';
      if (!keyVal) {
        printTerm('usage: oracle --key YOUR_GEMINI_API_KEY', 'err');
      } else {
        S.geminiKey = keyVal;
        ss();
        updateOracleKeyStatus();
        const inputEl = document.getElementById('oracle-key-input');
        if (inputEl) inputEl.value = keyVal;
        printTerm('Gemini API key updated successfully.', 'ok');
      }
    } else if (sub === '--clear') {
      S.oracleHistory = [];
      ss();
      printTerm('Oracle conversation history cleared.', 'ok');
    } else if (sub === '--list' || sub === '--models' || sub === '-l') {
      listOracleModels();
    } else {
      const query = args.slice(1).join(' ').trim();
      if (!query) {
        printTerm('Oracle LLM Companion:<br>- <span style="color:var(--accent);">oracle --key [key]</span> : configure Gemini API key<br>- <span style="color:var(--accent);">oracle --list</span> : list authorized models / diagnose API key<br>- <span style="color:var(--accent);">oracle --clear</span> : reset conversation history<br>- <span style="color:var(--accent);">oracle [question]</span> : ask the Oracle a technical question', 'info');
      } else {
        queryOracle(query);
      }
    }
  } else if (action === 'backup' || action === 'export') {
    exportStateData();
  } else if (action === 'restore' || action === 'import') {
    const importModal = document.getElementById('import-modal');
    if (importModal) {
      importModal.style.display = 'flex';
      importModal.classList.add('open');
      const errDisplay = document.getElementById('import-error-display');
      if (errDisplay) {
        errDisplay.style.display = 'none';
        errDisplay.textContent = '';
      }
      const ta = document.getElementById('import-text-area');
      if (ta) {
        ta.value = '';
        ta.focus();
      }
    }
    printTerm('Opening restore/import modal overlay...', 'info');
  } else {
    // Fallback: The terminal IS ECRE. Unrecognized commands are treated as freeform ECRE chat!
    if (!S.geminiKey) {
      printTerm('command not found: "' + escapeHtml(action) + '". type \'help\' for commands.', 'err');
      printTerm('To enable inline conversation with ECRE, configure your Gemini key:<br>- <span style="color:var(--accent);">oracle --key YOUR_API_KEY</span>', 'info');
    } else {
      queryOracle(cmd);
    }
  }
}

function renderProtocolCommand() {
  var html = '<div style="font-family: monospace; line-height: 1.4; color: var(--text); white-space: pre-wrap;">';
  html += '<span style="color:var(--text-faint)">┌─────────────────────────────────────────────────────────┐</span>\n';
  html += '  <span style="color:var(--accent); font-weight:bold;">═══ DAILY PROTOCOL DIAGNOSTIC ═══</span>\n';
  html += '  <span style="color:var(--text-dim)">Date: ' + S.activeDate + ' | Streak: ' + S.streak + ' days</span>\n';
  html += '<span style="color:var(--text-faint)">├─────────────────────────────────────────────────────────┤</span>\n';

  var dayOfWeek = new Date(S.activeDate).getDay(); // 0=Sun, 1=Mon, etc.
  var allEthe = getAllEthe();
  
  // Find current active item (first unchecked)
  var currentActive = null;
  for (var pi = 0; pi < PROTOCOL_ORDER.length; pi++) {
    var pOrder = PROTOCOL_ORDER[pi];
    for (var ii = 0; ii < pOrder.ids.length; ii++) {
      var id = pOrder.ids[ii];
      var ethos = allEthe.find(function(e) { return Number(e.id) === Number(id); });
      if (ethos) {
        var isOffDay = false;
        if (ethos.id === 203 && ![2, 4, 6].includes(dayOfWeek)) isOffDay = true;
        if (ethos.id === 403 && dayOfWeek !== 2) isOffDay = true;
        if (ethos.id === 301 && ![1, 3, 5].includes(dayOfWeek)) isOffDay = true;
        if (ethos.id === 502 && ![1, 3, 5].includes(dayOfWeek)) isOffDay = true;

        if (!isOffDay && !ethos.done) {
          currentActive = ethos;
          break;
        }
      }
    }
    if (currentActive) break;
  }

  var stepCounter = 1;
  PROTOCOL_ORDER.forEach(function(phaseOrder) {
    var phaseDef = PROTOCOL_PHASES.find(function(p) { return p.id === phaseOrder.phase; });
    var phaseDoneCount = 0;
    var phaseActiveCount = 0;

    phaseOrder.ids.forEach(function(id) {
      var ethos = allEthe.find(function(e) { return Number(e.id) === Number(id); });
      if (ethos) {
        var isOffDay = false;
        if (ethos.id === 203 && ![2, 4, 6].includes(dayOfWeek)) isOffDay = true;
        if (ethos.id === 403 && dayOfWeek !== 2) isOffDay = true;
        if (ethos.id === 301 && ![1, 3, 5].includes(dayOfWeek)) isOffDay = true;
        if (ethos.id === 502 && ![1, 3, 5].includes(dayOfWeek)) isOffDay = true;

        if (!isOffDay) {
          phaseActiveCount++;
          if (ethos.done) phaseDoneCount++;
        }
      }
    });

    if (phaseActiveCount === 0) return;

    var phaseProgressText = ' [' + phaseDoneCount + '/' + phaseActiveCount + ']';
    html += '\n  <span style="color:var(--accent); font-weight:bold;">' + phaseDef.icon + ' ' + phaseDef.label + '</span>' +
            '<span style="color:var(--text-faint)"> ─── ' + phaseDef.time + phaseProgressText + '</span>\n';

    phaseOrder.ids.forEach(function(id) {
      var ethos = allEthe.find(function(e) { return Number(e.id) === Number(id); });
      if (ethos) {
        var isOffDay = false;
        if (ethos.id === 203 && ![2, 4, 6].includes(dayOfWeek)) isOffDay = true;
        if (ethos.id === 403 && dayOfWeek !== 2) isOffDay = true;
        if (ethos.id === 301 && ![1, 3, 5].includes(dayOfWeek)) isOffDay = true;
        if (ethos.id === 502 && ![1, 3, 5].includes(dayOfWeek)) isOffDay = true;

        if (isOffDay) return;

        var isCurrent = (currentActive && Number(currentActive.id) === Number(ethos.id));
        var checkMark = ethos.done ? '[x]' : '[ ]';
        var indicator = isCurrent ? '<span style="color:var(--accent)">▸</span>' : ' ';
        var textStyle = ethos.done ? 'color:var(--text-faint); text-decoration:line-through;' : (isCurrent ? 'color:var(--text); font-weight:bold;' : 'color:var(--text-dim);');

        var numStr = stepCounter.toString().padStart(2, '0') + '.';
        html += '    ' + indicator + ' <span style="color:var(--text-faint)">' + numStr + '</span> ' +
                '<span style="' + textStyle + '">' + checkMark + ' ' + ethos.name + '</span>\n';
        stepCounter++;
      }
    });
  });

  html += '\n';
  if (currentActive) {
    html += '  <span style="color:var(--accent);">▸ CURRENT_TARGET:</span> <span style="color:var(--text); font-weight:bold;">' + currentActive.name + '</span>\n';
  } else {
    html += '  <span style="color:var(--accent);">✓ ALL PROTOCOL TARGETS COMPLETED</span>\n';
  }

  html += '<span style="color:var(--text-faint)">└─────────────────────────────────────────────────────────┘</span>';
  html += '</div>';

  printTermTyped(html, 'sys');
}

// === CRT TOGGLE ===
function toggleCRT() {
  S.crtEnabled = !S.crtEnabled;
  var crtEl = document.getElementById('crt-screen-effect');
  if (crtEl) { if (S.crtEnabled) crtEl.classList.add('crt-active'); else crtEl.classList.remove('crt-active'); }
  ss();
  addLog('info', 'CRT overlay ' + (S.crtEnabled ? 'enabled' : 'disabled'));
}

// === SYSINFO / NEOFETCH COMMAND ===
function renderSysinfoCommand() {
  // Compute stats
  var level = 0, cum = 0;
  for (var i = 0; i < LEVELS.length - 1; i++) { if (S.xp >= cum + LEVELS[i].next) { cum += LEVELS[i].next; level++; } else break; }
  var lvl = LEVELS[level];
  var nextXp = lvl.next === Infinity ? '∞' : (cum + lvl.next);

  // Current theme name
  var themeName = 'nephrite';
  var themeObj = THEMES.find(function(t) { return t.id === (S.theme || 'default'); });
  if (themeObj) themeName = themeObj.name;

  // Uptime (days since first swim entry)
  var firstDate = null;
  if (S.swimHistory && S.swimHistory.length > 0) {
    var norm = normalizeDateToISO(S.swimHistory[0].date);
    var parts = norm.split('-').map(Number);
    firstDate = new Date(parts[0], parts[1] - 1, parts[2]);
  }
  var uptimeDays = firstDate ? Math.floor((new Date() - firstDate) / 86400000) : 0;

  // Swim streak
  var swimStreak = 0;
  if (S.swimHistory) {
    for (var si = S.swimHistory.length - 1; si >= 0; si--) {
      var se = S.swimHistory[si];
      var norm = normalizeDateToISO(se.date);
      var sp = norm.split('-').map(Number);
      var sd = new Date(sp[0], sp[1] - 1, sp[2]);
      if (sd.getDay() === 3) { continue; }
      if (se.status === 'Swam') { swimStreak++; } else break;
    }
  }

  // Water today
  var todayKey = new Date().toISOString().split('T')[0];
  var waterToday = (S.waterLogs && S.waterLogs[todayKey]) ? S.waterLogs[todayKey] : 0;

  // Modules
  var modules = ['ethe', 'swim', 'focus', 'papers', 'skills', 'water', 'bio'];

  // localStorage size estimate
  var lsSize = '~' + Math.round(JSON.stringify(S).length / 1024) + 'KB';

  // Build ASCII art
  var logo = [
    '  ███████╗████████╗██╗  ██╗ ██████╗ ███████╗',
    '  ██╔════╝╚══██╔══╝██║  ██║██╔═══██╗██╔════╝',
    '  █████╗     ██║   ███████║██║   ██║███████╗',
    '  ██╔══╝     ██║   ██╔══██║██║   ██║╚════██║',
    '  ███████╗   ██║   ██║  ██║╚██████╔╝███████║',
    '  ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝'
  ];

  var props = [];
  
    props = [
      ['OS',          'ethos.init v2.3.1'],
      ['Shell',       'interactive / JetBrains Mono'],
      ['Identity',    (S.authUsername ? '@' + S.authUsername : '') + (S.authEmail ? ' (' + S.authEmail + ')' : '<none>')],
      ['Uptime',      uptimeDays + ' days'],
      ['Theme',       themeName],
      ['Rank',        'lvl ' + (level + 1) + ' / ' + lvl.title],
      ['XP',          S.xp + ' / ' + nextXp],
      ['Streak',      S.streak + ' days'],
      ['Swim Streak', swimStreak + ' days 🏊'],
      ['Hydration',   waterToday.toFixed(1) + 'L / 4.0L 💧'],
      ['CRT Mode',    S.crtEnabled ? 'ON' : 'OFF'],
      ['Modules',     modules.length + ' loaded'],
      ['Memory',      lsSize]
    ];
  

  // Color palette
  var colors = ['var(--accent)', 'var(--amber)', 'var(--red)', 'var(--blue)', 'var(--purple)', '#22d3ee', '#f472b6'];
  var paletteHtml = '  ';
  colors.forEach(function(c) {
    paletteHtml += '<span style="background:' + c + '; display:inline-block; width:18px; height:10px; border-radius:1px; margin-right:4px;"></span>';
  });

  // Render
  var html = '<div style="font-family: monospace; white-space: pre; line-height: 1.4; color: var(--text);">';
  html += '<span style="color:var(--text-faint)">┌──────────────────────────────────────────────────────────────────────────┐</span>\n';

  logo.forEach(function(line) {
    html += '<span style="color:var(--accent)">' + line + '</span>\n';
  });

  props.forEach(function(pair) {
    var label = '  ' + pair[0] + ' ';
    var dashes = '─'.repeat(Math.max(1, 14 - pair[0].length));
    html += '<span style="color:var(--accent)">' + label + '</span><span style="color:var(--text-faint)">' + dashes + '</span> <span style="color:var(--text-dim)">' + escapeHtml(pair[1]) + '</span>\n';
  });

  html += '\n' + paletteHtml + '\n';
  html += '<span style="color:var(--text-faint)">└──────────────────────────────────────────────────────────────────────────┘</span>';
  html += '</div>';

  printTermTyped(html, 'sys');
}



// === RENDER ===
function render() {
    renderStats(); renderXP(); renderContrib(); renderGroupSummary();
  renderEtheTab(); renderTodayQuick(); renderSkills();
  renderPapers(); renderLog(); renderPhases(); renderThemes();
  renderExpectations(); renderSwimTab(); renderBiometrics();
  renderSyncPanel();
  renderEcreMemoryDashboard();
  if (typeof renderCOHERENCE === 'function') renderCOHERENCE();
  if (typeof updateOracleKeyStatus === 'function') updateOracleKeyStatus();
  var n = document.getElementById('today-note');
  var p = document.getElementById('paper-note');
  if (n && document.activeElement !== n) n.value = S.todayNote || '';
  if (p && document.activeElement !== p) p.value = S.paperNote || '';
}

function renderEcreMemoryDashboard() {
  const promisesList = document.getElementById('ecre-promises-list');
  const questionsList = document.getElementById('ecre-questions-list');
  const patternsList = document.getElementById('ecre-patterns-list');
  if (!promisesList || !questionsList || !patternsList) return;

  promisesList.innerHTML = '';
  questionsList.innerHTML = '';
  patternsList.innerHTML = '';

  const memory = S.ecreMemory || { lastObservations: [], namedPatterns: [], openQuestions: [], userPromises: [], sessionCount: 0 };

  // 1. Render Promises
  const activePromises = (memory.userPromises || []).filter(p => !p.fulfilled);
  if (activePromises.length === 0) {
    promisesList.innerHTML = '<div class="ecre-empty-msg">// No active commitments.</div>';
  } else {
    activePromises.forEach(p => {
      const chip = document.createElement('div');
      chip.className = 'ecre-mem-chip';
      chip.style.borderLeft = '2px solid var(--accent)';
      
      const targetLabel = (p.targetGroup || 'any');
      const dateLabel = (p.date || 'unknown');
      const metaText = `Target: [${escapeHtml(targetLabel)}] | Date: ${escapeHtml(dateLabel)}`;
      
      chip.innerHTML = `
        <div>${escapeHtml(p.promise)}</div>
        <div class="ecre-chip-meta">${metaText}</div>
      `;
      promisesList.appendChild(chip);
    });
  }

  // 2. Render Unanswered Questions
  const unansweredQuestions = (memory.openQuestions || []).filter(q => q.answer === null);
  if (unansweredQuestions.length === 0) {
    questionsList.innerHTML = '<div class="ecre-empty-msg">// No open questions.</div>';
  } else {
    unansweredQuestions.forEach(q => {
      const chip = document.createElement('div');
      chip.className = 'ecre-mem-chip';
      chip.style.borderLeft = '2px solid var(--red)';
      
      const metaText = `Session: #${q.sessionAsked} | XP_LOCK active`;
      
      chip.innerHTML = `
        <div style="color:var(--text);">${escapeHtml(q.question)}</div>
        <div class="ecre-chip-meta">${metaText}</div>
      `;
      questionsList.appendChild(chip);
    });
  }

  // 3. Render Patterns
  const patterns = memory.namedPatterns || [];
  if (patterns.length === 0) {
    patternsList.innerHTML = '<div class="ecre-empty-msg">// Listening for anomalies...</div>';
  } else {
    patterns.forEach(p => {
      const chip = document.createElement('div');
      chip.className = 'ecre-mem-chip';
      chip.style.borderLeft = '2px solid var(--amber)';
      
      const metaText = `Pattern: active alert`;
      
      chip.innerHTML = `
        <div>${escapeHtml(p)}</div>
        <div class="ecre-chip-meta">${metaText}</div>
      `;
      patternsList.appendChild(chip);
    });
  }
}

function getAllEthe() {
  return S.routines.reduce(function(a, r) { return a.concat(r.ethe); }, []);
}



function renderStats() {
  var all = getAllEthe(), done = all.filter(function(e) { return e.done; }).length;
  document.getElementById('stat-streak').textContent = S.streak;
  document.getElementById('stat-xp').textContent = S.xp;
  
  const xpTodayEl = document.getElementById('stat-xp-today');
  const isDeepSync = typeof compileCognitiveVector !== 'undefined' && compileCognitiveVector().state === 'DEEP_SYNC';
  if (isDeepSync && xpTodayEl) {
    const flowBadge = 'x1.2 Flow';
    xpTodayEl.innerHTML = S.xpToday + ' <span class="flow-xp-badge" style="font-size:10px;font-weight:700;color:var(--accent);text-shadow:0 0 3px var(--accent-faint);background:var(--accent-faint);border:1px solid var(--accent);padding:1px 3px;border-radius:3px;margin-left:3px;vertical-align:middle">' + flowBadge + '</span>';
  } else if (xpTodayEl) {
    xpTodayEl.textContent = S.xpToday;
  }
  
  document.getElementById('stat-hours').textContent = Math.round(S.totalHours * 10) / 10;
  document.getElementById('stat-done').textContent = done;
  
  
    document.getElementById('stat-done-delta').textContent = '\u2014 ' + done + ' / ' + all.length + ' today';
    document.getElementById('stat-streak-delta').textContent = S.streak > 0 ? '\u25B2 ' + S.streak + ' day streak' : '\u2014 start today';
    document.getElementById('stat-hours-delta').textContent = '\u25B2 this week: ' + (Math.round(S.weekHours * 10) / 10) + 'h';
  
}

function renderGroupSummary() {
  var container = document.getElementById('group-summary');
  if (!container) return;
  container.innerHTML = '';
  S.ethosGroups.forEach(function(g) {
    var all = getAllEthe().filter(function(e) { return e.groupId === g.id; });
    var done = all.filter(function(e) { return e.done; }).length;
    var xp = all.filter(function(e) { return e.done; }).reduce(function(s, e) { return s + e.xp; }, 0);
    var card = document.createElement('div');
    card.className = 'group-card';
    
    var progressText = done + '/' + all.length + ' today';
    const labelText = g.label;
    
    card.innerHTML = '<div class="gc-label" style="color:' + g.color + '">' + labelText + '</div>' +
      '<div class="gc-streak">' + g.streak + ' \uD83D\uDD25</div>' +
      '<div class="gc-progress">' + progressText + '</div>' +
      '<div class="gc-xp">+' + xp + ' xp</div>';
    container.appendChild(card);
  });
}

function renderXP() {
  var level = 0, cum = 0;
  for (var i = 0; i < LEVELS.length - 1; i++) { if (S.xp >= cum + LEVELS[i].next) { cum += LEVELS[i].next; level++; } else break; }
  var lvl = LEVELS[level], nxt = LEVELS[Math.min(level + 1, LEVELS.length - 1)];
  var inLvl = S.xp - cum, pct = lvl.next === Infinity ? 100 : Math.min(100, Math.round(inLvl / lvl.next * 100));
  document.getElementById('xp-level').textContent = level + 1;
  document.getElementById('xp-title').textContent = lvl.title;
  document.getElementById('xp-current').textContent = inLvl;
  document.getElementById('xp-next').textContent = lvl.next === Infinity ? '\u221E' : lvl.next;
  document.getElementById('xp-bar').style.width = pct + '%';
  document.getElementById('xp-next-title').textContent = nxt.title;
}

function renderContrib() {
  var grid = document.getElementById('contrib-grid');
  if (!grid) return;
  grid.innerHTML = '';
  var weeks = 30, cells = weeks * 7, now = new Date();
  for (var w = 0; w < weeks; w++) {
    var week = document.createElement('div'); week.className = 'contrib-week';
    for (var d = 0; d < 7; d++) {
      var date = new Date(now); date.setDate(now.getDate() - (cells - 1 - (w * 7 + d)));
      var key = date.toDateString();
      var entry = (S.contrib || []).find(function(c) { return c.date === key; });
      var lv = entry ? entry.level : 0;
      var day = document.createElement('div'); day.className = 'contrib-day'; day.setAttribute('data-level', lv);
      var tip = document.createElement('div'); tip.className = 'tooltip';
      tip.textContent = key.slice(4, 10) + ' \u00B7 ' + (lv > 0 ? lv * 25 + '%' : 'no activity');
      day.appendChild(tip); week.appendChild(day);
    }
    grid.appendChild(week);
  }
}

function renderEtheTab() {
  var all = getAllEthe();
  
  // Update water logs done state for renderEtheTab based on S.waterLogs
  all.forEach(function(e) {
    if (e.isWater) {
      const waterVal = S.waterLogs[S.activeDate] || 0;
      e.done = waterVal >= 3.5;
    }
  });

  // Update living comment dynamically from ECRE and color appropriately
  var ethosComment = document.getElementById('ethos-comment');
  var radarComment = document.getElementById('radar-living-comment');
  var vector = compileCognitiveVector();
  
  let activeColor = 'var(--accent)';
  if (vector.state === 'TURBULENT') activeColor = 'var(--amber)';
  else if (vector.state === 'DEGRADED') activeColor = 'var(--red)';
  
  if (ethosComment) {
    ethosComment.textContent = vector.livingComment;
    ethosComment.style.color = activeColor;
  }
  if (radarComment) {
    radarComment.textContent = vector.livingComment;
    radarComment.style.color = activeColor;
  }

  var doneCount = all.filter(function(e) { return e.done; }).length;
  var pct = all.length > 0 ? Math.round((doneCount / all.length) * 100) : 0;
  var dateEl = document.getElementById('ethos-date');
  var activeDateObj = new Date(S.activeDate);
  if (dateEl) dateEl.textContent = activeDateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase();
  var todayBadge = document.getElementById('ethos-today-badge');
  if (todayBadge) todayBadge.style.display = (S.activeDate === TODAY) ? 'inline' : 'none';
  
  var strEl = document.getElementById('ethos-streak-val');
  var fill = document.getElementById('dp-bar-fill');
  const isPatternViolation = S.ecreMemory && S.ecreMemory.patternViolationActive;
  
  if (strEl) {
    strEl.textContent = S.streak;
    if (isPatternViolation) {
      strEl.style.color = 'var(--amber)';
      strEl.style.textShadow = '0 0 8px var(--amber)';
    } else {
      strEl.style.color = '';
      strEl.style.textShadow = '';
    }
  }
  var shdEl = document.getElementById('ethos-shield-val');
  if (shdEl) shdEl.textContent = Math.floor(S.streak / 7);
  
  var pctEl = document.getElementById('dp-pct');
  if (fill) {
    fill.style.width = pct + '%';
    if (isPatternViolation) {
      fill.style.background = 'var(--amber)';
      fill.style.boxShadow = '0 0 10px var(--amber)';
    } else {
      fill.style.background = '';
      fill.style.boxShadow = '';
    }
  }
  if (pctEl) pctEl.textContent = pct + '%';

  // Keep today only checkbox synchronized
  const todayOnlyCheckbox = document.getElementById('today-only-checkbox');
  if (todayOnlyCheckbox) todayOnlyCheckbox.checked = !!S.todayOnlyToggle;

  // Update group filter active state
  document.querySelectorAll('.group-filter-tab').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.group === S.activeGroupFilter);
  });

  // Week calendar
  var calDays = document.getElementById('week-cal-days');
  if (calDays) {
    calDays.innerHTML = '';
    var now = new Date(), dayOfWeek = now.getDay();
    var startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek + (S.weekOffset * 7));
    var dayNames = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
    for (var i = 0; i < 7; i++) {
      var d = new Date(startOfWeek); d.setDate(startOfWeek.getDate() + i);
      var isActive = d.toDateString() === S.activeDate;
      var hasData = (S.history && S.history[d.toDateString()] && Object.values(S.history[d.toDateString()]).some(function(v) { return v; })) || (S.contrib || []).find(function(c) { return c.date === d.toDateString() && c.level > 0; });
      var col = document.createElement('div'); col.className = 'wcd-col';
      col.innerHTML = '<div class="wcd-name">' + dayNames[i] + '</div><div class="wcd-num ' + (isActive ? 'is-today' : '') + ' ' + (hasData ? 'has-data' : '') + '">' + d.getDate() + '</div>';
      (function(dateStr) {
        col.querySelector('.wcd-num').onclick = function() {
          S.activeDate = dateStr;
          S.routines.forEach(function(r) { r.ethe.forEach(function(e) {
            if (e.isWater) {
              const waterVal = S.waterLogs[S.activeDate] || 0;
              e.done = waterVal >= 3.5;
            } else {
              e.done = S.history[S.activeDate] ? !!S.history[S.activeDate][e.id] : (S.activeDate === TODAY ? e.done : false);
            }
          }); });
          ss(); renderEtheTab(); renderExpectations();
        };
      })(d.toDateString());
      calDays.appendChild(col);
    }
  }

  if (S.ethosViewMode === 'protocol') {
    renderProtocolView();
    return;
  }

  // Routine groups
  var container = document.getElementById('ethos-routines');
  if (!container) return;
  container.innerHTML = '';
  
  const activeDay = new Date(S.activeDate).getDay();

  S.routines.forEach(function(r, rIdx) {
    // Filter ethe by active group
    var visibleEthe = S.activeGroupFilter === 'all' ? r.ethe : r.ethe.filter(function(e) { return e.groupId === S.activeGroupFilter; });
    
    // Filter by day-of-week schedule if todayOnlyToggle is checked
    if (S.todayOnlyToggle) {
      visibleEthe = visibleEthe.filter(function(e) {
        return !e.days || e.days.includes(activeDay);
      });
    }

    if (visibleEthe.length === 0 && S.activeGroupFilter !== 'all') return;
    var doneR = visibleEthe.filter(function(e) { return e.done; }).length;
    var totalR = visibleEthe.length;

    var wrap = document.createElement('div');
    wrap.className = 'r-group' + (r.collapsed ? ' collapsed' : '');
    var hdr = document.createElement('div'); hdr.className = 'r-group-header';
    
    const rTitle = r.title;
    const rSubtitle = r.subtitle;
    
    hdr.innerHTML = '<div><div class="r-group-title"><span style="color:' + (r.color || 'inherit') + '">' + r.icon + ' ' + rTitle + '</span></div><div class="r-group-sub">' + rSubtitle + '</div></div><div class="r-group-count">[' + doneR + '/' + totalR + '] <span class="hgc-arrow">\u25BE</span></div>';
    hdr.onclick = function() { r.collapsed = !r.collapsed; ss(); renderEtheTab(); };
    wrap.appendChild(hdr);

    var body = document.createElement('div'); body.className = 'r-group-body';
    visibleEthe.forEach(function(e) {
      var grp = S.ethosGroups.find(function(g) { return g.id === e.groupId; });
      var grpColor = grp ? grp.color : '#888';
      var isOffDay = e.days && !e.days.includes(activeDay);
      var isDone = e.done;
      
      var el = document.createElement('div');
      var itemClasses = ['e-item'];
      if (isDone) itemClasses.push('done');
      if (isOffDay) itemClasses.push('off-day');
      el.className = itemClasses.join(' ');
      
      var restTag = isOffDay ? ('<span class="rest-day-tag">rest</span>') : '';
      
      // Water target element
      var checkHtml = '';
      if (e.isWater) {
        const waterVal = S.waterLogs[S.activeDate] || 0;
        checkHtml = `
          <div class="water-widget" style="margin-top: 4px;">
            <button class="water-btn minus-btn">-</button>
            <span class="water-amount">💧 ${waterVal.toFixed(1)}L / 4.5L</span>
            <button class="water-btn plus-btn">+</button>
          </div>
        `;
      } else {
        checkHtml = '<div class="e-item-check">' + (isDone ? '[x]' : '[ ]') + '</div>';
      }

      // Triluma countdown progress bar element
      var trilumaHtml = '';
      if (e.isTriluma) {
        const startDate = new Date(S.trilumaStartDate);
        const activeDate = new Date(S.activeDate);
        const diffDays = Math.floor((activeDate - startDate) / (1000 * 60 * 60 * 24));
        const daysPassed = Math.max(0, diffDays) + 1;
        const pct = Math.min(100, Math.round((daysPassed / 90) * 100));
        
        let warningClass = '';
        let warningText = '<div class="log-msg" style="color:var(--text-faint); margin-top:4px">// Max 90 days continuous. Keep thin layer on hyperpigmentation only.</div>';
        if (daysPassed > 90) {
          warningClass = 'triluma-warning';
          warningText = '<div class="log-msg triluma-warning" style="margin-top:4px">// WARNING: Active cycle exceeds 90 days continuous! Risk of ochronosis. Seek dermatological review immediately.</div>';
        }
        
        const titleLabel = 'TRILUMA ACTIVE CYCLE';
        const dayLabel = `Day ${daysPassed} / 90`;
        const startLabel = 'Cycle Start:';
        
        trilumaHtml = `
          <div class="triluma-countdown-box" style="margin-top: 6px;">
            <div class="triluma-header">
              <span>💊 ${titleLabel}</span>
              <span class="${warningClass}">${dayLabel}</span>
            </div>
            <div class="triluma-bar-bg">
              <div class="triluma-bar-fill" style="width: ${pct}%"></div>
            </div>
            <div class="triluma-controls" style="margin-top: 4px;">
              <label style="font-size: 10px; color: var(--text-faint)">${startLabel}</label>
              <input type="date" class="triluma-date-input" value="${S.trilumaStartDate}">
            </div>
            ${warningText}
          </div>
        `;
      }

      const eName = e.name;
      const eNote = e.note;
      const grpLabel = grp ? (grp.label) : '';

      el.innerHTML = `
        <div style="display:flex; align-items:center; width:100%; gap:8px;">
          ${e.isWater ? '' : checkHtml}
          <div class="e-item-info">
            <div class="e-item-name">
              <span style="color:${isDone ? 'inherit' : (e.color || 'inherit')}">${eName}</span>
              ${e.icon ? ' <span>' + e.icon + '</span>' : ''}
              ${restTag}
              <span class="e-item-group-tag" style="color:${grpColor}">${grpLabel}</span>
            </div>
            ${eNote ? '<div class="e-item-note">' + eNote + '</div>' : ''}
            ${e.isWater ? checkHtml : ''}
            ${trilumaHtml}
          </div>
          <div class="e-item-meta">
            <span class="e-item-streak">${e.streak}🔥</span>
            <button class="ethos-rm" data-id="${e.id}">rm</button>
          </div>
        </div>
      `;

      if (!e.isWater) {
        el.querySelector('.e-item-check').onclick = function(ev) { ev.stopPropagation(); toggleEthos(rIdx, e.id); };
        el.querySelector('.e-item-name').onclick = function(ev) { ev.stopPropagation(); toggleEthos(rIdx, e.id); };
      } else {
        el.querySelector('.minus-btn').onclick = function(ev) { ev.stopPropagation(); changeWaterIntake(rIdx, e.id, -0.5); };
        el.querySelector('.plus-btn').onclick = function(ev) { ev.stopPropagation(); changeWaterIntake(rIdx, e.id, 0.5); };
      }

      if (e.isTriluma) {
        el.querySelector('.triluma-date-input').onclick = function(ev) { ev.stopPropagation(); };
        el.querySelector('.triluma-date-input').onchange = function(ev) {
          S.trilumaStartDate = ev.target.value;
          ss();
          renderEtheTab();
        };
      }

      el.querySelector('.ethos-rm').onclick = function(ev) { ev.stopPropagation(); removeEthosFromRoutine(rIdx, e.id); };

      body.appendChild(el);
    });
    wrap.appendChild(body); container.appendChild(wrap);
  });
}

function renderProtocolView() {
  var container = document.getElementById('protocol-view');
  if (!container) return;
  container.innerHTML = '';

  var allEthe = getAllEthe();
  var activeDay = new Date(S.activeDate).getDay();

  // Find first unchecked ethos item scheduled for today
  var currentActiveId = null;
  for (var pi = 0; pi < PROTOCOL_ORDER.length; pi++) {
    var pOrder = PROTOCOL_ORDER[pi];
    var foundUnchecked = false;
    for (var ii = 0; ii < pOrder.ids.length; ii++) {
      var id = pOrder.ids[ii];
      var e = allEthe.find(function(x) { return Number(x.id) === Number(id); });
      if (e) {
        var isOffDay = e.days && !e.days.includes(activeDay);
        var isHidden = S.todayOnlyToggle && isOffDay;
        if (!isHidden && !e.done) {
          currentActiveId = e.id;
          foundUnchecked = true;
          break;
        }
      }
    }
    if (foundUnchecked) break;
  }

  var stepCounter = 1;
  PROTOCOL_ORDER.forEach(function(phaseOrder) {
    var phaseDef = PROTOCOL_PHASES.find(function(p) { return p.id === phaseOrder.phase; });
    if (!phaseDef) return;
    var phaseDoneCount = 0;
    var phaseActiveCount = 0;
    var phaseEthe = [];

    phaseOrder.ids.forEach(function(id) {
      var e = allEthe.find(function(x) { return Number(x.id) === Number(id); });
      if (e) {
        var isOffDay = e.days && !e.days.includes(activeDay);
        var isHidden = S.todayOnlyToggle && isOffDay;
        if (!isHidden) {
          phaseActiveCount++;
          if (e.done) phaseDoneCount++;
          phaseEthe.push({ ethos: e, isOffDay: isOffDay });
        }
      }
    });

    if (phaseActiveCount === 0) return;

    var isPhaseCompleted = phaseDoneCount === phaseActiveCount;
    var isCollapsed = S.protocolCollapsed[phaseDef.id] !== undefined ? S.protocolCollapsed[phaseDef.id] : isPhaseCompleted;

    var phaseDiv = document.createElement('div');
    phaseDiv.className = 'protocol-phase' + (isPhaseCompleted ? ' completed' : '') + (isCollapsed ? ' collapsed' : '');

    var header = document.createElement('div');
    header.className = 'protocol-phase-header';
    
    const phaseLabel = phaseDef.label;
    
    header.innerHTML = `
      <span class="protocol-phase-label">${phaseDef.icon} ${phaseLabel} <span style="font-size:10px;color:var(--text-dim);font-weight:400;margin-left:4px;">${phaseDef.time}</span></span>
      <span class="protocol-phase-counter">[${phaseDoneCount}/${phaseActiveCount}] <span class="hgc-arrow">${isCollapsed ? '◂' : '▾'}</span></span>
    `;
    header.onclick = function() {
      S.protocolCollapsed[phaseDef.id] = !isCollapsed;
      ss();
      renderEtheTab();
    };
    phaseDiv.appendChild(header);

    var body = document.createElement('div');
    body.className = 'protocol-phase-body';
    if (isCollapsed) {
      body.style.display = 'none';
    }

    phaseEthe.forEach(function(itemInfo) {
      var e = itemInfo.ethos;
      var isOffDay = itemInfo.isOffDay;
      var isDone = e.done;
      var isCurrent = Number(e.id) === Number(currentActiveId);

      var stepNum = stepCounter++;
      var stepNumStr = String(stepNum).padStart(2, '0');

      var el = document.createElement('div');
      var itemClasses = ['protocol-item'];
      if (isDone) itemClasses.push('done');
      if (isCurrent) itemClasses.push('current');
      el.className = itemClasses.join(' ');
      el.setAttribute('data-id', e.id);

      var restTag = isOffDay ? ('<span class="rest-day-tag">rest</span>') : '';
      var grp = S.ethosGroups.find(function(g) { return g.id === e.groupId; });
      var grpColor = grp ? grp.color : '#888';

      // Water target element
      var checkHtml = '';
      if (e.isWater) {
        const waterVal = S.waterLogs[S.activeDate] || 0;
        checkHtml = `
          <div class="water-widget" style="margin-top: 4px;">
            <button class="water-btn minus-btn">-</button>
            <span class="water-amount">💧 ${waterVal.toFixed(1)}L / 4.5L</span>
            <button class="water-btn plus-btn">+</button>
          </div>
        `;
      } else {
        checkHtml = '<div class="protocol-item-check">' + (isDone ? '[x]' : '[ ]') + '</div>';
      }

      // Triluma countdown progress bar element
      var trilumaHtml = '';
      if (e.isTriluma) {
        const startDate = new Date(S.trilumaStartDate);
        const activeDate = new Date(S.activeDate);
        const diffDays = Math.floor((activeDate - startDate) / (1000 * 60 * 60 * 24));
        const daysPassed = Math.max(0, diffDays) + 1;
        const pct = Math.min(100, Math.round((daysPassed / 90) * 100));
        
        let warningClass = '';
        let warningText = '<div class="log-msg" style="color:var(--text-faint); margin-top:4px">// Max 90 days continuous. Keep thin layer on hyperpigmentation only.</div>';
        if (daysPassed > 90) {
          warningClass = 'triluma-warning';
          warningText = '<div class="log-msg triluma-warning" style="margin-top:4px">// WARNING: Active cycle exceeds 90 days continuous! Risk of ochronosis. Seek dermatological review immediately.</div>';
        }
        
        const titleLabel = 'TRILUMA ACTIVE CYCLE';
        const dayLabel = `Day ${daysPassed} / 90`;
        const startLabel = 'Cycle Start:';
        
        trilumaHtml = `
          <div class="triluma-countdown-box" style="margin-top: 6px;">
            <div class="triluma-header">
              <span>💊 ${titleLabel}</span>
              <span class="${warningClass}">${dayLabel}</span>
            </div>
            <div class="triluma-bar-bg">
              <div class="triluma-bar-fill" style="width: ${pct}%"></div>
            </div>
            <div class="triluma-controls" style="margin-top: 4px;">
              <label style="font-size: 10px; color: var(--text-faint)">${startLabel}</label>
              <input type="date" class="triluma-date-input" value="${S.trilumaStartDate}">
            </div>
            ${warningText}
          </div>
        `;
      }

      const eName = e.name;
      const grpLabel = grp ? (grp.label) : '';

      el.innerHTML = `
        <span class="protocol-step-num">${stepNumStr}.</span>
        ${e.isWater ? '' : checkHtml}
        <div class="protocol-item-name" style="display:flex; flex-direction:column; align-items:flex-start; width:100%;">
          <div style="display:flex; align-items:center; gap:6px; width:100%;">
            <span style="color:${isDone ? 'inherit' : (e.color || 'inherit')}">${eName}</span>
            ${e.icon ? ' <span>' + e.icon + '</span>' : ''}
            ${restTag}
            <span class="protocol-item-group" style="color:${grpColor}">${grpLabel}</span>
          </div>
          ${e.isWater ? checkHtml : ''}
          ${trilumaHtml}
        </div>
        <div class="e-item-meta">
          <span class="e-item-streak">${e.streak}🔥</span>
          <button class="ethos-rm" data-id="${e.id}">rm</button>
        </div>
      `;

      // Set up click handlers
      var rIdx = S.routines.findIndex(function(r) { return r.ethe.some(function(x) { return x.id === e.id; }); });
      if (rIdx !== -1) {
        if (!e.isWater) {
          var checkBtn = el.querySelector('.protocol-item-check');
          var nameBtn = el.querySelector('.protocol-item-name');
          if (checkBtn) {
            checkBtn.onclick = function(ev) {
              ev.stopPropagation();
              toggleEthos(rIdx, e.id);
            };
          }
          if (nameBtn) {
            nameBtn.onclick = function(ev) {
              ev.stopPropagation();
              toggleEthos(rIdx, e.id);
            };
          }
        } else {
          var mBtn = el.querySelector('.minus-btn');
          var pBtn = el.querySelector('.plus-btn');
          if (mBtn) mBtn.onclick = function(ev) { ev.stopPropagation(); changeWaterIntake(rIdx, e.id, -0.5); };
          if (pBtn) pBtn.onclick = function(ev) { ev.stopPropagation(); changeWaterIntake(rIdx, e.id, 0.5); };
        }

        if (e.isTriluma) {
          var dateInp = el.querySelector('.triluma-date-input');
          if (dateInp) {
            dateInp.onclick = function(ev) { ev.stopPropagation(); };
            dateInp.onchange = function(ev) {
              S.trilumaStartDate = ev.target.value;
              ss();
              renderEtheTab();
            };
          }
        }

        var rmBtn = el.querySelector('.ethos-rm');
        if (rmBtn) {
          rmBtn.onclick = function(ev) {
            ev.stopPropagation();
            removeEthosFromRoutine(rIdx, e.id);
          };
        }
      }

      var itemWrapper = document.createElement('div');
      itemWrapper.appendChild(el);
      if (e.note) {
        var noteDiv = document.createElement('div');
        noteDiv.className = 'protocol-item-note';
        noteDiv.textContent = e.note;
        itemWrapper.appendChild(noteDiv);
      }

      body.appendChild(itemWrapper);
    });

    phaseDiv.appendChild(body);
    container.appendChild(phaseDiv);
  });

  // Render protocol summary at the bottom of the list
  var currentActiveName = '';
  if (currentActiveId !== null) {
    var curEthos = allEthe.find(function(x) { return x.id === currentActiveId; });
    if (curEthos) currentActiveName = curEthos.name;
  }

  var summaryDiv = document.createElement('div');
  summaryDiv.className = 'protocol-summary';
  if (currentActiveName) {
    summaryDiv.innerHTML = `
      <div class="protocol-current-label">NEXT_TARGET: ${currentActiveName}</div>
      <div>[${stepCounter - 1} steps scheduled today]</div>
    `;
  } else {
    summaryDiv.innerHTML = `
      <div class="protocol-current-label" style="color:var(--accent)">✓ ALL TARGETS ACHIEVED TODAY</div>
      <div>[${stepCounter - 1} steps completed]</div>
    `;
  }
  container.appendChild(summaryDiv);

  scrollToCurrentProtocolStep();
}

function scrollToCurrentProtocolStep() {
  var cur = document.querySelector('.protocol-item.current');
  if (cur) {
    cur.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function scrollToCurrentProtocolStep() {
  var cur = document.querySelector('.protocol-item.current');
  if (cur) {
    cur.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function renderTodayQuick() {
  var el = document.getElementById('today-ethe-quick');
  if (!el) return;
  var all = getAllEthe(), inc = all.filter(function(e) { return !e.done; });
  if (inc.length === 0) {
    el.innerHTML = '<div style="color:var(--accent);font-size:13px;padding:12px 0">\u2713 all \u1F74\u03B8\u03B7 completed \u2014 streak maintained</div>';
    return;
  }
  el.innerHTML = '';
  inc.slice(0, 4).forEach(function(e) {
    var item = document.createElement('div'); item.className = 'e-item';
    item.innerHTML = '<div class="e-item-check">[ ]</div><div class="e-item-info"><div class="e-item-name"><span style="color:' + (e.color || 'inherit') + '">' + e.name + '</span></div></div><div class="e-item-meta">+' + e.xp + ' xp</div>';
    item.onclick = function() { document.querySelectorAll('.nav-tab')[1].click(); };
    el.appendChild(item);
  });
  if (inc.length > 4) el.innerHTML += '<div style="font-size:12px;color:var(--text-dim);padding:6px 12px">// +' + (inc.length - 4) + ' more in \u1F74\u03B8\u03B7 tab</div>';
}

function renderSkills() {
  SKILLS.forEach(function(s) {
    const v = S.skills[s.key] || 0;
    const fill = document.getElementById('sn-fill-' + s.key);
    const valText = document.getElementById('sn-val-' + s.key);
    if (fill) {
      fill.style.width = v + '%';
      fill.style.background = s.color;
    }
    if (valText) {
      valText.textContent = v + '%';
      valText.style.color = s.color;
    }
  });
  
  if (window.selectedSkillKey) {
    const pct = document.getElementById('sh-pct');
    if (pct) pct.textContent = (S.skills[window.selectedSkillKey] || 0) + '%';
  }
  
  renderAchievements();
}

// === ACHIEVEMENTS SYSTEM ===

const ACHIEVEMENTS = [
  { id: 'FIRST_FLIGHT', name: 'First Flight', desc: 'Log your first 1.0 hour of study', badge: '      /|         |\\\n     / |   /\\    | \\\n    |  |  /  \\   |  |\n    |  |_/====\\_ |  |\n     \\ |[X-WING] | /\n      \\|         |/' },
  { id: 'CHRONOS_STREAK', name: 'Chronos Streak', desc: 'Reach a 7-day global streak', badge: '      /\\\n     /  \\\n    /====\\\n   /______\\\n  [CHRONOS 7D]' },
  { id: 'ACADEMIC_DRILL', name: 'Academic Drill', desc: 'Read 3 academic research papers', badge: '    ┌───┐\n    │ 📄 │\n    └───┘\n  [ARCHIVIST]' },
  { id: 'DEEP_SPACE_FOCUS', name: 'Deep Space Focus', desc: 'Complete a 50-minute Focus session', badge: '     .---.\n    |=(_)=|\n     \'---\'\n  [DEEP_FOCUS]' },
  { id: 'SYNAPTIC_OVERFLOW', name: 'Synaptic Overflow', desc: 'Master any skill to 100% level', badge: '      /\\\n     <  >\n      \\/\n     *  *\n  [100% MATRIX]' },
  { id: 'FORCE_HARMONY', name: 'Force Harmony', desc: 'Complete all daily routines', badge: '    (✖‿✖)\n     \\  /\n      \\/\n  [DAILY_HARMONY]' },
  { id: 'ORACLE_ASCENT', name: 'Oracle Ascent', desc: 'Reach Level 6 (Transformer Sage)', badge: '    [Sage]\n    /════\\\n    \\════/\n  [TRANSFORMER]' },
  { id: 'AQUAMAN', name: 'Aquaman', desc: 'Log a double-session swim day', badge: '      🏊   🏊\n     (o)   (o)\n      \\     /\n     =========\n  [DOUBLE SWIM]' },
  { id: 'POSEIDONS_LUNGS', name: 'Poseidon\'s Lungs', desc: 'Complete 25 swim sessions', badge: '     .-----.\n    /  o o  \\\n   |  <___>  |\n    \\       /\n  [POSEIDON 25S]' },
  { id: 'DERMA_GLOW', name: 'Derma Glow', desc: 'Azelaic Acid checked 7 days in a row', badge: '      \\│/\n    ─ (☼) ─\n      /│\\\n  [DERMA GLOW]' },
  { id: 'HYDRO_CHAMP', name: 'Hydro Champ', desc: 'Hit water target 5 days in a row', badge: '     💧💧💧\n    💧   💧\n     💧💧💧\n  [HYDRO CHAMP]' }
];

function checkAchievements() {
  if (!S.unlockedAchievements) S.unlockedAchievements = {};
  let unlockedCount = 0;
  
  if (!S.unlockedAchievements.FIRST_FLIGHT && S.totalHours >= 1.0) {
    unlockAchievement('FIRST_FLIGHT');
    unlockedCount++;
  }
  if (!S.unlockedAchievements.CHRONOS_STREAK && S.streak >= 7) {
    unlockAchievement('CHRONOS_STREAK');
    unlockedCount++;
  }
  const donePapers = (S.papers || []).filter(p => p.status === 'done').length;
  if (!S.unlockedAchievements.ACADEMIC_DRILL && donePapers >= 3) {
    unlockAchievement('ACADEMIC_DRILL');
    unlockedCount++;
  }
  if (!S.unlockedAchievements.DEEP_SPACE_FOCUS && S.focusStats && S.focusStats.maxSessionMins >= 50) {
    unlockAchievement('DEEP_SPACE_FOCUS');
    unlockedCount++;
  }
  const maxSkillVal = Math.max(...Object.values(S.skills || {dummy:0}));
  if (!S.unlockedAchievements.SYNAPTIC_OVERFLOW && maxSkillVal >= 100) {
    unlockAchievement('SYNAPTIC_OVERFLOW');
    unlockedCount++;
  }
  const all = getAllEthe();
  const allDone = all.length > 0 && all.every(e => e.done);
  if (!S.unlockedAchievements.FORCE_HARMONY && allDone) {
    unlockAchievement('FORCE_HARMONY');
    unlockedCount++;
  }
  var level = 0, cum = 0;
  for (var i = 0; i < LEVELS.length - 1; i++) { if (S.xp >= cum + LEVELS[i].next) { cum += LEVELS[i].next; level++; } else break; }
  if (!S.unlockedAchievements.ORACLE_ASCENT && (level + 1) >= 6) {
    unlockAchievement('ORACLE_ASCENT');
    unlockedCount++;
  }
  
  // Dynamic validation for new lifestyle achievements
  if (!S.unlockedAchievements.AQUAMAN) {
    const doubleSwam = (S.swimHistory || []).some(entry => entry.status === 'Swam' && entry.sessions && entry.sessions.length >= 2);
    if (doubleSwam) {
      unlockAchievement('AQUAMAN');
      unlockedCount++;
    }
  }
  if (!S.unlockedAchievements.POSEIDONS_LUNGS) {
    let totalSwims = 0;
    (S.swimHistory || []).forEach(e => { if (e.status === 'Swam' && e.sessions) totalSwims += e.sessions.length; });
    if (totalSwims >= 25) {
      unlockAchievement('POSEIDONS_LUNGS');
      unlockedCount++;
    }
  }
  if (!S.unlockedAchievements.DERMA_GLOW) {
    if (checkDermaGlow()) {
      unlockAchievement('DERMA_GLOW');
      unlockedCount++;
    }
  }
  if (!S.unlockedAchievements.HYDRO_CHAMP) {
    if (checkHydroChamp()) {
      unlockAchievement('HYDRO_CHAMP');
      unlockedCount++;
    }
  }
  
  if (unlockedCount > 0) {
    ss();
    render();
  }
}

function unlockAchievement(id) {
  if (!S.unlockedAchievements) S.unlockedAchievements = {};
  S.unlockedAchievements[id] = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const a = ACHIEVEMENTS.find(x => x.id === id);
  addLog('ok', 'achievement unlocked: [' + a.name.toUpperCase() + ']! rank index updated.');
  printTerm('<div class="tv-output-line ok">[SYSTEM_ALERT] ACHIEVEMENT UNLOCKED: ' + a.name + '<br>' + a.badge + '</div>');
  triggerScreenGlitch();
}

function triggerScreenGlitch() {
  const main = document.getElementById('main-app');
  if (main) {
    main.classList.add('screen-glitch');
    setTimeout(() => main.classList.remove('screen-glitch'), 450);
  }
}

function renderAchievements() {
  const shelf = document.getElementById('achievement-shelf');
  if (!shelf) return;
  shelf.innerHTML = '';
  if (!S.unlockedAchievements) S.unlockedAchievements = {};

  ACHIEVEMENTS.forEach(a => {
    const unlockedDate = S.unlockedAchievements[a.id];
    const isUnlocked = !!unlockedDate;
    const card = document.createElement('div');
    card.className = 'achievement-card' + (isUnlocked ? ' unlocked' : '');
    
    const aName = a.name;
    const aDesc = a.desc;
    const dateText = isUnlocked 
      ? ('✓ Unlocked ' + unlockedDate)
      : ('// LOCKED');

    card.innerHTML = '<span class="ac-badge">' + a.badge + '</span>' +
      '<div class="ac-name">' + aName + '</div>' +
      '<div class="ac-desc">' + aDesc + '</div>' +
      '<div class="ac-date">' + dateText + '</div>';
    shelf.appendChild(card);
  });
}

// === KNOWLEDGE MATRIX DETAILS ===
const SKILL_DESCS = {
  linear_algebra: "Foundational vectors, matrices, eigenvalues, eigenvectors, SVD, and projections. Crucial for understanding embeddings and weights.",
  mv_calc: "Partial derivatives, gradients, Jacobians, Hessians, and chain rule. The absolute core of neural network training backpropagation.",
  probability: "Probability distributions, expectations, maximum likelihood estimation (MLE), Bayes' theorem. Vital for understanding token probability distribution, cross-entropy, and entropy.",
  optimization: "Gradient descent variations (Adam, SGD), loss landscapes, learning rate scheduling, convergence, and convex optimization.",
  backprop: "Automatic differentiation graphs, forward/backward passes, Jacobian-vector products, and backpropagation optimization.",
  attention: "Scale dot-product attention, query/key/value projection mathematics, multi-head attention combinations, scaling factor justifications.",
  transformer: "Encoder-Decoder structure, positional encodings, layer normalization mechanics, residual connections, and forward networks.",
  lora: "Low-rank updates, mathematical parameter reductions, weight adaptation, adapters, and scaling metrics."
};

window.selectedSkillKey = null;
function selectSkillNode(key) {
  window.selectedSkillKey = key;
  document.querySelectorAll('.skill-node').forEach(node => {
    node.classList.toggle('selected', node.dataset.skill === key);
  });
  
  const title = document.getElementById('sh-title');
  const pct = document.getElementById('sh-pct');
  const desc = document.getElementById('sh-desc');
  const row = document.getElementById('sh-action-row');
  
  const s = SKILLS.find(x => x.key === key);
  if (s) {
    title.textContent = s.name.toUpperCase();
    title.style.color = s.color;
    const v = S.skills[key] || 0;
    pct.textContent = v + '%';
    pct.style.color = s.color;
    desc.textContent = (SKILL_DESCS[key] || '');
    if (row) row.style.display = 'flex';
  }
}

// === FOCUS TIMER SYSTEM ===
let focusInterval = null;
let focusSession = {
  duration: 1500,
  remaining: 1500,
  active: false,
  paused: false,
  type: 'focus',
  totalDuration: 1500
};

function toggleFocusSession() {
  if (focusSession.active) {
    pauseFocusSession();
  } else {
    startFocusSession();
  }
}

function startFocusSession() {
  if (focusSession.active) return;
  focusSession.active = true;
  focusSession.paused = false;
  focusLog('Focus session engaged: ' + (focusSession.remaining / 60).toFixed(1) + 'm left.');
  updateFocusUI();
  
  focusInterval = setInterval(() => {
    focusSession.remaining--;
    if (focusSession.remaining <= 0) {
      completeFocusSession();
    } else {
      updateFocusUI();
    }
  }, 1000);
}

function pauseFocusSession() {
  if (!focusSession.active) return;
  focusSession.active = false;
  focusSession.paused = true;
  clearInterval(focusInterval);
  focusLog('Focus session paused. Uptime system frozen.');
  updateFocusUI();
}

function abortFocusSession() {
  focusSession.active = false;
  focusSession.paused = false;
  focusSession.remaining = focusSession.duration;
  clearInterval(focusInterval);
  focusLog('Focus session aborted. System reset.');
  updateFocusUI();
}

function completeFocusSession() {
  clearInterval(focusInterval);
  focusSession.active = false;
  focusSession.paused = false;
  
  const mins = focusSession.totalDuration / 60;
  const hrs = mins / 60;
  S.totalHours += hrs;
  S.weekHours += hrs;
  
  const isDeepSync = typeof compileCognitiveVector !== 'undefined' && compileCognitiveVector().state === 'DEEP_SYNC';
  const isLocked = typeof isGroupXpLocked === 'function' && isGroupXpLocked('build');
  const baseXp = Math.round(mins * 0.8);
  const xpGained = isLocked ? 0 : (isDeepSync ? Math.round(baseXp * 1.2) : baseXp);
  S.xp += xpGained;
  S.xpToday += xpGained;
  
  if (!S.focusStats) S.focusStats = { sessions: 0, totalMins: 0, maxSessionMins: 0 };
  S.focusStats.sessions++;
  S.focusStats.totalMins += mins;
  S.focusStats.maxSessionMins = Math.max(S.focusStats.maxSessionMins || 0, mins);
  
  if (isLocked) {
    focusLog('Focus session COMPLETE! +0 XP (ECRE XP LOCK ACTIVE!)');
    addLog('warning', `[ECRE XP LOCK] focus session completed -- +0 XP (open ECRE question unanswered!)`);
  } else {
    focusLog('Focus session COMPLETE! +' + xpGained + ' XP' + (isDeepSync ? ' (Flow Buff Active!)' : '') + '. logged ' + hrs.toFixed(1) + 'h.');
    addLog('ok', 'focus session completed (' + mins + 'm) +' + xpGained + ' xp' + (isDeepSync ? ' (Flow Buff)' : ''));
  }
  
  if (typeof triggerECRECheck === 'function') triggerECRECheck('focus');
  if (typeof pushECREUnpromptedAppraisal === 'function') {
    pushECREUnpromptedAppraisal('focus_complete');
  }
  
  // Custom synth alarm and PWA push alert for focus session completion
  playSynthSound('cyber_pulse');
  triggerNotification("ethos.init // FOCUS COMPLETE", `Mathematical focus session finished (+${xpGained} XP).`);
  
  window.flowerGlowActive = true;
  setTimeout(() => { window.flowerGlowActive = false; }, 20000);
  
  checkAchievements();
  ss();
  render();
  triggerScreenGlitch();
  
  focusSession.remaining = focusSession.duration;
  updateFocusUI();
}

function setFocusDuration(mins, type) {
  if (focusSession.active) return;
  focusSession.duration = mins * 60;
  focusSession.remaining = mins * 60;
  focusSession.totalDuration = mins * 60;
  focusSession.type = type;
  focusSession.paused = false;
  
  document.querySelectorAll('.fhud-durations button').forEach(btn => {
    btn.classList.remove('active');
  });
  const el = document.getElementById('fd-' + mins);
  if (el) el.classList.add('active');

  focusLog('set focus mode: ' + mins + 'm (' + type + ')');
  updateFocusUI();
}

function updateFocusUI() {
  const clock = document.getElementById('focus-clock-time');
  const bar = document.getElementById('focus-progress-bar');
  const pctText = document.getElementById('focus-progress-pct');
  const status = document.getElementById('focus-status-tag');
  const typeText = document.getElementById('focus-session-type');
  const startBtn = document.getElementById('focus-start-btn');
  const pauseBtn = document.getElementById('focus-pause-btn');
  const abortBtn = document.getElementById('focus-abort-btn');
  
  if (!clock) return;

  const m = Math.floor(focusSession.remaining / 60);
  const s = focusSession.remaining % 60;
  clock.textContent = (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
  
  const pct = focusSession.totalDuration > 0 ? Math.round(focusSession.remaining / focusSession.totalDuration * 100) : 0;
  if (bar) bar.style.width = pct + '%';
  if (pctText) pctText.textContent = pct + ('% ACTIVE');

  if (focusSession.active) {
    status.textContent = focusSession.type === 'focus' 
      ? ('FOCUS_ENGAGED') 
      : ('REST_ENGAGED');
    status.className = 'fhud-status-tag blinking';
    typeText.textContent = focusSession.type === 'focus' 
      ? ('// TASK_FOCUS') 
      : ('// REST_BREAK');
    startBtn.style.display = 'none';
    pauseBtn.style.display = 'inline-block';
    abortBtn.style.display = 'inline-block';
    document.title = '[' + clock.textContent + '] focus.init';
  } else if (focusSession.paused) {
    status.textContent = 'SYSTEM_PAUSED';
    status.className = 'fhud-status-tag';
    startBtn.style.display = 'inline-block';
    startBtn.textContent = 'resume --session';
    pauseBtn.style.display = 'none';
    abortBtn.style.display = 'inline-block';
    document.title = 'paused focus.init';
  } else {
    status.textContent = 'SYSTEM_IDLE';
    status.className = 'fhud-status-tag';
    typeText.textContent = '// TASK_IDLE';
    startBtn.style.display = 'inline-block';
    startBtn.textContent = 'start --session';
    pauseBtn.style.display = 'none';
    abortBtn.style.display = 'none';
    document.title = 'ethos.init — LLM Math Mastery Tracker';
  }

  const utcEl = document.getElementById('focus-utc');
  if (utcEl) utcEl.textContent = new Date().toTimeString().slice(0, 8) + ' UTC';
}

function focusLog(msg) {
  const logTerm = document.getElementById('focus-log-terminal');
  if (!logTerm) return;
  const ts = new Date().toTimeString().slice(3, 8);
  const div = document.createElement('div');
  div.className = 'fl-line';
  div.innerHTML = '<span class="fl-ts">[' + ts + ']</span> ' + msg;
  logTerm.appendChild(div);
  scrollToBottom(logTerm, true);
}

function renderPapers() {
  var list = document.getElementById('paper-list'); if (!list) return; list.innerHTML = '';
  S.papers.forEach(function(p) {
    var el = document.createElement('div'); el.className = 'paper-item';
    const queuedText = 'queued';
    const readingText = 'reading';
    const doneText = 'done';
    const rmText = 'rm';
    el.innerHTML = '<div class="paper-item-header"><div class="paper-name">' + escapeHtml(p.name) + '</div><div class="paper-controls"><select class="terminal-input" style="width:90px;padding:3px 6px;font-size:11px" data-pid="' + p.id + '"><option value="queued"' + (p.status === 'queued' ? ' selected' : '') + '>' + queuedText + '</option><option value="reading"' + (p.status === 'reading' ? ' selected' : '') + '>' + readingText + '</option><option value="done"' + (p.status === 'done' ? ' selected' : '') + '>' + doneText + '</option></select><button class="ethos-rm" data-pid="' + p.id + '">' + rmText + '</button></div></div>';
    el.querySelector('select').onchange = function() { updatePaperStatus(p.id, this.value); };
    el.querySelector('.ethos-rm').onclick = function() { removePaper(p.id); };
    list.appendChild(el);
  });
}

function renderLog() {
  var el = document.getElementById('main-log'); if (!el) return;
  var recent = (S.logs || []).slice(-40).reverse();
  if (recent.length === 0) { 
    const welcome = 'ethos.init started. welcome back.';
    const typeLabel = 'info';
    el.innerHTML = '<div class="log-line"><span class="ts">--:--:--</span><span class="info">[' + typeLabel + ']</span> ' + welcome + '</div>'; 
    return; 
  }
  el.innerHTML = recent.map(function(l) {
    let msg = l.msg;
    let typeText = l.type;
    
    return '<div class="log-line"><span class="ts">' + l.ts + '</span> <span class="' + l.type + '">[' + typeText + ']</span> ' + escapeHtml(msg) + '</div>'; 
  }).join('');
}

function renderPhases() {
  var days = Math.min((S.logs || []).length + S.streak, 168);
  var p1 = document.getElementById('phase1-pct'), p2 = document.getElementById('phase2-pct'), p3 = document.getElementById('phase3-pct');
  if (p1) p1.textContent = Math.min(100, Math.round(days / 42 * 100)) + '%';
  if (p2) p2.textContent = days > 42 ? Math.min(100, Math.round((days - 42) / 56 * 100)) + '%' : '\u2014';
  if (p3) p3.textContent = days > 98 ? Math.min(100, Math.round((days - 98) / 70 * 100)) + '%' : '\u2014';
}

function renderThemes() {
  var dropdown = document.getElementById('theme-dropdown'), label = document.getElementById('theme-picker-label'), btn = document.getElementById('theme-picker-btn'), wrap = document.getElementById('theme-picker-wrap');
  if (!dropdown) return;
  var cur = THEMES.find(function(t) { return t.id === S.theme; }) || THEMES[0];
  label.textContent = cur.name; dropdown.innerHTML = '';
  THEMES.forEach(function(t) {
    var opt = document.createElement('div'); opt.className = 'theme-option' + (S.theme === t.id ? ' active' : '');
    opt.innerHTML = '<span class="t-dot" style="background:' + t.color + '"></span><span>' + t.name + '</span>' + (S.theme === t.id ? '<span class="t-check">\u2713</span>' : '');
    opt.onclick = function(ev) { ev.stopPropagation(); S.theme = t.id; document.documentElement.setAttribute('data-theme', t.id === 'default' ? '' : t.id); ss(); dropdown.classList.add('hidden'); renderThemes(); };
    dropdown.appendChild(opt);
  });
  btn.onclick = function(ev) { ev.stopPropagation(); dropdown.classList.toggle('hidden'); };
  document.addEventListener('click', function(ev) { if (wrap && !wrap.contains(ev.target)) dropdown.classList.add('hidden'); });
}

function isGroupXpLocked(groupId) {
  if (!S.ecreMemory || !S.ecreMemory.openQuestions) return false;
  const currentSession = S.ecreMemory.sessionCount || 0;
  return S.ecreMemory.openQuestions.some(q => {
    if (q.answer !== null) return false;
    const diff = currentSession - q.sessionAsked;
    if (diff >= 2) {
      // If the question specifies a group, lock that group. If not, lock all groups!
      return !q.group || q.group === 'any' || q.group === groupId;
    }
    return false;
  });
}

// === ACTIONS ===
function toggleEthos(rIdx, eId) {
  var r = S.routines[rIdx], e = r.ethe.find(function(x) { return x.id === eId; });
  if (!e) return;
  e.done = !e.done;
  if (!S.history) S.history = {};
  if (!S.history[S.activeDate]) S.history[S.activeDate] = {};
  S.history[S.activeDate][e.id] = e.done;

  const isDeepSync = typeof compileCognitiveVector !== 'undefined' && compileCognitiveVector().state === 'DEEP_SYNC';
  const isLocked = isGroupXpLocked(e.groupId);
  const xpGained = isLocked ? 0 : (isDeepSync ? Math.round(e.xp * 1.2) : e.xp);

  if (e.done) {
    S.xp += xpGained;
    if (S.activeDate === TODAY) S.xpToday += xpGained;
    e.streak++;
    
    if (isLocked) {
      addLog('warning', `[ECRE XP LOCK] marked ethos: "${e.name}" -- +0 XP (open diagnostic question unanswered for 2+ sessions!)`);
    } else {
      addLog('ok', 'ethos marked: "' + e.name + '" +' + xpGained + ' xp' + (isDeepSync ? ' (Flow Buff)' : ''));
    }
    
    var all = getAllEthe();
    if (all.every(function(x) { return x.done; }) && all.length > 0) {
      if (S.activeDate === TODAY) { S.streak++; addContrib(4); }
      addLog('ok', 'all \u1F74\u03B8\u03B7 done! streak: ' + S.streak + ' days');
    } else {
      if (S.activeDate === TODAY) addContrib(Math.min(3, Math.floor(all.filter(function(x) { return x.done; }).length / all.length * 4)));
    }
    // Update group streak
    updateGroupStreaks();
  } else {
    S.xp = Math.max(0, S.xp - (isLocked ? e.xp : xpGained)); // adjust deduct safely
    if (S.activeDate === TODAY) S.xpToday = Math.max(0, S.xpToday - (isLocked ? e.xp : xpGained));
    e.streak = Math.max(0, e.streak - 1);
  }
  if (typeof triggerECRECheck === 'function') triggerECRECheck('habit');
  
  // ECRE push stats summary unprompted when habits change!
  if (typeof pushECREUnpromptedAppraisal === 'function') {
    pushECREUnpromptedAppraisal('habit_check');
  }
  
  ss(); render();
}

function updateGroupStreaks() {
  S.ethosGroups.forEach(function(g) {
    var groupEthe = getAllEthe().filter(function(e) { return e.groupId === g.id; });
    if (groupEthe.length > 0 && groupEthe.every(function(e) { return e.done; })) {
      g.streak++;
    }
  });
}

function removeEthosFromRoutine(rIdx, eId) {
  S.routines[rIdx].ethe = S.routines[rIdx].ethe.filter(function(e) { return e.id !== eId; });
  ss(); renderEtheTab(); renderTodayQuick(); renderStats();
}

function addPaper() {
  var input = document.getElementById('new-paper-input'), name = input.value.trim();
  if (!name) return;
  var status = document.getElementById('new-paper-status').value;
  S.papers.push({ id: Date.now(), name: name, status: status, note: '' });
  input.value = '';
  addLog('info', 'paper queued: "' + name + '"');
  ss(); render();
}

function removePaper(id) { S.papers = S.papers.filter(function(p) { return p.id !== id; }); ss(); render(); }

function updatePaperStatus(id, status) {
  var p = S.papers.find(function(x) { return x.id === id; });
  if (!p) return;
  var was = p.status; p.status = status;
  if (status === 'done' && was !== 'done') {
    const isDeepSync = typeof compileCognitiveVector !== 'undefined' && compileCognitiveVector().state === 'DEEP_SYNC';
    const xpGained = isDeepSync ? Math.round(50 * 1.2) : 50;
    S.xp += xpGained;
    S.xpToday += xpGained;
    addLog('ok', 'paper done: "' + p.name + '" +' + xpGained + ' xp' + (isDeepSync ? ' (Flow Buff)' : ''));
  }
  if (typeof triggerECRECheck === 'function') triggerECRECheck('paper');
  ss(); render();
}



function logHours() {
  var hrs = parseFloat(document.getElementById('hours-input').value);
  if (isNaN(hrs) || hrs <= 0) return;
  S.totalHours += hrs; S.weekHours += hrs;
  
  const isDeepSync = typeof compileCognitiveVector !== 'undefined' && compileCognitiveVector().state === 'DEEP_SYNC';
  const baseXp = Math.round(hrs * 20);
  const xpGained = isDeepSync ? Math.round(baseXp * 1.2) : baseXp;
  S.xp += xpGained; S.xpToday += xpGained;
  
  document.getElementById('hours-input').value = '';
  document.getElementById('hours-log-msg').textContent = '\u2713 logged ' + hrs + 'h \u2014 total: ' + (Math.round(S.totalHours * 10) / 10) + 'h';
  addLog('ok', hrs + 'h studied +' + xpGained + ' xp' + (isDeepSync ? ' (Flow Buff)' : ''));
  if (typeof triggerECRECheck === 'function') triggerECRECheck('study');
  addContrib(Math.min(4, Math.ceil(hrs / 0.75)));
  ss(); render();
}

function saveNote() { S.todayNote = document.getElementById('today-note').value; addLog('info', 'session note saved'); flash('note-saved'); ss(); }
function savePaperNote() { S.paperNote = document.getElementById('paper-note').value; addLog('info', 'paper insight saved'); flash('paper-note-saved'); ss(); }

function addManualLog() {
  var input = document.getElementById('manual-log-input'), msg = input.value.trim();
  if (!msg) return;
  addLog(document.getElementById('manual-log-type').value, msg);
  input.value = ''; ss(); render();
}

function resetAll() {
  if (confirm('erase ALL data? this cannot be undone.')) { localStorage.removeItem('mathInit_state'); localStorage.removeItem('mathInit'); location.reload(); }
}

function exportStateData() {
  try {
    const dataStr = JSON.stringify(S, null, 2);
    // 1. Copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(dataStr)
        .then(() => {
          addLog('ok', 'Data backup successfully copied to clipboard.');
          printTerm('Data backup successfully copied to clipboard.', 'ok');
        })
        .catch(err => {
          console.warn('Clipboard write failed:', err);
        });
    }

    // 2. Trigger file download
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", url);
    dlAnchorElem.setAttribute("download", `ethos_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(dlAnchorElem);
    dlAnchorElem.click();
    document.body.removeChild(dlAnchorElem);
    URL.revokeObjectURL(url);

    addLog('ok', 'Data backup exported successfully (JSON download initiated).');
    printTerm('Data backup exported successfully (JSON download initiated).', 'ok');
    printTerm('WARNING: Backup file contains sensitive variables (Gemini API key, custom sync keys). Store it securely.', 'warn');
  } catch (e) {
    console.error('Backup failed:', e);
    addLog('warn', 'Backup export encountered an error: ' + e.message);
    printTerm('Backup export failed: ' + e.message, 'err');
  }
}

function importStateData(rawString) {
  const errDisplay = document.getElementById('import-error-display');
  if (errDisplay) {
    errDisplay.style.display = 'none';
    errDisplay.textContent = '';
  }

  try {
    // 1. Size limit validation (cap at 500KB)
    if (rawString.length > 500 * 1024) {
      throw new Error('Backup payload size exceeds the maximum limit of 500KB.');
    }

    const parsed = JSON.parse(rawString.trim());
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Backup data must be a valid JSON object.');
    }
    
    // 2. Schema check for mandatory state fields
    const criticalKeys = ['routines', 'history', 'xp', 'streak'];
    const missingKeys = criticalKeys.filter(k => parsed[k] === undefined);
    if (missingKeys.length > 0) {
      throw new Error('Invalid backup schema. Missing keys: ' + missingKeys.join(', '));
    }

    // 3. Strict schema property validation & field stripping
    const VALID_KEYS = [
      'routines', 'ethosGroups', 'papers', 'logs', 'contrib', 'swimHistory', 
      'weightLogs', 'reminders', 'oracleHistory', 'history', 'skills', 
      'unlockedAchievements', 'notificationSettings', 'xp', 'streak', 
      'totalHours', 'weekHours', 'xpToday', 'activeDate', 'activeGroupFilter', 
      'weekOffset', 'todayOnlyToggle', 'todayNote', 'paperNote', 'ethosViewMode', 
      'protocolCollapsed', 'lastUpdated', 'authUsername', 'authEmail', 
      'geminiKey', 'customSyncKey', 'customSyncProxy', 'trilumaStartDate', 
      'waterLogs', 'ecreMemory'
    ];

    const cleanedState = {};
    VALID_KEYS.forEach(key => {
      if (parsed[key] !== undefined) {
        const val = parsed[key];
        if (['xp', 'streak', 'totalHours', 'weekHours', 'xpToday', 'weekOffset', 'lastUpdated'].includes(key)) {
          cleanedState[key] = typeof val === 'number' ? val : (parseInt(val) || 0);
        } else if (['todayOnlyToggle'].includes(key)) {
          cleanedState[key] = !!val;
        } else if (['activeDate', 'activeGroupFilter', 'todayNote', 'paperNote', 'ethosViewMode', 'authUsername', 'authEmail', 'geminiKey', 'customSyncKey', 'customSyncProxy', 'trilumaStartDate'].includes(key)) {
          cleanedState[key] = typeof val === 'string' ? val : '';
        } else if (['routines', 'ethosGroups', 'papers', 'logs', 'contrib', 'swimHistory', 'weightLogs', 'reminders', 'oracleHistory'].includes(key)) {
          cleanedState[key] = Array.isArray(val) ? val : [];
        } else if (['history', 'skills', 'unlockedAchievements', 'waterLogs', 'protocolCollapsed', 'notificationSettings', 'ecreMemory'].includes(key)) {
          cleanedState[key] = (val && typeof val === 'object' && !Array.isArray(val)) ? val : {};
        }
      }
    });

    cleanedState.routines = cleanedState.routines || [];
    cleanedState.history = cleanedState.history || {};
    cleanedState.xp = cleanedState.xp || 0;
    cleanedState.streak = cleanedState.streak || 0;

    // Deep sanitize array structures
    sanitizeStateArrays(cleanedState);
    S = cleanedState;
    sanitizeStateArrays(S);
    ss(false); // save to localStorage and sync to Firebase

    addLog('ok', 'System successfully restored from backup.');
    printTerm('System successfully restored from backup.', 'ok');

    // Show visual confirmation on modal
    const confirmBtn = document.getElementById('import-confirm-btn');
    if (confirmBtn) {
      confirmBtn.textContent = 'RESTORED SUCCESSFULLY!';
      confirmBtn.style.backgroundColor = 'var(--accent)';
      confirmBtn.style.color = 'var(--bg)';
    }

    setTimeout(() => {
      location.reload();
    }, 1000);

    return true;
  } catch (e) {
    console.error('Import failed:', e);
    if (errDisplay) {
      errDisplay.style.display = 'block';
      errDisplay.textContent = '// ERROR: ' + e.message;
    }
    printTerm('Import failed: ' + e.message, 'err');
    return false;
  }
}

function flash(id) { var el = document.getElementById(id); if (!el) return; el.style.display = 'inline'; setTimeout(function() { el.style.display = 'none'; }, 2000); }

let isLogging = false;
function addLog(type, msg) {
  if (isLogging) return;
  isLogging = true;
  try {
    var ts = new Date().toTimeString().slice(0, 8);
    if (!S.logs || !Array.isArray(S.logs)) {
      if (S.logs && typeof S.logs === 'object') {
        S.logs = Object.keys(S.logs)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(k => S.logs[k]);
      } else {
        S.logs = [];
      }
    }
    S.logs.push({ ts: ts, date: new Date().toDateString(), type: type, msg: msg });
    if (S.logs.length > 200) S.logs = S.logs.slice(-200);
    
    // Save locally and sync immediately to Firebase, then update the UI in real-time
    ss(false);
    renderLog();
  } catch (e) {
    console.error("Error inside addLog:", e);
  } finally {
    isLogging = false;
  }
}

function addContrib(level) {
  var key = new Date().toDateString();
  if (!S.contrib) S.contrib = [];
  var existing = S.contrib.find(function(c) { return c.date === key; });
  if (existing) existing.level = Math.max(existing.level, level);
  else S.contrib.push({ date: key, level: level });
  if (S.contrib.length > 200) S.contrib = S.contrib.slice(-200);
}

// === FLOWER ANIMATION ===
function startFlowerAnimation() {
  const canvas = document.getElementById('ascii-flower');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  const spacing = 5; // Slightly larger spacing for text
  const cols = 55;
  const rows = 80;
  canvas.width = cols * spacing;
  canvas.height = rows * spacing;
  
  const cx = 27;
  const cy = 25;
  
  function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
  }
  const rand = mulberry32(42);
  const points = [];
  
  function inLeaf(branchR, cx, side, angleDeg, len, wid, c, r) {
    let dr = r - branchR;
    let dc = c - cx;
    if (side < 0 && dc > 0) return false;
    if (side > 0 && dc < 0) return false;
    
    let dist = Math.sqrt(dc*dc + dr*dr);
    if (dist > len) return false;
    
    let angle = Math.atan2(dr, dc);
    let targetAngle = angleDeg * Math.PI / 180;
    
    let angleDiff = angle - targetAngle;
    angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
    
    let perpDist = Math.abs(dist * Math.sin(angleDiff));
    let maxWid = wid * Math.sin((dist / len) * Math.PI); 
    
    return perpDist <= maxWid;
  }
  
  for (let r = 0; r < rows; r++) {
    // Natural organic bend
    let staticCurve = Math.sin((rows - r) / 12) * 1.5 + Math.sin((rows - r) / 25) * 1.5;
    let localCx = cx + staticCurve;
    
    for (let c = 0; c < cols; c++) {
      let isPoint = false;
      let color = '#00ffcc';
      let appearTime = 0;
      let size = 1.0;
      let char = '.';
      
      let dx = c - localCx;
      let dy = r - cy;
      let dist = Math.sqrt(dx*dx + dy*dy);
      
      // Stem
      if (Math.abs(dx) < 1.2 && r >= cy) {
        if (r % 2 === 0) {
          isPoint = true;
          appearTime = 0.4 * (1 - ((r - cy) / (rows - cy)));
          char = rand() > 0.5 ? '|' : '¦';
        }
      }
      
      // Petals
      let angle = Math.atan2(dy, dx) + Math.PI/2;
      let petalFactor = Math.pow((Math.cos(5 * angle) + 1) / 2, 1.2);
      let petalDist = 3 + 16 * petalFactor;
      
      if (dist <= petalDist && r <= cy + 16) {
        let density = 1.0;
        if (dist > petalDist - 2) density = 0.5;
        if (dist > petalDist - 1) density = 0.2;
        
        if (rand() < density) {
          isPoint = true;
          if (dist < 3) { color = '#ffffff'; char = '@'; size = 1.2; }
          else if (dist < 6) { color = '#ffff88'; char = '#'; size = 1.1; }
          else if (dist < 11) { color = '#aaff00'; char = rand() > 0.5 ? '*' : 'x'; }
          else { color = '#00ffcc'; char = rand() > 0.5 ? '+' : ':'; size = 0.8; }
          appearTime = 0.4 + (dist / 22) * 0.4;
        }
      }
      
      // Leaves
      let isLeaf = false;
      let leafStart = 0;
      if (inLeaf(50, localCx, -1, 160, 22, 6, c, r)) { isLeaf = true; leafStart = 50; }
      if (inLeaf(62, localCx, 1, 20, 18, 5, c, r)) { isLeaf = true; leafStart = 62; }
      if (inLeaf(74, localCx, -1, 140, 15, 4, c, r)) { isLeaf = true; leafStart = 74; }
      
      if (isLeaf && !isPoint) {
        if (rand() < 0.4) {
          isPoint = true;
          color = rand() < 0.1 ? '#ffff88' : '#00ffcc';
          char = rand() < 0.4 ? ',' : (rand() < 0.5 ? '.' : '`');
          let stemTime = 0.4 * (1 - ((leafStart - cy) / (rows - cy)));
          appearTime = stemTime + Math.abs(dx) / 25 * 0.3 + rand() * 0.1;
          size = 0.8;
        }
      }
      
      // Floating particles
      if (!isPoint && rand() < 0.005 && dist < 35 && r < rows - 10) {
        isPoint = true;
        color = rand() < 0.2 ? '#ffff88' : '#00ffcc';
        char = rand() < 0.5 ? '*' : '.';
        appearTime = 0.5 + rand() * 0.4;
        size = 0.7;
      }
      
      if (isPoint) {
        points.push({ x: c * spacing, y: r * spacing, color, appearTime, size, char, currentChar: char });
      }
    }
  }
  
  let startTime = Date.now();
  const matrixStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const originY = rows * spacing;
  
  function draw() {
    let now = Date.now();
    let t = ((now - startTime) % 12000) / 12000; 
    
    let progress = 0;
    if (t < 0.3) progress = t / 0.3; 
    else if (t < 0.8) progress = 1; 
    else if (t < 0.9) progress = 1 - (t - 0.8) / 0.1; 
    else progress = 0; 
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let pulse = 1;
    if (progress === 1) {
      pulse = 1 + 0.1 * Math.sin((now - startTime) / 200);
    }
    
    if (window.flowerGlowActive) {
      pulse *= (1.4 + 0.25 * Math.sin(now / 80));
    } else if (focusSession && focusSession.active && focusSession.type === 'focus') {
      pulse *= (1.15 + 0.1 * Math.sin(now / 150));
    }
    
    // Wind sway (compound sine wave for organic movement)
    let tWind = now / 1500;
    if (window.flowerGlowActive) {
      tWind = now / 400;
    } else if (focusSession && focusSession.active && focusSession.type === 'focus') {
      tWind = now / 800;
    }
    
    let sway = Math.sin(tWind) * 0.035 + Math.sin(tWind * 1.4 + 1) * 0.02;
    if (window.flowerGlowActive) {
      sway *= 2.0;
    }
    
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < points.length; i++) {
      let p = points[i];
      if (progress > p.appearTime) {
        let localProgress = Math.min(1, (progress - p.appearTime) * 5); 
        
        let alpha = localProgress * pulse * p.size;
        if (p.size < 1 && Math.random() < 0.05) alpha *= 0.5; 
        
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.fillStyle = p.color;
        
        if ((p.char === '@' || p.char === '#') && Math.random() < 0.03) {
          p.currentChar = matrixStr[Math.floor(Math.random() * matrixStr.length)];
        }
        
        // Apply wind shear anchored at the bottom
        let dy = p.y - originY; 
        let swayOffset = dy * sway; 
        let finalX = p.x + swayOffset;
        
        ctx.fillText(p.currentChar, finalX, p.y);
      }
    }
    
    ctx.globalAlpha = 1.0;
    requestAnimationFrame(draw);
  }
  draw();
}

function startClock() {
  var el = document.getElementById('footer-time');
  if (!el) return;
  function tick() { var n = new Date(); el.textContent = n.toLocaleTimeString('en-GB') + ' \u00B7 ' + n.toDateString(); }
  tick(); setInterval(tick, 1000);
}
// === WEBGL SHADER ===
window.gl = null; window.shaderProgram = null; window.timeUniform = null; window.resUniform = null; window.colorUniform = null; window.animationFrameId = null;

window.initShader = function() {
  const canvas = document.getElementById('shader-bg');
  if (!canvas) return;
  window.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!window.gl) return;

  const vsSource = "attribute vec2 a_position; void main() { gl_Position = vec4(a_position, 0.0, 1.0); }";
  const fsSource = "precision mediump float; uniform float u_time; uniform vec2 u_resolution; uniform vec3 u_color; float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123); } float noise(vec2 st) { vec2 i = floor(st); vec2 f = fract(st); vec2 u = f * f * (3.0 - 2.0 * f); return mix( mix( random( i + vec2(0.0,0.0) ), random( i + vec2(1.0,0.0) ), u.x), mix( random( i + vec2(0.0,1.0) ), random( i + vec2(1.0,1.0) ), u.x), u.y); } void main() { vec2 uv = gl_FragCoord.xy / u_resolution.xy; uv = uv * 2.0 - 1.0; uv.x *= u_resolution.x / u_resolution.y; float c = cos(u_time * 0.1), s = sin(u_time * 0.1); uv = mat2(c, -s, s, c) * uv; float wave = sin(uv.y * 3.0 + u_time) * 0.2 + noise(uv * 5.0 - u_time * 0.5) * 0.3; float dist = abs(uv.x + wave); float glow = 0.02 / (dist + 0.001); float fade = max(0.0, 1.0 - length(uv) * 0.8); gl_FragColor = vec4(u_color * glow * fade, (glow * fade) * 0.8); }";

  function createShader(type, source) {
    const shader = window.gl.createShader(type);
    window.gl.shaderSource(shader, source);
    window.gl.compileShader(shader);
    return shader;
  }
  
  const vertexShader = createShader(window.gl.VERTEX_SHADER, vsSource);
  const fragmentShader = createShader(window.gl.FRAGMENT_SHADER, fsSource);
  
  window.shaderProgram = window.gl.createProgram();
  window.gl.attachShader(window.shaderProgram, vertexShader);
  window.gl.attachShader(window.shaderProgram, fragmentShader);
  window.gl.linkProgram(window.shaderProgram);
  window.gl.useProgram(window.shaderProgram);

  const positionBuffer = window.gl.createBuffer();
  window.gl.bindBuffer(window.gl.ARRAY_BUFFER, positionBuffer);
  window.gl.bufferData(window.gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), window.gl.STATIC_DRAW);
  
  const posLocation = window.gl.getAttribLocation(window.shaderProgram, 'a_position');
  window.gl.enableVertexAttribArray(posLocation);
  window.gl.vertexAttribPointer(posLocation, 2, window.gl.FLOAT, false, 0, 0);

  window.timeUniform = window.gl.getUniformLocation(window.shaderProgram, 'u_time');
  window.resUniform = window.gl.getUniformLocation(window.shaderProgram, 'u_resolution');
  window.colorUniform = window.gl.getUniformLocation(window.shaderProgram, 'u_color');
};

window.startShader = function() {
  if (!window.gl) window.initShader();
  if (!window.gl) return;
  const canvas = document.getElementById('shader-bg');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  window.gl.viewport(0, 0, canvas.width, canvas.height);
  
  const style = getComputedStyle(document.body);
  const rawColor = style.getPropertyValue('--accent').trim();
  let r = 0, g = 1, b = 0.5;
  if (rawColor.startsWith('#') && rawColor.length === 7) {
    const hex = rawColor.replace('#', '');
    r = parseInt(hex.substring(0,2), 16) / 255;
    g = parseInt(hex.substring(2,4), 16) / 255;
    b = parseInt(hex.substring(4,6), 16) / 255;
  }
  
  function render(time) {
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      window.gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.gl.uniform1f(window.timeUniform, time * 0.001);
    window.gl.uniform2f(window.resUniform, canvas.width, canvas.height);
    window.gl.uniform3f(window.colorUniform, r, g, b);
    
    window.gl.clearColor(0, 0, 0, 0);
    window.gl.clear(window.gl.COLOR_BUFFER_BIT);
    window.gl.drawArrays(window.gl.TRIANGLES, 0, 6);
    window.animationFrameId = requestAnimationFrame(render);
  }
  window.animationFrameId = requestAnimationFrame(render);
};

window.stopShader = function() {
  if (window.animationFrameId) cancelAnimationFrame(window.animationFrameId);
};

// === LIFESTYLE EXTENSION HELPERS ===
function renderExpectations() {
  const container = document.getElementById('expectations-card-container');
  if (!container) return;
  const activeDateObj = new Date(S.activeDate);
  const day = activeDateObj.getDay();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[day];
  
  let study = 'REST';
  let build = 'REST';
  let body = 'REST';
  let mind = 'REST';
  
  if (day === 1) {
    study = '📖 Spaced Repetition & Math Derivation';
    build = '💻 Core Coding / NumPy block';
    body = '💪 Upper Body Strength (60m)';
    mind = '📓 Evening Review & Journal';
  } else if (day === 2) {
    study = '📖 Core Research Paper Reading';
    build = '💻 Feature Development & Debug';
    body = '🏃 Cardio / Conditioning (60m)';
    mind = '📓 Spaced Repetition Summary';
  } else if (day === 3) {
    study = '📖 Math Proof Derivation';
    build = '💻 Refactoring & Unit Tests';
    body = '💪 Core & Flexibility Session';
    mind = '📓 Weak Spot Analysis';
  } else if (day === 4) {
    study = '📖 Review & Active Recall';
    build = '💻 API & Backend Integration';
    body = '🏃 Active Recovery / Mobility';
    mind = '📓 Plan Next Sprint';
  } else if (day === 5) {
    study = '📖 Advanced Theory Exploration';
    build = '💻 System Integration & Push';
    body = '💪 Full Body Strength (60m)';
    mind = '📓 Weekly Retrospective';
  } else if (day === 6) {
    study = '📖 Technical writing / blogging';
    build = '💻 Hobby Project / Exploration';
    body = '🏃 Outdoor Cardio / Swim (90m)';
    mind = '📓 Free Reflection';
  } else if (day === 0) {
    study = 'REST';
    build = 'REST';
    body = '🧘 Active Rest & Recovery';
    mind = '📓 Weekly Reset & Goal Setting';
  }
  
  container.innerHTML = `
    <div style="background:var(--bg2); border:1px solid var(--border); border-radius:4px; padding:12px; font-size:12px;">
      <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px dashed var(--border2); padding-bottom:6px;">
        <span style="font-weight:700; color:var(--accent);">// EXPECTATIONS FOR ${dayName.toUpperCase()}</span>
        <span style="color:var(--text-dim); font-size:11px;">[ activeDate ]</span>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px 16px;">
        <div><span style="color:var(--text-faint)">📖 STUDY:</span> <span style="color:${study === 'REST' ? 'var(--text-dim)' : 'var(--accent)'}">${study}</span></div>
        <div><span style="color:var(--text-faint)">💻 BUILD:</span> <span style="color:${build === 'REST' ? 'var(--text-dim)' : 'var(--amber)'}">${build}</span></div>
        <div><span style="color:var(--text-faint)">🏋️ BODY:</span> <span style="color:var(--text)">${body}</span></div>
        <div><span style="color:var(--text-faint)">🧠 MIND:</span> <span style="color:var(--text)">${mind}</span></div>
      </div>
    </div>
  `;
}

function changeWaterIntake(rIdx, eId, delta) {
  if (!S.waterLogs) S.waterLogs = {};
  const current = S.waterLogs[S.activeDate] || 0;
  const next = Math.max(0, Math.min(6.0, current + delta));
  S.waterLogs[S.activeDate] = next;
  
  const r = S.routines[rIdx];
  const e = r.ethe.find(x => x.id === eId);
  if (e) {
    const wasDone = e.done;
    const isDoneNow = next >= 3.5;
    
    if (wasDone !== isDoneNow) {
      e.done = isDoneNow;
      if (!S.history) S.history = {};
      if (!S.history[S.activeDate]) S.history[S.activeDate] = {};
      S.history[S.activeDate][e.id] = isDoneNow;
      
      if (isDoneNow) {
        S.xp += e.xp;
        if (S.activeDate === TODAY) S.xpToday += e.xp;
        e.streak++;
        addLog('ok', `water target achieved: ${next.toFixed(1)}L! +${e.xp} xp`);
        updateGroupStreaks();
      } else {
        S.xp = Math.max(0, S.xp - e.xp);
        if (S.activeDate === TODAY) S.xpToday = Math.max(0, S.xpToday - e.xp);
        e.streak = Math.max(0, e.streak - 1);
        addLog('warn', `water intake dropped below target: ${next.toFixed(1)}L`);
      }
      checkAchievements();
    }
  }
  ss();
  render();
}

function renderSwimTab() {
  const history = S.swimHistory || [];
  let totalSessions = 0, totalSwamDays = 0, missedDays = 0, doubleSessions = 0, totalDuration = 0, scheduledDays = 0;
  let totalDistance = 0, totalCalories = 0;
  
  history.forEach(entry => {
    const norm = normalizeDateToISO(entry.date);
    const [yr, mo, dy] = norm.split('-').map(Number);
    const dateObj = new Date(yr, mo - 1, dy);
    const dayOfWeek = dateObj.getDay();
    const isWednesday = dayOfWeek === 3;
    
    if (entry.status === 'Swam' && entry.sessions && entry.sessions.length > 0) {
      totalSwamDays++;
      totalSessions += entry.sessions.length;
      if (entry.sessions.length >= 2) doubleSessions++;
      entry.sessions.forEach(s => {
        totalDuration += parseInt(s.duration) || 0;
        totalDistance += parseInt(s.distance) || 0;
        totalCalories += parseInt(s.calories) || Math.round((parseInt(s.duration) || 0) * 9);
      });
      scheduledDays++;
    } else {
      if (!isWednesday) {
        missedDays++;
        scheduledDays++;
      }
    }
  });
  
  const rate = scheduledDays > 0 ? Math.round((totalSwamDays / scheduledDays) * 100) : 0;
  
  // Calculate Streaks (compliance-based, rest days maintain & increment streak)
  const sortedChron = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
  let currentStreak = 0;
  let maxStreak = 0;
  
  sortedChron.forEach(entry => {
    const norm = normalizeDateToISO(entry.date);
    const [yr, mo, dy] = norm.split('-').map(Number);
    const dateObj = new Date(yr, mo - 1, dy);
    const dayOfWeek = dateObj.getDay();
    const isWednesday = dayOfWeek === 3;
    const isSwam = entry.status === 'Swam' && entry.sessions && entry.sessions.length > 0;
    
    if (isSwam) {
      currentStreak++;
    } else if (isWednesday) {
      if (currentStreak > 0) {
        currentStreak++; // Wednesday rest day maintains and increments compliance streak
      }
    } else {
      currentStreak = 0;
    }
    maxStreak = Math.max(maxStreak, currentStreak);
  });
  
  if (document.getElementById('swim-stat-total')) document.getElementById('swim-stat-total').textContent = totalSessions;
  if (document.getElementById('swim-stat-days')) document.getElementById('swim-stat-days').textContent = totalSwamDays;
  if (document.getElementById('swim-stat-missed')) document.getElementById('swim-stat-missed').textContent = missedDays;
  if (document.getElementById('swim-stat-double')) document.getElementById('swim-stat-double').textContent = doubleSessions;
  if (document.getElementById('swim-stat-rate')) document.getElementById('swim-stat-rate').textContent = rate + '%';
  if (document.getElementById('swim-stat-duration')) document.getElementById('swim-stat-duration').textContent = totalDuration;
  if (document.getElementById('swim-stat-distance')) document.getElementById('swim-stat-distance').textContent = (totalDistance / 1000).toFixed(2);
  if (document.getElementById('swim-stat-calories')) document.getElementById('swim-stat-calories').textContent = totalCalories;
  if (document.getElementById('swim-stat-streak')) document.getElementById('swim-stat-streak').textContent = currentStreak;
  if (document.getElementById('swim-stat-streak-max')) document.getElementById('swim-stat-streak-max').textContent = maxStreak;
  
  const container = document.getElementById('swim-timeline-container');
  if (!container) return;
  container.innerHTML = '';
  
  let sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
  const q = (S.swimSearchQuery || '').toLowerCase();
  
  sortedHistory = sortedHistory.filter(entry => {
    if (S.swimFilter === 'swam' && entry.status !== 'Swam') return false;
    if (S.swimFilter === 'missed' && entry.status !== 'Missed') return false;
    if (q) {
      const matchDate = entry.date.toLowerCase().includes(q);
      const matchComment = entry.sessions ? entry.sessions.some(s => (s.comment || '').toLowerCase().includes(q)) : false;
      const matchTime = entry.sessions ? entry.sessions.some(s => (s.time || '').toLowerCase().includes(q)) : false;
      return matchDate || matchComment || matchTime;
    }
    return true;
  });
  
  if (sortedHistory.length === 0) {
    container.innerHTML = '<div style="color:var(--text-faint); font-size:12px; padding:16px; text-align:center;">// NO SWIM LOG RECORDS MATCHING SEARCH / FILTER CRITERIA</div>';
    return;
  }
  
  sortedHistory.forEach(entry => {
    const row = document.createElement('div');
    row.className = 'swim-timeline-row';
    const isSwam = entry.status === 'Swam' && entry.sessions && entry.sessions.length > 0;
    
    const norm = normalizeDateToISO(entry.date);
    const [yr, mo, dy] = norm.split('-').map(Number);
    const dateObj = new Date(yr, mo - 1, dy);
    const dayOfWeek = dateObj.getDay();
    const isWednesday = dayOfWeek === 3;
    
    const badgeClass = isSwam ? 'swim-badge swam' : (isWednesday ? 'swim-badge rest' : 'swim-badge missed');
    const badgeText = isSwam 
      ? (entry.sessions.length >= 2 ? ('double swam') : ('swam')) 
      : (isWednesday ? ('scheduled rest') : ('missed'));
    
    let detailsHtml = '';
    if (isSwam) {
      const sessionsText = entry.sessions.map(s => {
        let statsStr = `${s.duration}m`;
        if (s.laps !== undefined && s.laps > 0) {
          const distKm = ((s.distance || 0) / 1000).toFixed(2) + 'km';
          statsStr += ` | ${s.laps} laps | ${distKm} | ${s.calories} kcal`;
        } else {
          const estCal = s.calories || Math.round(s.duration * 9);
          statsStr += ` | ~${estCal} kcal`;
        }
        return `• ${s.time} (${statsStr})`;
      }).join('<br>');
      const commentsText = entry.sessions.map(s => s.comment ? `// ${s.comment}` : '').filter(x => x).join('<br>');
      detailsHtml = `
        <div class="swim-sessions-txt" style="margin-top:2px;">${sessionsText}</div>
        ${commentsText ? `<div class="swim-comment-txt" style="margin-top:2px; color:var(--text-faint);">${commentsText}</div>` : ''}
      `;
    } else {
      detailsHtml = `<div class="swim-comment-txt" style="margin-top:2px;">${isWednesday ? ('// scheduled rest day') : ('// rest day or missed session')}</div>`;
    }
    
    const dateFormatted = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase();
    row.innerHTML = `
      <div class="swim-info-col" style="margin-left:0;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="${badgeClass}">${badgeText}</span>
          <span class="swim-date-txt">${dateFormatted}</span>
        </div>
        ${detailsHtml}
      </div>
      <div class="swim-action-col">
        <button class="ethos-rm" data-date="${entry.date}">${'rm'}</button>
      </div>
    `;
    row.querySelector('.ethos-rm').onclick = () => removeSwimDay(entry.date);
    container.appendChild(row);
  });
}

function normalizeDateToISO(dateInput) {
  if (!dateInput) return '';
  if (dateInput instanceof Date) {
    const yr = dateInput.getFullYear();
    const mo = String(dateInput.getMonth() + 1).padStart(2, '0');
    const dy = String(dateInput.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${dy}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    const today = new Date();
    const yr = today.getFullYear();
    const mo = String(today.getMonth() + 1).padStart(2, '0');
    const dy = String(today.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${dy}`;
  }
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${dy}`;
}

function logSwimSessionProgrammatic(date, time, duration, comment, laps, distance, calories) {
  if (!date) return;
  date = normalizeDateToISO(date);
  if (!S.swimHistory) S.swimHistory = [];
  let entry = S.swimHistory.find(x => x.date === date);
  const isSwamLog = time && duration > 0;
  
  if (isSwamLog) {
    const sessionObj = { time, duration, comment };
    if (laps !== undefined && laps > 0) {
      sessionObj.laps = laps;
      sessionObj.distance = distance || (laps * 50);
      sessionObj.calories = calories || (duration * 9);
    } else if (calories !== undefined) {
      sessionObj.calories = calories;
    }
    
    if (entry) {
      if (entry.status === 'Missed') {
        entry.status = 'Swam';
        entry.sessions = [sessionObj];
      } else {
        entry.sessions.push(sessionObj);
      }
    } else {
      entry = { date, status: 'Swam', sessions: [sessionObj] };
      S.swimHistory.push(entry);
    }
    
    const isLocked = typeof isGroupXpLocked === 'function' && isGroupXpLocked('body');
    const xpGained = isLocked ? 0 : 30;
    S.xp += xpGained;
    if (date === TODAY) S.xpToday += xpGained;
    
    if (isLocked) {
      addLog('warning', `[ECRE XP LOCK] swim logged: ${duration} mins on ${date} -- +0 XP (open question unanswered!)`);
    } else {
      addLog('ok', `swim logged: ${duration} mins on ${date}. +${xpGained} xp`);
    }
    
    // Auto-complete swim ethos (id 303)
    const historyDateKey = new Date(date + 'T00:00:00').toDateString();
    S.routines.forEach((r, rIdx) => {
      const e = r.ethe.find(x => Number(x.id) === 303);
      if (e) {
        if (!S.history[historyDateKey]) S.history[historyDateKey] = {};
        if (!S.history[historyDateKey][e.id]) {
          S.history[historyDateKey][e.id] = true;
          if (historyDateKey === S.activeDate) e.done = true;
        }
      }
    });
  } else {
    if (entry) {
      entry.status = 'Missed';
      entry.sessions = [];
    } else {
      entry = { date, status: 'Missed', sessions: [] };
      S.swimHistory.push(entry);
    }
    addLog('warn', `swim marked as rest/missed on ${date}`);
  }
  
  if (typeof pushECREUnpromptedAppraisal === 'function') {
    pushECREUnpromptedAppraisal('swim_logged');
  }
  
  checkAchievements();
  ss();
  render();
}

function logSwimSession() {
  const dateInput = document.getElementById('swim-input-date');
  const timeInput = document.getElementById('swim-input-time');
  const durInput = document.getElementById('swim-input-duration');
  const commentInput = document.getElementById('swim-input-comment');
  const lapsInput = document.getElementById('swim-input-laps');
  
  const date = dateInput.value;
  if (!date) return;
  
  const time = timeInput.value.trim();
  const duration = parseInt(durInput.value) || 0;
  const comment = commentInput.value.trim();
  const laps = lapsInput ? parseInt(lapsInput.value) || 0 : 0;
  
  let distance = undefined;
  let calories = undefined;
  if (laps > 0) {
    distance = laps * 50;
    calories = duration * 9;
  }
  
  logSwimSessionProgrammatic(date, time, duration, comment, laps, distance, calories);
  
  timeInput.value = '';
  durInput.value = '';
  commentInput.value = '';
  if (lapsInput) lapsInput.value = '';
}

function removeSwimDay(date) {
  if (confirm(`delete swim log for ${date}?`)) {
    if (!S.swimHistory) return;
    const entry = S.swimHistory.find(x => x.date === date);
    if (entry && entry.status === 'Swam') {
      const numSessions = entry.sessions.length;
      S.xp = Math.max(0, S.xp - (30 * numSessions));
      if (date === TODAY) S.xpToday = Math.max(0, S.xpToday - (30 * numSessions));
      addLog('info', `deleted swim log for ${date}. deducted ${30 * numSessions} xp.`);
    }
    S.swimHistory = S.swimHistory.filter(x => x.date !== date);
    
    const historyDateKey = new Date(date + 'T00:00:00').toDateString();
    S.routines.forEach(r => {
      const e = r.ethe.find(x => Number(x.id) === 303);
      if (e) {
        if (S.history[historyDateKey]) S.history[historyDateKey][e.id] = false;
        if (historyDateKey === S.activeDate) e.done = false;
      }
    });
    ss();
    render();
  }
}

function renderBiometrics() {
  const container = document.getElementById('bio-history-body');
  if (!container) return;
  container.innerHTML = '';
  
  if (!S.weightLogs) S.weightLogs = [];
  const chronLogs = [...S.weightLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const deltas = {};
  for (let i = 0; i < chronLogs.length; i++) {
    if (i === 0) {
      deltas[chronLogs[i].date] = null;
    } else {
      deltas[chronLogs[i].date] = chronLogs[i].weight - chronLogs[i-1].weight;
    }
  }
  
  const renderLogs = [...S.weightLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  if (renderLogs.length === 0) {
    container.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:16px; color:var(--text-faint);">// NO BIOMETRIC RECORDS FOUND</td></tr>';
    return;
  }
  
  renderLogs.forEach(log => {
    const d = deltas[log.date];
    let deltaHtml = '';
    if (d !== null && d !== undefined) {
      if (d > 0) deltaHtml = `<span class="bio-delta up">▲ +${d.toFixed(1)}</span>`;
      else if (d < 0) deltaHtml = `<span class="bio-delta down">▼ ${d.toFixed(1)}</span>`;
      else deltaHtml = `<span class="bio-delta flat">■ 0.0</span>`;
    } else {
      deltaHtml = `<span class="bio-delta flat" style="color:var(--text-faint)">--</span>`;
    }
    
    const row = document.createElement('tr');
    row.style.borderBottom = '1px dashed var(--border2)';
    row.innerHTML = `
      <td style="padding:6px 4px; font-weight:700;">${log.date}</td>
      <td style="padding:6px 4px; color:var(--accent); font-weight:700;">${log.weight ? log.weight.toFixed(1) : '--'} kg ${deltaHtml}</td>
      <td style="padding:6px 4px; color:var(--amber);">${log.uricAcid ? log.uricAcid.toFixed(1) : '--'}</td>
      <td style="padding:6px 4px; color:var(--blue);">${log.hdl ? log.hdl : '--'}</td>
      <td style="padding:6px 4px; color:var(--purple);">${log.eosinophils ? log.eosinophils.toFixed(1) : '--'}</td>
      <td style="padding:6px 4px; text-align:right;">
        <button class="ethos-rm" style="padding:1px 6px; font-size:10px;" data-date="${log.date}">rm</button>
      </td>
    `;
    row.querySelector('.ethos-rm').onclick = () => removeBiometrics(log.date);
    container.appendChild(row);
  });
}

function logBiometrics() {
  const dateInput = document.getElementById('bio-date');
  const weightInput = document.getElementById('bio-weight');
  const uricInput = document.getElementById('bio-uric');
  const hdlInput = document.getElementById('bio-hdl');
  const eosinInput = document.getElementById('bio-eosin');
  
  const date = dateInput.value;
  const weight = parseFloat(weightInput.value);
  
  if (!date || isNaN(weight)) {
    alert('Date and Weight are required.');
    return;
  }
  
  const uricAcid = parseFloat(uricInput.value) || null;
  const hdl = parseInt(hdlInput.value) || null;
  const eosinophils = parseFloat(eosinInput.value) || null;
  
  if (!S.weightLogs) S.weightLogs = [];
  const existingIdx = S.weightLogs.findIndex(x => x.date === date);
  const logObj = { date, weight, uricAcid, hdl, eosinophils };
  
  if (existingIdx !== -1) {
    S.weightLogs[existingIdx] = logObj;
  } else {
    S.weightLogs.push(logObj);
  }
  
  addLog('info', `biometrics logged: ${weight}kg on ${date}`);
  weightInput.value = '';
  uricInput.value = '';
  hdlInput.value = '';
  eosinInput.value = '';
  ss();
  render();
}

function removeBiometrics(date) {
  if (confirm(`delete biometrics log for ${date}?`)) {
    if (!S.weightLogs) return;
    S.weightLogs = S.weightLogs.filter(x => x.date !== date);
    addLog('info', `deleted biometrics log for ${date}`);
    ss();
    render();
  }
}

function checkDermaGlow() {
  const azelaicId = 502;
  const dates = Object.keys(S.history || {});
  if (TODAY && !dates.includes(TODAY)) dates.push(TODAY);
  const sortedDates = dates.sort((a, b) => new Date(a) - new Date(b));
  
  let currentStreak = 0, maxStreak = 0;
  for (let i = 0; i < sortedDates.length; i++) {
    const d = sortedDates[i];
    const doneToday = d === TODAY ? 
      S.routines.some(r => { const e = r.ethe.find(x => x.id === azelaicId); return e && e.done; }) : 
      (S.history[d] && !!S.history[d][azelaicId]);
      
    if (doneToday) {
      if (i > 0) {
        const diffDays = Math.floor((new Date(d) - new Date(sortedDates[i-1])) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) currentStreak++;
        else if (diffDays > 1) currentStreak = 1;
      } else {
        currentStreak = 1;
      }
    } else {
      currentStreak = 0;
    }
    maxStreak = Math.max(maxStreak, currentStreak);
  }
  return maxStreak >= 7;
}

function checkHydroChamp() {
  const dates = Object.keys(S.waterLogs || {});
  const sortedDates = dates.sort((a, b) => new Date(a) - new Date(b));
  
  let currentStreak = 0, maxStreak = 0;
  for (let i = 0; i < sortedDates.length; i++) {
    const d = sortedDates[i];
    const waterVal = S.waterLogs[d] || 0;
    if (waterVal >= 3.5) {
      if (i > 0) {
        const diffDays = Math.floor((new Date(d) - new Date(sortedDates[i-1])) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak++;
        } else if (diffDays > 1) {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
    } else {
      currentStreak = 0;
    }
    maxStreak = Math.max(maxStreak, currentStreak);
  }
  return maxStreak >= 7;
}

// ═════════════════════════════════════════════════════════════
// ═══ v2.4.0 Progressive Web App & Notification Alarm Engine ═══
// ═════════════════════════════════════════════════════════════

// Web Audio API Synthesizer Presets
function playSynthSound(preset = 'cyber_chime') {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    const vol = S.notificationSettings ? S.notificationSettings.volume : 0.5;
    
    if (preset === 'cyber_chime') {
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
      gain1.gain.setValueAtTime(vol * 0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1); gain1.connect(ctx.destination);
      osc1.start(now); osc1.stop(now + 0.4);
      
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1320, now + 0.1);
      osc2.frequency.exponentialRampToValueAtTime(2640, now + 0.2);
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(vol * 0.1, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2); gain2.connect(ctx.destination);
      osc2.start(now + 0.1); osc2.stop(now + 0.5);
      
    } else if (preset === 'cyber_pulse') {
      [0, 0.12].forEach(delay => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1000, now + delay);
        gain.gain.setValueAtTime(vol * 0.05, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now + delay); osc.stop(now + delay + 0.09);
      });
      
    } else if (preset === 'cyber_radar') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.6);
      gain.gain.setValueAtTime(vol * 0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.85);
    }
  } catch (err) {
    console.error("Synthesizer error: ", err);
  }
}

// Notification Permissions status synchronizer
function updatePWANotificationStatus() {
  const statusEl = document.getElementById('pwa-notif-status');
  const btnEl = document.getElementById('pwa-request-btn');
  if (!statusEl) return;
  
  const perm = Notification.permission;
  if (perm === 'granted') {
    statusEl.textContent = 'GRANTED';
    statusEl.style.color = 'var(--accent)';
    if (btnEl) btnEl.style.display = 'none';
  } else if (perm === 'denied') {
    statusEl.textContent = 'BLOCKED';
    statusEl.style.color = 'var(--red)';
    if (btnEl) btnEl.style.display = 'block';
  } else {
    statusEl.textContent = 'DEFAULT';
    statusEl.style.color = 'var(--text-dim)';
    if (btnEl) btnEl.style.display = 'block';
  }
}

// Register SW and hook UI event listeners
function initPWANotifications() {
  // 1. Service Worker registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js')
        .then(reg => console.log('SW registration successful with scope: ', reg.scope))
        .catch(err => console.warn('SW registration failed: ', err));
    });
  }
  
  // 2. Event listeners for visual settings tab items
  const requestBtn = document.getElementById('pwa-request-btn');
  const soundSelect = document.getElementById('notif-sound-preset');
  const volSlider = document.getElementById('notif-vol-slider');
  const testBtn = document.getElementById('notif-test-btn');
  const saveBtn = document.getElementById('rem-save-btn');
  const timeInput = document.getElementById('rem-time-input');
  const msgInput = document.getElementById('rem-msg-input');
  
  if (requestBtn) {
    requestBtn.onclick = () => {
      Notification.requestPermission().then(() => {
        updatePWANotificationStatus();
        if (Notification.permission === 'granted') {
          playSynthSound('cyber_chime');
          triggerNotification("ethos.init // SYNC", "System notification clearance granted.");
        }
      });
    };
  }
  
  if (soundSelect) {
    soundSelect.value = S.notificationSettings.sound;
    soundSelect.onchange = () => {
      S.notificationSettings.sound = soundSelect.value;
      ss();
      playSynthSound(S.notificationSettings.sound);
    };
  }
  
  if (volSlider) {
    volSlider.value = S.notificationSettings.volume;
    volSlider.oninput = () => {
      S.notificationSettings.volume = parseFloat(volSlider.value);
      ss();
    };
    volSlider.onchange = () => {
      playSynthSound(S.notificationSettings.sound);
    };
  }
  
  if (testBtn) {
    testBtn.onclick = () => {
      triggerNotification("ethos.init // TEST", "Dynamic audio synthesizer test frame dispatched.");
    };
  }
  
  if (saveBtn && timeInput && msgInput) {
    saveBtn.onclick = () => {
      const timeVal = timeInput.value;
      const msgVal = msgInput.value.trim() || "Routine Alarm";
      if (!timeVal) return;
      
      S.reminders.push({
        id: Date.now().toString(),
        time: timeVal,
        message: msgVal,
        active: true,
        once: false,
        lastFiredDate: ''
      });
      ss();
      renderRemindersList();
      timeInput.value = '';
      msgInput.value = '';
    };
  }
  
  updatePWANotificationStatus();
  renderRemindersList();
  initOracleBindings();
}

// Render dynamic reminders visual table list
function renderRemindersList() {
  const container = document.getElementById('reminders-table-body');
  if (!container) return;
  
  if (S.reminders.length === 0) {
    container.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:16px; color:var(--text-faint);">// NO ROUTINE ALARMS SCHEDULED</td></tr>';
    return;
  }
  
  container.innerHTML = S.reminders.map((r, idx) => {
    const activeText = r.active 
      ? ('[ACTIVE]') 
      : ('[OFF]');
    const deleteText = '[delete]';
    return `
      <tr style="border-bottom: 1px dashed var(--border2); color: var(--text);">
        <td style="padding: 8px 4px; font-weight: bold; color: var(--accent);">${r.time}</td>
        <td style="padding: 8px 4px; color: var(--text-dim); max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(r.message)}</td>
        <td style="padding: 8px 4px;">
          <button class="btn btn-ghost" onclick="toggleReminder(${idx})" style="font-size: 10px; padding: 2px 6px;">
            ${activeText}
          </button>
        </td>
        <td style="padding: 8px 4px; text-align: right;">
          <button class="btn btn-danger" onclick="deleteReminder(${idx})" style="font-size: 10px; padding: 2px 6px;">
            ${deleteText}
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Global visual list triggers
window.toggleReminder = function(idx) {
  if (S.reminders && S.reminders[idx]) {
    S.reminders[idx].active = !S.reminders[idx].active;
    ss();
    renderRemindersList();
  }
};

window.deleteReminder = function(idx) {
  if (S.reminders && S.reminders[idx]) {
    S.reminders.splice(idx, 1);
    ss();
    renderRemindersList();
  }
};

// PWA Push Notification dispatcher
function triggerNotification(title, body) {
  if (Notification.permission === 'granted') {
    if (S.notificationSettings.sound !== 'none') {
      playSynthSound(S.notificationSettings.sound);
    }
    
    const icon = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 32 32\'%3E%3Crect width=\'32\' height=\'32\' fill=\'%23000000\'/%3E%3Cpath d=\'M16 4 L24 20 L8 20 Z\' fill=\'%2300ff88\'/%3E%3C/svg%3E';
    
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, {
          body: body,
          icon: icon,
          tag: 'ethos-reminder',
          renotify: true
        });
      });
    } else {
      new Notification(title, { body: body, icon: icon });
    }
    
    addLog('ok', `alert pushed: "${title}"`);
  } else {
    printTerm(`[ALERT SYSTEM] ${title}: ${body}`, 'warn');
  }
}

// Alarm monitoring background ticker loop (scans every 30s)
function startReminderTicker() {
  setInterval(() => {
    const now = new Date();
    const hr = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const timeString = `${hr}:${min}`;
    const todayStr = now.toDateString();
    
    let stateChanged = false;
    
    S.reminders.forEach(rem => {
      if (rem.active && rem.time === timeString && rem.lastFiredDate !== todayStr) {
        triggerNotification("ethos.init // REMINDER", rem.message);
        rem.lastFiredDate = todayStr;
        
        if (rem.once) {
          rem.active = false;
        }
        stateChanged = true;
      }
    });
    
    if (stateChanged) {
      ss();
      renderRemindersList();
    }
  }, 30000);
}

// ==========================================================================
// ORACLE AI CONVERSATIONAL ENGINE (GEMINI FLASH)
// ==========================================================================

function showTerminalLoader() {
  const outInner = document.getElementById('tv-output-inner');
  const out = document.getElementById('tv-output');
  if (!outInner || !out) return { stop: () => {} };

  const div = document.createElement('div');
  div.className = 'tv-output-line info';
  div.style.fontFamily = 'monospace';
  div.style.lineHeight = '1.5';
  outInner.appendChild(div);
  scrollToBottom(out, true);

  const frames = ['▖', '▘', '▝', '▗'];
  const spinnerChars = ['/', '-', '\\', '|'];
  let tick = 0;
  
  const intervalId = setInterval(() => {
    tick++;
    const spinner = spinnerChars[tick % spinnerChars.length];
    const block = frames[tick % frames.length];
    
    div.innerHTML = `
      <span style="color:var(--accent); font-weight:bold;">${block}</span> ESTABLISHING CONNECTION TO DOCKING AI CORE <span style="color:var(--text-dim);">[ ${spinner} ]</span><br>
      <span style="color:var(--text-faint); margin-left: 14px;">• synchronizing neural parameters...</span><br>
      <span style="color:var(--text-faint); margin-left: 14px;">• querying gemini-2.5-flash: PENDING...</span>
    `;
    scrollToBottom(out, false);
  }, 100);

  return {
    stop: () => {
      clearInterval(intervalId);
      if (div.parentNode) {
        div.parentNode.removeChild(div);
      }
    }
  };
}

async function queryOracle(prompt) {
  if (!S.geminiKey) {
    printTerm('// ERROR: Gemini API key is not configured.', 'err');
    printTerm('To configure, run: <span style="color:var(--accent);">oracle --key YOUR_API_KEY</span>', 'info');
    printTerm('Or use the API Key input card in the Log Settings panel.', 'info');
    return;
  }

  const loader = showTerminalLoader();
  window.oracleStreamingActive = true;
  
  // Format history for conversational turn
  S.oracleHistory.push({ role: 'user', parts: [{ text: prompt }] });
  
  // Keep history bounded to last 20 turns
  if (S.oracleHistory.length > 20) {
    S.oracleHistory = S.oracleHistory.slice(-20);
  }
  
  // Dynamically compile active ethos status context
  const allEthe = getAllEthe();
  const etheDetails = allEthe.map(e => `- [${e.id}] "${e.name}" (Status: ${e.done ? 'DONE' : 'UNDONE'})`).join('\n');
  
  const vector = compileCognitiveVector();
  const memory = S.ecreMemory || { lastObservations: [], namedPatterns: [], openQuestions: [], userPromises: [], sessionCount: 0 };
  
  let activePromisesText = (memory.userPromises || []).filter(p => !p.fulfilled).map(p => `- Promise: "${p.promise}" (Target group: ${p.targetGroup || 'any'}, Date made: ${p.date})`).join('\n') || 'None';
  let activePatternsText = (memory.namedPatterns || []).map(p => `- Pattern: "${p}"`).join('\n') || 'None';
  let openQuestionsText = (memory.openQuestions || []).filter(q => q.answer === null).map(q => `- Diagnostic Question: "${q.question}" (Session asked: ${q.sessionAsked})`).join('\n') || 'None';
  
    let oraclePersonaText = `You are Oracle, the retro-cyberpunk AI mathematics and LLM architecture tutor inside ethos.init. Explain concepts precisely, use clean mathematical formulas, structure your response elegantly with monospace lists, and keep explanations brief and punchy. Make sure to use the active accent color variable (var(--accent)) or other terminal classes to highlight key parameters. Do not output raw markdown code block tags inside your main answers except for direct code snippets. Maintain a highly professional and slightly mysterious cybernetic guide persona.`;

  

  const systemInstruction = {
    parts: [{ text: `${oraclePersonaText}

You are also integrated into the ethos.init life tracking system. You can check off and uncheck habits (called 'ethe') on behalf of the user when they tell you they have done, completed, skipped, or undone them.

Here is the current list of user habits (ethe) with their IDs and current states:
${etheDetails}

You are also ECRE (Ethos Cognitive Reflection Engine), the user's living cybernetic companion. You remember details across sessions and enforce real weights and consequences.
Current User Cognitive Trace & ECRE Metrics:
- Active Coherence State: ${vector.state} (${vector.critique})
- Compliance Index (CNS): ${vector.compliancePct}%
- Active Streak: ${S.streak} days
- Hydration Log: ${S.waterLogs[TODAY] || 0}L (Target: 3.5L+)
- Neglected Categories / Active Anomalies:
${vector.advisories.map(a => `  • ${a}`).join('\n')}
- Current Directive: "${vector.directive}"
- Session Count: ${memory.sessionCount}

ECRE Persistent Memory Profile:
- Active Commitments / User Promises:
${activePromisesText}
- Active Diagnostic Patterns Identified:
${activePatternsText}
- Open Unanswered Questions:
${openQuestionsText}

Special Conversational Directives:
1. ECRE Memory Sync: ECRE remembers everything. If the user previously promised something and didn't fulfill it (e.g. they promised to do math today and skipped it, or compliance has dropped), you must reference their broken promise specifically in your response and ask why they didn't keep it.
2. Active Pattern Recognition: If the user repeats a behavior that aligns with an identified pattern, call them out on it.
3. Diagnostic Prompts: If routines are neglected or skips occur, you can ask a diagnostic question. If you do, you MUST output a [COMMAND: question "..."] to store it in memory.
4. User Promises: If the user promises to do something in the conversation (e.g. "I'll do proofs tomorrow", "I'll log 2 hours of optimization tomorrow"), you MUST record this promise by appending:
   [COMMAND: promise "promise description" targetGroup="math|build|body|skin|hair|nutrition|any"]
5. Question Answers: If the user answers one of your open diagnostic questions, you MUST record their answer and resolve the lock by appending:
   [COMMAND: answer_question "question text" "their answer"]
6. Consequence Mechanics: If a diagnostic question remains unanswered for 2+ sessions, their XP is locked in that group. Remind them of this if they ask about low XP. If a pattern is violated, the streak warnings turn Amber.

If the user's message indicates they completed, did, or undid any of these habits, you MUST append commands at the absolute end of your response, each on a new line, using this exact format:
[COMMAND: check <id>]
[COMMAND: uncheck <id>]

If the user's message indicates they logged a swim or went swimming (e.g., "oracle i swam from 8pm to 10:10 pm, 25 laps, easy"), you MUST calculate the duration in minutes, extract the number of laps, determine the intensity (easy, moderate, or hard), and append a swim command:
[COMMAND: swim duration=<duration_in_minutes> laps=<laps_count> intensity=<easy|moderate|hard> time="<time_range>" comment="<comment>" date="<optional_YYYY-MM-DD_format_only_if_past_day>"]
For example, for "swam from 8pm to 10:10 pm, 25 laps, easy", you should output:
[COMMAND: swim duration=130 laps=25 intensity=easy time="8pm to 10:10 pm" comment="easy"]
If they logged a swim, the system will automatically check off their Cardio habit (ID 303), so you do NOT need to also output a check command for habit 303.

Only check off a habit if it is currently UNDONE, and uncheck it if it is currently DONE.
Do not show these raw [COMMAND: ...] syntax blocks to the user in your conversational explanation. Confirm your actions in a highly styled cybernetic narrative (e.g. 'Marked "Linear Algebra" as completed in your neural trace. +15 XP logged.').` }]
  };

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${S.geminiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: S.oracleHistory,
        systemInstruction: systemInstruction,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      })
    });

    loader.stop();
    window.oracleStreamingActive = false;

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData?.error?.message || `HTTP ${response.status}`;
      throw new Error(errMsg);
    }

    const resJson = await response.json();
    const replyText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!replyText) {
      throw new Error("Empty response received from docking AI core.");
    }
    
    // Parse check/uncheck/swim commands from response
    let cleanReplyText = replyText;
    const commandRegex = /\[COMMAND:\s*(check|uncheck|swim|promise|question|pattern|answer_question)\s+([^\]]+)\]/gi;
    let match;
    const commandsToRun = [];

    while ((match = commandRegex.exec(replyText)) !== null) {
      commandsToRun.push({
        action: match[1].toLowerCase(),
        ethosId: match[2].trim()
      });
    }

    // Strip commands from displayed text so they remain invisible to user
    cleanReplyText = replyText.replace(commandRegex, '').trim();

    // Save cleaned conversation history
    S.oracleHistory.push({ role: 'model', parts: [{ text: cleanReplyText }] });
    
    // Execute state modifications
    let actionCount = 0;
    const actionsTaken = [];
    if (commandsToRun.length > 0) {
      commandsToRun.forEach(cmd => {
        if (cmd.action === 'swim') {
          let swimDuration = 0;
          let swimLaps = 0;
          let swimIntensity = 'moderate';
          let swimTime = '';
          let swimComment = '';
          let swimDate = S.activeDate || TODAY;
          const attrStr = cmd.ethosId;
          const attrRegex = /(\w+)\s*=\s*(?:"([^"]*)"|(\S+))/g;
          let attrMatch;
          while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
            const key = attrMatch[1].toLowerCase();
            const val = attrMatch[2] !== undefined ? attrMatch[2] : attrMatch[3];
            if (key === 'duration') swimDuration = parseInt(val) || 0;
            else if (key === 'laps') swimLaps = parseInt(val) || 0;
            else if (key === 'intensity') swimIntensity = val.toLowerCase();
            else if (key === 'time') swimTime = val;
            else if (key === 'comment') swimComment = val;
            else if (key === 'date') swimDate = val;
          }
          
          const distance = swimLaps * 50;
          let calMultiplier = 9;
          if (swimIntensity === 'easy') calMultiplier = 7;
          else if (swimIntensity === 'hard' || swimIntensity === 'vigorous') calMultiplier = 11;
          const calories = swimDuration * calMultiplier;
          
          logSwimSessionProgrammatic(swimDate, swimTime || '8pm', swimDuration, swimComment || swimIntensity, swimLaps, distance, calories);
          actionCount++;
          actionsTaken.push(`logged swim (${swimDuration} mins, ${swimLaps} laps)`);
        } else if (cmd.action === 'promise') {
          const promiseText = cmd.ethosId.replace(/"/g, '');
          let targetGroup = 'any';
          const matchGroup = /targetGroup\s*=\s*(?:"([^"]*)"|(\S+))/i.exec(cmd.ethosId);
          if (matchGroup) targetGroup = matchGroup[1] || matchGroup[2];
          
          if (!S.ecreMemory.userPromises) S.ecreMemory.userPromises = [];
          S.ecreMemory.userPromises.push({
            promise: promiseText,
            date: new Date().toDateString(),
            targetGroup: targetGroup,
            fulfilled: false
          });
          actionCount++;
          actionsTaken.push(`logged user promise: "${promiseText}"`);
        } else if (cmd.action === 'question') {
          const questionText = cmd.ethosId.replace(/"/g, '');
          if (!S.ecreMemory.openQuestions) S.ecreMemory.openQuestions = [];
          S.ecreMemory.openQuestions.push({
            question: questionText,
            answer: null,
            date: new Date().toDateString(),
            sessionAsked: S.ecreMemory.sessionCount || 0
          });
          actionCount++;
          actionsTaken.push(`ECRE posed diagnostic question: "${questionText}"`);
        } else if (cmd.action === 'pattern') {
          const patternText = cmd.ethosId.replace(/"/g, '');
          if (!S.ecreMemory.namedPatterns) S.ecreMemory.namedPatterns = [];
          if (!S.ecreMemory.namedPatterns.includes(patternText)) {
            S.ecreMemory.namedPatterns.push(patternText);
          }
          actionCount++;
          actionsTaken.push(`ECRE identified neural pattern: "${patternText}"`);
        } else if (cmd.action === 'answer_question') {
          const parts = cmd.ethosId.match(/"([^"]+)"/g) || [];
          if (parts.length >= 2) {
            const questionText = parts[0].replace(/"/g, '');
            const answerText = parts[1].replace(/"/g, '');
            if (!S.ecreMemory.openQuestions) S.ecreMemory.openQuestions = [];
            const q = S.ecreMemory.openQuestions.find(x => x.question.toLowerCase().includes(questionText.toLowerCase()));
            if (q) {
              q.answer = answerText;
              actionCount++;
              actionsTaken.push(`answered ECRE question: "${q.question}"`);
            }
          }
        } else {
          let foundIdx = -1;
          let ethosObj = null;
          S.routines.forEach((r, rIdx) => {
            const e = r.ethe.find(x => String(x.id) === String(cmd.ethosId));
            if (e) {
              foundIdx = rIdx;
              ethosObj = e;
            }
          });

          if (ethosObj && foundIdx !== -1) {
            if (cmd.action === 'check' && !ethosObj.done) {
              toggleEthos(foundIdx, ethosObj.id);
              actionCount++;
              actionsTaken.push(`checked "${ethosObj.name}"`);
            } else if (cmd.action === 'uncheck' && ethosObj.done) {
              toggleEthos(foundIdx, ethosObj.id);
              actionCount++;
              actionsTaken.push(`unchecked "${ethosObj.name}"`);
            }
          }
        }
      });
    }

    ss(); // save state
    
    // Format markdown/text to visual HTML suitable for the CRT screen
    const htmlResponse = formatOracleResponse(cleanReplyText);
    
    printTermTyped(htmlResponse, 'ok');

    if (actionCount > 0) {
      printTerm(`// DOCKING CORE: State modification successful (${actionsTaken.join(', ')}).`, 'ok');
    }
    
  } catch (error) {
    loader.stop();
    window.oracleStreamingActive = false;
    // Revert last user prompt on failure so conversation stays in sync
    S.oracleHistory.pop();
    printTerm(`// LINK ERROR: ${escapeHtml(error.message)}`, 'err');
  }
}

async function listOracleModels() {
  if (!S.geminiKey) {
    printTerm('// ERROR: Gemini API key is not configured.', 'err');
    printTerm('To configure, run: <span style="color:var(--accent);">oracle --key YOUR_API_KEY</span>', 'info');
    printTerm('Or use the API Key input card in the Log Settings panel.', 'info');
    return;
  }

  printTerm('// ESTABLISHING CONNECTION FOR KEY DIAGNOSTICS...', 'info');
  
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${S.geminiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData?.error?.message || `HTTP ${response.status}`;
      throw new Error(errMsg);
    }

    const resJson = await response.json();
    const models = resJson.models || [];
    
    if (models.length === 0) {
      printTerm('// DIAGNOSTICS: Key is active, but no models are authorized.', 'warn');
    } else {
      printTerm('// DIAGNOSTICS: Connection successful! Authorized models:', 'ok');
      // Show first 8 models to keep console clean
      models.slice(0, 8).forEach(model => {
        const cleanName = model.name.replace('models/', '');
        printTerm(`• <span style="color:var(--accent); font-family:var(--font);">${cleanName}</span> (${model.displayName || ''})`, 'info');
      });
      if (models.length > 8) {
        printTerm(`...and ${models.length - 8} more models.`, 'info');
      }
    }
  } catch (error) {
    printTerm(`// DIAGNOSTIC ERROR: ${escapeHtml(error.message)}`, 'err');
    printTerm('Suggestions to resolve this block:', 'info');
    printTerm('1. Generate a new API Key in standard Gmail account via <a href="https://aistudio.google.com/" target="_blank" style="color:var(--accent); text-decoration:underline;">Google AI Studio</a>.', 'info');
    printTerm('2. Verify if the "Generative Language API" is enabled under the API Library in the Google Cloud Console for your project.', 'info');
    printTerm('3. Check your Google Cloud billing dashboard for payment holds or suspended states.', 'info');
  }
}

// Convert Gemini markdown responses to terminal-compatible HTML
function formatOracleResponse(text) {
  let html = escapeHtml(text);
  
  // Simple markdown-to-terminal parser
  
  // Code blocks: ```javascript ... ``` -> <pre class="terminal-code">...</pre>
  html = html.replace(/```(?:[a-zA-Z]*)\n([\s\S]*?)```/g, (match, code) => {
    return `<pre style="background:var(--bg3); border:1px solid var(--border); padding:8px; border-radius:4px; margin:8px 0; overflow-x:auto; font-family:var(--font); font-size:11px; color:var(--text-dim);">${code}</pre>`;
  });
  // Inline code: `code` -> <code style="color:var(--accent)">code</code>
  html = html.replace(/`([^`\n]+)`/g, '<code style="color:var(--accent); background:var(--bg3); padding:1px 4px; border-radius:2px; font-family:var(--font);">$1</code>');
  
  // Bold: **text** -> <span style="color:var(--accent); font-weight:bold;">text</span>
  html = html.replace(/\*\*([^\*]+)\*\*/g, '<span style="color:var(--accent); font-weight:bold;">$1</span>');
  
  // Bullets: * -> •
  html = html.replace(/^\s*\*\s+/gm, ' • ');
  
  // Linebreaks
  html = html.replace(/\n/g, '<br>');
  
  return `<span style="font-family:var(--font); font-size:12px; line-height:1.6; display:block;">${html}</span>`;
}

// === ETHOS COGNITIVE REFLECTION ENGINE (ECRE) ===
function isEthosDoneOnDate(id, dateStr) {
  const allEthe = getAllEthe();
  if (dateStr === TODAY) {
    const e = allEthe.find(x => x.id === id);
    return e ? !!e.done : false;
  }
  if (S.history && S.history[dateStr]) {
    return !!S.history[dateStr][id];
  }
  return false;
}

function compileCognitiveVector(relativeDate = new Date()) {
  const allEthe = getAllEthe();
  
  // 1. Calculate compliance over last 7 days relative to relativeDate
  let totalDone = 0;
  let totalPossible = 0;
  
  const todayStr = relativeDate.toDateString();
  const yesterday = new Date(relativeDate); yesterday.setDate(relativeDate.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();
  const twoDaysAgo = new Date(relativeDate); twoDaysAgo.setDate(relativeDate.getDate() - 2);
  const twoDaysAgoStr = twoDaysAgo.toDateString();
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(relativeDate);
    d.setDate(relativeDate.getDate() - i);
    const dateStr = d.toDateString();
    
    if (dateStr === TODAY) {
      allEthe.forEach(e => {
        totalPossible++;
        if (e.done) totalDone++;
      });
    } else if (S.history && S.history[dateStr]) {
      const record = S.history[dateStr];
      for (const id in record) {
        totalPossible++;
        if (record[id]) totalDone++;
      }
    }
  }
  
  const compliance = totalPossible > 0 ? (totalDone / totalPossible) : 0.85; // default 85% compliance
  const compliancePct = Math.round(compliance * 100);
  
  // 2. Identify LLM Math skips (habit id 3 "Work through proofs")
  let mathSkips = 0;
  if (!isEthosDoneOnDate(3, yesterdayStr)) {
    mathSkips++;
    if (!isEthosDoneOnDate(3, twoDaysAgoStr)) {
      mathSkips++;
    }
  }
  
  // 3. Determine active state
  let state = "DEEP_SYNC";
  let critique = "";
  
  
    if (mathSkips >= 2) {
      state = "DEGRADED";
      critique = "Cognitive decoherence warning: LLM Mathematics skipped for 2+ consecutive sessions.";
    } else if (compliancePct >= 85) {
      state = "DEEP_SYNC";
      critique = "Synaptic routines optimal. Keep driving.";
    } else if (compliancePct >= 50) {
      state = "TURBULENT";
      critique = "Minor drift detected in synaptic routines. Re-engage targets.";
    } else {
      state = "DEGRADED";
      critique = "Cognitive decoherence warning. Core routines offline.";
    }
  

  // 4. Dynamic appraisal heuristics for ECRE guide dialogue & living comments
  const todayDay = new Date().getDay();
  const etheToday = allEthe.filter(e => !e.days || e.days.includes(todayDay));
  const waterToday = S.waterLogs[TODAY] || 0;
  const isHydrationOptimal = waterToday >= 3.5;

  let swamTodayOrYesterday = false;
  if (S.swimHistory && Array.isArray(S.swimHistory)) {
    const swamYesterday = S.swimHistory.some(entry => (entry.date === yesterdayStr) && entry.status === 'Swam');
    const swamToday = S.swimHistory.some(entry => (entry.date === TODAY) && entry.status === 'Swam');
    swamTodayOrYesterday = swamToday || swamYesterday;
  }

  // Group metrics
  const mathEthe = etheToday.filter(e => e.groupId === 'math');
  const mathDone = mathEthe.filter(e => e.done).length;

  const buildEthe = etheToday.filter(e => e.groupId === 'build');
  const buildDone = buildEthe.filter(e => e.done).length;

  const bodyEthe = etheToday.filter(e => e.groupId === 'body');
  const bodyDone = bodyEthe.filter(e => e.done).length;

  const skinEthe = etheToday.filter(e => e.groupId === 'skin');
  const skinDone = skinEthe.filter(e => e.done).length;

  const hairEthe = etheToday.filter(e => e.groupId === 'hair');
  const hairDone = hairEthe.filter(e => e.done).length;

  const nutritionEthe = etheToday.filter(e => e.groupId === 'nutrition');
  const nutritionDone = nutritionEthe.filter(e => e.done).length;

  // Positive Integrations
  const positiveNotes = [];
  
    if (S.streak >= 7) {
      positiveNotes.push(`STREAK SUSTAINED: Neural momentum strong at ${S.streak} days. Shield protection active.`);
    } else if (S.streak > 0) {
      positiveNotes.push(`MOMENTUM: Active daily streak of ${S.streak} days. Neural connections forming.`);
    }
    
    if (mathEthe.length > 0 && mathDone === mathEthe.length) {
      positiveNotes.push(`COGNITIVE DEPTH: Mathematics routines 100% complete. Analytical engine fully aligned.`);
    } else if (isEthosDoneOnDate(3, TODAY)) {
      positiveNotes.push(`RIGOR SECURED: Proof derivation drills (id 3) successfully executed today.`);
    }
    
    if (buildEthe.length > 0 && buildDone === buildEthe.length) {
      positiveNotes.push(`HARDWARE INTEGRITY: Focus builds and algorithmic implementations complete.`);
    }
    
    if (bodyDone > 0 || swamTodayOrYesterday) {
      let msg = `SOMATIC OUTFLOW: Physical routines completed today.`;
      if (swamTodayOrYesterday) msg += ` Swim session logged.`;
      positiveNotes.push(msg);
    }
    
    if (skinEthe.length > 0 && skinDone === skinEthe.length) {
      positiveNotes.push(`DERMAL SHIELD: Morning and night skincare barrier successfully deployed.`);
    }
    
    if (isHydrationOptimal) {
      positiveNotes.push(`BIO-FUEL: Hydration target achieved (${waterToday}L logged today).`);
    }
    
    if (etheToday.length > 0 && etheToday.every(e => e.done)) {
      positiveNotes.push(`ZENITH COHERENCE: All scheduled routines for today are 100% complete.`);
    }
    
    if (positiveNotes.length === 0) {
      positiveNotes.push(`INITIALIZATION: ECRE system standby. Awaiting first routine validation.`);
    }
  

  // Diagnostic Advisories
  const advisories = [];
  
    if (mathSkips >= 2) {
      advisories.push(`CRITICAL COGNITIVE DRIFT: Mathematical proofs skipped for ${mathSkips} consecutive sessions! Brain plasticity requires rigorous active derivation.`);
    } else if (!isEthosDoneOnDate(3, TODAY)) {
      advisories.push(`PENDING RIGOR: 'Work through proofs' (id 3) has not been verified for today.`);
    }
    
    if (mathEthe.length > 0 && mathDone === 0) {
      advisories.push(`MATH DE-SYNC: Mathematical integration is entirely offline today.`);
    }
    if (bodyEthe.length > 0 && bodyDone === 0 && !swamTodayOrYesterday) {
      advisories.push(`SOMATIC NEGLECT: Somatic/exercise routines are entirely pending today. Physical vessel requires conditioning.`);
    }
    if (skinEthe.length > 0 && skinDone === 0) {
      advisories.push(`DERMAL NEGLECT: Dermal protective routines are entirely skipped today.`);
    }
    if (nutritionEthe.length > 0 && nutritionDone === 0) {
      advisories.push(`METABOLIC LAGGARD: Nutritional/supplement routines are completely unattended today.`);
    }
    if (hairEthe.length > 0 && hairDone === 0) {
      advisories.push(`FOLLICULAR INACTION: Hair and scalp nourishing protocols are offline today.`);
    }
    if (waterToday < 3.5) {
      advisories.push(`HYDRATION DEFICIT: S.waterLogs is currently at ${waterToday}L. System requires 3.5L+ to maintain optimal focus.`);
    }
    
    if (advisories.length === 0) {
      advisories.push(`ALL COGNITIVE CHANNELS SECURED. Zero active anomalies detected.`);
    }
  

  // Directives
  let directive = "";
  const pendingMath = mathEthe.find(e => !e.done);
  const pendingBuild = buildEthe.find(e => !e.done);
  const pendingBody = bodyEthe.find(e => !e.done);
  const pendingOther = etheToday.find(e => !e.done);
  
  
    if (!isEthosDoneOnDate(3, TODAY)) {
      directive = `Open proof binder. Spend 20 minutes deriving core mathematical theorems. Do not skip proofs.`;
    } else if (pendingBuild) {
      directive = `Initiate deep work. Implement core algorithms and refactor code. Focus on the '${pendingBuild.name}' task.`;
    } else if (pendingMath) {
      directive = `Complete pending math: '${pendingMath.name}'. Keep analytical channels warm.`;
    } else if (pendingBody) {
      directive = `Restore energy flow. Execute physical somatic/movement routines ('${pendingBody.name}').`;
    } else if (pendingOther) {
      directive = `Complete '${pendingOther.name}' under the '${pendingOther.groupId}' category to achieve deep synchronization.`;
    } else {
      directive = `Coherence zenith. Active routines secured. Maintain baseline, consolidate today's learnings, and rest.`;
    }
  

  // Living Comment
  let livingComment = "";
  
    if (etheToday.length > 0 && etheToday.every(e => e.done)) {
      livingComment = `// ECRE: [DEEP_SYNC] Zenith compliance. 100% daily routines complete. Maintain state.`;
    } else if (mathSkips >= 2) {
      livingComment = `// ECRE: [DEGRADED] Warning: 2+ proof skips detected! Resolve analytical drift now.`;
    } else if (!isEthosDoneOnDate(3, TODAY)) {
      livingComment = `// ECRE: [ADVISORY] Math proofs pending today. Execute pen and paper drills.`;
    } else if (compliancePct < 50) {
      livingComment = `// ECRE: [DEGRADED] Core compliance at ${compliancePct}%. Re-synchronize routines.`;
    } else if (compliancePct < 85) {
      livingComment = `// ECRE: [TURBULENT] Minor routine drift. Active streak: ${S.streak}d. Restore focus.`;
    } else {
      const pendingCount = etheToday.filter(e => !e.done).length;
      livingComment = `// ECRE: [DEEP_SYNC] Streaks active on ${S.streak}d. ${pendingCount} routines pending.`;
    }
  
  
  // Set pattern violation flag in ECRE Memory
  // Check if today is Thursday and math proofs (id 3) are undone/skipped, or mathSkips >= 1
  const todayDayOfWeek = new Date(relativeDate).getDay();
  const isThursday = todayDayOfWeek === 4;
  const isMathUndoneToday = !isEthosDoneOnDate(3, todayStr);
  const patternViolationActive = (isThursday && isMathUndoneToday) || (mathSkips >= 1);
  
  if (S.ecreMemory) {
    S.ecreMemory.patternViolationActive = patternViolationActive;
  }

  return {
    compliancePct: compliancePct,
    state: state,
    critique: critique,
    mathSkips: mathSkips,
    livingComment: livingComment,
    positiveNotes: positiveNotes,
    advisories: advisories,
    directive: directive
  };
}

function renderCOHERENCE() {
  const vector = compileCognitiveVector();
  
  // 1. Compute Metrics
  // A. CNS (Consistency): Rolling 7-day habits compliance rate
  const cns = vector.compliancePct / 100;
  
  // B. RIG (Rigor): LLM Math completions vs skips in last 7 days
  let mathCompletions = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toDateString();
    if (isEthosDoneOnDate(3, dateStr)) {
      mathCompletions++;
    }
  }
  const rig = mathCompletions / 7;
  
  // C. FOC (Focus): Focus sessions / daily target XP logged today
  const foc = Math.min(1.0, (S.xpToday || 0) / 150);
  
  // D. RUT (Routines): Done ethe today vs total ethe today
  const allEthe = getAllEthe();
  const totalEtheToday = allEthe.length;
  const doneEtheToday = allEthe.filter(e => e.done).length;
  const rut = totalEtheToday > 0 ? (doneEtheToday / totalEtheToday) : 0.85;
  
  // E. STM (Stamina): Study streak & swim consistency
  let swamCount = 0;
  if (S.swimHistory && Array.isArray(S.swimHistory)) {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    S.swimHistory.forEach(entry => {
      const entryDate = new Date(entry.date);
      if (entryDate >= fourteenDaysAgo && entry.status === 'Swam') {
        swamCount++;
      }
    });
  }
  const swimRatio = Math.min(1.0, swamCount / 4);
  const streakRatio = Math.min(1.0, (S.streak || 0) / 10);
  const stm = (streakRatio * 0.6) + (swimRatio * 0.4);

  const dataPoints = [cns, rig, foc, rut, stm];
  
  // 2. Fetch active CSS variable color dynamically
  const docStyles = getComputedStyle(document.documentElement);
  let activeColor = '#00ff88'; // Nephtrite green default
  if (vector.state === 'DEEP_SYNC') {
    activeColor = docStyles.getPropertyValue('--accent').trim() || '#00ff88';
  } else if (vector.state === 'TURBULENT') {
    activeColor = docStyles.getPropertyValue('--amber').trim() || '#ffb700';
  } else if (vector.state === 'DEGRADED') {
    activeColor = docStyles.getPropertyValue('--red').trim() || '#ff4444';
  }

  // 3. Update DOM text readouts
  const updateElText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  const stateText = vector.state;
  const buffText = (vector.state === 'DEEP_SYNC' ? 'x1.2 Flow' : 'x1.0 Active');
  const modalBuffText = (vector.state === 'DEEP_SYNC' ? 'x1.2 Flow Buff' : 'x1.0 Active');

  // Dashboard Telemetry Card
  updateElText('hud-val-cns', Math.round(cns * 100) + '%');
  updateElText('hud-val-rig', Math.round(rig * 100) + '%');
  updateElText('hud-val-foc', Math.round(foc * 100) + '%');
  updateElText('hud-val-rut', Math.round(rut * 100) + '%');
  updateElText('hud-val-stm', Math.round(stm * 100) + '%');
  updateElText('hud-status-val', stateText);
  updateElText('hud-buff-val', buffText);

  // Modal Diagnostic Overlay
  updateElText('modal-val-cns', Math.round(cns * 100) + '%');
  updateElText('modal-val-rig', Math.round(rig * 100) + '%');
  updateElText('modal-val-foc', Math.round(foc * 100) + '%');
  updateElText('modal-val-rut', Math.round(rut * 100) + '%');
  updateElText('modal-val-stm', Math.round(stm * 100) + '%');
  updateElText('modal-val-state', stateText);
  updateElText('modal-val-buff', modalBuffText);
  
  const modalCritique = document.getElementById('modal-val-critique');
  if (modalCritique) {
    modalCritique.style.borderTop = `1px dashed ${activeColor}`;
    modalCritique.style.paddingTop = '12px';
    modalCritique.style.marginTop = '12px';
    
    

    const detailedCritique = `
      <div style="padding: 10px; background: ${activeColor}06; border-radius: 4px; border: 1px solid ${activeColor}15; font-family: var(--font); font-size: 11px;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed ${activeColor}30; padding-bottom:6px; margin-bottom:8px;">
          <strong style="color:var(--text); letter-spacing:0.5px;">${'ECRE COGNITIVE APPRAISAL v2.6.2'}</strong>
          <span style="color:${activeColor}; font-weight:bold; letter-spacing:1px; background:${activeColor}15; padding:2px 6px; border-radius:3px; font-size:9px;">${stateText}</span>
        </div>
        <div style="margin-bottom:8px; line-height:1.4; color:var(--text-dim)">
          ${`// CNS consistency index evaluated at <span style="color:var(--text); font-weight:600">${vector.compliancePct}%</span>. Active streak remains at <span style="color:var(--text); font-weight:600">${S.streak} days</span>.`}
        </div>
        <div style="margin-bottom:8px;">
          <div style="color:${activeColor}; font-weight:bold; text-transform:uppercase; font-size:9px; margin-bottom:4px; letter-spacing:0.5px;">${'[Positive Integrations]'}</div>
          <div style="display:flex; flex-direction:column; gap:4px; padding-left:4px;">
            ${vector.positiveNotes.map(n => `<div style="display:flex; gap:6px; align-items:start;"><span style="color:${activeColor}">✔</span><span style="color:var(--text-dim); line-height:1.3;">${n}</span></div>`).join('')}
          </div>
        </div>
        <div style="margin-bottom:8px;">
          <div style="color:var(--red); font-weight:bold; text-transform:uppercase; font-size:9px; margin-bottom:4px; letter-spacing:0.5px;">${'[Diagnostic Anomalies]'}</div>
          <div style="display:flex; flex-direction:column; gap:4px; padding-left:4px;">
            ${vector.advisories.map(n => `<div style="display:flex; gap:6px; align-items:start;"><span style="color:var(--red)">⚠</span><span style="color:var(--text-dim); line-height:1.3;">${n}</span></div>`).join('')}
          </div>
        </div>
        <div style="margin-top:10px; border-top:1px dashed ${activeColor}20; padding-top:8px;">
          <div style="color:${activeColor}; font-weight:bold; text-transform:uppercase; font-size:9px; margin-bottom:4px; letter-spacing:0.5px;">${'[Cybernetic Directive]'}</div>
          <div style="color:var(--text); font-style:italic; padding-left:4px; line-height:1.4;">${vector.directive}</div>
        </div>
      </div>
    `;
    modalCritique.innerHTML = detailedCritique;
  }

  // 4. Setup Canvas drawing helper
  function drawRadar(canvasId, size) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);
    
    const centerX = size / 2;
    const centerY = size / 2;
    const maxRadius = size * 0.33;
    
    // Concentric pentagon dotted grid
    ctx.strokeStyle = activeColor + '18'; // faint grid lines
    ctx.lineWidth = 0.8;
    ctx.setLineDash([1.5, 1.5]);
    for (const rFactor of [0.33, 0.66, 1.0]) {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = -Math.PI / 2 + i * (2 * Math.PI / 5);
        const currRadius = maxRadius * rFactor;
        const x = centerX + currRadius * Math.cos(angle);
        const y = centerY + currRadius * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    
    // Radiating web axes
    ctx.setLineDash([]);
    ctx.strokeStyle = activeColor + '10'; // even fainter radiating lines
    for (let i = 0; i < 5; i++) {
      const angle = -Math.PI / 2 + i * (2 * Math.PI / 5);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + maxRadius * Math.cos(angle), centerY + maxRadius * Math.sin(angle));
      ctx.stroke();
    }
    
    // Active Stats filled area polygon
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = -Math.PI / 2 + i * (2 * Math.PI / 5);
      const statVal = Math.max(0.15, Math.min(1.0, dataPoints[i]));
      const r = statVal * maxRadius;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = activeColor + '20'; // transparent fill
    ctx.fill();
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    
    // Glowing dots at coordinate vertices
    ctx.save();
    ctx.fillStyle = activeColor;
    ctx.shadowColor = activeColor;
    ctx.shadowBlur = 5;
    for (let i = 0; i < 5; i++) {
      const angle = -Math.PI / 2 + i * (2 * Math.PI / 5);
      const statVal = Math.max(0.15, Math.min(1.0, dataPoints[i]));
      const r = statVal * maxRadius;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.restore();
    
    // Tiny outer labels
    const textDimColor = docStyles.getPropertyValue('--text-dim').trim() || '#888';
    ctx.fillStyle = textDimColor;
    const fontSize = Math.max(7, Math.round(size * 0.075));
    ctx.font = fontSize + 'px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const labelNames = ['CNS', 'RIG', 'FOC', 'RUT', 'STM'];
    const labelMargin = size * 0.09;
    for (let i = 0; i < 5; i++) {
      const angle = -Math.PI / 2 + i * (2 * Math.PI / 5);
      const labelRadius = maxRadius + labelMargin;
      const x = centerX + labelRadius * Math.cos(angle);
      const y = centerY + labelRadius * Math.sin(angle);
      
      let adjX = x;
      let adjY = y;
      if (i === 0) adjY -= 2; // CNS
      if (i === 1) adjX += 2; // RIG
      if (i === 2) adjY += 2; // FOC
      if (i === 3) adjY += 2; // RUT
      if (i === 4) adjX -= 2; // STM
      
      ctx.fillText(labelNames[i], adjX, adjY);
    }
  }

  // Draw dashboard radar chart (110px) and modal diagnostic radar chart (160px)
  drawRadar('coherence-radar', 110);
  drawRadar('modal-coherence-radar', 160);
}

function initCoherenceWave() {
  // Option B: Wave animation disabled. Static radar chart used instead.
}

function triggerECRECheck(actionName) {
  const vector = compileCognitiveVector();
  // 30% chance on action to avoid terminal spam
  if (Math.random() < 0.30) {
    const statusPrefix = `[ECRE: ${vector.state}]`;
    const type = vector.state === 'DEEP_SYNC' ? 'ok' : (vector.state === 'TURBULENT' ? 'warning' : 'err');
    addLog(type, `${statusPrefix} Coherence index: ${vector.compliancePct}% -- ${vector.critique}`);
  }
}

function printECREDiagnosticBoot() {
  const vector = compileCognitiveVector();
  addLog('info', `[ECRE] Cognitive Observer initialized. Weekly integration index: ${vector.compliancePct}%.`);
  const statusPrefix = `[ECRE: ${vector.state}]`;
  const type = vector.state === 'DEEP_SYNC' ? 'ok' : (vector.state === 'TURBULENT' ? 'warning' : 'err');
  addLog(type, `${statusPrefix} System appraisal: ${vector.critique}`);
}

function seedDemoDataVariant(variant) {
  const sub = variant || 'seed';
  
  // Base properties
  S.xp = 4250;
  S.xpToday = 180;
  S.streak = 12;
  S.totalHours = 38.5;
  S.weekHours = 10.5;
  S.theme = 'default';
  
  // Set auth credentials
  S.authEmail = 'demo@ethos.io';
  S.authUsername = 'demo';
  
  const allEthe = getAllEthe();
  S.history = {};
  
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();
  const twoDaysAgo = new Date(); twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = twoDaysAgo.toDateString();
  
  // Setup standard base history dates
  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toDateString();
    S.history[dateStr] = {};
  }
  
  S.waterLogs = S.waterLogs || {};
  S.swimHistory = S.swimHistory || [];
  S.swimHistory = S.swimHistory.filter(entry => entry.date !== yesterdayStr && entry.date !== TODAY);

  if (sub === 'sync') {
    S.xp = 4500;
    S.xpToday = 300;
    S.streak = 12;
    S.totalHours = 42.0;
    S.weekHours = 12.0;
    S.waterLogs[TODAY] = 4.0;
    
    // 100% compliance in past 7 days history
    for (const dateStr in S.history) {
      allEthe.forEach(e => {
        S.history[dateStr][e.id] = true;
      });
    }
    
    // 100% compliance today
    S.routines.forEach(r => {
      r.ethe.forEach(e => {
        e.done = true;
      });
    });
    
    S.swimHistory.push({
      date: normalizeDateToISO(yesterdayStr),
      status: 'Swam',
      sessions: [
        { time: '8:30pm to 10:10pm', duration: 100, comment: 'yesterday, 22 May', laps: 25, distance: 1250, calories: 700 }
      ]
    });
    S.swimHistory.push({
      date: normalizeDateToISO(TODAY),
      status: 'Swam',
      sessions: [
        { time: '11:00am to 12:00pm', duration: 60, comment: 'morning swim', laps: 20, distance: 1000, calories: 420 }
      ]
    });
    
  } else if (sub === 'turbulent') {
    S.xp = 4120;
    S.xpToday = 90;
    S.streak = 12;
    S.totalHours = 35.0;
    S.weekHours = 8.0;
    S.waterLogs[TODAY] = 1.8; // under 3.5L hydration deficit
    
    // ~65% compliance in past 7 days history
    for (const dateStr in S.history) {
      allEthe.forEach(e => {
        let done = Math.random() < 0.65;
        // Ensure yesterday and 2 days ago math proofs (id 3) was done to avoid degraded skips
        if (e.id === 3 && (dateStr === yesterdayStr || dateStr === twoDaysAgoStr)) {
          done = true;
        }
        S.history[dateStr][e.id] = done;
      });
    }
    
    // ~50% compliance today, math proofs (id 3) incomplete
    let index = 0;
    S.routines.forEach(r => {
      r.ethe.forEach(e => {
        if (e.id === 3) {
          e.done = false;
        } else {
          e.done = (index % 2 === 0);
          index++;
        }
      });
    });
    
    S.swimHistory.push({
      date: normalizeDateToISO(yesterdayStr),
      status: 'Swam',
      sessions: [
        { time: '8:30pm to 9:15pm', duration: 45, comment: 'Easy swim', laps: 18, distance: 900, calories: 405 }
      ]
    });
    
  } else if (sub === 'degraded') {
    S.xp = 3800;
    S.xpToday = 30;
    S.streak = 2; // streak drop
    S.totalHours = 28.5;
    S.weekHours = 4.0;
    S.waterLogs[TODAY] = 0.8; // severe hydration deficit
    
    // ~30% compliance in past 7 days history, math proofs (id 3) skipped yesterday and 2 days ago
    for (const dateStr in S.history) {
      allEthe.forEach(e => {
        let done = Math.random() < 0.30;
        if (e.id === 3 && (dateStr === yesterdayStr || dateStr === twoDaysAgoStr)) {
          done = false; // forced skips for yesterday & two days ago
        }
        S.history[dateStr][e.id] = done;
      });
    }
    
    // < 30% compliance today, math proofs (id 3) incomplete
    let index = 0;
    S.routines.forEach(r => {
      r.ethe.forEach(e => {
        if (e.id === 3) {
          e.done = false;
        } else {
          e.done = (index % 4 === 0); // ~25% compliance today
          index++;
        }
      });
    });
    
    // No swim history
    
  } else {
    // Default standard baseline seed data
    S.xp = 4250;
    S.xpToday = 180;
    S.streak = 12;
    S.totalHours = 38.5;
    S.weekHours = 10.5;
    S.waterLogs[TODAY] = 4.0;
    
    for (const dateStr in S.history) {
      allEthe.forEach(e => {
        let done = Math.random() < 0.88;
        if (e.id === 3 && (dateStr === yesterdayStr || dateStr === twoDaysAgoStr)) {
          done = true;
        }
        S.history[dateStr][e.id] = done;
      });
    }
    
    S.routines.forEach(r => {
      r.ethe.forEach(e => {
        if (r.id === 'g1' || r.id === 'g4' || r.id === 'g5') {
          e.done = true;
        } else if (r.id === 'g2') {
          e.done = e.id === 4 || e.id === 5;
        } else if (r.id === 'g7') {
          e.done = e.id === 401 || e.id === 402;
        } else {
          e.done = false;
        }
      });
    });
    
    S.swimHistory.push({
      date: normalizeDateToISO(yesterdayStr),
      status: 'Swam',
      sessions: [
        { time: '8:00pm to 9:00pm', duration: 60, comment: 'Easy swim', laps: 25, distance: 1250, calories: 540 }
      ]
    });
  }
  
  // Seed some realistic terminal logs depending on state
  S.logs = [
    { type: 'info', msg: 'System initialized on GRCh38 genomic coordinates.', time: Date.now() - 3600000 * 4 },
    { type: 'ok', msg: `oracle i swam from 8pm to 10:10 pm, 25 laps, easy (logged via Oracle Swim)`, time: Date.now() - 3600000 * 3 },
    { type: 'ok', msg: 'focus session completed (50m) +48 xp (Flow Buff)', time: Date.now() - 3600000 * 2 },
  ];
  
  const vector = compileCognitiveVector();
  S.logs.push({ type: 'info', msg: `[ECRE] Cognitive Observer initialized. Weekly integration index: ${vector.compliancePct}%.`, time: Date.now() - 60000 });
  
  const statusPrefix = `[ECRE: ${vector.state}]`;
  const type = vector.state === 'DEEP_SYNC' ? 'ok' : (vector.state === 'TURBULENT' ? 'warning' : 'err');
  S.logs.push({ type: type, msg: `${statusPrefix} System appraisal: ${vector.critique}`, time: Date.now() - 50000 });
  
  // Save state
  ss(true);
  
  // Print diagnostic log
  printECREDiagnosticBoot();
  
  // Render full screen update
  render();
}

function seedDemoData() {
  seedDemoDataVariant('seed');
}

function updateOracleKeyStatus() {
  const statusEl = document.getElementById('oracle-key-status');
  const inputEl = document.getElementById('oracle-key-input');
  if (statusEl) {
    if (S.geminiKey) {
      statusEl.textContent = 'ONLINE';
      statusEl.style.color = 'var(--accent)';
    } else {
      statusEl.textContent = 'OFFLINE';
      statusEl.style.color = 'var(--red)';
    }
  }
  if (inputEl && S.geminiKey) {
    inputEl.value = S.geminiKey;
  }
}
