using System.Collections.Concurrent;
using SnookerScore.Application.Interfaces;
using SnookerScore.Domain.Entities;

namespace SnookerScore.Infrastructure.Repositories;

/// <summary>
/// In-memory implementation for development when MongoDB is unavailable.
/// </summary>
public class InMemoryUserRepository : IUserRepository
{
    private static readonly ConcurrentDictionary<string, User> _users = new();

    public Task<User?> GetByIdAsync(string id)
    {
        _users.TryGetValue(id, out var user);
        return Task.FromResult(user);
    }

    public Task<User?> GetByEmailAsync(string email)
    {
        var user = _users.Values.FirstOrDefault(u => u.Email == email.ToLowerInvariant());
        return Task.FromResult(user);
    }

    public Task<User> CreateAsync(User user)
    {
        user.Email = user.Email.ToLowerInvariant();
        _users[user.Id] = user;
        return Task.FromResult(user);
    }

    public Task UpdateAsync(User user)
    {
        _users[user.Id] = user;
        return Task.CompletedTask;
    }
}
