using Microsoft.AspNetCore.SignalR;
using SnookerScore.Application.DTOs;
using SnookerScore.Application.Interfaces;

namespace SnookerScore.API.Hubs;

/// <summary>
/// SignalR implementation of IMatchBroadcaster.
/// Sends real-time updates to all clients connected to a match group.
/// </summary>
public class SignalRMatchBroadcaster : IMatchBroadcaster
{
    private readonly IHubContext<MatchHub> _hubContext;

    public SignalRMatchBroadcaster(IHubContext<MatchHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task BroadcastMatchUpdateAsync(string matchId, MatchStateUpdateDto state)
    {
        await _hubContext.Clients
            .Group($"match:{matchId}")
            .SendAsync("MatchUpdated", state);
    }

    public async Task BroadcastMatchStartedAsync(string matchId, MatchStateUpdateDto state)
    {
        // Notify match group
        await _hubContext.Clients
            .Group($"match:{matchId}")
            .SendAsync("MatchStarted", state);

        // Notify live matches listing
        await _hubContext.Clients
            .Group("live-matches")
            .SendAsync("LiveMatchAdded", state);
    }

    public async Task BroadcastMatchCompletedAsync(string matchId, MatchStateUpdateDto state)
    {
        await _hubContext.Clients
            .Group($"match:{matchId}")
            .SendAsync("MatchCompleted", state);

        await _hubContext.Clients
            .Group("live-matches")
            .SendAsync("LiveMatchRemoved", matchId);
    }

    public async Task BroadcastFrameCompletedAsync(string matchId, MatchStateUpdateDto state)
    {
        await _hubContext.Clients
            .Group($"match:{matchId}")
            .SendAsync("FrameCompleted", state);

        // Also send general update for live listing
        await _hubContext.Clients
            .Group("live-matches")
            .SendAsync("LiveMatchUpdated", state);
    }
}
