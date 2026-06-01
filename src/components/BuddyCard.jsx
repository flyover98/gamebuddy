'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const playstyleColor = { Competitive: 'text-red-400 bg-red-400/10', Casual: 'text-green-400 bg-green-400/10', Coach: 'text-yellow-400 bg-yellow-400/10' };

export default function BuddyCard({ buddy }) {
  const [requested, setRequested] = useState(false);

  const sendRequest = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Log in to send requests');
    await supabase.from('buddy_requests').insert({ sender_id: user.id, receiver_id: buddy.id, message: `Hey! Let's play ${buddy.primary_game} together.` });
    setRequested(true);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-cyan-500/50 transition group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-sm font-bold">
              {buddy.username[0].toUpperCase()}
            </div>
            {buddy.is_online && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900"/>}
          </div>
          <div>
            <p className="font-semibold text-sm">{buddy.username}</p>
            <p className="text-xs text-slate-400">{buddy.region}</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${playstyleColor[buddy.playstyle]}`}>
          {buddy.playstyle}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-cyan-400 text-xs font-semibold uppercase tracking-wide">{buddy.primary_game}</p>
        <p className="text-slate-300 text-sm">{buddy.current_rank}</p>
        {buddy.bio && <p className="text-slate-400 text-xs mt-1 line-clamp-2">{buddy.bio}</p>}
      </div>

      <div className="flex items-center justify-between">
        <div className="bg-slate-800 rounded-lg px-3 py-1.5">
          <p className="text-xs text-slate-400">Discord</p>
          <code className="text-xs text-yellow-400 font-mono">{buddy.discord_tag}</code>
        </div>
        <button onClick={sendRequest} disabled={requested}
          className="text-xs bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-400 text-white px-3 py-1.5 rounded-lg transition font-medium">
          {requested ? 'Sent ✓' : '+ Buddy'}
        </button>
      </div>
    </div>
  );
}