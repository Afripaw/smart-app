/*
  Warnings:

  - You are about to drop the column `addressArea` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `addressGreaterArea` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `addressStreet` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `communication` table. All the data in the column will be lost.
  - The `sterilisedRequested` column on the `pet` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `addressArea` on the `petOwner` table. All the data in the column will be lost.
  - You are about to drop the column `addressGreaterArea` on the `petOwner` table. All the data in the column will be lost.
  - You are about to drop the column `addressStreet` on the `petOwner` table. All the data in the column will be lost.
  - You are about to drop the column `addressGreaterArea` on the `volunteer` table. All the data in the column will be lost.
  - Added the required column `addressGreaterAreaID` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `communication` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `sterilisedStatus` on the `pet` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `greaterArea` on the `petClinic` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `area` on the `petClinic` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `addressAreaID` to the `petOwner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `addressGreaterAreaID` to the `petOwner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `addressStreetID` to the `petOwner` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_communicationID_fkey";

-- DropForeignKey
ALTER TABLE "petOwner" DROP CONSTRAINT "petOwner_communicationID_fkey";

-- DropForeignKey
ALTER TABLE "volunteer" DROP CONSTRAINT "volunteer_communicationID_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "addressArea",
DROP COLUMN "addressGreaterArea",
DROP COLUMN "addressStreet",
ADD COLUMN     "addressAreaID" INTEGER,
ADD COLUMN     "addressGreaterAreaID" INTEGER NOT NULL,
ADD COLUMN     "addressStreetID" INTEGER;

-- AlterTable
ALTER TABLE "communication" DROP COLUMN "date",
ADD COLUMN     "area" TEXT[],
ADD COLUMN     "greaterArea" TEXT[],
ADD COLUMN     "recipients" TEXT[],
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "success" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "pet" DROP COLUMN "sterilisedStatus",
ADD COLUMN     "sterilisedStatus" TIMESTAMP(3) NOT NULL,
DROP COLUMN "sterilisedRequested",
ADD COLUMN     "sterilisedRequested" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "petClinic" DROP COLUMN "greaterArea",
ADD COLUMN     "greaterArea" INTEGER NOT NULL,
DROP COLUMN "area",
ADD COLUMN     "area" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "petOwner" DROP COLUMN "addressArea",
DROP COLUMN "addressGreaterArea",
DROP COLUMN "addressStreet",
ADD COLUMN     "addressAreaID" INTEGER NOT NULL,
ADD COLUMN     "addressGreaterAreaID" INTEGER NOT NULL,
ADD COLUMN     "addressStreetID" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "volunteer" DROP COLUMN "addressGreaterArea",
ADD COLUMN     "collaboratorOrg" TEXT;

-- CreateTable
CREATE TABLE "greaterArea" (
    "greaterAreaID" SERIAL NOT NULL,
    "greaterArea" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "greaterArea_pkey" PRIMARY KEY ("greaterAreaID")
);

-- CreateTable
CREATE TABLE "greaterAreaOnVolunteer" (
    "greaterAreaOnVolunteerID" SERIAL NOT NULL,
    "greaterAreaID" INTEGER NOT NULL,
    "volunteerID" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "greaterAreaOnVolunteer_pkey" PRIMARY KEY ("greaterAreaOnVolunteerID")
);

-- CreateTable
CREATE TABLE "area" (
    "areaID" SERIAL NOT NULL,
    "area" TEXT NOT NULL,
    "greaterAreaID" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "area_pkey" PRIMARY KEY ("areaID")
);

-- CreateTable
CREATE TABLE "areaOnStreet" (
    "areaOnStreetID" SERIAL NOT NULL,
    "areaID" INTEGER NOT NULL,
    "streetID" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "areaOnStreet_pkey" PRIMARY KEY ("areaOnStreetID")
);

-- CreateTable
CREATE TABLE "street" (
    "streetID" SERIAL NOT NULL,
    "street" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "street_pkey" PRIMARY KEY ("streetID")
);

-- CreateTable
CREATE TABLE "identification" (
    "identificationID" SERIAL NOT NULL,
    "userID" INTEGER NOT NULL,
    "volunteerID" INTEGER NOT NULL,
    "petID" INTEGER NOT NULL,
    "clinicID" INTEGER NOT NULL,
    "petOwnerID" INTEGER NOT NULL,
    "communicationID" INTEGER NOT NULL,
    "treatmentID" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "identification_pkey" PRIMARY KEY ("identificationID")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_addressGreaterAreaID_fkey" FOREIGN KEY ("addressGreaterAreaID") REFERENCES "greaterArea"("greaterAreaID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_addressAreaID_fkey" FOREIGN KEY ("addressAreaID") REFERENCES "area"("areaID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_addressStreetID_fkey" FOREIGN KEY ("addressStreetID") REFERENCES "street"("streetID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petOwner" ADD CONSTRAINT "petOwner_addressGreaterAreaID_fkey" FOREIGN KEY ("addressGreaterAreaID") REFERENCES "greaterArea"("greaterAreaID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petOwner" ADD CONSTRAINT "petOwner_addressAreaID_fkey" FOREIGN KEY ("addressAreaID") REFERENCES "area"("areaID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petOwner" ADD CONSTRAINT "petOwner_addressStreetID_fkey" FOREIGN KEY ("addressStreetID") REFERENCES "street"("streetID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "greaterAreaOnVolunteer" ADD CONSTRAINT "greaterAreaOnVolunteer_greaterAreaID_fkey" FOREIGN KEY ("greaterAreaID") REFERENCES "greaterArea"("greaterAreaID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "greaterAreaOnVolunteer" ADD CONSTRAINT "greaterAreaOnVolunteer_volunteerID_fkey" FOREIGN KEY ("volunteerID") REFERENCES "volunteer"("volunteerID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "area" ADD CONSTRAINT "area_greaterAreaID_fkey" FOREIGN KEY ("greaterAreaID") REFERENCES "greaterArea"("greaterAreaID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areaOnStreet" ADD CONSTRAINT "areaOnStreet_areaID_fkey" FOREIGN KEY ("areaID") REFERENCES "area"("areaID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areaOnStreet" ADD CONSTRAINT "areaOnStreet_streetID_fkey" FOREIGN KEY ("streetID") REFERENCES "street"("streetID") ON DELETE RESTRICT ON UPDATE CASCADE;
