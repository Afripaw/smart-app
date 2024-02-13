/*
  Warnings:

  - You are about to drop the column `treatments` on the `pet` table. All the data in the column will be lost.
  - The `colour` column on the `pet` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `addressGreaterArea` column on the `volunteer` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "communicationID" INTEGER;

-- AlterTable
ALTER TABLE "pet" DROP COLUMN "treatments",
DROP COLUMN "colour",
ADD COLUMN     "colour" TEXT[];

-- AlterTable
ALTER TABLE "petOwner" ADD COLUMN     "communicationID" INTEGER;

-- AlterTable
ALTER TABLE "volunteer" ADD COLUMN     "communicationID" INTEGER,
ADD COLUMN     "role" TEXT[],
DROP COLUMN "addressGreaterArea",
ADD COLUMN     "addressGreaterArea" TEXT[];

-- CreateTable
CREATE TABLE "communication" (
    "communicationID" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "message" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_pkey" PRIMARY KEY ("communicationID")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_communicationID_fkey" FOREIGN KEY ("communicationID") REFERENCES "communication"("communicationID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petOwner" ADD CONSTRAINT "petOwner_communicationID_fkey" FOREIGN KEY ("communicationID") REFERENCES "communication"("communicationID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer" ADD CONSTRAINT "volunteer_communicationID_fkey" FOREIGN KEY ("communicationID") REFERENCES "communication"("communicationID") ON DELETE SET NULL ON UPDATE CASCADE;
