export default async function handler(req, res) {
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

  // Vercel auto-parses application/json bodies into req.body
  const bodyToSend = req.body != null ? JSON.stringify(req.body) : undefined;

  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (process.env.VITE_MISTRAL_API_KEY || '');

  const pathParam = req.query.path || '/v1/chat/completions';
  const cleanPath = pathParam.startsWith('/') ? pathParam : `/${pathParam}`;
  const targetUrl = `https://api.mistral.ai${cleanPath}`;

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
