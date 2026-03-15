// Vercel API Route for GitHub OAuth callback
// This handles the OAuth callback from GitHub

export default async function handler(req, res) {
  const { query } = req;
  
  // Redirect to auth handler with the code
  if (query.code) {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const redirectUrl = new URL(`${protocol}://${host}/api/auth`);
    
    // Pass all query parameters
    Object.keys(query).forEach(key => {
      redirectUrl.searchParams.set(key, query[key]);
    });
    
    return res.redirect(redirectUrl.toString());
  }

  return res.status(400).json({ error: 'Missing authorization code' });
}
