using Microsoft.AspNetCore.SignalR;
using SnookerScore.Application.DTOs;
using SnookerScore.Application.Interfaces;
using SnookerScore.API.Services;

namespace SnookerScore.API.Hubs;

/// <summary>
/// SignalR implementation of IMatchBroadcaster.
/// Sends real-time updates to all clients connected to a match group.
/// Also queues updates for cloud sync (local venue → cloud for streaming).
/// </summary>
public class SignalRMatchBroadcaster : IMatchBroadcaster
{
    private readonly IHubContext<MatchHub> _hubContext;
    private readonly CloudSyncService _cloudSync;

    public SignalRMatchBroadcaster(IHubContext<MatchHub> hubContext, CloudSyncService cloudSync)
    {
        _hubContext = hubContext;
        _cloudSync = cloudSync;
    }

    public async Task BroadcastMatchUpdateAsync(string matchId, MatchStateUpdateDto state)
    {
        await _hubContext.Clients
            .Group($"match:{matchId}")
            .SendAsync("MatchUpdated", state);

        _cloudSync.QueueSync(matchId, state);
    }

    public async Task BroadcastMatchStartedAsync(string matchId, MatchStateUpdateDto state)
    {
        await _hubContext.Clients
            .Group($"match:{matchId}")
            .SendAsync("MatchStarted", state);

        await _hubContext.Clients
            .Group("live-matches")
            .SendAsync("LiveMatchAdded", state);

        _cloudSync.QueueSync(matchId, state);
    }

    public async Task BroadcastMatchCompletedAsync(string matchId, MatchStateUpdateDto state)
    {
        await _hubContext.Clients
            .Group($"match:{matchId}")
            .SendAsync("MatchCompleted", state);

        await _hubContext.Clients
            .Group("live-matches")
            .SendAsync("LiveMatchRemoved", matchId);

        _cloudSync.QueueSync(matchId, state);
    }

    public async Task BroadcastFrameCompletedAsync(string matchId, MatchStateUpdateDto state)
    {
        await _hubContext.Clients
            .Group($"match:{matchId}")
            .SendAsync("FrameCompleted", state);

        await _hubContext.Clients
            .Group("live-matches")
            .SendAsync("LiveMatchUpdated", state);

        _cloudSync.QueueSync(matchId, state);
    }
}
