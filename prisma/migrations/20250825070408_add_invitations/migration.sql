/*
  Warnings:

  - The values [SIGNED] on the enum `SigningRequestStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."SigningRequestStatus_new" AS ENUM ('PENDING', 'VIEWED', 'COMPLETED', 'EXPIRED', 'DECLINED');
ALTER TABLE "public"."signing_requests" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."document_invitations" ALTER COLUMN "status" TYPE "public"."SigningRequestStatus_new" USING ("status"::text::"public"."SigningRequestStatus_new");
ALTER TABLE "public"."signing_requests" ALTER COLUMN "status" TYPE "public"."SigningRequestStatus_new" USING ("status"::text::"public"."SigningRequestStatus_new");
ALTER TYPE "public"."SigningRequestStatus" RENAME TO "SigningRequestStatus_old";
ALTER TYPE "public"."SigningRequestStatus_new" RENAME TO "SigningRequestStatus";
DROP TYPE "public"."SigningRequestStatus_old";
ALTER TABLE "public"."signing_requests" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "public"."documents" ADD COLUMN     "completedDocumentUrl" TEXT,
ADD COLUMN     "finalizedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."signing_requests" ADD COLUMN     "signatureUrl" TEXT,
ADD COLUMN     "signedAt" TIMESTAMP(3),
ADD COLUMN     "signerIpAddress" TEXT,
ADD COLUMN     "signerName" TEXT,
ADD COLUMN     "signerNotes" TEXT,
ADD COLUMN     "signerTitle" TEXT,
ADD COLUMN     "signerUserAgent" TEXT;

-- CreateTable
CREATE TABLE "public"."document_invitations" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "status" "public"."SigningRequestStatus" NOT NULL DEFAULT 'PENDING',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "signedAt" TIMESTAMP(3),
    "signatureUrl" TEXT,
    "signerName" TEXT,
    "signerTitle" TEXT,
    "signerNotes" TEXT,
    "signerIpAddress" TEXT,
    "signerUserAgent" TEXT,

    CONSTRAINT "document_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_invitations_token_key" ON "public"."document_invitations"("token");

-- AddForeignKey
ALTER TABLE "public"."document_invitations" ADD CONSTRAINT "document_invitations_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
