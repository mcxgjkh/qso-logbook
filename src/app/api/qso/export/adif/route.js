// src/app/api/qso/export/adif/route.js
import { authenticate, errorResponse } from '@/lib/api-helpers';
import { generateADIF } from '@/lib/adif/generator';

export async function GET(request) {
  try {
    const { user, supabase } = await authenticate(request);
    const { searchParams } = new URL(request.url);

    let query = supabase
      .from('qso_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('qso_date', { ascending: false })
      .order('time_on', { ascending: false });

    // 如果提供了 ids，则只导出这些记录
    const ids = searchParams.getAll('ids');
    if (ids && ids.length > 0) {
      const numericIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));
      if (numericIds.length > 0) {
        query = query.in('id', numericIds);
      }
    }

    // 其他筛选条件（与列表一致）
    const call = searchParams.get('call');
    if (call && call !== 'undefined') query = query.ilike('call_sign', `%${call}%`);

    const band = searchParams.get('band');
    if (band && band !== 'undefined') query = query.eq('band', band);

    const mode = searchParams.get('mode');
    if (mode && mode !== 'undefined') query = query.eq('mode', mode);

    const uploaded = searchParams.get('uploaded_to_lotw');
    if (uploaded === 'true') query = query.eq('uploaded_to_lotw', true);
    else if (uploaded === 'false') query = query.eq('uploaded_to_lotw', false);

    const start_date = searchParams.get('start_date');
    if (start_date && start_date !== 'undefined') {
      const normalized = start_date.replace(/-/g, '');
      if (normalized.length === 8) query = query.gte('qso_date', normalized);
    }

    const end_date = searchParams.get('end_date');
    if (end_date && end_date !== 'undefined') {
      const normalized = end_date.replace(/-/g, '');
      if (normalized.length === 8) query = query.lte('qso_date', normalized);
    }

    const limit = parseInt(searchParams.get('limit') || '10000');
    if (limit > 0) query = query.limit(Math.min(limit, 50000));

    const { data, error } = await query;

    if (error) {
      return errorResponse(error.message, 'DB_ERROR', 500);
    }

    if (!data || data.length === 0) {
      return new Response('No QSO records found', { status: 404 });
    }

    const adifContent = generateADIF(data);
    const filename = `qso_export_${new Date().toISOString().slice(0,10)}.adi`;
    return new Response(adifContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (err) {
    if (err.status && err.status === 401) return err;
    console.error('Export error:', err);
    return errorResponse('Internal server error', 'SERVER_ERROR', 500);
  }
}