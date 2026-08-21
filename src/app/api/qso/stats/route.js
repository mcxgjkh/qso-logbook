// src/app/api/qso/stats/route.js
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30'); // 趋势图天数

  // 1. 基础统计
  const { count: total } = await supabase
    .from('qso_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // 2. 本月通联数
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startStr = startOfMonth.toISOString().slice(0, 10).replace(/-/g, '');
  const { count: monthly } = await supabase
    .from('qso_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('qso_date', startStr);

  // 3. 待上传 LoTW
  const { count: pendingLotw } = await supabase
    .from('qso_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('uploaded_to_lotw', false);

  // 4. 唯一呼号数
  const { data: uniqueCalls } = await supabase
    .from('qso_logs')
    .select('call_sign')
    .eq('user_id', user.id);
  const uniqueCount = new Set(uniqueCalls?.map(c => c.call_sign) || []).size;

  // 5. 波段分布
  const { data: bandData } = await supabase
    .from('qso_logs')
    .select('band')
    .eq('user_id', user.id)
    .not('band', 'is', null);
  const bandDistribution = {};
  (bandData || []).forEach(item => {
    const band = item.band || '未知';
    bandDistribution[band] = (bandDistribution[band] || 0) + 1;
  });
  const bandStats = Object.entries(bandDistribution)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // 6. 模式分布
  const { data: modeData } = await supabase
    .from('qso_logs')
    .select('mode')
    .eq('user_id', user.id)
    .not('mode', 'is', null);
  const modeDistribution = {};
  (modeData || []).forEach(item => {
    const mode = item.mode || '未知';
    modeDistribution[mode] = (modeDistribution[mode] || 0) + 1;
  });
  const modeStats = Object.entries(modeDistribution)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // 7. 每日通联趋势（最近N天）
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().slice(0, 10).replace(/-/g, '');
  const endDateStr = endDate.toISOString().slice(0, 10).replace(/-/g, '');

  const { data: dailyData } = await supabase
    .from('qso_logs')
    .select('qso_date')
    .eq('user_id', user.id)
    .gte('qso_date', startDateStr)
    .lte('qso_date', endDateStr)
    .order('qso_date', { ascending: true });

  const dailyCount = {};
  (dailyData || []).forEach(item => {
    const date = item.qso_date;
    dailyCount[date] = (dailyCount[date] || 0) + 1;
  });

  // 填充缺失日期
  const trendData = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = current.toISOString().slice(0, 10).replace(/-/g, '');
    trendData.push({
      date: dateStr,
      count: dailyCount[dateStr] || 0,
    });
    current.setDate(current.getDate() + 1);
  }

  // 8. 顶部通联呼号
  const { data: topCalls } = await supabase
    .from('qso_logs')
    .select('call_sign')
    .eq('user_id', user.id);
  const callCount = {};
  (topCalls || []).forEach(item => {
    const call = item.call_sign;
    callCount[call] = (callCount[call] || 0) + 1;
  });
  const topCallSigns = Object.entries(callCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // 9. 年度统计
  const { data: yearData } = await supabase
    .from('qso_logs')
    .select('qso_date')
    .eq('user_id', user.id)
    .order('qso_date', { ascending: true });
  const yearCount = {};
  (yearData || []).forEach(item => {
    const year = item.qso_date.slice(0, 4);
    yearCount[year] = (yearCount[year] || 0) + 1;
  });
  const yearStats = Object.entries(yearCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return Response.json({
    total: total || 0,
    monthly: monthly || 0,
    pendingLotw: pendingLotw || 0,
    uniqueCalls: uniqueCount,
    bandDistribution: bandStats,
    modeDistribution: modeStats,
    trend: trendData,
    topCalls: topCallSigns,
    yearStats: yearStats,
    days,
  });
}