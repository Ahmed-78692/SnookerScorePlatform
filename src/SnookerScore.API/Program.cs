using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using SnookerScore.API.Hubs;
using SnookerScore.Application.Interfaces;
using SnookerScore.Application.Services;
using SnookerScore.Domain.Scoring;
using SnookerScore.Infrastructure.Configuration;
using SnookerScore.Infrastructure.Persistence;
using SnookerScore.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

// MongoDB
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDB"));

// Check if MongoDB is available; use in-memory fallback for development
var useInMemory = builder.Configuration.GetValue<bool>("UseInMemoryStorage");
if (!useInMemory)
{
    try
    {
        var mongoSettings = builder.Configuration.GetSection("MongoDB").Get<MongoDbSettings>()
            ?? new MongoDbSettings();

        // Also check direct environment variable as fallback
        var envConnStr = Environment.GetEnvironmentVariable("MONGODB_CONNECTION_STRING")
            ?? Environment.GetEnvironmentVariable("MongoDB__ConnectionString");
        if (!string.IsNullOrEmpty(envConnStr))
        {
            mongoSettings.ConnectionString = envConnStr;
        }

        var envDbName = Environment.GetEnvironmentVariable("MONGODB_DATABASE_NAME")
            ?? Environment.GetEnvironmentVariable("MongoDB__DatabaseName");
        if (!string.IsNullOrEmpty(envDbName))
        {
            mongoSettings.DatabaseName = envDbName;
        }

        // Re-configure with the resolved settings
        builder.Services.Configure<MongoDbSettings>(opts =>
        {
            opts.ConnectionString = mongoSettings.ConnectionString;
            opts.DatabaseName = mongoSettings.DatabaseName;
        });

        Console.WriteLine($"Connecting to MongoDB: {mongoSettings.ConnectionString[..Math.Min(40, mongoSettings.ConnectionString.Length)]}...");

        var clientSettings = MongoDB.Driver.MongoClientSettings.FromConnectionString(mongoSettings.ConnectionString);
        clientSettings.ServerSelectionTimeout = TimeSpan.FromSeconds(10);
        clientSettings.ConnectTimeout = TimeSpan.FromSeconds(10);
        var testClient = new MongoDB.Driver.MongoClient(clientSettings);

        // Quick connectivity test
        using var cts = new System.Threading.CancellationTokenSource(TimeSpan.FromSeconds(15));
        testClient.ListDatabaseNames(cts.Token).MoveNext(cts.Token);

        Console.WriteLine("✅ MongoDB connected successfully");
        builder.Services.AddSingleton<MongoDbContext>();
        builder.Services.AddScoped<IMatchRepository, MatchRepository>();
        builder.Services.AddScoped<IMatchEventRepository, MatchEventRepository>();
        builder.Services.AddScoped<IPlayerRepository, PlayerRepository>();
        builder.Services.AddScoped<ITournamentRepository, TournamentRepository>();
        builder.Services.AddScoped<IUserRepository, UserRepository>();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"⚠️  MongoDB connection failed: {ex.Message}");
        useInMemory = true;
    }
}

if (useInMemory)
{
    builder.Services.AddSingleton<IMatchRepository, InMemoryMatchRepository>();
    builder.Services.AddSingleton<IMatchEventRepository, InMemoryMatchEventRepository>();
    builder.Services.AddSingleton<IPlayerRepository>(_ => throw new NotImplementedException("Players not available in memory mode"));
    builder.Services.AddSingleton<ITournamentRepository>(_ => throw new NotImplementedException("Tournaments not available in memory mode"));
    builder.Services.AddSingleton<IUserRepository, InMemoryUserRepository>();
    Console.WriteLine("⚠️  MongoDB unavailable — using in-memory storage (data will not persist)");
}

// Domain services
builder.Services.AddSingleton<IScoringEngine, SnookerScoringEngine>();

// Application services
builder.Services.AddScoped<IMatchService, MatchService>();

// SignalR broadcaster
builder.Services.AddScoped<IMatchBroadcaster, SignalRMatchBroadcaster>();

// SignalR
builder.Services.AddSignalR();

// JWT Authentication
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "DefaultDevSecretKey_ChangeInProduction_32chars!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "SnookerScorePlatform",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "SnookerScorePlatform",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };

        // Allow SignalR to receive the token from query string
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// CORS - SignalR requires credentials which means we can't use AllowAnyOrigin
builder.Services.AddCors(options =>
{
    options.AddPolicy("Default", policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? new[] { "http://localhost:3000", "http://localhost:5173", "http://localhost:5078" };

        policy.WithOrigins(origins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Default");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<MatchHub>("/hubs/match");

// Health check
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

app.Run();
