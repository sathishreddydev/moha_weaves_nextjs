-- Make email and password nullable for phone-only OTP users (Myntra-style)
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;

-- Clean up empty phone strings to NULL so unique index works
UPDATE "users" SET phone = NULL WHERE phone = '';

-- Make phone unique (excluding NULLs — only real phone numbers must be unique)
CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_unique" ON "users" ("phone") WHERE "phone" IS NOT NULL;
