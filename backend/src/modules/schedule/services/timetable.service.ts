import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import {
  TimetableSlotDto,
  BulkTimetableOperationDto,
  GetTimetableDto,
  ValidateTimetableDto,
  AssignSubjectToTimeslotDto,
  AssignTeacherToSlotDto,
} from '@sms/shared-types';

@Injectable()
export class TimetableService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get complete timetable for a class
   */
  async getTimetable(params: GetTimetableDto): Promise<TimetableSlotDto[]> {
    const { classId, scheduleId, includeConflicts = true } = params;

    // If scheduleId not provided, get the active schedule for the class
    let activeScheduleId = scheduleId;
    if (!activeScheduleId) {
      const activeSchedule = await this.prisma.classSchedule.findFirst({
        where: {
          classId,
          status: 'active',
          deletedAt: null,
        },
      });

      if (!activeSchedule) {
        throw new NotFoundException(
          `No active schedule found for class ${classId}`,
        );
      }
      activeScheduleId = activeSchedule.id;
    }

    // First, get all timeslots for this class to ensure we have the correct day information
    const classTimeslots = await this.prisma.classTimeslot.findMany({
      where: {
        classId,
        deletedAt: null,
      },
      select: {
        id: true,
        day: true,
        startTime: true,
        endTime: true,
        type: true,
        label: true,
      },
    });

    // Create a map of timeslot IDs to their full details for quick lookup
    const timeslotMap = new Map(classTimeslots.map(ts => [ts.id, ts]));

    const timetableSlots = await this.prisma.scheduleSlot.findMany({
      where: {
        scheduleId: activeScheduleId,
        deletedAt: null,
      },
      include: {
        timeslot: {
          select: {
            id: true,
            day: true,
            startTime: true,
            endTime: true,
            type: true,
            label: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
          },
        },
        teacher: {
          select: {
            id: true,
            userId: true,
            employeeId: true,
            designation: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        room: {
          select: {
            id: true,
            roomNo: true,
            name: true,
            capacity: true,
            floor: true,
            building: true,
          },
        },
      },
      orderBy: [{ day: 'asc' }, { timeslot: { startTime: 'asc' } }],
    });

    // Ensure each schedule slot uses the correct day from its associated timeslot
    for (const slot of timetableSlots) {
      // Get the original timeslot data
      const originalTimeslot = timeslotMap.get(slot.timeslotId);

      if (originalTimeslot) {
        // Ensure the day in the schedule slot matches the day in the timeslot
        if (slot.day !== originalTimeslot.day) {
          // Update the day to match the timeslot's day
          await this.prisma.scheduleSlot.update({
            where: { id: slot.id },
            data: { day: originalTimeslot.day },
          });

          // Update the day in the current object for immediate use
          slot.day = originalTimeslot.day;

          // Also update the embedded timeslot data
          if (slot.timeslot) {
            slot.timeslot.day = originalTimeslot.day;
          }
        }
      }
    }

    // Check for conflicts if requested
    if (includeConflicts) {
      for (const slot of timetableSlots) {
        if (slot.teacherId) {
          slot.hasConflict = await this.checkTeacherConflict(
            slot.teacherId,
            slot.day,
            slot.timeslot.startTime,
            slot.timeslot.endTime,
            slot.id,
          );
        }
      }
    }

    return timetableSlots as TimetableSlotDto[];
  }

  /**
   * Assign a subject to a specific timeslot
   */
  async assignSubjectToTimeslot(
    assignDto: AssignSubjectToTimeslotDto,
    userId: string,
  ): Promise<TimetableSlotDto> {
    const { scheduleId, timeslotId, subjectId } = assignDto; // Remove 'day' as we'll use the timeslot's day

    // Verify schedule exists
    const schedule = await this.prisma.classSchedule.findUnique({
      where: { id: scheduleId, deletedAt: null },
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${scheduleId} not found`);
    }

    // Verify timeslot exists
    const timeslot = await this.prisma.classTimeslot.findUnique({
      where: { id: timeslotId, deletedAt: null },
    });

    if (!timeslot) {
      throw new NotFoundException(`Timeslot with ID ${timeslotId} not found`);
    }

    // Verify subject exists
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId, deletedAt: null },
    });

    if (!subject) {
      throw new NotFoundException(`Subject with ID ${subjectId} not found`);
    }

    // Use the day from the timeslot to ensure consistency
    const correctDay = timeslot.day;

    // Check if slot already exists - use the timeslot's day, not the provided day
    const existingSlot = await this.prisma.scheduleSlot.findFirst({
      where: {
        scheduleId,
        timeslotId,
        day: correctDay, // Use the correct day from the timeslot
        deletedAt: null,
      },
    });

    let slot;
    if (existingSlot) {
      // Update existing slot
      slot = await this.prisma.scheduleSlot.update({
        where: { id: existingSlot.id },
        data: {
          subjectId,
          teacherId: null, // Reset teacher when changing subject
          updatedById: userId,
          updatedAt: new Date(),
          day: correctDay, // Ensure day is consistent with timeslot
        },
        include: {
          timeslot: {
            select: {
              id: true,
              day: true,
              startTime: true,
              endTime: true,
              type: true,
              label: true,
            },
          },
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
              description: true,
            },
          },
          teacher: {
            select: {
              id: true,
              userId: true,
              employeeId: true,
              designation: true,
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
            },
          },
          room: {
            select: {
              id: true,
              roomNo: true,
              name: true,
              capacity: true,
              floor: true,
              building: true,
            },
          },
        },
      });
    } else {
      // Create new slot
      slot = await this.prisma.scheduleSlot.create({
        data: {
          scheduleId,
          timeslotId,
          day: correctDay, // Use the day from the timeslot, not the provided day
          subjectId,
          type: timeslot.type,
          createdById: userId,
        },
        include: {
          timeslot: {
            select: {
              id: true,
              day: true,
              startTime: true,
              endTime: true,
              type: true,
              label: true,
            },
          },
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
              description: true,
            },
          },
          teacher: {
            select: {
              id: true,
              userId: true,
              employeeId: true,
              designation: true,
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
            },
          },
          room: {
            select: {
              id: true,
              roomNo: true,
              name: true,
              capacity: true,
              floor: true,
              building: true,
            },
          },
        },
      });
    }

    return slot as TimetableSlotDto;
  }

  /**
   * Assign teacher to a schedule slot
   */
  async assignTeacherToSlot(
    assignDto: AssignTeacherToSlotDto,
    userId: string,
  ): Promise<TimetableSlotDto> {
    const { slotId, teacherId } = assignDto;

    // Verify slot exists
    const slot = await this.prisma.scheduleSlot.findUnique({
      where: { id: slotId, deletedAt: null },
      include: {
        timeslot: true,
      },
    });

    if (!slot) {
      throw new NotFoundException(`Schedule slot with ID ${slotId} not found`);
    }

    // Verify teacher exists
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId, deletedAt: null },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${teacherId} not found`);
    }

    // Check for teacher conflict
    const hasConflict = await this.checkTeacherConflict(
      teacherId,
      slot.day,
      slot.timeslot.startTime,
      slot.timeslot.endTime,
      slotId,
    );

    // Update slot with teacher (persist even if conflict; mark flag)
    const updatedSlot = await this.prisma.scheduleSlot.update({
      where: { id: slotId },
      data: {
        teacherId,
        hasConflict,
        updatedById: userId,
        updatedAt: new Date(),
      },
      include: {
        timeslot: {
          select: {
            id: true,
            day: true,
            startTime: true,
            endTime: true,
            type: true,
            label: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
          },
        },
        teacher: {
          select: {
            id: true,
            userId: true,
            employeeId: true,
            designation: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        room: {
          select: {
            id: true,
            roomNo: true,
            name: true,
            capacity: true,
            floor: true,
            building: true,
          },
        },
      },
    });

    return updatedSlot as TimetableSlotDto;
  }

  /**
   * Remove assignment from slot (subject, teacher, etc.)
   */
  async removeSlotAssignment(slotId: string, userId: string): Promise<void> {
    const slot = await this.prisma.scheduleSlot.findUnique({
      where: { id: slotId, deletedAt: null },
    });

    if (!slot) {
      throw new NotFoundException(`Schedule slot with ID ${slotId} not found`);
    }

    await this.prisma.scheduleSlot.update({
      where: { id: slotId },
      data: {
        deletedAt: new Date(),
        deletedById: userId,
      },
    });
  }

  /**
   * Bulk timetable operations
   */
  async bulkTimetableOperations(
    bulkDto: BulkTimetableOperationDto,
    userId: string,
  ): Promise<TimetableSlotDto[]> {
    const { scheduleId, operations } = bulkDto;

    // Verify schedule exists
    const schedule = await this.prisma.classSchedule.findUnique({
      where: { id: scheduleId, deletedAt: null },
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${scheduleId} not found`);
    }

    const results = await this.prisma.$transaction(async tx => {
      const processedSlots: TimetableSlotDto[] = [];

      for (let idx = 0; idx < operations.length; idx++) {
        const operation = operations[idx];
        const { action, slotData } = operation;
        try {
          switch (action) {
            case 'create': {
              let computedConflict = false;
              if (slotData.teacherId) {
                // compute conflict for teacher
                const baseTimeslot = await tx.classTimeslot.findUnique({
                  where: { id: slotData.timeslotId },
                });
                if (baseTimeslot) {
                  computedConflict = await this.checkTeacherConflict(
                    slotData.teacherId,
                    slotData.day,
                    baseTimeslot.startTime,
                    baseTimeslot.endTime,
                    undefined,
                  );
                }
              }
              const newSlot = await tx.scheduleSlot.create({
                data: {
                  scheduleId,
                  timeslotId: slotData.timeslotId,
                  day: slotData.day,
                  subjectId: slotData.subjectId,
                  teacherId: slotData.teacherId,
                  roomId: slotData.roomId,
                  type: slotData.type,
                  hasConflict: computedConflict,
                  createdById: userId,
                },
                include: {
                  timeslot: {
                    select: {
                      id: true,
                      day: true,
                      startTime: true,
                      endTime: true,
                      type: true,
                      label: true,
                    },
                  },
                  subject: {
                    select: {
                      id: true,
                      name: true,
                      code: true,
                      description: true,
                    },
                  },
                  teacher: {
                    select: {
                      id: true,
                      userId: true,
                      employeeId: true,
                      designation: true,
                      user: {
                        select: {
                          id: true,
                          fullName: true,
                          email: true,
                        },
                      },
                    },
                  },
                  room: {
                    select: {
                      id: true,
                      roomNo: true,
                      name: true,
                      capacity: true,
                      floor: true,
                      building: true,
                    },
                  },
                },
              });
              processedSlots.push(newSlot as TimetableSlotDto);
              break;
            }

            case 'update': {
              if (!slotData.id) {
                throw new BadRequestException(
                  'Slot ID required for update operation',
                );
              }
              let computedConflict = false;
              if (slotData.teacherId) {
                const baseTimeslot = await tx.classTimeslot.findUnique({
                  where: { id: slotData.timeslotId },
                });
                if (baseTimeslot) {
                  computedConflict = await this.checkTeacherConflict(
                    slotData.teacherId,
                    slotData.day,
                    baseTimeslot.startTime,
                    baseTimeslot.endTime,
                    slotData.id,
                  );
                }
              }
              const updatedSlot = await tx.scheduleSlot.update({
                where: { id: slotData.id },
                data: {
                  subjectId: slotData.subjectId,
                  teacherId: slotData.teacherId,
                  roomId: slotData.roomId,
                  type: slotData.type,
                  hasConflict: computedConflict,
                  updatedById: userId,
                  updatedAt: new Date(),
                },
                include: {
                  timeslot: {
                    select: {
                      id: true,
                      day: true,
                      startTime: true,
                      endTime: true,
                      type: true,
                      label: true,
                    },
                  },
                  subject: {
                    select: {
                      id: true,
                      name: true,
                      code: true,
                      description: true,
                    },
                  },
                  teacher: {
                    select: {
                      id: true,
                      userId: true,
                      employeeId: true,
                      designation: true,
                      user: {
                        select: {
                          id: true,
                          fullName: true,
                          email: true,
                        },
                      },
                    },
                  },
                  room: {
                    select: {
                      id: true,
                      roomNo: true,
                      name: true,
                      capacity: true,
                      floor: true,
                      building: true,
                    },
                  },
                },
              });
              processedSlots.push(updatedSlot as TimetableSlotDto);
              break;
            }

            case 'delete': {
              if (!slotData.id) {
                throw new BadRequestException(
                  'Slot ID required for delete operation',
                );
              }
              await tx.scheduleSlot.update({
                where: { id: slotData.id },
                data: {
                  deletedAt: new Date(),
                  deletedById: userId,
                },
              });
              break;
            }
          }
        } catch (e: unknown) {
          // Use console only for debug; swallow lint via runtime guard
          if (process.env.NODE_ENV !== 'production') {
            const errObj = e as { code?: string; meta?: unknown };
            // eslint-disable-next-line no-console
            console.error('[DEBUG] Bulk op failed', {
              idx,
              action,
              slotData,
              prismaCode: errObj?.code,
              meta: errObj?.meta,
            });
          }
          throw e; // rethrow to abort transaction
        }
      }

      return processedSlots;
    });

    return results;
  }

  /**
   * Validate timetable for conflicts and completeness
   */
  async validateTimetable(validateDto: ValidateTimetableDto): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const {
      scheduleId,
      checkConflicts = true,
      checkCompleteness = true,
    } = validateDto;

    const errors: string[] = [];
    const warnings: string[] = [];

    // Get all slots for the schedule
    const slots = await this.prisma.scheduleSlot.findMany({
      where: {
        scheduleId,
        deletedAt: null,
      },
      include: {
        timeslot: true,
        subject: true,
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (checkConflicts) {
      // Check teacher conflicts
      const teacherSlots = slots.filter(slot => slot.teacherId);
      for (const slot of teacherSlots) {
        const hasConflict = await this.checkTeacherConflict(
          slot.teacherId!,
          slot.day,
          slot.timeslot.startTime,
          slot.timeslot.endTime,
          slot.id,
        );

        if (hasConflict) {
          errors.push(
            `Teacher conflict found for ${slot.teacher?.user?.fullName} on ${slot.day} at ${slot.timeslot.startTime}-${slot.timeslot.endTime}`,
          );
        }
      }
    }

    if (checkCompleteness) {
      // Check for incomplete assignments
      const incompleteSlots = slots.filter(
        slot => slot.type === 'REGULAR' && slot.subjectId && !slot.teacherId,
      );

      if (incompleteSlots.length > 0) {
        warnings.push(
          `Found ${incompleteSlots.length} subjects without assigned teachers`,
        );
      }

      // Check for empty regular timeslots
      const regularTimeslots = await this.prisma.classTimeslot.findMany({
        where: {
          classId: (await this.prisma.classSchedule.findUnique({
            where: { id: scheduleId },
            select: { classId: true },
          }))!.classId,
          type: 'REGULAR',
          deletedAt: null,
        },
      });

      const assignedTimeslots = slots.map(
        slot => `${slot.timeslotId}-${slot.day}`,
      );
      const emptySlots = regularTimeslots.filter(timeslot => {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        return days.some(
          day => !assignedTimeslots.includes(`${timeslot.id}-${day}`),
        );
      });

      if (emptySlots.length > 0) {
        warnings.push(`Found ${emptySlots.length} empty regular timeslots`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check for teacher conflicts
   */
  private async checkTeacherConflict(
    teacherId: string,
    day: string,
    startTime: string,
    endTime: string,
    excludeSlotId?: string,
  ): Promise<boolean> {
    const conflictingSlots = await this.prisma.scheduleSlot.findMany({
      where: {
        teacherId,
        day,
        deletedAt: null,
        id: excludeSlotId ? { not: excludeSlotId } : undefined,
      },
      include: {
        timeslot: true,
      },
    });

    return conflictingSlots.some(slot => {
      const slotStart = slot.timeslot.startTime;
      const slotEnd = slot.timeslot.endTime;

      // Check for time overlap
      return (
        (startTime >= slotStart && startTime < slotEnd) ||
        (endTime > slotStart && endTime <= slotEnd) ||
        (startTime <= slotStart && endTime >= slotEnd)
      );
    });
  }

  /**
   * Export timetables (single class or all classes) in CSV, XLSX, or PDF
   */
  async exportTimetables(
    format: 'csv' | 'xlsx' | 'pdf',
    scope: 'all' | 'class',
    classId?: string,
  ): Promise<{ filename: string; mime: string; buffer: Buffer }> {
    if (scope === 'class' && !classId) {
      throw new BadRequestException('classId is required when scope=class');
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const buildClassFileBase = (cls: {
      name: string | null;
      grade?: number | null;
      section?: string | null;
    }) => {
      const tokens: string[] = [];
      const gradeToken =
        cls.grade !== undefined && cls.grade !== null
          ? `Grade${cls.grade}`
          : '';
      const sectionToken = cls.section ? `Sec${cls.section}` : '';
      if (gradeToken) tokens.push(gradeToken);
      if (sectionToken) tokens.push(sectionToken);
      if (cls.name) {
        const rawName = cls.name.trim();
        const sanitized = rawName.replace(/\s+/g, '_');
        // Avoid duplication of grade/section already represented
        const lowerName = rawName.toLowerCase();
        const gradeAlready =
          gradeToken && lowerName.includes(`grade ${cls.grade}`);
        const sectionAlready =
          sectionToken &&
          /(section|sec)\s*/i.test(lowerName) &&
          lowerName.includes(String(cls.section).toLowerCase());
        if (!gradeAlready && !sectionAlready) tokens.push(sanitized);
      }
      if (tokens.length === 0) tokens.push('Class');
      return tokens.join('_');
    };

    // Utility to build rows for a schedule with guaranteed consistent matrix for PDF
    // slots typed minimally to avoid heavy redefinition; using unknown shape for lint safety
    const buildScheduleMatrix = (
      slots: {
        timeslot: { startTime: string; endTime: string };
        day: string;
        type?: string;
      }[],
    ) => {
      const uniqueTimes = Array.from(
        new Set(
          slots.map(s => `${s.timeslot.startTime}-${s.timeslot.endTime}`),
        ),
      ).sort();
      const daysOrdered = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ].filter(d => slots.some(s => s.day.toLowerCase() === d));
      // Fallback if no slots – synthesize one placeholder period
      const times = uniqueTimes.length > 0 ? uniqueTimes : ['00:00-00:00'];
      const days = daysOrdered.length > 0 ? daysOrdered : ['monday'];
      return { times, days };
    };

    if (scope === 'all') {
      const schedules = await this.prisma.classSchedule.findMany({
        where: { status: 'active', deletedAt: null },
        include: {
          class: true,
          scheduleSlots: {
            where: { deletedAt: null },
            include: {
              timeslot: true,
              subject: true,
              teacher: { include: { user: true } },
              room: true,
            },
            orderBy: [{ day: 'asc' }, { timeslot: { startTime: 'asc' } }],
          },
        },
      });

      const files: { name: string; data: Buffer }[] = [];

      // Simple PDF renderer (lightweight table) reused for each schedule
      const renderPdf = async (sched: (typeof schedules)[number]) => {
        type PdfTextOpts = { align?: string; width?: number; height?: number };
        type PdfDoc = {
          fontSize(n: number): PdfDoc;
          fillColor(c: string): PdfDoc;
          text(
            t: string,
            x?: number | PdfTextOpts,
            y?: number | PdfTextOpts,
            opts?: PdfTextOpts,
          ): PdfDoc;
          moveDown(n?: number): PdfDoc;
          rect(x: number, y: number, w: number, h: number): PdfDoc;
          stroke(): PdfDoc;
          save(): PdfDoc;
          restore(): PdfDoc;
          end(): void;
          fill(color?: string): PdfDoc;
          on(event: string, cb: (chunk: Buffer) => void): unknown;
          font(name: string): PdfDoc;
          addPage(): PdfDoc;
          page: {
            width: number;
            height: number;
            margins: { left: number; right: number; bottom: number };
          };
          x: number;
          y: number;
        };
        let pdfModule: unknown;
        try {
          pdfModule = await import('pdfkit');
        } catch {
          throw new BadRequestException(
            'PDF export not supported - pdfkit module missing',
          );
        }
        const PDFDocumentCtor =
          (
            pdfModule as {
              default?: new (opts: { margin: number; size: string }) => PdfDoc;
            } & { new (opts: { margin: number; size: string }): PdfDoc }
          ).default ||
          (pdfModule as unknown as new (opts: {
            margin: number;
            size: string;
          }) => PdfDoc);
        const doc = new PDFDocumentCtor({ margin: 36, size: 'A4' });
        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        const classLabel = buildClassFileBase(sched.class);
        doc
          .fontSize(18)
          .fillColor('#0f172a')
          .text(`Class Timetable`, { align: 'center' });
        doc.moveDown(0.2);
        doc
          .fontSize(11)
          .fillColor('#334155')
          .text(`Class: ${classLabel}`, { align: 'center' });
        doc
          .fontSize(10)
          .fillColor('#475569')
          .text(`Generated: ${new Date().toLocaleDateString()}`, {
            align: 'center',
          });
        doc.moveDown(0.6);

        const { times, days } = buildScheduleMatrix(sched.scheduleSlots);
        if (sched.scheduleSlots.length === 0) {
          doc
            .fontSize(12)
            .fillColor('#64748b')
            .text('No schedule slots available', { align: 'center' });
          doc.end();
          return await new Promise<Buffer>(res => {
            doc.on('end', () => res(Buffer.concat(chunks)));
          });
        }

        // Layout metrics
        const tableStartX = doc.page.margins.left;
        let y = doc.y;
        const timeColWidth = 90;
        const availableWidth =
          doc.page.width -
          doc.page.margins.left -
          doc.page.margins.right -
          timeColWidth;
        const dayColWidth = Math.floor(
          availableWidth / Math.max(days.length, 1),
        );
        const rowHeight = 26;

        const drawCell = (
          x: number,
          yPos: number,
          w: number,
          h: number,
          text: string,
          opts: { header?: boolean; fill?: string; color?: string } = {},
        ) => {
          if (opts.fill)
            doc
              .save()
              .fillColor(opts.fill)
              .rect(x, yPos, w, h)
              .fill()
              .restore();
          doc.rect(x, yPos, w, h).stroke();
          doc
            .font(opts.header ? 'Helvetica-Bold' : 'Helvetica')
            .fontSize(opts.header ? 9 : 8)
            .fillColor(opts.color || '#0f172a')
            .text(text, x + 3, yPos + (h / 2 - 6), {
              width: w - 6,
              align: 'center',
            });
        };

        const renderHeader = () => {
          let x = tableStartX;
          drawCell(x, y, timeColWidth, rowHeight, 'Time', {
            header: true,
            fill: '#e0f2fe',
          });
          x += timeColWidth;
          days.forEach(d => {
            drawCell(
              x,
              y,
              dayColWidth,
              rowHeight,
              d.charAt(0).toUpperCase() + d.slice(1),
              { header: true, fill: '#e0f2fe' },
            );
            x += dayColWidth;
          });
          y += rowHeight;
        };
        renderHeader();

        const formatPeriod = (p: string) => {
          const [s, e] = p.split('-');
          return `${s} - ${e}`;
        };

        for (const period of times) {
          if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
            y = doc.y;
            renderHeader();
          }
          let x = tableStartX;
          drawCell(x, y, timeColWidth, rowHeight, formatPeriod(period), {
            fill: '#f1f5f9',
          });
          x += timeColWidth;
          for (const d of days) {
            const slot = sched.scheduleSlots.find(
              s =>
                `${s.timeslot.startTime}-${s.timeslot.endTime}` === period &&
                s.day.toLowerCase() === d,
            );
            let txt = '';
            let fill: string | undefined;
            if (slot) {
              const subj = slot.subject?.code || slot.subject?.name || '';
              const teacherLast = slot.teacher?.user?.fullName
                ? slot.teacher.user.fullName.split(' ').slice(-1)[0]
                : '';
              txt = teacherLast ? `${subj}\n${teacherLast}` : subj;
              const t = slot.type?.toLowerCase();
              if (t === 'break') fill = '#fff7ed';
              else if (t === 'lunch') fill = '#ffe4e6';
              else fill = '#ffffff';
            } else {
              fill = '#ffffff';
            }
            drawCell(x, y, dayColWidth, rowHeight, txt, { fill });
            x += dayColWidth;
          }
          y += rowHeight;
        }

        doc.end();
        return await new Promise<Buffer>(res => {
          doc.on('end', () => res(Buffer.concat(chunks)));
        });
      };
      for (const sched of schedules) {
        const fileBase = buildClassFileBase(sched.class) + `_${timestamp}`;
        const rows = sched.scheduleSlots.map(s => ({
          day: s.day,
          startTime: s.timeslot.startTime,
          endTime: s.timeslot.endTime,
          type: s.type,
          subject: s.subject?.name || '',
          subjectCode: s.subject?.code || '',
          teacher: s.teacher?.user?.fullName || '',
          room: s.room?.roomNo || '',
          hasConflict: s.hasConflict ? 'YES' : 'NO',
        }));

        if (format === 'csv') {
          const header = Object.keys(
            rows[0] || { day: '', startTime: '', endTime: '' },
          ).join(',');
          const body = rows
            .map(r =>
              Object.values(r)
                .map(v => `"${String(v).replace(/"/g, '""')}"`)
                .join(','),
            )
            .join('\n');
          const csv = `${header}\n${body}`;
          files.push({
            name: `${fileBase}.csv`,
            data: Buffer.from(csv, 'utf-8'),
          });
        } else if (format === 'xlsx') {
          const ExcelJS = await import('exceljs');
          const workbook = new ExcelJS.Workbook();
          const sheet = workbook.addWorksheet('Timetable');
          if (rows.length > 0) {
            sheet.columns = Object.keys(rows[0]).map(k => ({
              header: k,
              key: k,
            }));
            rows.forEach(r => sheet.addRow(r));
            sheet.getRow(1).font = { bold: true };
          }
          const buf = await workbook.xlsx.writeBuffer();
          files.push({ name: `${fileBase}.xlsx`, data: Buffer.from(buf) });
        } else if (format === 'pdf') {
          const pdfBuf = await renderPdf(sched);
          files.push({ name: `${fileBase}.pdf`, data: pdfBuf });
        }
      }
      const jszipMod = await import('jszip');
      type ZipInstance = {
        file(name: string, data: Buffer): void;
        generateAsync(opts: {
          type: 'nodebuffer';
          compression: string;
        }): Promise<Buffer>;
      };
      type ZipCtor = new () => ZipInstance;
      const jszipUnknown = jszipMod as unknown as {
        default?: ZipCtor;
        JSZip?: ZipCtor;
      } & ZipCtor;
      const JSZipCtor: ZipCtor =
        jszipUnknown.default ||
        jszipUnknown.JSZip ||
        (jszipUnknown as unknown as ZipCtor);
      const zip = new JSZipCtor();
      files.forEach(f => zip.file(f.name, f.data));
      const zipBuf = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      });
      return {
        filename: `all-classes-timetables-${timestamp}.zip`,
        mime: 'application/zip',
        buffer: zipBuf,
      };
    }

    const schedule = await this.prisma.classSchedule.findFirst({
      where: { classId, status: 'active', deletedAt: null },
      include: {
        class: true,
        scheduleSlots: {
          where: { deletedAt: null },
          include: {
            timeslot: true,
            subject: true,
            teacher: { include: { user: true } },
            room: true,
          },
          orderBy: [{ day: 'asc' }, { timeslot: { startTime: 'asc' } }],
        },
      },
    });
    if (!schedule)
      throw new NotFoundException('Active schedule not found for class');
    const fileBase = `${buildClassFileBase(schedule.class)}_${timestamp}`;
    const rows = schedule.scheduleSlots.map(s => ({
      day: s.day,
      startTime: s.timeslot.startTime,
      endTime: s.timeslot.endTime,
      type: s.type,
      subject: s.subject?.name || '',
      subjectCode: s.subject?.code || '',
      teacher: s.teacher?.user?.fullName || '',
      room: s.room?.roomNo || '',
      hasConflict: s.hasConflict ? 'YES' : 'NO',
    }));

    if (format === 'csv') {
      const header = Object.keys(
        rows[0] || { day: '', startTime: '', endTime: '' },
      ).join(',');
      const body = rows
        .map(r =>
          Object.values(r)
            .map(v => `"${String(v).replace(/"/g, '""')}"`)
            .join(','),
        )
        .join('\n');
      const csv = `${header}\n${body}`;
      return {
        filename: `${fileBase}.csv`,
        mime: 'text/csv',
        buffer: Buffer.from(csv, 'utf-8'),
      };
    }
    if (format === 'xlsx') {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Timetable');
      if (rows.length > 0) {
        sheet.columns = Object.keys(rows[0]).map(k => ({ header: k, key: k }));
        rows.forEach(r => sheet.addRow(r));
        sheet.getRow(1).font = { bold: true };
      } else {
        sheet.addRow(['No data']);
      }
      const buf = await workbook.xlsx.writeBuffer();
      return {
        filename: `${fileBase}.xlsx`,
        mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer: Buffer.from(buf),
      };
    }
    // Single class PDF
    // Single class PDF using same simple renderer
    const pdfBuffer = await (async () => {
      type PdfTextOpts = { align?: string; width?: number; height?: number };
      type PdfDoc = {
        fontSize(n: number): PdfDoc;
        fillColor(c: string): PdfDoc;
        text(
          t: string,
          x?: number | PdfTextOpts,
          y?: number | PdfTextOpts,
          opts?: PdfTextOpts,
        ): PdfDoc;
        moveDown(n?: number): PdfDoc;
        rect(x: number, y: number, w: number, h: number): PdfDoc;
        stroke(): PdfDoc;
        save(): PdfDoc;
        restore(): PdfDoc;
        end(): void;
        fill(color?: string): PdfDoc;
        on(event: string, cb: (chunk: Buffer) => void): unknown;
        font(name: string): PdfDoc;
        addPage(): PdfDoc;
        page: {
          width: number;
          height: number;
          margins: { left: number; right: number; bottom: number };
        };
        x: number;
        y: number;
      };
      let pdfModule: unknown;
      try {
        pdfModule = await import('pdfkit');
      } catch {
        throw new BadRequestException(
          'PDF export not supported - pdfkit module missing',
        );
      }
      const PDFDocumentCtor =
        (
          pdfModule as {
            default?: new (opts: { margin: number; size: string }) => PdfDoc;
          } & { new (opts: { margin: number; size: string }): PdfDoc }
        ).default ||
        (pdfModule as unknown as new (opts: {
          margin: number;
          size: string;
        }) => PdfDoc);
      const doc = new PDFDocumentCtor({ margin: 36, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      const classLabel = buildClassFileBase(schedule.class);
      doc
        .fontSize(18)
        .fillColor('#0f172a')
        .text('Class Timetable', { align: 'center' });
      doc.moveDown(0.2);
      doc
        .fontSize(11)
        .fillColor('#334155')
        .text(`Class: ${classLabel}`, { align: 'center' });
      doc
        .fontSize(10)
        .fillColor('#475569')
        .text(`Generated: ${new Date().toLocaleDateString()}`, {
          align: 'center',
        });
      doc.moveDown(0.6);
      const { times, days } = buildScheduleMatrix(schedule.scheduleSlots);
      if (schedule.scheduleSlots.length === 0) {
        doc
          .fontSize(12)
          .fillColor('#64748b')
          .text('No schedule slots available', { align: 'center' });
        doc.end();
        return await new Promise<Buffer>(res => {
          doc.on('end', () => res(Buffer.concat(chunks)));
        });
      }
      const tableStartX = doc.page.margins.left;
      let y = doc.y;
      const timeColWidth = 90;
      const availableWidth =
        doc.page.width -
        doc.page.margins.left -
        doc.page.margins.right -
        timeColWidth;
      const dayColWidth = Math.floor(availableWidth / Math.max(days.length, 1));
      const rowHeight = 26;
      const drawCell = (
        x: number,
        yPos: number,
        w: number,
        h: number,
        text: string,
        opts: { header?: boolean; fill?: string; color?: string } = {},
      ) => {
        if (opts.fill)
          doc.save().fillColor(opts.fill).rect(x, yPos, w, h).fill().restore();
        doc.rect(x, yPos, w, h).stroke();
        doc
          .font(opts.header ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(opts.header ? 9 : 8)
          .fillColor(opts.color || '#0f172a')
          .text(text, x + 3, yPos + (h / 2 - 6), {
            width: w - 6,
            align: 'center',
          });
      };
      const renderHeader = () => {
        let x = tableStartX;
        drawCell(x, y, timeColWidth, rowHeight, 'Time', {
          header: true,
          fill: '#e0f2fe',
        });
        x += timeColWidth;
        days.forEach(d => {
          drawCell(
            x,
            y,
            dayColWidth,
            rowHeight,
            d.charAt(0).toUpperCase() + d.slice(1),
            { header: true, fill: '#e0f2fe' },
          );
          x += dayColWidth;
        });
        y += rowHeight;
      };
      renderHeader();
      const formatPeriod = (p: string) => {
        const [s, e] = p.split('-');
        return `${s} - ${e}`;
      };
      for (const period of times) {
        if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          y = doc.y;
          renderHeader();
        }
        let x = tableStartX;
        drawCell(x, y, timeColWidth, rowHeight, formatPeriod(period), {
          fill: '#f1f5f9',
        });
        x += timeColWidth;
        for (const d of days) {
          const slot = schedule.scheduleSlots.find(
            s =>
              `${s.timeslot.startTime}-${s.timeslot.endTime}` === period &&
              s.day.toLowerCase() === d,
          );
          let txt = '';
          let fill: string | undefined;
          if (slot) {
            const subj = slot.subject?.code || slot.subject?.name || '';
            const teacherLast = slot.teacher?.user?.fullName
              ? slot.teacher.user.fullName.split(' ').slice(-1)[0]
              : '';
            txt = teacherLast ? `${subj}\n${teacherLast}` : subj;
            const t = slot.type?.toLowerCase();
            if (t === 'break') fill = '#fff7ed';
            else if (t === 'lunch') fill = '#ffe4e6';
            else fill = '#ffffff';
          } else fill = '#ffffff';
          drawCell(x, y, dayColWidth, rowHeight, txt, { fill });
          x += dayColWidth;
        }
        y += rowHeight;
      }
      doc.end();
      return await new Promise<Buffer>(res => {
        doc.on('end', () => res(Buffer.concat(chunks)));
      });
    })();
    return {
      filename: `${fileBase}.pdf`,
      mime: 'application/pdf',
      buffer: pdfBuffer,
    };
  }
}
