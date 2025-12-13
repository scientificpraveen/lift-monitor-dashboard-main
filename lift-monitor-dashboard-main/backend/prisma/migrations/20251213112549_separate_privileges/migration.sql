/*
  Warnings:

  - You are about to drop the column `privileges` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "privileges",
ADD COLUMN     "panelLogPrivileges" TEXT[] DEFAULT ARRAY['view']::TEXT[],
ADD COLUMN     "serviceLogPrivileges" TEXT[] DEFAULT ARRAY['view']::TEXT[];
