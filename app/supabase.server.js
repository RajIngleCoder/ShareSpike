import { createClient } from '@supabase/supabase-js';

// Supabase client configuration from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Role Key for server-side

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Service Role Key environment variables.");
  // Depending on the context, you might want to throw an error here
  // throw new Error("Missing Supabase credentials in environment variables.");
}

// Create Supabase client instance using Service Role Key for server-side operations
export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions for common Supabase operations

/**
 * Store share verification data
 * @param {Object} shareData - Information about the Instagram share
 * @returns {Promise} - Supabase insert response
 */
export async function storeShareVerification(shareData) {
  const { data, error } = await supabase
    .from('share_verifications')
    .insert([shareData]);

  if (error) throw error;
  return data;
}

/**
 * Fetch shares for a specific store
 * @param {string} shopId - The Shopify store ID
 * @returns {Promise} - Supabase query response
 */
export async function getSharesByShop(shopId) {
  const { data, error } = await supabase
    .from('share_verifications')
    .select('*')
    .eq('shop_id', shopId);

  if (error) throw error;
  return data;
}

/**
 * Store discount code information
 * @param {Object} discountData - Information about the generated discount
 * @returns {Promise} - Supabase insert response
 */
export async function storeDiscountCode(discountData) {
  const { data, error } = await supabase
    .from('discount_codes')
    .insert([discountData]);

  if (error) throw error;
  return data;
}

/**
 * Save app settings for a specific shop
 * @param {Object} settings - App settings to save
 * @returns {Promise} - Supabase upsert response
 */
export async function saveAppSettings(settings) {
  const { data, error } = await supabase
    .from('app_settings')
    .upsert([settings], { onConflict: 'shop_id' });

  if (error) throw error;
  return data;
}

/**
 * Fetch app settings for a specific shop
 * @param {string} shopId - The Shopify store ID
 * @returns {Promise} - Supabase query response
 */
export async function getAppSettings(shopId) {
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .eq('shop_id', shopId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
  return data;
}

/**
 * Store analytics data for shares and conversions
 * @param {Object} analyticsData - Analytics data to store
 * @returns {Promise} - Supabase insert response
 */
export async function storeAnalyticsData(analyticsData) {
  const { data, error } = await supabase
    .from('analytics')
    .insert([analyticsData]);

  if (error) throw error;
  return data;
}

/**
 * Get analytics summary for a specific shop
 * @param {string} shopId - The Shopify store ID
 * @returns {Promise} - Supabase query response
 */
export async function getAnalyticsSummary(shopId) {
  const { data, error } = await supabase
    .from('analytics')
    .select('*')
    .eq('shop_id', shopId);

  if (error) throw error;
  return data;
}
