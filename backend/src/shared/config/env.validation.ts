import { z } from 'zod';
import * as dotenvSafe from 'dotenv-safe';
import * as path from 'path';

// Define the environment schema using Zod
const envSchema = z.object({
  // Database Configuration
  DATABASE_URL: z
    .string()
    .url()
    .describe('PostgreSQL database connection string'),

  // JWT Configuration
  JWT_PRIVATE_KEY_BASE64: z
    .string()
    .min(1)
    .describe('Base64 encoded RSA private key for JWT signing'),

  JWT_PUBLIC_KEY_BASE64: z
    .string()
    .min(1)
    .describe('Base64 encoded RSA public key for JWT verification'),

  JWT_ACCESS_EXPIRES_IN: z
    .string()
    .default('15m')
    .describe('Access token expiration time (e.g., 15m, 1h)'),

  JWT_REFRESH_EXPIRES_IN: z
    .string()
    .default('7d')
    .describe('Refresh token expiration time (e.g., 7d, 30d)'),

  // Cookie Configuration
  COOKIE_DOMAIN: z
    .string()
    .optional()
    .describe('Domain for authentication cookies'),

  COOKIE_SAME_SITE: z
    .enum(['lax', 'strict', 'none'])
    .default('lax')
    .describe('SameSite policy for cookies'),

  ACCESS_TOKEN_EXPIRES_IN: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default('900000')
    .describe('Access token cookie expiration in milliseconds'),

  REFRESH_TOKEN_EXPIRES_IN: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default('604800000')
    .describe('Refresh token cookie expiration in milliseconds'),

  // Server Configuration
  PORT: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default('8080')
    .describe('Port for the server to listen on'),

  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development')
    .describe('Node.js environment'),

  // Optional Future Configurations (commented out for now)
  // EMAIL Configuration
  SMTP_HOST: z.string().optional().describe('SMTP server hostname'),
  SMTP_PORT: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .optional()
    .describe('SMTP server port'),
  SMTP_USER: z.string().optional().describe('SMTP username'),
  SMTP_PASS: z.string().optional().describe('SMTP password'),
  SMTP_FROM: z.string().optional().describe('Default from email address'),

  // File Upload Configuration
  MAX_FILE_SIZE: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .optional()
    .describe('Maximum file upload size in bytes'),
  ALLOWED_FILE_TYPES: z.string().optional().describe('Allowed file extensions'),
  UPLOAD_PATH: z.string().optional().describe('File upload directory path'),

  // Logging Configuration
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'debug'])
    .optional()
    .describe('Application log level'),
  LOG_FILE: z.string().optional().describe('Log file path'),

  // Security Configuration
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .optional()
    .describe('Rate limit window in milliseconds'),
  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .optional()
    .describe('Maximum requests per window'),
  CORS_ORIGINS: z.string().optional().describe('Allowed CORS origins'),

  // Monitoring Configuration
  SENTRY_DSN: z.string().optional().describe('Sentry DSN for error tracking'),
  NEW_RELIC_LICENSE_KEY: z
    .string()
    .optional()
    .describe('New Relic license key'),

  // Testing Configuration
  TEST_DATABASE_URL: z
    .string()
    .url()
    .optional()
    .describe('Test database connection string'),
});

// Export the validated environment type
export type EnvConfig = z.infer<typeof envSchema>;

// Validation function
export function validateEnvironment(): EnvConfig {
  try {
    // Load environment variables using dotenv-safe
    // This will check that all required variables are present
    dotenvSafe.config({
      path: path.resolve(process.cwd(), '.env'),
      example: path.resolve(process.cwd(), '.env.example'),
      allowEmptyValues: true,
    });

    // Validate the environment variables using Zod schema
    const validatedEnv = envSchema.parse(process.env);

    // Additional custom validations
    validateJWTConfiguration(validatedEnv);
    validateCookieConfiguration(validatedEnv);
    validateDatabaseConfiguration(validatedEnv);

    console.log('✅ Environment variables validated successfully');
    return validatedEnv;
  } catch (error) {
    console.error('❌ Environment validation failed:');

    if (error instanceof z.ZodError) {
      // Handle Zod validation errors
      console.error('Environment variable validation errors:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    } else if (error instanceof Error) {
      // Handle dotenv-safe errors
      console.error(`  - ${error.message}`);
    } else {
      console.error('  - Unknown validation error');
    }

    console.error(
      '\n💡 Please check your .env file and ensure all required variables are set.',
    );
    console.error(
      '   Refer to .env.example for the complete list of required variables.',
    );

    process.exit(1);
  }
}

// Custom validation functions
function validateJWTConfiguration(env: EnvConfig): void {
  // Validate that JWT keys are properly base64 encoded
  try {
    Buffer.from(env.JWT_PRIVATE_KEY_BASE64, 'base64');
    Buffer.from(env.JWT_PUBLIC_KEY_BASE64, 'base64');
  } catch {
    throw new Error(
      'JWT keys must be valid base64 encoded strings. Please generate proper RSA keys.',
    );
  }

  // Validate expiration times
  const accessTime = parseTimeString(env.JWT_ACCESS_EXPIRES_IN);
  const refreshTime = parseTimeString(env.JWT_REFRESH_EXPIRES_IN);

  if (accessTime >= refreshTime) {
    throw new Error(
      'JWT access token expiration must be shorter than refresh token expiration',
    );
  }
}

function validateCookieConfiguration(env: EnvConfig): void {
  // Validate that cookie expiration times match JWT expiration times
  const accessTokenMs = parseTimeString(env.JWT_ACCESS_EXPIRES_IN);
  const refreshTokenMs = parseTimeString(env.JWT_REFRESH_EXPIRES_IN);

  if (Math.abs(env.ACCESS_TOKEN_EXPIRES_IN - accessTokenMs) > 60000) {
    console.warn(
      '⚠️  Warning: ACCESS_TOKEN_EXPIRES_IN does not match JWT_ACCESS_EXPIRES_IN',
    );
  }

  if (Math.abs(env.REFRESH_TOKEN_EXPIRES_IN - refreshTokenMs) > 60000) {
    console.warn(
      '⚠️  Warning: REFRESH_TOKEN_EXPIRES_IN does not match JWT_REFRESH_EXPIRES_IN',
    );
  }
}

function validateDatabaseConfiguration(env: EnvConfig): void {
  // Validate database URL format
  try {
    const url = new URL(env.DATABASE_URL);
    if (url.protocol !== 'postgresql:') {
      throw new Error('Database URL must use postgresql:// protocol');
    }
  } catch (err) {
    throw new Error(
      `Invalid DATABASE_URL format: ${err instanceof Error ? err.message : 'Unknown error'}`,
    );
  }
}

// Utility function to parse time strings to milliseconds
function parseTimeString(timeStr: string): number {
  const match = timeStr.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid time format: ${timeStr}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unsupported time unit: ${unit}`);
  }
}

// Global environment configuration instance
let envConfig: EnvConfig | null = null;

// Get validated environment configuration
export function getEnvConfig(): EnvConfig {
  if (!envConfig) {
    envConfig = validateEnvironment();
  }
  return envConfig;
}

// Export individual environment getters for convenience
export const env = {
  get DATABASE_URL() {
    return getEnvConfig().DATABASE_URL;
  },
  get JWT_PRIVATE_KEY_BASE64() {
    return getEnvConfig().JWT_PRIVATE_KEY_BASE64;
  },
  get JWT_PUBLIC_KEY_BASE64() {
    return getEnvConfig().JWT_PUBLIC_KEY_BASE64;
  },
  get JWT_ACCESS_EXPIRES_IN() {
    return getEnvConfig().JWT_ACCESS_EXPIRES_IN;
  },
  get JWT_REFRESH_EXPIRES_IN() {
    return getEnvConfig().JWT_REFRESH_EXPIRES_IN;
  },
  get PORT() {
    return getEnvConfig().PORT;
  },
  get NODE_ENV() {
    return getEnvConfig().NODE_ENV;
  },
  get COOKIE_DOMAIN() {
    return getEnvConfig().COOKIE_DOMAIN;
  },
  get COOKIE_SAME_SITE() {
    return getEnvConfig().COOKIE_SAME_SITE;
  },
  get ACCESS_TOKEN_EXPIRES_IN() {
    return getEnvConfig().ACCESS_TOKEN_EXPIRES_IN;
  },
  get REFRESH_TOKEN_EXPIRES_IN() {
    return getEnvConfig().REFRESH_TOKEN_EXPIRES_IN;
  },
};
