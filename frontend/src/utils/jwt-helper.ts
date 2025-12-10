/**
 * =============================================================================
 * JWT Helper Utilities
 * =============================================================================
 * Utilities for working with JWT tokens
 * =============================================================================
 */

interface JwtPayload {
  exp?: number;
  [key: string]: unknown;
}

/**
 * Parse a JWT token and return its payload
 * @param token JWT token string
 * @returns Decoded payload or null if invalid
 */
export function parseJwt(token: string): JwtPayload | null {
  try {
    // Split the token and get the payload part (second segment)
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    // Replace non-base64 URL chars and decode
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return null;
  }
}

/**
 * Check if a JWT token is expired
 * @param token JWT token string
 * @param bufferSeconds Optional buffer time in seconds (default: 60)
 * @returns True if token is expired or will expire within buffer time
 */
export function isTokenExpired(token: string, bufferSeconds = 60): boolean {
  try {
    const payload = parseJwt(token);
    if (!payload || typeof payload.exp !== 'number') return true;

    // Get expiration time and current time in seconds
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const bufferTime = bufferSeconds * 1000; // Convert to milliseconds

    // Check if token is expired or will expire within buffer time
    return currentTime + bufferTime >= expirationTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // Assume expired on error
  }
}

/**
 * Get time remaining before token expiration
 * @param token JWT token string
 * @returns Time remaining in seconds, or 0 if expired/invalid
 */
export function getTokenTimeRemaining(token: string): number {
  try {
    const payload = parseJwt(token);
    if (!payload || typeof payload.exp !== 'number') return 0;

    // Get expiration time and current time in seconds
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeRemaining = expirationTime - currentTime;

    return timeRemaining > 0 ? Math.floor(timeRemaining / 1000) : 0;
  } catch (error) {
    console.error('Error getting token time remaining:', error);
    return 0; // Return 0 on error
  }
}
