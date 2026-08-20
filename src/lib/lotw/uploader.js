// src/lib/lotw/uploader.js
import { prepareTQSLDirectory, uploadADIFWithTQSL, cleanupTQSLDirectory } from '@/lib/tqsl-helper';
import { generateADIF } from '@/lib/adif/generator';

/**
 * 为指定用户上传 QSO 到 LoTW
 * @param {object} supabase - 已认证的 Supabase 客户端
 * @param {string} userId - 用户 ID
 * @param {Array} qsos - QSO 数组
 * @param {string} stationName - 指定使用的台站名称（可选，若未传则使用默认）
 * @returns {Promise<{ success: boolean, output: string, recordCount: number }>}
 */
export async function uploadForUser(supabase, userId, qsos, stationName = null) {
    if (!qsos || qsos.length === 0) {
        return { success: false, output: 'No QSOs to upload', recordCount: 0 };
    }

    // 过滤已上传的
    const pending = qsos.filter(q => !q.uploaded_to_lotw);
    if (pending.length === 0) {
        return { success: false, output: 'All QSOs already uploaded', recordCount: 0 };
    }

    // 1. 获取用户配置
    const { data: config, error } = await supabase
        .from('user_lotw_configs')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error || !config) {
        return { success: false, output: 'No LoTW configuration found', recordCount: 0 };
    }

    // 2. 确定使用的台站
    let locations = config.station_locations || [];
    let targetStation = null;
    if (stationName) {
        targetStation = locations.find(s => s.name === stationName);
    }
    if (!targetStation) {
        targetStation = locations.find(s => s.default);
    }
    if (!targetStation && locations.length > 0) {
        targetStation = locations[0];
    }
    if (!targetStation) {
        return { success: false, output: 'No station location configured', recordCount: 0 };
    }

    // 3. 准备 TQSL 目录
    let configDir = null;
    try {
        const { configDir: dir } = await prepareTQSLDirectory(config, [targetStation]);
        configDir = dir;

        // 4. 生成 ADIF
        const adifContent = generateADIF(pending);

        // 5. 上传
        const result = await uploadADIFWithTQSL(adifContent, configDir, targetStation.name);
        return result;
    } catch (err) {
        return { success: false, output: err.message || 'Upload failed', recordCount: 0 };
    } finally {
        if (configDir) {
            await cleanupTQSLDirectory(configDir);
        }
    }
}