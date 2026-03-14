export default async function handler(req, res) {
  const { code, provider, site_id, scope } = req.query;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const data = await response.json();
    const { access_token, error } = data;

    if (error) {
      return res.status(400).send(`Error: ${error}`);
    }

    // Decap CMS 期望的 HTML 回调页面，用于通过 postMessage 传递 token
    const content = `
      <!DOCTYPE html>
      <html>
      <head><title>Authorizing...</title></head>
      <body>
        <script>
          (function() {
            function recieveMessage(e) {
              console.log("recieveMessage %o", e);
              // 验证来源，防止跨站攻击
              window.opener.postMessage(
                'authorization:${provider}:success:${JSON.stringify({ token: access_token, provider })}',
                e.origin
              );
            }
            window.addEventListener("message", recieveMessage, false);
            window.opener.postMessage("authorizing:${provider}", "*");
          })()
        </script>
      </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(content);
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
}
