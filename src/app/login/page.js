'use client';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const signInWithDiscord = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: `${location.origin}/auth/callback` }
    });
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` }
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-white mb-2">🎮 GameBuddy</h1>
        <p className="text-slate-400 text-sm mb-8">Find your perfect squad</p>
        <button onClick={signInWithDiscord}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-semibold mb-3 transition">
          Continue with Discord
        </button>
        <button onClick={signInWithGoogle}
          className="w-full border border-slate-700 hover:bg-slate-800 text-white py-3 rounded-xl font-semibold transition">
          Continue with Google
        </button>
      </div>
    </div>
  );
}