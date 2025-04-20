import { json } from "@remix-run/node";
import { verifyInstagramShare } from "../services/instagram.server";
import { authenticate } from "../shopify.server";

export async function action({ request }) {
  try {
    // Using Shopify's authenticate middleware
    const { session } = await authenticate.admin(request);
    if (!session || !session.shop) {
      return json(
        { 
          success: false, 
          message: "You must be logged in as a shop admin",
          verified: false
        }, 
        { status: 401 }
      );
    }

    // Get the request body
    const body = await request.json();
    const { postUrl, customerEmail } = body;
    
    if (!postUrl || !customerEmail) {
      return json(
        { 
          success: false, 
          message: "Missing required fields", 
          verified: false
        }, 
        { status: 400 }
      );
    }

    // Use the shop from the session
    const shopId = session.shop;
    console.log(`Verifying Instagram share for shop: ${shopId}, post URL: ${postUrl}, customer: ${customerEmail}`);
    
    // Call the verifyInstagramShare function with the correct parameters
    // This will be stored in the share_verifications table with customerEmail as customer_identifier
    const result = await verifyInstagramShare(shopId, postUrl, customerEmail);

    // Log the verification result
    console.log(`Verification result: ${result.success ? 'Success' : 'Failed'}, Verified: ${result.verified}`);

    // Include shopId in the response
    return json({
      ...result,
      shopId: shopId,
    });
  } catch (error) {
    console.error('Instagram verification error:', error);
    return json(
      { 
        success: false, 
        message: error.message || 'Failed to verify Instagram share',
        verified: false
      }, 
      { status: 500 }
    );
  }
}

// Return a 405 Method Not Allowed for any other HTTP method
export async function loader() {
  return json(
    { message: "Method not allowed" }, 
    { status: 405 }
  );
}
