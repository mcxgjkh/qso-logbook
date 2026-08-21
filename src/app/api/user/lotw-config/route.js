// src/app/api/user/lotw-config/route.js
import { authenticate, successResponse, errorResponse } from '@/lib/api-helpers';
import { encryptP12Data, encryptP12Password, getExpiryDate } from '@/lib/crypto';
import { verifyP12AndGetCallsign } from '@/lib/tqsl-helper';
import { rateLimit } from '@/middleware/rate-limit';
import { logError } from '@/lib/logger';

export async function POST(request) {
    const rateLimitResponse = rateLimit(request, 3, 60000);
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const { user, supabase } = await authenticate(request);
        const formData = await request.formData();
        const file = formData.get('p12');
        const password = formData.get('password') || '';

        if (!file) {
            return errorResponse('需要 .p12 文件', 'MISSING_FILE', 400);
        }

        if (file.size > 2 * 1024 * 1024) {
            return errorResponse('文件大小不能超过 2MB', 'FILE_TOO_LARGE', 400);
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // 验证证书
        const verifyResult = await verifyP12AndGetCallsign(buffer, password);
        if (!verifyResult.valid) {
            return errorResponse(verifyResult.error || '证书无效', 'INVALID_CERT', 400);
        }

        // 检测到有密码但用户没填 -> 已在 verifyP12AndGetCallsign 中抛出错误
        // 检测到无密码但用户填了密码 -> 忽略密码，给出警告
        let warning = null;
        if (!verifyResult.hasPassword && password && password.trim() !== '') {
            warning = '证书无密码，无需填写密码，已忽略您输入的密码';
        }

        // 加密存储（密码不再需要加密，因为我们存储的密码为空字符串，但为了兼容，我们存储一个空字符串的加密）
        // 实际上我们不需要存储密码，因为证书无密码时不需要密码。但为了统一，我们仍然加密一个空字符串。
        // 或者我们可以在数据库中标记是否有密码，但我们使用 hasPassword 来区分。
        // 这里简化：始终加密密码（即使为空）
        const { encrypted: p12Data, iv: p12Iv, tag: p12Tag } = encryptP12Data(buffer);
        const { encrypted: encPass, iv: passIv, tag: passTag } = encryptP12Password(password || '');

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

        logInfo('证书已导入', { userId: user.id, callsign: verifyResult.callsign, hasPassword: verifyResult.hasPassword });
        return successResponse({
            id: result.id,
            callsign: verifyResult.callsign,
            hasLocations: false,
            message: '证书已导入，请配置台站地址',
            warning,
            hasPassword: verifyResult.hasPassword,
        });
    } catch (err) {
        if (err instanceof Response) return err;
        logError('POST /api/user/lotw-config', err);
        return errorResponse('内部错误', 'SERVER_ERROR', 500);
    }
}

export async function GET(request) {
    try {
        const { user, supabase } = await authenticate(request);
        const { data, error } = await supabase
            .from('user_lotw_configs')
            .select('cert_callsign, station_locations, expires_at, updated_at')
            .eq('user_id', user.id)
            .maybeSingle();

        // 处理 data 为 null 的情况（用户从未上传证书）
        if (!data) {
            return successResponse({ hasConfig: false }, '未配置');
        }

        if (error) {
            if (error.code === 'PGRST116') {
                return successResponse({ hasConfig: false }, '未配置');
            }
            logInfo('Supabase error:', error);
            return errorResponse(error.message, 'DB_ERROR', 500);
        }

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
        if (err instanceof Response) return err;
        logInfo('GET /api/user/lotw-config error:', err);
        return errorResponse('内部错误', 'SERVER_ERROR', 500);
    }
}

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
        if (err instanceof Response) return err;
        logInfo('DELETE /api/user/lotw-config error:', err);
        return errorResponse('内部错误', 'SERVER_ERROR', 500);
    }
}