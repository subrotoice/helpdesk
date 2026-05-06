-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('agent', 'customer');

-- DropForeignKey
ALTER TABLE "reply" DROP CONSTRAINT "reply_authorId_fkey";

-- AlterTable
ALTER TABLE "reply" ADD COLUMN     "senderType" "SenderType" NOT NULL DEFAULT 'agent',
ALTER COLUMN "authorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "reply" ADD CONSTRAINT "reply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
