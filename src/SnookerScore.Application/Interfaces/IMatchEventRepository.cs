using SnookerScore.Domain.Entities;

namespace SnookerScore.Application.Interfaces;

public interface IMatchEventRepository
{
    Task<List<MatchEvent>> GetByMatchIdAsync(string matchId);
    Task<List<MatchEvent>> GetByMatchAndFrameAsync(string matchId, int frameNumber);
    Task<MatchEvent?> GetLastActiveEventAsync(string matchId);
    Task<MatchEvent> CreateAsync(MatchEvent evt);
    Task UpdateAsync(MatchEvent evt);
    Task<int> GetNextSequenceNumberAsync(string matchId);
}
