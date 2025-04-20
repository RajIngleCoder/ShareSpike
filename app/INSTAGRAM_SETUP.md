# Instagram API Integration Setup

This document outlines the steps needed to connect ShareSpike with Instagram for share verification.

## Prerequisites

1. A Facebook Developer account
2. A Facebook App with the Instagram Graph API product added
3. The following environment variables set in your `.env` file:
   - `INSTAGRAM_APP_ID` - Your Facebook App ID
   - `INSTAGRAM_APP_SECRET` - Your Facebook App Secret
   - `SHOPIFY_APP_URL` (or `HOST`) - The base URL of your application

## Facebook App Setup

1. Go to [Facebook for Developers](https://developers.facebook.com/) and create a new app.
2. Select "Business" as the app type.
3. From the App Dashboard, click "Add Product" and add "Instagram Graph API".
4. Under App Settings > Basic, note your App ID and App Secret for the environment variables.

## OAuth Redirect URI Setup

1. In your Facebook App settings, navigate to "Facebook Login" > "Settings".
2. Add the following OAuth Redirect URI:
   ```
   https://your-app-url.com/auth/instagram/callback
   ```
   Replace `your-app-url.com` with your actual app domain.

## Required Permissions (Scopes)

The following permissions are requested during the OAuth flow:

- `instagram_basic`: Allows reading basic profile info and media
- `pages_show_list`: Needed to list Facebook Pages (required for Instagram Business accounts)
- `pages_read_engagement`: Allows reading content posted by the Page and comments

## Connection Flow

The Instagram connection flow works as follows:

1. Merchant clicks "Connect Instagram Account" in the app settings.
2. They are redirected to Facebook's OAuth dialog.
3. After authorizing, they're redirected back to our app at `/auth/instagram/callback`.
4. The app exchanges the temporary code for an access token.
5. The access token and user ID are stored in the `store_instagram_connections` table.

## Verification Process

Once connected, the app uses the stored credentials to:

1. Validate Instagram share URLs submitted by customers
2. Verify if the post mentions or tags the merchant
3. Create discount codes for verified shares

## Troubleshooting

If you encounter connection issues:

1. Verify your environment variables are correctly set
2. Ensure your Facebook App is properly configured with the right permissions
3. Check the OAuth Redirect URI matches exactly
4. Confirm the app is requesting the right permissions during authorization
5. Look for detailed error messages in the application logs 