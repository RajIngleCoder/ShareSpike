import { storeDiscountCode } from "../supabase.server";

/**
 * Create a discount code via Shopify Admin API
 * @param {Object} admin - Shopify admin instance
 * @param {Object} options - Discount code options
 * @returns {Promise<Object>} - Created discount code data
 */
export async function createDiscountCode(admin, options) {
  const {
    code,
    shopId,
    percentage,
    expiryDays = 7,
    title = null,
    shareVerificationId = null,
    productIds = []
  } = options;

  // Calculate expiry date
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + expiryDays);

  // Define products to apply discount to
  let hasSpecificProducts = productIds.length > 0;
  let productEdges = [];
  
  if (hasSpecificProducts) {
    productEdges = productIds.map(id => ({ node: { id } }));
  }

  try {
    // Create discount via GraphQL API
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
                        productVariants {
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
            title: title || `ShareSpike Discount: ${code}`,
            code,
            startsAt: new Date().toISOString(),
            endsAt: expiryDate.toISOString(),
            customerSelection: {
              all: true
            },
            customerGets: {
              value: {
                percentageValue: percentage
              },
              items: hasSpecificProducts
                ? {
                    products: {
                      productIds: productIds
                    }
                  }
                : {
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

    const discountNode = responseJson.data?.discountCodeBasicCreate?.codeDiscountNode;
    
    if (!discountNode) {
      throw new Error("Failed to create discount code");
    }

    // Store discount code in Supabase if this is for a verified share
    if (shareVerificationId) {
      await storeDiscountCode({
        shop_id: shopId,
        share_verification_id: shareVerificationId,
        code,
        percentage,
        expiry_date: expiryDate.toISOString(),
        used: false,
      });
    }

    return {
      id: discountNode.id,
      code,
      percentage,
      expiryDate: expiryDate.toISOString(),
      shareVerificationId
    };
  } catch (error) {
    console.error("Error creating discount code:", error);
    throw error;
  }
}

/**
 * Generate a unique discount code
 * @param {string} prefix - Prefix for discount code
 * @returns {string} - Generated discount code
 */
export function generateDiscountCode(prefix = "SHARE") {
  const timestamp = Date.now().toString().substr(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`.substring(0, 12);
}

/**
 * Check if a discount code exists
 * @param {Object} admin - Shopify admin instance
 * @param {string} code - Discount code to check
 * @returns {Promise<boolean>} - Whether the code exists
 */
export async function checkDiscountCodeExists(admin, code) {
  try {
    const response = await admin.graphql(
      `#graphql
        query discountNodes($query: String!) {
          codeDiscountNodes(first: 1, query: $query) {
            nodes {
              id
            }
          }
        }
      `,
      {
        variables: {
          query: `code:${code}`
        }
      }
    );

    const responseJson = await response.json();
    const nodes = responseJson.data?.codeDiscountNodes?.nodes || [];
    
    return nodes.length > 0;
  } catch (error) {
    console.error("Error checking discount code:", error);
    return false;
  }
} 