import { z } from 'zod';

export const feeItemFrequencyEnum = z.enum(['MONTHLY','TERM','ANNUAL','ONE_TIME']);
export const valueTypeEnum = z.enum(['PERCENTAGE','FIXED']);
export const chargeTypeEnum = z.enum(['FINE','EQUIPMENT','TRANSPORT','OTHER']);
export const feeStructureStatusEnum = z.enum(['DRAFT','ACTIVE','ARCHIVED']);
export const scholarshipTypeEnum = z.enum(['MERIT','NEED_BASED','SPORTS','OTHER']);

export const feeStructureItemInputSchema = z.object({
  label: z.string().min(1),
  amount: z.number().positive(),
  category: z.string().min(1).optional().default('General'),
  frequency: feeItemFrequencyEnum.optional().default('MONTHLY'),
  isOptional: z.boolean().optional().default(false),
});

// Relaxed multi-class acceptance: some environments use non-uuid IDs; trim & filter empties
const stringId = z.string().min(1).transform(s => s.trim());
export const createFeeStructureSchema = z.object({
  classId: stringId.optional(),
  classIds: z.array(stringId).min(1).optional().transform(arr => arr ? Array.from(new Set(arr.filter(v => v.length > 0))) : arr),
  academicYear: z.string().min(4),
  name: z.string().min(1),
  effectiveFrom: z.string().datetime(),
  items: z.array(feeStructureItemInputSchema).min(1),
}).refine(d => d.classId || (d.classIds && d.classIds.length > 0), { message: 'classId or classIds required' });

export const reviseFeeStructureSchema = z.object({
  feeStructureId: z.string().uuid(),
  effectiveFrom: z.string().datetime(),
  changeReason: z.string().optional(),
  items: z.array(feeStructureItemInputSchema).min(1),
});

export const computeMonthlyFeesSchema = z.object({
  classId: z.string().uuid(),
  month: z.string().regex(/^[0-9]{4}-[0-9]{2}$/,'YYYY-MM required'),
  includeExisting: z.boolean().default(false),
});

export const createScholarshipDefinitionSchema = z.object({
  name: z.string().min(1),
  type: scholarshipTypeEnum.default('OTHER'),
  description: z.string().optional(),
  valueType: valueTypeEnum.default('PERCENTAGE'),
  value: z.number().positive(),
});

export const assignScholarshipSchema = z.object({
  scholarshipId: z.string().uuid(),
  studentIds: z.array(z.string().uuid()).min(1),
  effectiveFrom: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
});

export const createChargeDefinitionSchema = z.object({
  name: z.string().min(1),
  type: chargeTypeEnum.default('FINE'),
  category: z.string().optional(),
  description: z.string().optional(),
  valueType: valueTypeEnum.default('FIXED'),
  value: z.number().positive(),
  isRecurring: z.boolean().default(false),
});

export const applyChargeSchema = z.object({
  chargeId: z.string().uuid(),
  studentIds: z.array(z.string().uuid()).min(1),
  appliedMonth: z.string().regex(/^[0-9]{4}-[0-9]{2}$/,'YYYY-MM required'),
  reason: z.string().optional(),
});

export type CreateFeeStructureDto = z.infer<typeof createFeeStructureSchema>;
export type ReviseFeeStructureDto = z.infer<typeof reviseFeeStructureSchema>;
export type ComputeMonthlyFeesDto = z.infer<typeof computeMonthlyFeesSchema>;
export type CreateScholarshipDefinitionDto = z.infer<typeof createScholarshipDefinitionSchema>;
export type AssignScholarshipDto = z.infer<typeof assignScholarshipSchema>;
export type CreateChargeDefinitionDto = z.infer<typeof createChargeDefinitionSchema>;
export type ApplyChargeDto = z.infer<typeof applyChargeSchema>;
export interface FeeDto {
  id: string;
  name: string;
  amount: number;
  academic_year: string;
}
