'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      setUser(user);

      // Load profile
      const { data: profileData } = await supabase
        .from('player_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profileData) {
        // No profile yet — send them to create one
        router.replace('/profile/create');
        return;
      }
      setProfile(profileData);

      // Load buddy requests
      const { data: reqData } = await supabase
        .from('buddy_requests')
        .select('*, sender:sender_id(username, primary_game, discord_tag)')
        .eq('receiver_id', user.id)
        .eq('status', 'pending');
      setRequests(reqData || []);
      setLoading(false);
    }
    load();
  }, [router]);

  const handleRequest = async (id, status) => {
    await supabase.from('buddy_requests').update({ status }).eq('id', id);
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-cyan-400">🎮 My Dashboard</h1>
          {profile && (
            <p className="text-slate-400 text-sm mt-1">Welcome back, <span className="text-white font-semibold">{profile.username}</span></p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-sm text-slate-300 border border-slate-700 rounded-xl hover:bg-slate-800 transition"
          >
            ← Browse Players
          </button>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm text-white bg-red-600/20 border border-red-500/30 rounded-xl hover:bg-red-600/40 transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Profile Summary */}
      {profile && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 text-white">Your Profile</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-400 text-xs mb-1">Game</p>
              <p className="text-cyan-400 font-semibold">{profile.primary_game}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Rank</p>
              <p className="font-semibold">{profile.current_rank}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Region</p>
              <p className="font-semibold">{profile.region}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Playstyle</p>
              <p className="font-semibold">{profile.playstyle}</p>
            </div>
          </div>
          <div className="mt-4 bg-slate-800 rounded-lg px-4 py-3 inline-block">
            <p className="text-xs text-slate-400 mb-0.5">Discord</p>
            <code className="text-yellow-400 font-mono text-sm">{profile.discord_tag}</code>
          </div>
        </div>
      )}

      {/* Buddy Requests */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Incoming Buddy Requests</h2>
        {requests.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <p className="text-slate-500">No pending buddy requests yet.</p>
            <p className="text-slate-600 text-sm mt-1">Go browse players and send some requests!</p>
          </div>
        ) : (
          requests.map(r => (
            <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-3 flex items-center justify-between">
              <div>
                <p className="font-semibold">{r.sender?.username}</p>
                <p className="text-sm text-slate-400">{r.sender?.primary_game} • {r.sender?.discord_tag}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleRequest(r.id, 'accepted')}
                  className="bg-green-600 hover:bg-green-500 text-white text-sm px-3 py-1.5 rounded-lg transition">
                  Accept
                </button>
                <button onClick={() => handleRequest(r.id, 'declined')}
                  className="bg-slate-700 hover:bg-slate-600 text-white text-sm px-3 py-1.5 rounded-lg transition">
                  Decline
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
