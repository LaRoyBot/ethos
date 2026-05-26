const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, x-sync-key',
};

function setCors(res) {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

export default async function handler(req, res) {
  setCors(res);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET and PUT
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate via x-sync-key header
  const syncKey = req.headers['x-sync-key'];
  if (!syncKey || syncKey !== process.env.SYNC_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { uid } = req.query;
  if (!uid) {
    return res.status(400).json({ error: 'Missing required query parameter: uid' });
  }

  const databaseUrl = process.env.FIREBASE_DATABASE_URL;
  const databaseSecret = process.env.FIREBASE_DATABASE_SECRET;

  if (!databaseUrl || !databaseSecret) {
    return res.status(500).json({ error: 'Server misconfigured: Firebase credentials not set' });
  }

  const firebaseEndpoint = `${databaseUrl}/sync/${uid}.json?auth=${databaseSecret}`;

  try {
    if (req.method === 'GET') {
      const response = await fetch(firebaseEndpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        return res.status(response.status).json({
          error: 'Firebase read failed',
          status: response.status,
          detail: errorBody,
        });
      }

      const data = await response.json();
      return res.status(200).json(data);
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

      const response = await fetch(firebaseEndpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        return res.status(response.status).json({
          error: 'Firebase write failed',
          status: response.status,
          detail: errorBody,
        });
      }

      const data = await response.json();
      return res.status(200).json(data);
    }
  } catch (err) {
    return res.status(500).json({
      error: 'Internal server error',
      message: err.message || String(err),
    });
  }
}
