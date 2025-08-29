-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" VARCHAR(512),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."esg_responses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "financialYear" INTEGER NOT NULL,
    "totalElectricity" DOUBLE PRECISION DEFAULT 0,
    "renewableElectricity" DOUBLE PRECISION DEFAULT 0,
    "totalFuel" DOUBLE PRECISION DEFAULT 0,
    "carbonEmissions" DOUBLE PRECISION DEFAULT 0,
    "totalEmployees" INTEGER DEFAULT 0,
    "femaleEmployees" INTEGER DEFAULT 0,
    "trainingHours" DOUBLE PRECISION DEFAULT 0,
    "communityInvestment" DOUBLE PRECISION DEFAULT 0,
    "independentBoard" DOUBLE PRECISION DEFAULT 0,
    "dataPrivacyPolicy" BOOLEAN DEFAULT false,
    "totalRevenue" DOUBLE PRECISION DEFAULT 0,
    "carbonIntensity" DOUBLE PRECISION DEFAULT 0,
    "renewableRatio" DOUBLE PRECISION DEFAULT 0,
    "diversityRatio" DOUBLE PRECISION DEFAULT 0,
    "communitySpendRatio" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "esg_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" VARCHAR(512) NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" VARCHAR(100) NOT NULL,
    "userId" VARCHAR(100) NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "esg_responses_financialYear_idx" ON "public"."esg_responses"("financialYear");

-- CreateIndex
CREATE INDEX "esg_responses_userId_idx" ON "public"."esg_responses"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "esg_responses_userId_financialYear_key" ON "public"."esg_responses"("userId", "financialYear");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "public"."verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "public"."verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "public"."audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "public"."audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "public"."audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."esg_responses" ADD CONSTRAINT "esg_responses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
