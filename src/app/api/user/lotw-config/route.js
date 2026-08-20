// src/app/api/user/lotw-config/route.js
import { authenticate, successResponse, errorResponse } from '@/lib/api-helpers';
import { encryptP12Data, encryptP12Password, getExpiryDate } from '@/lib/crypto';
import { verifyP12AndGetCallsign } from '@/lib/tqsl-helper';
import { rateLimit } from '@/middleware/rate-limit';

export async function POST(request) {
    const rateLimitResponse = rateLimit(request, 3, 60000);
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const { user, supabase } = await authenticate(request);
        const formData = await request.formData();
        const file = formData.get('p12');
        const password = formData.get('password');

        if (!file || !password) {
            return errorResponse('需要 .p12 文件和密码', 'MISSING_FIELDS', 400);
        }

        if (file.size > 2 * 1024 * 1024) {
            return errorResponse('文件大小不能超过 2MB', 'FILE_TOO_LARGE', 400);
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // 验证密码并解析呼号
        const verifyResult = await verifyP12AndGetCallsign(buffer, password);
        if (!verifyResult.valid) {
            return errorResponse(verifyResult.error || '证书无效或密码错误', 'INVALID_CERT', 400);
        }

        // 加密存储
        const { encrypted: p12Data, iv: p12Iv, tag: p12Tag } = encryptP12Data(buffer);
        const { encrypted: encPass, iv: passIv, tag: passTag } = encryptP12Password(password);

        const payload = {
            p12_data: p12Data,
            p12_iv: p12Iv,
            p12_tag: p12Tag,
            p12_password_enc: encPass,
            p12_password_iv: passIv,
            p12_password_tag: passTag,
            cert_callsign: verifyResult.callsign,
            station_locations: [],
            expires_at: getExpiryDate(2).toISOString(),
            updated_at: new Date().toISOString(),
        };

        // 检查是否已有配置
        const { data: existing } = await supabase
            .from('user_lotw_configs')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

        let result;
        if (existing) {
            const { data, error } = await supabase
                .from('user_lotw_configs')
                .update(payload)
                .eq('id', existing.id)
                .select()
                .single();
            if (error) throw error;
            result = data;
        } else {
            const { data, error } = await supabase
                .from('user_lotw_configs')
                .insert({ user_id: user.id, ...payload })
                .select()
                .single();
            if (error) throw error;
            result = data;
        }

        return successResponse({
            id: result.id,
            callsign: verifyResult.callsign,
            hasLocations: false,
            message: '证书已导入，请配置台站地址'
        });
    } catch (err) {
        if (err.status === 401 || err.status === 403) return err;
        console.error('Upload p12 error:', err);
        return errorResponse('内部错误', 'SERVER_ERROR', 500);
    }
}

// 获取配置摘要（不返回敏感数据，只返回非敏感信息）
export async function GET(request) {
    try {
        const { user, supabase } = await authenticate(request);
        const { data, error } = await supabase
            .from('user_lotw_configs')
            .select('cert_callsign, station_locations, expires_at, updated_at')
            .eq('user_id', user.id)
            .maybeSingle();

        if (error) {
            if (error.code === 'PGRST116') {
                return successResponse({ hasConfig: false }, '未配置');
            }
            return errorResponse(error.message, 'DB_ERROR', 500);
        }

        // 检查是否过期
        let isExpired = false;
        if (data?.expires_at && new Date(data.expires_at) < new Date()) {
            isExpired = true;
        }

        return successResponse({
            hasConfig: true,
            callsign: data.cert_callsign,
            stationLocations: data.station_locations || [],
            expiresAt: data.expires_at,
            updatedAt: data.updated_at,
            isExpired,
        });
    } catch (err) {
        if (err.status === 401 || err.status === 403) return err;
        return errorResponse('内部错误', 'SERVER_ERROR', 500);
    }
}

// 删除配置（仅在未过期时可删除，或强制删除）
export async function DELETE(request) {
    try {
        const { user, supabase } = await authenticate(request);
        const { error } = await supabase
            .from('user_lotw_configs')
            .delete()
            .eq('user_id', user.id);
        if (error) return errorResponse(error.message, 'DB_ERROR', 500);
        return successResponse({ deleted: true }, '已删除');
    } catch (err) {
        if (err.status === 401 || err.status === 403) return err;
        return errorResponse('内部错误', 'SERVER_ERROR', 500);
    }
}