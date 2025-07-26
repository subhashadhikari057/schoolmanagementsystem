// backend/src/shared/auth/hash.util.ts
import * as argon2 from 'argon2';

/**
 * Hash a plain text password using Argon2id.
 * @param plainPassword - The password to hash.
 * @returns The hashed password.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return await argon2.hash(plainPassword, {
    type: argon2.argon2id,
  });
}

/**
 * Verify a plain password against a hashed password.
 * @param plainPassword - Input from login form
 * @param hashedPassword - Stored hashed password
 * @returns True if passwords match
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return await argon2.verify(hashedPassword, plainPassword);
}
