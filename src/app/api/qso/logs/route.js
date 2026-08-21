// src/app/api/qso/logs/route.js
import { authenticate, successResponse, errorResponse } from '@/lib/api-helpers';
import { validateQSO } from '@/lib/validators/qsoValidator';
import { logError, logInfo } from '@/lib/logger';

// GET /api/qso/logs
export async function GET(request) {
  try {
    const { user, supabase } = await authenticate(request);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('qso_logs')
      .select('*', { count: 'exact', head: false })
      .eq('user_id', user.id)
      .range(offset, offset + limit - 1)
      .order('qso_date', { ascending: false })
      .order('time_on', { ascending: false });

    // 筛选条件
    const call = searchParams.get('call');
    if (call && call !== 'undefined') query = query.ilike('call_sign', `%${call}%`);

    const band = searchParams.get('band');
    if (band && band !== 'undefined') query = query.eq('band', band);

    const mode = searchParams.get('mode');
    if (mode && mode !== 'undefined') query = query.eq('mode', mode);

    const propagation = searchParams.get('propagation');
    if (propagation && propagation !== 'undefined') query = query.eq('propagation', propagation);

    const uploaded = searchParams.get('uploaded_to_lotw');
    if (uploaded && uploaded !== 'undefined') {
      if (uploaded === 'true') query = query.eq('uploaded_to_lotw', true);
      else if (uploaded === 'false') query = query.eq('uploaded_to_lotw', false);
    }

    const start_date = searchParams.get('start_date');
    if (start_date && start_date !== 'undefined') {
      query = query.gte('qso_date', start_date.replace(/-/g, ''));
    }

    const end_date = searchParams.get('end_date');
    if (end_date && end_date !== 'undefined') {
      query = query.lte('qso_date', end_date.replace(/-/g, ''));
    }

    const { data, count, error } = await query;

    if (error) {
      logError('GET /api/qso/logs query error', error);
      return errorResponse(error.message, 'DB_ERROR', 500);
    }

    // 直接返回原始格式
    return Response.json({
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (err) {
    if (err instanceof Response) return err;
    logError('GET /api/qso/logs', err);
    return errorResponse('内部错误', 'SERVER_ERROR', 500);
  }
}

// POST /api/qso/logs
export async function POST(request) {
  try {
    const { user, supabase } = await authenticate(request);
    const body = await request.json();

    // 强制呼号大写
    if (body.call_sign) {
      body.call_sign = body.call_sign.toUpperCase();
    }

    const result = validateQSO(body);
    if (!result.success) {
      return errorResponse('数据校验失败，请检查必填字段', 'VALIDATION_FAILED', 400);
    }

    const newQSO = { ...result.data, user_id: user.id };

    const { data, error } = await supabase
      .from('qso_logs')
      .insert(newQSO)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return errorResponse('该QSO已存在（重复记录）', 'DUPLICATE_QSO', 409);
      }
      logError('POST /api/qso/logs insert error', error);
      return errorResponse(error.message, 'DB_ERROR', 500);
    }

    logInfo('QSO created', { userId: user.id, call_sign: data.call_sign });
    return successResponse(data, 'QSO创建成功', 201);
  } catch (err) {
    if (err instanceof Response) return err;
    logError('POST /api/qso/logs', err);
    return errorResponse('内部错误', 'SERVER_ERROR', 500);
  }
}