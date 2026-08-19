import { NextResponse } from 'next/server';
import { getAuthenticatedUser, successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET(request, { params }) {
  try {
    const { user, supabase } = await getAuthenticatedUser(request);
    const { id } = params;

    const { data, error } = await supabase
      .from('lotw_upload_history')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return errorResponse('History record not found', 404, 'NOT_FOUND');
    }

    return successResponse(data);
  } catch (err) {
    if (err instanceof NextResponse) return err;
    console.error('GET /upload/lotw/history/:id error:', err);
    return errorResponse('Failed to fetch history detail', 500);
  }
}