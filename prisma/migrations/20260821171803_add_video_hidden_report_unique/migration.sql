-- AlterTable
ALTER TABLE "Video" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Report_parentId_videoId_key" ON "Report"("parentId", "videoId");
