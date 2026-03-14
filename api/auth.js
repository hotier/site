export default function handler(req, res) {
  const { provider, site_id, scope } = req.query;
  const clientId = process.env.GITHUB_CLIENT_ID;
  
  // 动态构建回调地址
  const host = req.headers.host;
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/callback?provider=${provider}&site_id=${site_id}&scope=${scope}`;
  
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${scope || 'repo,user'}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  
  res.redirect(url);
}
