-- Create table for storing Instagram connections
CREATE TABLE IF NOT EXISTS store_instagram_connections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id TEXT NOT NULL UNIQUE,
    instagram_user_id TEXT NOT NULL,
    access_token TEXT NOT NULL,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for share verifications
CREATE TABLE IF NOT EXISTS share_verifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id TEXT NOT NULL,
    instagram_post_url TEXT,
    customer_identifier TEXT NOT NULL,
    product_id TEXT,
    verification_status TEXT NOT NULL DEFAULT 'pending',
    verified_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    instagram_media_id TEXT,
    instagram_user_id TEXT
);

-- Create table for discount codes
CREATE TABLE IF NOT EXISTS discount_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id TEXT NOT NULL,
    discount_code TEXT NOT NULL,
    shopify_discount_id TEXT,
    share_verification_id UUID REFERENCES share_verifications(id),
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_share_verifications_shop_id ON share_verifications(shop_id);
CREATE INDEX IF NOT EXISTS idx_share_verifications_customer ON share_verifications(customer_identifier);
CREATE INDEX IF NOT EXISTS idx_share_verifications_status ON share_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_discount_codes_shop_id ON discount_codes(shop_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_verification ON discount_codes(share_verification_id);

-- Add RLS policies for security
ALTER TABLE store_instagram_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Policy for store_instagram_connections
CREATE POLICY "Store owners can manage their own Instagram connections"
    ON store_instagram_connections
    FOR ALL
    USING (shop_id = auth.uid()::text);

-- Policy for share_verifications
CREATE POLICY "Store owners can view their store's verifications"
    ON share_verifications
    FOR SELECT
    USING (shop_id = auth.uid()::text);

CREATE POLICY "Store owners can insert verifications"
    ON share_verifications
    FOR INSERT
    WITH CHECK (shop_id = auth.uid()::text);

-- Policy for discount_codes
CREATE POLICY "Store owners can manage their discount codes"
    ON discount_codes
    FOR ALL
    USING (shop_id = auth.uid()::text); 