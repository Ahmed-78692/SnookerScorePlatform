using MongoDB.Driver;
using SnookerScore.Application.Interfaces;
using SnookerScore.Domain.Entities;
using SnookerScore.Infrastructure.Persistence;

namespace SnookerScore.Infrastructure.Repositories;

public class MatchEventRepository : IMatchEventRepository
{
    private readonly MongoDbContext _context;

    public MatchEventRepository(MongoDbContext context)
    {
        _context = context;
    }

    public async Task<List<MatchEvent>> GetByMatchIdAsync(string matchId)
    {
        return await _context.MatchEvents
            .Find(e => e.MatchId == matchId)
            .SortBy(e => e.SequenceNumber)
            .ToListAsync();
    }

    public async Task<List<MatchEvent>> GetByMatchAndFrameAsync(string matchId, int frameNumber)
    {
        return await _context.MatchEvents
            .Find(e => e.MatchId == matchId && e.FrameNumber == frameNumber)
            .SortBy(e => e.SequenceNumber)
            .ToListAsync();
    }

    public async Task<MatchEvent?> GetLastActiveEventAsync(string matchId)
    {
        return await _context.MatchEvents
            .Find(e => e.MatchId == matchId && !e.IsUndone)
            .SortByDescending(e => e.SequenceNumber)
            .FirstOrDefaultAsync();
    }

    public async Task<MatchEvent> CreateAsync(MatchEvent evt)
    {
        await _context.MatchEvents.InsertOneAsync(evt);
        return evt;
    }

    public async Task UpdateAsync(MatchEvent evt)
    {
        await _context.MatchEvents.ReplaceOneAsync(e => e.Id == evt.Id, evt);
    }

    public async Task<int> GetNextSequenceNumberAsync(string matchId)
    {
        var lastEvent = await _context.MatchEvents
            .Find(e => e.MatchId == matchId)
            .SortByDescending(e => e.SequenceNumber)
            .FirstOrDefaultAsync();

        return (lastEvent?.SequenceNumber ?? 0) + 1;
    }
}
