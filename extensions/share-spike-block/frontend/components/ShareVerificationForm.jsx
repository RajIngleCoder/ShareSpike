import React, { useState } from 'react';
import {
  Card,
  TextField,
  Button,
  Banner,
  Spinner,
  Text,
  InlineStack // Changed from Stack to InlineStack
} from '@shopify/polaris';

function ShareVerificationForm({ shopDomain }) {
  const [instagramUrl, setInstagramUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'critical', text: string }

  const handleSubmit = async () => {
    if (!instagramUrl) {
      setMessage({ type: 'critical', text: 'Please enter an Instagram post URL.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // This API route will be created in Phase 3
      const response = await fetch(`/api/storefront/verify-share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instagramUrl,
          shopDomain, // Pass the shop domain from the UI Extension context
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: data.message || 'Your share has been verified! Discount code will be sent to your email shortly.' });
        setInstagramUrl(''); // Clear the input on success
      } else {
        setMessage({ type: 'critical', text: data.error || 'Failed to verify share. Please try again or contact support.' });
      }
    } catch (error) {
      console.error('Error verifying Instagram share:', error);
      setMessage({ type: 'critical', text: 'An unexpected error occurred. Please try again later.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card sectioned> {/* Polaris Card often uses 'sectioned' prop for default padding */}
      <InlineStack vertical spacing="loose"> {/* Replaced div with InlineStack */}
        <Text as="h2" variant="headingLg">Share & Earn Program</Text>
        <Text as="p" variant="bodyMd">
          Share your favorite products on Instagram and earn a discount!
          Make sure to mention our store (e.g., @yourstorehandle) and include a link to the product in your caption.
        </Text>

        {message && (
          <Banner status={message.type}>
            {message.text}
          </Banner>
        )}

        <TextField
          label="Instagram Post URL"
          value={instagramUrl}
          onChange={setInstagramUrl}
          placeholder="e.g., https://www.instagram.com/p/YourPostID/"
          autoComplete="off"
          helpText="Paste the direct link to your Instagram post where you shared our product."
        />

        <Button primary onClick={handleSubmit} loading={isLoading}>
          {isLoading ? <Spinner accessibilityLabel="Verifying share" size="small" /> : "Verify Share"}
        </Button>
      </InlineStack>
    </Card>
  );
}

export default ShareVerificationForm;
