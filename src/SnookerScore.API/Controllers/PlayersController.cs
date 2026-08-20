using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SnookerScore.Application.DTOs;
using SnookerScore.Application.Interfaces;
using SnookerScore.Domain.Entities;

namespace SnookerScore.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlayersController : ControllerBase
{
    private readonly IPlayerRepository _playerRepository;

    public PlayersController(IPlayerRepository playerRepository)
    {
        _playerRepository = playerRepository;
    }

    [HttpGet]
    public async Task<ActionResult<List<PlayerDto>>> GetAll()
    {
        var players = await _playerRepository.GetAllAsync();
        return Ok(players.Select(MapToDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PlayerDto>> GetById(string id)
    {
        var player = await _playerRepository.GetByIdAsync(id);
        if (player == null) return NotFound();
        return Ok(MapToDto(player));
    }

    [HttpGet("search")]
    public async Task<ActionResult<List<PlayerDto>>> Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q))
            return Ok(new List<PlayerDto>());

        var players = await _playerRepository.SearchAsync(q);
        return Ok(players.Select(MapToDto));
    }

    [HttpPost]
    [Authorize(Roles = "TournamentOrganiser,SuperAdmin")]
    public async Task<ActionResult<PlayerDto>> Create([FromBody] CreatePlayerRequest request)
    {
        var player = new Player
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Nickname = request.Nickname,
            Club = request.Club,
            Country = request.Country
        };

        await _playerRepository.CreateAsync(player);
        return CreatedAtAction(nameof(GetById), new { id = player.Id }, MapToDto(player));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "TournamentOrganiser,SuperAdmin,Player")]
    public async Task<ActionResult<PlayerDto>> Update(string id, [FromBody] CreatePlayerRequest request)
    {
        var player = await _playerRepository.GetByIdAsync(id);
        if (player == null) return NotFound();

        player.FirstName = request.FirstName;
        player.LastName = request.LastName;
        player.Nickname = request.Nickname;
        player.Club = request.Club;
        player.Country = request.Country;

        await _playerRepository.UpdateAsync(player);
        return Ok(MapToDto(player));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> Delete(string id)
    {
        await _playerRepository.DeleteAsync(id);
        return NoContent();
    }

    private static PlayerDto MapToDto(Player player) => new()
    {
        Id = player.Id,
        FirstName = player.FirstName,
        LastName = player.LastName,
        FullName = player.FullName,
        Nickname = player.Nickname,
        Club = player.Club,
        Country = player.Country,
        Statistics = new PlayerStatsDto
        {
            MatchesPlayed = player.Statistics.MatchesPlayed,
            MatchesWon = player.Statistics.MatchesWon,
            MatchesLost = player.Statistics.MatchesLost,
            WinRate = player.Statistics.WinRate,
            FramesWon = player.Statistics.FramesWon,
            FramesLost = player.Statistics.FramesLost,
            HighestBreak = player.Statistics.HighestBreak,
            Centuries = player.Statistics.Centuries,
            FiftyPlusBreaks = player.Statistics.FiftyPlusBreaks,
            SixtyPlusBreaks = player.Statistics.SixtyPlusBreaks,
            SeventyPlusBreaks = player.Statistics.SeventyPlusBreaks,
            AverageBreak = player.Statistics.AverageBreak,
            TotalPoints = player.Statistics.TotalPoints
        }
    };
}
