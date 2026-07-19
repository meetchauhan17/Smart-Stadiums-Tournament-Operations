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
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Auth-Token'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Use WHATWG URL API (no deprecated url.parse) to read query params
  const baseUrl = `https://placeholder${req.url}`;
  const urlObj = new URL(baseUrl);
  const pathParam = urlObj.searchParams.get('path');

  if (!pathParam) {
    res.status(400).json({ error: 'Missing path parameter' });
    return;
  }

  // Extract auth token (prefer header from user settings modal, fallback to Env Variable)
  const token = req.headers['x-auth-token'] || process.env.VITE_FOOTBALL_API_KEY || '';

  // Build full query string to forward (everything after 'path=...' excluded, forward rest)
  // We need to forward additional params like ?status=LIVE etc.
  // Reconstruct the sub-path including any extra query params encoded within it
  const cleanPath = pathParam.startsWith('/') ? pathParam : `/${pathParam}`;

  // Forward any extra search params (e.g. ?status=LIVE) that were part of the path value
  const extraParams = new URLSearchParams();
  urlObj.searchParams.forEach((val, key) => {
    if (key !== 'path') extraParams.append(key, val);
  });
  const extraStr = extraParams.toString();
  const targetUrl = `https://api.football-data.org/v4${cleanPath}${extraStr ? `?${extraStr}` : ''}`;

  try {
    const fbResponse = await fetch(targetUrl, {
      headers: {
        'X-Auth-Token': token,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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
