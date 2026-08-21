// scripts/upload-backup.js
import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { encryptBackup } from '../src/lib/backup-crypto.js';
import { logError } from '@/lib/logger';

const token = process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
if (!token) {
  logError('VERCEL_BLOB_READ_WRITE_TOKEN is not set');
  process.exit(1);
}

// 检查加密密钥
if (!process.env.BACKUP_ENCRYPTION_KEY) {
  logError('BACKUP_ENCRYPTION_KEY is not set');
  process.exit(1);
}

async function upload() {
  const files = await glob('backup-*.sql');
  if (files.length === 0) {
    logError('No backup files found');
    return;
  }

  for (const file of files) {
    logInfo(`Processing ${file}...`);
    const content = fs.readFileSync(file);
    // 加密备份
    const encrypted = encryptBackup(content);
    
    const filename = path.basename(file);
    // 存储为 .enc 后缀，方便识别
    const result = await put(`backups/${filename}.enc`, encrypted, {
      access: 'private',
      addRandomSuffix: false,
    });
    logInfo(`Uploaded ${filename}.enc -> ${result.url}`);
    
    // 上传成功后删除原始文件（可选）
    // fs.unlinkSync(file);
  }
}

upload().catch((err) => logError('Error occurred while uploading backups:', err));