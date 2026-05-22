-- Add unhelpful_count column to product_reviews
ALTER TABLE "product_reviews" ADD COLUMN "unhelpful_count" integer DEFAULT 0;

-- Create review_votes table for per-user vote dedup
CREATE TABLE IF NOT EXISTS "review_votes" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "review_id" varchar NOT NULL REFERENCES "product_reviews"("id"),
  "user_id" varchar NOT NULL REFERENCES "users"("id"),
  "vote_type" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- Unique constraint: one vote per user per review
CREATE UNIQUE INDEX "review_votes_user_review_unique" ON "review_votes" ("review_id", "user_id");
