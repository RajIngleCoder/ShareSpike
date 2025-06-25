import React, { useState } from 'react';
import {
  Card,
  TextField,
  Button,
  Banner,
  Spinner,
  Text,
  InlineStack // Using InlineStack for layout
} from "@shopify/polaris";
// Removed import FormShareSubmission

function CardTestVerification() {
  const [instagramUrl, setInstagramUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'critical', text: string }

    const handleTestSubmit = async () => {
    console.log("Test Verification URL:", `/api/instagram/verify`); // Add this line
    if (!instagramUrl) {
      setMessage({ type: 'critical', text: 'Please enter an Instagram post URL.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/instagram/verify`, { // Call the admin API endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postUrl: instagramUrl }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: data.message || 'Test verification successful!' });
        setInstagramUrl(''); // Clear the input on success
      } else {
        setMessage({ type: 'critical', text: data.message || data.error || 'Test verification failed. Please check console for details.' });
      }
    } catch (error) {
      console.error('Error during test verification:', error);
      setMessage({ type: 'critical', text: 'An unexpected error occurred during test verification.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card sectioned>
      <InlineStack vertical spacing="loose">
        <Text as="h2" variant="headingMd">Test Instagram Verification</Text>
        <Text as="p" variant="bodyMd">
          Use this form to test the Instagram share verification process. Enter an Instagram post URL to simulate a customer submission.
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
          helpText="Paste the direct link to an Instagram post to test verification."
        />

        <Button primary onClick={handleTestSubmit} loading={isLoading}>
          {isLoading ? <Spinner accessibilityLabel="Testing verification" size="small" /> : "Test Verification"}
        </Button>
      </InlineStack>
    </Card>
  );
}

export default CardTestVerification;
