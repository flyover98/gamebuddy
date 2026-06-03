import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function usePresence(userId) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    // This flag prevents the cleanup from marking offline
    // when React Strict Mode double-invokes the effect
    let active = true;

    const markOnline = async () => {
      const { error } = await supabase
        .from('player_profiles')
        .update({ is_online: true, last_seen: new Date().toISOString() })
        .eq('id', userId);
      if (error) console.error('[usePresence] markOnline failed:', error.message);
      else console.log('[usePresence] marked online ✅', userId);
    };

    const markOffline = async () => {
      // Only mark offline if this effect instance is still the active one
      if (!active) return;
      const { error } = await supabase
        .from('player_profiles')
        .update({ is_online: false, last_seen: new Date().toISOString() })
        .eq('id', userId);
      if (error) console.error('[usePresence] markOffline failed:', error.message);
    };

    // Mark online immediately
    markOnline();

    // Heartbeat every 30s
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') markOnline();
    }, 30 * 1000);

    // Page Visibility API
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') markOnline();
      else markOffline();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', markOffline);

    return () => {
      // Mark this effect instance as dead — markOffline will no-op
      active = false;
      clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', markOffline);

      // Give React 500ms — if no new effect mounts, we're truly offline
      setTimeout(async () => {
        const { data } = await supabase.auth.getSession();
        if (!data.session) return; // already signed out, skip
        await supabase
          .from('player_profiles')
          .update({ is_online: false, last_seen: new Date().toISOString() })
          .eq('id', userId);
      }, 500);
    };
  }, [userId]);
}
