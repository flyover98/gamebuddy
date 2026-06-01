'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import BuddyCard from '../components/BuddyCard';
import FilterBar from '../components/FilterBar';

export default function Home() {
  const [buddies, setBuddies] = useState([]);
  const [filters, setFilters] = useState({ game: 'All', region: 'All', playstyle: 'All', onlineOnly: false });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchBuddies() {
      setLoading(true);
      let query = supabase.from('player_profiles').select('*').order('is_online', { ascending: false }).order('last_seen', { ascending: false });

      if (filters.game !== 'All') query = query.eq('primary_game', filters.game);
      if (filters.region !== 'All') query = query.eq('region', filters.region);
      if (filters.playstyle !== 'All') query = query.eq('playstyle', filters.playstyle);
      if (filters.onlineOnly) query = query.eq('is_online', true);
      if (search) query = query.ilike('username', `%${search}%`);

      const { data } = await query.limit(48);
      setBuddies(data || []);
      setLoading(false);
    }
    fetchBuddies();
  }, [filters, search]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 px-8 py-4 flex justify-between items-center sticky top-0 bg-slate-950/80 backdrop-blur z-10">
        <h1 className="text-xl font-bold text-cyan-400">🎮 GameBuddy</h1>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search players..."
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm w-64 focus:outline-none focus:border-cyan-500"/>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        <FilterBar filters={filters} setFilters={setFilters} />
        {loading
          ? <div className="text-slate-400 text-center py-20">Loading players...</div>
          : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
              {buddies.map(buddy => <BuddyCard key={buddy.id} buddy={buddy} />)}
            </div>
        }
      </main>
    </div>
  );
}