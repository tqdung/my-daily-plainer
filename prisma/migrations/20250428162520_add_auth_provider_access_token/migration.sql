/*
  Warnings:

  - The `repeat` column on the `Task` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "TaskRepeat" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "startDate" TIMESTAMP(3),
DROP COLUMN "repeat",
ADD COLUMN     "repeat" "TaskRepeat";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "providerAccessToken" TEXT;
