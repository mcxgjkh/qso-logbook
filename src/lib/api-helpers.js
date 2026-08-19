// src/lib/api-helpers.js
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * 从请求中获取用户并验证角色
 * @param {Request} request - Next.js Request 对象
 * @param {string[]} allowedRoles - 允许的角色列表，默认 ['admin', 'dev']
 * @returns {Promise<{ user: object, role: string }>}
 * @throws {Response} 如果未认证或角色不符，抛出 NextResponse 错误
 */
export async function authenticate(request, allowedRoles = ['admin', 'dev']) {
  // 1. 尝试从 Authorization 头获取 token
  const authHeader = request.headers.get('authorization');
  let accessToken = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    accessToken = authHeader.substring(7);
  }

  // 2. 创建 Supabase 客户端
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
        set(name, value, options) { cookieStore.set({ name, value, ...options }); },
        remove(name, options) { cookieStore.set({ name, value: '', ...options }); },
      },
    }
  );

  // 3. 设置 session（如果有 token）
  if (accessToken) {
    await supabase.auth.setSession({ access_token: accessToken, refresh_token: '' });
  }

  // 4. 获取用户
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Response(JSON.stringify({ success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 5. 查询角色
  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (roleError) {
    throw new Response(JSON.stringify({ success: false, error: 'Role query failed', code: 'DB_ERROR' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const role = roleData?.role;
  if (!role || !allowedRoles.includes(role)) {
    throw new Response(JSON.stringify({ success: false, error: 'Forbidden', code: 'ROLE_FORBIDDEN' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 返回用户和角色，同时返回 supabase 实例以便后续使用（带有用户上下文）
  return { user, role, supabase };
}

/**
 * 统一成功响应
 */
export function successResponse(data, message = 'Success', status = 200) {
  return new Response(JSON.stringify({ success: true, data, message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * 列表分页响应
 */
export function paginatedResponse(data, total, page, limit, message = 'Success') {
  const pages = Math.ceil(total / limit);
  return new Response(
    JSON.stringify({
      success: true,
      data,
      pagination: { page, limit, total, pages },
      message,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * 错误响应（用于代码内部抛出）
 */
export function errorResponse(message, code = 'INTERNAL_ERROR', status = 400) {
  return new Response(JSON.stringify({ success: false, error: message, code }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * 从 URL 提取分页和过滤参数
 */
export function parsePagination(request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50')));
  const sort = searchParams.get('sort') || 'qso_date DESC';
  return { page, limit, sort, searchParams };
}