import { NextResponse } from 'next/server';
import { getAuthenticatedUser, parsePagination, successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET(request) {
  try {
    const { user, supabase } = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);

    let query = supabase
      .from('lotw_upload_history')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false });

    // 按状态过滤
    if (searchParams.has('status')) {
      query = query.eq('status', searchParams.get('status'));
    }

    const { data, count, error } = await query.range(offset, offset + limit - 1);
    if (error) throw error;

    return successResponse(data, 'History fetched', {
      page,
      limit,
      total: count,
      pages: Math.ceil(count / limit),
    });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    console.error('GET /upload/lotw/history error:', err);
    return errorResponse('Failed to fetch history', 500);
  }
}