// src/app/api/qso/upload/lotw/route.js
import { authenticate, successResponse, errorResponse } from '@/lib/api-helpers';
import { uploadForUser } from '@/lib/lotw/uploader';
import { logError } from '@/lib/logger';

export async function POST(request) {
    try {
        const { user, supabase } = await authenticate(request);
        const body = await request.json();
        const { qso_ids, station_name } = body || {};

        // 构建查询
        let query = supabase
            .from('qso_logs')
            .select('*')
            .eq('user_id', user.id)
            .eq('uploaded_to_lotw', false);

        if (qso_ids && Array.isArray(qso_ids) && qso_ids.length > 0) {
            query = query.in('id', qso_ids);
        }

        const { data: qsos, error } = await query;
        if (error) return errorResponse(error.message, 'DB_ERROR', 500);
        if (!qsos || qsos.length === 0) {
            return errorResponse('No pending QSOs to upload', 'NO_PENDING', 400);
        }

        // 执行上传
        const result = await uploadForUser(supabase, user.id, qsos, station_name);

        // 记录历史
        const historyPayload = {
            user_id: user.id,
            file_name: `lotw_upload_${new Date().toISOString().slice(0,10)}.adi`,
            record_count: result.recordCount,
            status: result.success ? 'success' : 'failed',
            error_message: result.success ? null : result.output.slice(0, 1000),
            tqsl_output: result.output.slice(0, 500),
        };
        await supabase.from('lotw_upload_history').insert(historyPayload);

        // 标记已上传
        if (result.success && result.recordCount > 0) {
            const uploadedIds = qsos.map(q => q.id);
            await supabase
                .from('qso_logs')
                .update({ uploaded_to_lotw: true, lotw_upload_date: new Date().toISOString() })
                .in('id', uploadedIds)
                .eq('user_id', user.id);
        }

        return successResponse({
            uploaded: result.recordCount,
            total_pending: qsos.length,
            success: result.success,
            output: result.output.slice(0, 2000),
        }, result.success ? 'Upload successful' : 'Upload failed');
    } catch (err) {
        if (err.status === 401 || err.status === 403) return err;
        logError('LoTW upload error:', err);
        return errorResponse('Internal server error', 'SERVER_ERROR', 500);
    }
}