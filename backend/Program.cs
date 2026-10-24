using AuraTech.Api.Data;
using AuraTech.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using System.Text;
using System.Threading.RateLimiting;
using static AuraTech.Api.Services.TokenService;

var builder = WebApplication.CreateBuilder(args);
var cfg = builder.Configuration;

var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(port)) builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

var jwtKey = cfg["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
    throw new InvalidOperationException("Jwt:Key phải có ít nhất 32 ký tự. Đặt qua biến môi trường Jwt__Key.");

var rawConn = cfg.GetConnectionString("Default");
if (string.IsNullOrWhiteSpace(rawConn))
    throw new InvalidOperationException("Thiếu ConnectionStrings:Default. Đặt qua biến môi trường ConnectionStrings__Default (chuỗi kết nối Supabase).");
var connString = ToNpgsql(rawConn);

builder.Services.AddDbContext<AppDb>(o => o.UseNpgsql(connString));
builder.Services.AddHttpClient();
builder.Services.AddSingleton<TokenService>();
builder.Services.AddSingleton<ImageStorage>();
builder.Services.AddControllers();

builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    o.KnownNetworks.Clear();
    o.KnownProxies.Clear();
});

builder.Services.Configure<FormOptions>(o => o.MultipartBodyLengthLimit = ImageStorage.MaxBytes + 512 * 1024);

builder.Services.AddCors(o => o.AddDefaultPolicy(p => p
    .WithOrigins(cfg.GetSection("Cors:Origins").Get<string[]>() ?? new[] { "http://localhost:3000" })
    .AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = JwtDefaults.Issuer(cfg),
            ValidateAudience = true,
            ValidAudience = JwtDefaults.Audience(cfg),
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
        o.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = ctx =>
            {
                ctx.HttpContext.RequestServices.GetRequiredService<ILoggerFactory>()
                    .CreateLogger("Jwt").LogWarning("JWT bị từ chối: {Message}", ctx.Exception.Message);
                return Task.CompletedTask;
            }
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddPolicy("login", ctx => RateLimitPartition.GetFixedWindowLimiter(
        ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 8, Window = TimeSpan.FromMinutes(1) }));
    o.AddPolicy("contact", ctx => RateLimitPartition.GetFixedWindowLimiter(
        ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 5, Window = TimeSpan.FromMinutes(10) }));
});

var app = builder.Build();

try
{
    using var scope = app.Services.CreateScope();
    Seed.Initialize(scope.ServiceProvider.GetRequiredService<AppDb>(), cfg);
}
catch (Exception ex) when (ex is PostgresException { SqlState: "42P01" } || ex.InnerException is PostgresException { SqlState: "42P01" })
{
    throw new InvalidOperationException("Database chưa có bảng. Hãy chạy file supabase/schema.sql trong Supabase SQL Editor trước khi chạy API.", ex);
}

app.UseForwardedHeaders();

app.Use(async (ctx, next) =>
{
    ctx.Response.Headers["X-Content-Type-Options"] = "nosniff";
    await next();
});

app.UseStaticFiles();
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapGet("/healthz", () => Results.Ok(new { status = "ok" }));
app.MapControllers();

app.Run();

static string ToNpgsql(string cs)
{
    if (!cs.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) &&
        !cs.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase)) return cs;

    var uri = new Uri(cs);
    var info = uri.UserInfo.Split(':', 2);
    var db = uri.AbsolutePath.Trim('/');
    return new NpgsqlConnectionStringBuilder
    {
        Host = uri.Host,
        Port = uri.Port > 0 ? uri.Port : 5432,
        Database = string.IsNullOrEmpty(db) ? "postgres" : db,
        Username = Uri.UnescapeDataString(info[0]),
        Password = info.Length > 1 ? Uri.UnescapeDataString(info[1]) : "",
        SslMode = SslMode.Require,
        TrustServerCertificate = true,
        MaxPoolSize = 10
    }.ConnectionString;
}
