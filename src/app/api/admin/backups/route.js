// src/app/api/admin/backups/route.js
import { authenticate } from '@/lib/api-helpers';
import { list } from '@vercel/blob';

export async function GET(request) {
  try {
    const { user } = await authenticate(request, ['admin']);
    
    // 不显式传递token，依赖环境变量自动加载
    // SDK会从环境变量 BLOB_READ_WRITE_TOKEN 或 VERCEL_BLOB_READ_WRITE_TOKEN 读取
    const blobs = await list({ prefix: 'backups/' });
    
    const files = blobs.blobs.map(blob => ({
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
    }));
    
    return Response.json({ success: true, data: files });
  } catch (error) {
    console.error('List backups error:', error);
    return Response.json({ 
      success: false, 
      error: error.message || 'Failed to list backups' 
    }, { status: 500 });
  }
}