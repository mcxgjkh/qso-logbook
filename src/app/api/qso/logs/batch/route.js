// src/app/api/qso/logs/batch/route.js
import { authenticate, successResponse, errorResponse } from '@/lib/api-helpers';
import { validateQSO } from '@/lib/validators/qsoValidator';
import { parseADIF } from '@/lib/adif/parser';

// 批量删除
export async function DELETE(request) {
  try {
    const { user, supabase } = await authenticate(request);
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return errorResponse('ids must be a non-empty array', 'INVALID_PARAMS', 400);
    }

    // 限制批量删除数量
    if (ids.length > 1000) {
      return errorResponse('Too many ids (max 1000)', 'INVALID_PARAMS', 400);
    }

    const { data, error } = await supabase
      .from('qso_logs')
      .delete()
      .in('id', ids)
      .eq('user_id', user.id)
      .select('id');

    if (error) {
      console.error('Batch delete error:', error);
      return errorResponse('Batch delete failed', 'DB_ERROR', 500);
    }

    return successResponse({ deleted_count: data.length }, `Deleted ${data.length} logs`);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('Batch delete unhandled:', err);
    return errorResponse('Internal Server Error', 'INTERNAL_ERROR', 500);
  }
}

// 批量更新（PATCH）
export async function PATCH(request) {
  try {
    const { user, supabase } = await authenticate(request);
    const body = await request.json();
    const { ids, updates } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return errorResponse('ids must be a non-empty array', 'INVALID_PARAMS', 400);
    }
    if (typeof updates !== 'object' || Object.keys(updates).length === 0) {
      return errorResponse('updates must be an object with at least one field', 'INVALID_PARAMS', 400);
    }
    if (ids.length > 1000) {
      return errorResponse('Too many ids (max 1000)', 'INVALID_PARAMS', 400);
    }

    // 禁止更新 user_id, id, created_at
    const forbidden = ['user_id', 'id', 'created_at', 'updated_at'];
    for (const key of forbidden) {
      if (key in updates) delete updates[key];
    }

    const { data, error } = await supabase
      .from('qso_logs')
      .update(updates)
      .in('id', ids)
      .eq('user_id', user.id)
      .select('id');

    if (error) {
      console.error('Batch update error:', error);
      return errorResponse('Batch update failed', 'DB_ERROR', 500);
    }

    return successResponse({ updated_count: data.length }, `Updated ${data.length} logs`);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('Batch update unhandled:', err);
    return errorResponse('Internal Server Error', 'INTERNAL_ERROR', 500);
  }
}

// 批量新增（ADIF 导入）
export async function POST(request) {
  try {
    const { user, supabase } = await authenticate(request);
    const body = await request.json();

    let qsos = [];
    if (body.adif_content) {
      // 解析 ADIF
      qsos = parseADIF(body.adif_content);
      if (!Array.isArray(qsos)) {
        return errorResponse('Invalid ADIF content', 'INVALID_ADIF', 400);
      }
    } else if (Array.isArray(body.qsos)) {
      qsos = body.qsos;
    } else {
      return errorResponse('Either adif_content or qsos array required', 'INVALID_PARAMS', 400);
    }

    if (qsos.length === 0) {
      return errorResponse('No QSOs to import', 'INVALID_PARAMS', 400);
    }
    if (qsos.length > 5000) {
      return errorResponse('Too many QSOs (max 5000)', 'INVALID_PARAMS', 400);
    }

    // 验证每个 QSO，并添加 user_id
    const validQsos = [];
    const errors = [];
    qsos.forEach((qso, idx) => {
      const validation = validateQSO(qso);
      if (validation.valid) {
        validQsos.push({ ...qso, user_id: user.id, imported_from_adif: true });
      } else {
        errors.push({ index: idx, errors: validation.errors });
      }
    });

    if (validQsos.length === 0) {
      return errorResponse('No valid QSOs to insert', 'INVALID_QSO', 400);
    }

    // 批量插入（按最大 500 条分批）
    const chunkSize = 500;
    let inserted = 0;
    for (let i = 0; i < validQsos.length; i += chunkSize) {
      const chunk = validQsos.slice(i, i + chunkSize);
      const { error } = await supabase
        .from('qso_logs')
        .insert(chunk);
      if (error) {
        console.error('Batch insert error:', error);
        return errorResponse('Insert failed for chunk', 'DB_ERROR', 500);
      }
      inserted += chunk.length;
    }

    return successResponse({
      inserted_count: inserted,
      skipped_duplicates: 0, // 可添加去重逻辑
      errors,
    }, `Imported ${inserted} QSOs`, 201);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('Batch import unhandled:', err);
    return errorResponse('Internal Server Error', 'INTERNAL_ERROR', 500);
  }
}