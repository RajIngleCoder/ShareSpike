import { Page, Card, Text, Button, Banner } from '@shopify/polaris';
import { createClient } from '@/utils/supabase/server';
import { getShopSession } from '@/utils/shopify/shop-session';
import Link from 'next/link';
import { Suspense } from 'react';
import AppBridgeRedirectHandler from '@/components/auth/AppBridgeRedirectHandler';

// Updated helper function to fetch Instagram connection data
async function getInstagramConnectionData(supabase, shopDomain) {
  if (!shopDomain) return null;
  try {
    // 1. Fetch shop_id from app_settings based on shop domain
    const { data: settingsData, error: settingsError } = await supabase
      .from('app_settings')
      .select('id') // Select the primary key (shop_id)
      .eq('shop', shopDomain)
      .maybeSingle();

    if (settingsError) {
      console.error(`Error fetching shop_id for ${shopDomain}:`, settingsError);
      return null;
    }

    if (!settingsData?.id) {
      console.warn(`Shop ${shopDomain} not found in app_settings.`);
      return null; // Shop not configured yet
    }

    const shopId = settingsData.id;

    // 2. Fetch connection data using the shop_id
    const { data: connectionData, error: connectionError } = await supabase
      .from('store_instagram_connections')
      .select('instagram_user_id') // Select the specific field needed
      .eq('shop_id', shopId)
      .maybeSingle();

    if (connectionError) {
      console.error(`Error fetching Instagram connection for shop_id ${shopId}:`, connectionError);
      return null;
    }
    
    // Return the connection data (which might be null if no connection exists)
    return connectionData;
  } catch (e) {
    console.error(`Exception fetching Instagram connection data for ${shopDomain}:`, e);
    return null;
  }
}

// Settings Page Component
export default async function SettingsPage({ searchParams }) {
  const supabase = createClient(); // Create Supabase client once

  // Get shop from session or search params
  let shop = searchParams?.shop;
  if (!shop) {
    try {
      const session = await getShopSession();
      shop = session.shop;
    } catch (e) {
      console.error("Failed to get shop session:", e);
      // Handle error
      return (
        <Page title="Settings">
          <Banner title="Error" tone="critical">
            <p>Could not identify the store. Please try reloading the app.</p>
          </Banner>
        </Page>
      );
    }
  }

  // Fetch connection data using the updated helper
  const connectionData = await getInstagramConnectionData(supabase, shop);
  const isInstagramConnected = !!connectionData?.instagram_user_id;
  const instagramUserId = connectionData?.instagram_user_id;

  // Get feedback messages from URL params
  const instagramSuccess = searchParams?.ig_success === 'true';
  const instagramError = searchParams?.ig_error;
  const errorDescription = searchParams?.desc;

  let statusBanner = null;
  if (instagramSuccess) {
    statusBanner = (
      <Banner title="Instagram Connected" tone="success" onDismiss={() => {}}>
        <p>Your Instagram account has been successfully connected.</p>
      </Banner>
    );
  } else if (instagramError) {
      let errorMessage = "An unknown error occurred during Instagram connection.";
      if (instagramError === 'missing_code') errorMessage = "Connection failed: Missing authorization code from Instagram.";
      else if (instagramError === 'callback_failed') errorMessage = "Connection failed: Could not process the callback from Instagram.";
      else if (instagramError === 'shop_not_found_in_db') errorMessage = "Connection failed: Your shop is not configured in our system.";
      else if (instagramError === 'insta_auth_failed') errorMessage = `Connection failed: ${errorDescription || 'Instagram rejected the authorization.'}`;
      else if (instagramError === 'missing_state_in_ig_callback') errorMessage = "Connection failed: Security check failed during callback.";

    statusBanner = (
      <Banner title="Instagram Connection Failed" tone="critical" onDismiss={() => {}}>
        <p>{errorMessage}</p>
      </Banner>
    );
  }

  return (
    <Page title="Settings">
       <Suspense fallback={null}> 
         <AppBridgeRedirectHandler />
       </Suspense>

       {statusBanner}
       <div style={{ marginTop: statusBanner ? 'var(--p-space-4)' : '0' }}>
            <Card title="Instagram Connection" sectioned>
            {isInstagramConnected ? (
                <Text variant="bodyMd" as="p">
                  Connected to Instagram account ID: {instagramUserId}
                  {/* Add a disconnect button here later? */}
                </Text>
            ) : (
                <>
                  <Text variant="bodyMd" as="p" tone="subdued">
                      Connect your Instagram account to allow ShareSpike to verify story mentions.
                  </Text>
                  <div style={{ marginTop: 'var(--p-space-4)' }}>
                      {/* Ensure shop is included in the start link */}
                      <Link href={`/api/auth/instagram/start?shop=${shop}`} passHref legacyBehavior>
                          <Button variant="primary">Connect Instagram Account</Button>
                      </Link>
                  </div>
                </>
            )}
            </Card>
       </div>
       {/* Add other settings cards here later */}
    </Page>
  );
} 