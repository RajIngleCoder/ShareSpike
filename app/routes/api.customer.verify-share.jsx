import { json } from "@remix-run/node";
import { supabase } from "../supabase.server";
import { authenticate } from "../shopify.server"; // Assuming shopify.server exports authenticate
import { getInstagramPostId, getInstagramPostDetails, verifyInstagramShare } from "../services/instagram.server";



// Helper function to extract URLs from text
function extractUrls(text) {
    const urlRegex = /\b((https?|ftp|file):\/\/[-\w+&@#\/%?=~_|!:,.;]*[-\w+&@#\/%?=~_|])/gi;
    return text.match(urlRegex) || [];
}

export async function action({ request }) {
  try {
    console.log("[Verify Share Action] Received request");
    const body = await request.json();
    console.log("[Verify Share Action] Received submission:", body);

    // Authenticate the request to get the Shopify session and admin client
    const { admin, session } = await authenticate.admin(request);

    if (!admin || !session) {
      console.error("[Verify Share Action] Shopify authentication failed");
      // Redirect to login if authentication fails
      throw new Response("Authentication failed", { status: 401 });
    }

    const { instagramUrl } = body; // Removed customerEmail from destructuring
    if (!instagramUrl) {
      return json({ error: "Missing instagramUrl." }, { status: 400 });
    }

    const postId = getInstagramPostId(instagramUrl);
    if (!postId) {
        return json({ error: "Invalid Instagram post URL provided." }, { status: 400 });
    }

    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");

    if (!shop) {
      return json({ error: "Missing shop parameter." }, { status: 400 });
    }

    // Fetch merchant settings and Instagram connection
    const { data: appSettings, error: appSettingsError } = await supabase
      .from('app_settings')
      .select('id, eligible_product_ids, shop_id, required_instagram_mention, discount_percentage, discount_expiry_days')
      .eq('shop_domain', shop)
      .single();

    if (appSettingsError || !appSettings) {
      console.error("[Verify Share Action] Error fetching app settings for shop", shop, appSettingsError);
       return json({ error: "Could not retrieve store settings." }, { status: 500 });
    }
    
    const { data: instagramConnection, error: instagramConnectionError } = await supabase
      .from('store_instagram_connections')
      .select('instagram_user_id, instagram_access_token')
      .eq('shop_id', appSettings.shop_id)
      .single();

    if (instagramConnectionError || !instagramConnection) {
       console.error("[Verify Share Action] Error fetching Instagram connection for shop_id", appSettings.shop_id, instagramConnectionError);
       return json({ error: "Store Instagram account not connected." }, { status: 400 });
    }

    const { instagram_access_token } = instagramConnection;

    console.log(`[Verify Share Action] Attempting to fetch post ID ${postId} details from Instagram.`);
    
    // Call the new service function to get Instagram post details
    const instagramPostDetailsResult = await getInstagramPostDetails(postId, instagram_access_token);

    if (!instagramPostDetailsResult.success) {
      console.error("[Verify Share Action] Failed to get Instagram post details:", instagramPostDetailsResult.error);
      return json({ error: instagramPostDetailsResult.error }, { status: 400 });
    }

    const instagramData = instagramPostDetailsResult.data;
    console.log("[Verify Share Action] Instagram Post Data:", instagramData);

    // Call the new service function to verify the Instagram share
    const verificationResult = await verifyInstagramShare(shop, instagramUrl, instagramData, appSettings); // Removed customerEmail from arguments

    if (!verificationResult.success) {
      console.error("[Verify Share Action] Instagram share verification failed:", verificationResult.message);
      return json({ error: verificationResult.message }, { status: 400 });
    }

    if (!verificationResult.verified) {
      console.log("[Verify Share Action] Instagram share not verified:", verificationResult.message);
      return json({ error: verificationResult.message }, { status: 400 });
    }

    // --- Discount Code Generation Logic (only if verified) ---
    console.log("[Verify Share Action] Instagram verification successful. Generating discount code.");

    const { 
      discount_percentage, 
      discount_expiry_days, 
      eligible_product_ids 
    } = appSettings;

    // Use settings from app_settings
    const discountValue = discount_percentage || 10; // Default to 10% if not set in app_settings
    const discountType = "percentage"; // Assuming percentage for now
    const appliesOncePerCustomer = true;
    const usageLimit = 1; // Assuming 1 usage per customer for now
    const title = `SHAREFAST-${discountValue}`;

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (discount_expiry_days || 7)); // Default to 7 days expiry

    let targetType = "all";
    let targetSelection = "all";
    let entitledProductIds = undefined; // Will be set if specific products are eligible

    if (eligible_product_ids && eligible_product_ids.length > 0) {
        targetType = "line_item"; 
        targetSelection = "entitled"; 
        entitledProductIds = eligible_product_ids; 
    }

    // 1. Create a Price Rule
    const priceRuleResponse = await admin.rest.PriceRule.create({
      session: session,
      title: title,
      value_type: discountType,
      value: -discountValue, // Negative value for percentage discount
      customer_selection: "all",
      target_type: targetType,
      target_selection: targetSelection,
      entitled_product_ids: entitledProductIds, // Conditionally included
      allocation_method: "across",
      starts_at: new Date().toISOString(),
      ends_at: endDate.toISOString(),
      once_per_customer: appliesOncePerCustomer,
      usage_limit: usageLimit,
    });

    const priceRule = priceRuleResponse.body.price_rule;
    console.log("[Verify Share Action] Price Rule created:", priceRule.id);

    // 2. Generate a unique discount code for the Price Rule
    const generatedCode = `SHARE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const discountCodeResponse = await admin.rest.DiscountCode.create({
      session: session,
      price_rule_id: priceRule.id,
      code: generatedCode,
    });

    const discountCode = discountCodeResponse.body.discount_code;
     console.log("[Verify Share Action] Discount Code created:", discountCode.code);

    // TODO: Send email with discount code
    // This will require setting up an email sending service.

    // Placeholder success response
    return json({
      success: true,
      message: "Share verified and discount code generated.",
      discountCode: generatedCode,
      shopifyOrderLink: `https://admin.shopify.com/store/${session.shop}/orders/new` // Placeholder link
    });

  } catch (error) {
    console.error("[Verify Share Action] Uncaught error:", error);
    // Check if it's a Response object from authenticate.admin
    if (error instanceof Response) {
       return error; // Re-throw the response for Remix to handle redirection
    }
    return json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}