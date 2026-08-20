'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import type { MatchStateUpdate } from '@/lib/types';
import { api } from '@/lib/api';

const HUB_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/hubs/match`
  : (typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:5078/hubs/match`
    : 'http://localhost:5078/hubs/match');

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

interface UseMatchConnectionResult {
  state: MatchStateUpdate | null;
  connectionStatus: ConnectionStatus;
  error: string | null;
}

/**
 * React hook for subscribing to real-time match updates via SignalR.
 * Handles connection lifecycle, automatic reconnection, and state hydration.
 */
export function useMatchConnection(matchId: string | null): UseMatchConnectionResult {
  const [state, setState] = useState<MatchStateUpdate | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const matchIdRef = useRef(matchId);

  matchIdRef.current = matchId;

  useEffect(() => {
    if (!matchId) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => api.getToken() || '',
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Exponential backoff: 0s, 1s, 2s, 5s, 10s, 30s (max)
          const delays = [0, 1000, 2000, 5000, 10000, 30000];
          return delays[Math.min(retryContext.previousRetryCount, delays.length - 1)];
        },
      })
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    // Event handlers
    connection.on('MatchUpdated', (update: MatchStateUpdate) => {
      if (matchIdRef.current === update.matchId || matchIdRef.current === matchId) {
        setState(update);
      }
    });

    connection.on('MatchStarted', (update: MatchStateUpdate) => {
      setState(update);
    });

    connection.on('MatchCompleted', (update: MatchStateUpdate) => {
      setState(update);
    });

    connection.on('FrameCompleted', (update: MatchStateUpdate) => {
      setState(update);
    });

    // Connection lifecycle
    connection.onreconnecting(() => {
      setConnectionStatus('reconnecting');
    });

    connection.onreconnected(async () => {
      setConnectionStatus('connected');
      // Re-join the match group after reconnection
      try {
        await connection.invoke('JoinMatch', matchIdRef.current);
      } catch (err) {
        console.error('Failed to rejoin match after reconnect:', err);
      }
    });

    connection.onclose(() => {
      setConnectionStatus('disconnected');
    });

    // Start connection
    const startConnection = async () => {
      try {
        setConnectionStatus('connecting');
        await connection.start();
        setConnectionStatus('connected');
        await connection.invoke('JoinMatch', matchId);
        setError(null);
      } catch (err) {
        setConnectionStatus('disconnected');
        setError('Failed to connect to live feed. Retrying...');
        console.error('SignalR start error:', err);

        // Manual retry after 5s if initial connection fails
        setTimeout(startConnection, 5000);
      }
    };

    startConnection();

    // Also fetch initial state via REST as fallback
    api.getMatchState(matchId)
      .then((initialState) => {
        if (!state) setState(initialState);
      })
      .catch(() => {});

    return () => {
      connection.off('MatchUpdated');
      connection.off('MatchStarted');
      connection.off('MatchCompleted');
      connection.off('FrameCompleted');

      if (connection.state === signalR.HubConnectionState.Connected) {
        connection.invoke('LeaveMatch', matchId).catch(() => {});
      }
      connection.stop();
      connectionRef.current = null;
    };
  }, [matchId]);

  return { state, connectionStatus, error };
}
