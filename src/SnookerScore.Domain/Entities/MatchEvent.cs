using SnookerScore.Domain.Enums;

namespace SnookerScore.Domain.Entities;

/// <summary>
/// An immutable event representing a single scoring action in a match.
/// The complete match state can be reconstructed from the event history.
/// </summary>
public class MatchEvent
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string MatchId { get; set; } = string.Empty;
    public int FrameNumber { get; set; }
    public string PlayerId { get; set; } = string.Empty;
    public MatchEventType EventType { get; set; }
    public Ball? Ball { get; set; }
    public int Points { get; set; }
    public int CurrentBreak { get; set; }
    public int Player1FrameScore { get; set; }
    public int Player2FrameScore { get; set; }
    public int SequenceNumber { get; set; }
    public bool IsUndone { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }
}
