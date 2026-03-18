import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/app/lib/supabase-server';

export default async function Home() {
  const supabase = await createServerSupabase(); // 👈 加 await
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/tree');
  } else {
    redirect('/login');
  }
}