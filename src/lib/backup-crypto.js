// src/lib/backup-crypto.js
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

// 从环境变量获取密钥（必须是 64 位十六进制字符串）
const ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY;
if (!ENCRYPTION_KEY || Buffer.from(ENCRYPTION_KEY, 'hex').length !== 32) {
  throw new Error('BACKUP_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
}
const KEY = Buffer.from(ENCRYPTION_KEY, 'hex');

/**
 * 加密数据（返回包含 iv 和 tag 的 Buffer，格式：iv + tag + ciphertext）
 */
export function encryptBackup(plaintext) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const plaintextBuf = typeof plaintext === 'string' ? Buffer.from(plaintext, 'utf-8') : plaintext;
  let encrypted = cipher.update(plaintextBuf);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const tag = cipher.getAuthTag();
  // 格式：iv (12字节) + tag (16字节) + ciphertext
  return Buffer.concat([iv, tag, encrypted]);
}

/**
 * 解密数据
 */
export function decryptBackup(encryptedBuffer) {
  // 提取 iv, tag, ciphertext
  const iv = encryptedBuffer.subarray(0, IV_LENGTH);
  const tag = encryptedBuffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = encryptedBuffer.subarray(IV_LENGTH + TAG_LENGTH);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted;
}