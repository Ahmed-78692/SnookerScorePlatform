using SnookerScore.Domain.Enums;

namespace SnookerScore.Domain.Entities;

public class Match : BaseEntity
{
    public string? TournamentId { get; set; }
    public string? TournamentName { get; set; }
    public string Player1Id { get; set; } = string.Empty;
    public string Player1Name { get; set; } = string.Empty;
    public string Player2Id { get; set; } = string.Empty;
    public string Player2Name { get; set; } = string.Empty;
    public int BestOf { get; set; } = 5;
    public int Player1FramesWon { get; set; }
    public int Player2FramesWon { get; set; }
    public int CurrentFrameNumber { get; set; } = 1;
    public MatchStatus Status { get; set; } = MatchStatus.Scheduled;
    public string? WinnerId { get; set; }
    public string? ScorerId { get; set; }
    public string? VenueId { get; set; }
    public string? TableId { get; set; }
    public int? TableNumber { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public FrameState CurrentFrame { get; set; } = new();
    public List<FrameSummary> CompletedFrames { get; set; } = new();
}

public class FrameState
{
    public int FrameNumber { get; set; } = 1;
    public FrameStatus Status { get; set; } = FrameStatus.NotStarted;
    public string CurrentPlayerId { get; set; } = string.Empty;
    public int Player1Score { get; set; }
    public int Player2Score { get; set; }
    public int CurrentBreak { get; set; }
    public int Player1HighestBreak { get; set; }
    public int Player2HighestBreak { get; set; }
    public int RedsRemaining { get; set; } = 15;
    public bool IsOnColour { get; set; }
    public bool IsInColourSequence { get; set; }
    public Ball? NextExpectedColour { get; set; }
    public bool FreeBallActive { get; set; }
    public int PointsRemaining { get; set; } = 147;
    public int Player1Fouls { get; set; }
    public int Player2Fouls { get; set; }
    public DateTime? StartedAt { get; set; }

    /// <summary>
    /// Calculates how many snookers the losing player needs.
    /// Returns 0 if the player is ahead or can still win on remaining balls.
    /// </summary>
    public int SnookersRequired(string playerId, string player1Id)
    {
        int myScore = playerId == player1Id ? Player1Score : Player2Score;
        int opponentScore = playerId == player1Id ? Player2Score : Player1Score;
        int deficit = opponentScore - myScore;

        if (deficit <= 0) return 0;
        if (deficit <= PointsRemaining) return 0;

        // Each snooker is worth minimum 4 points (foul value)
        int pointsNeeded = deficit - PointsRemaining;
        return (int)Math.Ceiling(pointsNeeded / 4.0);
    }
}

public class FrameSummary
{
    public int FrameNumber { get; set; }
    public int Player1Score { get; set; }
    public int Player2Score { get; set; }
    public string WinnerId { get; set; } = string.Empty;
    public int Player1HighestBreak { get; set; }
    public int Player2HighestBreak { get; set; }
    public TimeSpan Duration { get; set; }
}
