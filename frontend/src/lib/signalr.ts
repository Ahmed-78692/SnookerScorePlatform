import * as signalR from '@microsoft/signalr';
import type { MatchStateUpdate } from './types';
import { api } from './api';

const HUB_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/hubs/match`
  : (typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:5078/hubs/match`
    : 'http://localhost:5078/hubs/match');

let connection: signalR.HubConnection | null = null;

export function getConnection(): signalR.HubConnection {
  if (!connection) {
    const builder = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => api.getToken() || '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning);

    connection = builder.build();
  }
  return connection;
}

export async function startConnection(): Promise<void> {
  const conn = getConnection();
  if (conn.state === signalR.HubConnectionState.Disconnected) {
    await conn.start();
  }
}

export async function joinMatch(matchId: string): Promise<void> {
  const conn = getConnection();
  await startConnection();
  await conn.invoke('JoinMatch', matchId);
}

export async function leaveMatch(matchId: string): Promise<void> {
  const conn = getConnection();
  if (conn.state === signalR.HubConnectionState.Connected) {
    await conn.invoke('LeaveMatch', matchId);
  }
}

export function onMatchUpdated(callback: (state: MatchStateUpdate) => void): void {
  const conn = getConnection();
  conn.on('MatchUpdated', callback);
}

export function onMatchStarted(callback: (state: MatchStateUpdate) => void): void {
  const conn = getConnection();
  conn.on('MatchStarted', callback);
}

export function onMatchCompleted(callback: (state: MatchStateUpdate) => void): void {
  const conn = getConnection();
  conn.on('MatchCompleted', callback);
}

export function onFrameCompleted(callback: (state: MatchStateUpdate) => void): void {
  const conn = getConnection();
  conn.on('FrameCompleted', callback);
}

export function offAllMatchEvents(): void {
  const conn = getConnection();
  conn.off('MatchUpdated');
  conn.off('MatchStarted');
  conn.off('MatchCompleted');
  conn.off('FrameCompleted');
}
