using SnookerScore.Domain.Enums;

namespace SnookerScore.Application.DTOs;

public class TournamentDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? VenueName { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public TournamentFormat Format { get; set; }
    public int BestOfFrames { get; set; }
    public int MaxPlayers { get; set; }
    public int NumberOfTables { get; set; }
    public decimal? EntryFee { get; set; }
    public string? OrganiserName { get; set; }
    public bool IsPublished { get; set; }
    public int PlayerCount { get; set; }
    public List<TournamentPlayerDto> Players { get; set; } = new();
}

public class TournamentPlayerDto
{
    public string PlayerId { get; set; } = string.Empty;
    public string PlayerName { get; set; } = string.Empty;
    public int Seed { get; set; }
    public bool IsEliminated { get; set; }
}

public class CreateTournamentRequest
{
    public string Name { get; set; } = string.Empty;
    public string? VenueId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public TournamentFormat Format { get; set; } = TournamentFormat.Knockout;
    public int BestOfFrames { get; set; } = 5;
    public int MaxPlayers { get; set; } = 32;
    public int NumberOfTables { get; set; } = 4;
    public decimal? EntryFee { get; set; }
    public string? Description { get; set; }
}

public class AddTournamentPlayerRequest
{
    public string PlayerId { get; set; } = string.Empty;
    public int Seed { get; set; }
}
