/**
 * =============================================================================
 * Encryption Service - AES-256-GCM
 * =============================================================================
 * Provides AES-256-GCM encryption/decryption with authentication
 * Uses scrypt for secure key derivation from client keys
 * =============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const scryptAsync = promisify(scrypt);

// Constants for AES-GCM
const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 16; // 128 bits
const NONCE_LENGTH = 12; // 96 bits (recommended for GCM)
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);

  /**
   * Validate encryption key format and strength
   */
  validateEncryptionKey(clientKey: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!clientKey) {
      errors.push('Encryption key is required');
      return { valid: false, errors };
    }

    if (typeof clientKey !== 'string') {
      errors.push('Encryption key must be a string');
      return { valid: false, errors };
    }

    if (clientKey.length < 32) {
      errors.push('Encryption key must be at least 32 characters long');
    }

    if (clientKey.length > 512) {
      errors.push('Encryption key must not exceed 512 characters');
    }

    // Check for common weak patterns
    if (/^(.)\1{31,}$/.test(clientKey)) {
      errors.push('Encryption key cannot be all the same character');
    }

    if (/^(123|abc|password|qwerty)/i.test(clientKey)) {
      errors.push('Encryption key appears to be weak or predictable');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Test encryption key by attempting to decrypt a small test payload
   * Uses AES-256-GCM format
   */
  async testEncryptionKey(
    clientKey: string,
    encryptedFilePath: string,
  ): Promise<boolean> {
    try {
      // Validate key format first
      const validation = this.validateEncryptionKey(clientKey);
      if (!validation.valid) {
        return false;
      }

      // Try to read and decrypt the first few bytes to test the key
      const data = await fs.readFile(encryptedFilePath);

      // Minimum size: salt(16) + nonce(12) + authTag(16) + encrypted data(16)
      const minSize = SALT_LENGTH + NONCE_LENGTH + AUTH_TAG_LENGTH + 16;
      if (data.length < minSize) {
        this.logger.debug('File too small to be valid encrypted backup');
        return false;
      }

      const salt = data.subarray(0, SALT_LENGTH);
      const nonce = data.subarray(SALT_LENGTH, SALT_LENGTH + NONCE_LENGTH);
      const authTag = data.subarray(
        SALT_LENGTH + NONCE_LENGTH,
        SALT_LENGTH + NONCE_LENGTH + AUTH_TAG_LENGTH,
      );
      const encrypted = data.subarray(
        SALT_LENGTH + NONCE_LENGTH + AUTH_TAG_LENGTH,
        Math.min(
          data.length,
          SALT_LENGTH + NONCE_LENGTH + AUTH_TAG_LENGTH + 64,
        ),
      );

      // Derive key using scrypt
      const key = (await scryptAsync(clientKey, salt, KEY_LENGTH)) as Buffer;
      const decipher = createDecipheriv(ALGORITHM, key, nonce);
      decipher.setAuthTag(authTag);

      // Attempt to decrypt - if key is wrong or data is tampered, this will throw
      decipher.update(encrypted);
      decipher.final(); // This will throw if authentication fails

      return true;
    } catch (error) {
      this.logger.debug(`Encryption key test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate a client-specific encryption key
   * Returns a 64-character hexadecimal string (256 bits)
   */
  async generateClientKey(clientId: string): Promise<string> {
    const timestamp = Date.now().toString();
    const randomData = randomBytes(32).toString('hex');
    const keyMaterial = `${clientId}-${timestamp}-${randomData}`;

    // Create a 256-bit key from the key material
    const { createHash } = await import('crypto');
    return createHash('sha256').update(keyMaterial).digest('hex');
  }

  /**
   * Encrypt a file using AES-256-GCM
   *
   * File format:
   * [salt(16)][nonce(12)][authTag(16)][encrypted data]
   *
   * @param inputPath - Path to plaintext file
   * @param outputPath - Path to save encrypted file
   * @param clientKey - Client encryption key
   */
  async encryptFile(
    inputPath: string,
    outputPath: string,
    clientKey: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `Encrypting file with AES-256-GCM: ${inputPath} -> ${outputPath}`,
      );

      // Read plaintext data
      const data = await fs.readFile(inputPath);

      // Generate salt and derive key using scrypt
      const salt = randomBytes(SALT_LENGTH);
      const key = (await scryptAsync(clientKey, salt, KEY_LENGTH)) as Buffer;

      // Generate random nonce (IV for GCM)
      const nonce = randomBytes(NONCE_LENGTH);

      // Create cipher
      const cipher = createCipheriv(ALGORITHM, key, nonce);

      // Encrypt data
      let encrypted = cipher.update(data);
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Combine: salt + nonce + authTag + encrypted data
      const result = Buffer.concat([salt, nonce, authTag, encrypted]);

      // Write to output file
      await fs.writeFile(outputPath, result);

      this.logger.log(
        `File encrypted successfully with AES-256-GCM: ${outputPath} ` +
          `(${result.length} bytes, authenticated)`,
      );
    } catch (error) {
      this.logger.error(`Failed to encrypt file ${inputPath}:`, error);
      throw new Error(`AES-GCM encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt a file using AES-256-GCM
   *
   * Verifies authentication tag automatically.
   * Throws error if data has been tampered with or key is incorrect.
   *
   * @param inputPath - Path to encrypted file
   * @param outputPath - Path to save decrypted file
   * @param clientKey - Client encryption key
   */
  async decryptFile(
    inputPath: string,
    outputPath: string,
    clientKey: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `Decrypting file with AES-256-GCM: ${inputPath} -> ${outputPath}`,
      );

      // Read encrypted data
      const encryptedData = await fs.readFile(inputPath);

      // Validate minimum size
      const minSize = SALT_LENGTH + NONCE_LENGTH + AUTH_TAG_LENGTH;
      if (encryptedData.length < minSize) {
        throw new Error(
          `Invalid encrypted file: too small (${encryptedData.length} bytes, minimum ${minSize} bytes)`,
        );
      }

      // Extract components
      const salt = encryptedData.subarray(0, SALT_LENGTH);
      const nonce = encryptedData.subarray(
        SALT_LENGTH,
        SALT_LENGTH + NONCE_LENGTH,
      );
      const authTag = encryptedData.subarray(
        SALT_LENGTH + NONCE_LENGTH,
        SALT_LENGTH + NONCE_LENGTH + AUTH_TAG_LENGTH,
      );
      const encrypted = encryptedData.subarray(
        SALT_LENGTH + NONCE_LENGTH + AUTH_TAG_LENGTH,
      );

      // Derive key using scrypt with the same salt
      const key = (await scryptAsync(clientKey, salt, KEY_LENGTH)) as Buffer;

      // Create decipher
      const decipher = createDecipheriv(ALGORITHM, key, nonce);

      // Set authentication tag for verification
      decipher.setAuthTag(authTag);

      // Decrypt and verify
      let decrypted: Buffer;
      try {
        decrypted = Buffer.concat([
          decipher.update(encrypted),
          decipher.final(), // This will throw if authentication fails
        ]);
      } catch (error) {
        throw new Error(
          'Decryption failed: Invalid key or data has been tampered with (authentication tag verification failed)',
        );
      }

      // Write decrypted data
      await fs.writeFile(outputPath, decrypted);

      this.logger.log(
        `File decrypted successfully with AES-256-GCM: ${outputPath} ` +
          `(${decrypted.length} bytes, integrity verified)`,
      );
    } catch (error) {
      this.logger.error(`Failed to decrypt file ${inputPath}:`, error);
      throw new Error(`AES-GCM decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypt data in memory using AES-256-GCM
   *
   * @param data - Plaintext buffer
   * @param clientKey - Client encryption key
   * @returns Buffer containing [salt][nonce][authTag][encrypted data]
   */
  async encryptData(data: Buffer, clientKey: string): Promise<Buffer> {
    try {
      // Generate salt and derive key
      const salt = randomBytes(SALT_LENGTH);
      const key = (await scryptAsync(clientKey, salt, KEY_LENGTH)) as Buffer;

      // Generate random nonce
      const nonce = randomBytes(NONCE_LENGTH);

      // Create cipher
      const cipher = createCipheriv(ALGORITHM, key, nonce);

      // Encrypt data
      let encrypted = cipher.update(data);
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Combine: salt + nonce + authTag + encrypted data
      return Buffer.concat([salt, nonce, authTag, encrypted]);
    } catch (error) {
      this.logger.error('Failed to encrypt data:', error);
      throw new Error(`Data encryption with AES-GCM failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data in memory using AES-256-GCM
   *
   * @param encryptedData - Buffer containing [salt][nonce][authTag][encrypted data]
   * @param clientKey - Client encryption key
   * @returns Decrypted plaintext buffer
   */
  async decryptData(encryptedData: Buffer, clientKey: string): Promise<Buffer> {
    try {
      // Validate minimum size
      const minSize = SALT_LENGTH + NONCE_LENGTH + AUTH_TAG_LENGTH;
      if (encryptedData.length < minSize) {
        throw new Error('Invalid encrypted data: too small');
      }

      // Extract components
      const salt = encryptedData.subarray(0, SALT_LENGTH);
      const nonce = encryptedData.subarray(
        SALT_LENGTH,
        SALT_LENGTH + NONCE_LENGTH,
      );
      const authTag = encryptedData.subarray(
        SALT_LENGTH + NONCE_LENGTH,
        SALT_LENGTH + NONCE_LENGTH + AUTH_TAG_LENGTH,
      );
      const encrypted = encryptedData.subarray(
        SALT_LENGTH + NONCE_LENGTH + AUTH_TAG_LENGTH,
      );

      // Derive key using scrypt
      const key = (await scryptAsync(clientKey, salt, KEY_LENGTH)) as Buffer;

      // Create decipher
      const decipher = createDecipheriv(ALGORITHM, key, nonce);
      decipher.setAuthTag(authTag);

      // Decrypt and verify
      try {
        const decrypted = Buffer.concat([
          decipher.update(encrypted),
          decipher.final(),
        ]);
        return decrypted;
      } catch (error) {
        throw new Error(
          'Decryption failed: Invalid key or data has been tampered with',
        );
      }
    } catch (error) {
      this.logger.error('Failed to decrypt data:', error);
      throw new Error(`Data decryption with AES-GCM failed: ${error.message}`);
    }
  }

  /**
   * Validate if a client key can decrypt a file
   * Also verifies data integrity via GCM authentication tag
   */
  async validateClientKey(
    encryptedFilePath: string,
    clientKey: string,
  ): Promise<boolean> {
    try {
      const tempDecryptPath = path.join(
        path.dirname(encryptedFilePath),
        `temp_decrypt_test_${Date.now()}`,
      );

      await this.decryptFile(encryptedFilePath, tempDecryptPath, clientKey);

      // Clean up temp file
      await fs.unlink(tempDecryptPath);

      return true;
    } catch (error) {
      this.logger.warn(`Client key validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get encryption algorithm info
   */
  getAlgorithmInfo(): {
    algorithm: string;
    keyLength: number;
    nonceLength: number;
    authTagLength: number;
    authenticated: boolean;
  } {
    return {
      algorithm: ALGORITHM,
      keyLength: KEY_LENGTH * 8, // bits
      nonceLength: NONCE_LENGTH * 8, // bits
      authTagLength: AUTH_TAG_LENGTH * 8, // bits
      authenticated: true,
    };
  }
}
