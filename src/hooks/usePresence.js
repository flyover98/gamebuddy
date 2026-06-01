import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function usePresence(userId) {
  useEffect(() => {
    if (!userId) return;

    // Mark online
    supabase.from('player_profiles').update({ is_online: true, last_seen: new Date().toISOString() }).eq('id', userId);

    const channel = supabase.channel('online-users');
    channel.subscribe();

    // Mark offline on tab close
    const markOffline = () => supabase.from('player_profiles').update({ is_online: false }).eq('id', userId);
    window.addEventListener('beforeunload', markOffline);
    return () => {
      markOffline();
      supabase.removeChannel(channel);
      window.removeEventListener('beforeunload', markOffline);
    };
  }, [userId]);
}