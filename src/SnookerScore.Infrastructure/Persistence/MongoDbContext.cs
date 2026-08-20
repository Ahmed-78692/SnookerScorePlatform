using Microsoft.Extensions.Options;
using MongoDB.Driver;
using SnookerScore.Domain.Entities;
using SnookerScore.Infrastructure.Configuration;

namespace SnookerScore.Infrastructure.Persistence;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    public MongoDbContext(IOptions<MongoDbSettings> settings)
    {
        var client = new MongoClient(settings.Value.ConnectionString);
        _database = client.GetDatabase(settings.Value.DatabaseName);

        CreateIndexes();
    }

    public IMongoCollection<User> Users => _database.GetCollection<User>("users");
    public IMongoCollection<Player> Players => _database.GetCollection<Player>("players");
    public IMongoCollection<Match> Matches => _database.GetCollection<Match>("matches");
    public IMongoCollection<MatchEvent> MatchEvents => _database.GetCollection<MatchEvent>("matchEvents");
    public IMongoCollection<Tournament> Tournaments => _database.GetCollection<Tournament>("tournaments");
    public IMongoCollection<Venue> Venues => _database.GetCollection<Venue>("venues");

    private void CreateIndexes()
    {
        // Match indexes
        Matches.Indexes.CreateMany(new[]
        {
            new CreateIndexModel<Match>(
                Builders<Match>.IndexKeys.Ascending(m => m.Status)),
            new CreateIndexModel<Match>(
                Builders<Match>.IndexKeys.Ascending(m => m.TournamentId)),
            new CreateIndexModel<Match>(
                Builders<Match>.IndexKeys.Ascending(m => m.Player1Id)),
            new CreateIndexModel<Match>(
                Builders<Match>.IndexKeys.Ascending(m => m.Player2Id))
        });

        // MatchEvent indexes - critical for performance
        MatchEvents.Indexes.CreateMany(new[]
        {
            new CreateIndexModel<MatchEvent>(
                Builders<MatchEvent>.IndexKeys
                    .Ascending(e => e.MatchId)
                    .Ascending(e => e.SequenceNumber)),
            new CreateIndexModel<MatchEvent>(
                Builders<MatchEvent>.IndexKeys
                    .Ascending(e => e.MatchId)
                    .Ascending(e => e.FrameNumber)),
            new CreateIndexModel<MatchEvent>(
                Builders<MatchEvent>.IndexKeys.Ascending(e => e.PlayerId))
        });

        // Tournament indexes
        Tournaments.Indexes.CreateOne(new CreateIndexModel<Tournament>(
            Builders<Tournament>.IndexKeys.Ascending(t => t.IsActive)));

        // Player indexes
        Players.Indexes.CreateOne(new CreateIndexModel<Player>(
            Builders<Player>.IndexKeys.Ascending(p => p.UserId)));

        // User indexes
        Users.Indexes.CreateOne(new CreateIndexModel<User>(
            Builders<User>.IndexKeys.Ascending(u => u.Email),
            new CreateIndexOptions { Unique = true }));
    }
}
