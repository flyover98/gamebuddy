import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * useBuddies — fetches all accepted buddy connections for the current user.
 *
 * It handles both directions:
 *   - Requests the user SENT that were accepted (sender_id = user.id)
 *   - Requests the user RECEIVED that were accepted (receiver_id = user.id)
 *
 * Returns a unified list of buddy profiles, plus helpers to remove a buddy
 * and a real-time subscription that keeps the list live.
 *
 * Usage:
 *   const { buddies, loading, error, removeBuddy, refresh } = useBuddies(userId);
 */
export function useBuddies(userId) {
  const [buddies, setBuddies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── Core fetch ───────────────────────────────────────────────────────────
  const fetchBuddies = useCallback(async () => {
    if (!userId) {
      setBuddies([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch accepted requests where the user is either sender OR receiver.
      // We do two queries (Supabase doesn't support OR on foreign-key joins)
      // and merge the results.

      const [sentRes, receivedRes] = await Promise.all([
        // Requests I sent that were accepted — get the receiver's profile
        supabase
          .from('buddy_requests')
          .select(`
            id,
            created_at,
            message,
            buddy:receiver_id (
              id,
              username,
              display_name,
              primary_game,
              current_rank,
              region,
              playstyle,
              discord_tag,
              bio,
              is_online,
              last_seen,
              mic_available,
              hours_per_week
            )
          `)
          .eq('sender_id', userId)
          .eq('status', 'accepted'),

        // Requests I received that were accepted — get the sender's profile
        supabase
          .from('buddy_requests')
          .select(`
            id,
            created_at,
            message,
            buddy:sender_id (
              id,
              username,
              display_name,
              primary_game,
              current_rank,
              region,
              playstyle,
              discord_tag,
              bio,
              is_online,
              last_seen,
              mic_available,
              hours_per_week
            )
          `)
          .eq('receiver_id', userId)
          .eq('status', 'accepted'),
      ]);

      if (sentRes.error) throw sentRes.error;
      if (receivedRes.error) throw receivedRes.error;

      // Merge both directions into one list
      const allRows = [
        ...(sentRes.data || []),
        ...(receivedRes.data || []),
      ];

      // Deduplicate by buddy profile id (edge case: two rows for same pair)
      const seen = new Set();
      const uniqueBuddies = [];
      for (const row of allRows) {
        if (row.buddy && !seen.has(row.buddy.id)) {
          seen.add(row.buddy.id);
          uniqueBuddies.push({
            requestId: row.id,         // the buddy_request row id (for removal)
            connectedAt: row.created_at,
            ...row.buddy,              // spread all profile fields directly
          });
        }
      }

      // Sort: online first, then by most recently connected
      uniqueBuddies.sort((a, b) => {
        if (a.is_online !== b.is_online) return a.is_online ? -1 : 1;
        return new Date(b.connectedAt) - new Date(a.connectedAt);
      });

      setBuddies(uniqueBuddies);
    } catch (err) {
      console.error('[useBuddies] fetch error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ─── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchBuddies();
  }, [fetchBuddies]);

  // ─── Real-time subscription ───────────────────────────────────────────────
  // Listen for any change to buddy_requests rows that involve this user.
  // When a request gets accepted (or removed), re-fetch the list.
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`buddies-for-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',                  // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'buddy_requests',
          filter: `sender_id=eq.${userId}`,
        },
        () => fetchBuddies()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'buddy_requests',
          filter: `receiver_id=eq.${userId}`,
        },
        () => fetchBuddies()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchBuddies]);

  // ─── Remove buddy ─────────────────────────────────────────────────────────
  // Marks the buddy_request row as 'removed' (soft delete).
  // Optimistically removes the buddy from local state so the UI is instant.
  const removeBuddy = useCallback(async (requestId) => {
    // Optimistic update
    setBuddies(prev => prev.filter(b => b.requestId !== requestId));

    const { error: removeError } = await supabase
      .from('buddy_requests')
      .update({ status: 'removed' })
      .eq('id', requestId);

    if (removeError) {
      console.error('[useBuddies] removeBuddy error:', removeError.message);
      // Roll back the optimistic update on failure
      fetchBuddies();
    }
  }, [fetchBuddies]);

  return {
    buddies,      // array of buddy profiles (each has all player_profiles fields)
    loading,      // true while initial fetch is in progress
    error,        // string | null
    removeBuddy,  // (requestId: string) => Promise<void>
    refresh: fetchBuddies, // manual refresh trigger
  };
}
