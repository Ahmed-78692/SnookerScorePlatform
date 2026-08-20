namespace SnookerScore.Application.DTOs;

public class PlayerDto
{
    public string Id { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Nickname { get; set; }
    public string? Club { get; set; }
    public string? Country { get; set; }
    public PlayerStatsDto Statistics { get; set; } = new();
}

public class PlayerStatsDto
{
    public int MatchesPlayed { get; set; }
    public int MatchesWon { get; set; }
    public int MatchesLost { get; set; }
    public double WinRate { get; set; }
    public int FramesWon { get; set; }
    public int FramesLost { get; set; }
    public int HighestBreak { get; set; }
    public int Centuries { get; set; }
    public int FiftyPlusBreaks { get; set; }
    public int SixtyPlusBreaks { get; set; }
    public int SeventyPlusBreaks { get; set; }
    public double AverageBreak { get; set; }
    public int TotalPoints { get; set; }
}

public class CreatePlayerRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Nickname { get; set; }
    public string? Club { get; set; }
    public string? Country { get; set; }
}
