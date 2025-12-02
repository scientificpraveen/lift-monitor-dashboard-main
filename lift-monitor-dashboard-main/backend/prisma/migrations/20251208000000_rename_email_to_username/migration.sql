-- Rename email column to username
ALTER TABLE "users" RENAME COLUMN "email" TO "username";

-- Drop old index and create new one
DROP INDEX IF EXISTS "users_email_idx";
CREATE INDEX "users_username_idx" ON "users"("username");
