'use client';
import { useState } from 'react';
import OnlineBadge from './OnlineBadge';
import RequestModal from './RequestModal';

const playstyleColor = {
  Competitive: 'text-red-400 bg-red-400/10',
  Casual: 'text-green-400 bg-green-400/10',
  Coach: 'text-yellow-400 bg-yellow-400/10',
};

export default function BuddyCard({ buddy }) {
  const [showModal, setShowModal] = useState(false);
  const [requested, setRequested] = useState(false);

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-cyan-500/50 transition group">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">

            {/* Avatar with OnlineBadge */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                {buddy.username[0].toUpperCase()}
              </div>
              <OnlineBadge
                isOnline={buddy.is_online}
                lastSeen={buddy.last_seen}
                size="sm"
                className="absolute -bottom-0.5 -right-0.5"
              />
            </div>

            <div>
              <p className="font-semibold text-sm text-white">{buddy.username}</p>
              <OnlineBadge
                isOnline={buddy.is_online}
                lastSeen={buddy.last_seen}
                size="sm"
                showLabel
                className="mt-0.5"
              />
            </div>
          </div>

          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${playstyleColor[buddy.playstyle] || 'text-slate-400 bg-slate-800'}`}>
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
          <button
            onClick={() => setShowModal(true)}
            disabled={requested}
            className="text-xs bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-400 text-white px-3 py-1.5 rounded-lg transition font-medium"
          >
            {requested ? 'Sent ✓' : '+ Buddy'}
          </button>
        </div>
      </div>

      {/* Modal — renders outside the card via React state */}
      <RequestModal
        buddy={showModal ? buddy : null}
        onClose={() => setShowModal(false)}
        onSent={() => setRequested(true)}
      />
    </>
  );
}
