const FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY;

const ALLOWED_ORIGINS = [
  'https://ethos-jet.vercel.app',
  'http://localhost:8080',
  'http://127.0.0.1:8080'
];

function setCors(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://ethos-jet.vercel.app');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept');
}

async function verifyFirebaseUser(req) {
  if (!FIREBASE_WEB_API_KEY) {
    const err = new Error('Server misconfigured: FIREBASE_WEB_API_KEY is not set');
    err.statusCode = 500;
    throw err;
  }

  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    const err = new Error('Missing Firebase ID token');
    err.statusCode = 401;
    throw err;
  }

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_WEB_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: match[1] }),
  });

  if (!response.ok) {
    const err = new Error('Invalid Firebase ID token');
    err.statusCode = 401;
    throw err;
  }

  const data = await response.json();
  const user = data.users && data.users[0];
  if (!user || !user.localId) {
    const err = new Error('Firebase token did not resolve to a user');
    err.statusCode = 401;
    throw err;
  }

  return user;
}

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (!kvUrl || !kvToken) {
    return res.status(500).json({ error: 'Server misconfigured: Vercel KV credentials not set' });
  }

  try {
    const user = await verifyFirebaseUser(req);
    const keyName = `sync:${user.localId}`;

    if (req.method === 'GET') {
      const response = await fetch(kvUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${kvToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(['GET', keyName]),
      });
      if (!response.ok) {
        const errorBody = await response.text();
        return res.status(response.status).json({ error: 'Vercel KV read failed', status: response.status, detail: errorBody });
      }
      const resData = await response.json();
      const rawValue = resData.result;
      if (rawValue === null || rawValue === undefined) {
        // Explicitly signal "no data" rather than ambiguous null.
        return res.status(200).json({ exists: false });
      }
      try {
        const parsed = JSON.parse(rawValue);
        return res.status(200).json({ exists: true, ...parsed });
      } catch (parseErr) {
        return res.status(200).json({ exists: true, raw: rawValue });
      }
    }

    // PUT: server-authoritative timestamp
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const serverNow = Date.now();
    const toStore = {
      state: body.state,
      lastUpdated: serverNow,
      pushCount: typeof body.pushCount === 'number' ? body.pushCount : 0,
    };
    const response = await fetch(kvUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${kvToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['SET', keyName, JSON.stringify(toStore)]),
    });
    if (!response.ok) {
      const errorBody = await response.text();
      return res.status(response.status).json({ error: 'Vercel KV write failed', status: response.status, detail: errorBody });
    }
    return res.status(200).json({ ok: true, lastUpdated: serverNow });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      error: statusCode === 401 ? 'Unauthorized' : 'Internal server error',
      message: err.message || String(err),
    });
  }
}
