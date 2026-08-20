using SnookerScore.Domain.Entities;

namespace SnookerScore.Domain.Scoring;

public class ScoringResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public MatchEvent? Event { get; set; }
    public FrameState? FrameState { get; set; }
    public bool FrameEnded { get; set; }
    public bool MatchEnded { get; set; }
    public string? FrameWinnerId { get; set; }
    public string? MatchWinnerId { get; set; }

    public static ScoringResult Ok(MatchEvent evt, FrameState state) => new()
    {
        Success = true,
        Event = evt,
        FrameState = state
    };

    public static ScoringResult FrameComplete(MatchEvent evt, FrameState state, string winnerId) => new()
    {
        Success = true,
        Event = evt,
        FrameState = state,
        FrameEnded = true,
        FrameWinnerId = winnerId
    };

    public static ScoringResult MatchComplete(MatchEvent evt, FrameState state, string frameWinnerId, string matchWinnerId) => new()
    {
        Success = true,
        Event = evt,
        FrameState = state,
        FrameEnded = true,
        MatchEnded = true,
        FrameWinnerId = frameWinnerId,
        MatchWinnerId = matchWinnerId
    };

    public static ScoringResult Error(string message) => new()
    {
        Success = false,
        ErrorMessage = message
    };
}
