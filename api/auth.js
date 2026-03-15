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
      // Set strong cache control headers
      setNoCacheHeaders(res);
      return res.status(500).json({
        error: 'Server configuration error: Missing OAuth credentials'
      });
    }

    // Hardcode the exact redirect URI to match GitHub OAuth App configuration
    // This must match exactly what's in your GitHub OAuth App settings
    const redirectUri = 'https://hotier.cc.cd/auth';
    const origin = 'https://hotier.cc.cd';
    
    // Step 1: Redirect to GitHub OAuth if no code
    if (!code) {
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'repo,user',
        state: state,
        // Add timestamp to prevent caching
        timestamp: Date.now().toString()
      });
      
      // Set strong cache control headers for redirect
      setNoCacheHeaders(res);
      return res.redirect(302, `https://github.com/login/oauth/authorize?${params.toString()}`);
    }

    // Step 2: Exchange code for access token
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
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
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
    .debug {
      margin-top: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 4px;
      font-size: 0.875rem;
      color: #666;
      max-width: 400px;
      margin: 0 auto;
      word-break: break-word;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2 id="status">Authenticating...</h2>
    <p id="message">Please wait while we complete the authentication.</p>
    <div class="debug" id="debug"></div>
  </div>
  
  <script>
    (function() {
      const statusEl = document.getElementById('status');
      const messageEl = document.getElementById('message');
      const debugEl = document.getElementById('debug');
      
      function logDebug(message) {
        console.log('Auth Debug:', message);
        debugEl.innerHTML += '<p>' + message + '</p>';
      }
      
      function sendMessage() {
        logDebug('Starting sendMessage function');
        
        if (!window.opener) {
          logDebug('Window opener is null');
          statusEl.textContent = 'Error';
          statusEl.className = 'error';
          messageEl.textContent = 'Cannot communicate with parent window. Please close this window and try again.';
          return;
        }
        
        logDebug('Window opener exists: ' + window.opener.location.href);
        
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
        
        logDebug('Message to send: ' + JSON.stringify(message));
        
        try {
          // 尝试多次发送，确保消息送达
          logDebug('Sending message to: ${origin}');
          window.opener.postMessage(message, '${origin}');
          
          logDebug('Sending message to: *');
          window.opener.postMessage(message, '*');
          
          // 延迟后再次发送
          setTimeout(() => {
            logDebug('Sending message again after 100ms to: ${origin}');
            window.opener.postMessage(message, '${origin}');
            logDebug('Sending message again after 100ms to: *');
            window.opener.postMessage(message, '*');
          }, 100);
          
          // 再次延迟发送，确保可靠性
          setTimeout(() => {
            logDebug('Sending message again after 200ms to: ${origin}');
            window.opener.postMessage(message, '${origin}');
            logDebug('Sending message again after 200ms to: *');
            window.opener.postMessage(message, '*');
          }, 200);
          
          // 增加额外的发送尝试
          setTimeout(() => {
            logDebug('Sending message again after 500ms to: ${origin}');
            window.opener.postMessage(message, '${origin}');
            logDebug('Sending message again after 500ms to: *');
            window.opener.postMessage(message, '*');
          }, 500);
          
          statusEl.textContent = 'Success!';
          statusEl.className = 'success';
          messageEl.textContent = 'Authentication completed. You can close this window.';
          logDebug('Authentication successful, messages sent');
          
          // 延迟关闭窗口，确保消息有足够时间发送
          setTimeout(() => {
            logDebug('Closing window after 3000ms');
            window.close();
          }, 3000);
        } catch (error) {
          logDebug('postMessage error: ' + error.message);
          statusEl.textContent = 'Error';
          statusEl.className = 'error';
          messageEl.textContent = 'Failed to send authentication result. Please close this window and try again.';
        }
      }
      
      // 立即发送消息
      logDebug('Page loaded, starting authentication process');
      sendMessage();
    })();
  </script>
</body>
</html>`;

    // Set strong cache control headers
    setNoCacheHeaders(res);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);

  } catch (error) {
    console.error('OAuth Error:', error);
    
    const errorHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Authentication Error</title>
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
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

    // Set strong cache control headers
    setNoCacheHeaders(res);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(400).send(errorHtml);
  }
}

// Helper function to set strong no-cache headers
function setNoCacheHeaders(res) {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  // Add CDN-specific headers
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('Vary', '*');
  // Add additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
}
