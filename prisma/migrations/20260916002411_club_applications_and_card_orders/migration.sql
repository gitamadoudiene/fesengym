-- CreateEnum
CREATE TYPE "CardOrderStatus" AS ENUM ('REQUESTED', 'PRINTING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ClubStatus" ADD VALUE 'PENDING';
ALTER TYPE "ClubStatus" ADD VALUE 'REJECTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'CLUB_APPLICATION_SUBMITTED';
ALTER TYPE "NotificationType" ADD VALUE 'CLUB_APPLICATION_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'CLUB_APPLICATION_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'NEW_CLUB_APPLICATION_ADMIN';
ALTER TYPE "NotificationType" ADD VALUE 'CARD_ORDER_UPDATED';

-- AlterTable
ALTER TABLE "clubs" ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT;

-- CreateTable
CREATE TABLE "card_orders" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "status" "CardOrderStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedById" TEXT NOT NULL,
    "trackingReference" TEXT,
    "notes" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "printedAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "card_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "card_orders_clubId_idx" ON "card_orders"("clubId");

-- CreateIndex
CREATE INDEX "card_orders_status_idx" ON "card_orders"("status");

-- AddForeignKey
ALTER TABLE "card_orders" ADD CONSTRAINT "card_orders_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_orders" ADD CONSTRAINT "card_orders_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
