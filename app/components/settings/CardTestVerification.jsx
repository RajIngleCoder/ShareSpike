import React from 'react';
import {
  Card,
  BlockStack,
  Text,
} from "@shopify/polaris";
import FormShareSubmission from "../customer/FormShareSubmission";

function CardTestVerification() {
  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">Test Instagram Verification</Text>
        <Text as="p" variant="bodyMd">
          Use this form to test the Instagram share verification process. Enter an Instagram post URL and an email to simulate a customer submission.
        </Text>
        <FormShareSubmission />
      </BlockStack>
    </Card>
  );
}

export default CardTestVerification; 