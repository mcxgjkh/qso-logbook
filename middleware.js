import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function middleware(request) {
  const res = NextResponse.next();

  // 安全头
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
  );

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // 公开路径（无需登录）
  const publicPaths = ['/login', '/_next', '/favicon.ico'];
  if (publicPaths.some(p => path.startsWith(p))) return res;

  // 未登录 -> 跳转登录
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  // 检查用户角色 (admin/dev 才能访问 dashboard)
  if (path.startsWith('/')) { // 所有 protected 路径
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const role = roleData?.role;
    if (!['admin', 'dev'].includes(role)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|favicon.ico).*)'],
};
