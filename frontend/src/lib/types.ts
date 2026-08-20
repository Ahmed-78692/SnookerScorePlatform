export interface MatchStateUpdate {
  matchId: string;
  player1Name: string;
  player2Name: string;
  player1FrameScore: number;
  player2FrameScore: number;
  player1FramesWon: number;
  player2FramesWon: number;
  currentFrameNumber: number;
  currentPlayerId: string;
  currentPlayerName: string;
  currentBreak: number;
  player1HighestBreak: number;
  player2HighestBreak: number;
  redsRemaining: number;
  pointsRemaining: number;
  player1SnookersRequired: number;
  player2SnookersRequired: number;
  status: MatchStatus;
  winnerId?: string;
  tournamentName?: string;
  tableNumber?: number;
  lastEvent?: MatchEventDto;
}

export interface MatchEventDto {
  id: string;
  frameNumber: number;
  playerId: string;
  eventType: string;
  ball?: string;
  points: number;
  currentBreak: number;
  timestamp: string;
}

export interface MatchDto {
  id: string;
  tournamentId?: string;
  tournamentName?: string;
  player1Id: string;
  player1Name: string;
  player2Id: string;
  player2Name: string;
  bestOf: number;
  player1FramesWon: number;
  player2FramesWon: number;
  currentFrameNumber: number;
  status: MatchStatus;
  winnerId?: string;
  tableNumber?: number;
  currentFrame: FrameStateDto;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface FrameStateDto {
  frameNumber: number;
  currentPlayerId: string;
  player1Score: number;
  player2Score: number;
  currentBreak: number;
  player1HighestBreak: number;
  player2HighestBreak: number;
  redsRemaining: number;
  pointsRemaining: number;
  player1Fouls: number;
  player2Fouls: number;
  player1SnookersRequired: number;
  player2SnookersRequired: number;
}

export interface CreateMatchRequest {
  player1Id: string;
  player1Name: string;
  player2Id: string;
  player2Name: string;
  bestOf: number;
  tournamentId?: string;
  venueId?: string;
  tableId?: string;
  tableNumber?: number;
}

export interface ScoringEventRequest {
  eventType: string;
  ball?: string;
  foulPoints?: number;
  winnerId?: string;
  breakingPlayerId?: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  displayName: string;
  role: string;
  expiresAt: string;
}

export type MatchStatus = 'Scheduled' | 'InProgress' | 'Completed' | 'Abandoned' | 'Walkover';

export type BallType = 'red' | 'yellow' | 'green' | 'brown' | 'blue' | 'pink' | 'black';

export const BALL_COLORS: Record<BallType, string> = {
  red: '#dc2626',
  yellow: '#eab308',
  green: '#16a34a',
  brown: '#92400e',
  blue: '#2563eb',
  pink: '#ec4899',
  black: '#1f2937',
};

export const BALL_POINTS: Record<BallType, number> = {
  red: 1,
  yellow: 2,
  green: 3,
  brown: 4,
  blue: 5,
  pink: 6,
  black: 7,
};
