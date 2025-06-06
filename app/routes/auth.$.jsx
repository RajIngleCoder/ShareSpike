import { redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { supabase } from "../supabase.server";

// This loader's sole purpose is to handle the OAuth callback and let
// the authenticate.admin function create the session and redirect.
export const loader = async ({ request }) => {
  await authenticate.admin(request);

  // The authenticate.admin function handles the redirect automatically
  // upon successful authentication. We shouldn't reach this point normally.
  // If we do, it might indicate an issue, redirect to login for safety.
  const session = await authenticate.admin(request);

  if (session) {
    console.log("[Shopify Auth Callback] Session found, upserting app_settings for shop:", session.shop);
    const { data, error } = await supabase.from('app_settings').upsert(
      { shop: session.shop },
      { onConflict: 'shop' }
    );

    if (error) {
      console.error("[Shopify Auth Callback] Error upserting app_settings:", error);
    } else {
      console.log("[Shopify Auth Callback] app_settings upsert successful:", data);
    }
  }

  return redirect("/app"); 
};
