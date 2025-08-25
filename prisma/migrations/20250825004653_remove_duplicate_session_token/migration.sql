/*
  Warnings:

  - You are about to drop the column `sessionToken` on the `sessions` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."sessions_sessionToken_key";

-- AlterTable
ALTER TABLE "public"."sessions" DROP COLUMN "sessionToken";
