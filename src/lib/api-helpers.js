// src/lib/api-helpers.js
import { createServerClient } from '@supabase/ssr';

export async function authenticate(request, allowedRoles = ['admin', 'dev']) {
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll() {
                    // API 路由不需要写回 cookie
                },
            },
        }
    );

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Response(
            JSON.stringify({ success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

    if (roleError) {
        throw new Response(
            JSON.stringify({ success: false, error: 'Role query failed', code: 'DB_ERROR' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const role = roleData?.role;
    if (!role || !allowedRoles.includes(role)) {
        throw new Response(
            JSON.stringify({ success: false, error: 'Forbidden', code: 'ROLE_FORBIDDEN' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
    }

    return { user, role, supabase };
}

export const getAuthenticatedUser = authenticate;

export function successResponse(data, message = 'Success', status = 200) {
    return new Response(JSON.stringify({ success: true, data, message }), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

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

export function errorResponse(message, code = 'INTERNAL_ERROR', status = 400) {
    const isDev = process.env.NODE_ENV === 'development';
    const userMessage = isDev ? message : '操作失败，请稍后重试';
    return new Response(
        JSON.stringify({
            success: false,
            error: userMessage,
            code: isDev ? code : 'ERROR',
        }),
        {
            status,
            headers: { 'Content-Type': 'application/json' },
        }
    );
}

export function parsePagination(request) {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const sort = searchParams.get('sort') || 'qso_date DESC';
    return { page, limit, sort, searchParams };
}