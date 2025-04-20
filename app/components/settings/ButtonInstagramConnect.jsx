import React from 'react';
import { Button, Link } from "@shopify/polaris";

function ButtonInstagramConnect() {
  // Instagram OAuth URL as provided
  const instagramAuthUrl = 'https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=1389247025830519&redirect_uri=https://sharespike.fly.dev/auth/callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights';
  
  return (
    <Link url={instagramAuthUrl} external>
      <Button primary>Connect to Instagram</Button>
    </Link>
  );
}

export default ButtonInstagramConnect; 