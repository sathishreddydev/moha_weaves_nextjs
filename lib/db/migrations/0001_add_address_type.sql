-- Create address_type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "address_type" AS ENUM('home', 'work', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add address_type column to user_addresses table if it doesn't exist
DO $$ BEGIN
    ALTER TABLE "user_addresses" ADD COLUMN "address_type" "address_type" DEFAULT 'home' NOT NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;
