CREATE TABLE IF NOT EXISTS "pending_payments" (
  "id" varchar(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar(255) NOT NULL REFERENCES "users"("id"),
  "razorpay_order_id" varchar(255) NOT NULL UNIQUE,
  "amount" integer NOT NULL,
  "currency" varchar(10) NOT NULL DEFAULT 'INR',
  "coupon_id" varchar(255),
  "shipping_address" text,
  "phone" text,
  "notes" text,
  "cart_snapshot" json NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "completed_at" timestamp,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_pending_payments_razorpay_order_id" ON "pending_payments" ("razorpay_order_id");
CREATE INDEX IF NOT EXISTS "idx_pending_payments_status" ON "pending_payments" ("status");
CREATE INDEX IF NOT EXISTS "idx_pending_payments_user_id" ON "pending_payments" ("user_id");
