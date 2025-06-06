import { json } from "@remix-run/node";
import { useLoaderData } from '@remix-run/react';
import FormShareSubmission from "../components/customer/FormShareSubmission";
import { Page } from "@shopify/polaris";

export async function loader({ request }) {
  const url = new URL(request.url);
  const shopDomain = url.hostname; // This should be the storefront domain
  console.log(`[Share Verification Page] Loader accessed. Shop Domain: ${shopDomain}`);
  return json({ shopDomain });
}

export default function ShareVerificationPage() {
  const { shopDomain } = useLoaderData();

  return (
    <Page
      title="Verify Your Instagram Share"
      subtitle="Enter your Instagram post URL to receive your discount."
    >
      <FormShareSubmission shopDomain={shopDomain} />
    </Page>
  );
} 