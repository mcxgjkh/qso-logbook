// src/app/api/qso/logs/batch/route.js
import { createClient } from '@/lib/supabase/server';

export async function DELETE(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const body = await request.json();
  const { ids } = body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return new Response('Invalid ids', { status: 400 });
  }

  const { error } = await supabase
    .from('qso_logs')
    .delete()
    .in('id', ids)
    .eq('user_id', user.id);

  if (error) return new Response(error.message, { status: 500 });
  return new Response(null, { status: 204 });
}