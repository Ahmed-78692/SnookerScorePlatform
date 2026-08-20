using MongoDB.Driver;
using SnookerScore.Application.Interfaces;
using SnookerScore.Domain.Entities;
using SnookerScore.Infrastructure.Persistence;

namespace SnookerScore.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly MongoDbContext _context;

    public UserRepository(MongoDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByIdAsync(string id)
    {
        return await _context.Users
            .Find(u => u.Id == id)
            .FirstOrDefaultAsync();
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _context.Users
            .Find(u => u.Email == email.ToLowerInvariant())
            .FirstOrDefaultAsync();
    }

    public async Task<User> CreateAsync(User user)
    {
        user.Email = user.Email.ToLowerInvariant();
        await _context.Users.InsertOneAsync(user);
        return user;
    }

    public async Task UpdateAsync(User user)
    {
        user.UpdatedAt = DateTime.UtcNow;
        await _context.Users.ReplaceOneAsync(u => u.Id == user.Id, user);
    }
}
