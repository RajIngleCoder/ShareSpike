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

// Validate that environment variables are set
if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET) {
  console.error("Missing INSTAGRAM_APP_ID or INSTAGRAM_APP_SECRET environment variables.");
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

// Function to verify an Instagram share
export async function verifyInstagramShare(shopId, postUrl, customerEmail) {
  try {
    // 1. Fetch Instagram credentials
    const { data: connection, error: connectionError } = await supabase
      .from('store_instagram_connections')
      .select('access_token, instagram_user_id')
      .eq('shop_id', shopId)
      .single();

    if (connectionError || !connection) {
      throw new Error('Instagram connection not found for this shop.');
    }

    const { access_token, instagram_user_id } = connection;

    // 2. Extract media ID from post URL
    const mediaId = extractPostId(postUrl);
    if (!mediaId) {
      throw new Error("Invalid Instagram post URL format.");
    }

    // 3. Call Instagram Graph API
    const apiUrl = `https://graph.instagram.com/${mediaId}?fields=caption,tags&access_token=${access_token}`;

    let apiResponse;
    try {
      apiResponse = await fetch(apiUrl);
      if (!apiResponse.ok) {
        throw new Error(`Instagram API error: ${apiResponse.status} ${apiResponse.statusText}`);
      }
    } catch (apiError) {
      console.error("Error calling Instagram API:", apiError);
      throw new Error("Failed to fetch Instagram post details.");
    }

    const apiData = await apiResponse.json();

    // 4. Verify share based on API response
    let isVerified = false;
    let verificationMessage = "Share could not be verified.";

    // Check if caption mentions the shop's handle
    const shopHandle = shopId.split('.')[0]; // Extract handle from shop domain (e.g., mystore from mystore.myshopify.com)
    const handleMentionRegex = new RegExp(`@${shopHandle}`, 'i'); // Case-insensitive match
    if (apiData.caption && handleMentionRegex.test(apiData.caption)) {
      isVerified = true;
      verificationMessage = "Share verified: Shop handle mentioned in caption.";
    }

    // TODO: Add logic to check for tagged users (requires different API call and permissions)

    // 5. Store verification result in database
    // First check if a record already exists
    const { data: existingShare, error: queryError } = await supabase
      .from('share_verifications')  // Using share_verifications as shown in screenshot
      .select('*')
      .eq('shop_id', shopId)
      .eq('instagram_post_url', postUrl)
      .eq('customer_identifier', customerEmail)
      .maybeSingle();  // Use maybeSingle instead of single to handle no records found

    if (queryError) {
      console.error("Error querying existing share:", queryError);
      throw new Error("Failed to query share verification status.");
    }

    let share;
    
    if (existingShare) {
      // Update existing record
      const { data: updatedShare, error: updateError } = await supabase
        .from('share_verifications')  // Using share_verifications as shown in screenshot
        .update({
          instagram_media_id: mediaId,
          instagram_user_id: instagram_user_id,
          verification_status: isVerified ? 'verified' : 'rejected',
          verified_at: isVerified ? new Date().toISOString() : null,
          rejection_reason: isVerified ? null : verificationMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingShare.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating share:", updateError);
        throw new Error("Failed to update share verification status.");
      }

      share = updatedShare;
    } else {
      // Insert new record
      const { data: newShare, error: insertError } = await supabase
        .from('share_verifications')  // Using share_verifications as shown in screenshot
        .insert({
          shop_id: shopId,
          instagram_post_url: postUrl,
          instagram_media_id: mediaId,
          instagram_user_id: instagram_user_id,
          customer_identifier: customerEmail,
          verification_status: isVerified ? 'verified' : 'rejected',
          verified_at: isVerified ? new Date().toISOString() : null,
          rejection_reason: isVerified ? null : verificationMessage,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting share:", insertError);
        throw new Error("Failed to create share verification record.");
      }

      share = newShare;
    }

    const verificationResult = {
      success: true,
      message: verificationMessage,
      verified: isVerified,
      share: share,
    };

    return verificationResult;

  } catch (error) {
    console.error('Error verifying Instagram share:', error);
    return {
      success: false,
      message: error.message || "Failed to verify Instagram share",
      verified: false,
    };
  }
}

// Function to extract post ID from URL
function extractPostId(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const postIndex = pathParts.findIndex(part => part === 'p');
    if (postIndex !== -1 && pathParts[postIndex + 1]) {
      return pathParts[postIndex + 1];
    }
    return null;
  } catch (error) {
    return null;
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
