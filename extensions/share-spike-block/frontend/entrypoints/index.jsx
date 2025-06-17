import React from 'react';
import ReactDOM from 'react-dom/client';
import { Card, Text } from '@shopify/polaris'; // Import Polaris components

console.log("ShareSpikeBlock: index.jsx loaded.");

let reactRoot = null;

// Expose an init function globally that the Liquid file can call
console.log("ShareSpikeBlock: Attempting to define global ShareSpikeBlock.");
window.ShareSpikeBlock = {
  init: (rootElement, shopDomain) => {
    console.log("ShareSpikeBlock: init function called.", { rootElement, shopDomain });
    if (rootElement) {
      if (!reactRoot) {
        console.log("ShareSpikeBlock: Root element found, attempting to create root.");
        reactRoot = ReactDOM.createRoot(rootElement);
        reactRoot.render(
          <React.StrictMode>
            <Card sectioned>
              <Text as="h2" variant="headingMd">Share Spike Block Placeholder</Text>
              <p>If you see this, Polaris is rendering!</p>
            </Card>
          </React.StrictMode>
        );
        console.log("ShareSpikeBlock: React app rendered.");
      } else {
        console.warn("ShareSpikeBlock: React app already rendered on this element. Skipping re-render.");
      }
    } else {
      console.error("ShareSpikeBlock: Root element not found for mounting React app.");
    }
  },
};
console.log("ShareSpikeBlock: Global ShareSpikeBlock defined.");
