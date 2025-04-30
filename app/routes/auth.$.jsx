import { redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";

// This loader's sole purpose is to handle the OAuth callback and let
// the authenticate.admin function create the session and redirect.
export const loader = async ({ request }) => {
  await authenticate.admin(request);

  // The authenticate.admin function handles the redirect automatically
  // upon successful authentication. We shouldn't reach this point normally.
  // If we do, it might indicate an issue, redirect to login for safety.
  return redirect("/app"); 
};
