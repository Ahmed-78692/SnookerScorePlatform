using SnookerScore.Application.DTOs;

namespace SnookerScore.Application.Interfaces;

/// <summary>
/// Abstraction for broadcasting match state updates (implemented via SignalR).
/// </summary>
public interface IMatchBroadcaster
{
    Task BroadcastMatchUpdateAsync(string matchId, MatchStateUpdateDto state);
    Task BroadcastMatchStartedAsync(string matchId, MatchStateUpdateDto state);
    Task BroadcastMatchCompletedAsync(string matchId, MatchStateUpdateDto state);
    Task BroadcastFrameCompletedAsync(string matchId, MatchStateUpdateDto state);
}
