import React from 'react';
import {
  Modal,
  EmptyState,
  ResourceList,
  ResourceItem,
  Thumbnail,
  Text,
  Checkbox,
  InlineStack,
  BlockStack,
} from "@shopify/polaris";

function ModalProductSelector({
  open,
  onClose,
  products,
  selectedProducts,
  onSelectionChange,
}) {
  if (!products) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Select Eligible Products"
      primaryAction={{
        content: "Confirm Selection",
        onAction: onClose
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: onClose
        }
      ]}
    >
      <Modal.Section>
        {products.length > 0 ? (
          <ResourceList
            resourceName={{ singular: "product", plural: "products" }}
            items={products}
            renderItem={(item) => {
              const { id, title, featuredImage, vendor } = item;
              const media = (
                <Thumbnail
                  source={featuredImage?.url || ""}
                  alt={title}
                  size="small"
                />
              );

              return (
                <ResourceItem
                  id={id}
                  media={media}
                  accessibilityLabel={`Select ${title}`}
                  name={title}
                >
                  <InlineStack align="space-between">
                    <BlockStack>
                      <Text variant="bodyMd" fontWeight="bold">
                        {title}
                      </Text>
                      <Text variant="bodyMd" color="subdued">
                        {vendor}
                      </Text>
                    </BlockStack>
                    <Checkbox
                      label="Eligible"
                      labelHidden
                      checked={selectedProducts.includes(id)}
                      onChange={() => {
                        if (selectedProducts.includes(id)) {
                          onSelectionChange(selectedProducts.filter(p => p !== id));
                        } else {
                          onSelectionChange([...selectedProducts, id]);
                        }
                      }}
                    />
                  </InlineStack>
                </ResourceItem>
              );
            }}
            selectable
            selectedItems={selectedProducts}
            onSelectionChange={onSelectionChange}
          />
        ) : (
          <EmptyState
            heading="No products found"
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>Add products to your store first.</p>
          </EmptyState>
        )}
      </Modal.Section>
    </Modal>
  );
}

export default ModalProductSelector; 