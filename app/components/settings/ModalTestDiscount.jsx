import React, { useState, useEffect } from 'react';
import {
  Modal,
  TextField,
  Banner,
  Text,
  BlockStack,
} from "@shopify/polaris";

function ModalTestDiscount({
  open,
  onClose,
  onGenerateCode,
  isLoading,
  testCodeResult,
  initialTestCode = "",
}) {
  const [testCode, setTestCode] = useState(initialTestCode);

  // Update testCode when initialTestCode changes
  useEffect(() => {
    if (open && initialTestCode) {
      setTestCode(initialTestCode);
    }
  }, [open, initialTestCode]);

  const handleGenerateClick = () => {
    onGenerateCode(testCode);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Test Discount Code Generation"
      primaryAction={{
        content: "Generate Code",
        onAction: handleGenerateClick,
        loading: isLoading,
        disabled: isLoading || testCodeResult !== null
      }}
      secondaryActions={[
        {
          content: "Close",
          onAction: onClose
        }
      ]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <Text as="p" variant="bodyMd">
            This will generate a test discount code using the Shopify Admin API.
            You can use this to verify your discount settings.
          </Text>
          
          {testCodeResult === null ? (
            <TextField
              label="Discount Code"
              value={testCode}
              onChange={setTestCode}
              autoComplete="off"
            />
          ) : testCodeResult.success ? (
            <Banner status="success" title="Discount Code Generated">
              <p>Code: <strong>{testCodeResult.code}</strong></p>
              <p>Discount: {testCodeResult.percentage}%</p>
              <p>Expires in: {testCodeResult.expiryDays} days</p>
            </Banner>
          ) : (
            <Banner status="critical" title="Failed to Generate Code">
              <p>{testCodeResult.error || "An error occurred while generating the discount code."}</p>
            </Banner>
          )}
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}

export default ModalTestDiscount; 