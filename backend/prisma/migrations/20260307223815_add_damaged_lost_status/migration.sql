-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BorrowStatus" ADD VALUE 'damaged';
ALTER TYPE "BorrowStatus" ADD VALUE 'lost';

-- CreateIndex
CREATE INDEX "Borrowing_userId_idx" ON "Borrowing"("userId");

-- CreateIndex
CREATE INDEX "Borrowing_inventoryId_idx" ON "Borrowing"("inventoryId");

-- CreateIndex
CREATE INDEX "Borrowing_borrowDate_idx" ON "Borrowing"("borrowDate");

-- CreateIndex
CREATE INDEX "Inventory_name_idx" ON "Inventory"("name");
