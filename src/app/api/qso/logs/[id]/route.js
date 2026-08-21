// src/app/api/qso/logs/[id]/route.js
import { authenticate, successResponse, errorResponse } from '@/lib/api-helpers';
import { validateQSO } from '@/lib/validators/qsoValidator';
import { logError, logInfo } from '@/lib/logger';

export async function GET(request, { params }) {
  try {
    const { user, supabase } = await authenticate(request);
    const { id } = await params;

    const { data, error } = await supabase
      .from('qso_logs')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return new Response('Not Found', { status: 404 });
      return errorResponse(error.message, 'DB_ERROR', 500);
    }

    return successResponse(data);
  } catch (err) {
    if (err instanceof Response) return err;
    logError('GET /api/qso/logs/[id]', err);
    return errorResponse('内部错误', 'SERVER_ERROR', 500);
  }
}

export async function PUT(request, { params }) {
  try {
    const { user, supabase } = await authenticate(request);
    const { id } = await params;
    const body = await request.json();

    // 强制呼号大写
    if (body.call_sign) {
      body.call_sign = body.call_sign.toUpperCase();
    }

    const result = validateQSO(body);
    if (!result.success) {
      return errorResponse('数据校验失败，请检查必填字段', 'VALIDATION_FAILED', 400);
    }

    // 防止更新 user_id
    delete result.data.user_id;

    const { data, error } = await supabase
      .from('qso_logs')
      .update(result.data)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return new Response('Not Found', { status: 404 });
      logError('PUT /api/qso/logs/[id] update error', error);
      return errorResponse(error.message, 'DB_ERROR', 500);
    }

    logInfo('QSO updated', { userId: user.id, call_sign: data.call_sign });
    return successResponse(data, 'QSO更新成功');
  } catch (err) {
    if (err instanceof Response) return err;
    logError('PUT /api/qso/logs/[id]', err);
    return errorResponse('内部错误', 'SERVER_ERROR', 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user, supabase } = await authenticate(request);
    const { id } = await params;

    const { error } = await supabase
      .from('qso_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      if (error.code === 'PGRST116') return new Response('Not Found', { status: 404 });
      logError('DELETE /api/qso/logs/[id] error', error);
      return errorResponse(error.message, 'DB_ERROR', 500);
    }

    logInfo('QSO deleted', { userId: user.id, qsoId: id });
    return new Response(null, { status: 204 });
  } catch (err) {
    if (err instanceof Response) return err;
    logError('DELETE /api/qso/logs/[id]', err);
    return errorResponse('内部错误', 'SERVER_ERROR', 500);
  }
}