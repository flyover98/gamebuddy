// src/app/profile/create/page.js
'use client';
import { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

const GAMES = ['Valorant', 'BGMI', 'Free Fire', 'Counter-Strike 2'];
const REGIONS = ['Asia', 'South Asia', 'Europe', 'North America', 'South America'];
const PLAYSTYLES = ['Casual', 'Competitive', 'Coach'];

export default function CreateProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: '',
    display_name: '',
    discord_tag: '',
    bio: '',
    primary_game: 'Valorant',
    current_rank: '',
    region: 'Asia',
    playstyle: 'Casual',
    mic_available: false,
    hours_per_week: 10,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { error } = await supabase.from('player_profiles').insert({ id: user.id, ...form });

    if (error) {
      alert('Error: ' + error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-8">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold text-cyan-400 mb-2">Create Your Profile</h1>
        <p className="text-slate-400 text-sm mb-6">Set up your gamer card so others can find you</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Username *</label>
            <input name="username" required value={form.username} onChange={handleChange}
              placeholder="e.g. ProSniper99"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-cyan-500"/>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Discord Tag *</label>
            <input name="discord_tag" required value={form.discord_tag} onChange={handleChange}
              placeholder="e.g. username#1234"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-cyan-500"/>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Bio</label>
            <textarea name="bio" value={form.bio} onChange={handleChange} rows={2}
              placeholder="Tell others about your playstyle..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-cyan-500 resize-none"/>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Primary Game *</label>
              <select name="primary_game" value={form.primary_game} onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-cyan-500">
                {GAMES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Current Rank *</label>
              <input name="current_rank" required value={form.current_rank} onChange={handleChange}
                placeholder="e.g. Gold 2"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-cyan-500"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Region *</label>
              <select name="region" value={form.region} onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-cyan-500">
                {REGIONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Playstyle *</label>
              <select name="playstyle" value={form.playstyle} onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-cyan-500">
                {PLAYSTYLES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" name="mic_available" id="mic" checked={form.mic_available} onChange={handleChange}
              className="w-4 h-4 accent-cyan-500"/>
            <label htmlFor="mic" className="text-sm text-slate-300">I have a mic</label>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white py-3 rounded-xl font-semibold transition mt-2">
            {loading ? 'Saving...' : 'Create My Profile →'}
          </button>
        </form>
      </div>
    </div>
  );
}