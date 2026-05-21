-- Add order_item_id to product_reviews for per-order-item review tracking
ALTER TABLE "product_reviews"
  ADD COLUMN IF NOT EXISTS "order_item_id" varchar
    REFERENCES "order_items"("id") ON DELETE SET NULL;
