// src/app/api/qso/logs/route.js
import { authenticate, successResponse, paginatedResponse, parsePagination, errorResponse } from '@/lib/api-helpers';
import { validateQSO } from '@/lib/validators/qsoValidator';

export async function GET(request) {
  try {
    const { user, supabase } = await authenticate(request);
    const { page, limit, sort, searchParams } = parsePagination(request);

    // 构建查询
    let query = supabase
      .from('qso_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order(sort.split(' ')[0], { ascending: sort.includes('ASC') });

    // 应用筛选
    const filters = [
      { param: 'start_date', column: 'qso_date', operator: 'gte' },
      { param: 'end_date', column: 'qso_date', operator: 'lte' },
      { param: 'call', column: 'call_sign', operator: 'ilike', transform: v => `%${v}%` },
      { param: 'band', column: 'band', operator: 'eq' },
      { param: 'mode', column: 'mode', operator: 'eq' },
      { param: 'uploaded_to_lotw', column: 'uploaded_to_lotw', operator: 'eq', transform: v => v === 'true' },
    ];

    filters.forEach(({ param, column, operator, transform }) => {
      const value = searchParams.get(param);
      if (value !== null) {
        const finalValue = transform ? transform(value) : value;
        query = query[operator](column, finalValue);
      }
    });

    // 执行查询（分页）
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, count, error } = await query.range(from, to);

    if (error) {
      console.error('GET /logs error:', error);
      return errorResponse('Database query failed', 'DB_ERROR', 500);
    }

    return paginatedResponse(data, count, page, limit);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('GET /logs unhandled:', err);
    return errorResponse('Internal Server Error', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(request) {
  try {
    const { user, supabase } = await authenticate(request);
    const body = await request.json();

    // 验证必填字段
    const validation = validateQSO(body);
    if (!validation.valid) {
      return errorResponse(`Validation failed: ${validation.errors.join(', ')}`, 'INVALID_PARAMS', 400);
    }

    // 注入 user_id
    const newRecord = {
      ...body,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from('qso_logs')
      .insert(newRecord)
      .select()
      .single();

    if (error) {
      console.error('POST /logs error:', error);
      return errorResponse('Insert failed', 'DB_ERROR', 500);
    }

    return successResponse(data, 'Log created successfully', 201);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('POST /logs unhandled:', err);
    return errorResponse('Internal Server Error', 'INTERNAL_ERROR', 500);
  }
}