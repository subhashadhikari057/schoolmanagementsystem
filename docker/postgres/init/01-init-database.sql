-- =============================================================================
-- School Management System - PostgreSQL Database Initialization
-- =============================================================================
-- This script runs when the PostgreSQL container starts for the first time
-- It sets up the database with required extensions and initial configuration
-- =============================================================================

-- Create the main database (if not already created by POSTGRES_DB)
-- This is typically handled by the POSTGRES_DB environment variable
-- SELECT 'CREATE DATABASE school_management_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'school_management_db')\gexec

-- Connect to the school_management_db
\c school_management_db;

-- =============================================================================
-- EXTENSIONS
-- =============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable advanced text search
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Enable trigram similarity matching for search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enable query performance statistics
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Enable cryptographic functions (for password hashing if needed)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable administrative functions
CREATE EXTENSION IF NOT EXISTS "adminpack";

-- =============================================================================
-- CUSTOM FUNCTIONS
-- =============================================================================

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate short IDs (for public-facing IDs)
CREATE OR REPLACE FUNCTION generate_short_id(table_name TEXT, id_length INTEGER DEFAULT 8)
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
    random_char TEXT;
    exists_check INTEGER;
BEGIN
    LOOP
        result := '';
        FOR i IN 1..id_length LOOP
            random_char := substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
            result := result || random_char;
        END LOOP;
        
        -- Check if the generated ID already exists (dynamic SQL)
        EXECUTE format('SELECT COUNT(*) FROM %I WHERE short_id = $1', table_name) 
        INTO exists_check USING result;
        
        IF exists_check = 0 THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PERFORMANCE OPTIMIZATIONS
-- =============================================================================

-- Set default table storage parameters for better performance
ALTER DATABASE school_management_db SET default_table_access_method = 'heap';

-- Configure autovacuum for better performance with frequent updates
ALTER DATABASE school_management_db SET autovacuum_vacuum_scale_factor = 0.1;
ALTER DATABASE school_management_db SET autovacuum_analyze_scale_factor = 0.05;

-- =============================================================================
-- DEVELOPMENT UTILITIES
-- =============================================================================

-- Create a development schema for testing
CREATE SCHEMA IF NOT EXISTS dev_testing;

-- Grant permissions to the postgres user (development only)
GRANT ALL PRIVILEGES ON DATABASE school_management_db TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA dev_testing TO postgres;

-- =============================================================================
-- AUDIT CONFIGURATION
-- =============================================================================

-- Enable row security (will be used later for RLS)
-- This is prepared for future implementation
-- ALTER DATABASE school_management_db SET row_security = on;

-- =============================================================================
-- LOGGING CONFIGURATION
-- =============================================================================

-- Configure logging for development
ALTER DATABASE school_management_db SET log_statement = 'mod';
ALTER DATABASE school_management_db SET log_min_duration_statement = 1000;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'School Management System Database Initialized Successfully!';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Database: school_management_db';
    RAISE NOTICE 'Extensions: uuid-ossp, unaccent, pg_trgm, pg_stat_statements, pgcrypto';
    RAISE NOTICE 'Custom Functions: update_updated_at_column(), generate_short_id()';
    RAISE NOTICE 'Development Schema: dev_testing';
    RAISE NOTICE '=============================================================================';
END $$; 