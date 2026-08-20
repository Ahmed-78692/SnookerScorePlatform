using MongoDB.Driver;
using SnookerScore.Application.Interfaces;
using SnookerScore.Domain.Entities;
using SnookerScore.Domain.Enums;
using SnookerScore.Infrastructure.Persistence;

namespace SnookerScore.Infrastructure.Repositories;

public class MatchRepository : IMatchRepository
{
    private readonly MongoDbContext _context;

    public MatchRepository(MongoDbContext context)
    {
        _context = context;
    }

    public async Task<Match?> GetByIdAsync(string id)
    {
        return await _context.Matches
            .Find(m => m.Id == id)
            .FirstOrDefaultAsync();
    }

    public async Task<List<Match>> GetByTournamentIdAsync(string tournamentId)
    {
        return await _context.Matches
            .Find(m => m.TournamentId == tournamentId)
            .ToListAsync();
    }

    public async Task<List<Match>> GetLiveMatchesAsync()
    {
        return await _context.Matches
            .Find(m => m.Status == MatchStatus.InProgress)
            .ToListAsync();
    }

    public async Task<List<Match>> GetByPlayerIdAsync(string playerId)
    {
        var filter = Builders<Match>.Filter.Or(
            Builders<Match>.Filter.Eq(m => m.Player1Id, playerId),
            Builders<Match>.Filter.Eq(m => m.Player2Id, playerId));

        return await _context.Matches.Find(filter).ToListAsync();
    }

    public async Task<Match> CreateAsync(Match match)
    {
        await _context.Matches.InsertOneAsync(match);
        return match;
    }

    public async Task UpdateAsync(Match match)
    {
        await _context.Matches.ReplaceOneAsync(m => m.Id == match.Id, match);
    }

    public async Task DeleteAsync(string id)
    {
        await _context.Matches.DeleteOneAsync(m => m.Id == id);
    }
}
