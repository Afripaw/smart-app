/*
  Warnings:

  - You are about to drop the column `clinicsAttended` on the `pet` table. All the data in the column will be lost.
  - You are about to drop the column `vaccinatedStatus` on the `pet` table. All the data in the column will be lost.
  - The `lastDeworming` column on the `pet` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `kennelReceived` column on the `pet` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `addressPostalCode` on the `petOwner` table. All the data in the column will be lost.
  - You are about to drop the column `addressSuburb` on the `petOwner` table. All the data in the column will be lost.
  - You are about to drop the column `clinicsAttended` on the `volunteer` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[mobile]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[mobile]` on the table `petOwner` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[mobile]` on the table `volunteer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `startingDate` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `password` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `surname` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `mobile` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `addressGreaterArea` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `preferredCommunication` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `role` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `vaccinationShot1` to the `pet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `petClinic` table without a default value. This is not possible if the table is not empty.
  - Added the required column `addressArea` to the `petOwner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startingDate` to the `petOwner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `petTreatment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startingDate` to the `volunteer` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "addressArea" TEXT,
ADD COLUMN     "addressFreeForm" TEXT,
ADD COLUMN     "startingDate" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "password" SET NOT NULL,
ALTER COLUMN "surname" SET NOT NULL,
ALTER COLUMN "mobile" SET NOT NULL,
ALTER COLUMN "addressGreaterArea" SET NOT NULL,
ALTER COLUMN "preferredCommunication" SET NOT NULL,
ALTER COLUMN "role" SET NOT NULL,
ALTER COLUMN "status" SET NOT NULL;

-- AlterTable
ALTER TABLE "pet" DROP COLUMN "clinicsAttended",
DROP COLUMN "vaccinatedStatus",
ADD COLUMN     "image" TEXT,
ADD COLUMN     "sterilisationOutcome" TEXT,
ADD COLUMN     "vaccinationShot1" TEXT NOT NULL,
ADD COLUMN     "vaccinationShot2" TEXT,
ADD COLUMN     "vaccinationShot3" TEXT,
ALTER COLUMN "colour" DROP NOT NULL,
ALTER COLUMN "markings" DROP NOT NULL,
ALTER COLUMN "sterilisedRequested" DROP NOT NULL,
ALTER COLUMN "sterilisedRequestSigned" DROP NOT NULL,
ALTER COLUMN "treatments" DROP NOT NULL,
DROP COLUMN "lastDeworming",
ADD COLUMN     "lastDeworming" TIMESTAMP(3),
ALTER COLUMN "cardStatus" DROP NOT NULL,
DROP COLUMN "kennelReceived",
ADD COLUMN     "kennelReceived" TEXT[],
ALTER COLUMN "comments" DROP NOT NULL;

-- AlterTable
ALTER TABLE "petClinic" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "comments" DROP NOT NULL;

-- AlterTable
ALTER TABLE "petOwner" DROP COLUMN "addressPostalCode",
DROP COLUMN "addressSuburb",
ADD COLUMN     "addressArea" TEXT NOT NULL,
ADD COLUMN     "addressFreeForm" TEXT,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "startingDate" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "mobile" DROP NOT NULL,
ALTER COLUMN "addressStreetCode" DROP NOT NULL,
ALTER COLUMN "comments" DROP NOT NULL;

-- AlterTable
ALTER TABLE "petTreatment" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "date" DROP DEFAULT,
ALTER COLUMN "comments" DROP NOT NULL;

-- AlterTable
ALTER TABLE "volunteer" DROP COLUMN "clinicsAttended",
ADD COLUMN     "addressFreeForm" TEXT,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "startingDate" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "mobile" DROP NOT NULL,
ALTER COLUMN "addressStreet" DROP NOT NULL,
ALTER COLUMN "addressStreetCode" DROP NOT NULL,
ALTER COLUMN "addressStreetNumber" DROP NOT NULL,
ALTER COLUMN "addressSuburb" DROP NOT NULL,
ALTER COLUMN "addressPostalCode" DROP NOT NULL;

-- CreateTable
CREATE TABLE "petOnPetClinic" (
    "petOnClinicID" SERIAL NOT NULL,
    "petID" INTEGER NOT NULL,
    "clinicID" INTEGER NOT NULL,

    CONSTRAINT "petOnPetClinic_pkey" PRIMARY KEY ("petOnClinicID")
);

-- CreateTable
CREATE TABLE "volunteerOnPetClinic" (
    "volunteerOnClinicID" SERIAL NOT NULL,
    "volunteerID" INTEGER NOT NULL,
    "clinicID" INTEGER NOT NULL,

    CONSTRAINT "volunteerOnPetClinic_pkey" PRIMARY KEY ("volunteerOnClinicID")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "petOwner_mobile_key" ON "petOwner"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "volunteer_mobile_key" ON "volunteer"("mobile");

-- AddForeignKey
ALTER TABLE "petOnPetClinic" ADD CONSTRAINT "petOnPetClinic_petID_fkey" FOREIGN KEY ("petID") REFERENCES "pet"("petID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petOnPetClinic" ADD CONSTRAINT "petOnPetClinic_clinicID_fkey" FOREIGN KEY ("clinicID") REFERENCES "petClinic"("clinicID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteerOnPetClinic" ADD CONSTRAINT "volunteerOnPetClinic_volunteerID_fkey" FOREIGN KEY ("volunteerID") REFERENCES "volunteer"("volunteerID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteerOnPetClinic" ADD CONSTRAINT "volunteerOnPetClinic_clinicID_fkey" FOREIGN KEY ("clinicID") REFERENCES "petClinic"("clinicID") ON DELETE RESTRICT ON UPDATE CASCADE;
