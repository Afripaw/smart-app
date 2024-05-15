/*
  Warnings:

  - You are about to drop the column `addressAreaID` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `addressGreaterAreaID` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `addressStreetID` on the `User` table. All the data in the column will be lost.
  - The `addressStreetNumber` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `area` on the `communication` table. All the data in the column will be lost.
  - You are about to drop the column `greaterArea` on the `communication` table. All the data in the column will be lost.
  - The `breed` column on the `pet` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `area` on the `petClinic` table. All the data in the column will be lost.
  - You are about to drop the column `conditions` on the `petClinic` table. All the data in the column will be lost.
  - You are about to drop the column `greaterArea` on the `petClinic` table. All the data in the column will be lost.
  - The `addressStreetNumber` column on the `petOwner` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `type` on the `petTreatment` table. All the data in the column will be lost.
  - The `addressStreetNumber` column on the `volunteer` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `areaOnStreet` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userID]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `greaterAreaID` to the `identification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `greaterAreaID` to the `petClinic` table without a default value. This is not possible if the table is not empty.
  - Added the required column `areaID` to the `street` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_addressAreaID_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_addressGreaterAreaID_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_addressStreetID_fkey";

-- DropForeignKey
ALTER TABLE "areaOnStreet" DROP CONSTRAINT "areaOnStreet_areaID_fkey";

-- DropForeignKey
ALTER TABLE "areaOnStreet" DROP CONSTRAINT "areaOnStreet_streetID_fkey";

-- DropForeignKey
ALTER TABLE "petOwner" DROP CONSTRAINT "petOwner_addressAreaID_fkey";

-- DropForeignKey
ALTER TABLE "petOwner" DROP CONSTRAINT "petOwner_addressStreetID_fkey";

-- DropIndex
DROP INDEX "User_mobile_key";

-- DropIndex
DROP INDEX "volunteer_mobile_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "addressAreaID",
DROP COLUMN "addressGreaterAreaID",
DROP COLUMN "addressStreetID",
ADD COLUMN     "addressStreet" TEXT,
ADD COLUMN     "southAfricanID" TEXT,
ALTER COLUMN "mobile" DROP NOT NULL,
DROP COLUMN "addressStreetNumber",
ADD COLUMN     "addressStreetNumber" INTEGER,
ALTER COLUMN "preferredCommunication" DROP NOT NULL;

-- AlterTable
ALTER TABLE "communication" DROP COLUMN "area",
DROP COLUMN "greaterArea";

-- AlterTable
ALTER TABLE "identification" ADD COLUMN     "greaterAreaID" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "pet" ADD COLUMN     "membershipDate" TIMESTAMP(3),
ADD COLUMN     "size" TEXT,
ADD COLUMN     "sterilisationOutcomeDate" TIMESTAMP(3),
DROP COLUMN "breed",
ADD COLUMN     "breed" TEXT[];

-- AlterTable
ALTER TABLE "petClinic" DROP COLUMN "area",
DROP COLUMN "conditions",
DROP COLUMN "greaterArea",
ADD COLUMN     "areaID" INTEGER,
ADD COLUMN     "greaterAreaID" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "petOwner" ADD COLUMN     "southAfricanID" TEXT,
DROP COLUMN "addressStreetNumber",
ADD COLUMN     "addressStreetNumber" INTEGER,
ALTER COLUMN "addressAreaID" DROP NOT NULL,
ALTER COLUMN "addressStreetID" DROP NOT NULL;

-- AlterTable
ALTER TABLE "petTreatment" DROP COLUMN "type";

-- AlterTable
ALTER TABLE "street" ADD COLUMN     "areaID" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "volunteer" ADD COLUMN     "southAfricanID" TEXT,
DROP COLUMN "addressStreetNumber",
ADD COLUMN     "addressStreetNumber" INTEGER,
ALTER COLUMN "preferredCommunication" DROP NOT NULL;

-- DropTable
DROP TABLE "areaOnStreet";

-- CreateTable
CREATE TABLE "conditions" (
    "conditionID" SERIAL NOT NULL,
    "condition" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conditions_pkey" PRIMARY KEY ("conditionID")
);

-- CreateTable
CREATE TABLE "ConditionsOnClinic" (
    "conditionsOnClinicID" SERIAL NOT NULL,
    "conditionID" INTEGER NOT NULL,
    "clinicID" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConditionsOnClinic_pkey" PRIMARY KEY ("conditionsOnClinicID")
);

-- CreateTable
CREATE TABLE "type" (
    "typeID" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "type_pkey" PRIMARY KEY ("typeID")
);

-- CreateTable
CREATE TABLE "typesOnTreatment" (
    "typesOnTreatmentID" SERIAL NOT NULL,
    "typeID" INTEGER NOT NULL,
    "treatmentID" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "typesOnTreatment_pkey" PRIMARY KEY ("typesOnTreatmentID")
);

-- CreateTable
CREATE TABLE "greaterAreaOnUser" (
    "greaterAreaOnUserID" SERIAL NOT NULL,
    "greaterAreaID" INTEGER NOT NULL,
    "userID" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "greaterAreaOnUser_pkey" PRIMARY KEY ("greaterAreaOnUserID")
);

-- CreateTable
CREATE TABLE "greaterAreaOnCommunication" (
    "greaterAreaOnCommunicationID" SERIAL NOT NULL,
    "greaterAreaID" INTEGER NOT NULL,
    "communicationID" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "greaterAreaOnCommunication_pkey" PRIMARY KEY ("greaterAreaOnCommunicationID")
);

-- CreateTable
CREATE TABLE "areaOnCommunication" (
    "areaOnCommunicationID" SERIAL NOT NULL,
    "areaID" INTEGER NOT NULL,
    "communicationID" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "areaOnCommunication_pkey" PRIMARY KEY ("areaOnCommunicationID")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_userID_key" ON "User"("userID");

-- AddForeignKey
ALTER TABLE "petOwner" ADD CONSTRAINT "petOwner_addressAreaID_fkey" FOREIGN KEY ("addressAreaID") REFERENCES "area"("areaID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petOwner" ADD CONSTRAINT "petOwner_addressStreetID_fkey" FOREIGN KEY ("addressStreetID") REFERENCES "street"("streetID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petClinic" ADD CONSTRAINT "petClinic_greaterAreaID_fkey" FOREIGN KEY ("greaterAreaID") REFERENCES "greaterArea"("greaterAreaID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petClinic" ADD CONSTRAINT "petClinic_areaID_fkey" FOREIGN KEY ("areaID") REFERENCES "area"("areaID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionsOnClinic" ADD CONSTRAINT "ConditionsOnClinic_conditionID_fkey" FOREIGN KEY ("conditionID") REFERENCES "conditions"("conditionID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionsOnClinic" ADD CONSTRAINT "ConditionsOnClinic_clinicID_fkey" FOREIGN KEY ("clinicID") REFERENCES "petClinic"("clinicID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "typesOnTreatment" ADD CONSTRAINT "typesOnTreatment_typeID_fkey" FOREIGN KEY ("typeID") REFERENCES "type"("typeID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "typesOnTreatment" ADD CONSTRAINT "typesOnTreatment_treatmentID_fkey" FOREIGN KEY ("treatmentID") REFERENCES "petTreatment"("treatmentID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "greaterAreaOnUser" ADD CONSTRAINT "greaterAreaOnUser_greaterAreaID_fkey" FOREIGN KEY ("greaterAreaID") REFERENCES "greaterArea"("greaterAreaID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "greaterAreaOnUser" ADD CONSTRAINT "greaterAreaOnUser_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "street" ADD CONSTRAINT "street_areaID_fkey" FOREIGN KEY ("areaID") REFERENCES "area"("areaID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "greaterAreaOnCommunication" ADD CONSTRAINT "greaterAreaOnCommunication_greaterAreaID_fkey" FOREIGN KEY ("greaterAreaID") REFERENCES "greaterArea"("greaterAreaID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "greaterAreaOnCommunication" ADD CONSTRAINT "greaterAreaOnCommunication_communicationID_fkey" FOREIGN KEY ("communicationID") REFERENCES "communication"("communicationID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areaOnCommunication" ADD CONSTRAINT "areaOnCommunication_areaID_fkey" FOREIGN KEY ("areaID") REFERENCES "area"("areaID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areaOnCommunication" ADD CONSTRAINT "areaOnCommunication_communicationID_fkey" FOREIGN KEY ("communicationID") REFERENCES "communication"("communicationID") ON DELETE RESTRICT ON UPDATE CASCADE;
