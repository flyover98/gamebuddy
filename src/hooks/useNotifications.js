import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * useNotifications — real-time notification feed for the current user.
 *
 * Tracks two event types:
 *   1. NEW_REQUEST   — someone sent you a buddy request
 *   2. REQUEST_ACCEPTED — someone accepted your buddy request
 *
 * Each notification object shape:
 * {
 *   id: string,           // buddy_requests row id
 *   type: 'NEW_REQUEST' | 'REQUEST_ACCEPTED',
 *   read: boolean,
 *   createdAt: string,
 *   message: string,      // display text e.g. "ProSniper wants to buddy up"
 *   actor: {              // the other person
 *     id, username, primary_game, current_rank, discord_tag
 *   }
 * }
 *
 * Usage:
 *   const { notifications, unreadCount, markRead, markAllRead, clear } = useNotifications(userId);
 */
export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const addNotification = useCallback((notif) => {
    setNotifications(prev => {
      // Avoid duplicates (e.g. optimistic + real-time firing together)
      if (prev.some(n => n.id === notif.id && n.type === notif.type)) return prev;
      return [notif, ...prev].slice(0, 50); // cap at 50
    });
  }, []);

  // ─── Load recent notifications on mount ──────────────────────────────────
  // Fetches the last 20 buddy_request rows relevant to this user
  // that were created in the last 7 days (avoids flooding old users)
  useEffect(() => {
    if (!userId) return;

    async function loadRecent() {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Requests I RECEIVED (new request notifications)
      const { data: received } = await supabase
        .from('buddy_requests')
        .select('id, status, message, created_at, sender:sender_id(id, username, primary_game, current_rank, discord_tag)')
        .eq('receiver_id', userId)
        .in('status', ['pending', 'accepted', 'declined'])
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(20);

      // Requests I SENT that were accepted (acceptance notifications)
      const { data: accepted } = await supabase
        .from('buddy_requests')
        .select('id, status, message, created_at, receiver:receiver_id(id, username, primary_game, current_rank, discord_tag)')
        .eq('sender_id', userId)
        .eq('status', 'accepted')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(20);

      const all = [];

      for (const row of received || []) {
        if (!row.sender) continue;
        all.push({
          id: row.id,
          type: 'NEW_REQUEST',
          read: row.status !== 'pending', // treat non-pending as already actioned
          createdAt: row.created_at,
          message: `${row.sender.username} wants to buddy up`,
          subtext: row.message || null,
          actor: row.sender,
        });
      }

      for (const row of accepted || []) {
        if (!row.receiver) continue;
        all.push({
          id: row.id,
          type: 'REQUEST_ACCEPTED',
          read: false,
          createdAt: row.created_at,
          message: `${row.receiver.username} accepted your request!`,
          subtext: `${row.receiver.primary_game} · ${row.receiver.current_rank}`,
          actor: row.receiver,
        });
      }

      // Sort by date descending and cap at 50
      all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(all.slice(0, 50));
    }

    loadRecent();
  }, [userId]);

  // ─── Real-time: someone sends me a request ────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notif-incoming-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'buddy_requests',
          filter: `receiver_id=eq.${userId}`,
        },
        async (payload) => {
          // Fetch sender profile
          const { data: row } = await supabase
            .from('buddy_requests')
            .select('id, message, created_at, sender:sender_id(id, username, primary_game, current_rank, discord_tag)')
            .eq('id', payload.new.id)
            .single();

          if (!row?.sender) return;

          addNotification({
            id: row.id,
            type: 'NEW_REQUEST',
            read: false,
            createdAt: row.created_at,
            message: `${row.sender.username} wants to buddy up`,
            subtext: row.message || null,
            actor: row.sender,
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId, addNotification]);

  // ─── Real-time: someone accepts my request ────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notif-accepted-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'buddy_requests',
          filter: `sender_id=eq.${userId}`,
        },
        async (payload) => {
          if (payload.new.status !== 'accepted') return;

          const { data: row } = await supabase
            .from('buddy_requests')
            .select('id, created_at, receiver:receiver_id(id, username, primary_game, current_rank, discord_tag)')
            .eq('id', payload.new.id)
            .single();

          if (!row?.receiver) return;

          addNotification({
            id: row.id,
            type: 'REQUEST_ACCEPTED',
            read: false,
            createdAt: row.created_at,
            message: `${row.receiver.username} accepted your request!`,
            subtext: `${row.receiver.primary_game} · ${row.receiver.current_rank}`,
            actor: row.receiver,
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId, addNotification]);

  // ─── Actions ──────────────────────────────────────────────────────────────
  const markRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clear = useCallback(() => setNotifications([]), []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,   // full list, newest first
    unreadCount,     // number shown on the bell badge
    markRead,        // (id) => void  — mark one as read
    markAllRead,     // () => void    — mark all as read
    clear,           // () => void    — wipe local list
  };
}
