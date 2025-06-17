import { json } from "@remix-run/node";
import { supabase } from '../supabase.server.js'; // Import the initialized Supabase client
import { getInstagramPostId, getInstagramPostDetails, verifyInstagramShare } from "../services/instagram.server";

export async function action({ request }) {
  console.log("[Storefront Verify Share Action] Received request.");
  try {
    const body = await request.json();
    const { instagramUrl, shopDomain } = body;

    if (!instagramUrl || !shopDomain) {
      console.error("[Storefront Verify Share Action] Missing instagramUrl or shopDomain.");
      return json({ success: false, error: "Missing Instagram URL or shop domain." }, { status: 400 });
    }

    const postId = getInstagramPostId(instagramUrl);
    if (!postId) {
      console.error("[Storefront Verify Share Action] Invalid Instagram post URL provided.");
      return json({ success: false, error: "Invalid Instagram post URL provided." }, { status: 400 });
    }

    // Fetch merchant settings and Instagram connection using the shopDomain
    const { data: appSettings, error: appSettingsError } = await supabase
      .from('app_settings')
      .select('id, eligible_product_ids, shop_id, required_instagram_mention') // Only select necessary fields
      .eq('shop_domain', shopDomain)
      .single();

    if (appSettingsError || !appSettings) {
      console.error("[Storefront Verify Share Action] Error fetching app settings for shop", shopDomain, appSettingsError);
      return json({ success: false, error: "Could not retrieve store settings. Please ensure the app is configured." }, { status: 500 });
    }
    
    const { data: instagramConnection, error: instagramConnectionError } = await supabase
      .from('store_instagram_connections')
      .select('instagram_access_token')
      .eq('shop_id', appSettings.shop_id) // Use shop_id from appSettings
      .single();

    if (instagramConnectionError || !instagramConnection) {
      console.error("[Storefront Verify Share Action] Error fetching Instagram connection for shop_id", appSettings.shop_id, instagramConnectionError);
      return json({ success: false, error: "Store Instagram account not connected. Please ask the merchant to connect it." }, { status: 400 });
    }

    const { instagram_access_token } = instagramConnection;

    console.log(`[Storefront Verify Share Action] Attempting to fetch post ID ${postId} details from Instagram.`);
    
    // Call the service function to get Instagram post details
    const instagramPostDetailsResult = await getInstagramPostDetails(postId, instagram_access_token);

    if (!instagramPostDetailsResult.success) {
      console.error("[Storefront Verify Share Action] Failed to get Instagram post details:", instagramPostDetailsResult.error);
      return json({ success: false, error: instagramPostDetailsResult.error }, { status: 400 });
    }

    const instagramData = instagramPostDetailsResult.data;
    console.log("[Storefront Verify Share Action] Instagram Post Data:", instagramData);

    // Call the service function to verify the Instagram share (no customerEmail needed here)
    const verificationResult = await verifyInstagramShare(appSettings.shop_id, instagramUrl, instagramData, appSettings);

    if (!verificationResult.success) {
      console.error("[Storefront Verify Share Action] Instagram share verification failed:", verificationResult.message);
      return json({ success: false, error: verificationResult.message }, { status: 400 });
    }

    // If successfully verified and saved to DB
    if (verificationResult.verified) {
      console.log("[Storefront Verify Share Action] Instagram share successfully verified.");
      // IMPORTANT: Discount code generation is NOT done here on the storefront. 
      // It should be handled by a secure, admin-authenticated process.
      return json({
        success: true,
        message: verificationResult.message || "Your share has been verified!",
        // You might return a placeholder or instructions for the customer here
      });
    } else {
      // Share was not verified based on rules, return rejection reason
      console.log("[Storefront Verify Share Action] Instagram share not verified:", verificationResult.message);
      return json({ success: false, error: verificationResult.message }, { status: 400 });
    }

  } catch (error) {
    console.error("[Storefront Verify Share Action] Uncaught error:", error);
    return json({ success: false, error: "An unexpected error occurred during share verification." }, { status: 500 });
  }
}
