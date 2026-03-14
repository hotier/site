export default function handler(req, res) {
  const { provider, site_id, scope } = req.query;
  const clientId = process.env.GITHUB_CLIENT_ID;
  
  // 统一使用 Vercel 项目域名作为回调地址
  const redirectUri = `https://hotier.cc.cd/api/callback?provider=${provider}&site_id=${site_id}&scope=${scope}`;
  
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${scope || 'repo,user'}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  
  res.redirect(url);
}
