// src/app/api/admin/backups/download/route.js
import { authenticate } from '@/lib/api-helpers';
import { head, getDownloadUrl } from '@vercel/blob';
import { decryptBackup } from '@/lib/backup-crypto';
import { logError } from '@/lib/logger';

export async function GET(request) {
  try {
    const { user } = await authenticate(request, ['admin']);
    const { searchParams } = new URL(request.url);
    const pathname = searchParams.get('path');
    
    if (!pathname) {
      return Response.json({ success: false, error: 'Missing path' }, { status: 400 });
    }
    
    // 验证文件是否存在
    const blob = await head(pathname);
    if (!blob) {
      return Response.json({ success: false, error: 'File not found' }, { status: 404 });
    }
    
    // 获取临时下载 URL（默认有效期 1 小时）
    const downloadUrl = await getDownloadUrl(pathname);
    
    // 从临时 URL 获取加密内容
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error('Failed to download encrypted blob');
    }
    const encryptedBuffer = await response.arrayBuffer();
    const encryptedData = Buffer.from(encryptedBuffer);
    
    // 解密
    const decrypted = decryptBackup(encryptedData);
    const filename = pathname.replace('backups/', '').replace('.enc', '');
    
    // 返回解密后的 SQL 文件
    return new Response(decrypted, {
      status: 200,
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logError('Download backup error:', error);
    return Response.json({ 
      success: false, 
      error: error.message || 'Failed to download backup' 
    }, { status: 500 });
  }
}