-- Add tenant/institution support while preserving existing data.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'platform_admin';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'institution_admin';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'lab_admin';

CREATE TABLE "Institution" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Institution_slug_key" ON "Institution"("slug");

INSERT INTO "Institution" ("name", "slug")
VALUES ('Default Institution', 'default')
ON CONFLICT ("slug") DO NOTHING;

ALTER TABLE "Lab" ADD COLUMN "institutionId" INTEGER;
UPDATE "Lab" SET "institutionId" = (SELECT "id" FROM "Institution" WHERE "slug" = 'default') WHERE "institutionId" IS NULL;
ALTER TABLE "Lab" ALTER COLUMN "institutionId" SET NOT NULL;

ALTER TABLE "User" ADD COLUMN "institutionId" INTEGER;
UPDATE "User" u
SET "institutionId" = l."institutionId"
FROM "Lab" l
WHERE u."labId" = l."id" AND u."institutionId" IS NULL;

ALTER TABLE "AuditLog" ADD COLUMN "institutionId" INTEGER;
UPDATE "AuditLog" a
SET "institutionId" = u."institutionId"
FROM "User" u
WHERE a."userId" = u."id" AND a."institutionId" IS NULL;

ALTER TABLE "Notification" ADD COLUMN "institutionId" INTEGER;
UPDATE "Notification" n
SET "institutionId" = u."institutionId"
FROM "User" u
WHERE n."userId" = u."id" AND n."institutionId" IS NULL;

CREATE INDEX "Lab_institutionId_idx" ON "Lab"("institutionId");
CREATE UNIQUE INDEX "Lab_institutionId_name_key" ON "Lab"("institutionId", "name");
CREATE INDEX "User_institutionId_idx" ON "User"("institutionId");
CREATE INDEX "User_labId_idx" ON "User"("labId");
CREATE INDEX "AuditLog_institutionId_idx" ON "AuditLog"("institutionId");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "Notification_institutionId_idx" ON "Notification"("institutionId");

ALTER TABLE "Lab" ADD CONSTRAINT "Lab_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
