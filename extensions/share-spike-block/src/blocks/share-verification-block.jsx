'use client';
import React, { useState } from 'react';
import { reactExtension, useApi, Link, render } from '@shopify/ui-extensions-react/customer-account';
import { BlockStack, Button, Text, TextField, Banner } from '@shopify/ui-extensions/customer-account';

render("purchase.thank-you.block.render", () => <ShareVerificationBlock />);


function ShareVerificationBlock() {
  console.log('ShareVerificationBlock component is rendering!');
  const { extension, i18n } = useApi();
  console.log('useApi hook values:', { extension, i18n });
  const [instagramUrl, setInstagramUrl] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [discountCode, setDiscountCode] = useState(null);
  const [shopifyOrderLink, setShopifyOrderLink] = useState(null);

  const handleSubmit = async () => {
    setMessage('');
    setIsError(false);
    setIsLoading(true);
    setDiscountCode(null);
    setShopifyOrderLink(null);

    try {
      const response = await fetch('/apps/share-spike/api/customer/verify-share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instagramUrl, customerEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Share verified successfully!');
        setIsError(false);
        setInstagramUrl('');
        setCustomerEmail('');
        if (data.discountCode) {
          setDiscountCode(data.discountCode);
        }
        if (data.shopifyOrderLink) {
          setShopifyOrderLink(data.shopifyOrderLink);
        }
      } else {
        setMessage(data.error || 'Failed to verify share.');
        setIsError(true);
      }
    } catch (error) {
      console.error('Error verifying share:', error);
      setMessage('An unexpected error occurred. Please try again.');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BlockStack>
      <Text as="h2" variant="headingMd">Verify Your Share</Text>
      {message && (
        <Banner title="Share Verification" status={isError ? "critical" : "success"}>
          {message}
          {!isError && discountCode && (
            <BlockStack>
              <Text as="p" fontWeight="bold">
                Your discount code: <code style={{ userSelect: 'all' }}>{discountCode}</code>
              </Text>
              <Text as="p" variant="bodySm" color="subdued">
                Apply this code at checkout to receive your discount.
              </Text>
              {shopifyOrderLink && (
                <Link to={shopifyOrderLink} external={true} appearance="button">
                  View your order on Shopify
                </Link>
              )}
            </BlockStack>
          )}
        </Banner>
      )}

      <TextField
        label="Instagram Post URL"
        value={instagramUrl}
        onChange={setInstagramUrl}
        placeholder="e.g., https://www.instagram.com/p/ABCDEFG123/"
        helpText="Enter the URL of your Instagram post mentioning our store or products."
      />
      <TextField
        label="Customer Email (Optional)"
        value={customerEmail}
        onChange={setCustomerEmail}
        placeholder="customer@example.com"
        helpText="Enter the email used for your purchase, if applicable."
      />
      <Button 
        primary 
        onClick={handleSubmit} 
        loading={isLoading}
        disabled={isLoading || !instagramUrl}
      >
        Verify Share & Get Discount
      </Button>
      <Text as="p" variant="bodySm">
        Not sure how it works? <Link to="https://your-store.com/pages/share-spike-info" external>Learn more</Link> about ShareSpike.
      </Text>
    </BlockStack>
  );
}

export default ShareVerificationBlock;
