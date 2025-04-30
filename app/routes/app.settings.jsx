import { json, redirect } from "@remix-run/node";
import { useLoaderData, useSubmit, useSearchParams, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Banner,
  BlockStack,
  Badge,
  Button,
} from "@shopify/polaris";
import { useState, useCallback, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { getAppSettings, saveAppSettings, storeDiscountCode } from "../supabase.server";
import { createClient } from '@supabase/supabase-js';

// Import the components
import CardInstagramConnection from "../components/settings/CardInstagramConnection";
import CardDiscountSettings from "../components/settings/CardDiscountSettings";
import CardTestVerification from "../components/settings/CardTestVerification";
import ModalProductSelector from "../components/settings/ModalProductSelector";
import ModalTestDiscount from "../components/settings/ModalTestDiscount";
import ModalDisconnectConfirm from "../components/settings/ModalDisconnectConfirm";

// --- Loader Function ---
export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const settings = await getAppSettings(shop) || {
      shop_id: shop,
      discount_percentage: 10,
      discount_expiry_days: 7,
      eligible_products: [],
    };

    const response = await admin.graphql(
      `#graphql
        query {
          products(first: 50) {
            nodes {
              id
              title
              featuredImage { url }
              vendor
              status
            }
          }
        }
      `
    );
    const responseJson = await response.json();
    const products = responseJson.data.products.nodes;

    let isInstagramConnected = false;
    try {
      const { data: connection, error: connectionError } = await supabase
        .from('store_instagram_connections')
        .select('id')
        .eq('shop_id', shop)
        .maybeSingle();
      if (connectionError) console.error("Error checking Instagram connection:", connectionError);
      else if (connection) isInstagramConnected = true;
    } catch (dbError) {
      console.error("Database error checking Instagram connection:", dbError);
    }

    return json({
      shop,
      settings,
      products,
      isInstagramConnected,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return json({
      shop,
      settings: { shop_id: shop, discount_percentage: 10, discount_expiry_days: 7, eligible_products: [] },
      products: [],
      isInstagramConnected: false,
      error: "Failed to load data",
    });
  }
};

// --- Action Function ---
export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const actionType = formData.get("action");

  // Initialize Supabase client for action
  const supabaseAction = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (actionType === "saveSettings") {
    const discountPercentage = parseInt(formData.get("discountPercentage"), 10);
    const discountExpiryDays = parseInt(formData.get("discountExpiryDays"), 10);
    const eligibleProductsJson = formData.get("eligibleProducts");
    let eligibleProducts = [];
    try {
      eligibleProducts = JSON.parse(eligibleProductsJson || '[]');
    } catch (e) { console.error("Error parsing eligible products", e); }

    try {
      await saveAppSettings({ shop_id: shop, discount_percentage: discountPercentage, discount_expiry_days: discountExpiryDays, eligible_products: eligibleProducts });
      return json({ success: true, action: 'saveSettings' });
    } catch (error) {
      console.error("Error saving settings:", error);
      return json({ success: false, error: error.message }, { status: 500 });
    }

  } else if (actionType === "createDiscountCode") {
    const code = formData.get("code");
    const discountPercentage = parseInt(formData.get("discountPercentage"), 10);
    const expiryDays = parseInt(formData.get("expiryDays"), 10);
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);
      const response = await admin.graphql(
        `#graphql
          mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
            discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
              codeDiscountNode {
                id
                codeDiscount {
                  ... on DiscountCodeBasic {
                    title
                    codes(first: 1) {
                      nodes {
                        code
                      }
                    }
                    startsAt
                    endsAt
                    customerSelection {
                      all
                    }
                    customerGets {
                      value {
                        ... on PercentageValue {
                          percentage
                        }
                      }
                      items {
                        ... on DiscountProducts {
                          products {
                            edges {
                              node {
                                id
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
              userErrors {
                field
                message
              }
            }
          }
        `,
        {
          variables: {
            basicCodeDiscount: {
              title: `ShareSpike Discount: ${code}`,
              code,
              startsAt: new Date().toISOString(),
              endsAt: expiryDate.toISOString(),
              customerSelection: {
                all: true
              },
              customerGets: {
                value: {
                  percentageValue: discountPercentage
                },
                items: {
                  all: true
                }
              }
            }
          }
        }
      );
      const responseJson = await response.json();
      if (responseJson.data?.discountCodeBasicCreate?.userErrors?.length > 0) {
        throw new Error(responseJson.data.discountCodeBasicCreate.userErrors[0].message);
      }
      const shopifyDiscountId = responseJson.data.discountCodeBasicCreate.codeDiscountNode.id;
      const generatedCode = responseJson.data.discountCodeBasicCreate.codeDiscountNode.codeDiscount.codes.nodes[0].code;
      try {
        await storeDiscountCode({ shop_id: shop, discount_code: generatedCode, shopify_discount_id: shopifyDiscountId, expires_at: expiryDate.toISOString() });
      } catch (dbError) { console.error("Error saving discount code to DB:", dbError); }
      return json({ success: true, action: 'createDiscountCode', code: generatedCode, percentage: discountPercentage, expiryDays: expiryDays });
    } catch (error) {
      console.error("Error creating discount code:", error);
      return json({ success: false, error: error.message }, { status: 500 });
    }

  } else if (actionType === "disconnectInstagram") {
    try {
      console.log(`Attempting to disconnect Instagram for shop: ${shop}`);
      const { error: deleteError } = await supabaseAction
        .from('store_instagram_connections')
        .delete()
        .eq('shop_id', shop);
      if (deleteError) throw new Error("Failed to delete Instagram connection from database.");
      console.log(`Successfully disconnected Instagram for shop: ${shop}`);
      return redirect("/app/settings?instagram_disconnected=true");
    } catch (err) {
      console.error("Error during Instagram disconnect action:", err);
      return redirect(`/app/settings?instagram_disconnect_error=${encodeURIComponent(err.message || "Failed to disconnect")}`);
    }
  }

  return json({ success: false, error: "Invalid action" }, { status: 400 });
};

// --- Settings Page Component ---
export default function SettingsPage() {
  const { settings, products, error, isInstagramConnected: initialIsConnected } = useLoaderData();
  const submit = useSubmit();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // --- State Management ---
  const [discountPercentage, setDiscountPercentage] = useState(settings?.discount_percentage || 10);
  const [discountExpiryDays, setDiscountExpiryDays] = useState(settings?.discount_expiry_days || 7);
  const [selectedProducts, setSelectedProducts] = useState(settings?.eligible_products || []);
  const [isSaving, setIsSaving] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testDiscountCode, setTestDiscountCode] = useState("");
  const [testCodeResult, setTestCodeResult] = useState(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [bannerContent, setBannerContent] = useState(null);
  const [bannerStatus, setBannerStatus] = useState(null);
  const [isConnected, setIsConnected] = useState(initialIsConnected);

  // --- URL Parameter Processing Effect ---
  useEffect(() => {
    setIsConnected(initialIsConnected);

    // Check for our Instagram callback parameters (ig_success, ig_error)
    const igSuccess = searchParams.get("ig_success");
    const igError = searchParams.get("ig_error");
    const igErrorDesc = searchParams.get("desc");
    const disconnectedParam = searchParams.get("instagram_disconnected");
    const disconnectError = searchParams.get("instagram_disconnect_error");

    let bannerMsg = null;
    let bannerStat = null;

    if (igSuccess === "true") {
      bannerMsg = "Successfully connected to Instagram!"; 
      bannerStat = "success"; 
      setIsConnected(true);
    } else if (igError) {
      let errorMessage = "Failed to connect to Instagram";
      if (igError === "missing_code") {
        errorMessage = "Instagram connection failed: Missing authorization code";
      } else if (igError === "callback_failed") {
        errorMessage = "Instagram connection failed: Error processing the authorization";
      } else if (igError === "shop_not_found_in_db") {
        errorMessage = "Instagram connection failed: Your shop configuration was not found";
      } else if (igError === "insta_auth_failed" && igErrorDesc) {
        errorMessage = `Instagram connection failed: ${decodeURIComponent(igErrorDesc)}`;
      }
      bannerMsg = errorMessage; 
      bannerStat = "critical";
    } else if (disconnectedParam === "true") {
      bannerMsg = "Successfully disconnected from Instagram."; 
      bannerStat = "info"; 
      setIsConnected(false);
    } else if (disconnectError) {
      bannerMsg = `Failed to disconnect from Instagram: ${decodeURIComponent(disconnectError)}`; 
      bannerStat = "critical";
    }

    if (bannerMsg) {
      setBannerContent(bannerMsg);
      setBannerStatus(bannerStat);
      // Clean up URL parameters
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete("ig_success"); 
      newSearchParams.delete("ig_error");
      newSearchParams.delete("desc");
      newSearchParams.delete("instagram_disconnected"); 
      newSearchParams.delete("instagram_disconnect_error");
      navigate(`/app/settings?${newSearchParams.toString()}`, { replace: true, preventScrollReset: true });
    }
  }, [searchParams, navigate, initialIsConnected]);

  // --- Callback Functions ---
  const handleSaveSettings = useCallback((event) => {
    if (event) event.preventDefault();
    setIsSaving(true);
    
    const formData = new FormData();
    formData.append("action", "saveSettings");
    formData.append("discountPercentage", discountPercentage);
    formData.append("discountExpiryDays", discountExpiryDays);
    formData.append("eligibleProducts", JSON.stringify(selectedProducts));
    
    submit(formData, { method: "POST", replace: true });

    // Optimistic UI update
    setBannerContent("Saving settings...");
    setBannerStatus("info");
    
    setTimeout(() => {
      setBannerContent("Settings saved successfully.");
      setBannerStatus("success");
      setIsSaving(false);
      setTimeout(() => { setBannerContent(null); setBannerStatus(null); }, 3000);
    }, 1500);
  }, [discountPercentage, discountExpiryDays, selectedProducts, submit]);

  const handleProductSelectionChange = useCallback((items) => setSelectedProducts(items), []);
  const toggleProductSelector = useCallback(() => setShowProductSelector(prev => !prev), []);
  
  const toggleTestModal = useCallback(() => {
    setShowTestModal(prev => !prev);
    if (showTestModal) {
      setTestCodeResult(null);
      setTestDiscountCode("");
    } else {
      setTestDiscountCode(`SHARE${Math.floor(Math.random() * 10000)}`);
    }
  }, [showTestModal]);

  const handleGenerateTestCode = useCallback((codeToGenerate) => {
    setIsGeneratingCode(true);
    setTestCodeResult(null);
    
    const formData = new FormData();
    formData.append("action", "createDiscountCode");
    formData.append("code", codeToGenerate);
    formData.append("discountPercentage", discountPercentage);
    formData.append("expiryDays", discountExpiryDays);
    
    submit(formData, { method: "POST", replace: true })
      .then(async (response) => {
        setIsGeneratingCode(false);
        if (response && response.ok) {
          const result = await response.json();
          if (result.success) {
            setTestCodeResult({
              success: true,
              code: result.code,
              percentage: result.percentage,
              expiryDays: result.expiryDays
            });
          } else {
            setTestCodeResult({ success: false, error: result.error });
            setBannerContent(`Error generating test code: ${result.error}`);
            setBannerStatus("critical");
          }
        } else {
          setTestCodeResult({ success: false, error: 'Network error or non-JSON response' });
          setBannerContent('Error generating test code: Network error.');
          setBannerStatus("critical");
        }
      })
      .catch(err => {
        setIsGeneratingCode(false);
        setTestCodeResult({ success: false, error: err.message });
        setBannerContent(`Error generating test code: ${err.message}`);
        setBannerStatus("critical");
      });
  }, [discountPercentage, discountExpiryDays, submit]);

  const handleConnectInstagram = useCallback(() => window.location.href = "/api/instagram/auth", []);
  const toggleDisconnectModal = useCallback(() => setShowDisconnectModal(prev => !prev), []);
  
  const handleDisconnectInstagram = useCallback(() => {
    setIsDisconnecting(true);
    const formData = new FormData();
    formData.append("action", "disconnectInstagram");
    submit(formData, { method: "POST", replace: true });
    setShowDisconnectModal(false);
  }, [submit]);

  // --- Connection Status Badge ---
  const renderConnectionStatus = () => {
    if (isConnected) {
      return (
        <Badge status="success" progress="complete">
          <Button plain onClick={toggleDisconnectModal} disabled={isDisconnecting}>
            Connected to Instagram
          </Button>
        </Badge>
      );
    } else {
      return (
        <Badge status="critical">
          <Button plain onClick={handleConnectInstagram}>
            Not Connected
          </Button>
        </Badge>
      );
    }
  };

  return (
    <Page
      title="ShareSpike Settings"
      titleMetadata={renderConnectionStatus()}
      primaryAction={{
        content: "Save Discount Settings",
        onAction: handleSaveSettings,
        loading: isSaving,
        disabled: isSaving,
      }}
      secondaryActions={[
        { content: "Test Discount Generation", onAction: toggleTestModal },
      ]}
    >
      <BlockStack gap="500">
        {/* Banners for notifications */}
        {bannerContent && bannerStatus && (
          <Banner status={bannerStatus} onDismiss={() => { setBannerContent(null); setBannerStatus(null); }}>
            <p>{bannerContent}</p>
          </Banner>
        )}
        {error && !bannerContent && (
          <Banner status="critical"><p>Error loading page data: {error}</p></Banner>
        )}

        <Layout>
          {/* Instagram Connection Card */}
          <Layout.Section>
            <CardInstagramConnection
              shop={settings.shop_id} // Pass shop domain
              isConnected={isConnected}
              onConnect={handleConnectInstagram} // Note: onConnect might need adjustment later
            />
          </Layout.Section>

          {/* Discount Settings Card */}
          <Layout.Section>
            <CardDiscountSettings
              discountPercentage={discountPercentage}
              onDiscountPercentageChange={setDiscountPercentage}
              discountExpiryDays={discountExpiryDays}
              onDiscountExpiryDaysChange={setDiscountExpiryDays}
              eligibleProductsCount={selectedProducts.length}
              onSelectProductsClick={toggleProductSelector}
            />
          </Layout.Section>

          {/* Test Verification Card */}
          <Layout.Section>
            <CardTestVerification />
          </Layout.Section>
        </Layout>
      </BlockStack>

      {/* Modals */}
      <ModalProductSelector
        open={showProductSelector}
        onClose={toggleProductSelector}
        products={products}
        selectedProducts={selectedProducts}
        onSelectionChange={handleProductSelectionChange}
      />

      <ModalTestDiscount
        open={showTestModal}
        onClose={toggleTestModal}
        onGenerateCode={handleGenerateTestCode}
        isLoading={isGeneratingCode}
        testCodeResult={testCodeResult}
        initialTestCode={testDiscountCode}
      />

      <ModalDisconnectConfirm
        open={showDisconnectModal}
        onClose={toggleDisconnectModal}
        onConfirm={handleDisconnectInstagram}
        isLoading={isDisconnecting}
      />
    </Page>
  );
}
