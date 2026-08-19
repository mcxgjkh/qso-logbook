// src/app/api/qso/export/adif/route.js
import { authenticate, errorResponse } from '@/lib/api-helpers';
import { generateADIF } from '@/lib/adif/generator';

export async function GET(request) {
  try {
    const { user, supabase } = await authenticate(request);
    const { searchParams } = new URL(request.url);

    // 构建查询（与列表类似，但无分页）
    let query = supabase
      .from('qso_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('qso_date', { ascending: true });

    // 应用相同筛选
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

    const { data, error } = await query;
    if (error) {
      console.error('ADIF export error:', error);
      return errorResponse('Query failed', 'DB_ERROR', 500);
    }

    // 生成 ADIF
    const adifString = generateADIF(data);

    return new Response(adifString, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="log_export_${new Date().toISOString().slice(0,10)}.adi"`,
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('ADIF export unhandled:', err);
    return errorResponse('Internal Server Error', 'INTERNAL_ERROR', 500);
  }
}