'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useBuddies } from '@/hooks/useBuddies';
import { usePresence } from '@/hooks/usePresence';
// 1. Added the notification bell import right here 👇
import NotificationBell from '@/components/NotificationBell';

// ─── Playstyle badge colours ──────────────────────────────────────────────
const playstyleColor = {
  Competitive: 'text-red-400 bg-red-400/10',
  Casual: 'text-green-400 bg-green-400/10',
  Coach: 'text-yellow-400 bg-yellow-400/10',
};

// ─── Small reusable buddy card ────────────────────────────────────────────
function BuddyListCard({ buddy, onRemove }) {
  const [copied, setCopied] = useState(false);

  const copyDiscord = () => {
    navigator.clipboard.writeText(buddy.discord_tag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex items-center justify-between gap-4 transition group">
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
            {buddy.username[0].toUpperCase()}
          </div>
          {buddy.is_online && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900" />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-white truncate">{buddy.username}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${playstyleColor[buddy.playstyle] || 'text-slate-400 bg-slate-800'}`}>
              {buddy.playstyle}
            </span>
          </div>
          <p className="text-xs text-cyan-400 font-medium mt-0.5">{buddy.primary_game} · {buddy.current_rank}</p>
          <p className="text-xs text-slate-500 mt-0.5">{buddy.region}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={copyDiscord}
          title={buddy.discord_tag}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-yellow-400 font-mono px-3 py-1.5 rounded-lg transition max-w-[130px] truncate"
        >
          {copied ? '✓ Copied!' : buddy.discord_tag}
        </button>
        <button
          onClick={() => onRemove(buddy.requestId)}
          className="text-xs text-slate-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100 px-2 py-1.5 rounded-lg hover:bg-red-500/10"
          title="Remove buddy"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ─── Dashboard tab button ─────────────────────────────────────────────────
function Tab({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
        active
          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
      }`}
    >
      {label}
      {count > 0 && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-700 text-slate-300'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────
export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'buddies'
  const router = useRouter();

  // Use the new hook — pass null until user is known (hook handles it gracefully)
  const { buddies, loading: buddiesLoading, removeBuddy } = useBuddies(user?.id);
  usePresence(user?.id);

  useEffect(() => {
    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.replace('/login'); return; }
      setUser(authUser);

      // Load profile
      const { data: profileData } = await supabase
        .from('player_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (!profileData) { router.replace('/profile/create'); return; }
      setProfile(profileData);

      // Load pending buddy requests
      const { data: reqData } = await supabase
        .from('buddy_requests')
        .select('*, sender:sender_id(username, primary_game, discord_tag, region, playstyle)')
        .eq('receiver_id', authUser.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      setRequests(reqData || []);
      setLoadingPage(false);
    }
    load();
  }, [router]);

  // Real-time listener for new incoming requests
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`incoming-requests-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'buddy_requests',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          // Fetch full row with sender join
          const { data } = await supabase
            .from('buddy_requests')
            .select('*, sender:sender_id(username, primary_game, discord_tag, region, playstyle)')
            .eq('id', payload.new.id)
            .single();
          if (data) setRequests(prev => [data, ...prev]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.id]);

  const handleRequest = async (id, status) => {
    await supabase.from('buddy_requests').update({ status }).eq('id', id);
    setRequests(prev => prev.filter(r => r.id !== id));
    // If accepted, the useBuddies hook will auto-refresh via its real-time sub
    if (status === 'accepted') setActiveTab('buddies');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loadingPage) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="border-b border-slate-800/60 bg-[#050505]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-base">
              🎮
            </div>
            <span className="font-black tracking-tighter text-white text-lg">
              Game<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Buddy</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="px-4 py-2 text-sm text-slate-300 border border-slate-700 rounded-xl hover:bg-slate-800 transition">
              ← Browse
            </button>
            
            {/* 2. Dropped the Bell right here between the two buttons! 👇 */}
            <NotificationBell userId={user?.id} />

            <button onClick={handleSignOut} className="px-4 py-2 text-sm text-white bg-red-600/20 border border-red-500/30 rounded-xl hover:bg-red-600/40 transition">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* Profile summary card */}
        {profile && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-xl font-bold">
                  {profile.username[0].toUpperCase()}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{profile.username}</h1>
                  <p className="text-slate-400 text-sm mt-0.5">{profile.primary_game} · {profile.current_rank} · {profile.region}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-slate-800 rounded-xl px-4 py-2 text-center">
                  <p className="text-xs text-slate-400">Buddies</p>
                  <p className="text-lg font-bold text-cyan-400">{buddies.length}</p>
                </div>
                <div className="bg-slate-800 rounded-xl px-4 py-2 text-center">
                  <p className="text-xs text-slate-400">Pending</p>
                  <p className="text-lg font-bold text-yellow-400">{requests.length}</p>
                </div>
                <button
                  onClick={() => router.push('/profile/create')}
                  className="px-4 py-2 text-sm text-slate-300 border border-slate-700 rounded-xl hover:bg-slate-800 transition"
                >
                  Edit Profile
                </button>
              </div>
            </div>
            {profile.discord_tag && (
              <div className="mt-4 inline-flex items-center gap-2 bg-slate-800 rounded-xl px-4 py-2">
                <span className="text-xs text-slate-400">Discord</span>
                <code className="text-sm text-yellow-400 font-mono">{profile.discord_tag}</code>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <Tab
            label="Buddy Requests"
            count={requests.length}
            active={activeTab === 'requests'}
            onClick={() => setActiveTab('requests')}
          />
          <Tab
            label="My Buddies"
            count={buddies.length}
            active={activeTab === 'buddies'}
            onClick={() => setActiveTab('buddies')}
          />
        </div>

        {/* ── Buddy Requests tab ─────────────────────────────────────── */}
        {activeTab === 'requests' && (
          <section>
            {requests.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-slate-400 font-medium">No pending requests</p>
                <p className="text-slate-600 text-sm mt-1">When someone sends you a buddy request, it'll show up here in real-time.</p>
                <button
                  onClick={() => router.push('/')}
                  className="mt-6 px-6 py-2.5 rounded-full text-sm font-bold text-[#050505] bg-gradient-to-r from-cyan-400 to-blue-500 transition"
                >
                  Browse Players
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map(r => (
                  <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-sm font-bold shrink-0">
                        {r.sender?.username?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-white">{r.sender?.username}</p>
                        <p className="text-xs text-cyan-400">{r.sender?.primary_game} · {r.sender?.region}</p>
                        {r.message && (
                          <p className="text-xs text-slate-400 mt-1 italic truncate max-w-xs">"{r.message}"</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <code className="text-xs text-yellow-400 font-mono bg-slate-800 px-2 py-1 rounded hidden sm:block">
                        {r.sender?.discord_tag}
                      </code>
                      <button
                        onClick={() => handleRequest(r.id, 'accepted')}
                        className="bg-green-600 hover:bg-green-500 text-white text-sm px-4 py-2 rounded-lg transition font-medium"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRequest(r.id, 'declined')}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm px-4 py-2 rounded-lg transition"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── My Buddies tab ─────────────────────────────────────────── */}
        {activeTab === 'buddies' && (
          <section>
            {buddiesLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 h-16 animate-pulse" />
                ))}
              </div>
            ) : buddies.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
                <div className="text-4xl mb-3">🎮</div>
                <p className="text-slate-400 font-medium">No buddies yet</p>
                <p className="text-slate-600 text-sm mt-1">Accept a request or find players and send one.</p>
                <button
                  onClick={() => router.push('/')}
                  className="mt-6 px-6 py-2.5 rounded-full text-sm font-bold text-[#050505] bg-gradient-to-r from-cyan-400 to-blue-500 transition"
                >
                  Find Players
                </button>
              </div>
            ) : (
              <>
                {/* Online / offline grouping */}
                {['online', 'offline'].map(group => {
                  const list = buddies.filter(b => group === 'online' ? b.is_online : !b.is_online);
                  if (list.length === 0) return null;
                  return (
                    <div key={group} className="mb-6">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                        {group === 'online'
                          ? <><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Online — {list.length}</>
                          : <>Offline — {list.length}</>
                        }
                      </p>
                      <div className="space-y-2">
                        {list.map(buddy => (
                          <BuddyListCard key={buddy.id} buddy={buddy} onRemove={removeBuddy} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </section>
        )}

      </main>
    </div>
  );
}