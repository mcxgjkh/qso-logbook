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
    
    // 不显式传递token，依赖环境变量自动加载
    const blob = await head(pathname);
    if (!blob) {
      return Response.json({ success: false, error: 'File not found' }, { status: 404 });
    }
    
    const response = await download(pathname);
    const encryptedBuffer = await response.arrayBuffer();
    const encryptedData = Buffer.from(encryptedBuffer);
    
    const decrypted = decryptBackup(encryptedData);
    const filename = pathname.replace('backups/', '').replace('.enc', '');
    
    return new Response(decrypted, {
      status: 200,
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Download backup error:', error);
    return Response.json({ 
      success: false, 
      error: error.message || 'Failed to download backup' 
    }, { status: 500 });
  }
}