const CACHE_NAME = 'ethos-init-v2.7.8';
const SHELL = ['./', './index.html', './styles.css', './app.js', './data.js'];
const NETWORK_FIRST = new Set(['/', '/index.html', '/app.js', '/data.js']);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (!req.url.startsWith(self.location.origin)) return;
  const url = new URL(req.url);
  if (url.pathname.startsWith('/api/')) return;
  const isShell = SHELL.some(a => new URL(a, self.location.href).pathname === url.pathname);
  if (!isShell) return;

  const networkFirst = NETWORK_FIRST.has(url.pathname) || url.pathname.endsWith('/');
  if (networkFirst) {
    e.respondWith(
      fetch(req).then(resp => {
        if (resp && resp.ok && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
        }
        return resp;
      }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(resp => {
        if (resp && resp.ok && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
        }
        return resp;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
