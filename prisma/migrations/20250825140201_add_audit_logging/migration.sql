-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "documentId" TEXT,
    "invitationId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "email" TEXT,
    "metadata" JSONB,
    "additionalData" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "public"."audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_documentId_idx" ON "public"."audit_logs"("documentId");

-- CreateIndex
CREATE INDEX "audit_logs_eventType_idx" ON "public"."audit_logs"("eventType");

-- CreateIndex
CREATE INDEX "audit_logs_severity_idx" ON "public"."audit_logs"("severity");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "public"."audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_ipAddress_idx" ON "public"."audit_logs"("ipAddress");
