import React from 'react';
import {
  Card,
  BlockStack,
  Text,
  Button,
} from "@shopify/polaris";

// Accept shop prop
function CardInstagramConnection({ shop, isConnected, onConnect }) {
  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">Instagram Connection</Text>
        <Text as="p" variant="bodyMd">
          Connect your Instagram account to verify customer shares. This allows ShareSpike to
          automatically validate when customers share your products.
        </Text>
        
        {!isConnected ? (
          <Button
            primary
            onClick={() => {
              // Add state parameter using the shop prop
              const instagramAuthUrl = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=1389247025830519&redirect_uri=https://sharespike.fly.dev/api/auth/instagram/callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights&state=${encodeURIComponent(shop)}`;
              window.open(instagramAuthUrl, '_blank', 'noopener,noreferrer');
            }}
          >
            Connect Instagram Account
          </Button>
        ) : (
          <Text as="p" variant="bodyMd" color="success">
            Your Instagram account is connected. You can disconnect it using the badge at the top of the page.
          </Text>
        )}
      </BlockStack>
    </Card>
  );
}

export default CardInstagramConnection;
