// Sveltia CMS Authenticator for Vercel
// Based on https://github.com/sveltia/sveltia-cms-auth

export default async function handler(request) {
  const { searchParams, method } = request;
  const url = new URL(request.url);
  
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',').map(d => d.trim()) || [];
  
  if (!clientId || !clientSecret) {
    return new Response(
      JSON.stringify({ error: 'Missing GitHub OAuth credentials' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const origin = request.headers.get('origin');
  const corsHeaders = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
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
      corsHeaders['Access-Control-Allow-Origin'] = origin;
    }
  }

  if (method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const code = searchParams.get('code');
  const provider = searchParams.get('provider') || 'github';
  const siteId = searchParams.get('site_id') || '';

  if (method === 'GET' && !code) {
    const protocol = url.protocol;
    const host = url.host;
    const redirectUri = `${protocol}//${host}/api/callback`;
    
    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
    githubAuthUrl.searchParams.set('client_id', clientId);
    githubAuthUrl.searchParams.set('redirect_uri', redirectUri);
    githubAuthUrl.searchParams.set('scope', 'repo user');
    githubAuthUrl.searchParams.set('state', siteId);
    
    return Response.redirect(githubAuthUrl.toString(), 302);
  }

  if (method === 'GET' && code) {
    try {
      const protocol = url.protocol;
      const host = url.host;
      const redirectUri = `${protocol}//${host}/api/callback`;
      
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = await tokenResponse.json();
      
      if (tokenData.error) {
        throw new Error(tokenData.error_description || tokenData.error);
      }

      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${tokenData.access_token}`,
          'User-Agent': 'Sveltia-CMS-Auth',
        },
      });

      const userData = await userResponse.json();

      const html = `<!DOCTYPE html>
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

      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          ...corsHeaders,
        },
      });

    } catch (error) {
      console.error('OAuth error:', error);
      return new Response(
        JSON.stringify({ error: 'Authentication failed', message: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}
