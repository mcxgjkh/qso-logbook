// src/app/api/qso/upload/lotw/route.js
import { authenticate, successResponse, errorResponse } from '@/lib/api-helpers';

export async function POST(request) {
  try {
    const { user, supabase } = await authenticate(request);
    const body = await request.json();
    const { qso_ids } = body; // 可选

    // 查询待上传的 QSO
    let query = supabase
      .from('qso_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('uploaded_to_lotw', false);

    if (Array.isArray(qso_ids) && qso_ids.length > 0) {
      query = query.in('id', qso_ids);
    }

    const { data: qsos, error: fetchError } = await query;
    if (fetchError) {
      console.error('Fetch pending QSOs error:', fetchError);
      return errorResponse('Failed to fetch QSOs', 'DB_ERROR', 500);
    }

    if (qsos.length === 0) {
      return errorResponse('No pending QSOs to upload', 'NO_PENDING', 400);
    }

    // 创建上传历史记录（状态 pending）
    const { data: history, error: historyError } = await supabase
      .from('lotw_upload_history')
      .insert({
        user_id: user.id,
        file_name: `lotw_${new Date().toISOString().replace(/[:.]/g, '')}.adi`,
        record_count: qsos.length,
        status: 'pending',
      })
      .select()
      .single();

    if (historyError) {
      console.error('Create history error:', historyError);
      return errorResponse('Failed to create upload history', 'DB_ERROR', 500);
    }

    // 此处可触发异步任务（如发送到消息队列或调用云函数）
    // 为了演示，我们直接标记为成功（实际应后台执行）
    // 实际生产会通过 GitHub Actions 轮询或 webhook 更新状态

    // 模拟：立即标记成功（但需在后台执行）
    // 为了演示，我们直接返回，但 history 状态仍为 pending，由后台任务更新。

    return successResponse({
      history_id: history.id,
      pending_count: qsos.length,
      message: 'Upload task queued. Check history for status.',
    }, 'Upload initiated', 202);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('LoTW upload unhandled:', err);
    return errorResponse('Internal Server Error', 'INTERNAL_ERROR', 500);
  }
}