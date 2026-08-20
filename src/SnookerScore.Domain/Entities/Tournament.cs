using SnookerScore.Domain.Enums;

namespace SnookerScore.Domain.Entities;

public class Tournament : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? VenueId { get; set; }
    public string? VenueName { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public TournamentFormat Format { get; set; } = TournamentFormat.Knockout;
    public int BestOfFrames { get; set; } = 5;
    public int MaxPlayers { get; set; }
    public int NumberOfTables { get; set; }
    public decimal? EntryFee { get; set; }
    public string OrganiserId { get; set; } = string.Empty;
    public string? OrganiserName { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsPublished { get; set; }
    public List<TournamentPlayer> Players { get; set; } = new();
    public List<string> MatchIds { get; set; } = new();
}

public class TournamentPlayer
{
    public string PlayerId { get; set; } = string.Empty;
    public string PlayerName { get; set; } = string.Empty;
    public int Seed { get; set; }
    public bool IsEliminated { get; set; }
    public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;
}
