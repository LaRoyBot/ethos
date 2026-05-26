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

  // Authenticate via x-sync-key header (self-healing comparison)
  const syncKey = req.headers['x-sync-key'];
  const cleanServerKey = (process.env.SYNC_KEY || '').trim().replace(/^["']|["']$/g, '');
  const cleanClientKey = (syncKey || '').trim().replace(/^["']|["']$/g, '');

  if (!cleanClientKey || cleanClientKey !== cleanServerKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { uid } = req.query;
  if (!uid) {
    return res.status(400).json({ error: 'Missing required query parameter: uid' });
  }

  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (!kvUrl || !kvToken) {
    return res.status(500).json({ error: 'Server misconfigured: Vercel KV credentials not set' });
  }

  const keyName = `sync:${uid}`;

  try {
    if (req.method === 'GET') {
      const response = await fetch(kvUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${kvToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['GET', keyName]),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        return res.status(response.status).json({
          error: 'Vercel KV read failed',
          status: response.status,
          detail: errorBody,
        });
      }

      const resData = await response.json();
      const rawValue = resData.result; // Either a stringified JSON object or null

      if (rawValue === null) {
        return res.status(200).json(null);
      }

      try {
        const parsed = JSON.parse(rawValue);
        return res.status(200).json(parsed);
      } catch (parseErr) {
        return res.status(200).json(rawValue);
      }
    }

    if (req.method === 'PUT') {
      const bodyString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

      const response = await fetch(kvUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${kvToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['SET', keyName, bodyString]),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        return res.status(response.status).json({
          error: 'Vercel KV write failed',
          status: response.status,
          detail: errorBody,
        });
      }

      const parsedBody = JSON.parse(bodyString);
      return res.status(200).json(parsedBody);
    }
  } catch (err) {
    return res.status(500).json({
      error: 'Internal server error',
      message: err.message || String(err),
    });
  }
}
