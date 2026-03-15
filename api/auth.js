// Sveltia CMS Authenticator for Vercel
// Based on https://github.com/sveltia/sveltia-cms-auth

export default async function handler(request) {
  // Get URL and search params
  let url;
  let searchParams;
  
  try {
    // For production Vercel environment
    url = new URL(request.url);
    searchParams = url.searchParams;
  } catch (error) {
    // For local development
    const fullUrl = `http://localhost:3000${request.url}`;
    url = new URL(fullUrl);
    searchParams = url.searchParams;
  }
  
  const method = request.method || 'GET';
  
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',').map(d => d.trim()) || [];
  
  if (!clientId || !clientSecret) {
    return new Response(
      JSON.stringify({ error: 'Missing GitHub OAuth credentials' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Get origin from headers
  let origin;
  if (request.headers) {
    if (typeof request.headers.get === 'function') {
      origin = request.headers.get('origin');
    } else {
      origin = request.headers.origin;
    }
  }
  
  const corsHeaders = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  // 默认允许 hotier.cc.cd 域名
  const defaultAllowedDomains = ['hotier.cc.cd', 'www.hotier.cc.cd'];
  const allAllowedDomains = [...defaultAllowedDomains, ...allowedDomains];
  
  if (origin) {
    try {
      const hostname = new URL(origin).hostname;
      const isAllowed = allAllowedDomains.some(domain => {
        if (domain.startsWith('*.')) {
          const suffix = domain.slice(2);
          return hostname.endsWith(suffix);
        }
        return hostname === domain;
      });
      
      if (isAllowed) {
        corsHeaders['Access-Control-Allow-Origin'] = origin;
        corsHeaders['Access-Control-Allow-Credentials'] = 'true';
      }
    } catch (error) {
      console.error('Origin parsing error:', error);
    }
  }

  if (method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const code = searchParams.get('code');
  const provider = searchParams.get('provider') || 'github';
  const siteId = searchParams.get('site_id') || '';

  if (method === 'GET' && !code) {
    // Get protocol and host
    let protocol = 'https';
    let host = 'hotier.cc.cd';
    
    if (request.headers) {
      if (typeof request.headers.get === 'function') {
        protocol = request.headers.get('x-forwarded-proto') || protocol;
        host = request.headers.get('host') || host;
      } else {
        protocol = request.headers['x-forwarded-proto'] || protocol;
        host = request.headers.host || host;
      }
    }
    
    const redirectUri = `${protocol}://${host}/auth`;
    
    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
    githubAuthUrl.searchParams.set('client_id', clientId);
    githubAuthUrl.searchParams.set('redirect_uri', redirectUri);
    githubAuthUrl.searchParams.set('scope', 'repo user');
    githubAuthUrl.searchParams.set('state', siteId);
    
    return Response.redirect(githubAuthUrl.toString(), 302);
  }

  if (method === 'GET' && code) {
    try {
      // Get protocol and host
      let protocol = 'https';
      let host = 'hotier.cc.cd';
      
      if (request.headers) {
        if (typeof request.headers.get === 'function') {
          protocol = request.headers.get('x-forwarded-proto') || protocol;
          host = request.headers.get('host') || host;
        } else {
          protocol = request.headers['x-forwarded-proto'] || protocol;
          host = request.headers.host || host;
        }
      }
      
      const redirectUri = `${protocol}://${host}/auth`;
      
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
    (function() {
      const targetOrigin = '${protocol}://${host}';
      const message = {
        type: 'authorization:github:success',
        provider: 'github',
        token: '${tokenData.access_token}',
        user: {
          login: '${userData.login}',
          name: '${userData.name || userData.login}',
          email: '${userData.email || ''}',
        }
      };
      
      if (window.opener) {
        window.opener.postMessage(message, targetOrigin);
        // 延迟关闭窗口，确保消息已发送
        setTimeout(function() {
          window.close();
        }, 100);
      } else {
        document.body.innerHTML = '<h1>Authentication Error</h1><p>Cannot communicate with the parent window. Please close this window and try again.</p>';
      }
    })();
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
