-- =========================================================================
-- USER, CART, ORDER, AND COUPON SCHEMA (UPDATED)
-- Includes table definitions, constraints, triggers, and comprehensive RLS.
-- =========================================================================

-- Enable uuid-ossp if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS Table (Renamed from profiles to match app code)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  username text UNIQUE,
  email text UNIQUE,
  avatar_url text,
  phone text,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist to avoid errors on re-run
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.users;
DROP POLICY IF EXISTS "Users can update own profile." ON public.users;
DROP POLICY IF EXISTS "Public users are viewable by everyone." ON public.users;
DROP POLICY IF EXISTS "Users can update own user record." ON public.users;

CREATE POLICY "Public users are viewable by everyone." ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own user record." ON public.users FOR UPDATE USING (auth.uid() = id);

-- 2. ADDRESSES Table
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  label text,
  house_building_name text,
  area_sector text,
  city text,
  state text,
  postal_code text,
  country text DEFAULT 'India',
  receiver_name text,
  receiver_email text,
  receiver_phone text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own addresses." ON public.addresses;
DROP POLICY IF EXISTS "Users can insert own addresses." ON public.addresses;
DROP POLICY IF EXISTS "Users can update own addresses." ON public.addresses;
DROP POLICY IF EXISTS "Users can delete own addresses." ON public.addresses;

CREATE POLICY "Users can view own addresses." ON public.addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own addresses." ON public.addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own addresses." ON public.addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own addresses." ON public.addresses FOR DELETE USING (auth.uid() = user_id);

-- 3. WISHLISTS Table
CREATE TABLE IF NOT EXISTS public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own wishlists." ON public.wishlists;
DROP POLICY IF EXISTS "Users can insert own wishlists." ON public.wishlists;
DROP POLICY IF EXISTS "Users can delete own wishlists." ON public.wishlists;

CREATE POLICY "Users can view own wishlists." ON public.wishlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wishlists." ON public.wishlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own wishlists." ON public.wishlists FOR DELETE USING (auth.uid() = user_id);

-- 4. WALLETS & TRANSACTIONS Tables
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance numeric DEFAULT 0.00,
  currency text DEFAULT 'INR',
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
  reference_id text,
  type text NOT NULL CHECK (type IN ('credit', 'debit')),
  amount numeric NOT NULL,
  balance_after numeric NOT NULL,
  description text,
  status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wallets." ON public.wallets;
DROP POLICY IF EXISTS "Users can view own wallet transactions." ON public.wallet_transactions;

CREATE POLICY "Users can view own wallets." ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own wallet transactions." ON public.wallet_transactions FOR SELECT USING (
  wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid())
);

-- 5. ORDERS & ORDER_ITEMS
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  address_id uuid REFERENCES public.addresses(id) ON DELETE SET NULL,
  order_number text UNIQUE NOT NULL,
  status text DEFAULT 'pending',
  payment_status text DEFAULT 'pending',
  payment_method text,
  razorpay_order_id text,
  razorpay_payment_id text,
  subtotal numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  shipping_fee numeric DEFAULT 0,
  total numeric DEFAULT 0,
  notes text,
  cancel_reason text,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  product_name text,
  variant_label text,
  quantity int DEFAULT 1,
  unit_price numeric,
  total_price numeric
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own orders." ON public.orders;
DROP POLICY IF EXISTS "Users can view own order items." ON public.order_items;

CREATE POLICY "Users can view own orders." ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own order items." ON public.order_items FOR SELECT USING (
  order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
);

-- 6. CARTS & CART_ITEMS
CREATE TABLE IF NOT EXISTS public.carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid REFERENCES public.carts(id) ON DELETE CASCADE NOT NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE NOT NULL,
  quantity int DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(cart_id, variant_id)
);

ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own carts." ON public.carts;
DROP POLICY IF EXISTS "Users can view own cart items." ON public.cart_items;
DROP POLICY IF EXISTS "Users can insert/update own carts." ON public.carts;
DROP POLICY IF EXISTS "Users can insert/update own cart items." ON public.cart_items;

CREATE POLICY "Users can view own carts." ON public.carts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own cart items." ON public.cart_items FOR SELECT USING (
  cart_id IN (SELECT id FROM public.carts WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert/update own carts." ON public.carts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can insert/update own cart items." ON public.cart_items FOR ALL USING (
  cart_id IN (SELECT id FROM public.carts WHERE user_id = auth.uid())
);

-- 7. COUPONS
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  type text CHECK (type IN ('username', 'admin_created')),
  discount_percentage numeric NOT NULL,
  is_active boolean DEFAULT false,
  activation_date timestamptz,
  owner_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Coupons are viewable by everyone." ON public.coupons;
CREATE POLICY "Coupons are viewable by everyone." ON public.coupons FOR SELECT USING (true);

-- ==========================================
-- PostgreSQL Triggers for Auto-Profile Creation
-- ==========================================

-- 1. Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, full_name, username, email, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'username',
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger on auth.users for signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- Redirecting existing triggers to 'users' table
-- ==========================================

CREATE OR REPLACE FUNCTION generate_username_coupon()
RETURNS trigger AS $$
DECLARE
  u_name text;
  order_count int;
BEGIN
  SELECT count(*) INTO order_count FROM public.orders WHERE user_id = NEW.user_id;

  IF order_count = 1 THEN
    SELECT username INTO u_name FROM public.users WHERE id = NEW.user_id;
    
    IF u_name IS NOT NULL THEN
      INSERT INTO public.coupons (code, type, discount_percentage, is_active, owner_id)
      VALUES (u_name, 'username', 10, false, NEW.user_id)
      ON CONFLICT (code) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auto_create_wallet()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance, currency)
  VALUES (NEW.id, 0.00, 'INR')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach Wallet creation on 'users' table instead of 'profiles'
DROP TRIGGER IF EXISTS on_profile_created ON public.users;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE PROCEDURE auto_create_wallet();
