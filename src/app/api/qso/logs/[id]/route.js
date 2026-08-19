// src/app/api/qso/logs/[id]/route.js
import { authenticate, successResponse, errorResponse } from '@/lib/api-helpers';
import { validateQSO } from '@/lib/validators/qsoValidator';

// 获取单条
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
      if (error.code === 'PGRST116') return errorResponse('Not found', 'NOT_FOUND', 404);
      console.error('GET /logs/:id error:', error);
      return errorResponse('Database error', 'DB_ERROR', 500);
    }

    return successResponse(data);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('GET /logs/:id unhandled:', err);
    return errorResponse('Internal Server Error', 'INTERNAL_ERROR', 500);
  }
}

// 更新
export async function PUT(request, { params }) {
  try {
    const { user, supabase } = await authenticate(request);
    const { id } = await params;
    const body = await request.json();

    // 验证（仅验证传入字段）
    const validation = validateQSO(body, true); // partial允许缺失
    if (!validation.valid) {
      return errorResponse(`Validation failed: ${validation.errors.join(', ')}`, 'INVALID_PARAMS', 400);
    }

    // 禁止修改 user_id
    delete body.user_id;

    const { data, error } = await supabase
      .from('qso_logs')
      .update(body)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return errorResponse('Not found', 'NOT_FOUND', 404);
      console.error('PUT /logs/:id error:', error);
      return errorResponse('Update failed', 'DB_ERROR', 500);
    }

    return successResponse(data, 'Log updated successfully');
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('PUT /logs/:id unhandled:', err);
    return errorResponse('Internal Server Error', 'INTERNAL_ERROR', 500);
  }
}

// 删除
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
      if (error.code === 'PGRST116') return errorResponse('Not found', 'NOT_FOUND', 404);
      console.error('DELETE /logs/:id error:', error);
      return errorResponse('Delete failed', 'DB_ERROR', 500);
    }

    return successResponse(null, 'Log deleted successfully');
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('DELETE /logs/:id unhandled:', err);
    return errorResponse('Internal Server Error', 'INTERNAL_ERROR', 500);
  }
}