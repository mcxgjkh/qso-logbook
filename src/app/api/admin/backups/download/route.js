// src/app/api/admin/backups/download/route.js
import { authenticate } from '@/lib/api-helpers';
import { head, download } from '@vercel/blob';
import { decryptBackup } from '@/lib/backup-crypto';

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
    
    // 从 Blob 下载加密内容
    const response = await download(pathname);
    const encryptedBuffer = await response.arrayBuffer();
    const encryptedData = Buffer.from(encryptedBuffer);
    
    // 解密
    let decrypted;
    try {
      decrypted = decryptBackup(encryptedData);
    } catch (err) {
      console.error('Decryption failed:', err);
      return Response.json({ success: false, error: 'Decryption failed' }, { status: 500 });
    }
    
    // 返回解密后的 SQL 文件（作为下载）
    const filename = pathname.replace('backups/', '').replace('.enc', '');
    return new Response(decrypted, {
      status: 200,
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}