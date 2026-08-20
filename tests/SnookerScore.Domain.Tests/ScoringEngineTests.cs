using SnookerScore.Domain.Entities;
using SnookerScore.Domain.Enums;
using SnookerScore.Domain.Scoring;

namespace SnookerScore.Domain.Tests;

public class ScoringEngineTests
{
    private readonly SnookerScoringEngine _engine;
    private readonly Match _match;

    public ScoringEngineTests()
    {
        _engine = new SnookerScoringEngine();
        _match = CreateTestMatch();
    }

    private static Match CreateTestMatch()
    {
        return new Match
        {
            Player1Id = "player1",
            Player1Name = "Ahmed Sayed",
            Player2Id = "player2",
            Player2Name = "Player B",
            BestOf = 5
        };
    }

    [Fact]
    public void StartMatch_SetsStatusToInProgress()
    {
        var result = _engine.StartMatch(_match, "player1");

        Assert.True(result.Success);
        Assert.Equal(MatchStatus.InProgress, _match.Status);
        Assert.Equal(FrameStatus.InProgress, _match.CurrentFrame.Status);
        Assert.Equal("player1", _match.CurrentFrame.CurrentPlayerId);
    }

    [Fact]
    public void StartMatch_AlreadyInProgress_ReturnsError()
    {
        _engine.StartMatch(_match, "player1");
        var result = _engine.StartMatch(_match, "player1");

        Assert.False(result.Success);
        Assert.Contains("already in progress", result.ErrorMessage);
    }

    [Fact]
    public void PotRed_AwardsOnePoint()
    {
        _engine.StartMatch(_match, "player1");

        var result = _engine.PotBall(_match, Ball.Red);

        Assert.True(result.Success);
        Assert.Equal(1, _match.CurrentFrame.Player1Score);
        Assert.Equal(1, _match.CurrentFrame.CurrentBreak);
        Assert.Equal(14, _match.CurrentFrame.RedsRemaining);
    }

    [Fact]
    public void PotRedThenBlack_AwardsCorrectPoints()
    {
        _engine.StartMatch(_match, "player1");

        _engine.PotBall(_match, Ball.Red);
        var result = _engine.PotBall(_match, Ball.Black);

        Assert.True(result.Success);
        Assert.Equal(8, _match.CurrentFrame.Player1Score);
        Assert.Equal(8, _match.CurrentFrame.CurrentBreak);
    }

    [Fact]
    public void PotColourWithoutRed_ReturnsError()
    {
        _engine.StartMatch(_match, "player1");

        var result = _engine.PotBall(_match, Ball.Black);

        Assert.False(result.Success);
        Assert.Contains("red", result.ErrorMessage, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void PotRedAfterRed_ReturnsError()
    {
        _engine.StartMatch(_match, "player1");
        _engine.PotBall(_match, Ball.Red);

        var result = _engine.PotBall(_match, Ball.Red);

        Assert.False(result.Success);
        Assert.Contains("colour", result.ErrorMessage, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Foul_AwardsPointsToOpponent()
    {
        _engine.StartMatch(_match, "player1");

        var result = _engine.Foul(_match, 4);

        Assert.True(result.Success);
        Assert.Equal(0, _match.CurrentFrame.Player1Score);
        Assert.Equal(4, _match.CurrentFrame.Player2Score);
        // Should switch to player2
        Assert.Equal("player2", _match.CurrentFrame.CurrentPlayerId);
    }

    [Fact]
    public void Foul_MinimumFourPoints()
    {
        _engine.StartMatch(_match, "player1");

        var result = _engine.Foul(_match, 2);

        Assert.True(result.Success);
        Assert.Equal(4, _match.CurrentFrame.Player2Score);
    }

    [Fact]
    public void Foul_MaxSevenPoints()
    {
        _engine.StartMatch(_match, "player1");

        var result = _engine.Foul(_match, 10);

        Assert.True(result.Success);
        Assert.Equal(7, _match.CurrentFrame.Player2Score);
    }

    [Fact]
    public void EndBreak_SwitchesPlayer()
    {
        _engine.StartMatch(_match, "player1");
        _engine.PotBall(_match, Ball.Red);
        _engine.PotBall(_match, Ball.Black);

        var result = _engine.EndBreak(_match);

        Assert.True(result.Success);
        Assert.Equal("player2", _match.CurrentFrame.CurrentPlayerId);
        Assert.Equal(0, _match.CurrentFrame.CurrentBreak);
    }

    [Fact]
    public void EndBreak_TracksHighestBreak()
    {
        _engine.StartMatch(_match, "player1");
        _engine.PotBall(_match, Ball.Red);
        _engine.PotBall(_match, Ball.Black);
        _engine.PotBall(_match, Ball.Red);
        _engine.PotBall(_match, Ball.Pink);

        _engine.EndBreak(_match);

        // Red(1) + Black(7) + Red(1) + Pink(6) = 15
        Assert.Equal(15, _match.CurrentFrame.Player1HighestBreak);
    }

    [Fact]
    public void EndFrame_AwardsFrameToLeadingPlayer()
    {
        _engine.StartMatch(_match, "player1");
        _engine.PotBall(_match, Ball.Red);
        _engine.PotBall(_match, Ball.Black);

        var result = _engine.EndFrame(_match);

        Assert.True(result.Success);
        Assert.True(result.FrameEnded);
        Assert.Equal("player1", result.FrameWinnerId);
        Assert.Equal(1, _match.Player1FramesWon);
    }

    [Fact]
    public void EndFrame_TiedScore_RequiresWinnerSpecified()
    {
        _engine.StartMatch(_match, "player1");

        var result = _engine.EndFrame(_match);

        Assert.False(result.Success);
        Assert.Contains("tied", result.ErrorMessage, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void MatchEnds_WhenPlayerReachesRequiredFrames()
    {
        // Best of 5 = first to 3 frames
        _engine.StartMatch(_match, "player1");

        // Win 3 frames
        for (int i = 0; i < 3; i++)
        {
            if (i > 0)
                _engine.StartFrame(_match, "player1");

            _engine.PotBall(_match, Ball.Red);
            _engine.PotBall(_match, Ball.Black);
            var result = _engine.EndFrame(_match);

            if (i < 2)
            {
                Assert.True(result.FrameEnded);
                Assert.False(result.MatchEnded);
            }
            else
            {
                Assert.True(result.MatchEnded);
                Assert.Equal("player1", result.MatchWinnerId);
                Assert.Equal(MatchStatus.Completed, _match.Status);
            }
        }
    }

    [Fact]
    public void FreeBall_AllowsAnyBallToBeePotted()
    {
        _engine.StartMatch(_match, "player1");

        _engine.FreeBall(_match);
        var result = _engine.PotBall(_match, Ball.Black);

        Assert.True(result.Success);
    }

    [Fact]
    public void Undo_RevertsToPreviousState()
    {
        _engine.StartMatch(_match, "player1");

        var events = new List<MatchEvent>();

        // Pot red
        var r1 = _engine.PotBall(_match, Ball.Red);
        r1.Event!.SequenceNumber = 2;
        events.Add(r1.Event);

        // Pot black
        var r2 = _engine.PotBall(_match, Ball.Black);
        r2.Event!.SequenceNumber = 3;
        events.Add(r2.Event);

        Assert.Equal(8, _match.CurrentFrame.Player1Score);

        // Add the match start event
        var startEvent = new MatchEvent
        {
            MatchId = _match.Id,
            FrameNumber = 1,
            PlayerId = "player1",
            EventType = MatchEventType.FrameStart,
            SequenceNumber = 1
        };
        events.Insert(0, startEvent);

        // Undo
        var undoResult = _engine.Undo(_match, events);

        Assert.True(undoResult.Success);
        // After undoing the black pot, score should be 1 (just the red)
        Assert.Equal(1, _match.CurrentFrame.Player1Score);
    }

    [Fact]
    public void Rerack_ResetsFrame()
    {
        _engine.StartMatch(_match, "player1");
        _engine.PotBall(_match, Ball.Red);
        _engine.PotBall(_match, Ball.Black);

        var result = _engine.Rerack(_match, "player2");

        Assert.True(result.Success);
        Assert.Equal(0, _match.CurrentFrame.Player1Score);
        Assert.Equal(0, _match.CurrentFrame.Player2Score);
        Assert.Equal(15, _match.CurrentFrame.RedsRemaining);
        Assert.Equal("player2", _match.CurrentFrame.CurrentPlayerId);
    }

    [Fact]
    public void PointsRemaining_InitiallyIs147()
    {
        _engine.StartMatch(_match, "player1");
        Assert.Equal(147, _match.CurrentFrame.PointsRemaining);
    }

    [Fact]
    public void PointsRemaining_DecreasesCorrectly()
    {
        _engine.StartMatch(_match, "player1");
        _engine.PotBall(_match, Ball.Red);
        _engine.PotBall(_match, Ball.Black);

        // 15 reds initially, now 14 remaining
        // Points remaining = 14 * 8 + 27 = 139
        Assert.Equal(139, _match.CurrentFrame.PointsRemaining);
    }

    [Fact]
    public void SnookersRequired_CalculatesCorrectly()
    {
        _engine.StartMatch(_match, "player1");

        // Give player1 a big lead
        for (int i = 0; i < 5; i++)
        {
            _engine.PotBall(_match, Ball.Red);
            _engine.PotBall(_match, Ball.Black);
        }

        // Player1 has 40 points, Player2 has 0
        // Points remaining = 10*8 + 27 = 107
        // Player2 deficit = 40, remaining covers it, so no snookers needed
        var snookers = _match.CurrentFrame.SnookersRequired("player2", "player1");
        Assert.Equal(0, snookers);
    }

    [Fact]
    public void MultipleBreaks_TrackingCorrectly()
    {
        _engine.StartMatch(_match, "player1");

        // Player 1 break: 15 (Red+Black, Red+Pink = 1+7+1+6)
        _engine.PotBall(_match, Ball.Red);
        _engine.PotBall(_match, Ball.Black);
        _engine.PotBall(_match, Ball.Red);
        _engine.PotBall(_match, Ball.Pink);
        Assert.Equal(15, _match.CurrentFrame.CurrentBreak);

        _engine.EndBreak(_match);
        Assert.Equal(15, _match.CurrentFrame.Player1HighestBreak);

        // Player 2 break
        _engine.PotBall(_match, Ball.Red);
        _engine.PotBall(_match, Ball.Blue);
        Assert.Equal(6, _match.CurrentFrame.CurrentBreak);

        _engine.EndBreak(_match);
        Assert.Equal(6, _match.CurrentFrame.Player2HighestBreak);
    }

    [Fact]
    public void ColourClearance_MustFollowSequence()
    {
        _engine.StartMatch(_match, "player1");

        // Pot all 15 reds with blacks
        for (int i = 0; i < 15; i++)
        {
            _engine.PotBall(_match, Ball.Red);
            _engine.PotBall(_match, Ball.Black);
        }

        // Now in colour clearance - must pot Yellow first
        Assert.True(_match.CurrentFrame.IsInColourSequence);
        Assert.Equal(Ball.Yellow, _match.CurrentFrame.NextExpectedColour);

        // Try to pot Green (wrong order) - should fail
        var result = _engine.PotBall(_match, Ball.Green);
        Assert.False(result.Success);

        // Pot Yellow (correct)
        result = _engine.PotBall(_match, Ball.Yellow);
        Assert.True(result.Success);
        Assert.Equal(Ball.Green, _match.CurrentFrame.NextExpectedColour);
    }

    [Fact]
    public void FullFrameClearance_147Break()
    {
        _engine.StartMatch(_match, "player1");

        // 15 reds + blacks = 15 * (1+7) = 120
        for (int i = 0; i < 15; i++)
        {
            var r = _engine.PotBall(_match, Ball.Red);
            Assert.True(r.Success, $"Red {i + 1} failed: {r.ErrorMessage}");
            var b = _engine.PotBall(_match, Ball.Black);
            Assert.True(b.Success, $"Black after red {i + 1} failed: {b.ErrorMessage}");
        }

        // Colours: Y(2) + G(3) + Br(4) + Bl(5) + P(6) + Bk(7) = 27
        _engine.PotBall(_match, Ball.Yellow);
        _engine.PotBall(_match, Ball.Green);
        _engine.PotBall(_match, Ball.Brown);
        _engine.PotBall(_match, Ball.Blue);
        _engine.PotBall(_match, Ball.Pink);
        var lastResult = _engine.PotBall(_match, Ball.Black);

        Assert.True(lastResult.Success);
        Assert.Equal(147, _match.CurrentFrame.Player1Score);
        Assert.Equal(147, _match.CurrentFrame.CurrentBreak);
        // Frame should end automatically
        Assert.True(lastResult.FrameEnded);
    }
}
