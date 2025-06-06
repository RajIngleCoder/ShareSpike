import { useState, useEffect } from 'react';
import { Form, useActionData } from '@remix-run/react';
import {
  Button,
  Card,
  FormLayout,
  LegacyStack,
  Spinner,
  Text,
  TextField,
  Banner,
  Box,
  Link,
} from '@shopify/polaris';

// This component needs to be wrapped in PolarisProvider in your application
// e.g., in your layout or page component.

function FormShareSubmission({ shopDomain }) {
  const [postUrl, setPostUrl] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const actionData = useActionData();

  const handleUrlChange = (value) => setPostUrl(value);
  const handleEmailChange = (value) => setCustomerEmail(value);

  const success = actionData?.success;
  const error = actionData?.error;
  const discountCode = actionData?.discountCode;
  const shopifyOrderLink = actionData?.shopifyOrderLink;
  const debugInfo = actionData;

  const handleSubmit = (event) => {
    setIsLoading(true);
  };

  useEffect(() => {
    if (actionData) {
      setIsLoading(false);
    }
  }, [actionData]);

  return (
    <LegacyStack vertical spacing="loose">
      <Card sectioned>
        <Form method="post" onSubmit={handleSubmit}>
          <input type="hidden" name="action" value="verifyShare" />
          <FormLayout>
            <TextField
              label="Instagram Post URL"
              name="instagramUrl"
              value={postUrl}
              onChange={handleUrlChange}
              placeholder="https://www.instagram.com/p/Cxyz.../"
              autoComplete="off"
              disabled={isLoading}
              error={error && !postUrl ? 'Instagram post URL is required' : undefined}
              helpText="Enter the URL of your Instagram post that mentions or tags the store"
            />
            <TextField
              label="Customer Email (Optional)"
              name="customerEmail"
              value={customerEmail}
              onChange={handleEmailChange}
              placeholder="customer@example.com"
              autoComplete="email"
              disabled={isLoading}
              error={error && !customerEmail ? 'Customer email is required' : undefined}
              helpText="Enter the email used for your purchase, if applicable."
            />

            {error && (
              <Banner status="critical">
                <p>{error}</p>
              </Banner>
            )}

            {success && discountCode && (
              <Banner status="success" title="Share Verified!">
                <p>Congratulations! Your Instagram share has been verified.</p>
                <Text as="p" fontWeight="bold" variant="headingSm">
                  Your exclusive discount code: <code style={{ userSelect: 'all' }}>{discountCode}</code>
                </Text>
                <Text as="p" color="subdued">
                  Apply this code at checkout to receive your discount.
                </Text>
                {shopifyOrderLink && (
                  <Text as="p">
                    <Link url={shopifyOrderLink} external={true}>
                      View your order on Shopify
                    </Link>
                  </Text>
                )}
              </Banner>
            )}

            <Button submit primary disabled={isLoading || !postUrl}>
              {isLoading ? <Spinner size="small" /> : 'Verify Share'}
            </Button>
          </FormLayout>
        </Form>
      </Card>

      {debugInfo && (
        <Card sectioned title="Debug Information (Action Result)">
          <LegacyStack vertical spacing="tight">
            <div style={{
              padding: '1rem',
              backgroundColor: 'rgba(241, 241, 241, 0.8)',
              borderRadius: '0.5rem',
              border: '1px solid rgba(203, 203, 203, 0.8)',
              overflowX: 'auto'
            }}>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          </LegacyStack>
        </Card>
      )}
    </LegacyStack>
  );
}

export default FormShareSubmission;