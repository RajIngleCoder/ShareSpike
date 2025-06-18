import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppProvider } from '@shopify/polaris'; // Import AppProvider
import ShareVerificationForm from '../components/ShareVerificationForm.jsx'; // Import the actual form component
import '@shopify/polaris/build/esm/styles.css'; // Import Polaris CSS

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
            {/* Wrap the ShareVerificationForm with AppProvider */}
            <AppProvider i18n={{
              Polaris: {
                Common: {
                  checkbox: 'checkbox',
                },
              },
            }}>
              <ShareVerificationForm shopDomain={shopDomain} />
            </AppProvider>
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
