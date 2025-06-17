import { RateLimiter } from 'limiter';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Instagram API credentials from environment variables
const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const FACEBOOK_CLIENT_TOKEN = process.env.FACEBOOK_CLIENT_TOKEN;
const FACEBOOK_API_VERSION = process.env.FACEBOOK_API_VERSION || 'v19.0';

// Validate that environment variables are set
if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET || !FACEBOOK_CLIENT_TOKEN) {
  console.error("Missing INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET, or FACEBOOK_CLIENT_TOKEN environment variables.");
  // Depending on the context, you might want to throw an error here
  // throw new Error("Missing Instagram App credentials in environment variables.");
}

// Rate limiter configuration
// Instagram's rate limits are 200 calls per hour per access token
const rateLimiter = new RateLimiter({
  tokensPerInterval: 200,
  interval: 'hour',
  fireImmediately: true
});

// Function to check rate limits before making API calls
async function checkRateLimit() {
  try {
    await rateLimiter.removeTokens(1);
    return true;
  } catch (error) {
    console.error('Rate limit exceeded:', error);
    return false;
  }
}

// Updated Function to extract Instagram post ID from URL
export function getInstagramPostId(url) {
  try {
    const urlObj = new URL(url);
    // Match /p/SHORTCODE/ or /reel/SHORTCODE/
    const match = urlObj.pathname.match(/\/(?:p|reel)\/([^/]+)/);
    return match ? match[1] : null;
  } catch (error) {
    console.error("Error parsing URL to get Instagram post ID:", error);
    return null;
  }
}

// Function to get Instagram post details from Graph API
export async function getInstagramPostDetails(postId, accessToken) {
  if (!checkRateLimit()) {
    return { success: false, error: "Instagram API rate limit exceeded. Please try again later." };
  }
  const instagramApiUrl = `https://graph.instagram.com/${postId}?fields=caption,permalink&access_token=${accessToken}`;
  try {
    const instagramResponse = await fetch(instagramApiUrl);
    const instagramData = await instagramResponse.json();

    if (instagramData.error) {
        console.error("[Instagram Service] Instagram API Error fetching post details:", instagramData.error);
        return { success: false, error: instagramData.error.message || "Failed to fetch Instagram post details." };
    }
    return { success: true, data: instagramData };
  } catch (error) {
    console.error("[Instagram Service] Exception fetching Instagram post details:", error);
    return { success: false, error: error.message || "An unexpected error occurred while fetching Instagram post details." };
  }
}

// Function to verify an Instagram share
export async function verifyInstagramShare(shopId, postUrl, customerEmail, instagramData, appSettings) {
  const { caption, permalink } = instagramData;
  const { required_instagram_mention, eligible_product_ids } = appSettings;
  let verified = false;
  let rejectionReason = null;
  const instagramMediaId = getInstagramPostId(postUrl); // Get media ID from the URL

  // Check if the caption contains the required mention
  if (required_instagram_mention && (!caption || !caption.includes(required_instagram_mention))) {
    rejectionReason = `Post caption must contain "${required_instagram_mention}".`;
  } else {
    // For now, only checking for required mention. Product link verification can be added here.
    // Assuming if required_instagram_mention is not set, or it is included, then it's verified.
    verified = true;
  }

  // Prepare data for Supabase insertion
  const shareData = {
    shop_id: shopId,
    post_id: instagramMediaId,
    post_url: permalink,
    customer_email: customerEmail,
    verified_at: verified ? new Date().toISOString() : null,
    status: verified ? 'verified' : 'rejected',
    rejection_reason: rejectionReason,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('instagram_shares')
      .upsert(shareData, { onConflict: 'shop_id,post_id,customer_email' }); // Assuming unique constraint

    if (error) {
      console.error("[Instagram Service] Supabase error saving share verification:", error);
      return {
        success: false,
        message: "Failed to save share verification to database.",
        verified: false,
        share: shareData,
      };
    }
    return {
      success: true,
      message: verified ? "Share verified successfully." : rejectionReason,
      verified: verified,
      share: data ? data[0] : shareData, // Return the saved data or prepared data
    };
  } catch (error) {
    console.error("[Instagram Service] Exception saving share verification:", error);
    return {
      success: false,
      message: error.message || "An unexpected error occurred during share verification.",
      verified: false,
      share: shareData,
    };
  }
}

// Function to store Instagram credentials
export async function storeInstagramCredentials(shopId, accessToken, userId) {
  try {
    // Note: Renamed table to store_instagram_connections
    const { error } = await supabase
      .from('store_instagram_connections') // Corrected table name
      .upsert({
        shop_id: shopId,
        access_token: accessToken,
        instagram_user_id: userId, // Corrected column name
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw new Error('Failed to store Instagram credentials');
    }

    return { success: true };
  } catch (error) {
    console.error('Error storing Instagram credentials:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Function to refresh access token
export async function refreshAccessToken(shopId) {
  try {
    // Note: Renamed table to store_instagram_connections
    const { data: credentials, error: fetchError } = await supabase
      .from('store_instagram_connections') // Corrected table name
      .select('*')
      .eq('shop_id', shopId)
      .single();

    if (fetchError || !credentials) {
      throw new Error('Instagram credentials not found');
    }

    const response = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${credentials.access_token}`
    );

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    const data = await response.json();
    
    // Update the access token in the database
    const { error: updateError } = await supabase
      .from('store_instagram_connections') // Corrected table name
      .update({
        access_token: data.access_token,
        updated_at: new Date().toISOString()
      })
      .eq('shop_id', shopId);

    if (updateError) {
      throw new Error('Failed to update access token');
    }

    return {
      success: true,
      newToken: data.access_token
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
