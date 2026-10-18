import { useEffect, useRef, useCallback } from 'react';

export type LiveEvent =
  | { type: 'heartbeat'; ts: string; bootstrap?: boolean }
  | { type: 'status-changed'; source: string; status: string; ts: string }
  | { type: 'scores-updated'; run_id: string; valid_time: string };

type Handler = (event: LiveEvent) => void;

const SSE_URL = '/api/stream';
const MAX_BACKOFF_MS = 60_000;
const POLL_INTERVAL_MS = 60_000;

/**
 * useLive — subscribes to the SSE stream and calls onEvent for each message.
 * Falls back to polling every 60 s if the connection drops.
 * Reconnects with exponential backoff capped at 60 s.
 */
export function useLive(onEvent: Handler): void {
  const handlerRef = useRef<Handler>(onEvent);
  handlerRef.current = onEvent; // always up-to-date without re-subscribing

  const esRef = useRef<EventSource | null>(null);
  const backoffRef = useRef<number>(1000);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPollingRef = useRef<boolean>(false);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
      isPollingRef.current = false;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;
    console.warn('[useLive] SSE unavailable — falling back to 60 s polling');
    pollTimerRef.current = setInterval(() => {
      // Emit a synthetic heartbeat so the chip stays updated
      handlerRef.current({ type: 'heartbeat', ts: new Date().toISOString() });
    }, POLL_INTERVAL_MS);
  }, []);

  const connect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (esRef.current) {
      esRef.current.close();
    }

    const es = new EventSource(SSE_URL);
    esRef.current = es;

    const handleMessage = (event: MessageEvent, type: LiveEvent['type']) => {
      try {
        const data = JSON.parse(event.data);
        stopPolling();
        backoffRef.current = 1000; // reset on success
        handlerRef.current({ type, ...data } as LiveEvent);
      } catch {
        // malformed JSON — ignore
      }
    };

    es.addEventListener('heartbeat',      (e) => handleMessage(e, 'heartbeat'));
    es.addEventListener('status-changed', (e) => handleMessage(e, 'status-changed'));
    es.addEventListener('scores-updated', (e) => handleMessage(e, 'scores-updated'));

    es.onerror = () => {
      es.close();
      esRef.current = null;
      startPolling();
      // Exponential backoff reconnect
      const delay = backoffRef.current;
      backoffRef.current = Math.min(delay * 2, MAX_BACKOFF_MS);
      console.warn(`[useLive] SSE error — reconnecting in ${delay}ms`);
      reconnectTimerRef.current = setTimeout(connect, delay);
    };
  }, [startPolling, stopPolling]);

  useEffect(() => {
    connect();
    return () => {
      if (esRef.current) esRef.current.close();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [connect]);
}
