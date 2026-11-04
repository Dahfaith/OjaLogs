import crypto from 'crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Encrypt sensitive plaintext (software license key, password, credential)
 * using server-side AES-256-GCM master key.
 */
export function encryptPayload(plaintext: string): string {
  const key = Buffer.from(env.SERVER_ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt AES-256-GCM ciphertext back to plaintext.
 */
export function decryptPayload(ciphertextWithIvAndTag: string): string {
  const parts = ciphertextWithIvAndTag.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = Buffer.from(env.SERVER_ENCRYPTION_KEY, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Generate a SHA-256 hash fingerprint to prevent duplicate inventory
 * without revealing the plaintext.
 */
export function hashFingerprint(plaintext: string): string {
  return crypto.createHash('sha256').update(plaintext.trim()).digest('hex');
}

