'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import BuddyCard from '../components/BuddyCard';
import FilterBar from '../components/FilterBar';

export default function Home() {
  const router = useRouter();
  const [buddies, setBuddies] = useState([]);
  const [filters, setFilters] = useState({ game: 'All', region: 'All', playstyle: 'All', onlineOnly: false });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [user, setUser] = useState(null);

  // Get current user for nav buttons
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchBuddies() {
      setLoading(true);
      try {
        let query = supabase
          .from('player_profiles')
          .select('*')
          .order('is_online', { ascending: false })
          .order('last_seen', { ascending: false });

        if (filters.game !== 'All') query = query.eq('primary_game', filters.game);
        if (filters.region !== 'All') query = query.eq('region', filters.region);
        if (filters.playstyle !== 'All') query = query.eq('playstyle', filters.playstyle);
        if (filters.onlineOnly) query = query.eq('is_online', true);
        if (search) query = query.ilike('username', `%${search}%`);

        const { data, error } = await query.limit(48);
        if (error) throw error;
        setBuddies(data || []);
      } catch (err) {
        console.error('Error fetching players:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchBuddies();
  }, [filters, search]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div className="relative min-h-screen bg-[#050505] text-slate-200 selection:bg-cyan-500/30 font-sans overflow-hidden">
      
      {/* Ambient Background Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-600/20 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

      {/* Glassmorphism Navbar */}
      <header className="fixed top-0 w-full z-50 bg-[#050505]/60 backdrop-blur-xl border-b border-white/[0.05] shadow-2xl shadow-black/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300">
              <span className="text-xl text-white drop-shadow-md">🎮</span>
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-white">
              Game<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Buddy</span>
            </h1>
          </div>
          
          <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Find Players</a>
            <a href="#" className="hover:text-white transition-colors">Tournaments</a>
            <a href="#" className="hover:text-white transition-colors">Leaderboards</a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="hidden sm:block px-5 py-2.5 rounded-full text-sm font-bold text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-5 py-2.5 rounded-full text-sm font-bold text-[#050505] bg-gradient-to-r from-cyan-400 to-blue-500 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all duration-300"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push('/login')}
                  className="hidden sm:block px-5 py-2.5 rounded-full text-sm font-bold text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="px-5 py-2.5 rounded-full text-sm font-bold text-[#050505] bg-gradient-to-r from-cyan-400 to-blue-500 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all duration-300"
                >
                  Create Profile
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="relative pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mt-10 mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Live Matchmaking Network
          </div>
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-[1.1]">
            Build your ultimate <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
              competitive squad.
            </span>
          </h2>
          <p className="text-lg text-slate-400 font-medium max-w-xl mx-auto leading-relaxed">
            Stop rolling the dice with randoms. Connect with verified players, match your playstyle, and dominate the lobby.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="sticky top-24 z-40 bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-2 mb-10 shadow-2xl flex flex-col md:flex-row gap-2">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by gamertag or username..."
              className="w-full bg-white/[0.03] hover:bg-white/[0.05] border-none rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
            />
          </div>
          <div className="w-px bg-white/10 hidden md:block my-2 mx-1" />
          <div className="flex-1 md:flex-none">
            <FilterBar filters={filters} setFilters={setFilters} />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="relative overflow-hidden bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 h-56 flex flex-col justify-between">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.05]" />
                  <div className="space-y-3 flex-1">
                    <div className="h-5 bg-white/[0.05] rounded-lg w-3/4" />
                    <div className="h-4 bg-white/[0.05] rounded-lg w-1/2" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="h-6 bg-white/[0.05] rounded-lg w-16" />
                    <div className="h-6 bg-white/[0.05] rounded-lg w-20" />
                  </div>
                  <div className="h-10 bg-white/[0.05] rounded-xl w-full mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : buddies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {buddies.map(buddy => (
              <BuddyCard key={buddy.id} buddy={buddy} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
            <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-b from-slate-800 to-[#050505] border border-white/5 flex items-center justify-center shadow-inner">
              <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">The lobby is completely empty.</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">
              {search || filters.game !== 'All' 
                ? "No operators found with these parameters. Try adjusting your filters." 
                : "You are the first one here. Create the inaugural profile on the network."}
            </p>
            <button
              onClick={() => router.push(user ? '/profile/create' : '/login')}
              className="px-8 py-3 rounded-full text-sm font-bold text-[#050505] bg-white hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] transition-all duration-300"
            >
              Create First Profile
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
