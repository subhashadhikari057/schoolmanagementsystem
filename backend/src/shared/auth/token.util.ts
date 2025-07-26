import * as argon2 from 'argon2';

/**
 * Hash a JWT string before storing in DB
 */
export async function hashToken(token: string): Promise<string> {
  return await argon2.hash(token, { type: argon2.argon2id });
}

/**
 * Compare raw JWT with stored hash
 */
export async function verifyTokenHash(
  token: string,
  hash: string
): Promise<boolean> {
  return await argon2.verify(hash, token);
}
