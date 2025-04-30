import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get('shop');

  if (!shop) {
    return NextResponse.json({ error: 'Shop parameter is missing' }, { status: 400 });
  }

  const clientId = process.env.INSTAGRAM_APP_ID;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
  const scope = 'user_profile,user_media'; // Required scopes

  // Use the shop domain as the state parameter for verification on callback
  const state = shop; 

  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&state=${encodeURIComponent(state)}`;

  // Redirect the user to Instagram's authorization page
  return NextResponse.redirect(authUrl);
}
 