-- AlterTable
ALTER TABLE "users" ADD COLUMN     "assignedBuildings" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "privileges" TEXT[] DEFAULT ARRAY['view']::TEXT[],
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user';
