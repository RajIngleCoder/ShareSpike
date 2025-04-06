import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, Form } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  RangeSlider,
  Button,
  Banner,
  Spinner,
  InlineStack,
  BlockStack,
  Text,
  ResourceList,
  ResourceItem,
  Thumbnail,
  Checkbox,
  Modal,
  TextField,
  EmptyState,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { authenticate } from "../shopify.server";
import { getAppSettings, saveAppSettings, storeDiscountCode } from "../supabase.server";

const generateDiscountCode = () => {
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `SHARE${timestamp}${random}`;
};

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    // Fetch existing settings from Supabase
    const settings = await getAppSettings(shop) || {
      shop_id: shop,
      discount_percentage: 10,
      discount_expiry_days: 7,
      eligible_products: [],
    };

    // Fetch products from Shopify
    const response = await admin.graphql(
      `#graphql
        query {
          products(first: 50) {
            nodes {
              id
              title
              featuredImage {
                url
              }
              vendor
              status
            }
          }
        }
      `
    );

    const responseJson = await response.json();
    const products = responseJson.data.products.nodes;

    return json({
      shop,
      settings,
      products,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return json({
      shop,
      settings: {
        shop_id: shop,
        discount_percentage: 10,
        discount_expiry_days: 7,
        eligible_products: [],
      },
      products: [],
      error: "Failed to load data",
    });
  }
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  
  const action = formData.get("action");
  
  if (action === "saveSettings") {
    const discountPercentage = parseInt(formData.get("discountPercentage"), 10);
    const discountExpiryDays = parseInt(formData.get("discountExpiryDays"), 10);
    const eligibleProductsJson = formData.get("eligibleProducts");
    let eligibleProducts = [];
    
    try {
      eligibleProducts = JSON.parse(eligibleProductsJson);
    } catch (e) {
      console.error("Error parsing eligible products", e);
    }
    
    try {
      const settings = {
        shop_id: shop,
        discount_percentage: discountPercentage,
        discount_expiry_days: discountExpiryDays,
        eligible_products: eligibleProducts
      };
      
      await saveAppSettings(settings);
      return json({ success: true });
    } catch (error) {
      console.error("Error saving settings:", error);
      return json({ success: false, error: error.message }, { status: 500 });
    }
  } else if (action === "createDiscountCode") {
    const code = formData.get("code");
    const discountPercentage = parseInt(formData.get("discountPercentage"), 10);
    const expiryDays = parseInt(formData.get("expiryDays"), 10);
    
    try {
      // Create expiry date
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);
      
      // Create discount code using Shopify Admin API
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

      // Extract data for database
      const shopifyDiscountId = responseJson.data.discountCodeBasicCreate.codeDiscountNode.id;
      const generatedCode = responseJson.data.discountCodeBasicCreate.codeDiscountNode.codeDiscount.codes.nodes[0].code;
      const expiryTimestamp = expiryDate.toISOString();

      try {
        await storeDiscountCode({
          shop_id: shop,
          discount_code: generatedCode,
          shopify_discount_id: shopifyDiscountId,
          expires_at: expiryTimestamp,
        });
      } catch (dbError) {
        console.error("Error saving discount code to DB:", dbError);
        // Consider whether to still return success to the frontend
      }
      
      return json({
        success: true,
        discountCode: responseJson.data?.discountCodeBasicCreate?.codeDiscountNode?.codeDiscount
      });
    } catch (error) {
      console.error("Error creating discount code:", error);
      return json({ success: false, error: error.message }, { status: 500 });
    }
  }
  
  return json({ success: false, error: "Invalid action" }, { status: 400 });
};

export default function SettingsPage() {
  const { settings, products, error } = useLoaderData();
  const submit = useSubmit();
  
  // Settings state
  const [discountPercentage, setDiscountPercentage] = useState(
    settings?.discount_percentage || 10
  );
  const [discountExpiryDays, setDiscountExpiryDays] = useState(
    settings?.discount_expiry_days || 7
  );
  
  // Selected products state
  const [selectedProducts, setSelectedProducts] = useState(
    settings?.eligible_products || []
  );
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testDiscountCode, setTestDiscountCode] = useState("");
  const [testCodeResult, setTestCodeResult] = useState(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  
  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    const formData = new FormData();
    formData.append("action", "saveSettings");
    formData.append("discountPercentage", discountPercentage);
    formData.append("discountExpiryDays", discountExpiryDays);
    formData.append("eligibleProducts", JSON.stringify(selectedProducts));
    
    submit(formData, { method: "POST" });
    
    // Reset saving state after a delay
    setTimeout(() => setIsSaving(false), 1000);
  };
  
  const handleProductSelection = useCallback((selectedItems) => {
    setSelectedProducts(selectedItems);
  }, []);
  
  const toggleProductSelector = useCallback(() => {
    setShowProductSelector(!showProductSelector);
  }, [showProductSelector]);
  
  const toggleTestModal = useCallback(() => {
    setShowTestModal(!showTestModal);
    if (!showTestModal) {
      setTestCodeResult(null);
      setTestDiscountCode(`SHARE${Math.floor(Math.random() * 10000)}`);
    }
  }, [showTestModal]);
  
  const handleGenerateTestCode = useCallback(() => {
    setIsGeneratingCode(true);
    
    const formData = new FormData();
    formData.append("action", "createDiscountCode");
    formData.append("code", testDiscountCode);
    formData.append("discountPercentage", discountPercentage);
    formData.append("expiryDays", discountExpiryDays);
    
    submit(formData, { method: "POST" });
    
    // This would be replaced with actual API response handling
    setTimeout(() => {
      setIsGeneratingCode(false);
      setTestCodeResult({
        success: true,
        code: testDiscountCode,
        percentage: discountPercentage,
        expiryDays: discountExpiryDays
      });
    }, 1500);
  }, [testDiscountCode, discountPercentage, discountExpiryDays, submit]);
  
  const eligibleProductsCount = selectedProducts.length;
  
  return (
    <Page
      title="ShareSpike Settings"
      primaryAction={{
        content: "Save",
        onAction: handleSave,
        loading: isSaving,
        disabled: isSaving
      }}
      secondaryActions={[
        {
          content: "Test Discount Generation",
          onAction: toggleTestModal
        }
      ]}
    >
      <BlockStack gap="400">
        {error && (
          <Banner status="critical">
            <p>Error: {error}</p>
          </Banner>
        )}
        
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Discount Settings</Text>
                
                <Form method="post" onSubmit={handleSave}>
                  <FormLayout>
                    <BlockStack gap="400">
                      <Text as="p" variant="bodyMd">
                        Configure the discount that customers will receive after sharing your products on Instagram.
                      </Text>
                      
                      <RangeSlider
                        label="Discount Percentage"
                        value={discountPercentage}
                        onChange={setDiscountPercentage}
                        output
                        min={5}
                        max={50}
                        step={5}
                      />
                      
                      <RangeSlider
                        label="Discount Expiry (Days)"
                        value={discountExpiryDays}
                        onChange={setDiscountExpiryDays}
                        output
                        min={1}
                        max={30}
                        step={1}
                      />
                      
                      <Button onClick={toggleProductSelector}>
                        {eligibleProductsCount > 0 
                          ? `Eligible Products (${eligibleProductsCount})`
                          : "Select Eligible Products"}
                      </Button>
                      
                      {eligibleProductsCount === 0 && (
                        <Text as="p" variant="bodyMd" color="subdued">
                          No products selected. All products will be eligible for discounts.
                        </Text>
                      )}
                    </BlockStack>
                  </FormLayout>
                </Form>
              </BlockStack>
            </Card>
          </Layout.Section>
          
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Instagram Connection</Text>
                <Text as="p" variant="bodyMd">
                  Connect your Instagram account to verify customer shares. This allows ShareSpike to
                  automatically validate when customers share your products.
                </Text>
                <Button>Connect Instagram Account</Button>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
      
      {/* Product Selector Modal */}
      <Modal
        open={showProductSelector}
        onClose={toggleProductSelector}
        title="Select Eligible Products"
        primaryAction={{
          content: "Confirm Selection",
          onAction: toggleProductSelector
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: toggleProductSelector
          }
        ]}
      >
        <Modal.Section>
          {products.length > 0 ? (
            <ResourceList
              resourceName={{ singular: "product", plural: "products" }}
              items={products}
              renderItem={(item) => {
                const { id, title, featuredImage, vendor } = item;
                const media = (
                  <Thumbnail
                    source={featuredImage?.url || ""}
                    alt={title}
                    size="small"
                  />
                );

                return (
                  <ResourceItem
                    id={id}
                    media={media}
                    accessibilityLabel={`Select ${title}`}
                    name={title}
                  >
                    <InlineStack align="space-between">
                      <BlockStack>
                        <Text variant="bodyMd" fontWeight="bold">
                          {title}
                        </Text>
                        <Text variant="bodyMd" color="subdued">
                          {vendor}
                        </Text>
                      </BlockStack>
                      <Checkbox
                        label="Eligible"
                        labelHidden
                        checked={selectedProducts.includes(id)}
                        onChange={() => {
                          if (selectedProducts.includes(id)) {
                            setSelectedProducts(selectedProducts.filter(p => p !== id));
                          } else {
                            setSelectedProducts([...selectedProducts, id]);
                          }
                        }}
                      />
                    </InlineStack>
                  </ResourceItem>
                );
              }}
              selectable
              selectedItems={selectedProducts}
              onSelectionChange={handleProductSelection}
            />
          ) : (
            <EmptyState
              heading="No products found"
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Add products to your store first.</p>
            </EmptyState>
          )}
        </Modal.Section>
      </Modal>
      
      {/* Test Discount Code Modal */}
      <Modal
        open={showTestModal}
        onClose={toggleTestModal}
        title="Test Discount Code Generation"
        primaryAction={{
          content: "Generate Code",
          onAction: handleGenerateTestCode,
          loading: isGeneratingCode,
          disabled: isGeneratingCode || testCodeResult !== null
        }}
        secondaryActions={[
          {
            content: "Close",
            onAction: toggleTestModal
          }
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text as="p" variant="bodyMd">
              This will generate a test discount code using the Shopify Admin API.
              You can use this to verify your discount settings.
            </Text>
            
            {testCodeResult === null ? (
              <TextField
                label="Discount Code"
                value={testDiscountCode}
                onChange={setTestDiscountCode}
                autoComplete="off"
              />
            ) : (
              <Banner status="success" title="Discount Code Generated">
                <p>Code: <strong>{testCodeResult.code}</strong></p>
                <p>Discount: {testCodeResult.percentage}%</p>
                <p>Expires in: {testCodeResult.expiryDays} days</p>
              </Banner>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
