using Microsoft.AspNetCore.SignalR;
using SnookerScore.Application.DTOs;
using SnookerScore.Application.Interfaces;

namespace SnookerScore.API.Hubs;

/// <summary>
/// SignalR hub for real-time match updates.
/// Clients join a match group to receive updates for that specific match.
/// </summary>
public class MatchHub : Hub
{
    private readonly IMatchService _matchService;

    public MatchHub(IMatchService matchService)
    {
        _matchService = matchService;
    }

    /// <summary>
    /// Client joins a match group to receive live updates.
    /// Called by TV displays, live pages, OBS overlays, etc.
    /// </summary>
    public async Task JoinMatch(string matchId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"match:{matchId}");

        // Send current state immediately
        var state = await _matchService.GetMatchStateAsync(matchId);
        await Clients.Caller.SendAsync("MatchUpdated", state);
    }

    /// <summary>
    /// Client leaves a match group.
    /// </summary>
    public async Task LeaveMatch(string matchId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"match:{matchId}");
    }

    /// <summary>
    /// Join a group for all live matches (for live match listing pages).
    /// </summary>
    public async Task JoinLiveMatches()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "live-matches");
    }

    public async Task LeaveLiveMatches()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "live-matches");
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }
}
