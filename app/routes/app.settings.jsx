import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, Form } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  RangeSlider,
  Button,
  Banner,
  Spinner,
  InlineStack,
  BlockStack,
  Text,
} from "@shopify/polaris";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import { getAppSettings, saveAppSettings } from "../supabase.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    // Fetch existing settings from Supabase
    const settings = await getAppSettings(shop);
    
    return json({
      shop,
      settings: settings || {
        shop_id: shop,
        discount_percentage: 10,
        discount_expiry_days: 7,
        eligible_products: [],
      },
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return json({
      shop,
      settings: {
        shop_id: shop,
        discount_percentage: 10,
        discount_expiry_days: 7,
        eligible_products: [],
      },
      error: "Failed to load settings",
    });
  }
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  
  const discountPercentage = parseInt(formData.get("discountPercentage"), 10);
  const discountExpiryDays = parseInt(formData.get("discountExpiryDays"), 10);
  
  try {
    const settings = {
      shop_id: shop,
      discount_percentage: discountPercentage,
      discount_expiry_days: discountExpiryDays,
      eligible_products: [] // This would be populated from product selection UI
    };
    
    await saveAppSettings(settings);
    return json({ success: true });
  } catch (error) {
    console.error("Error saving settings:", error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
};

export default function SettingsPage() {
  const { settings, error } = useLoaderData();
  const submit = useSubmit();
  
  const [discountPercentage, setDiscountPercentage] = useState(
    settings?.discount_percentage || 10
  );
  const [discountExpiryDays, setDiscountExpiryDays] = useState(
    settings?.discount_expiry_days || 7
  );
  
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    const formData = new FormData();
    formData.append("discountPercentage", discountPercentage);
    formData.append("discountExpiryDays", discountExpiryDays);
    
    submit(formData, { method: "POST" });
    
    // Reset saving state after a delay
    setTimeout(() => setIsSaving(false), 1000);
  };
  
  return (
    <Page title="ShareSpike Settings">
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
                      
                      <InlineStack align="end">
                        <Button primary submit disabled={isSaving}>
                          {isSaving ? <Spinner size="small" /> : "Save Settings"}
                        </Button>
                      </InlineStack>
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
    </Page>
  );
} 