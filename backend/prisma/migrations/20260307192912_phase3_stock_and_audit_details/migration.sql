-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "details" JSONB;

-- AlterTable
ALTER TABLE "Inventory" ADD COLUMN     "minStock" INTEGER NOT NULL DEFAULT 0;
