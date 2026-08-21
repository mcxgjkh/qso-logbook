// src/app/api/qso/upload/lotw/history/route.js
import { authenticate, paginatedResponse, errorResponse } from '@/lib/api-helpers';
import { logError } from '@/lib/logger';

export async function GET(request) {
  try {
    const { user, supabase } = await authenticate(request);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const { data, count, error } = await supabase
      .from('lotw_upload_history')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return errorResponse(error.message, 'DB_ERROR', 500);
    }

    return paginatedResponse(data || [], count || 0, page, limit);
  } catch (err) {
    if (err.status === 401 || err.status === 403) return err;
    logError('LoTW history error:', err);
    return errorResponse('Internal server error', 'SERVER_ERROR', 500);
  }
}