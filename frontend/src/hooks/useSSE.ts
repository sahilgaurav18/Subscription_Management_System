import { useEffect, useState, useRef } from 'react';

export interface SSEOptions {
  onEvent?: (event: string, data: any) => void;
  fallbackIntervalMs?: number;
  onFallbackPoll?: () => void;
}

export function useSSE({
  onEvent,
  fallbackIntervalMs = 30000,
  onFallbackPoll,
}: SSEOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<{ event: string; data: any; timestamp: number } | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollTimerRef = useRef<any>(null);

  const onEventRef = useRef(onEvent);
  const onFallbackPollRef = useRef(onFallbackPoll);

  useEffect(() => {
    onEventRef.current = onEvent;
    onFallbackPollRef.current = onFallbackPoll;
  }, [onEvent, onFallbackPoll]);

  useEffect(() => {
    let es: EventSource | null = null;

    try {
      es = new EventSource('/api/events');
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
      };

      es.onerror = () => {
        setIsConnected(false);
      };

      const handleMessage = (eventType: string) => (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          setLastEvent({ event: eventType, data: parsed, timestamp: Date.now() });
          if (onEventRef.current) {
            onEventRef.current(eventType, parsed);
          }
        } catch {
          setLastEvent({ event: eventType, data: e.data, timestamp: Date.now() });
          if (onEventRef.current) {
            onEventRef.current(eventType, e.data);
          }
        }
      };

      // Register standard system events
      const eventTypes = [
        'connected',
        'finance_update',
        'payment_recorded',
        'invoice_created',
        'invoice_status_changed',
        'subscription_status_changed',
      ];

      eventTypes.forEach((type) => {
        es?.addEventListener(type, handleMessage(type));
      });
    } catch (err) {
      console.warn('Failed to initialize SSE EventSource:', err);
      setIsConnected(false);
    }

    // Fallback 30-second polling timer
    pollTimerRef.current = setInterval(() => {
      if (onFallbackPollRef.current) {
        onFallbackPollRef.current();
      }
    }, fallbackIntervalMs);

    return () => {
      if (es) {
        es.close();
      }
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [fallbackIntervalMs]);

  return {
    isConnected,
    lastEvent,
  };
}

