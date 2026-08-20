using MongoDB.Driver;
using SnookerScore.Application.Interfaces;
using SnookerScore.Domain.Entities;
using SnookerScore.Infrastructure.Persistence;

namespace SnookerScore.Infrastructure.Repositories;

public class PlayerRepository : IPlayerRepository
{
    private readonly MongoDbContext _context;

    public PlayerRepository(MongoDbContext context)
    {
        _context = context;
    }

    public async Task<Player?> GetByIdAsync(string id)
    {
        return await _context.Players
            .Find(p => p.Id == id)
            .FirstOrDefaultAsync();
    }

    public async Task<List<Player>> GetAllAsync()
    {
        return await _context.Players
            .Find(p => p.IsActive)
            .ToListAsync();
    }

    public async Task<List<Player>> SearchAsync(string query)
    {
        var filter = Builders<Player>.Filter.Or(
            Builders<Player>.Filter.Regex(p => p.FirstName, new MongoDB.Bson.BsonRegularExpression(query, "i")),
            Builders<Player>.Filter.Regex(p => p.LastName, new MongoDB.Bson.BsonRegularExpression(query, "i")),
            Builders<Player>.Filter.Regex(p => p.Nickname, new MongoDB.Bson.BsonRegularExpression(query, "i")));

        return await _context.Players.Find(filter).ToListAsync();
    }

    public async Task<Player> CreateAsync(Player player)
    {
        await _context.Players.InsertOneAsync(player);
        return player;
    }

    public async Task UpdateAsync(Player player)
    {
        player.UpdatedAt = DateTime.UtcNow;
        await _context.Players.ReplaceOneAsync(p => p.Id == player.Id, player);
    }

    public async Task DeleteAsync(string id)
    {
        var update = Builders<Player>.Update.Set(p => p.IsActive, false);
        await _context.Players.UpdateOneAsync(p => p.Id == id, update);
    }
}
