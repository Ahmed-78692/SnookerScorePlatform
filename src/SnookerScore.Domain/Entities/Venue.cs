namespace SnookerScore.Domain.Entities;

public class Venue : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public int NumberOfTables { get; set; }
    public List<Table> Tables { get; set; } = new();
}

public class Table
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public int TableNumber { get; set; }
    public string? Name { get; set; }
    public bool IsActive { get; set; } = true;
}
