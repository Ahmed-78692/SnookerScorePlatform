using SnookerScore.Application.DTOs;
using SnookerScore.Application.Interfaces;
using SnookerScore.Domain.Entities;
using SnookerScore.Domain.Enums;
using SnookerScore.Domain.Scoring;

namespace SnookerScore.Application.Services;

public class MatchService : IMatchService
{
    private readonly IMatchRepository _matchRepository;
    private readonly IMatchEventRepository _eventRepository;
    private readonly IScoringEngine _scoringEngine;
    private readonly IMatchBroadcaster _broadcaster;

    public MatchService(
        IMatchRepository matchRepository,
        IMatchEventRepository eventRepository,
        IScoringEngine scoringEngine,
        IMatchBroadcaster broadcaster)
    {
        _matchRepository = matchRepository;
        _eventRepository = eventRepository;
        _scoringEngine = scoringEngine;
        _broadcaster = broadcaster;
    }

    public async Task<MatchDto> CreateMatchAsync(CreateMatchRequest request, string scorerId)
    {
        var match = new Match
        {
            Player1Id = request.Player1Id,
            Player1Name = request.Player1Name,
            Player2Id = request.Player2Id,
            Player2Name = request.Player2Name,
            BestOf = request.BestOf,
            TournamentId = request.TournamentId,
            VenueId = request.VenueId,
            TableId = request.TableId,
            TableNumber = request.TableNumber,
            ScorerId = scorerId,
            Status = MatchStatus.Scheduled
        };

        match = await _matchRepository.CreateAsync(match);
        return MapToDto(match);
    }

    public async Task<MatchDto?> GetMatchAsync(string matchId)
    {
        var match = await _matchRepository.GetByIdAsync(matchId);
        return match == null ? null : MapToDto(match);
    }

    public async Task<List<MatchDto>> GetLiveMatchesAsync()
    {
        var matches = await _matchRepository.GetLiveMatchesAsync();
        return matches.Select(MapToDto).ToList();
    }

    public async Task<MatchStateUpdateDto> StartMatchAsync(string matchId, StartMatchRequest request)
    {
        var match = await _matchRepository.GetByIdAsync(matchId)
            ?? throw new InvalidOperationException("Match not found.");

        var result = _scoringEngine.StartMatch(match, request.BreakingPlayerId);
        if (!result.Success)
            throw new InvalidOperationException(result.ErrorMessage);

        await SaveEventAndUpdateMatch(match, result);

        var state = BuildMatchStateUpdate(match);
        await _broadcaster.BroadcastMatchStartedAsync(matchId, state);
        return state;
    }

    public async Task<MatchStateUpdateDto> ProcessScoringEventAsync(string matchId, ScoringEventRequest request)
    {
        var match = await _matchRepository.GetByIdAsync(matchId)
            ?? throw new InvalidOperationException("Match not found.");

        var result = request.EventType.ToLowerInvariant() switch
        {
            "pot" => ProcessPot(match, request),
            "foul" => _scoringEngine.Foul(match, request.FoulPoints ?? 4),
            "freeball" => _scoringEngine.FreeBall(match),
            "endbreak" => _scoringEngine.EndBreak(match),
            "endframe" => _scoringEngine.EndFrame(match, request.WinnerId),
            "rerack" => _scoringEngine.Rerack(match, request.BreakingPlayerId ?? match.Player1Id),
            "startframe" => _scoringEngine.StartFrame(match, request.BreakingPlayerId ?? match.Player1Id),
            _ => ScoringResult.Error($"Unknown event type: {request.EventType}")
        };

        if (!result.Success)
            throw new InvalidOperationException(result.ErrorMessage);

        await SaveEventAndUpdateMatch(match, result);

        var state = BuildMatchStateUpdate(match);

        if (result.MatchEnded)
            await _broadcaster.BroadcastMatchCompletedAsync(matchId, state);
        else if (result.FrameEnded)
            await _broadcaster.BroadcastFrameCompletedAsync(matchId, state);
        else
            await _broadcaster.BroadcastMatchUpdateAsync(matchId, state);

        return state;
    }

    public async Task<MatchStateUpdateDto> UndoLastEventAsync(string matchId)
    {
        var match = await _matchRepository.GetByIdAsync(matchId)
            ?? throw new InvalidOperationException("Match not found.");

        var events = await _eventRepository.GetByMatchIdAsync(matchId);
        var result = _scoringEngine.Undo(match, events);

        if (!result.Success)
            throw new InvalidOperationException(result.ErrorMessage);

        await SaveEventAndUpdateMatch(match, result);

        var state = BuildMatchStateUpdate(match);
        await _broadcaster.BroadcastMatchUpdateAsync(matchId, state);
        return state;
    }

    public async Task<List<MatchEventDto>> GetMatchEventsAsync(string matchId)
    {
        var events = await _eventRepository.GetByMatchIdAsync(matchId);
        return events
            .Where(e => !e.IsUndone)
            .Select(e => new MatchEventDto
            {
                Id = e.Id,
                FrameNumber = e.FrameNumber,
                PlayerId = e.PlayerId,
                EventType = e.EventType.ToString(),
                Ball = e.Ball?.ToString(),
                Points = e.Points,
                CurrentBreak = e.CurrentBreak,
                Timestamp = e.Timestamp
            })
            .ToList();
    }

    public async Task<MatchStateUpdateDto> GetMatchStateAsync(string matchId)
    {
        var match = await _matchRepository.GetByIdAsync(matchId)
            ?? throw new InvalidOperationException("Match not found.");

        return BuildMatchStateUpdate(match);
    }

    #region Private Methods

    private ScoringResult ProcessPot(Match match, ScoringEventRequest request)
    {
        if (string.IsNullOrEmpty(request.Ball))
            return ScoringResult.Error("Ball must be specified for a pot.");

        if (!Enum.TryParse<Ball>(request.Ball, ignoreCase: true, out var ball))
            return ScoringResult.Error($"Invalid ball: {request.Ball}");

        return _scoringEngine.PotBall(match, ball);
    }

    private async Task SaveEventAndUpdateMatch(Match match, ScoringResult result)
    {
        if (result.Event != null)
        {
            result.Event.SequenceNumber = await _eventRepository.GetNextSequenceNumberAsync(match.Id);
            await _eventRepository.CreateAsync(result.Event);
        }

        match.UpdatedAt = DateTime.UtcNow;
        await _matchRepository.UpdateAsync(match);
    }

    private MatchStateUpdateDto BuildMatchStateUpdate(Match match)
    {
        var frame = match.CurrentFrame;
        return new MatchStateUpdateDto
        {
            MatchId = match.Id,
            Player1Name = match.Player1Name,
            Player2Name = match.Player2Name,
            Player1FrameScore = frame.Player1Score,
            Player2FrameScore = frame.Player2Score,
            Player1FramesWon = match.Player1FramesWon,
            Player2FramesWon = match.Player2FramesWon,
            CurrentFrameNumber = match.CurrentFrameNumber,
            CurrentPlayerId = frame.CurrentPlayerId,
            CurrentPlayerName = frame.CurrentPlayerId == match.Player1Id
                ? match.Player1Name : match.Player2Name,
            CurrentBreak = frame.CurrentBreak,
            Player1HighestBreak = frame.Player1HighestBreak,
            Player2HighestBreak = frame.Player2HighestBreak,
            RedsRemaining = frame.RedsRemaining,
            PointsRemaining = frame.PointsRemaining,
            Player1SnookersRequired = frame.SnookersRequired(match.Player1Id, match.Player1Id),
            Player2SnookersRequired = frame.SnookersRequired(match.Player2Id, match.Player1Id),
            Status = match.Status,
            WinnerId = match.WinnerId,
            TournamentName = match.TournamentName,
            TableNumber = match.TableNumber
        };
    }

    private static MatchDto MapToDto(Match match)
    {
        var frame = match.CurrentFrame;
        return new MatchDto
        {
            Id = match.Id,
            TournamentId = match.TournamentId,
            TournamentName = match.TournamentName,
            Player1Id = match.Player1Id,
            Player1Name = match.Player1Name,
            Player2Id = match.Player2Id,
            Player2Name = match.Player2Name,
            BestOf = match.BestOf,
            Player1FramesWon = match.Player1FramesWon,
            Player2FramesWon = match.Player2FramesWon,
            CurrentFrameNumber = match.CurrentFrameNumber,
            Status = match.Status,
            WinnerId = match.WinnerId,
            TableNumber = match.TableNumber,
            CreatedAt = match.CreatedAt,
            StartedAt = match.StartedAt,
            CompletedAt = match.CompletedAt,
            CurrentFrame = new FrameStateDto
            {
                FrameNumber = frame.FrameNumber,
                CurrentPlayerId = frame.CurrentPlayerId,
                Player1Score = frame.Player1Score,
                Player2Score = frame.Player2Score,
                CurrentBreak = frame.CurrentBreak,
                Player1HighestBreak = frame.Player1HighestBreak,
                Player2HighestBreak = frame.Player2HighestBreak,
                RedsRemaining = frame.RedsRemaining,
                PointsRemaining = frame.PointsRemaining,
                Player1Fouls = frame.Player1Fouls,
                Player2Fouls = frame.Player2Fouls,
                Player1SnookersRequired = frame.SnookersRequired(match.Player1Id, match.Player1Id),
                Player2SnookersRequired = frame.SnookersRequired(match.Player2Id, match.Player1Id)
            }
        };
    }

    #endregion
}
