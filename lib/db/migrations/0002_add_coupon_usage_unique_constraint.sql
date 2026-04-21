-- Add unique constraint to prevent duplicate coupon usage by the same user
DO $$ BEGIN
    ALTER TABLE "coupon_usage" ADD CONSTRAINT "unique_coupon_user_order" UNIQUE ("coupon_id", "user_id", "order_id");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
