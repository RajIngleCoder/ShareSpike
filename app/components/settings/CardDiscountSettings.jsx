import React from 'react';
import {
  Card,
  BlockStack,
  Text,
  Button,
  FormLayout,
  RangeSlider,
} from "@shopify/polaris";

function CardDiscountSettings({
  discountPercentage,
  onDiscountPercentageChange,
  discountExpiryDays,
  onDiscountExpiryDaysChange,
  eligibleProductsCount,
  onSelectProductsClick,
}) {
  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">Discount Settings</Text>
        
        <FormLayout>
          <BlockStack gap="400">
            <Text as="p" variant="bodyMd">
              Configure the discount that customers will receive after sharing your products on Instagram.
            </Text>
            
            <RangeSlider
              label="Discount Percentage"
              value={discountPercentage}
              onChange={onDiscountPercentageChange}
              output
              min={5}
              max={50}
              step={5}
            />
            
            <RangeSlider
              label="Discount Expiry (Days)"
              value={discountExpiryDays}
              onChange={onDiscountExpiryDaysChange}
              output
              min={1}
              max={30}
              step={1}
            />
            
            <Button onClick={onSelectProductsClick}>
              {eligibleProductsCount > 0 
                ? `Eligible Products (${eligibleProductsCount})`
                : "Select Eligible Products"}
            </Button>
            
            {eligibleProductsCount === 0 && (
              <Text as="p" variant="bodyMd" color="subdued">
                No products selected. All products will be eligible for discounts.
              </Text>
            )}
          </BlockStack>
        </FormLayout>
      </BlockStack>
    </Card>
  );
}

export default CardDiscountSettings; 