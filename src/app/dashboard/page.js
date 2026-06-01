// src/app/dashboard/page.js
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);

      const { data } = await supabase
        .from('buddy_requests')
        .select('*, sender:sender_id(username, primary_game, discord_tag)')
        .eq('receiver_id', user.id)
        .eq('status', 'pending');
      setRequests(data || []);
    }
    load();
  }, []);

  const handleRequest = async (id, status) => {
    await supabase.from('buddy_requests').update({ status }).eq('id', id);
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-2xl font-bold text-cyan-400 mb-6">🎮 My Dashboard</h1>

      <section>
        <h2 className="text-lg font-semibold mb-4">Incoming Buddy Requests</h2>
        {requests.length === 0
          ? <p className="text-slate-400">No pending requests.</p>
          : requests.map(r => (
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
        }
      </section>
    </div>
  );
}