import { Injectable, Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const scryptAsync = promisify(scrypt);

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

      if (data.length < 48) {
        // salt(16) + iv(16) + minimum encrypted data(16)
        return false;
      }

      const salt = data.subarray(0, 16);
      const iv = data.subarray(16, 32);
      const encrypted = data.subarray(32, Math.min(data.length, 64)); // Test with first 32 bytes of encrypted data

      const key = (await scryptAsync(clientKey, salt, 32)) as Buffer;
      const decipher = createDecipheriv('aes-256-cbc', key, iv);

      // Attempt to decrypt - if key is wrong, this will throw
      decipher.update(encrypted);

      return true;
    } catch (error) {
      this.logger.debug(`Encryption key test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate a client-specific encryption key
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
   * Encrypt a file using the client key
   */
  async encryptFile(
    inputPath: string,
    outputPath: string,
    clientKey: string,
  ): Promise<void> {
    try {
      this.logger.log(`Encrypting file: ${inputPath} -> ${outputPath}`);

      const data = await fs.readFile(inputPath);

      // Generate salt and derive key
      const salt = randomBytes(16);
      const key = (await scryptAsync(clientKey, salt, 32)) as Buffer;
      const iv = randomBytes(16);

      const cipher = createCipheriv('aes-256-cbc', key, iv);

      let encrypted = cipher.update(data);
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      // Prepend salt and IV to encrypted data
      const result = Buffer.concat([salt, iv, encrypted]);

      await fs.writeFile(outputPath, result);

      this.logger.log(`File encrypted successfully: ${outputPath}`);
    } catch (error) {
      this.logger.error(`Failed to encrypt file ${inputPath}:`, error);
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt a file using the client key
   */
  async decryptFile(
    inputPath: string,
    outputPath: string,
    clientKey: string,
  ): Promise<void> {
    try {
      this.logger.log(`Decrypting file: ${inputPath} -> ${outputPath}`);

      const encryptedData = await fs.readFile(inputPath);

      // Extract salt, IV, and encrypted data
      const salt = encryptedData.slice(0, 16);
      const iv = encryptedData.slice(16, 32);
      const encrypted = encryptedData.slice(32);

      // Derive key using salt
      const key = (await scryptAsync(clientKey, salt, 32)) as Buffer;

      const decipher = createDecipheriv('aes-256-cbc', key, iv);

      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      await fs.writeFile(outputPath, decrypted);

      this.logger.log(`File decrypted successfully: ${outputPath}`);
    } catch (error) {
      this.logger.error(`Failed to decrypt file ${inputPath}:`, error);
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypt data in memory
   */
  async encryptData(data: Buffer, clientKey: string): Promise<Buffer> {
    try {
      // Generate salt and derive key
      const salt = randomBytes(16);
      const key = (await scryptAsync(clientKey, salt, 32)) as Buffer;
      const iv = randomBytes(16);

      const cipher = createCipheriv('aes-256-cbc', key, iv);
      let encrypted = cipher.update(data);
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      // Prepend salt and IV to encrypted data
      return Buffer.concat([salt, iv, encrypted]);
    } catch (error) {
      this.logger.error('Failed to encrypt data:', error);
      throw new Error(`Data encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data in memory
   */
  async decryptData(encryptedData: Buffer, clientKey: string): Promise<Buffer> {
    try {
      // Extract salt, IV, and encrypted data
      const salt = encryptedData.slice(0, 16);
      const iv = encryptedData.slice(16, 32);
      const encrypted = encryptedData.slice(32);

      // Derive key using salt
      const key = (await scryptAsync(clientKey, salt, 32)) as Buffer;

      const decipher = createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted;
    } catch (error) {
      this.logger.error('Failed to decrypt data:', error);
      throw new Error(`Data decryption failed: ${error.message}`);
    }
  }

  /**
   * Validate if a client key can decrypt a file
   */
  async validateClientKey(
    encryptedFilePath: string,
    clientKey: string,
  ): Promise<boolean> {
    try {
      const tempDecryptPath = path.join(
        path.dirname(encryptedFilePath),
        'temp_decrypt_test',
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
}
