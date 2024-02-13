/*
  Warnings:

  - The `vaccinationShot2` column on the `pet` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `vaccinationShot3` column on the `pet` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `vaccinationShot1` on the `pet` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropIndex
DROP INDEX "petOwner_mobile_key";

-- AlterTable
ALTER TABLE "pet" DROP COLUMN "vaccinationShot1",
ADD COLUMN     "vaccinationShot1" TIMESTAMP(3) NOT NULL,
DROP COLUMN "vaccinationShot2",
ADD COLUMN     "vaccinationShot2" TIMESTAMP(3),
DROP COLUMN "vaccinationShot3",
ADD COLUMN     "vaccinationShot3" TIMESTAMP(3);
