// src/lib/crypto.js
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const ITERATIONS = 100000;
const DIGEST = 'sha256';

// 主密钥（64位十六进制 -> 32字节）
const MASTER_KEY_HEX = process.env.ENCRYPTION_KEY;
if (!MASTER_KEY_HEX || Buffer.from(MASTER_KEY_HEX, 'hex').length !== 32) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
}
const MASTER_KEY = Buffer.from(MASTER_KEY_HEX, 'hex');

/**
 * 使用 HKDF 派生子密钥
 * @param {Buffer} masterKey - 主密钥
 * @param {string} context - 上下文标识符（如 'p12-data', 'p12-password'）
 * @param {number} length - 派生密钥长度（默认 32）
 * @returns {Buffer}
 */
function deriveKey(masterKey, context, length = 32) {
    // 使用 HKDF-SHA256
    const salt = Buffer.alloc(0);
    const info = Buffer.from(context, 'utf-8');
    return crypto.hkdfSync('sha256', masterKey, salt, info, length);
}

/**
 * 加密数据
 * @param {Buffer|string} plaintext - 明文
 * @param {Buffer} key - 加密密钥（32字节）
 * @returns {{ encrypted: Buffer, iv: Buffer, tag: Buffer }}
 */
function encryptWithKey(plaintext, key) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const plaintextBuf = typeof plaintext === 'string' ? Buffer.from(plaintext, 'utf-8') : plaintext;
    let encrypted = cipher.update(plaintextBuf);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const tag = cipher.getAuthTag();
    return { encrypted, iv, tag };
}

/**
 * 解密数据
 * @param {Buffer} encrypted - 密文
 * @param {Buffer} iv - 初始化向量
 * @param {Buffer} tag - 认证标签
 * @param {Buffer} key - 解密密钥
 * @returns {Buffer}
 */
function decryptWithKey(encrypted, iv, tag, key) {
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted;
}

/**
 * 加密 p12 数据（使用派生密钥 'p12-data'）
 */
export function encryptP12Data(plaintext) {
    const key = deriveKey(MASTER_KEY, 'p12-data');
    return encryptWithKey(plaintext, key);
}

/**
 * 解密 p12 数据
 */
export function decryptP12Data(encrypted, iv, tag) {
    const key = deriveKey(MASTER_KEY, 'p12-data');
    return decryptWithKey(encrypted, iv, tag, key);
}

/**
 * 加密密码（使用派生密钥 'p12-password'）
 */
export function encryptP12Password(plaintext) {
    const key = deriveKey(MASTER_KEY, 'p12-password');
    return encryptWithKey(plaintext, key);
}

/**
 * 解密密码
 */
export function decryptP12Password(encrypted, iv, tag) {
    const key = deriveKey(MASTER_KEY, 'p12-password');
    return decryptWithKey(encrypted, iv, tag, key);
}

/**
 * 获取过期时间（默认2年）
 */
export function getExpiryDate(years = 2) {
    const d = new Date();
    d.setFullYear(d.getFullYear() + years);
    return d;
}