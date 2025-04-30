import { redirect } from "@remix-run/node";
import { supabase } from "../../supabase.server";

// Token Exchange function - Short lived token
async function exchangeCodeForToken(code) {
  console.log('[IG Callback] Attempting to exchange code for token...');
  const url = 'https://api.instagram.com/oauth/access_token';
  const body = new URLSearchParams({
    client_id: process.env.INSTAGRAM_APP_ID,
    client_secret: process.env.INSTAGRAM_APP_SECRET,
    grant_type: 'authorization_code',
    redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
    code: code,
  });
  try {
    const response = await fetch(url, { 
      method: 'POST', 
      body: body, 
      headers: {'Content-Type': 'application/x-www-form-urlencoded'} 
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[IG Callback] Error exchanging code for token:', errorData);
      throw new Error(`Failed to exchange code for token: ${response.statusText}`);
    }
    const data = await response.json();
    console.log('[IG Callback] Successfully exchanged code for short-lived token and user_id.');
    return data;
  } catch (error) {
    console.error('[IG Callback] Exception in exchangeCodeForToken:', error);
    throw error;
  }
}

// Token Exchange function - Long lived token
async function exchangeForLongLivedToken(shortLivedToken) {
  console.log('[IG Callback] Attempting to exchange short-lived token for long-lived token...');
  const url = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_APP_SECRET}&access_token=${shortLivedToken}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[IG Callback] Error exchanging for long-lived token:', errorData);
      throw new Error(`Failed to exchange for long-lived token: ${response.statusText}`);
    }
    const data = await response.json();
    console.log('[IG Callback] Successfully exchanged for long-lived token.');
    return data.access_token; // Return only the long-lived token
  } catch (error) {
    console.error('[IG Callback] Exception in exchangeForLongLivedToken:', error);
    throw error;
  }
}

// Helper function to get shop_id from shop domain
async function getShopId(shopDomain) {
  console.log(`[IG Callback] Getting shop_id for domain: ${shopDomain}`);
  if (!shopDomain) return null;
  try {
    // Query 'app_settings' where the 'shop_id' column matches the domain
    const { data, error } = await supabase
      .from('app_settings') 
      .select('shop_id') 
      .eq('shop_id', shopDomain) 
      .maybeSingle(); 

    if (error) {
      console.error(`[IG Callback] Supabase error fetching shop_id for ${shopDomain}:`, error);
      return null;
    }
    if (!data) {
      console.warn(`[IG Callback] Shop domain ${shopDomain} not found in app_settings.`);
      return null;
    }
    console.log(`[IG Callback] Found shop_id: ${data.shop_id}`);
    return data.shop_id; // Return the shop_id value
  } catch (e) {
    console.error(`[IG Callback] Exception fetching shop_id for ${shopDomain}:`, e);
    return null;
  }
}

export async function loader({ request }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state'); // Should contain the shop domain
  const errorParam = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  console.log(`[IG Callback-Remix] Received request. Code: ${code ? 'present' : 'missing'}, State: ${state}, Error: ${errorParam || 'none'}`);

  // Retrieve shop from state
  const shop = state; 

  const baseUrl = url.origin;

  if (errorParam) {
    console.error(`[IG Callback-Remix] Instagram returned error: ${errorParam} - ${errorDescription}`);
    const redirectPath = shop ? `/app/settings?shop=${shop}&ig_error=insta_auth_failed&desc=${encodeURIComponent(errorDescription)}` : '/login?error=insta_auth_failed';
    console.log(`[IG Callback-Remix] Redirecting due to Instagram error to: ${redirectPath}`);
    return redirect(redirectPath);
  }

  if (!code) {
    console.error('[IG Callback-Remix] Error: No code parameter found.');
    const redirectPath = shop ? `/app/settings?shop=${shop}&ig_error=missing_code` : '/login?error=missing_shop_for_ig_callback';
    console.log(`[IG Callback-Remix] Redirecting due to missing code to: ${redirectPath}`);
    return redirect(redirectPath);
  }

  if (!shop) {
    console.error('[IG Callback-Remix] Error: No state (shop) parameter found.');
    const redirectPath = '/login?error=missing_state_in_ig_callback';
    console.log(`[IG Callback-Remix] Redirecting due to missing state to: ${redirectPath}`);
    return redirect(redirectPath);
  }

  // Get the shop_id
  const shopId = await getShopId(shop);

  if (!shopId) {
    // Error already logged in getShopId
    const redirectPath = `/app/settings?shop=${shop}&ig_error=shop_not_found_in_db`;
    console.log(`[IG Callback-Remix] Redirecting due to shop not found in DB to: ${redirectPath}`);
    return redirect(redirectPath);
  }

  try {
    console.log('[IG Callback-Remix] Starting token exchange process...');
    // 1. Exchange code for short-lived token and user ID
    const { access_token: shortLivedToken, user_id: instagramUserId } =
      await exchangeCodeForToken(code);

    if (!shortLivedToken || !instagramUserId) {
      console.error('[IG Callback-Remix] Failed to retrieve short-lived token or user ID from Instagram.');
      throw new Error('Failed to retrieve token or user ID from Instagram.');
    }
    console.log(`[IG Callback-Remix] Got short-lived token and user ID: ${instagramUserId}`);

    // 2. Exchange short-lived token for long-lived token
    const longLivedToken = await exchangeForLongLivedToken(shortLivedToken);

    if (!longLivedToken) {
      console.error('[IG Callback-Remix] Failed to retrieve long-lived token from Instagram.');
      throw new Error('Failed to retrieve long-lived token from Instagram.');
    }
    console.log('[IG Callback-Remix] Got long-lived token.');

    // 3. Upsert Instagram User ID and Long-Lived Token in Supabase
    const upsertData = {
      shop_id: shopId, // Use the validated shop_id (domain)
      instagram_user_id: instagramUserId.toString(),
      access_token: longLivedToken, 
    };
    console.log('[IG Callback-Remix] Attempting to upsert data into store_instagram_connections:', upsertData);
    
    const { error: upsertError } = await supabase
      .from('store_instagram_connections')
      .upsert(upsertData, { onConflict: 'shop_id' }); 

    if (upsertError) {
      console.error('[IG Callback-Remix] Supabase upsert error:', upsertError);
      throw new Error('Failed to save Instagram credentials to database.');
    }

    console.log(`[IG Callback-Remix] Successfully upserted Instagram connection for shop_id: ${shopId}`);

    // 4. Redirect back to the app settings page with success parameter
    const successRedirectPath = `/app/settings?shop=${shop}&ig_success=true`;
    console.log(`[IG Callback-Remix] Redirecting successfully to: ${successRedirectPath}`);
    return redirect(successRedirectPath);

  } catch (error) {
    console.error('[IG Callback-Remix] Error during main callback processing:', error);
    const errorRedirectPath = `/app/settings?shop=${shop}&ig_error=callback_failed`;
    console.log(`[IG Callback-Remix] Redirecting due to processing error to: ${errorRedirectPath}`);
    return redirect(errorRedirectPath);
  }
}

export default function InstagramCallback() {
  return null;
} 