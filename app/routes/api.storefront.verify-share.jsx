import { json } from "@remix-run/node";
import { supabase } from '../supabase.server.js';
import { getInstagramPostId, getInstagramPostDetails, verifyInstagramShare } from "../services/instagram.server";
import { v4 as uuidv4 } from 'uuid'; // Import uuid for anonymous users
import { authenticate } from "../shopify.server"; // Import authenticate for public context

export async function action({ request }) {
  console.log("[Storefront Verify Share Action] Received request.");
  try {
    // Attempt to authenticate as a public customer
    const { session, customer } = await authenticate.public(request);
    
    let customerIdentifier;
    if (customer && customer.id) {
      customerIdentifier = `shopify_customer_${customer.id}`; // Use Shopify Customer ID if logged in
      console.log(`[Storefront Verify Share Action] Logged-in customer: ${customerIdentifier}`);
    } else {
      customerIdentifier = `anonymous_${uuidv4()}`; // Generate UUID for anonymous users
      console.log(`[Storefront Verify Share Action] Anonymous customer: ${customerIdentifier}`);
    }

    const body = await request.json();
    const { instagramUrl, shopDomain } = body; // customerEmail is no longer expected

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
      .select('id, eligible_product_ids, shop_id, required_instagram_mention')
      .eq('shop_domain', shopDomain)
      .single();

    if (appSettingsError || !appSettings) {
      console.error("[Storefront Verify Share Action] Error fetching app settings for shop", shopDomain, appSettingsError);
      return json({ success: false, error: "Could not retrieve store settings. Please ensure the app is configured." }, { status: 500 });
    }
    
    const { data: instagramConnection, error: instagramConnectionError } = await supabase
      .from('store_instagram_connections')
      .select('access_token, instagram_user_id') // Select access_token and instagram_user_id
      .eq('shop_id', appSettings.shop_id)
      .single();

    if (instagramConnectionError || !instagramConnection) {
      console.error("[Storefront Verify Share Action] Error fetching Instagram connection for shop_id", appSettings.shop_id, instagramConnectionError);
      return json({ success: false, error: "Store Instagram account not connected. Please ask the merchant to connect it." }, { status: 400 });
    }

    const { access_token: instagramAccessToken, instagram_user_id: instagramUserId } = instagramConnection; // Destructure correctly

    console.log(`[Storefront Verify Share Action] Attempting to fetch post ID ${postId} details from Instagram.`);
    
    // Call the service function to get Instagram post details
    const instagramPostDetailsResult = await getInstagramPostDetails(postId, instagramAccessToken); // Use instagramAccessToken

    if (!instagramPostDetailsResult.success) {
      console.error("[Storefront Verify Share Action] Failed to get Instagram post details:", instagramPostDetailsResult.error);
      return json({ success: false, error: instagramPostDetailsResult.error }, { status: 400 });
    }

    const instagramData = instagramPostDetailsResult.data;
    console.log("[Storefront Verify Share Action] Instagram Post Data:", instagramData);

    // Call the service function to verify the Instagram share with customerIdentifier
    const verificationResult = await verifyInstagramShare(
      appSettings.shop_id,
      instagramUrl,
      customerIdentifier, // Pass the determined customerIdentifier
      instagramData,
      appSettings
    );

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
