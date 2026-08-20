// src/app/api/qso/upload/lotw/admin/batch/route.js
import { createClient } from '@/lib/supabase/server';
import { prepareTQSLDirectory, uploadADIFWithTQSL, cleanupTQSLDirectory } from '@/lib/tqsl-helper';
import { generateADIF } from '@/lib/adif/generator';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { logError } from '@/lib/logger';

export async function POST(request) {
    try {
        const authHeader = request.headers.get('authorization');
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!authHeader || authHeader !== `Bearer ${serviceKey}`) {
            return new Response('Unauthorized', { status: 401 });
        }

        const supabase = await createClient();

        // 获取所有用户的配置（通过 RPC）
        const { data: users, error: rpcError } = await supabase
            .rpc('admin_get_user_p12_configs');

        if (rpcError) {
            return errorResponse(rpcError.message, 'RPC_ERROR', 500);
        }

        const results = [];
        for (const user of users) {
            try {
                // 查询该用户的待上传 QSO
                const { data: qsos, error } = await supabase
                    .from('qso_logs')
                    .select('*')
                    .eq('user_id', user.user_id)
                    .eq('uploaded_to_lotw', false);

                if (error) {
                    results.push({ user_id: user.user_id, success: false, error: error.message });
                    continue;
                }
                if (!qsos || qsos.length === 0) {
                    results.push({ user_id: user.user_id, success: true, recordCount: 0, message: 'No pending' });
                    continue;
                }

                // 选择台站（取第一个或默认）
                let locations = user.station_locations || [];
                let targetStation = locations.find(s => s.default) || locations[0];
                if (!targetStation) {
                    results.push({ user_id: user.user_id, success: false, error: 'No station configured' });
                    continue;
                }

                // 准备 TQSL
                let configDir = null;
                try {
                    const { configDir: dir } = await prepareTQSLDirectory(user, [targetStation]);
                    configDir = dir;

                    const adifContent = generateADIF(qsos);
                    const uploadResult = await uploadADIFWithTQSL(adifContent, configDir, targetStation.name);

                    // 记录历史
                    await supabase
                        .from('lotw_upload_history')
                        .insert({
                            user_id: user.user_id,
                            file_name: `lotw_upload_${new Date().toISOString().slice(0,10)}.adi`,
                            record_count: uploadResult.recordCount,
                            status: uploadResult.success ? 'success' : 'failed',
                            error_message: uploadResult.success ? null : uploadResult.output.slice(0, 1000),
                            tqsl_output: uploadResult.output.slice(0, 5000),
                        });

                    if (uploadResult.success && uploadResult.recordCount > 0) {
                        const uploadedIds = qsos.map(q => q.id);
                        await supabase
                            .from('qso_logs')
                            .update({ uploaded_to_lotw: true, lotw_upload_date: new Date().toISOString() })
                            .in('id', uploadedIds)
                            .eq('user_id', user.user_id);
                    }

                    results.push({
                        user_id: user.user_id,
                        success: uploadResult.success,
                        recordCount: uploadResult.recordCount,
                    });
                } catch (err) {
                    results.push({ user_id: user.user_id, success: false, error: err.message });
                } finally {
                    if (configDir) await cleanupTQSLDirectory(configDir);
                }
            } catch (err) {
                results.push({ user_id: user.user_id, success: false, error: err.message });
            }
        }

        return successResponse({
            total_users: users.length,
            results,
        }, 'Batch upload completed');
    } catch (err) {
        logError('Batch upload error:', err);
        return errorResponse('Internal server error', 'SERVER_ERROR', 500);
    }
}