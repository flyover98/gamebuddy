import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { get: (n) => cookieStore.get(n)?.value, set: (n, v, o) => cookieStore.set(n, v, o), remove: (n, o) => cookieStore.delete({ name: n, ...o }) } }
    );
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirect new users to profile creation
  return NextResponse.redirect(`${origin}/profile/create`);
}