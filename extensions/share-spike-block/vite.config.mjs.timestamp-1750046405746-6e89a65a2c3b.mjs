// vite.config.mjs
import { defineConfig } from "file:///C:/Users/ra986/share-spike/extensions/share-spike-block/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/ra986/share-spike/node_modules/@vitejs/plugin-react/dist/index.mjs";
import shopify from "file:///C:/Users/ra986/share-spike/node_modules/vite-plugin-shopify/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "C:\\Users\\ra986\\share-spike\\extensions\\share-spike-block";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    shopify({
      root: "extensions/share-spike-block",
      publicEntry: "blocks/share-spike-block.liquid",
      output: "assets"
      // builds into assets/
    })
  ],
  build: {
    // Output directory for the build files
    outDir: path.resolve(__vite_injected_original_dirname, "assets"),
    // Empty the output directory before building
    emptyOutDir: true,
    // Configure as a library to avoid hashing filenames by default
    lib: {
      entry: path.resolve(__vite_injected_original_dirname, "../frontend/share-spike-block/index.jsx"),
      name: "ShareSpikeBlock",
      fileName: () => `share-spike-block.js`,
      formats: ["umd"]
      // Changed to UMD for global exposure
    },
    rollupOptions: {
      // Do NOT externalize react or react-dom for Shopify theme app blocks!
      // output: {
      //   globals: {
      //     'react': 'React',
      //     'react-dom': 'ReactDOM',
      //   },
      // },
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubWpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxccmE5ODZcXFxcc2hhcmUtc3Bpa2VcXFxcZXh0ZW5zaW9uc1xcXFxzaGFyZS1zcGlrZS1ibG9ja1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxccmE5ODZcXFxcc2hhcmUtc3Bpa2VcXFxcZXh0ZW5zaW9uc1xcXFxzaGFyZS1zcGlrZS1ibG9ja1xcXFx2aXRlLmNvbmZpZy5tanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL3JhOTg2L3NoYXJlLXNwaWtlL2V4dGVuc2lvbnMvc2hhcmUtc3Bpa2UtYmxvY2svdml0ZS5jb25maWcubWpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHNob3BpZnkgZnJvbSAndml0ZS1wbHVnaW4tc2hvcGlmeSc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgc2hvcGlmeSh7XG4gICAgICByb290OiAnZXh0ZW5zaW9ucy9zaGFyZS1zcGlrZS1ibG9jaycsXG4gICAgICBwdWJsaWNFbnRyeTogJ2Jsb2Nrcy9zaGFyZS1zcGlrZS1ibG9jay5saXF1aWQnLFxuICAgICAgb3V0cHV0OiAnYXNzZXRzJyAgLy8gYnVpbGRzIGludG8gYXNzZXRzL1xuICAgIH0pXG4gIF0sXG4gIGJ1aWxkOiB7XG4gICAgLy8gT3V0cHV0IGRpcmVjdG9yeSBmb3IgdGhlIGJ1aWxkIGZpbGVzXG4gICAgb3V0RGlyOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnYXNzZXRzJyksXG4gICAgLy8gRW1wdHkgdGhlIG91dHB1dCBkaXJlY3RvcnkgYmVmb3JlIGJ1aWxkaW5nXG4gICAgZW1wdHlPdXREaXI6IHRydWUsXG4gICAgLy8gQ29uZmlndXJlIGFzIGEgbGlicmFyeSB0byBhdm9pZCBoYXNoaW5nIGZpbGVuYW1lcyBieSBkZWZhdWx0XG4gICAgbGliOiB7XG4gICAgICBlbnRyeTogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uL2Zyb250ZW5kL3NoYXJlLXNwaWtlLWJsb2NrL2luZGV4LmpzeCcpLFxuICAgICAgbmFtZTogJ1NoYXJlU3Bpa2VCbG9jaycsXG4gICAgICBmaWxlTmFtZTogKCkgPT4gYHNoYXJlLXNwaWtlLWJsb2NrLmpzYCxcbiAgICAgIGZvcm1hdHM6IFsndW1kJ10sIC8vIENoYW5nZWQgdG8gVU1EIGZvciBnbG9iYWwgZXhwb3N1cmVcbiAgICB9LFxuICAgIHJvbGx1cE9wdGlvbnM6IHsgICAgICAvLyBEbyBOT1QgZXh0ZXJuYWxpemUgcmVhY3Qgb3IgcmVhY3QtZG9tIGZvciBTaG9waWZ5IHRoZW1lIGFwcCBibG9ja3MhXG4gICAgICAvLyBvdXRwdXQ6IHtcbiAgICAgIC8vICAgZ2xvYmFsczoge1xuICAgICAgLy8gICAgICdyZWFjdCc6ICdSZWFjdCcsXG4gICAgICAvLyAgICAgJ3JlYWN0LWRvbSc6ICdSZWFjdERPTScsXG4gICAgICAvLyAgIH0sXG4gICAgICAvLyB9LFxuICAgIH0sXG4gIH0sXG59KTsiXSwKICAibWFwcGluZ3MiOiAiO0FBQXFXLFNBQVMsb0JBQW9CO0FBQ2xZLE9BQU8sV0FBVztBQUNsQixPQUFPLGFBQWE7QUFDcEIsT0FBTyxVQUFVO0FBSGpCLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLGFBQWE7QUFBQSxNQUNiLFFBQVE7QUFBQTtBQUFBLElBQ1YsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLE9BQU87QUFBQTtBQUFBLElBRUwsUUFBUSxLQUFLLFFBQVEsa0NBQVcsUUFBUTtBQUFBO0FBQUEsSUFFeEMsYUFBYTtBQUFBO0FBQUEsSUFFYixLQUFLO0FBQUEsTUFDSCxPQUFPLEtBQUssUUFBUSxrQ0FBVyx5Q0FBeUM7QUFBQSxNQUN4RSxNQUFNO0FBQUEsTUFDTixVQUFVLE1BQU07QUFBQSxNQUNoQixTQUFTLENBQUMsS0FBSztBQUFBO0FBQUEsSUFDakI7QUFBQSxJQUNBLGVBQWU7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBT2Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
