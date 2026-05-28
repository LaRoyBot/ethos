const ALLOWED_ORIGINS = [
  'https://ethos-jet.vercel.app',
  'http://localhost:8080',
  'http://127.0.0.1:8080'
];

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://ethos-jet.vercel.app');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Secure diagnostic payload to only leak service online status without exposing infrastructure details
  return res.status(200).json({
    status: 'ok',
    timestamp: Date.now()
  });
}
