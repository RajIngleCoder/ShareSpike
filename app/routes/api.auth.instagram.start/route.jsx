import { redirect } from "@remix-run/node";

export async function loader({ request }) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');

  console.log(`[IG Start-Remix] Starting Instagram auth for shop: ${shop}`);

  if (!shop) {
    console.error('[IG Start-Remix] No shop parameter provided');
    return new Response(JSON.stringify({ error: 'Shop parameter is missing' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const clientId = process.env.INSTAGRAM_APP_ID;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
  const scope = 'user_profile,user_media'; // Required scopes

  // Use the shop domain as the state parameter for verification on callback
  const state = shop; 

  console.log(`[IG Start-Remix] Redirecting to Instagram auth with state=${state}, redirect_uri=${redirectUri}`);
  
  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&state=${encodeURIComponent(state)}`;

  // Redirect the user to Instagram's authorization page
  return redirect(authUrl);
}

export default function InstagramStart() {
  return null;
} 