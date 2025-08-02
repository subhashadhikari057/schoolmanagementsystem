-- =============================================================================
-- Rollback Script for Add Audit Fields Migration
-- =============================================================================
-- This script reverses the audit fields addition
-- Created: 2025-01-31
-- Migration: 20250726083556_add_audit_fields
-- =============================================================================

-- Drop indexes for AuditLog table
DROP INDEX IF EXISTS "AuditLog_userId_idx";
DROP INDEX IF EXISTS "AuditLog_action_idx";
DROP INDEX IF EXISTS "AuditLog_module_idx";
DROP INDEX IF EXISTS "AuditLog_timestamp_idx";

-- Drop foreign key constraint
ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_userId_fkey";

-- Drop the AuditLog table
DROP TABLE IF EXISTS "AuditLog";

-- Remove audit log relations from User table if they were added
-- Note: This might not be necessary depending on the original migration
-- The relation is typically only in the Prisma schema, not the database

-- Log rollback completion
INSERT INTO "_rollback_log" (migration_name, rolled_back_at, notes)
VALUES ('20250726083556_add_audit_fields', NOW(), 'Rolled back audit fields addition')
ON CONFLICT DO NOTHING;

-- Note: The _rollback_log table might not exist, so this insert might fail
-- This is expected and can be ignored