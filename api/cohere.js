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

  // Vercel auto-parses application/json bodies into req.body — use it directly
  const bodyToSend = req.body != null ? JSON.stringify(req.body) : undefined;

  // Extract auth token — prefer Authorization header from client, fallback to Vercel env var
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (process.env.VITE_COHERE_API_KEY || '');

  // Extract sub-path from query param: /api/cohere?path=/v2/chat
  const pathParam = req.query.path || '/v2/chat';
  const cleanPath = pathParam.startsWith('/') ? pathParam : `/${pathParam}`;
  const targetUrl = `https://api.cohere.com${cleanPath}`;

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      ...(bodyToSend != null ? { body: bodyToSend } : {}),
    });

    const responseText = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', 'application/json');
    res.send(responseText);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
