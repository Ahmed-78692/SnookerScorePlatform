import type { AuthResponse, CreateMatchRequest, MatchDto, MatchEventDto, MatchStateUpdate, ScoringEventRequest } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:5078`
  : 'http://localhost:5078');

class ApiClient {
  private token: string | null = null;

  private getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    // Always check both in-memory and localStorage
    return this.token || this.getStoredToken();
  }

  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const currentToken = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    const url = `${API_BASE}${path}`;

    let res: Response;
    try {
      res = await fetch(url, {
        ...options,
        headers: { ...headers, ...options?.headers },
      });
    } catch (err) {
      // Network error — no response at all
      throw new Error('Failed to fetch');
    }

    if (!res.ok) {
      let errorMessage = `API Error: ${res.status}`;
      try {
        const errorBody = await res.json();
        errorMessage = errorBody.message || errorBody.title || errorMessage;
      } catch {
        // Couldn't parse error body
      }
      throw new Error(errorMessage);
    }

    return res.json();
  }

  // Auth
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await this.fetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.token);
    return res;
  }

  async register(email: string, password: string, displayName: string, role: string): Promise<AuthResponse> {
    const res = await this.fetch<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName, role }),
    });
    this.setToken(res.token);
    return res;
  }

  // Matches
  async getLiveMatches(): Promise<MatchDto[]> {
    return this.fetch<MatchDto[]>('/api/matches/live');
  }

  async getMatch(matchId: string): Promise<MatchDto> {
    return this.fetch<MatchDto>(`/api/matches/${matchId}`);
  }

  async getMatchState(matchId: string): Promise<MatchStateUpdate> {
    return this.fetch<MatchStateUpdate>(`/api/matches/${matchId}/state`);
  }

  async createMatch(request: CreateMatchRequest): Promise<MatchDto> {
    return this.fetch<MatchDto>('/api/matches', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async startMatch(matchId: string, breakingPlayerId: string): Promise<MatchStateUpdate> {
    return this.fetch<MatchStateUpdate>(`/api/matches/${matchId}/start`, {
      method: 'POST',
      body: JSON.stringify({ breakingPlayerId }),
    });
  }

  async submitEvent(matchId: string, event: ScoringEventRequest): Promise<MatchStateUpdate> {
    return this.fetch<MatchStateUpdate>(`/api/matches/${matchId}/events`, {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  async undoEvent(matchId: string): Promise<MatchStateUpdate> {
    return this.fetch<MatchStateUpdate>(`/api/matches/${matchId}/undo`, {
      method: 'POST',
    });
  }

  async getMatchEvents(matchId: string): Promise<MatchEventDto[]> {
    return this.fetch<MatchEventDto[]>(`/api/matches/${matchId}/events`);
  }
}

export const api = new ApiClient();
