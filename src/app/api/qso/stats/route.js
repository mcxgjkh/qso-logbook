// src/app/api/qso/stats/route.js
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  // 总通联数
  const { count: total } = await supabase
    .from('qso_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // 本月
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startStr = startOfMonth.toISOString().slice(0, 10).replace(/-/g, '');
  const { count: monthly } = await supabase
    .from('qso_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('qso_date', startStr);

  // 待上传 LoTW
  const { count: pendingLotw } = await supabase
    .from('qso_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('uploaded_to_lotw', false);

  // 唯一呼号
  const { data: uniqueCalls } = await supabase
    .from('qso_logs')
    .select('call_sign')
    .eq('user_id', user.id);

  const uniqueCount = new Set(uniqueCalls?.map(c => c.call_sign) || []).size;

  return Response.json({
    total: total || 0,
    monthly: monthly || 0,
    pendingLotw: pendingLotw || 0,
    uniqueCalls: uniqueCount,
  });
}