using SnookerScore.Domain.Entities;
using SnookerScore.Domain.Enums;

namespace SnookerScore.Application.Interfaces;

public interface IMatchRepository
{
    Task<Match?> GetByIdAsync(string id);
    Task<List<Match>> GetByTournamentIdAsync(string tournamentId);
    Task<List<Match>> GetLiveMatchesAsync();
    Task<List<Match>> GetByPlayerIdAsync(string playerId);
    Task<Match> CreateAsync(Match match);
    Task UpdateAsync(Match match);
    Task DeleteAsync(string id);
}
