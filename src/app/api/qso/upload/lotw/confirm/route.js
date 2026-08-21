// src/app/api/qso/upload/lotw/confirm/route.js
import { createClient } from '@/lib/supabase/server';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import { logError } from '@/lib/logger';

export async function POST(request) {
  try {
    // 使用服务角色密钥验证（不依赖用户会话）
    const authHeader = request.headers.get('authorization');
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!authHeader || authHeader !== `Bearer ${serviceKey}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = await createClient();
    const body = await request.json();
    const { qso_ids } = body;

    let query = supabase
      .from('qso_logs')
      .update({
        uploaded_to_lotw: true,
        lotw_upload_date: new Date().toISOString(),
      })
      .eq('uploaded_to_lotw', false);

    if (qso_ids && Array.isArray(qso_ids) && qso_ids.length > 0) {
      query = query.in('id', qso_ids);
    }

    const { data, error } = await query.select();

    if (error) {
      return errorResponse(error.message, 'DB_ERROR', 500);
    }

    return successResponse({
      updated: data?.length || 0,
    }, 'QSOs marked as uploaded');
  } catch (err) {
    logError('Confirm upload error:', err);
    return errorResponse('Internal server error', 'SERVER_ERROR', 500);
  }
}