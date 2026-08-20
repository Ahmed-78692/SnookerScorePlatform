FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files
COPY SnookerScorePlatform.sln .
COPY src/SnookerScore.Domain/SnookerScore.Domain.csproj src/SnookerScore.Domain/
COPY src/SnookerScore.Application/SnookerScore.Application.csproj src/SnookerScore.Application/
COPY src/SnookerScore.Infrastructure/SnookerScore.Infrastructure.csproj src/SnookerScore.Infrastructure/
COPY src/SnookerScore.API/SnookerScore.API.csproj src/SnookerScore.API/
COPY tests/SnookerScore.Domain.Tests/SnookerScore.Domain.Tests.csproj tests/SnookerScore.Domain.Tests/

# Restore
RUN dotnet restore

# Copy everything and build
COPY . .
RUN dotnet publish src/SnookerScore.API/SnookerScore.API.csproj -c Release -o /app/publish --no-restore

# Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENV DOTNET_USE_POLLING_FILE_WATCHER=true
ENV DOTNET_HOSTBUILDER__RELOADCONFIGONCHANGE=false
EXPOSE 8080

ENTRYPOINT ["dotnet", "SnookerScore.API.dll"]
