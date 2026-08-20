using System.Collections.Concurrent;
using SnookerScore.Application.Interfaces;
using SnookerScore.Domain.Entities;

namespace SnookerScore.Infrastructure.Repositories;

/// <summary>
/// In-memory implementation for development when MongoDB is unavailable.
/// </summary>
public class InMemoryMatchEventRepository : IMatchEventRepository
{
    private static readonly ConcurrentDictionary<string, List<MatchEvent>> _events = new();

    public Task<List<MatchEvent>> GetByMatchIdAsync(string matchId)
    {
        _events.TryGetValue(matchId, out var events);
        return Task.FromResult(events?.OrderBy(e => e.SequenceNumber).ToList() ?? new List<MatchEvent>());
    }

    public Task<List<MatchEvent>> GetByMatchAndFrameAsync(string matchId, int frameNumber)
    {
        _events.TryGetValue(matchId, out var events);
        var filtered = events?.Where(e => e.FrameNumber == frameNumber)
            .OrderBy(e => e.SequenceNumber).ToList() ?? new List<MatchEvent>();
        return Task.FromResult(filtered);
    }

    public Task<MatchEvent?> GetLastActiveEventAsync(string matchId)
    {
        _events.TryGetValue(matchId, out var events);
        var last = events?.Where(e => !e.IsUndone)
            .OrderByDescending(e => e.SequenceNumber)
            .FirstOrDefault();
        return Task.FromResult(last);
    }

    public Task<MatchEvent> CreateAsync(MatchEvent evt)
    {
        var events = _events.GetOrAdd(evt.MatchId, _ => new List<MatchEvent>());
        lock (events)
        {
            events.Add(evt);
        }
        return Task.FromResult(evt);
    }

    public Task UpdateAsync(MatchEvent evt)
    {
        if (_events.TryGetValue(evt.MatchId, out var events))
        {
            lock (events)
            {
                var index = events.FindIndex(e => e.Id == evt.Id);
                if (index >= 0) events[index] = evt;
            }
        }
        return Task.CompletedTask;
    }

    public Task<int> GetNextSequenceNumberAsync(string matchId)
    {
        _events.TryGetValue(matchId, out var events);
        var max = events?.Count > 0 ? events.Max(e => e.SequenceNumber) : 0;
        return Task.FromResult(max + 1);
    }
}
