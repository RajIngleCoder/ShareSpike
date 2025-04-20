'use client';

import { useEffect } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';
import { Redirect } from '@shopify/app-bridge/actions';
import { useSearchParams } from 'next/navigation';

export default function AppBridgeRedirectHandler() {
  const app = useAppBridge();
  const searchParams = useSearchParams();
  const shop = searchParams.get('shop');
  const igSuccess = searchParams.get('ig_success');
  const host = searchParams.get('host'); // host is usually present when embedded
  const embedded = searchParams.get('embedded'); // another indicator

  useEffect(() => {
    // Explicitly check if app bridge instance exists
    if (!app) {
      console.log('AppBridgeRedirectHandler: App Bridge instance not available yet.');
      return; // Exit if app bridge is not ready
    }

    // Only redirect if successfully connected via Instagram AND we are not embedded
    // The check for !host or embedded==='0' tries to detect if we landed outside the iframe.
    // Also check if shop is present, otherwise we can't construct the target URL.
    if (igSuccess === 'true' && shop && (!host || embedded === '0')) {
      console.log('AppBridgeRedirectHandler: Detected outside iframe after IG success, attempting redirect...');
      const appHandle = 'sharespike'; // Make sure this matches your app handle
      const redirect = Redirect.create(app);
      const targetUrl = `https://admin.shopify.com/store/${shop}/apps/${appHandle}/app/settings?shop=${shop}&ig_success=true`;
      
      try {
        redirect.dispatch(Redirect.Action.REMOTE, targetUrl);
        console.log('AppBridgeRedirectHandler: Redirect dispatched to', targetUrl);
      } catch (error) {
        console.error('AppBridgeRedirectHandler: Error dispatching redirect:', error);
      }
    }
  }, [app, igSuccess, shop, host, embedded]); // Depend on necessary values

  // This component doesn't render anything itself
  return null;
} 