const ALLOWED_ORIGINS = [
  'https://ethos-jet.vercel.app',
  'http://localhost:8080',
  'http://127.0.0.1:8080'
];

export default async function handler(req, res) {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS.includes(origin) ? origin : 'https://ethos-jet.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  let syncReady = !!(
    process.env.FIREBASE_WEB_API_KEY &&
    process.env.KV_REST_API_URL &&
    process.env.KV_REST_API_TOKEN
  );

  let reason = syncReady ? 'configured' : 'env_vars_missing';

  if (syncReady) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 1500);
      const r = await fetch(process.env.KV_REST_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.KV_REST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['PING']),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      syncReady = r.ok;
      reason = r.ok ? 'kv_live' : 'kv_unreachable';
    } catch (e) {
      syncReady = false;
      reason = 'kv_probe_failed';
    }
  }

  return res.status(200).json({ status: 'ok', sync_ready: syncReady, reason, timestamp: Date.now() });
}
