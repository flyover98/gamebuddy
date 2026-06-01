'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useParams } from 'next/navigation';

export default function PublicProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('player_profiles')
        .select('*')
        .eq('username', username)
        .single();
      setProfile(data);
      setLoading(false);
    }
    load();
  }, [username]);

  const sendRequest = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Log in to send requests');
    await supabase.from('buddy_requests').insert({
      sender_id: user.id,
      receiver_id: profile.id,
      message: `Hey! Let's play ${profile.primary_game} together.`
    });
    setRequested(true);
  };

  if (loading) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading...</div>;
  if (!profile) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Player not found.</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 flex items-center justify-center">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-md">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-2xl font-bold">
            {profile.username[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold">{profile.username}</h1>
            <p className="text-slate-400 text-sm">{profile.region}</p>
            {profile.is_online && <span className="text-xs text-green-400 font-medium">● Online now</span>}
          </div>
        </div>

        {profile.bio && <p className="text-slate-300 text-sm mb-6 border-l-2 border-cyan-500 pl-3">{profile.bio}</p>}

        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Game</span>
            <span className="text-cyan-400 font-medium">{profile.primary_game}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Rank</span>
            <span>{profile.current_rank}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Playstyle</span>
            <span>{profile.playstyle}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Mic</span>
            <span>{profile.mic_available ? '✅ Yes' : '❌ No'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Hours/week</span>
            <span>{profile.hours_per_week}h</span>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-3 text-center mb-4">
          <p className="text-xs text-slate-400 mb-1">Discord</p>
          <code className="text-yellow-400 font-mono text-sm">{profile.discord_tag}</code>
        </div>

        <button onClick={sendRequest} disabled={requested}
          className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-400 text-white py-3 rounded-xl font-semibold transition">
          {requested ? 'Request Sent ✓' : '+ Send Buddy Request'}
        </button>
      </div>
    </div>
  );
}