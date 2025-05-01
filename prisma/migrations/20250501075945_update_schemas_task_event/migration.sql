/*
  Warnings:

  - You are about to drop the column `externalCalendarEventId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `externalEventId` on the `Task` table. All the data in the column will be lost.
  - Made the column `calendarProvider` on table `Event` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_userId_fkey";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "externalCalendarEventId",
ADD COLUMN     "externalEventId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "calendarProvider" SET NOT NULL;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "externalEventId";

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
