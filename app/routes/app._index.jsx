import { useEffect, useState, useCallback, useRef } from "react";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getAnalyticsSummary } from "../supabase.server";
import { supabase } from "../supabase.server";
import InstagramIcon from '../../instagram.png'; // Adjust path if needed

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  console.log(`[App Index Loader] Authenticated shop: ${shop}`);

  let settings = null;
  let error = null;

  // Check Instagram connection
  let isInstagramConnected = false;
  let analytics = null;
  try {
    console.log(`[App Index Loader] Checking for existing Instagram connection for shop: ${shop}`);
    const { data: connection } = await supabase
      .from("store_instagram_connections")
      .select("instagram_user_id")
      .eq("shop_id", shop)
      .maybeSingle();
    isInstagramConnected = !!connection?.instagram_user_id;
    if (isInstagramConnected) {
      console.log(`[App Index Loader] Found existing Instagram connection for shop: ${shop}`);
      analytics = await getAnalyticsSummary(shop);
    } else {
      console.log(`[App Index Loader] No Instagram connection found for ${shop}.`);
    }
  } catch (e) {
    console.error(`[App Index Loader] Error checking Instagram connection for ${shop}:`, e);
    // fallback: not connected, no analytics
  }

  try {
    console.log(`[App Index Loader] Checking for existing settings for shop: ${shop}`);
    const { data: existingSettings, error: fetchError } = await supabase
      .from("app_settings")
      .select("*")
      .eq("shop_id", shop)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (existingSettings) {
      console.log(`[App Index Loader] Found existing settings for shop: ${shop}`);
      settings = existingSettings;
    } else {
      console.log(`[App Index Loader] No settings found for ${shop}. Creating defaults.`);
      const defaultSettings = {
        shop_id: shop,
        created_at: new Date().toISOString(), 
      };

      const { data: newSettings, error: insertError } = await supabase
        .from("app_settings")
        .insert(defaultSettings)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      console.log(`[App Index Loader] Successfully created default settings for shop: ${shop}`);
      settings = newSettings;
    }
  } catch (e) {
    console.error(`[App Index Loader] Error fetching or creating settings for ${shop}:`, e);
    error = e.message;
  }

  return json({ settings, error, isInstagramConnected, analytics, shop });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();
  const product = responseJson.data.productCreate.product;
  const variantId = product.variants.edges[0].node.id;
  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyRemixTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`,
    {
      variables: {
        productId: product.id,
        variants: [{ id: variantId, price: "100.00" }],
      },
    },
  );
  const variantResponseJson = await variantResponse.json();

  return {
    product: responseJson.data.productCreate.product,
    variant: variantResponseJson.data.productVariantsBulkUpdate.productVariants,
  };
};

export default function Index() {
  const { settings, error: loaderError, isInstagramConnected, analytics, shop } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";
  const productId = fetcher.data?.product?.id.replace(
    "gid://shopify/Product/",
    "",
  );
  const [connecting, setConnecting] = useState(false);
  const cardRef = useRef(null);
  const parentRef = useRef(null);

  useEffect(() => {
    if (productId) {
      shopify.toast.show("Product created");
    }
  }, [productId, shopify]);

  useEffect(() => {
    if (cardRef.current) {
      console.log("Card computed width:", getComputedStyle(cardRef.current).width);
      console.log("Card computed maxWidth:", getComputedStyle(cardRef.current).maxWidth);
    }
    if (parentRef.current) {
      console.log("Parent computed width:", getComputedStyle(parentRef.current).width);
      console.log("Parent computed maxWidth:", getComputedStyle(parentRef.current).maxWidth);
    }
    if (typeof window !== 'undefined') {
      console.log("Window width:", window.innerWidth);
    }
  }, []);

  const generateProduct = () => fetcher.submit({}, { method: "POST" });

  // Handler for connect button
  const handleConnectInstagram = useCallback(() => {
    setConnecting(true);
    const instagramAuthUrl = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=1389247025830519&redirect_uri=https://sharespike.fly.dev/api/auth/instagram/callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights&state=${encodeURIComponent(shop)}`;
    window.open(instagramAuthUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => setConnecting(false), 2000);
  }, [shop]);

  if (loaderError) {
  return (
    <Page>
        <TitleBar title="Error" />
        <Layout>
          <Layout.Section>
            <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                  Error Loading App Settings
                  </Text>
                <Text color="critical">{loaderError}</Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }
  
  if (!settings) {
     return (
      <Page>
        <TitleBar title="Loading Settings..." />
         <Layout>
           <Layout.Section>
              <Card>
                <BlockStack gap="200">
                 <Text as="p">Loading settings...</Text>
                </BlockStack>
              </Card>
           </Layout.Section>
         </Layout>
       </Page>
     );
  }

  return (
    <>
      <style>{`
        .instagram-connect-btn {
          background: #000 !important;
          color: #fff !important;
          border: none !important;
          font-weight: 600;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-top: 12px !important;
          padding-bottom: 12px !important;
        }
        .instagram-connect-btn:active, .instagram-connect-btn:focus {
          background: #222 !important;
        }
        .wide-polaris-card {
          max-width: 600px !important;
          width: 100% !important;
        }
      `}</style>
      <Page title="Welcome to ShareSpike">
        <div ref={parentRef} style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {!isInstagramConnected ? (
            <div style={{ width: 520, maxWidth: '90vw' }}>
              <Card ref={cardRef} sectioned className="wide-polaris-card" style={{ width: '100%', textAlign: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                  <img src={InstagramIcon} alt="Instagram" style={{ width: 64, height: 64, borderRadius: 16, objectFit: 'contain', background: '#fff' }} />
                  <Text as="h2" variant="headingMd" fontWeight="bold" style={{ textAlign: 'center' }}>ShareSpike</Text>
                  <Text as="p" variant="bodyMd" tone="subdued" style={{ textAlign: 'center' }}>
                    Connect your Instagram account to start using ShareSpike.
                  </Text>
                  <Button
                    fullWidth
                    size="large"
                    loading={connecting}
                    onClick={handleConnectInstagram}
                    icon={<img src={InstagramIcon} alt="Instagram" style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }} />}
                    className="instagram-connect-btn"
                  >
                    Connect with Instagram
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            <Card sectioned>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Analytics Overview</Text>
                <Layout>
                  <Layout.Section>
                    <Card title="Shares" sectioned>
                      <Text as="h3" variant="headingLg">{(analytics || []).reduce((sum, a) => sum + (a.share_count || 0), 0)}</Text>
                      <Text variant="bodySm">Total Shares</Text>
                    </Card>
                  </Layout.Section>
                  <Layout.Section>
                    <Card title="Discounts Issued" sectioned>
                      <Text as="h3" variant="headingLg">{(analytics || []).reduce((sum, a) => sum + (a.discount_count || 0), 0)}</Text>
                      <Text variant="bodySm">Discount Codes</Text>
                    </Card>
                  </Layout.Section>
                  <Layout.Section>
                    <Card title="Conversions" sectioned>
                      <Text as="h3" variant="headingLg">{(analytics || []).reduce((sum, a) => sum + (a.conversion_count || 0), 0)}</Text>
                      <Text variant="bodySm">Sales from Shares</Text>
                    </Card>
                  </Layout.Section>
                  <Layout.Section>
                    <Card title="Revenue Generated" sectioned>
                      <Text as="h3" variant="headingLg">${(analytics || []).reduce((sum, a) => sum + (parseFloat(a.revenue_generated) || 0), 0).toFixed(2)}</Text>
                      <Text variant="bodySm">Total Revenue</Text>
                    </Card>
                  </Layout.Section>
                </Layout>
              </BlockStack>
            </Card>
          )}
        </div>
    </Page>
    </>
  );
}
