import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { createClient } from '@supabase/supabase-js';
import { getInstagramPostId, getInstagramPostDetails, verifyInstagramShare } from "../services/instagram.server";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function action({ request }) {
  try {
    // Using Shopify's authenticate middleware
    const { session } = await authenticate.admin(request);
    if (!session || !session.shop) {
      return json(
        { 
          success: false, 
          message: "You must be logged in as a shop admin",
          verified: false
        }, 
        { status: 401 }
      );
    }

    // Get the request body
    const body = await request.json();
    const { postUrl } = body;
    
    if (!postUrl) {
      return json(
        { 
          success: false, 
          message: "Missing required fields (Instagram Post URL)", 
          verified: false
        }, 
        { status: 400 }
      );
    }

    // Use the shop from the session
    const shopId = session.shop;
    const customerIdentifier = "merchant-test"; // Placeholder for admin testing
    console.log(`[Verify Route] Verifying Instagram share for shop: ${shopId}, post URL: ${postUrl}, customer: ${customerIdentifier}`);
    
    // 1. Fetch Instagram Credentials
    console.log(`[Verify Route] Attempting to fetch Instagram credentials for shop: ${shopId}`);
    const { data: instagramCredentials, error: credError } = await supabase
      .from('store_instagram_connections')
      .select('access_token, instagram_user_id')
      .eq('shop_id', shopId)
      .single();

    if (credError || !instagramCredentials) {
      console.error("[API] Error fetching Instagram credentials:", credError);
      return json(
        { success: false, message: "Instagram account not connected for this shop.", verified: false },
        { status: 400 }
      );
    }
    const { access_token: accessToken, instagram_user_id: instagramUserId } = instagramCredentials;
    console.log(`[Verify Route] Fetched Instagram credentials: ${JSON.stringify({ accessToken: accessToken ? "******" : "N/A", instagramUserId })}`);

    // 2. Fetch App Settings (for required_instagram_mention)
    console.log(`[Verify Route] Attempting to fetch app settings for shop: ${shopId}`);
    const { data: appSettings, error: settingsError } = await supabase
      .from('app_settings')
      .select('required_instagram_mention')
      .eq('shop_id', shopId)
      .single();

    if (settingsError || !appSettings) {
      console.warn("[Verify Route] App settings not found for shop, proceeding without specific mention requirement.");
    } else {
      console.log(`[Verify Route] Fetched App Settings: ${JSON.stringify(appSettings)}`);
    }

    // 3. Extract Post ID and Fetch Instagram Post Data
    console.log(`[Verify Route] Attempting to extract post ID from URL: ${postUrl}`);
    const postId = getInstagramPostId(postUrl);
    console.log(`[Verify Route] Extracted Post ID: ${postId}`);
    if (!postId) {
      return json(
        { success: false, message: "Invalid Instagram post URL.", verified: false },
        { status: 400 }
      );
    }

    console.log(`[Verify Route] Attempting to fetch Instagram post details for postId: ${postId}`);
    const instagramPostData = await getInstagramPostDetails(postId, accessToken);
    console.log(`[Verify Route] Instagram Post Data fetched: ${JSON.stringify(instagramPostData)}`);
    if (!instagramPostData.success) {
      return json(
        { success: false, message: instagramPostData.error || "Failed to fetch Instagram post details.", verified: false },
        { status: 500 }
      );
    }

    // Call the verifyInstagramShare function with the correct parameters
    const result = await verifyInstagramShare(
      shopId,
      postUrl,
      customerIdentifier,
      instagramPostData.data,
      appSettings || {}
    );

    // Log the verification result
    console.log(`Verification result: ${result.success ? 'Success' : 'Failed'}, Verified: ${result.verified}`);

    // Include shopId in the response
    return json({
      ...result,
      shopId: shopId,
    });
  } catch (error) {
    console.error('Instagram verification error:', error);
    return json(
      { 
        success: false, 
        message: error.message || 'Failed to verify Instagram share',
        verified: false
      }, 
      { status: 500 }
    );
  }
}

// Return a 405 Method Not Allowed for any other HTTP method
export async function loader() {
  return json(
    { message: "Method not allowed" }, 
    { status: 405 }
  );
}
