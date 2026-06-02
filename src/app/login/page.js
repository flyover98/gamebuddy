'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isSignUp) {
        // 🔐 Handle New User Registration
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data?.user) {
          setSuccessMsg('Account created successfully! Redirecting...');
          setTimeout(() => {
            router.push('/profile/create');
          }, 1500);
        }
      } else {
        // 🔓 Handle Existing User Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data?.user) {
          // Check if they already have a profile to decide routing
          const { data: profile } = await supabase
            .from('player_profiles')
            .select('id')
            .eq('id', data.user.id)
            .single();

          if (profile) {
            router.push('/dashboard');
          } else {
            router.push('/profile/create');
          }
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden px-4">
      {/* Background glow (from your original code) */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-600/20 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 sm:p-10 w-full max-w-sm shadow-2xl backdrop-blur-xl">
        
        {/* Logo (from your original code) */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <span className="text-xl">🎮</span>
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-white">
            Game<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Buddy</span>
          </h1>
        </div>
        <p className="text-slate-400 text-sm mb-8 text-center">
          {isSignUp ? 'Create your account to squad up' : 'Find your perfect squad'}
        </p>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-center">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-center">
            {successMsg}
          </div>
        )}

        {/* Standard Email/Password Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-500"
              placeholder="Email address"
            />
          </div>

          <div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-500"
              placeholder="Password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-60 text-white py-3 rounded-xl font-bold transition flex items-center justify-center shadow-lg shadow-cyan-500/20 mt-2"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isSignUp ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Toggle between Sign In / Sign Up */}
        <div className="mt-6 text-center text-sm text-slate-400">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors bg-transparent border-none p-0 cursor-pointer"
          >
            {isSignUp ? 'Sign In' : 'Sign Up Free'}
          </button>
        </div>

      </div>
    </div>
  );
}

// Next.js requires components utilizing useSearchParams or dynamic router functions to be wrapped in Suspense in some edge cases.
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
      <LoginForm />
    </Suspense>
  );
}