// Sveltia CMS GitHub OAuth Provider for Vercel
// Compatible with sveltia-cms-auth style implementation

// Vercel Serverless Function style
export default async function handler(req, res) {
  try {
    const url = new URL(`https://${req.headers.host}${req.url}`);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state') || '';
    
    // Get environment variables
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return res.status(500).json({
        error: 'Server configuration error: Missing OAuth credentials'
      });
    }

    // Get the host from headers or use default
    const host = req.headers.host || 'hotier.cc.cd';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const origin = `${protocol}://${host}`;
    
    // Step 1: Redirect to GitHub OAuth if no code
    if (!code) {
      const redirectUri = `${origin}/auth`;
      
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'repo,user',
        state: state
      });
      
      return res.redirect(302, `https://github.com/login/oauth/authorize?${params.toString()}`);
    }

    // Step 2: Exchange code for access token
    const redirectUri = `${origin}/auth`;
    
    // Exchange code for token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Sveltia-CMS-Auth'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenRes.json();
    
    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error);
    }

    const accessToken = tokenData.access_token;

    // Get user info
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Sveltia-CMS-Auth'
      }
    });

    if (!userRes.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userData = await userRes.json();

    // Return HTML that posts message to parent window
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authenticating...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .container {
      text-align: center;
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .success { color: #28a745; }
    .error { color: #dc3545; }
  </style>
</head>
<body>
  <div class="container">
    <h2 id="status">Authenticating...</h2>
    <p id="message">Please wait while we complete the authentication.</p>
  </div>
  
  <script>
    (function() {
      const statusEl = document.getElementById('status');
      const messageEl = document.getElementById('message');
      
      function sendMessage() {
        if (!window.opener) {
          statusEl.textContent = 'Error';
          statusEl.className = 'error';
          messageEl.textContent = 'Cannot communicate with parent window. Please close this window and try again.';
          return;
        }
        
        const message = {
          type: 'authorization:github:success',
          provider: 'github',
          token: '${accessToken}',
          user: {
            login: '${userData.login}',
            name: '${userData.name || userData.login}',
            email: '${userData.email || ''}'
          }
        };
        
        // Send to specific origin for security
        window.opener.postMessage(message, '${origin}');
        
        // Also try with wildcard as fallback (some CMS versions expect this)
        window.opener.postMessage(message, '*');
        
        statusEl.textContent = 'Success!';
        statusEl.className = 'success';
        messageEl.textContent = 'Authentication completed. You can close this window.';
        
        // Close window after a short delay
        setTimeout(function() {
          window.close();
        }, 1500);
      }
      
      // Send message when page loads
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', sendMessage);
      } else {
        sendMessage();
      }
    })();
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).send(html);

  } catch (error) {
    console.error('OAuth Error:', error);
    
    const errorHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Authentication Error</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .container {
      text-align: center;
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      max-width: 400px;
    }
    .error { color: #dc3545; }
    .details {
      margin-top: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 4px;
      font-size: 0.875rem;
      color: #666;
      word-break: break-word;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2 class="error">Authentication Failed</h2>
    <p>${error.message}</p>
    <div class="details">
      <strong>Error Details:</strong><br>
      ${error.message}
    </div>
    <p style="margin-top: 1.5rem;">
      <button onclick="window.close()" style="padding: 0.5rem 1rem; cursor: pointer;">Close Window</button>
    </p>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(400).send(errorHtml);
  }
}
