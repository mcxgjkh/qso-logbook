// src/app/api/test/auth/route.js
import { authenticate } from '@/lib/api-helpers';

export async function GET(request) {
  try {
    const { user, role } = await authenticate(request);
    return Response.json({ 
      success: true, 
      user_id: user.id, 
      role 
    });
  } catch (err) {
    // 如果 authenticate 抛出 Response，直接返回它
    if (err instanceof Response) return err;
    return Response.json({ 
      success: false, 
      error: err.message 
    }, { status: 401 });
  }
}