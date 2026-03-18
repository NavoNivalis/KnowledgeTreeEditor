import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(req: NextRequest) {
  console.log('当前访问路径:', req.nextUrl.pathname);
  console.log('请求里的Cookies:', req.cookies.getAll());

  const res = NextResponse.next();

  // ✅ 就用这个！proxy.ts 专用的初始化方式
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  console.log('👀 当前session:', session ? '已登录' : '未登录');

  const isAuthRoute = [
    '/login',
    '/register',
    '/reset-password'
  ].includes(req.nextUrl.pathname);

  const isProtectedRoute = req.nextUrl.pathname.startsWith('/tree');

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/tree', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/tree/:path*', '/login', '/register', '/reset-password'],
};