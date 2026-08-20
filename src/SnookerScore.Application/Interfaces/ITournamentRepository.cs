using SnookerScore.Domain.Entities;

namespace SnookerScore.Application.Interfaces;

public interface ITournamentRepository
{
    Task<Tournament?> GetByIdAsync(string id);
    Task<List<Tournament>> GetAllAsync();
    Task<List<Tournament>> GetActiveAsync();
    Task<Tournament> CreateAsync(Tournament tournament);
    Task UpdateAsync(Tournament tournament);
    Task DeleteAsync(string id);
}
