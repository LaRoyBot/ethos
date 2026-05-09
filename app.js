// === FIREBASE CONFIGURATION ===
const firebaseConfig = {
  apiKey: "AIzaSyCOQmc-GacWr2OrGqRKaU3Na4NAePe7_T4",
  authDomain: "ethos-jet.firebaseapp.com",
  projectId: "ethos-jet",
  storageBucket: "ethos-jet.firebasestorage.app",
  messagingSenderId: "936086701935",
  appId: "1:936086701935:web:0b891975a9ee1a5bfe0a9a"
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
  weightLogs: [{ date: '2026-05-19', weight: 91.0, uricAcid: 7.2, hdl: 42, eosinophils: 5.5 }],
  trilumaStartDate: '2026-05-01',
  todayOnlyToggle: true,
  swimFilter: 'all',
  swimSearchQuery: '',
  authEmail: '',
  lastUpdated: 0
});


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
if (S.weightLogs === undefined) S.weightLogs = [{ date: '2026-05-19', weight: 91.0, uricAcid: 7.2, hdl: 42, eosinophils: 5.5 }];
if (S.trilumaStartDate === undefined) S.trilumaStartDate = '2026-05-01';
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
if (S.lastUpdated === undefined) S.lastUpdated = 0;

const TODAY = new Date().toDateString();
if (S.lastDate !== TODAY) {
  if (S.lastDate) {
    S.history[S.lastDate] = {};
    S.routines.forEach(r => r.ethe.forEach(e => { S.history[S.lastDate][e.id] = e.done; }));
  }
  S.routines.forEach(r => r.ethe.forEach(e => { if(!e.isWater) e.done = false; }));
  S.xpToday = 0; S.lastDate = TODAY; S.activeDate = TODAY; ss();
} else {
  S.routines.forEach(r => r.ethe.forEach(e => {
    if(!e.isWater) {
      e.done = S.history[S.activeDate] ? !!S.history[S.activeDate][e.id] : (S.activeDate === TODAY ? e.done : false);
    }
  }));
}
function ss(skipFirebase = false) {
  if (!skipFirebase) {
    S.lastUpdated = Date.now();
  }
  save('mathInit_state', S);
  if (!skipFirebase && typeof firebase !== 'undefined' && firebase.auth().currentUser) {
    firebaseSyncPush();
  }
}

// === FIREBASE CLOUD SYNC CORE ===
function firebaseSyncPush() {
  if (typeof firebase === 'undefined') return;
  const user = firebase.auth().currentUser;
  if (!user) return;
  
  firebase.database().ref('sync/' + user.uid).set({
    state: S,
    lastUpdated: S.lastUpdated
  }).catch(err => {
    console.error("Firebase push failed:", err);
  });
}

function firebaseSyncPull(callback) {
  if (typeof firebase === 'undefined') {
    if (callback) callback(false, 'Firebase not loaded');
    return;
  }
  const user = firebase.auth().currentUser;
  if (!user) {
    if (callback) callback(false, 'User not authenticated');
    return;
  }
  
  const statusEl = document.getElementById('auth-sync-status');
  if (statusEl) statusEl.textContent = 'Status: syncing with cloud...';
  
  firebase.database().ref('sync/' + user.uid).once('value')
    .then(snapshot => {
      const val = snapshot.val();
      if (val && val.state) {
        const cloudTime = val.lastUpdated || val.state.lastUpdated || 0;
        const localTime = S.lastUpdated || 0;
        
        if (cloudTime > localTime) {
          // Cloud is newer -> Pull & Overwrite local
          const prevAuthEmail = S.authEmail;
          S = val.state;
          S.authEmail = prevAuthEmail;
          ss(true); // save locally without pushing back
          render();
          addLog('info', 'Cloud sync: Pulled newer state from cloud.');
          if (statusEl) statusEl.textContent = 'Status: synced (pulled newer state)';
          if (callback) callback(true, 'pulled');
        } else if (localTime > cloudTime) {
          // Local is newer -> Push local to cloud
          firebaseSyncPush();
          addLog('info', 'Cloud sync: Pushed newer local state to cloud.');
          if (statusEl) statusEl.textContent = 'Status: synced (pushed newer state)';
          if (callback) callback(true, 'pushed');
        } else {
          // Equal -> Synced
          if (statusEl) statusEl.textContent = 'Status: synced (up to date)';
          if (callback) callback(true, 'synced');
        }
      } else {
        // No cloud data -> Push current local state as initial
        firebaseSyncPush();
        addLog('info', 'Cloud sync: Initialized cloud backup with local state.');
        if (statusEl) statusEl.textContent = 'Status: synced (created cloud backup)';
        if (callback) callback(true, 'pushed_initial');
      }
    })
    .catch(err => {
      console.error("Firebase pull failed:", err);
      if (statusEl) statusEl.textContent = 'Status: sync error - ' + err.message;
      if (callback) callback(false, err);
    });
}

function renderSyncPanel() {
  const emailEl = document.getElementById('auth-profile-email');
  const statusEl = document.getElementById('auth-sync-status');
  if (emailEl) {
    emailEl.textContent = S.authEmail || 'unknown';
  }
  if (statusEl && !S.authEmail) {
    statusEl.textContent = 'Status: unauthenticated';
  }
}

function handleLogout() {
  if (typeof firebase === 'undefined') return;
  addLog('info', 'Deauthorizing current terminal session...');
  firebase.auth().signOut().then(() => {
    S.authEmail = '';
    save('mathInit_state', S);
    window.location.reload();
  }).catch(err => {
    console.error("Sign out failed:", err);
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
    init();
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

// === INIT ===
function init() {
  if (S.theme && S.theme !== 'default') document.documentElement.setAttribute('data-theme', S.theme);
  // CRT overlay init
  var crtEl = document.getElementById('crt-screen-effect');
  if (crtEl) { if (S.crtEnabled) crtEl.classList.add('crt-active'); else crtEl.classList.remove('crt-active'); }
  initTabs(); initButtons(); render(); startClock(); startFlowerAnimation();

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
  const passwordInput = document.getElementById('auth-password');
  const errorDisplay = document.getElementById('auth-error-display');
  const toggleDesc = document.getElementById('auth-toggle-desc');
  
  if (!submitBtn || !switchBtn) return;
  
  switchBtn.onclick = () => {
    isSignUpMode = !isSignUpMode;
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
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
      showAuthError('ERROR: Identity and passphrase fields cannot be blank.');
      return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = isSignUpMode ? 'provisioning...' : 'authorizing...';
    if (errorDisplay) errorDisplay.style.display = 'none';
    
    if (isSignUpMode) {
      firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
          addLog('ok', 'Security credentials provisioned successfully.');
        })
        .catch(err => {
          submitBtn.disabled = false;
          submitBtn.textContent = 'register --account';
          showAuthError('REGISTRATION_FAILED: ' + err.message);
        });
    } else {
      firebase.auth().signInWithEmailAndPassword(email, password)
        .then(userCredential => {
          addLog('ok', 'Security clearance granted.');
        })
        .catch(err => {
          submitBtn.disabled = false;
          submitBtn.textContent = 'authorize --session';
          showAuthError('AUTH_FAILED: ' + err.message);
        });
    }
  };
  
  [emailInput, passwordInput].forEach(input => {
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
    errorDisplay.textContent = '// ' + msg;
    errorDisplay.style.display = 'block';
    errorDisplay.style.animation = 'none';
    errorDisplay.offsetHeight; // trigger reflow
    errorDisplay.style.animation = 'shake 0.3s ease';
  }
}

// Wire up authorization gate on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuthGate);
} else {
  initAuthGate();
}

// Wire up Auth Observer
if (typeof firebase !== 'undefined') {
  firebase.auth().onAuthStateChanged(user => {
    authStateFetched = true;
    currentUser = user;
    if (user) {
      S.authEmail = user.email;
      firebaseSyncPull((success, msg) => {
        tryDismissBoot();
      });
    } else {
      S.authEmail = '';
      tryDismissBoot();
    }
  });
} else {
  authStateFetched = true;
  tryDismissBoot();
}

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

  // Interactive terminal
  const termBtn = document.getElementById('open-term-btn');
  if (termBtn) {
    termBtn.onclick = () => {
      document.getElementById('interactive-terminal').classList.add('open');
      document.getElementById('tv-input').focus();
      if (document.getElementById('tv-output').innerHTML === '') {
        var welcomeLogo = 
          '<div style="font-family: monospace; white-space: pre; line-height: 1.4; color: var(--accent);">' +
          '  ███████╗████████╗██╗  ██╗ ██████╗ ███████╗\n' +
          '  ██╔════╝╚══██╔══╝██║  ██║██╔═══██╗██╔════╝\n' +
          '  █████╗     ██║   ███████║██║   ██║███████╗\n' +
          '  ██╔══╝     ██║   ██╔══██║██║   ██║╚════██║\n' +
          '  ███████╗   ██║   ██║  ██║╚██████╔╝███████║\n' +
          '  ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝\n' +
          '</div>' +
          '<div style="margin-top: 8px;">ethos.init v2.4.0 interactive mode. type "help" for commands.</div>';
        printTermTyped(welcomeLogo, 'sys');
      }
    };
  }
  const tvInput = document.getElementById('tv-input');
  if (tvInput) {
    var CLI_COMMANDS = ['help','clear','exit','quit','stats','groups','theme','log','check','uncheck','skills','achievements','ranks','focus','sysinfo','neofetch','crt','water','swim','protocol','auth','logout'];
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
function printTerm(msg, type) {
  type = type || 'sys';
  const out = document.getElementById('tv-output');
  if (!out) return;
  const div = document.createElement('div');
  div.className = 'tv-output-line ' + type;
  div.innerHTML = msg;
  out.appendChild(div);
  out.scrollTop = out.scrollHeight;
}

// Typewriter effect for ASCII art terminal output
// Reveals HTML content character-by-character at ~3ms per char
var _twQueue = Promise.resolve();
function printTermTyped(html, type) {
  type = type || 'sys';
  _twQueue = _twQueue.then(function() {
    return new Promise(function(resolve) {
      var out = document.getElementById('tv-output');
      if (!out) { resolve(); return; }
      var div = document.createElement('div');
      div.className = 'tv-output-line ' + type;
      out.appendChild(div);
      // Strip HTML to get plain text for typing, but keep the wrapper div
      var temp = document.createElement('div');
      temp.innerHTML = html;
      var plainText = temp.textContent || temp.innerText || '';
      // We type out the plain text char by char, then swap in the full HTML at the end
      var cursor = document.createElement('span');
      cursor.className = 'tv-typewriter-cursor';
      div.appendChild(cursor);
      var idx = 0;
      var speed = 3; // ms per character — fast but visible
      var textNode = document.createTextNode('');
      div.insertBefore(textNode, cursor);
      div.style.fontFamily = 'monospace';
      div.style.whiteSpace = 'pre';
      function tick() {
        if (idx < plainText.length) {
          // Add characters in chunks of 3 for speed
          var chunk = plainText.substring(idx, Math.min(idx + 3, plainText.length));
          textNode.textContent += chunk;
          idx += chunk.length;
          out.scrollTop = out.scrollHeight;
          setTimeout(tick, speed);
        } else {
          // Done — swap in the full styled HTML and remove cursor
          div.removeChild(textNode);
          div.removeChild(cursor);
          div.innerHTML = html;
          div.style.fontFamily = '';
          div.style.whiteSpace = '';
          out.scrollTop = out.scrollHeight;
          resolve();
        }
      }
      tick();
    });
  });
}

function handleCommand(cmd) {
  cmd = cmd.trim();
  if (!cmd) return;
  printTerm('<span class="cmd-echo">$ ' + cmd + '</span>');
  const args = cmd.split(' ').filter(x => x);
  const action = args[0].toLowerCase();

  if (action === 'clear') {
    document.getElementById('tv-output').innerHTML = '';
  } else if (action === 'exit' || action === 'quit') {
    document.getElementById('interactive-terminal').classList.remove('open');
  } else if (action === 'help') {
    printTerm('ethos.init commands:<br>- check [ethos] : mark ethos as done<br>- uncheck [ethos] : mark ethos as not done<br>- log [hours] : log study hours<br>- stats : show current stats<br>- groups : show group summary<br>- theme [name] : change theme<br>- skills : show organic mathematical knowledge matrix<br>- focus [mins/pause/resume/abort] : built-in pomodoro focus timer<br>- achievements : display imperial training ranks & badges<br>- protocol : show sequential daily guided flow checklist<br>- crt [on|off|toggle] : toggle CRT scanline overlay<br>- auth [status|logout] : terminal security authorization control<br>- logout : gracefully log out of active session<br>- sysinfo / neofetch : system dashboard<br>- clear : clear terminal<br>- exit : close terminal');
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

    var html = '<div class="term-stats-box">' +
      '<div class="ts-header"><span style="color:var(--text-faint)">///</span> <span class="ts-title">SYS_STATS_DIAGNOSTIC</span> <span class="ts-line"></span></div>' +
      '<div class="ts-grid">' +
        '<div class="ts-cell"><div class="ts-label">GLOBAL_STREAK</div><div class="ts-val" style="color:var(--amber)">' + pad(S.streak, 4) + ' <span class="ts-unit">CYC</span></div></div>' +
        '<div class="ts-cell"><div class="ts-label">NET_EXPERIENCE</div><div class="ts-val" style="color:var(--accent)">' + pad(S.xp, 6) + ' <span class="ts-unit">PTS</span></div></div>' +
        '<div class="ts-cell"><div class="ts-label">TODAY_YIELD</div><div class="ts-val" style="color:var(--blue)">+' + pad(S.xpToday, 3) + ' <span class="ts-unit">XP</span></div></div>' +
        '<div class="ts-cell"><div class="ts-label">UPTIME_HOURS</div><div class="ts-val" style="color:var(--red)">' + (Math.round(S.totalHours * 10) / 10).toFixed(1).padStart(5, '0') + ' <span class="ts-unit">HRS</span></div></div>' +
      '</div>' +
      '<div style="display:flex; gap:16px;">' +
        '<div class="ts-bar-row" style="flex:1">' +
          '<div class="ts-label">LVL ' + pad(level+1, 2) + ' MATRIX_PROGRESS</div>' +
          '<div class="ts-ascii-bar">' + asciiBar + '</div>' +
        '</div>' +
        '<div class="ts-bar-row" style="flex:1; max-width: 120px;">' +
          '<div class="ts-label">ACTIVITY_WAVEFORM</div>' +
          graphHtml +
        '</div>' +
      '</div>' +
    '</div>';
    printTerm(html, 'sys');
  } else if (action === 'groups') {
    S.ethosGroups.forEach(g => {
      const all = getAllEthe().filter(e => e.groupId === g.id);
      const done = all.filter(e => e.done).length;
      printTerm(g.label + ' streak:' + g.streak + ' done:' + done + '/' + all.length, 'ok');
    });
  } else if (action === 'theme') {
    if (args[1]) {
      const t = THEMES.find(x => x.id === args[1] || x.name === args[1]);
      if (t) { S.theme = t.id; document.documentElement.setAttribute('data-theme', t.id === 'default' ? '' : t.id); ss(); renderThemes(); printTerm('theme set to ' + t.name, 'ok'); }
      else printTerm('theme not found. available: ' + THEMES.map(x => x.id).join(', '), 'err');
    } else printTerm('usage: theme [name]', 'err');
  } else if (action === 'log') {
    const hrs = parseFloat(args[1]);
    if (isNaN(hrs)) printTerm('usage: log [hours]', 'err');
    else { document.getElementById('hours-input').value = hrs; logHours(); printTerm('logged ' + hrs + ' hours. total: ' + (Math.round(S.totalHours * 10) / 10) + 'h', 'ok'); }
  } else if (action === 'check' || action === 'uncheck') {
    const query = args.slice(1).join(' ').toLowerCase();
    if (!query) { printTerm('usage: ' + action + ' [ethos name]', 'err'); return; }
    var target = null, targetRIdx = -1;
    S.routines.forEach(function(r, rIdx) { r.ethe.forEach(function(e) { if (e.name.toLowerCase().includes(query)) { target = e; targetRIdx = rIdx; } }); });
    if (target) {
      if (action === 'check' && !target.done) toggleEthos(targetRIdx, target.id);
      else if (action === 'uncheck' && target.done) toggleEthos(targetRIdx, target.id);
      printTerm((action === 'check' ? 'checked' : 'unchecked') + ': ' + target.name, 'ok');
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
    var txt = '<div style="font-family: monospace; white-space: pre; line-height: 1.25; color: var(--accent);">';
    txt += '        /// IMPERIAL ACADEMY ACHIEVEMENT DECK ///\n';
    txt += '        =========================================\n\n';
    
    if (!S.unlockedAchievements) S.unlockedAchievements = {};
    ACHIEVEMENTS.forEach(a => {
      const unlockedDate = S.unlockedAchievements[a.id];
      const isUnlocked = !!unlockedDate;
      const col = isUnlocked ? 'var(--accent)' : 'var(--text-dim)';
      
      txt += '<span style="color:' + col + '">┌─────────────────────────────────────────────────────────┐\n';
      var nameStr = '  ' + a.name.toUpperCase();
      var statusStr = isUnlocked ? '✓ UNLOCKED (' + unlockedDate + ')' : '[ LOCKED ]';
      var padLen = 57 - nameStr.length - statusStr.length;
      txt += nameStr + ' '.repeat(Math.max(2, padLen)) + statusStr + '\n';
      txt += '  ' + a.desc + '\n';
      
      var lines = a.badge.split('\n');
      lines.forEach(l => {
        txt += '  ' + l + '\n';
      });
      txt += '└─────────────────────────────────────────────────────────┘</span>\n\n';
    });
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
      const lastUp = S.lastUpdated ? new Date(S.lastUpdated).toLocaleString() : '<never>';
      printTerm('<span style="color:var(--accent); font-weight:bold;">=== SECURITY CLEARANCE DIODE ===</span><br>' +
                'Firebase Client: ' + (isLoaded ? '<span style="color:var(--accent)">ONLINE</span>' : '<span style="color:var(--red)">OFFLINE (NOT LOADED)</span>') + '<br>' +
                'Active Identity: <span style="color:var(--amber)">' + email + '</span><br>' +
                'Last Sync Merge: <span style="color:var(--blue)">' + lastUp + '</span>', 'info');
    } else if (sub === 'logout' || sub === 'deauthorize') {
      printTerm('Initiating session deauthorization...', 'info');
      handleLogout();
    } else {
      printTerm('<span style="color:var(--accent); font-weight:bold;">=== CLI SECURITY CONTROL ===</span><br>' +
                'Usage:<br>' +
                '  auth status          Show current clearance status<br>' +
                '  auth logout          Deauthorize current terminal session', 'info');
    }
  } else if (action === 'logout') {
    printTerm('Initiating session deauthorization...', 'info');
    handleLogout();
  } else {
    printTerm('command not found: "' + action + '". type \'help\' for commands.', 'err');
  }
}

function renderProtocolCommand() {
  var html = '<div style="font-family: monospace; line-height: 1.4; color: var(--text);">';
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
      var ethos = allEthe.find(function(e) { return e.id === id; });
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
      var ethos = allEthe.find(function(e) { return e.id === id; });
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
      var ethos = allEthe.find(function(e) { return e.id === id; });
      if (ethos) {
        var isOffDay = false;
        if (ethos.id === 203 && ![2, 4, 6].includes(dayOfWeek)) isOffDay = true;
        if (ethos.id === 403 && dayOfWeek !== 2) isOffDay = true;
        if (ethos.id === 301 && ![1, 3, 5].includes(dayOfWeek)) isOffDay = true;
        if (ethos.id === 502 && ![1, 3, 5].includes(dayOfWeek)) isOffDay = true;

        if (isOffDay) return;

        var isCurrent = (currentActive && currentActive.id === ethos.id);
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
    var parts = S.swimHistory[0].date.split('-').map(Number);
    firstDate = new Date(parts[0], parts[1] - 1, parts[2]);
  }
  var uptimeDays = firstDate ? Math.floor((new Date() - firstDate) / 86400000) : 0;

  // Swim streak
  var swimStreak = 0;
  if (S.swimHistory) {
    for (var si = S.swimHistory.length - 1; si >= 0; si--) {
      var se = S.swimHistory[si];
      var sp = se.date.split('-').map(Number);
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

  var props = [
    ['OS',          'ethos.init v2.3.1'],
    ['Shell',       'interactive / JetBrains Mono'],
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
    html += '<span style="color:var(--accent)">' + label + '</span><span style="color:var(--text-faint)">' + dashes + '</span> <span style="color:var(--text-dim)">' + pair[1] + '</span>\n';
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
  var n = document.getElementById('today-note');
  var p = document.getElementById('paper-note');
  if (n && document.activeElement !== n) n.value = S.todayNote || '';
  if (p && document.activeElement !== p) p.value = S.paperNote || '';
}

function getAllEthe() {
  return S.routines.reduce(function(a, r) { return a.concat(r.ethe); }, []);
}

function getFilteredEthe() {
  var all = getAllEthe();
  if (S.activeGroupFilter === 'all') return all;
  return all.filter(function(e) { return e.groupId === S.activeGroupFilter; });
}

function renderStats() {
  var all = getAllEthe(), done = all.filter(function(e) { return e.done; }).length;
  document.getElementById('stat-streak').textContent = S.streak;
  document.getElementById('stat-xp').textContent = S.xp;
  document.getElementById('stat-xp-today').textContent = S.xpToday;
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
    card.innerHTML = '<div class="gc-label" style="color:' + g.color + '">' + g.label + '</div>' +
      '<div class="gc-streak">' + g.streak + ' \uD83D\uDD25</div>' +
      '<div class="gc-progress">' + done + '/' + all.length + ' today</div>' +
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

  var doneCount = all.filter(function(e) { return e.done; }).length;
  var pct = all.length > 0 ? Math.round((doneCount / all.length) * 100) : 0;
  var dateEl = document.getElementById('ethos-date');
  var activeDateObj = new Date(S.activeDate);
  if (dateEl) dateEl.textContent = activeDateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase();
  var todayBadge = document.getElementById('ethos-today-badge');
  if (todayBadge) todayBadge.style.display = (S.activeDate === TODAY) ? 'inline' : 'none';
  var strEl = document.getElementById('ethos-streak-val');
  if (strEl) strEl.textContent = S.streak;
  var shdEl = document.getElementById('ethos-shield-val');
  if (shdEl) shdEl.textContent = Math.floor(S.streak / 7);
  var fill = document.getElementById('dp-bar-fill'), pctEl = document.getElementById('dp-pct');
  if (fill) fill.style.width = pct + '%';
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
    hdr.innerHTML = '<div><div class="r-group-title"><span style="color:' + (r.color || 'inherit') + '">' + r.icon + ' ' + r.title + '</span></div><div class="r-group-sub">' + r.subtitle + '</div></div><div class="r-group-count">[' + doneR + '/' + totalR + '] <span class="hgc-arrow">\u25BE</span></div>';
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
      
      var restTag = isOffDay ? '<span class="rest-day-tag">rest</span>' : '';
      
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
        
        trilumaHtml = `
          <div class="triluma-countdown-box" style="margin-top: 6px;">
            <div class="triluma-header">
              <span>💊 TRILUMA ACTIVE CYCLE</span>
              <span class="${warningClass}">Day ${daysPassed} / 90</span>
            </div>
            <div class="triluma-bar-bg">
              <div class="triluma-bar-fill" style="width: ${pct}%"></div>
            </div>
            <div class="triluma-controls" style="margin-top: 4px;">
              <label style="font-size: 10px; color: var(--text-faint)">Cycle Start:</label>
              <input type="date" class="triluma-date-input" value="${S.trilumaStartDate}">
            </div>
            ${warningText}
          </div>
        `;
      }

      el.innerHTML = `
        <div style="display:flex; align-items:center; width:100%; gap:8px;">
          ${e.isWater ? '' : checkHtml}
          <div class="e-item-info">
            <div class="e-item-name">
              <span style="color:${isDone ? 'inherit' : (e.color || 'inherit')}">${e.name}</span>
              ${e.icon ? ' <span>' + e.icon + '</span>' : ''}
              ${restTag}
              <span class="e-item-group-tag" style="color:${grpColor}">${grp ? grp.label : ''}</span>
            </div>
            ${e.note ? '<div class="e-item-note">' + e.note + '</div>' : ''}
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
      var e = allEthe.find(function(x) { return x.id === id; });
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
      var e = allEthe.find(function(x) { return x.id === id; });
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
    header.innerHTML = `
      <span class="protocol-phase-label">${phaseDef.icon} ${phaseDef.label} <span style="font-size:10px;color:var(--text-dim);font-weight:400;margin-left:4px;">${phaseDef.time}</span></span>
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
      var isCurrent = e.id === currentActiveId;

      var stepNum = stepCounter++;
      var stepNumStr = String(stepNum).padStart(2, '0');

      var el = document.createElement('div');
      var itemClasses = ['protocol-item'];
      if (isDone) itemClasses.push('done');
      if (isCurrent) itemClasses.push('current');
      el.className = itemClasses.join(' ');
      el.setAttribute('data-id', e.id);

      var restTag = isOffDay ? '<span class="rest-day-tag">rest</span>' : '';
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
        
        trilumaHtml = `
          <div class="triluma-countdown-box" style="margin-top: 6px;">
            <div class="triluma-header">
              <span>💊 TRILUMA ACTIVE CYCLE</span>
              <span class="${warningClass}">Day ${daysPassed} / 90</span>
            </div>
            <div class="triluma-bar-bg">
              <div class="triluma-bar-fill" style="width: ${pct}%"></div>
            </div>
            <div class="triluma-controls" style="margin-top: 4px;">
              <label style="font-size: 10px; color: var(--text-faint)">Cycle Start:</label>
              <input type="date" class="triluma-date-input" value="${S.trilumaStartDate}">
            </div>
            ${warningText}
          </div>
        `;
      }

      el.innerHTML = `
        <span class="protocol-step-num">${stepNumStr}.</span>
        ${e.isWater ? '' : checkHtml}
        <div class="protocol-item-name" style="display:flex; flex-direction:column; align-items:flex-start; width:100%;">
          <div style="display:flex; align-items:center; gap:6px; width:100%;">
            <span style="color:${isDone ? 'inherit' : (e.color || 'inherit')}">${e.name}</span>
            ${e.icon ? ' <span>' + e.icon + '</span>' : ''}
            ${restTag}
            <span class="protocol-item-group" style="color:${grpColor}">${grp ? grp.label : ''}</span>
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
    card.innerHTML = '<span class="ac-badge">' + a.badge + '</span>' +
      '<div class="ac-name">' + a.name + '</div>' +
      '<div class="ac-desc">' + a.desc + '</div>' +
      (isUnlocked ? '<div class="ac-date">✓ Unlocked ' + unlockedDate + '</div>' : '<div class="ac-date">// LOCKED</div>');
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
    desc.textContent = SKILL_DESCS[key] || '';
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
  
  const xpGained = Math.round(mins * 0.8);
  S.xp += xpGained;
  S.xpToday += xpGained;
  
  if (!S.focusStats) S.focusStats = { sessions: 0, totalMins: 0, maxSessionMins: 0 };
  S.focusStats.sessions++;
  S.focusStats.totalMins += mins;
  S.focusStats.maxSessionMins = Math.max(S.focusStats.maxSessionMins || 0, mins);
  
  focusLog('Focus session COMPLETE! +' + xpGained + ' XP. logged ' + hrs.toFixed(1) + 'h.');
  addLog('ok', 'focus session completed (' + mins + 'm) +' + xpGained + ' xp');
  
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
  if (pctText) pctText.textContent = pct + '% ACTIVE';

  if (focusSession.active) {
    status.textContent = focusSession.type === 'focus' ? 'FOCUS_ENGAGED' : 'REST_ENGAGED';
    status.className = 'fhud-status-tag blinking';
    typeText.textContent = focusSession.type === 'focus' ? '// TASK_FOCUS' : '// REST_BREAK';
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
  logTerm.scrollTop = logTerm.scrollHeight;
}

function renderPapers() {
  var list = document.getElementById('paper-list'); if (!list) return; list.innerHTML = '';
  S.papers.forEach(function(p) {
    var el = document.createElement('div'); el.className = 'paper-item';
    el.innerHTML = '<div class="paper-item-header"><div class="paper-name">' + p.name + '</div><div class="paper-controls"><select class="terminal-input" style="width:90px;padding:3px 6px;font-size:11px" data-pid="' + p.id + '"><option value="queued"' + (p.status === 'queued' ? ' selected' : '') + '>queued</option><option value="reading"' + (p.status === 'reading' ? ' selected' : '') + '>reading</option><option value="done"' + (p.status === 'done' ? ' selected' : '') + '>done</option></select><button class="ethos-rm" data-pid="' + p.id + '">rm</button></div></div>';
    el.querySelector('select').onchange = function() { updatePaperStatus(p.id, this.value); };
    el.querySelector('.ethos-rm').onclick = function() { removePaper(p.id); };
    list.appendChild(el);
  });
}

function renderLog() {
  var el = document.getElementById('main-log'); if (!el) return;
  var recent = (S.logs || []).slice(-40).reverse();
  if (recent.length === 0) { el.innerHTML = '<div class="log-line"><span class="ts">--:--:--</span><span class="info">[info]</span> ethos.init started. welcome back.</div>'; return; }
  el.innerHTML = recent.map(function(l) { return '<div class="log-line"><span class="ts">' + l.ts + '</span> <span class="' + l.type + '">[' + l.type + ']</span> ' + l.msg + '</div>'; }).join('');
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

// === ACTIONS ===
function toggleEthos(rIdx, eId) {
  var r = S.routines[rIdx], e = r.ethe.find(function(x) { return x.id === eId; });
  if (!e) return;
  e.done = !e.done;
  if (!S.history) S.history = {};
  if (!S.history[S.activeDate]) S.history[S.activeDate] = {};
  S.history[S.activeDate][e.id] = e.done;

  if (e.done) {
    S.xp += e.xp;
    if (S.activeDate === TODAY) S.xpToday += e.xp;
    e.streak++;
    addLog('ok', 'ethos marked: "' + e.name + '" +' + e.xp + ' xp');
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
    S.xp = Math.max(0, S.xp - e.xp);
    if (S.activeDate === TODAY) S.xpToday = Math.max(0, S.xpToday - e.xp);
    e.streak = Math.max(0, e.streak - 1);
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
  if (status === 'done' && was !== 'done') { S.xp += 50; S.xpToday += 50; addLog('ok', 'paper done: "' + p.name + '" +50 xp'); }
  ss(); render();
}

function updateSkill() {
  var skill = document.getElementById('skill-select').value;
  var val = Math.max(0, Math.min(100, parseInt(document.getElementById('skill-value').value) || 0));
  S.skills[skill] = val;
  document.getElementById('skill-value').value = '';
  addLog('info', 'skill updated: ' + skill + ' \u2192 ' + val + '%');
  ss(); render();
}

function logHours() {
  var hrs = parseFloat(document.getElementById('hours-input').value);
  if (isNaN(hrs) || hrs <= 0) return;
  S.totalHours += hrs; S.weekHours += hrs;
  S.xp += Math.round(hrs * 20); S.xpToday += Math.round(hrs * 20);
  document.getElementById('hours-input').value = '';
  document.getElementById('hours-log-msg').textContent = '\u2713 logged ' + hrs + 'h \u2014 total: ' + (Math.round(S.totalHours * 10) / 10) + 'h';
  addLog('ok', hrs + 'h studied +' + Math.round(hrs * 20) + ' xp');
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

function flash(id) { var el = document.getElementById(id); if (!el) return; el.style.display = 'inline'; setTimeout(function() { el.style.display = 'none'; }, 2000); }

function addLog(type, msg) {
  var ts = new Date().toTimeString().slice(0, 8);
  if (!S.logs) S.logs = [];
  S.logs.push({ ts: ts, date: new Date().toDateString(), type: type, msg: msg });
  if (S.logs.length > 200) S.logs = S.logs.slice(-200);
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
  
  let dumbbells = 'REST';
  let swim = 'REST';
  let hair = 'Serums only (AM)';
  let supplements = 'Post-session Whey + Creatine';
  
  if (day === 1) {
    dumbbells = '💪 UPPER BODY at 5:30 PM';
    swim = '🏊 MEDIUM SWIM at 8 PM (90m)';
    hair = '🟢 Serums (AM) · 🟡 Oil Shots (night)';
  } else if (day === 2) {
    dumbbells = 'REST';
    swim = '🏊 HARD SWIM at 8 PM (90m)';
    hair = '🚿 Shampoo + Serums (AM)';
    supplements = '💊 D3 vial with breakfast · post-swim Whey + Creatine';
  } else if (day === 3) {
    dumbbells = '💪 LOWER + CORE at 5:30 PM';
    swim = 'REST';
    hair = '🟢 Serums (AM) · 🟡 Oil Shots (night)';
  } else if (day === 4) {
    dumbbells = 'REST';
    swim = '🏊 EASY SWIM at 8 PM (90m)';
    hair = '🚿 Shampoo + Serums (AM)';
  } else if (day === 5) {
    dumbbells = '💪 FULL BODY at 5:30 PM';
    swim = '🏊 HARD SWIM at 8 PM (90m)';
    hair = '🟢 Serums (AM) · 🟡 Oil Shots (night)';
  } else if (day === 6) {
    dumbbells = 'REST';
    swim = '🏊 MEDIUM SWIM at 8 PM (90m)';
    hair = '🚿 Shampoo + Serums (AM)';
  } else if (day === 0) {
    dumbbells = 'REST';
    swim = '🏊 EASY SWIM at 8 PM (90m)';
    hair = '😴 Scalp rest day (no oil or shampoo)';
  }
  
  container.innerHTML = `
    <div style="background:var(--bg2); border:1px solid var(--border); border-radius:4px; padding:12px; font-size:12px;">
      <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px dashed var(--border2); padding-bottom:6px;">
        <span style="font-weight:700; color:var(--accent);">// EXPECTATIONS FOR ${dayName.toUpperCase()}</span>
        <span style="color:var(--text-dim); font-size:11px;">[ activeDate ]</span>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px 16px;">
        <div><span style="color:var(--text-faint)">🏋️ DUMBBELLS:</span> <span style="color:${dumbbells === 'REST' ? 'var(--text-dim)' : 'var(--amber)'}">${dumbbells}</span></div>
        <div><span style="color:var(--text-faint)">🏊 SWIMMING:</span> <span style="color:${swim === 'REST' ? 'var(--text-dim)' : 'var(--accent)'}">${swim}</span></div>
        <div><span style="color:var(--text-faint)">💇 HAIR CARE:</span> <span style="color:var(--text)">${hair}</span></div>
        <div><span style="color:var(--text-faint)">🥤 SUPPLEMENT:</span> <span style="color:var(--text)">${supplements}</span></div>
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
  
  history.forEach(entry => {
    const [yr, mo, dy] = entry.date.split('-').map(Number);
    const dateObj = new Date(yr, mo - 1, dy);
    const dayOfWeek = dateObj.getDay();
    const isWednesday = dayOfWeek === 3;
    
    if (entry.status === 'Swam' && entry.sessions && entry.sessions.length > 0) {
      totalSwamDays++;
      totalSessions += entry.sessions.length;
      if (entry.sessions.length >= 2) doubleSessions++;
      entry.sessions.forEach(s => { totalDuration += parseInt(s.duration) || 0; });
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
    const [yr, mo, dy] = entry.date.split('-').map(Number);
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
    
    const [yr, mo, dy] = entry.date.split('-').map(Number);
    const dateObj = new Date(yr, mo - 1, dy);
    const dayOfWeek = dateObj.getDay();
    const isWednesday = dayOfWeek === 3;
    
    const badgeClass = isSwam ? 'swim-badge swam' : (isWednesday ? 'swim-badge rest' : 'swim-badge missed');
    const badgeText = isSwam ? (entry.sessions.length >= 2 ? 'double swam' : 'swam') : (isWednesday ? 'scheduled rest' : 'missed');
    
    let detailsHtml = '';
    if (isSwam) {
      const sessionsText = entry.sessions.map(s => `• ${s.time} (${s.duration}m)`).join('<br>');
      const commentsText = entry.sessions.map(s => s.comment ? `// ${s.comment}` : '').filter(x => x).join('<br>');
      detailsHtml = `
        <div class="swim-sessions-txt" style="margin-top:2px;">${sessionsText}</div>
        ${commentsText ? `<div class="swim-comment-txt" style="margin-top:2px; color:var(--text-faint);">${commentsText}</div>` : ''}
      `;
    } else {
      detailsHtml = `<div class="swim-comment-txt" style="margin-top:2px;">${isWednesday ? '// scheduled rest day' : '// rest day or missed session'}</div>`;
    }
    
    const dateFormatted = new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase();
    row.innerHTML = `
      <div class="swim-info-col" style="margin-left:0;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="${badgeClass}">${badgeText}</span>
          <span class="swim-date-txt">${dateFormatted}</span>
        </div>
        ${detailsHtml}
      </div>
      <div class="swim-action-col">
        <button class="ethos-rm" data-date="${entry.date}">rm</button>
      </div>
    `;
    row.querySelector('.ethos-rm').onclick = () => removeSwimDay(entry.date);
    container.appendChild(row);
  });
}

function logSwimSession() {
  const dateInput = document.getElementById('swim-input-date');
  const timeInput = document.getElementById('swim-input-time');
  const durInput = document.getElementById('swim-input-duration');
  const commentInput = document.getElementById('swim-input-comment');
  
  const date = dateInput.value;
  if (!date) return;
  
  const time = timeInput.value.trim();
  const duration = parseInt(durInput.value) || 0;
  const comment = commentInput.value.trim();
  
  if (!S.swimHistory) S.swimHistory = [];
  let entry = S.swimHistory.find(x => x.date === date);
  const isSwamLog = time && duration > 0;
  
  if (isSwamLog) {
    const sessionObj = { time, duration, comment };
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
    
    S.xp += 30;
    if (date === TODAY) S.xpToday += 30;
    addLog('ok', `swim logged: ${duration} mins on ${date}. +30 xp`);
    
    // Auto-complete swim ethos (id 303)
    S.routines.forEach((r, rIdx) => {
      const e = r.ethe.find(x => x.id === 303);
      if (e) {
        if (!S.history[date]) S.history[date] = {};
        if (!S.history[date][e.id]) {
          S.history[date][e.id] = true;
          if (date === S.activeDate) e.done = true;
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
  
  timeInput.value = '';
  durInput.value = '';
  commentInput.value = '';
  checkAchievements();
  ss();
  render();
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
    
    S.routines.forEach(r => {
      const e = r.ethe.find(x => x.id === 303);
      if (e) {
        if (S.history[date]) S.history[date][e.id] = false;
        if (date === S.activeDate) e.done = false;
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
