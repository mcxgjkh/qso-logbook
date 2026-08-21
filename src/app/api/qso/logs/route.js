// src/app/api/qso/logs/route.js
import { createClient } from '@/lib/supabase/server';
import { validateQSO } from '@/lib/validators/qsoValidator';

export async function GET(request) {
  const supabase = await createClient(); // ← 添加 await
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page')) || 1;
  const limit = parseInt(searchParams.get('limit')) || 50;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('qso_logs')
    .select('*', { count: 'exact', head: false })
    .eq('user_id', user.id)
    .range(offset, offset + limit - 1)
    .order('qso_date', { ascending: false })
    .order('time_on', { ascending: false });

  // 过滤 undefined 参数
  const call = searchParams.get('call');
  if (call && call !== 'undefined') query = query.ilike('call_sign', `%${call}%`);

  const band = searchParams.get('band');
  if (band && band !== 'undefined') query = query.eq('band', band);

  const mode = searchParams.get('mode');
  if (mode && mode !== 'undefined') query = query.eq('mode', mode);

  const uploaded = searchParams.get('uploaded_to_lotw');
  if (uploaded && uploaded !== 'undefined') {
    if (uploaded === 'true') query = query.eq('uploaded_to_lotw', true);
    else if (uploaded === 'false') query = query.eq('uploaded_to_lotw', false);
  }

  const start_date = searchParams.get('start_date');
  if (start_date && start_date !== 'undefined') query = query.gte('qso_date', start_date.replace(/-/g, ''));

  const end_date = searchParams.get('end_date');
  if (end_date && end_date !== 'undefined') query = query.lte('qso_date', end_date.replace(/-/g, ''));

  const propagation = searchParams.get('propagation');
  if (propagation && propagation !== 'undefined') {
    query = query.eq('propagation', propagation);
  }

  const { data, count, error } = await query;

  if (error) return new Response(error.message, { status: 500 });

  return Response.json({
    data: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  });
}

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const body = await request.json();
  const result = validateQSO(body);
  if (!result.success) {
    return new Response(JSON.stringify({ errors: result.error.errors }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const newQSO = { ...result.data, user_id: user.id };
  const { data, error } = await supabase
    .from('qso_logs')
    .insert(newQSO)
    .select()
    .single();

  if (error) {
    // 检查是否为唯一约束冲突
    if (error.code === '23505') {
      return errorResponse('该QSO已存在（重复记录）', 'DUPLICATE_QSO', 409);
    }
    return errorResponse(error.message, 'DB_ERROR', 500);
  }

  return successResponse(data, 'QSO创建成功', 201);
}