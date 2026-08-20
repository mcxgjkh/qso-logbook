// src/app/api/admin/backups/route.js
import { authenticate } from '@/lib/api-helpers';
import { list } from '@vercel/blob';

export async function GET(request) {
  try {
    const { user } = await authenticate(request, ['admin']);
    const blobs = await list({ prefix: 'backups/' });
    
    // 只返回文件名、大小、上传时间
    const files = blobs.blobs.map(blob => ({
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
    }));
    
    return Response.json({ success: true, data: files });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}