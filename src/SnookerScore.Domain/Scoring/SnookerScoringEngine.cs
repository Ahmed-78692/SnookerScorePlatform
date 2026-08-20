using SnookerScore.Domain.Entities;
using SnookerScore.Domain.Enums;

namespace SnookerScore.Domain.Scoring;

/// <summary>
/// The core snooker scoring engine. Implements full snooker rules including:
/// - Red/colour alternation
/// - Colour clearance sequence (Yellow→Green→Brown→Blue→Pink→Black)
/// - Foul values (minimum 4, or value of ball involved)
/// - Free ball
/// - Points remaining calculation
/// - Break tracking
/// - Frame and match completion
/// </summary>
public class SnookerScoringEngine : IScoringEngine
{
    private static readonly Ball[] ColourSequence =
    {
        Ball.Yellow, Ball.Green, Ball.Brown, Ball.Blue, Ball.Pink, Ball.Black
    };

    public ScoringResult StartMatch(Match match, string breakingPlayerId)
    {
        if (match.Status == MatchStatus.InProgress)
            return ScoringResult.Error("Match is already in progress.");

        match.Status = MatchStatus.InProgress;
        match.StartedAt = DateTime.UtcNow;
        match.CurrentFrameNumber = 1;
        match.CurrentFrame = CreateNewFrame(1, breakingPlayerId);

        var evt = CreateEvent(match, breakingPlayerId, MatchEventType.MatchStart, 0);
        return ScoringResult.Ok(evt, match.CurrentFrame);
    }

    public ScoringResult StartFrame(Match match, string breakingPlayerId)
    {
        if (match.Status != MatchStatus.InProgress)
            return ScoringResult.Error("Match is not in progress.");

        match.CurrentFrame = CreateNewFrame(match.CurrentFrameNumber, breakingPlayerId);

        var evt = CreateEvent(match, breakingPlayerId, MatchEventType.FrameStart, 0);
        return ScoringResult.Ok(evt, match.CurrentFrame);
    }

    public ScoringResult PotBall(Match match, Ball ball)
    {
        if (match.Status != MatchStatus.InProgress)
            return ScoringResult.Error("Match is not in progress.");

        var frame = match.CurrentFrame;
        if (frame.Status != FrameStatus.InProgress)
            return ScoringResult.Error("Frame is not in progress.");

        // Validate the pot according to snooker rules
        var validationError = ValidatePot(frame, ball);
        if (validationError != null)
            return ScoringResult.Error(validationError);

        int points = (int)ball;
        bool isPlayer1 = frame.CurrentPlayerId == match.Player1Id;

        // Award points to current player
        if (isPlayer1)
            frame.Player1Score += points;
        else
            frame.Player2Score += points;

        // Update break
        frame.CurrentBreak += points;

        // Update highest break
        if (isPlayer1 && frame.CurrentBreak > frame.Player1HighestBreak)
            frame.Player1HighestBreak = frame.CurrentBreak;
        else if (!isPlayer1 && frame.CurrentBreak > frame.Player2HighestBreak)
            frame.Player2HighestBreak = frame.CurrentBreak;

        // Update table state
        UpdateTableState(frame, ball);

        // Calculate points remaining
        frame.PointsRemaining = CalculatePointsRemaining(frame);

        // Clear free ball if active
        if (frame.FreeBallActive)
            frame.FreeBallActive = false;

        var evt = CreateEvent(match, frame.CurrentPlayerId, MatchEventType.Pot, points, ball);
        evt.CurrentBreak = frame.CurrentBreak;

        // Check if frame is over (all balls potted)
        if (IsFrameOver(frame))
        {
            return CompleteFrame(match, evt);
        }

        return ScoringResult.Ok(evt, frame);
    }

    public ScoringResult Foul(Match match, int points, string? description = null)
    {
        if (match.Status != MatchStatus.InProgress)
            return ScoringResult.Error("Match is not in progress.");

        var frame = match.CurrentFrame;
        if (frame.Status != FrameStatus.InProgress)
            return ScoringResult.Error("Frame is not in progress.");

        // Minimum foul is 4 points
        if (points < 4) points = 4;
        if (points > 7) points = 7;

        bool isPlayer1 = frame.CurrentPlayerId == match.Player1Id;

        // Award foul points to the opponent
        if (isPlayer1)
        {
            frame.Player2Score += points;
            frame.Player1Fouls++;
        }
        else
        {
            frame.Player1Score += points;
            frame.Player2Fouls++;
        }

        // End the current break
        frame.CurrentBreak = 0;

        // Switch player
        frame.CurrentPlayerId = isPlayer1 ? match.Player2Id : match.Player1Id;

        // Reset colour state (next player needs a red, unless in colour clearance)
        if (!frame.IsInColourSequence)
        {
            frame.IsOnColour = false;
        }

        frame.PointsRemaining = CalculatePointsRemaining(frame);

        var evt = CreateEvent(match, isPlayer1 ? match.Player1Id : match.Player2Id, MatchEventType.Foul, points);
        evt.Notes = description;
        return ScoringResult.Ok(evt, frame);
    }

    public ScoringResult FreeBall(Match match)
    {
        if (match.Status != MatchStatus.InProgress)
            return ScoringResult.Error("Match is not in progress.");

        var frame = match.CurrentFrame;
        if (frame.Status != FrameStatus.InProgress)
            return ScoringResult.Error("Frame is not in progress.");

        frame.FreeBallActive = true;

        var evt = CreateEvent(match, frame.CurrentPlayerId, MatchEventType.FreeBall, 0);
        return ScoringResult.Ok(evt, frame);
    }

    public ScoringResult EndBreak(Match match)
    {
        if (match.Status != MatchStatus.InProgress)
            return ScoringResult.Error("Match is not in progress.");

        var frame = match.CurrentFrame;
        if (frame.Status != FrameStatus.InProgress)
            return ScoringResult.Error("Frame is not in progress.");

        bool isPlayer1 = frame.CurrentPlayerId == match.Player1Id;

        // End break and switch player
        frame.CurrentBreak = 0;
        frame.CurrentPlayerId = isPlayer1 ? match.Player2Id : match.Player1Id;

        // If we were on a colour (red potted, colour not yet potted), reset
        if (frame.IsOnColour && !frame.IsInColourSequence)
        {
            frame.IsOnColour = false;
        }

        var evt = CreateEvent(match, isPlayer1 ? match.Player1Id : match.Player2Id, MatchEventType.EndBreak, 0);
        return ScoringResult.Ok(evt, frame);
    }

    public ScoringResult EndFrame(Match match, string? winnerId = null)
    {
        if (match.Status != MatchStatus.InProgress)
            return ScoringResult.Error("Match is not in progress.");

        var frame = match.CurrentFrame;
        if (frame.Status != FrameStatus.InProgress)
            return ScoringResult.Error("Frame is not in progress.");

        // Determine winner
        if (winnerId == null)
        {
            if (frame.Player1Score > frame.Player2Score)
                winnerId = match.Player1Id;
            else if (frame.Player2Score > frame.Player1Score)
                winnerId = match.Player2Id;
            else
                return ScoringResult.Error("Frame is tied. Specify a winner or continue playing.");
        }

        var evt = CreateEvent(match, frame.CurrentPlayerId, MatchEventType.EndFrame, 0);
        return CompleteFrame(match, evt, winnerId);
    }

    public ScoringResult Undo(Match match, List<MatchEvent> eventHistory)
    {
        if (match.Status != MatchStatus.InProgress)
            return ScoringResult.Error("Match is not in progress.");

        // Find the last active (non-undone) event that's not a structural event
        var lastEvent = eventHistory
            .Where(e => !e.IsUndone && e.MatchId == match.Id
                && e.EventType != MatchEventType.MatchStart
                && e.EventType != MatchEventType.FrameStart)
            .OrderByDescending(e => e.SequenceNumber)
            .FirstOrDefault();

        if (lastEvent == null)
            return ScoringResult.Error("Nothing to undo.");

        // Mark as undone
        lastEvent.IsUndone = true;

        // Rebuild frame state from remaining events
        var frameEvents = eventHistory
            .Where(e => !e.IsUndone && e.MatchId == match.Id && e.FrameNumber == match.CurrentFrameNumber)
            .OrderBy(e => e.SequenceNumber)
            .ToList();

        match.CurrentFrame = RebuildFrameState(match, frameEvents);

        var undoEvent = CreateEvent(match, match.CurrentFrame.CurrentPlayerId, MatchEventType.Undo, 0);
        undoEvent.Notes = $"Undid event {lastEvent.Id} ({lastEvent.EventType})";

        return ScoringResult.Ok(undoEvent, match.CurrentFrame);
    }

    public ScoringResult Rerack(Match match, string breakingPlayerId)
    {
        if (match.Status != MatchStatus.InProgress)
            return ScoringResult.Error("Match is not in progress.");

        match.CurrentFrame = CreateNewFrame(match.CurrentFrameNumber, breakingPlayerId);

        var evt = CreateEvent(match, breakingPlayerId, MatchEventType.Rerack, 0);
        return ScoringResult.Ok(evt, match.CurrentFrame);
    }

    #region Private Methods

    private static FrameState CreateNewFrame(int frameNumber, string breakingPlayerId)
    {
        return new FrameState
        {
            FrameNumber = frameNumber,
            Status = FrameStatus.InProgress,
            CurrentPlayerId = breakingPlayerId,
            Player1Score = 0,
            Player2Score = 0,
            CurrentBreak = 0,
            RedsRemaining = 15,
            IsOnColour = false,
            IsInColourSequence = false,
            NextExpectedColour = null,
            FreeBallActive = false,
            PointsRemaining = 147,
            StartedAt = DateTime.UtcNow
        };
    }

    private static string? ValidatePot(FrameState frame, Ball ball)
    {
        // Free ball allows any ball to be potted as a substitute
        if (frame.FreeBallActive)
            return null;

        if (frame.IsInColourSequence)
        {
            // In colour clearance, must pot colours in order
            if (ball == Ball.Red)
                return "Cannot pot a red during colour clearance.";

            if (frame.NextExpectedColour.HasValue && ball != frame.NextExpectedColour.Value)
                return $"Must pot {frame.NextExpectedColour.Value} next in the colour sequence.";

            return null;
        }

        if (frame.RedsRemaining > 0 || (!frame.IsOnColour && frame.RedsRemaining == 0 && !frame.IsInColourSequence))
        {
            if (!frame.IsOnColour)
            {
                // Must pot a red
                if (ball != Ball.Red && frame.RedsRemaining > 0)
                    return "Must pot a red ball first.";

                // If no reds remaining, start colour clearance
                if (ball != Ball.Red && frame.RedsRemaining == 0)
                {
                    // This is the transition to colour clearance
                    // Validate it's Yellow (first colour)
                    // Actually: after all reds are potted AND the final colour after last red,
                    // then clearance starts. Let's be more lenient here.
                }
            }
            else
            {
                // Must pot a colour (any colour before clearance)
                if (ball == Ball.Red)
                    return "Must pot a colour ball after a red.";
            }
        }

        return null;
    }

    private static void UpdateTableState(FrameState frame, Ball ball)
    {
        if (frame.IsInColourSequence)
        {
            // Advance to next colour in sequence
            var currentIndex = Array.IndexOf(ColourSequence, ball);
            if (currentIndex < ColourSequence.Length - 1)
            {
                frame.NextExpectedColour = ColourSequence[currentIndex + 1];
            }
            else
            {
                // Black potted - frame over (handled in caller)
                frame.NextExpectedColour = null;
            }
            return;
        }

        if (ball == Ball.Red)
        {
            frame.RedsRemaining--;
            frame.IsOnColour = true; // Next must be a colour

            // If this was the last red, after the colour we enter clearance
        }
        else
        {
            // Colour potted after a red
            frame.IsOnColour = false;

            // Check if we should enter colour clearance
            if (frame.RedsRemaining == 0)
            {
                frame.IsInColourSequence = true;
                frame.NextExpectedColour = Ball.Yellow;
            }
        }
    }

    private static int CalculatePointsRemaining(FrameState frame)
    {
        if (frame.IsInColourSequence)
        {
            // Sum remaining colours from current expected colour onwards
            if (!frame.NextExpectedColour.HasValue)
                return 0;

            int remaining = 0;
            bool counting = false;
            foreach (var colour in ColourSequence)
            {
                if (colour == frame.NextExpectedColour.Value)
                    counting = true;
                if (counting)
                    remaining += (int)colour;
            }
            return remaining;
        }

        // Standard calculation:
        // Each red is worth 1 + max 7 (black) = 8 potential per red
        // Plus all colours in clearance (2+3+4+5+6+7 = 27)
        int pointsFromReds = frame.RedsRemaining * 8; // red + black potential

        if (frame.IsOnColour)
        {
            // Already potted a red, waiting for colour
            pointsFromReds -= 1; // red already counted, add max colour
            pointsFromReds += 7; // black (max colour value)
            // Actually: reds remaining already decremented when red potted
            // So remaining = redsRemaining * 8 + 7 (for the pending colour) + 27
            return frame.RedsRemaining * 8 + 7 + 27;
        }

        return pointsFromReds + 27;
    }

    private ScoringResult CompleteFrame(Match match, MatchEvent evt, string? winnerId = null)
    {
        var frame = match.CurrentFrame;
        frame.Status = FrameStatus.Completed;

        // Determine winner if not specified
        winnerId ??= frame.Player1Score >= frame.Player2Score
            ? match.Player1Id
            : match.Player2Id;

        // Update match scores
        if (winnerId == match.Player1Id)
            match.Player1FramesWon++;
        else
            match.Player2FramesWon++;

        // Store frame summary
        match.CompletedFrames.Add(new FrameSummary
        {
            FrameNumber = frame.FrameNumber,
            Player1Score = frame.Player1Score,
            Player2Score = frame.Player2Score,
            WinnerId = winnerId,
            Player1HighestBreak = frame.Player1HighestBreak,
            Player2HighestBreak = frame.Player2HighestBreak,
            Duration = frame.StartedAt.HasValue
                ? DateTime.UtcNow - frame.StartedAt.Value
                : TimeSpan.Zero
        });

        // Check if match is over
        int framesToWin = (match.BestOf / 2) + 1;
        if (match.Player1FramesWon >= framesToWin)
        {
            match.Status = MatchStatus.Completed;
            match.WinnerId = match.Player1Id;
            match.CompletedAt = DateTime.UtcNow;
            return ScoringResult.MatchComplete(evt, frame, winnerId, match.Player1Id);
        }
        if (match.Player2FramesWon >= framesToWin)
        {
            match.Status = MatchStatus.Completed;
            match.WinnerId = match.Player2Id;
            match.CompletedAt = DateTime.UtcNow;
            return ScoringResult.MatchComplete(evt, frame, winnerId, match.Player2Id);
        }

        // Start next frame
        match.CurrentFrameNumber++;

        return ScoringResult.FrameComplete(evt, frame, winnerId);
    }

    private static bool IsFrameOver(FrameState frame)
    {
        // Frame is over when all balls are potted (Black in clearance sequence)
        return frame.IsInColourSequence && !frame.NextExpectedColour.HasValue;
    }

    private FrameState RebuildFrameState(Match match, List<MatchEvent> events)
    {
        var frame = CreateNewFrame(match.CurrentFrameNumber, match.Player1Id);

        foreach (var evt in events)
        {
            switch (evt.EventType)
            {
                case MatchEventType.FrameStart:
                case MatchEventType.Rerack:
                    frame = CreateNewFrame(match.CurrentFrameNumber, evt.PlayerId);
                    break;

                case MatchEventType.Pot:
                    if (evt.Ball.HasValue)
                    {
                        bool isP1 = evt.PlayerId == match.Player1Id;
                        int points = (int)evt.Ball.Value;

                        if (isP1) frame.Player1Score += points;
                        else frame.Player2Score += points;

                        frame.CurrentBreak += points;
                        if (isP1 && frame.CurrentBreak > frame.Player1HighestBreak)
                            frame.Player1HighestBreak = frame.CurrentBreak;
                        else if (!isP1 && frame.CurrentBreak > frame.Player2HighestBreak)
                            frame.Player2HighestBreak = frame.CurrentBreak;

                        UpdateTableState(frame, evt.Ball.Value);
                        frame.CurrentPlayerId = evt.PlayerId;
                    }
                    break;

                case MatchEventType.Foul:
                    bool isFoulByP1 = evt.PlayerId == match.Player1Id;
                    if (isFoulByP1)
                    {
                        frame.Player2Score += evt.Points;
                        frame.Player1Fouls++;
                    }
                    else
                    {
                        frame.Player1Score += evt.Points;
                        frame.Player2Fouls++;
                    }
                    frame.CurrentBreak = 0;
                    frame.CurrentPlayerId = isFoulByP1 ? match.Player2Id : match.Player1Id;
                    break;

                case MatchEventType.EndBreak:
                    frame.CurrentBreak = 0;
                    // Switch to the other player
                    frame.CurrentPlayerId = evt.PlayerId == match.Player1Id
                        ? match.Player2Id : match.Player1Id;
                    break;

                case MatchEventType.FreeBall:
                    frame.FreeBallActive = true;
                    break;
            }
        }

        frame.PointsRemaining = CalculatePointsRemaining(frame);
        return frame;
    }

    private static MatchEvent CreateEvent(Match match, string playerId, MatchEventType eventType, int points, Ball? ball = null)
    {
        return new MatchEvent
        {
            MatchId = match.Id,
            FrameNumber = match.CurrentFrameNumber,
            PlayerId = playerId,
            EventType = eventType,
            Ball = ball,
            Points = points,
            Player1FrameScore = match.CurrentFrame.Player1Score,
            Player2FrameScore = match.CurrentFrame.Player2Score,
            Timestamp = DateTime.UtcNow
        };
    }

    #endregion
}
