/**
 * Reads the raw request body as a string from an IncomingMessage stream.
 * Vercel serverless functions do NOT auto-parse req.body, so we must do it.
 */
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk.toString(); });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Extract auth token — prefer Authorization header from client, fallback to Vercel env var
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (process.env.VITE_COHERE_API_KEY || '');

  const { path } = req.query;
  const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '/v2/chat';
  const targetUrl = `https://api.cohere.com${cleanPath}`;

  try {
    const rawBody = await getRawBody(req);

    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      ...(rawBody ? { body: rawBody } : {}),
    });

    const responseText = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', 'application/json');
    res.send(responseText);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
