using System.Collections.Concurrent;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using SnookerScore.Application.DTOs;
using SnookerScore.Application.Interfaces;

namespace SnookerScore.API.Services;

/// <summary>
/// Background service that syncs match state to the cloud API when internet is available.
/// This enables the "local venue mode" — scoring continues offline and syncs when connection returns.
/// </summary>
public class CloudSyncService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<CloudSyncService> _logger;
    private readonly HttpClient _httpClient;
    private readonly string? _cloudApiUrl;
    private readonly ConcurrentQueue<SyncEvent> _pendingEvents = new();
    private bool _isOnline;

    public CloudSyncService(IServiceProvider services, ILogger<CloudSyncService> logger, IConfiguration config)
    {
        _services = services;
        _logger = logger;
        _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
        _cloudApiUrl = config["CloudSync:ApiUrl"] ?? Environment.GetEnvironmentVariable("CLOUD_SYNC_API_URL");

        if (string.IsNullOrEmpty(_cloudApiUrl))
        {
            _logger.LogInformation("Cloud sync disabled — no CLOUD_SYNC_API_URL configured");
        }
        else
        {
            _logger.LogInformation("Cloud sync enabled → {Url}", _cloudApiUrl);
        }
    }

    /// <summary>
    /// Queue a match state update for cloud sync.
    /// </summary>
    public void QueueSync(string matchId, MatchStateUpdateDto state)
    {
        if (string.IsNullOrEmpty(_cloudApiUrl)) return;

        _pendingEvents.Enqueue(new SyncEvent
        {
            MatchId = matchId,
            State = state,
            Timestamp = DateTime.UtcNow
        });
    }

    public int PendingCount => _pendingEvents.Count;
    public bool IsOnline => _isOnline;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (string.IsNullOrEmpty(_cloudApiUrl)) return;

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessQueue(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Cloud sync error: {Message}", ex.Message);
                _isOnline = false;
            }

            await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
        }
    }

    private async Task ProcessQueue(CancellationToken ct)
    {
        if (_pendingEvents.IsEmpty)
        {
            // Periodic health check
            try
            {
                var response = await _httpClient.GetAsync($"{_cloudApiUrl}/health", ct);
                _isOnline = response.IsSuccessStatusCode;
            }
            catch
            {
                _isOnline = false;
            }
            return;
        }

        // Try to send pending events
        while (_pendingEvents.TryPeek(out var evt))
        {
            try
            {
                var json = JsonSerializer.Serialize(evt.State, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(
                    $"{_cloudApiUrl}/api/matches/{evt.MatchId}/sync",
                    content, ct);

                if (response.IsSuccessStatusCode)
                {
                    _pendingEvents.TryDequeue(out _);
                    _isOnline = true;
                }
                else
                {
                    _isOnline = false;
                    break; // Stop trying, will retry next cycle
                }
            }
            catch
            {
                _isOnline = false;
                break;
            }
        }
    }

    private class SyncEvent
    {
        public string MatchId { get; set; } = "";
        public MatchStateUpdateDto State { get; set; } = new();
        public DateTime Timestamp { get; set; }
    }
}
