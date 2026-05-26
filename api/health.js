export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const hasFirebase = !!(process.env.FIREBASE_DATABASE_URL && process.env.FIREBASE_DATABASE_SECRET);
  const hasKv = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

  const rawKey = process.env.SYNC_KEY || '';
  const cleanKey = rawKey.trim().replace(/^["']|["']$/g, '');

  return res.status(200).json({
    status: 'ok',
    timestamp: Date.now(),
    service: 'ethos-sync-gateway',
    storage_type: hasKv ? 'vercel-kv' : (hasFirebase ? 'firebase' : 'unconfigured'),
    firebase_configured: hasFirebase,
    kv_configured: hasKv,
    sync_key_configured: !!process.env.SYNC_KEY,
    sync_key_debug: {
      raw_length: rawKey.length,
      clean_length: cleanKey.length,
      has_quotes: rawKey.startsWith('"') || rawKey.startsWith("'"),
      has_whitespace: rawKey.trim() !== rawKey,
    }
  });
}
