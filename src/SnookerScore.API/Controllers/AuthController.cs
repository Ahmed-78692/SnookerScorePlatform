using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using SnookerScore.Application.DTOs;
using SnookerScore.Application.Interfaces;
using SnookerScore.Domain.Entities;

namespace SnookerScore.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly IConfiguration _configuration;

    public AuthController(IUserRepository userRepository, IConfiguration configuration)
    {
        _userRepository = userRepository;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var existing = await _userRepository.GetByEmailAsync(request.Email);
            if (existing != null)
                return BadRequest(new { message = "Email already registered." });

            var user = new User
            {
                Email = request.Email.ToLowerInvariant(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                DisplayName = request.DisplayName,
                Role = request.Role
            };

            await _userRepository.CreateAsync(user);
            var token = GenerateJwtToken(user);

            return Ok(new AuthResponse
            {
                Token = token,
                UserId = user.Id,
                DisplayName = user.DisplayName,
                Role = user.Role,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            });
        }
        catch (Exception)
        {
            // Fallback: if DB is unavailable, issue a token anyway in Development
            if (_configuration["ASPNETCORE_ENVIRONMENT"] == "Development" ||
                Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
            {
                var fallbackUser = new User
                {
                    Id = Guid.NewGuid().ToString(),
                    Email = request.Email,
                    DisplayName = request.DisplayName,
                    Role = Domain.Enums.UserRole.Scorer
                };
                var token = GenerateJwtToken(fallbackUser);
                return Ok(new AuthResponse
                {
                    Token = token,
                    UserId = fallbackUser.Id,
                    DisplayName = fallbackUser.DisplayName,
                    Role = fallbackUser.Role,
                    ExpiresAt = DateTime.UtcNow.AddDays(7)
                });
            }
            throw;
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid email or password." });

        if (!user.IsActive)
            return Unauthorized(new { message = "Account is deactivated." });

        user.LastLoginAt = DateTime.UtcNow;
        await _userRepository.UpdateAsync(user);

        var token = GenerateJwtToken(user);

        return Ok(new AuthResponse
        {
            Token = token,
            UserId = user.Id,
            DisplayName = user.DisplayName,
            Role = user.Role,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        });
    }

    private string GenerateJwtToken(User user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["Jwt:Secret"] ?? "DefaultDevSecretKey_ChangeInProduction_32chars!"));

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.DisplayName),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"] ?? "SnookerScorePlatform",
            audience: _configuration["Jwt:Audience"] ?? "SnookerScorePlatform",
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
