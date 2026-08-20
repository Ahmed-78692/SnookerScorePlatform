'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import type { ScoringEventRequest, MatchStateUpdate } from '@/lib/types';

interface QueuedEvent {
  id: string;
  matchId: string;
  event: ScoringEventRequest;
  timestamp: number;
  retryCount: number;
}

interface UseOfflineQueueResult {
  submitEvent: (matchId: string, event: ScoringEventRequest) => Promise<MatchStateUpdate>;
  pendingCount: number;
  isOnline: boolean;
  isSyncing: boolean;
}

/**
 * Manages a local event queue for offline/intermittent connectivity.
 * Only queues on NETWORK errors (not HTTP 400/401 business errors).
 */
export function useOfflineQueue(): UseOfflineQueueResult {
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const queueRef = useRef<QueuedEvent[]>([]);
  const syncingRef = useRef(false);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const processQueue = useCallback(async () => {
    if (syncingRef.current || queueRef.current.length === 0) return;
    syncingRef.current = true;
    setIsSyncing(true);

    while (queueRef.current.length > 0) {
      const item = queueRef.current[0];
      try {
        await api.submitEvent(item.matchId, item.event);
        queueRef.current.shift();
        setPendingCount(queueRef.current.length);
      } catch {
        item.retryCount++;
        if (item.retryCount > 3) {
          queueRef.current.shift();
          setPendingCount(queueRef.current.length);
        } else {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    }

    syncingRef.current = false;
    setIsSyncing(false);
  }, []);

  const submitEvent = useCallback(async (matchId: string, event: ScoringEventRequest): Promise<MatchStateUpdate> => {
    // Always try direct submission first
    try {
      const result = await api.submitEvent(matchId, event);
      // Success — also process any queued items
      if (queueRef.current.length > 0) {
        processQueue();
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      // If it's a business logic error (from the scoring engine), don't queue — just throw
      // Network errors typically don't have a structured message from our API
      const isNetworkError = message === 'Failed to fetch' ||
        message.includes('NetworkError') ||
        message.includes('network') ||
        !navigator.onLine;

      if (!isNetworkError) {
        // This is a real API error (400 Bad Request from scoring engine)
        // Don't queue, just propagate to UI
        throw err;
      }

      // Network error — queue for later
      const queuedEvent: QueuedEvent = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        matchId,
        event,
        timestamp: Date.now(),
        retryCount: 0,
      };
      queueRef.current.push(queuedEvent);
      setPendingCount(queueRef.current.length);

      setTimeout(processQueue, 3000);
      throw err;
    }
  }, [processQueue]);

  return { submitEvent, pendingCount, isOnline, isSyncing };
}
