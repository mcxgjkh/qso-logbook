// src/app/api/qso/logs/batch/route.js
import { authenticate, successResponse, errorResponse } from '@/lib/api-helpers';
import { validateQSO } from '@/lib/validators/qsoValidator';

// 批量检查并过滤重复记录
async function filterDuplicates(qsos, supabase, userId) {
    if (qsos.length === 0) return [];
    
    const existingKeys = new Set();
    const batchSize = 50; // 每批并发50条
    
    for (let i = 0; i < qsos.length; i += batchSize) {
        const batch = qsos.slice(i, i + batchSize);
        const promises = batch.map(async (qso) => {
            // 将日期从 YYYY-MM-DD 转为 YYYYMMDD（与数据库一致）
            const qsoDate = qso.qso_date.replace(/-/g, '');
            const { data } = await supabase
                .from('qso_logs')
                .select('id')
                .eq('user_id', userId)
                .eq('call_sign', qso.call_sign)
                .eq('qso_date', qsoDate)
                .eq('time_on', qso.time_on)
                .eq('band', qso.band || '')
                .eq('mode', qso.mode || '')
                .maybeSingle();
            if (data) {
                const key = `${qso.call_sign}|${qsoDate}|${qso.time_on}|${qso.band || ''}|${qso.mode || ''}`;
                existingKeys.add(key);
            }
        });
        await Promise.all(promises);
    }
    
    // 过滤出不在 existingKeys 中的记录
    return qsos.filter(q => {
        const qsoDate = q.qso_date.replace(/-/g, '');
        const key = `${q.call_sign}|${qsoDate}|${q.time_on}|${q.band || ''}|${q.mode || ''}`;
        return !existingKeys.has(key);
    });
}

export async function POST(request) {
    try {
        const { user, supabase } = await authenticate(request);
        const body = await request.json();
        let qsos = [];
        
        if (body.adif_content) {
            const { parseADIF } = await import('@/lib/adif/parser');
            qsos = parseADIF(body.adif_content);
        } else if (body.qsos && Array.isArray(body.qsos)) {
            qsos = body.qsos;
        } else {
            return errorResponse('Invalid input: expected qsos or adif_content', 'INVALID_INPUT', 400);
        }
        
        if (qsos.length === 0) {
            return errorResponse('No QSO records found', 'EMPTY', 400);
        }
        
        const MAX_BATCH = 1000;
        if (qsos.length > MAX_BATCH) {
            return errorResponse(`Too many records (max ${MAX_BATCH})`, 'TOO_MANY', 400);
        }
        
        // 校验并准备插入
        const validQsos = [];
        const errors = [];
        
        for (let i = 0; i < qsos.length; i++) {
            const raw = qsos[i];
            const withUser = { ...raw, user_id: user.id };
            const result = validateQSO(withUser);
            if (result.success) {
                validQsos.push(result.data);
            } else {
                errors.push({ index: i, errors: result.error.errors });
            }
        }
        
        if (validQsos.length === 0) {
            return errorResponse('No valid QSO records', 'VALIDATION_FAILED', 400);
        }
        
        // 过滤重复记录
        const uniqueQsos = await filterDuplicates(validQsos, supabase, user.id);
        const duplicateCount = validQsos.length - uniqueQsos.length;
        
        if (uniqueQsos.length === 0) {
            return successResponse({
                inserted: 0,
                total: qsos.length,
                valid: validQsos.length,
                duplicates: duplicateCount,
                errors: errors.length > 0 ? errors : undefined,
                message: '所有记录均已存在，无新记录插入'
            }, 'No new records to insert');
        }
        
        // 批量插入
        const { data, error } = await supabase
            .from('qso_logs')
            .insert(uniqueQsos)
            .select();
        
        if (error) {
            // 如果插入时仍有唯一约束冲突（极少数并发情况），捕获并返回友好信息
            if (error.code === '23505') {
                return errorResponse('部分记录与现有数据冲突，请稍后重试', 'DUPLICATE_CONFLICT', 409);
            }
            return errorResponse(error.message, 'DB_ERROR', 500);
        }
        
        return successResponse({
            inserted: data.length,
            total: qsos.length,
            valid: validQsos.length,
            duplicates: duplicateCount,
            errors: errors.length > 0 ? errors : undefined,
        }, `成功导入 ${data.length} 条新QSO，跳过 ${duplicateCount} 条重复记录`);
        
    } catch (err) {
        if (err.status && (err.status === 401 || err.status === 403)) return err;
        console.error('Batch import error:', err);
        return errorResponse('Internal server error', 'SERVER_ERROR', 500);
    }
}

// DELETE /api/qso/logs/batch - 批量删除
export async function DELETE(request) {
  try {
    const { user, supabase } = await authenticate(request);
    const body = await request.json();
    const { ids } = body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return errorResponse('Invalid ids', 'INVALID_IDS', 400);
    }
    
    const { error } = await supabase
      .from('qso_logs')
      .delete()
      .in('id', ids)
      .eq('user_id', user.id);
    
    if (error) {
      return errorResponse(error.message, 'DB_ERROR', 500);
    }
    
    return successResponse({ deleted: ids.length }, 'Deleted successfully');
    
  } catch (err) {
    if (err.status && err.status === 401) return err;
    console.error('Batch delete error:', err);
    return errorResponse('Internal server error', 'SERVER_ERROR', 500);
  }
}