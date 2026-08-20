using System.Collections.Concurrent;
using SnookerScore.Application.Interfaces;
using SnookerScore.Domain.Entities;
using SnookerScore.Domain.Enums;

namespace SnookerScore.Infrastructure.Repositories;

/// <summary>
/// In-memory implementation for development when MongoDB is unavailable.
/// </summary>
public class InMemoryMatchRepository : IMatchRepository
{
    private static readonly ConcurrentDictionary<string, Match> _matches = new();

    public Task<Match?> GetByIdAsync(string id)
    {
        _matches.TryGetValue(id, out var match);
        return Task.FromResult(match);
    }

    public Task<List<Match>> GetByTournamentIdAsync(string tournamentId)
    {
        var matches = _matches.Values.Where(m => m.TournamentId == tournamentId).ToList();
        return Task.FromResult(matches);
    }

    public Task<List<Match>> GetLiveMatchesAsync()
    {
        var matches = _matches.Values.Where(m => m.Status == MatchStatus.InProgress).ToList();
        return Task.FromResult(matches);
    }

    public Task<List<Match>> GetByPlayerIdAsync(string playerId)
    {
        var matches = _matches.Values
            .Where(m => m.Player1Id == playerId || m.Player2Id == playerId)
            .ToList();
        return Task.FromResult(matches);
    }

    public Task<Match> CreateAsync(Match match)
    {
        _matches[match.Id] = match;
        return Task.FromResult(match);
    }

    public Task UpdateAsync(Match match)
    {
        _matches[match.Id] = match;
        return Task.CompletedTask;
    }

    public Task DeleteAsync(string id)
    {
        _matches.TryRemove(id, out _);
        return Task.CompletedTask;
    }
}
