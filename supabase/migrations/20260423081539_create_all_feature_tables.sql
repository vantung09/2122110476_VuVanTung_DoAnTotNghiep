/*
  # Create tables for all new features

  1. New Tables
    - `password_resets` - Stores password reset tokens for forgot password flow
      - `id` (uuid, primary key)
      - `email` (text, not null) - User email requesting reset
      - `token` (text, unique, not null) - Reset token
      - `expires_at` (timestamptz, not null) - Token expiration time
      - `used` (boolean, default false) - Whether token has been used
      - `created_at` (timestamptz, default now())

    - `product_reviews` - Product reviews and ratings
      - `id` (uuid, primary key)
      - `product_id` (bigint, not null) - Reference to product ID in backend
      - `user_id` (uuid, not null) - Reference to auth.users
      - `user_name` (text, not null) - Denormalized user display name
      - `rating` (smallint, not null, 1-5) - Star rating
      - `title` (text) - Review title
      - `comment` (text) - Review body text
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

    - `search_history` - User search history
      - `id` (uuid, primary key)
      - `user_id` (uuid, not null) - Reference to auth.users
      - `query` (text, not null) - Search query text
      - `created_at` (timestamptz, default now())

    - `notifications` - Push notifications for orders and promotions
      - `id` (uuid, primary key)
      - `user_id` (uuid, not null) - Reference to auth.users
      - `type` (text, not null) - Notification type: order, promotion, system
      - `title` (text, not null) - Notification title
      - `message` (text, not null) - Notification body
      - `data` (jsonb) - Additional data (order_id, coupon_code, etc.)
      - `read` (boolean, default false) - Whether user has read it
      - `created_at` (timestamptz, default now())

    - `coupons` - Discount coupons/vouchers
      - `id` (uuid, primary key)
      - `code` (text, unique, not null) - Coupon code
      - `description` (text) - Coupon description
      - `discount_type` (text, not null) - 'percentage' or 'fixed'
      - `discount_value` (numeric, not null) - Discount amount
      - `min_order_amount` (numeric, default 0) - Minimum order amount
      - `max_uses` (integer) - Maximum total uses (null = unlimited)
      - `used_count` (integer, default 0) - Times used so far
      - `max_uses_per_user` (integer, default 1) - Max uses per user
      - `starts_at` (timestamptz, not null) - When coupon becomes active
      - `expires_at` (timestamptz, not null) - When coupon expires
      - `active` (boolean, default true) - Whether coupon is active
      - `created_at` (timestamptz, default now())

    - `coupon_usages` - Track coupon usage per user
      - `id` (uuid, primary key)
      - `coupon_id` (uuid, not null) - Reference to coupons
      - `user_id` (uuid, not null) - Reference to auth.users
      - `order_id` (text) - Reference to order ID
      - `created_at` (timestamptz, default now())

    - `shared_wishlists` - Shared wishlist links
      - `id` (uuid, primary key)
      - `user_id` (uuid, not null) - Owner of the wishlist
      - `user_name` (text, not null) - Denormalized user display name
      - `slug` (text, unique, not null) - Unique shareable URL slug
      - `title` (text, not null) - Wishlist title
      - `product_ids` (jsonb, not null) - Array of product IDs
      - `product_data` (jsonb) - Cached product data for display
      - `view_count` (integer, default 0) - Number of views
      - `active` (boolean, default true) - Whether link is active
      - `created_at` (timestamptz, default now())

    - `order_tracking` - Real-time order tracking steps
      - `id` (uuid, primary key)
      - `order_id` (text, not null) - Reference to order ID in backend
      - `status` (text, not null) - Current tracking status
      - `description` (text) - Status description
      - `location_lat` (numeric) - Latitude for map display
      - `location_lng` (numeric) - Longitude for map display
      - `location_name` (text) - Location name
      - `created_at` (timestamptz, default now())

    - `chat_messages` - Live chat support messages
      - `id` (uuid, primary key)
      - `user_id` (uuid, not null) - Reference to auth.users
      - `user_name` (text, not null) - Denormalized user display name
      - `message` (text, not null) - Chat message content
      - `sender_type` (text, not null) - 'user' or 'support'
      - `read` (boolean, default false) - Whether message has been read
      - `created_at` (timestamptz, default now())

    - `chat_sessions` - Chat session management
      - `id` (uuid, primary key)
      - `user_id` (uuid, not null) - Reference to auth.users
      - `status` (text, default 'open') - 'open', 'closed'
      - `last_message_at` (timestamptz, default now()) - For sorting active chats
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on ALL tables
    - Users can only access their own data
    - Password resets are accessible by token lookup (no user auth required)
    - Product reviews are publicly readable, only authors can modify
    - Coupons are publicly readable for validation
    - Shared wishlists are publicly readable via slug
    - Order tracking is readable by authenticated users
    - Chat messages are accessible only by the session owner

  3. Indexes
    - Index on password_resets.token for fast lookup
    - Index on product_reviews.product_id for product review listing
    - Index on search_history.user_id for user history
    - Index on notifications.user_id for user notification listing
    - Index on coupons.code for coupon validation
    - Index on shared_wishlists.slug for shareable link lookup
    - Index on order_tracking.order_id for order tracking
    - Index on chat_sessions.user_id for user chat lookup
*/

-- Password Resets
CREATE TABLE IF NOT EXISTS password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);

CREATE POLICY "Password reset by token lookup"
  ON password_resets FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can create password reset"
  ON password_resets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Password reset update by token"
  ON password_resets FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);


-- Product Reviews
CREATE TABLE IF NOT EXISTS product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id bigint NOT NULL,
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text DEFAULT '',
  comment text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);

CREATE POLICY "Anyone can read product reviews"
  ON product_reviews FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON product_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON product_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON product_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- Search History
CREATE TABLE IF NOT EXISTS search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  query text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);

CREATE POLICY "Users can read own search history"
  ON search_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add own search history"
  ON search_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own search history"
  ON search_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- Coupons
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text DEFAULT '',
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  min_order_amount numeric DEFAULT 0,
  max_uses integer,
  used_count integer DEFAULT 0,
  max_uses_per_user integer DEFAULT 1,
  starts_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

CREATE POLICY "Anyone can read active coupons"
  ON coupons FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Only service role can manage coupons"
  ON coupons FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Only service role can update coupons"
  ON coupons FOR UPDATE
  TO authenticated
  USING (false);


-- Coupon Usages
CREATE TABLE IF NOT EXISTS coupon_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  order_id text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_user ON coupon_usages(coupon_id, user_id);

CREATE POLICY "Users can read own coupon usages"
  ON coupon_usages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own coupon usages"
  ON coupon_usages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);


-- Shared Wishlists
CREATE TABLE IF NOT EXISTS shared_wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  product_ids jsonb NOT NULL DEFAULT '[]',
  product_data jsonb DEFAULT '[]',
  view_count integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shared_wishlists ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_shared_wishlists_slug ON shared_wishlists(slug);
CREATE INDEX IF NOT EXISTS idx_shared_wishlists_user_id ON shared_wishlists(user_id);

CREATE POLICY "Anyone can read shared wishlists by slug"
  ON shared_wishlists FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can create own shared wishlists"
  ON shared_wishlists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shared wishlists"
  ON shared_wishlists FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own shared wishlists"
  ON shared_wishlists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- Order Tracking
CREATE TABLE IF NOT EXISTS order_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL,
  status text NOT NULL,
  description text DEFAULT '',
  location_lat numeric,
  location_lng numeric,
  location_name text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_tracking ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id ON order_tracking(order_id);

CREATE POLICY "Authenticated users can read order tracking"
  ON order_tracking FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only service role can create order tracking"
  ON order_tracking FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Only service role can update order tracking"
  ON order_tracking FOR UPDATE
  TO authenticated
  USING (false);


-- Chat Sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);

CREATE POLICY "Users can read own chat sessions"
  ON chat_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat sessions"
  ON chat_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
  ON chat_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  message text NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('user', 'support')),
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);

CREATE POLICY "Users can read own chat messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
