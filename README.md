# Snooker Score Platform

A modern snooker scoring, tournament management, and live broadcast platform.

## Architecture

```
┌─────────────────┐     ┌────────────────────────┐     ┌──────────────┐
│  Mobile Scorer  │────▶│  ASP.NET Core API      │────▶│   MongoDB    │
│  (React PWA)    │◀────│  + SignalR Hub          │◀────│              │
└─────────────────┘     └──────────┬─────────────┘     └──────────────┘
                                   │ SignalR
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
          ┌──────────────┐  ┌──────────┐  ┌──────────────┐
          │ TV Display   │  │  Public  │  │  OBS Overlay │
          │/display/{id} │  │ /live    │  │ /overlay/{id}│
          └──────────────┘  └──────────┘  └──────────────┘
```

## Solution Structure

```
SnookerScorePlatform/
├── src/
│   ├── SnookerScore.Domain/          # Core domain entities, enums, scoring engine
│   ├── SnookerScore.Application/     # Service interfaces, DTOs, business logic
│   ├── SnookerScore.Infrastructure/  # MongoDB repositories, external services
│   └── SnookerScore.API/             # ASP.NET Core Web API, SignalR Hub, Controllers
├── tests/
│   └── SnookerScore.Domain.Tests/    # Unit tests for scoring engine
└── frontend/                         # (Phase 2) React/Next.js frontend
```

## Technology Stack

- **Backend**: C# / ASP.NET Core 8 / SignalR
- **Database**: MongoDB
- **Auth**: JWT with role-based access
- **Real-time**: SignalR groups per match
- **Frontend**: React/Next.js (coming in Phase 2)

## Getting Started

### Prerequisites
- .NET 8 SDK
- MongoDB (local or Atlas)

### Run the API
```bash
cd src/SnookerScore.API
dotnet run
```

API will start at https://localhost:5001 (or http://localhost:5000)
Swagger UI: https://localhost:5001/swagger

### Run Tests
```bash
dotnet test
```

## API Endpoints

### Authentication
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login and get JWT token

### Matches (Scoring)
- `POST /api/matches` — Create match (Scorer+)
- `GET /api/matches/live` — Get all live matches (public)
- `GET /api/matches/{id}` — Get match details (public)
- `GET /api/matches/{id}/state` — Get current match state (public)
- `POST /api/matches/{id}/start` — Start match (Scorer+)
- `POST /api/matches/{id}/events` — Submit scoring event (Scorer+)
- `POST /api/matches/{id}/undo` — Undo last event (Scorer+)
- `GET /api/matches/{id}/events` — Get event history (public)

### Players
- `GET /api/players` — List all players
- `GET /api/players/{id}` — Get player profile + stats
- `GET /api/players/search?q=name` — Search players
- `POST /api/players` — Create player (Organiser+)

### Tournaments
- `GET /api/tournaments` — List tournaments
- `GET /api/tournaments/{id}` — Get tournament
- `POST /api/tournaments` — Create tournament (Organiser+)
- `POST /api/tournaments/{id}/players` — Add player to tournament

### SignalR Hub
- Connect to `/hubs/match`
- Call `JoinMatch(matchId)` to receive live updates
- Listen for: `MatchUpdated`, `MatchStarted`, `MatchCompleted`, `FrameCompleted`

## Scoring Event Types

```json
// Pot a ball
{ "eventType": "pot", "ball": "red" }
{ "eventType": "pot", "ball": "black" }

// Foul
{ "eventType": "foul", "foulPoints": 4 }

// Free ball declared
{ "eventType": "freeball" }

// End current break (miss/safety)
{ "eventType": "endbreak" }

// End frame (concession)
{ "eventType": "endframe", "winnerId": "player1-id" }

// Rerack
{ "eventType": "rerack", "breakingPlayerId": "player1-id" }
```

## Roles

| Role | Permissions |
|------|------------|
| SuperAdmin | Full platform access |
| TournamentOrganiser | Create tournaments, manage matches |
| Scorer | Score assigned matches |
| Player | View own profile, statistics |
| Spectator | View public live matches (no login needed) |

## Development Roadmap

- [x] Phase 1 — Foundation (Domain, Engine, API, Auth, MongoDB)
- [ ] Phase 2 — Mobile Scorer UI
- [ ] Phase 3 — Real-time displays (TV, Live page)
- [ ] Phase 4 — OBS Streaming Overlay
- [ ] Phase 5 — Tournament Management
- [ ] Phase 6 — Statistics & Player Profiles
- [ ] Phase 7 — Production Deployment (Azure)
