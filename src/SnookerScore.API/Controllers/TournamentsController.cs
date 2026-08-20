using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SnookerScore.Application.DTOs;
using SnookerScore.Application.Interfaces;
using SnookerScore.Domain.Entities;

namespace SnookerScore.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TournamentsController : ControllerBase
{
    private readonly ITournamentRepository _tournamentRepository;
    private readonly IPlayerRepository _playerRepository;

    public TournamentsController(
        ITournamentRepository tournamentRepository,
        IPlayerRepository playerRepository)
    {
        _tournamentRepository = tournamentRepository;
        _playerRepository = playerRepository;
    }

    [HttpGet]
    public async Task<ActionResult<List<TournamentDto>>> GetAll()
    {
        var tournaments = await _tournamentRepository.GetActiveAsync();
        return Ok(tournaments.Select(MapToDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TournamentDto>> GetById(string id)
    {
        var tournament = await _tournamentRepository.GetByIdAsync(id);
        if (tournament == null) return NotFound();
        return Ok(MapToDto(tournament));
    }

    [HttpPost]
    [Authorize(Roles = "TournamentOrganiser,SuperAdmin")]
    public async Task<ActionResult<TournamentDto>> Create([FromBody] CreateTournamentRequest request)
    {
        var organiserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "anonymous";
        var organiserName = User.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown";

        var tournament = new Tournament
        {
            Name = request.Name,
            VenueId = request.VenueId,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Format = request.Format,
            BestOfFrames = request.BestOfFrames,
            MaxPlayers = request.MaxPlayers,
            NumberOfTables = request.NumberOfTables,
            EntryFee = request.EntryFee,
            Description = request.Description,
            OrganiserId = organiserId,
            OrganiserName = organiserName
        };

        await _tournamentRepository.CreateAsync(tournament);
        return CreatedAtAction(nameof(GetById), new { id = tournament.Id }, MapToDto(tournament));
    }

    [HttpPost("{id}/players")]
    [Authorize(Roles = "TournamentOrganiser,SuperAdmin")]
    public async Task<ActionResult<TournamentDto>> AddPlayer(string id, [FromBody] AddTournamentPlayerRequest request)
    {
        var tournament = await _tournamentRepository.GetByIdAsync(id);
        if (tournament == null) return NotFound();

        if (tournament.Players.Count >= tournament.MaxPlayers)
            return BadRequest(new { message = "Tournament is full." });

        if (tournament.Players.Any(p => p.PlayerId == request.PlayerId))
            return BadRequest(new { message = "Player already registered." });

        var player = await _playerRepository.GetByIdAsync(request.PlayerId);
        if (player == null) return BadRequest(new { message = "Player not found." });

        tournament.Players.Add(new TournamentPlayer
        {
            PlayerId = player.Id,
            PlayerName = player.FullName,
            Seed = request.Seed
        });

        await _tournamentRepository.UpdateAsync(tournament);
        return Ok(MapToDto(tournament));
    }

    [HttpDelete("{id}/players/{playerId}")]
    [Authorize(Roles = "TournamentOrganiser,SuperAdmin")]
    public async Task<ActionResult> RemovePlayer(string id, string playerId)
    {
        var tournament = await _tournamentRepository.GetByIdAsync(id);
        if (tournament == null) return NotFound();

        tournament.Players.RemoveAll(p => p.PlayerId == playerId);
        await _tournamentRepository.UpdateAsync(tournament);
        return NoContent();
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "TournamentOrganiser,SuperAdmin")]
    public async Task<ActionResult<TournamentDto>> Update(string id, [FromBody] CreateTournamentRequest request)
    {
        var tournament = await _tournamentRepository.GetByIdAsync(id);
        if (tournament == null) return NotFound();

        tournament.Name = request.Name;
        tournament.VenueId = request.VenueId;
        tournament.StartDate = request.StartDate;
        tournament.EndDate = request.EndDate;
        tournament.Format = request.Format;
        tournament.BestOfFrames = request.BestOfFrames;
        tournament.MaxPlayers = request.MaxPlayers;
        tournament.NumberOfTables = request.NumberOfTables;
        tournament.EntryFee = request.EntryFee;
        tournament.Description = request.Description;

        await _tournamentRepository.UpdateAsync(tournament);
        return Ok(MapToDto(tournament));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> Delete(string id)
    {
        await _tournamentRepository.DeleteAsync(id);
        return NoContent();
    }

    private static TournamentDto MapToDto(Tournament t) => new()
    {
        Id = t.Id,
        Name = t.Name,
        VenueName = t.VenueName,
        StartDate = t.StartDate,
        EndDate = t.EndDate,
        Format = t.Format,
        BestOfFrames = t.BestOfFrames,
        MaxPlayers = t.MaxPlayers,
        NumberOfTables = t.NumberOfTables,
        EntryFee = t.EntryFee,
        OrganiserName = t.OrganiserName,
        IsPublished = t.IsPublished,
        PlayerCount = t.Players.Count,
        Players = t.Players.Select(p => new TournamentPlayerDto
        {
            PlayerId = p.PlayerId,
            PlayerName = p.PlayerName,
            Seed = p.Seed,
            IsEliminated = p.IsEliminated
        }).ToList()
    };
}
