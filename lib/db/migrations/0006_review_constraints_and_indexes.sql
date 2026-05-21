-- 1. Drop the unused is_approved column (never read by the Next.js app)
ALTER TABLE "product_reviews"
  DROP COLUMN IF EXISTS "is_approved";

-- 2. Unique constraint: one review per user per order item (prevents race-condition duplicates)
ALTER TABLE "product_reviews"
  ADD CONSTRAINT "product_reviews_user_order_item_unique"
  UNIQUE ("user_id", "order_item_id");

-- 3. Index on product_id for fast review lookups on the product page
CREATE INDEX IF NOT EXISTS "idx_product_reviews_product_id"
  ON "product_reviews" ("product_id");

-- 4. Index on (user_id, order_item_id) for fast eligibility checks in canUserReviewProduct
CREATE INDEX IF NOT EXISTS "idx_product_reviews_user_order_item"
  ON "product_reviews" ("user_id", "order_item_id");
