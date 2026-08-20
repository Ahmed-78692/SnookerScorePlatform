using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SnookerScore.Application.DTOs;
using SnookerScore.Application.Interfaces;

namespace SnookerScore.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MatchesController : ControllerBase
{
    private readonly IMatchService _matchService;

    public MatchesController(IMatchService matchService)
    {
        _matchService = matchService;
    }

    /// <summary>
    /// Get live matches (public - no auth required).
    /// </summary>
    [HttpGet("live")]
    public async Task<ActionResult<List<MatchDto>>> GetLiveMatches()
    {
        var matches = await _matchService.GetLiveMatchesAsync();
        return Ok(matches);
    }

    /// <summary>
    /// Get a specific match (public).
    /// </summary>
    [HttpGet("{matchId}")]
    public async Task<ActionResult<MatchDto>> GetMatch(string matchId)
    {
        var match = await _matchService.GetMatchAsync(matchId);
        if (match == null) return NotFound();
        return Ok(match);
    }

    /// <summary>
    /// Get current match state for display purposes (public).
    /// </summary>
    [HttpGet("{matchId}/state")]
    public async Task<ActionResult<MatchStateUpdateDto>> GetMatchState(string matchId)
    {
        try
        {
            var state = await _matchService.GetMatchStateAsync(matchId);
            return Ok(state);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Create a new match (requires Scorer or above role).
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Scorer,TournamentOrganiser,SuperAdmin")]
    public async Task<ActionResult<MatchDto>> CreateMatch([FromBody] CreateMatchRequest request)
    {
        var scorerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "anonymous";
        var match = await _matchService.CreateMatchAsync(request, scorerId);
        return CreatedAtAction(nameof(GetMatch), new { matchId = match.Id }, match);
    }

    /// <summary>
    /// Start a match (requires Scorer or above).
    /// </summary>
    [HttpPost("{matchId}/start")]
    [Authorize(Roles = "Scorer,TournamentOrganiser,SuperAdmin")]
    public async Task<ActionResult<MatchStateUpdateDto>> StartMatch(string matchId, [FromBody] StartMatchRequest request)
    {
        try
        {
            var state = await _matchService.StartMatchAsync(matchId, request);
            return Ok(state);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Submit a scoring event (pot, foul, endbreak, endframe, etc).
    /// This is the primary scoring endpoint used by the mobile scorer.
    /// </summary>
    [HttpPost("{matchId}/events")]
    [Authorize(Roles = "Scorer,TournamentOrganiser,SuperAdmin")]
    public async Task<ActionResult<MatchStateUpdateDto>> SubmitScoringEvent(string matchId, [FromBody] ScoringEventRequest request)
    {
        try
        {
            var state = await _matchService.ProcessScoringEventAsync(matchId, request);
            return Ok(state);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Undo the last scoring event.
    /// </summary>
    [HttpPost("{matchId}/undo")]
    [Authorize(Roles = "Scorer,TournamentOrganiser,SuperAdmin")]
    public async Task<ActionResult<MatchStateUpdateDto>> Undo(string matchId)
    {
        try
        {
            var state = await _matchService.UndoLastEventAsync(matchId);
            return Ok(state);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get full event history for a match (public).
    /// </summary>
    [HttpGet("{matchId}/events")]
    public async Task<ActionResult<List<MatchEventDto>>> GetMatchEvents(string matchId)
    {
        var events = await _matchService.GetMatchEventsAsync(matchId);
        return Ok(events);
    }
}
