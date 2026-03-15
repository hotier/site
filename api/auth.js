// Vercel API Route for GitHub OAuth authentication
// Compatible with Sveltia CMS Authenticator protocol

export default async function handler(req, res) {
  const { method, query, body } = req;
  
  // Get environment variables
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',').map(d => d.trim()) || [];
  
  if (!clientId || !clientSecret) {
    return res.status(500).json({ 
      error: 'Server configuration error: Missing GitHub OAuth credentials' 
    });
  }

  // Handle CORS
  const origin = req.headers.origin;
  if (origin && allowedDomains.length > 0) {
    const hostname = new URL(origin).hostname;
    const isAllowed = allowedDomains.some(domain => {
      if (domain.startsWith('*.')) {
        const suffix = domain.slice(2);
        return hostname.endsWith(suffix);
      }
      return hostname === domain;
    });
    
    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
  }

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Auth endpoint - redirect to GitHub OAuth
  if (method === 'GET' && !query.code) {
    const provider = query.provider || 'github';
    const redirectUri = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/auth/callback`;
    
    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
    githubAuthUrl.searchParams.set('client_id', clientId);
    githubAuthUrl.searchParams.set('redirect_uri', redirectUri);
    githubAuthUrl.searchParams.set('scope', 'repo user');
    githubAuthUrl.searchParams.set('state', query.site_id || '');
    
    return res.redirect(githubAuthUrl.toString());
  }

  // Callback endpoint - handle GitHub OAuth callback
  if (method === 'GET' && query.code) {
    try {
      const redirectUri = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/auth/callback`;
      
      // Exchange code for access token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code: query.code,
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = await tokenResponse.json();
      
      if (tokenData.error) {
        throw new Error(tokenData.error_description || tokenData.error);
      }

      // Get user info
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${tokenData.access_token}`,
          'User-Agent': 'Sveltia-CMS-Auth',
        },
      });

      const userData = await userResponse.json();

      // Return success response for Sveltia CMS
      const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Authentication Successful</title>
  <script>
    window.opener.postMessage({
      type: 'authorization:github:success',
      provider: 'github',
      token: '${tokenData.access_token}',
      user: {
        login: '${userData.login}',
        name: '${userData.name || userData.login}',
        email: '${userData.email || ''}',
      }
    }, '*');
    window.close();
  </script>
</head>
<body>
  <h1>Authentication Successful</h1>
  <p>You can close this window now.</p>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);

    } catch (error) {
      console.error('OAuth error:', error);
      return res.status(500).json({ 
        error: 'Authentication failed',
        message: error.message 
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
