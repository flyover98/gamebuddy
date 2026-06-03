'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Ensure this path matches your project structure
import { useRouter } from 'next/navigation';

// 🛠️ FIX: Mapped UI labels to exact database slugs
const GAMES = [
  { label: 'Valorant', value: 'valorant' },
  { label: 'BGMI', value: 'bgmi' },
  { label: 'Counter-Strike 2', value: 'cs2' },
  { label: 'Free Fire', value: 'freefire' },
  { label: 'League of Legends', value: 'lol' },
  { label: 'Apex Legends', value: 'apex' },
];

const REGIONS = ['Asia', 'South Asia', 'Europe', 'North America', 'South America'];
const PLAYSTYLES = ['Casual', 'Competitive', 'Coach'];

export default function CreateProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    username: '',
    display_name: '',
    discord_tag: '',
    bio: '',
    primary_game: 'valorant', // 🛠️ FIX: Default to the 'valorant' slug, not capital 'Valorant'
    current_rank: '',
    region: 'Asia',
    playstyle: 'Casual',
    mic_available: false,
    hours_per_week: 10,
  });

  // Guard: redirect to login if not authenticated
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      // If profile already exists, go to dashboard
      const { data: profile } = await supabase
        .from('player_profiles')
        .select('id, username')
        .eq('id', user.id)
        .single();

      if (profile) {
        router.replace('/dashboard');
        return;
      }
      setChecking(false);
    }
    checkAuth();
  }, [router]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    // Use upsert so re-submitting doesn't fail
    const { error: dbError } = await supabase
      .from('player_profiles')
      .upsert({ id: user.id, ...form }, { onConflict: 'id' });

    if (dbError) {
      setError(dbError.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-8 relative overflow-hidden">
      {/* Background glow to match the login page */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-600/10 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-8 w-full max-w-lg relative z-10 shadow-2xl">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">Create Your Profile</h1>
        <p className="text-slate-400 text-sm mb-6">Set up your gamer card so others can find you</p>

        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Username *</label>
            <input name="username" required value={form.username} onChange={handleChange}
              placeholder="e.g. ProSniper99"
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"/>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Discord Tag *</label>
            <input name="discord_tag" required value={form.discord_tag} onChange={handleChange}
              placeholder="e.g. username#1234"
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"/>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Bio</label>
            <textarea name="bio" value={form.bio} onChange={handleChange} rows={2}
              placeholder="Tell others about your playstyle..."
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-none"/>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Primary Game *</label>
              <select name="primary_game" value={form.primary_game} onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-white">
                {GAMES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Current Rank *</label>
              <input name="current_rank" required value={form.current_rank} onChange={handleChange}
                placeholder="e.g. Gold 2"
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Region *</label>
              <select name="region" value={form.region} onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-white">
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Playstyle *</label>
              <select name="playstyle" value={form.playstyle} onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-white">
                {PLAYSTYLES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Hours per week</label>
            <input type="number" name="hours_per_week" min="1" max="168"
              value={form.hours_per_week} onChange={handleChange}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"/>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input type="checkbox" name="mic_available" id="mic" checked={form.mic_available} onChange={handleChange}
              className="w-4 h-4 accent-cyan-500 rounded border-white/10 bg-black/50"/>
            <label htmlFor="mic" className="text-sm font-medium text-slate-300 cursor-pointer">I have a working microphone</label>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] mt-4">
            {loading ? 'Transmitting Data...' : 'Create My Profile →'}
          </button>
        </form>
      </div>
    </div>
  );
}