import React from 'react';
import {
  Modal,
  Text,
  BlockStack,
} from "@shopify/polaris";

function ModalDisconnectConfirm({
  open,
  onClose,
  onConfirm,
  isLoading,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Disconnect Instagram Account"
      primaryAction={{
        content: "Disconnect",
        destructive: true,
        onAction: onConfirm,
        loading: isLoading,
        disabled: isLoading
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: onClose,
          disabled: isLoading
        }
      ]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <Text as="p" variant="bodyMd">
            Are you sure you want to disconnect your Instagram account? 
            This will prevent verification of Instagram shares until you reconnect.
          </Text>
          <Text as="p" variant="bodyMd">
            Any existing verified shares and discount codes will remain valid.
          </Text>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}

export default ModalDisconnectConfirm; 