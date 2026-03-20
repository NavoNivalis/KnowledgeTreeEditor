'use client';
import { useState, useEffect, Suspense } from 'react';
import { createClientSupabase } from '@/app/lib/supabase-client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// 把业务逻辑全部拆到这个组件里
function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!searchParams) return;

    if (searchParams.get('registered')) {
      setError('注册成功！请登录');
    }
    if (searchParams.get('reset')) {
      setError('密码重置成功！请登录');
    }
  }, [searchParams]);

  // 通用登录逻辑
  const performLogin = async (loginEmail: string, loginPassword: string) => {
    setLoading(true);
    setError(null);

    const { error: supabaseError } = await createClientSupabase().auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (!supabaseError) {
      setLoading(false);
      window.location.href = '/tree';
    } else {
      setError(supabaseError.message);
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(email, password);
  };

  const handleSkipLogin = async () => {
    await performLogin('Test_KnowledgeTreeEditor@233.com', '123456789');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            登录你的账号
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className={`${searchParams?.get('registered') || searchParams?.get('reset') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'} border px-4 py-3 rounded-lg`}>
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                邮箱
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="邮箱地址"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="密码"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
               记住我
              </label>
            </div>

            <div className="text-sm">
              <Link href="/reset-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                忘记密码？
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '登录'}
            </button>

            <button
              type="button"
              onClick={handleSkipLogin}
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border-2 border-dashed border-gray-300 text-sm font-medium rounded-lg text-gray-600 bg-gray-50 hover:bg-gray-100 hover:text-gray-800 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '登录中...' : '跳过登录！直接体验！'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              还没有账号？{' '}
              <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                立即注册
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

// 最外层只做一件事：包 Suspense
export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-lg">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}