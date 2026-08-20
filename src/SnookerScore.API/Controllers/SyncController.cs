using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using SnookerScore.API.Hubs;
using SnookerScore.Application.DTOs;

namespace SnookerScore.API.Controllers;

/// <summary>
/// Receives synced match state from local venue servers.
/// This allows the cloud to broadcast to OBS/YouTube overlays even when
/// the local venue is the primary scoring server.
/// </summary>
[ApiController]
[Route("api/matches/{matchId}/sync")]
public class SyncController : ControllerBase
{
    private readonly IHubContext<MatchHub> _hubContext;
    private readonly ILogger<SyncController> _logger;

    public SyncController(IHubContext<MatchHub> hubContext, ILogger<SyncController> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    /// <summary>
    /// Receive a match state update from a local venue server and broadcast to connected clients.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> ReceiveSync(string matchId, [FromBody] MatchStateUpdateDto state)
    {
        _logger.LogInformation("Received sync for match {MatchId}: {P1} {Score1}-{Score2} {P2}",
            matchId, state.Player1Name, state.Player1FrameScore, state.Player2FrameScore, state.Player2Name);

        // Broadcast to all clients watching this match (OBS overlays, remote spectators)
        await _hubContext.Clients
            .Group($"match:{matchId}")
            .SendAsync("MatchUpdated", state);

        // Also broadcast to live matches listing
        await _hubContext.Clients
            .Group("live-matches")
            .SendAsync("LiveMatchUpdated", state);

        return Ok(new { synced = true });
    }
}
