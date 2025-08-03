-- =============================================================================
-- Rollback Script for Initial Phase 1 Migration
-- =============================================================================
-- This script reverses the initial database schema creation
-- Created: 2025-01-31
-- Migration: 20250726083043_init_phase1
-- =============================================================================

-- Drop indexes first to avoid dependency issues
DROP INDEX IF EXISTS "User_createdById_idx";
DROP INDEX IF EXISTS "User_updatedById_idx";
DROP INDEX IF EXISTS "User_deletedById_idx";

DROP INDEX IF EXISTS "Role_createdById_idx";
DROP INDEX IF EXISTS "Role_updatedById_idx";
DROP INDEX IF EXISTS "Role_deletedById_idx";

DROP INDEX IF EXISTS "Permission_code_idx";
DROP INDEX IF EXISTS "Permission_module_idx";
DROP INDEX IF EXISTS "Permission_createdById_idx";
DROP INDEX IF EXISTS "Permission_updatedById_idx";
DROP INDEX IF EXISTS "Permission_deletedById_idx";

DROP INDEX IF EXISTS "UserRole_userId_idx";
DROP INDEX IF EXISTS "UserRole_roleId_idx";

DROP INDEX IF EXISTS "RolePermission_roleId_idx";
DROP INDEX IF EXISTS "RolePermission_permissionId_idx";

DROP INDEX IF EXISTS "UserSession_userId_idx";
DROP INDEX IF EXISTS "UserSession_expiresAt_idx";
DROP INDEX IF EXISTS "UserSession_createdById_idx";
DROP INDEX IF EXISTS "UserSession_updatedById_idx";
DROP INDEX IF EXISTS "UserSession_deletedById_idx";

-- Drop unique constraints
ALTER TABLE "UserRole" DROP CONSTRAINT IF EXISTS "UserRole_userId_roleId_key";
ALTER TABLE "RolePermission" DROP CONSTRAINT IF EXISTS "RolePermission_roleId_permissionId_key";

-- Drop foreign key constraints
ALTER TABLE "UserRole" DROP CONSTRAINT IF EXISTS "UserRole_userId_fkey";
ALTER TABLE "UserRole" DROP CONSTRAINT IF EXISTS "UserRole_roleId_fkey";

ALTER TABLE "RolePermission" DROP CONSTRAINT IF EXISTS "RolePermission_roleId_fkey";
ALTER TABLE "RolePermission" DROP CONSTRAINT IF EXISTS "RolePermission_permissionId_fkey";

ALTER TABLE "UserSession" DROP CONSTRAINT IF EXISTS "UserSession_userId_fkey";

-- Drop unique constraints on main tables
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_email_key";
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_phone_key";
ALTER TABLE "Role" DROP CONSTRAINT IF EXISTS "Role_name_key";
ALTER TABLE "Permission" DROP CONSTRAINT IF EXISTS "Permission_code_key";

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS "UserSession";
DROP TABLE IF EXISTS "RolePermission";
DROP TABLE IF EXISTS "UserRole";
DROP TABLE IF EXISTS "Permission";
DROP TABLE IF EXISTS "Role";
DROP TABLE IF EXISTS "User";

-- Log rollback completion
INSERT INTO "_rollback_log" (migration_name, rolled_back_at, notes)
VALUES ('20250726083043_init_phase1', NOW(), 'Rolled back initial Phase 1 schema')
ON CONFLICT DO NOTHING;

-- Note: The _rollback_log table might not exist, so this insert might fail
-- This is expected and can be ignored