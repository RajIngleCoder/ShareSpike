import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import shopify from 'vite-plugin-shopify';

export default defineConfig({
  plugins: [
    react(),
    shopify({
      // The root for the theme app extension itself
      themeRoot: '.', 
      // Output assets to the 'assets' directory within the themeRoot (extensions/share-spike-block/assets)
      sourceCodeDir: 'frontend',
      entrypointsDir: 'frontend/entrypoints',
      output: 'assets',
      // Ensure the snippet file name is consistent
      snippetFile: 'vite-tag.liquid',
    }),
  ],
});