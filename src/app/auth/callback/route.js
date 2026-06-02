import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../lib/supabaseServer';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user already has a profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('player_profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        // If profile exists, go to dashboard; otherwise go to create profile
        if (profile) {
          return NextResponse.redirect(`${origin}/dashboard`);
        }
      }
      return NextResponse.redirect(`${origin}/profile/create`);
    }
  }

  // On error, redirect to login with error param
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
