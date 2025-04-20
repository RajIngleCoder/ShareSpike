import { redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);

  // Read Instagram App ID from environment variables
  const instagramAppId = process.env.INSTAGRAM_APP_ID;
  if (!instagramAppId) {
    console.error("Missing INSTAGRAM_APP_ID environment variable");
    return redirect("/app/settings?instagram_error=Missing%20Instagram%20App%20ID%20configuration");
  }

  // Get the app URL for redirect
  const appUrl = process.env.SHOPIFY_APP_URL || process.env.HOST;
  if (!appUrl) {
    console.error("Missing SHOPIFY_APP_URL or HOST environment variable");
    return redirect("/app/settings?instagram_error=Missing%20application%20URL%20configuration");
  }

  // Construct the redirect URI (callback URL)
  const redirectUri = `${appUrl}/auth/instagram/callback`;
  
  // Store the shop ID in the session for retrieval during callback
  // This would ideally be stored in a secure way, perhaps as a signed cookie or in a database with a unique state token
  
  // Specify the required permissions
  const scope = "instagram_basic,pages_show_list,pages_read_engagement";
  
  // Generate a state parameter for CSRF protection
  const state = session.shop; // Using the shop as state for simplicity
  
  // Construct the Instagram OAuth URL
  const instagramAuthUrl = `https://www.facebook.com/v14.0/dialog/oauth?` +
    `client_id=${instagramAppId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${encodeURIComponent(state)}` + 
    `&response_type=code`;
  
  // Redirect to Instagram OAuth page
  return redirect(instagramAuthUrl);
}
