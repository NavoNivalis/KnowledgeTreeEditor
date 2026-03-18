import { createBrowserClient } from '@supabase/ssr';

// ✅ 函数名也改了，一看就知道是客户端
export function createClientSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}