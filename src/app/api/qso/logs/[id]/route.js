// src/app/api/qso/logs/[id]/route.js
import { createClient } from '@/lib/supabase/server';
import { validateQSO } from '@/lib/validators/qsoValidator';

export async function GET(request, { params }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { id } = await params;
  const { data, error } = await supabase
    .from('qso_logs')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return new Response('Not Found', { status: 404 });
    return new Response(error.message, { status: 500 });
  }
  return Response.json(data);
}

export async function PUT(request, { params }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const result = validateQSO(body);
  if (!result.success) {
    return new Response(JSON.stringify({ errors: result.error.errors }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  delete result.data.user_id;
  const { data, error } = await supabase
    .from('qso_logs')
    .update(result.data)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return new Response('Not Found', { status: 404 });
    return new Response(error.message, { status: 500 });
  }
  return Response.json(data);
}

export async function DELETE(request, { params }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { id } = await params;
  const { error } = await supabase
    .from('qso_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    if (error.code === 'PGRST116') return new Response('Not Found', { status: 404 });
    return new Response(error.message, { status: 500 });
  }
  return new Response(null, { status: 204 });
}