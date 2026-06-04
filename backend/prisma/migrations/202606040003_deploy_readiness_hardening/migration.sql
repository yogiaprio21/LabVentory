-- AlterTable
ALTER TABLE "User" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Lab" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "dedupeKey" TEXT;

-- AlterTable
ALTER TABLE "AuditLog" ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "Lab_status_idx" ON "Lab"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_userId_dedupeKey_key" ON "Notification"("userId", "dedupeKey");
