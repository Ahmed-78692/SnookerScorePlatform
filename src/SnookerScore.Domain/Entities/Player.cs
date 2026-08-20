namespace SnookerScore.Domain.Entities;

public class Player : BaseEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}";
    public string? Nickname { get; set; }
    public string? Club { get; set; }
    public string? Country { get; set; }
    public string? UserId { get; set; }
    public bool IsActive { get; set; } = true;
    public PlayerStatistics Statistics { get; set; } = new();
}

public class PlayerStatistics
{
    public int MatchesPlayed { get; set; }
    public int MatchesWon { get; set; }
    public int MatchesLost { get; set; }
    public int FramesWon { get; set; }
    public int FramesLost { get; set; }
    public int HighestBreak { get; set; }
    public int Centuries { get; set; }
    public int FiftyPlusBreaks { get; set; }
    public int SixtyPlusBreaks { get; set; }
    public int SeventyPlusBreaks { get; set; }
    public double AverageBreak { get; set; }
    public int TotalPoints { get; set; }
    public int TotalFouls { get; set; }
    public double WinRate => MatchesPlayed > 0 ? (double)MatchesWon / MatchesPlayed * 100 : 0;
}
