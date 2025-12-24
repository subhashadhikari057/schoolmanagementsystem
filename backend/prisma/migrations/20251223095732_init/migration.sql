-- CreateIndex
CREATE INDEX "backup_notifications_createdAt_idx" ON "backup_notifications"("createdAt");

-- AddForeignKey
ALTER TABLE "backup_metadata" ADD CONSTRAINT "backup_metadata_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_schedules" ADD CONSTRAINT "backup_schedules_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_notifications" ADD CONSTRAINT "backup_notifications_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "backup_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_notifications" ADD CONSTRAINT "backup_notifications_backupId_fkey" FOREIGN KEY ("backupId") REFERENCES "backup_metadata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
