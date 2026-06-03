'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '../hooks/useNotifications';

// ─── Time ago helper ──────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Single notification row ──────────────────────────────────────────────
function NotifRow({ notif, onMarkRead }) {
  const router = useRouter();

  const icon = notif.type === 'NEW_REQUEST' ? '🤝' : '✅';
  const accent = notif.type === 'NEW_REQUEST' ? 'text-cyan-400' : 'text-green-400';

  const handleClick = () => {
    onMarkRead(notif.id);
    router.push('/dashboard');
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left px-4 py-3 hover:bg-slate-800/60 transition flex items-start gap-3 ${
        !notif.read ? 'bg-slate-800/30' : ''
      }`}
    >
      {/* Unread dot */}
      <div className="mt-1 shrink-0 w-2 h-2 rounded-full">
        {!notif.read && <div className="w-2 h-2 rounded-full bg-cyan-400" />}
      </div>

      {/* Icon */}
      <span className="text-base shrink-0 mt-0.5">{icon}</span>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${!notif.read ? 'text-white' : 'text-slate-300'}`}>
          {notif.message}
        </p>
        {notif.subtext && (
          <p className={`text-xs mt-0.5 truncate ${accent}`}>{notif.subtext}</p>
        )}
        <p className="text-xs text-slate-500 mt-1">{timeAgo(notif.createdAt)}</p>
      </div>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────
/**
 * NotificationBell — drop-in bell icon for any header/navbar.
 *
 * Props:
 *   userId  (string)  — current authenticated user's id
 *
 * Usage:
 *   <NotificationBell userId={user.id} />
 */
export default function NotificationBell({ userId }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(userId);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleOutsideClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  // Mark all read when dropdown opens
  const handleOpen = () => {
    setOpen(prev => !prev);
  };

  const handleMarkAllRead = (e) => {
    e.stopPropagation();
    markAllRead();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
      >
        {/* Bell icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-cyan-500 text-[#050505] text-[10px] font-black rounded-full flex items-center justify-center px-1 leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-11 w-80 bg-[#0f0f0f] border border-slate-800 rounded-2xl shadow-2xl shadow-black/60 z-50 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <span className="text-sm font-bold text-white">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div className="text-3xl mb-2">🔔</div>
                <p className="text-sm text-slate-500">No notifications yet</p>
                <p className="text-xs text-slate-600 mt-1">You'll see buddy requests and acceptances here</p>
              </div>
            ) : (
              notifications.map(notif => (
                <NotifRow
                  key={`${notif.type}-${notif.id}`}
                  notif={notif}
                  onMarkRead={(id) => { markRead(id); setOpen(false); }}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-800 px-4 py-2.5">
              <button
                onClick={() => { setOpen(false); }}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition py-1"
              >
                View Dashboard →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
