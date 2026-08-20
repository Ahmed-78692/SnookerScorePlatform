using SnookerScore.Domain.Enums;

namespace SnookerScore.Application.DTOs;

public class MatchDto
{
    public string Id { get; set; } = string.Empty;
    public string? TournamentId { get; set; }
    public string? TournamentName { get; set; }
    public string Player1Id { get; set; } = string.Empty;
    public string Player1Name { get; set; } = string.Empty;
    public string Player2Id { get; set; } = string.Empty;
    public string Player2Name { get; set; } = string.Empty;
    public int BestOf { get; set; }
    public int Player1FramesWon { get; set; }
    public int Player2FramesWon { get; set; }
    public int CurrentFrameNumber { get; set; }
    public MatchStatus Status { get; set; }
    public string? WinnerId { get; set; }
    public int? TableNumber { get; set; }
    public FrameStateDto CurrentFrame { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class FrameStateDto
{
    public int FrameNumber { get; set; }
    public string CurrentPlayerId { get; set; } = string.Empty;
    public int Player1Score { get; set; }
    public int Player2Score { get; set; }
    public int CurrentBreak { get; set; }
    public int Player1HighestBreak { get; set; }
    public int Player2HighestBreak { get; set; }
    public int RedsRemaining { get; set; }
    public int PointsRemaining { get; set; }
    public int Player1Fouls { get; set; }
    public int Player2Fouls { get; set; }
    public int Player1SnookersRequired { get; set; }
    public int Player2SnookersRequired { get; set; }
}

public class CreateMatchRequest
{
    public string Player1Id { get; set; } = string.Empty;
    public string Player1Name { get; set; } = string.Empty;
    public string Player2Id { get; set; } = string.Empty;
    public string Player2Name { get; set; } = string.Empty;
    public int BestOf { get; set; } = 5;
    public string? TournamentId { get; set; }
    public string? VenueId { get; set; }
    public string? TableId { get; set; }
    public int? TableNumber { get; set; }
}

public class StartMatchRequest
{
    public string BreakingPlayerId { get; set; } = string.Empty;
}

public class ScoringEventRequest
{
    public string EventType { get; set; } = string.Empty; // pot, foul, freeball, endbreak, endframe
    public string? Ball { get; set; } // red, yellow, green, brown, blue, pink, black
    public int? FoulPoints { get; set; }
    public string? WinnerId { get; set; }
    public string? BreakingPlayerId { get; set; }
}

public class MatchStateUpdateDto
{
    public string MatchId { get; set; } = string.Empty;
    public string Player1Name { get; set; } = string.Empty;
    public string Player2Name { get; set; } = string.Empty;
    public int Player1FrameScore { get; set; }
    public int Player2FrameScore { get; set; }
    public int Player1FramesWon { get; set; }
    public int Player2FramesWon { get; set; }
    public int CurrentFrameNumber { get; set; }
    public string CurrentPlayerId { get; set; } = string.Empty;
    public string CurrentPlayerName { get; set; } = string.Empty;
    public int CurrentBreak { get; set; }
    public int Player1HighestBreak { get; set; }
    public int Player2HighestBreak { get; set; }
    public int RedsRemaining { get; set; }
    public int PointsRemaining { get; set; }
    public int Player1SnookersRequired { get; set; }
    public int Player2SnookersRequired { get; set; }
    public MatchStatus Status { get; set; }
    public string? WinnerId { get; set; }
    public string? TournamentName { get; set; }
    public int? TableNumber { get; set; }
    public MatchEventDto? LastEvent { get; set; }
}

public class MatchEventDto
{
    public string Id { get; set; } = string.Empty;
    public int FrameNumber { get; set; }
    public string PlayerId { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public string? Ball { get; set; }
    public int Points { get; set; }
    public int CurrentBreak { get; set; }
    public DateTime Timestamp { get; set; }
}
