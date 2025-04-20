import { useState } from 'react';
import {
  Button,
  Card,
  Form,
  FormLayout,
  LegacyStack,
  Spinner,
  Text,
  TextField,
  Banner,
  Box,
} from '@shopify/polaris';

// This component needs to be wrapped in PolarisProvider in your application
// e.g., in your layout or page component.

function FormShareSubmission() {
  const [postUrl, setPostUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [customerEmail, setCustomerEmail] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);
  const [shopId, setShopId] = useState(null); // Add shopId state

  const handleUrlChange = (value) => setPostUrl(value);
  const handleEmailChange = (value) => setCustomerEmail(value);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setVerificationResult(null);
    setDebugInfo(null);
    setShopId(null); // Reset shopId

    if (!postUrl || !customerEmail) {
      setError('Please enter both the Instagram post URL and your email.');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Submitting verification request:', { postUrl, customerEmail });

      const response = await fetch('/api/instagram/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postUrl,
          customerEmail // This will be stored as customer_identifier in share_verifications
        }),
      });

      const result = await response.json();
      console.log('Verification result:', result);

      // Store detailed result for debugging
      setDebugInfo({
        statusCode: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()]),
        result: result,
      });

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Verification failed');
      }

      setVerificationResult(result);
      if (!result.success || !result.verified) {
        setError(result.message || 'Share could not be verified.');
      }

      // Extract shopId from result (assuming it's returned in the result)
      if (result.shopId) {
        setShopId(result.shopId);
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to display verification details from the share_verifications table
  const renderVerificationDetails = () => {
    if (!verificationResult || !verificationResult.share) return null;

    const share = verificationResult.share;
    return (
      <LegacyStack vertical spacing="tight">
        <Text as="p">Verification ID: {share.id}</Text>
        {share.instagram_media_id && (
          <Text as="p">Instagram Media ID: {share.instagram_media_id}</Text>
        )}
        {share.verification_status && (
          <Text as="p" fontWeight="bold">
            Status: {share.verification_status}
          </Text>
        )}
        {share.verified_at && (
          <Text as="p">Verified at: {new Date(share.verified_at).toLocaleString()}</Text>
        )}
      </LegacyStack>
    );
  };

  return (
    <LegacyStack vertical spacing="loose">
      <Card sectioned>
        <Form onSubmit={handleSubmit}>
          <FormLayout>
            <TextField
              label="Instagram Post URL"
              value={postUrl}
              onChange={handleUrlChange}
              placeholder="https://www.instagram.com/p/Cxyz.../"
              autoComplete="off"
              disabled={isLoading}
              error={error && !postUrl ? 'Instagram post URL is required' : undefined}
              helpText="Enter the URL of your Instagram post that mentions or tags the store"
            />
            <TextField
              label="Your Email"
              type="email"
              value={customerEmail}
              onChange={handleEmailChange}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={isLoading}
              error={error && !customerEmail ? 'Email is required' : undefined}
              helpText="This will be used to associate the discount with your account"
            />

            {error && (
              <Banner status="critical">
                <p>{error}</p>
              </Banner>
            )}

            {verificationResult && verificationResult.success && verificationResult.verified && (
              <Banner status="success" title="Instagram Share Verified">
                <p>{verificationResult.message}</p>
                {verificationResult.discountCode && (
                  <Text as="p" fontWeight="bold" variant="headingSm">
                    Your discount code: {verificationResult.discountCode}
                  </Text>
                )}
                {renderVerificationDetails()}
              </Banner>
            )}

            <Button submit primary disabled={isLoading || !postUrl || !customerEmail}>
              {isLoading ? <Spinner size="small" /> : 'Verify Share'}
            </Button>
          </FormLayout>
        </Form>
      </Card>

      {/* Display shopId */}
      {shopId && (
        <Card sectioned title="Shop ID">
          <Text as="p">{shopId}</Text>
        </Card>
      )}

      {debugInfo && (
        <Card sectioned title="Debug Information (For Development)">
          <LegacyStack vertical spacing="tight">
            <Text as="h3" variant="headingSm">Response Status: {debugInfo.statusCode} {debugInfo.statusText}</Text>
            <div style={{
              padding: '1rem',
              backgroundColor: 'rgba(241, 241, 241, 0.8)',
              borderRadius: '0.5rem',
              border: '1px solid rgba(203, 203, 203, 0.8)',
              overflowX: 'auto'
            }}>
              <pre>{JSON.stringify(debugInfo.result, null, 2)}</pre>
            </div>
          </LegacyStack>
        </Card>
      )}
    </LegacyStack>
  );
}

export default FormShareSubmission;