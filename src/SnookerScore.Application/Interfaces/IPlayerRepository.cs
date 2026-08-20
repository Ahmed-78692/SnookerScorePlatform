using SnookerScore.Domain.Entities;

namespace SnookerScore.Application.Interfaces;

public interface IPlayerRepository
{
    Task<Player?> GetByIdAsync(string id);
    Task<List<Player>> GetAllAsync();
    Task<List<Player>> SearchAsync(string query);
    Task<Player> CreateAsync(Player player);
    Task UpdateAsync(Player player);
    Task DeleteAsync(string id);
}
