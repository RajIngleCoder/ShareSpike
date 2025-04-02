import { json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  DataTable,
  Spinner,
  Text,
  Button,
  Banner,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  try {
    const response = await admin.graphql(
      `#graphql
        query {
          products(first: 50) {
            nodes {
              id
              title
              vendor
              status
              variants(first: 1) {
                nodes {
                  price
                  inventoryQuantity
                }
              }
            }
          }
        }
      `
    );

    const json = await response.json();
    
    const products = json.data.products.nodes.map((product) => ({
      id: product.id,
      title: product.title,
      vendor: product.vendor,
      price: product.variants.nodes[0]?.price || "0.00",
      status: product.status,
      inventory: product.variants.nodes[0]?.inventoryQuantity || 0
    }));

    return { products };
  } catch (error) {
    console.error("Error fetching products:", error);
    return json({ error: error.message || "Failed to fetch products" }, { status: 500 });
  }
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "refresh") {
    return null;
  }

  return json({});
};

export default function ProductsPage() {
  const { products, error } = useLoaderData();
  const submit = useSubmit();

  const rows = products?.map((product) => [
    <Text variant="bodyMd" as="span" key={`title-${product.id}`}>
      {product.title}
    </Text>,
    <Text variant="bodyMd" as="span" key={`vendor-${product.id}`}>
      {product.vendor}
    </Text>,
    <Text variant="bodyMd" as="span" key={`price-${product.id}`}>
      ${product.price}
    </Text>,
    <Text variant="bodyMd" as="span" key={`status-${product.id}`}>
      {product.status}
    </Text>,
    <Text variant="bodyMd" as="span" key={`inventory-${product.id}`}>
      {product.inventory}
    </Text>,
  ]) || [];

  if (error) {
    return (
      <Page title="Products">
        <Layout>
          <Layout.Section>
            <Banner status="critical">
              <p>Error loading products: {error}</p>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page
      title="Products"
      primaryAction={
        <Button
          onClick={() => submit({ action: "refresh" }, { method: "POST" })}
        >
          Refresh
        </Button>
      }
    >
      <Layout>
        <Layout.Section>
          <Card>
            {!products ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <Spinner accessibilityLabel="Loading products" size="large" />
              </div>
            ) : (
              <DataTable
                columnContentTypes={[
                  "text",
                  "text",
                  "numeric",
                  "text",
                  "numeric",
                ]}
                headings={[
                  "Product",
                  "Vendor",
                  "Price",
                  "Status",
                  "Inventory",
                ]}
                rows={rows}
              />
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 