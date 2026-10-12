import { useEffect, useRef } from 'react';
import { API_ENDPOINTS } from '../api/config';

const HEARTBEAT_INTERVAL_MS = 60 * 1000;      // ping server every minute
const IDLE_THRESHOLD_MS = 5 * 60 * 1000;      // no interaction for 5 mins => stop pinging (server flags inactive)

/** Fire-and-forget request that survives tab close / navigation. */
export function sendPresence(url, email) {
  if (!email) return;
  try {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

/**
 * Keeps an officer flagged as "Active" while they are logged in and interacting.
 * - Marks online immediately on mount
 * - Sends a heartbeat every minute, but only if the user interacted within the last 5 minutes
 * - Marks offline when the tab/window is closed
 */
export default function usePresence(email) {
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    if (!email) return;

    const markActivity = () => { lastActivityRef.current = Date.now(); };
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach(evt => window.addEventListener(evt, markActivity, { passive: true }));

    // Online right away
    sendPresence(API_ENDPOINTS.PRESENCE_HEARTBEAT, email);

    const interval = setInterval(() => {
      const idleFor = Date.now() - lastActivityRef.current;
      if (idleFor < IDLE_THRESHOLD_MS && document.visibilityState !== 'hidden') {
        sendPresence(API_ENDPOINTS.PRESENCE_HEARTBEAT, email);
      }
    }, HEARTBEAT_INTERVAL_MS);

    // Coming back to the tab counts as activity
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        markActivity();
        sendPresence(API_ENDPOINTS.PRESENCE_HEARTBEAT, email);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Closing the tab / window
    const handlePageHide = () => sendPresence(API_ENDPOINTS.PRESENCE_OFFLINE, email);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      clearInterval(interval);
      activityEvents.forEach(evt => window.removeEventListener(evt, markActivity));
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [email]);
}
