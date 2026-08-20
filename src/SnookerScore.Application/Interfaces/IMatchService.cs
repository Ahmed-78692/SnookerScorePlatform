using SnookerScore.Application.DTOs;

namespace SnookerScore.Application.Interfaces;

public interface IMatchService
{
    Task<MatchDto> CreateMatchAsync(CreateMatchRequest request, string scorerId);
    Task<MatchDto?> GetMatchAsync(string matchId);
    Task<List<MatchDto>> GetLiveMatchesAsync();
    Task<MatchStateUpdateDto> StartMatchAsync(string matchId, StartMatchRequest request);
    Task<MatchStateUpdateDto> ProcessScoringEventAsync(string matchId, ScoringEventRequest request);
    Task<MatchStateUpdateDto> UndoLastEventAsync(string matchId);
    Task<List<MatchEventDto>> GetMatchEventsAsync(string matchId);
    Task<MatchStateUpdateDto> GetMatchStateAsync(string matchId);
}
