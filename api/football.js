export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Auth-Token'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Parse path parameter
  // Vercel serverless functions parse query strings automatically into req.query
  const { path } = req.query;
  if (!path) {
    res.status(400).json({ error: 'Missing path parameter' });
    return;
  }

  // Extract auth token (prefer header from user settings modal, fallback to Env Variable)
  const token = req.headers['x-auth-token'] || process.env.VITE_FOOTBALL_API_KEY;

  // Clean path to ensure correct URL building
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const targetUrl = `https://api.football-data.org/v4${cleanPath}`;

  try {
    const fbResponse = await fetch(targetUrl, {
      headers: {
        'X-Auth-Token': token || '',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    // Extract rate-limit headers to pass back to client
    const avail = fbResponse.headers.get('x-requests-available');
    const reset = fbResponse.headers.get('x-requestcounter-reset');
    if (avail) res.setHeader('x-requests-available', avail);
    if (reset) res.setHeader('x-requestcounter-reset', reset);

    const bodyText = await fbResponse.text();

    res.status(fbResponse.status);
    res.setHeader('Content-Type', 'application/json');
    res.send(bodyText);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
