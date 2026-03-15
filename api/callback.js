// Vercel Serverless Function for GitHub OAuth callback
// This handles the OAuth callback from GitHub

export default async function handler(request) {
  const { searchParams } = request;
  const url = new URL(request.url);
  
  // Redirect to auth handler with the code
  const code = searchParams.get('code');
  if (code) {
    const protocol = url.protocol;
    const host = url.host;
    const redirectUrl = new URL(`${protocol}//${host}/api/auth`);
    
    // Pass all query parameters
    searchParams.forEach((value, key) => {
      redirectUrl.searchParams.set(key, value);
    });
    
    return Response.redirect(redirectUrl.toString(), 302);
  }

  return new Response(
    JSON.stringify({ error: 'Missing authorization code' }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
}
