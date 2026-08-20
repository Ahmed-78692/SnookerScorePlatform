using MongoDB.Driver;
using SnookerScore.Application.Interfaces;
using SnookerScore.Domain.Entities;
using SnookerScore.Infrastructure.Persistence;

namespace SnookerScore.Infrastructure.Repositories;

public class TournamentRepository : ITournamentRepository
{
    private readonly MongoDbContext _context;

    public TournamentRepository(MongoDbContext context)
    {
        _context = context;
    }

    public async Task<Tournament?> GetByIdAsync(string id)
    {
        return await _context.Tournaments
            .Find(t => t.Id == id)
            .FirstOrDefaultAsync();
    }

    public async Task<List<Tournament>> GetAllAsync()
    {
        return await _context.Tournaments
            .Find(_ => true)
            .SortByDescending(t => t.StartDate)
            .ToListAsync();
    }

    public async Task<List<Tournament>> GetActiveAsync()
    {
        return await _context.Tournaments
            .Find(t => t.IsActive)
            .SortByDescending(t => t.StartDate)
            .ToListAsync();
    }

    public async Task<Tournament> CreateAsync(Tournament tournament)
    {
        await _context.Tournaments.InsertOneAsync(tournament);
        return tournament;
    }

    public async Task UpdateAsync(Tournament tournament)
    {
        tournament.UpdatedAt = DateTime.UtcNow;
        await _context.Tournaments.ReplaceOneAsync(t => t.Id == tournament.Id, tournament);
    }

    public async Task DeleteAsync(string id)
    {
        var update = Builders<Tournament>.Update.Set(t => t.IsActive, false);
        await _context.Tournaments.UpdateOneAsync(t => t.Id == id, update);
    }
}
