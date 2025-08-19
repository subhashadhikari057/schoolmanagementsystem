/**
 * Audit Module Enum
 * Defines the modules/features of the system that can be audited
 */
export enum AuditModule {
  // Core Modules
  AUTH = 'AUTH',
  USER = 'USER',
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  PARENT = 'PARENT',
  STAFF = 'STAFF',
  
  // Academic Modules
  ACADEMIC = 'ACADEMIC',
  CLASS = 'CLASS',
  SECTION = 'SECTION',
  SUBJECT = 'SUBJECT',
  CURRICULUM = 'CURRICULUM',
  
  // Assessment Modules
  EXAM = 'EXAM',
  ASSIGNMENT = 'ASSIGNMENT',
  GRADE = 'GRADE',
  RESULT = 'RESULT',
  
  // Operational Modules
  ATTENDANCE = 'ATTENDANCE',
  TIMETABLE = 'TIMETABLE',
  SCHEDULE = 'SCHEDULE',
  CALENDAR = 'CALENDAR',
  
  // Financial Modules
  FINANCE = 'FINANCE',
  FEE = 'FEE',
  PAYMENT = 'PAYMENT',
  INVOICE = 'INVOICE',
  
  // Communication Modules
  MESSAGE = 'MESSAGE',
  NOTICE = 'NOTICE',
  COMPLAINT = 'COMPLAINT',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  
  // System Modules
  SYSTEM = 'SYSTEM',
  CONFIG = 'CONFIG',
  ROLE = 'ROLE',
  PERMISSION = 'PERMISSION',
  AUDIT = 'AUDIT',
  SECURITY = 'SECURITY',
  
  // File Management
  FILE = 'FILE',
  DOCUMENT = 'DOCUMENT',
  MEDIA = 'MEDIA',
  
  // Other
  REPORT = 'REPORT',
  DASHBOARD = 'DASHBOARD',
  API = 'API',
  
  // Error Handler
  ERROR_HANDLER = 'ERROR_HANDLER',
}