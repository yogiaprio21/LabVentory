-- Tenant onboarding and invitation-based registration.
CREATE TYPE "InviteStatus" AS ENUM ('active', 'revoked', 'used', 'expired');

ALTER TABLE "Institution"
  ADD COLUMN IF NOT EXISTS "domain" TEXT,
  ADD COLUMN IF NOT EXISTS "registrationMode" TEXT NOT NULL DEFAULT 'invite',
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "Invitation" (
  "id" SERIAL NOT NULL,
  "code" TEXT NOT NULL,
  "institutionId" INTEGER NOT NULL,
  "labId" INTEGER,
  "role" "Role" NOT NULL DEFAULT 'student',
  "status" "InviteStatus" NOT NULL DEFAULT 'active',
  "maxUses" INTEGER NOT NULL DEFAULT 1,
  "usedCount" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdById" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Invitation_code_key" ON "Invitation"("code");
CREATE INDEX "Invitation_institutionId_idx" ON "Invitation"("institutionId");
CREATE INDEX "Invitation_labId_idx" ON "Invitation"("labId");
CREATE INDEX "Invitation_status_idx" ON "Invitation"("status");
CREATE INDEX "Invitation_expiresAt_idx" ON "Invitation"("expiresAt");
CREATE INDEX IF NOT EXISTS "Institution_status_idx" ON "Institution"("status");

ALTER TABLE "Invitation"
  ADD CONSTRAINT "Invitation_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "Invitation_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Invitation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
