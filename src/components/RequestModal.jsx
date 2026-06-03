'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import OnlineBadge from './OnlineBadge';

/**
 * RequestModal — confirmation dialog before sending a buddy request.
 *
 * Props:
 *   buddy      (object|null)  — the player to send a request to.
 *                               Pass null to close the modal.
 *   onClose    (fn)           — called when modal is dismissed
 *   onSent     (fn)           — called after request is successfully sent
 *
 * Usage (in BuddyCard):
 *   <RequestModal buddy={selectedBuddy} onClose={() => setSelectedBuddy(null)} onSent={() => setRequested(true)} />
 */

const MAX_MESSAGE_LENGTH = 120;

const playstyleColor = {
  Competitive: 'text-red-400 bg-red-400/10',
  Casual: 'text-green-400 bg-green-400/10',
  Coach: 'text-yellow-400 bg-yellow-400/10',
};

export default function RequestModal({ buddy, onClose, onSent }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);
  const overlayRef = useRef(null);

  // Pre-fill a default message when buddy changes
  useEffect(() => {
    if (buddy) {
      setMessage(`Hey! Let's play ${buddy.primary_game} together. 🎮`);
      setError(null);
      setSending(false);
      // Focus textarea after modal opens
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [buddy]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Close on overlay click
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleSend = async () => {
    if (!buddy || sending) return;
    setSending(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('You need to be logged in.'); setSending(false); return; }

      // ── Duplicate check ──────────────────────────────────────────────
      // Checks both directions so neither user can double-request
      const { data: existing } = await supabase
        .from('buddy_requests')
        .select('id, status')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${buddy.id}),` +
          `and(sender_id.eq.${buddy.id},receiver_id.eq.${user.id})`
        )
        .in('status', ['pending', 'accepted'])
        .maybeSingle();

      if (existing) {
        setError(
          existing.status === 'accepted'
            ? 'You are already buddies! 🎉'
            : 'You already have a pending request with this player.'
        );
        setSending(false);
        return;
      }

      // ── Send request ─────────────────────────────────────────────────
      const { error: insertError } = await supabase
        .from('buddy_requests')
        .insert({
          sender_id: user.id,
          receiver_id: buddy.id,
          message: message.trim() || null,
        });

      if (insertError) throw insertError;

      onSent?.();
      onClose();
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('[RequestModal]', err.message);
    } finally {
      setSending(false);
    }
  };

  // Don't render if no buddy selected
  if (!buddy) return null;

  const charsLeft = MAX_MESSAGE_LENGTH - message.length;

  return (
    // ── Overlay ───────────────────────────────────────────────────────
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      {/* Modal box */}
      <div className="w-full max-w-md bg-[#0f0f0f] border border-slate-800 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-bold text-white">Send Buddy Request</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Player preview */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-base font-bold text-white">
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
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-white text-sm">{buddy.username}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${playstyleColor[buddy.playstyle] || 'text-slate-400 bg-slate-800'}`}>
                {buddy.playstyle}
              </span>
            </div>
            <p className="text-xs text-cyan-400 mt-0.5">{buddy.primary_game} · {buddy.current_rank}</p>
            <p className="text-xs text-slate-500">{buddy.region}</p>
          </div>
        </div>

        {/* Message field */}
        <div className="px-5 py-4">
          <label className="block text-xs font-medium text-slate-400 mb-2">
            Add a message <span className="text-slate-600">(optional)</span>
          </label>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              if (e.target.value.length <= MAX_MESSAGE_LENGTH) setMessage(e.target.value);
            }}
            rows={3}
            placeholder={`Hey! Let's play ${buddy.primary_game} together.`}
            className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500/60 focus:outline-none rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 resize-none transition"
          />
          <div className="flex items-center justify-between mt-1.5">
            {error ? (
              <p className="text-xs text-red-400">{error}</p>
            ) : (
              <span />
            )}
            <p className={`text-xs ml-auto ${charsLeft < 20 ? 'text-yellow-400' : 'text-slate-600'}`}>
              {charsLeft}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm text-slate-300 border border-slate-700 hover:bg-slate-800 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-[#050505] bg-gradient-to-r from-cyan-400 to-blue-500 hover:opacity-90 disabled:opacity-50 transition"
          >
            {sending ? 'Sending...' : 'Send Request 🤝'}
          </button>
        </div>

      </div>
    </div>
  );
}
