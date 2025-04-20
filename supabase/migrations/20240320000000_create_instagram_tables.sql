-- Create table for storing Instagram credentials
CREATE TABLE IF NOT EXISTS store_instagram_credentials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id TEXT NOT NULL UNIQUE,
    access_token TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for storing verified Instagram shares
CREATE TABLE IF NOT EXISTS instagram_shares (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id TEXT NOT NULL,
    post_id TEXT NOT NULL,
    post_url TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'verified',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(shop_id, post_id, customer_email)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_instagram_shares_shop_id ON instagram_shares(shop_id);
CREATE INDEX IF NOT EXISTS idx_instagram_shares_customer_email ON instagram_shares(customer_email);
CREATE INDEX IF NOT EXISTS idx_instagram_shares_verified_at ON instagram_shares(verified_at);

-- Add RLS policies
ALTER TABLE store_instagram_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_shares ENABLE ROW LEVEL SECURITY;

-- Policy for store_instagram_credentials
CREATE POLICY "Store owners can manage their own Instagram credentials"
    ON store_instagram_credentials
    FOR ALL
    USING (shop_id = auth.uid()::text);

-- Policy for instagram_shares
CREATE POLICY "Store owners can view their store's Instagram shares"
    ON instagram_shares
    FOR SELECT
    USING (shop_id = auth.uid()::text);

CREATE POLICY "Store owners can insert Instagram shares"
    ON instagram_shares
    FOR INSERT
    WITH CHECK (shop_id = auth.uid()::text); 