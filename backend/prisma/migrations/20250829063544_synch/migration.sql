-- CreateTable
CREATE TABLE "public"."TeacherAttendanceSession" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "sessionType" TEXT NOT NULL DEFAULT 'daily',
    "markedBy" TEXT NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "TeacherAttendanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeacherAttendanceRecord" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "status" "public"."AttendanceStatus" NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "TeacherAttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StaffAttendanceSession" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "sessionType" TEXT NOT NULL DEFAULT 'daily',
    "markedBy" TEXT NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "StaffAttendanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StaffAttendanceRecord" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "status" "public"."AttendanceStatus" NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "StaffAttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeacherAttendanceSession_date_idx" ON "public"."TeacherAttendanceSession"("date");

-- CreateIndex
CREATE INDEX "TeacherAttendanceSession_markedBy_idx" ON "public"."TeacherAttendanceSession"("markedBy");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherAttendanceSession_date_sessionType_key" ON "public"."TeacherAttendanceSession"("date", "sessionType");

-- CreateIndex
CREATE INDEX "TeacherAttendanceRecord_sessionId_idx" ON "public"."TeacherAttendanceRecord"("sessionId");

-- CreateIndex
CREATE INDEX "TeacherAttendanceRecord_teacherId_idx" ON "public"."TeacherAttendanceRecord"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherAttendanceRecord_status_idx" ON "public"."TeacherAttendanceRecord"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherAttendanceRecord_sessionId_teacherId_key" ON "public"."TeacherAttendanceRecord"("sessionId", "teacherId");

-- CreateIndex
CREATE INDEX "StaffAttendanceSession_date_idx" ON "public"."StaffAttendanceSession"("date");

-- CreateIndex
CREATE INDEX "StaffAttendanceSession_markedBy_idx" ON "public"."StaffAttendanceSession"("markedBy");

-- CreateIndex
CREATE UNIQUE INDEX "StaffAttendanceSession_date_sessionType_key" ON "public"."StaffAttendanceSession"("date", "sessionType");

-- CreateIndex
CREATE INDEX "StaffAttendanceRecord_sessionId_idx" ON "public"."StaffAttendanceRecord"("sessionId");

-- CreateIndex
CREATE INDEX "StaffAttendanceRecord_staffId_idx" ON "public"."StaffAttendanceRecord"("staffId");

-- CreateIndex
CREATE INDEX "StaffAttendanceRecord_status_idx" ON "public"."StaffAttendanceRecord"("status");

-- CreateIndex
CREATE UNIQUE INDEX "StaffAttendanceRecord_sessionId_staffId_key" ON "public"."StaffAttendanceRecord"("sessionId", "staffId");

-- AddForeignKey
ALTER TABLE "public"."TeacherAttendanceSession" ADD CONSTRAINT "TeacherAttendanceSession_markedBy_fkey" FOREIGN KEY ("markedBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherAttendanceRecord" ADD CONSTRAINT "TeacherAttendanceRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."TeacherAttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherAttendanceRecord" ADD CONSTRAINT "TeacherAttendanceRecord_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StaffAttendanceSession" ADD CONSTRAINT "StaffAttendanceSession_markedBy_fkey" FOREIGN KEY ("markedBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StaffAttendanceRecord" ADD CONSTRAINT "StaffAttendanceRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."StaffAttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StaffAttendanceRecord" ADD CONSTRAINT "StaffAttendanceRecord_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
