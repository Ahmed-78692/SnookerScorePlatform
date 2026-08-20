using SnookerScore.Domain.Entities;
using SnookerScore.Domain.Enums;

namespace SnookerScore.Domain.Scoring;

public interface IScoringEngine
{
    /// <summary>
    /// Process a pot (ball potted by current player).
    /// </summary>
    ScoringResult PotBall(Match match, Ball ball);

    /// <summary>
    /// Process a foul. Points are awarded to the non-offending player.
    /// </summary>
    ScoringResult Foul(Match match, int points, string? description = null);

    /// <summary>
    /// Declare a free ball situation.
    /// </summary>
    ScoringResult FreeBall(Match match);

    /// <summary>
    /// End the current break (player's turn at the table ends).
    /// </summary>
    ScoringResult EndBreak(Match match);

    /// <summary>
    /// End the current frame (concession or natural end).
    /// </summary>
    ScoringResult EndFrame(Match match, string? winnerId = null);

    /// <summary>
    /// Undo the last scoring event.
    /// </summary>
    ScoringResult Undo(Match match, List<MatchEvent> eventHistory);

    /// <summary>
    /// Start a new frame.
    /// </summary>
    ScoringResult StartFrame(Match match, string breakingPlayerId);

    /// <summary>
    /// Start the match.
    /// </summary>
    ScoringResult StartMatch(Match match, string breakingPlayerId);

    /// <summary>
    /// Rerack the current frame.
    /// </summary>
    ScoringResult Rerack(Match match, string breakingPlayerId);
}
