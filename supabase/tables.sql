-- Create app_settings table to store merchant configuration
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id TEXT NOT NULL UNIQUE,
  discount_percentage INTEGER NOT NULL DEFAULT 10,
  discount_expiry_days INTEGER NOT NULL DEFAULT 7,
  eligible_products JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create share_verifications table to track Instagram shares
CREATE TABLE IF NOT EXISTS share_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id TEXT NOT NULL,
  customer_email TEXT,
  product_id TEXT NOT NULL,
  share_url TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (shop_id) REFERENCES app_settings(shop_id) ON DELETE CASCADE
);

-- Create discount_codes table to track generated discounts
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id TEXT NOT NULL,
  share_verification_id UUID NOT NULL,
  code TEXT NOT NULL,
  percentage INTEGER NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (shop_id) REFERENCES app_settings(shop_id) ON DELETE CASCADE,
  FOREIGN KEY (share_verification_id) REFERENCES share_verifications(id) ON DELETE CASCADE
);

-- Create analytics table to track share performance
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id TEXT NOT NULL,
  share_count INTEGER DEFAULT 0,
  discount_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  revenue_generated NUMERIC(10,2) DEFAULT 0.00,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (shop_id) REFERENCES app_settings(shop_id) ON DELETE CASCADE,
  UNIQUE(shop_id, date)
);

-- Create RLS policies
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Create policy for app_settings
CREATE POLICY "Allow access to own shop settings" ON app_settings
  FOR ALL USING (auth.uid()::text = shop_id);

-- Create policy for share_verifications
CREATE POLICY "Allow access to own shop share verifications" ON share_verifications
  FOR ALL USING (shop_id IN (SELECT shop_id FROM app_settings WHERE shop_id = auth.uid()::text));

-- Create policy for discount_codes
CREATE POLICY "Allow access to own shop discount codes" ON discount_codes
  FOR ALL USING (shop_id IN (SELECT shop_id FROM app_settings WHERE shop_id = auth.uid()::text));

-- Create policy for analytics
CREATE POLICY "Allow access to own shop analytics" ON analytics
  FOR ALL USING (shop_id IN (SELECT shop_id FROM app_settings WHERE shop_id = auth.uid()::text)); 