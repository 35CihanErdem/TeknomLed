using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeknomLed.Application.Auth.Abstractions;
using TeknomLed.Application.Auth.Dtos;

namespace TeknomLed.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    public const string RefreshCookieName = "teknomled_refresh";

    private readonly IAuthService _authService;
    private readonly IHostEnvironment _env;

    public AuthController(
        IAuthService authService,
        IHostEnvironment env)
    {
        _authService = authService;
        _env = env;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register(
        [FromBody] RegisterRequest request,
        CancellationToken ct)
    {
        var result = await _authService.RegisterAsync(request, GetUserAgent(), GetIp(), ct);
        SetRefreshCookie(result.RefreshToken, result.RefreshTokenExpiresAt);
        return Ok(ToResponse(result));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login(
        [FromBody] LoginRequest request,
        CancellationToken ct)
    {
        var result = await _authService.LoginAsync(request, GetUserAgent(), GetIp(), ct);
        SetRefreshCookie(result.RefreshToken, result.RefreshTokenExpiresAt);
        return Ok(ToResponse(result));
    }

    [HttpPost("google")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Google(
        [FromBody] GoogleAuthRequest request,
        CancellationToken ct)
    {
        var result = await _authService.LoginWithGoogleAsync(request, GetUserAgent(), GetIp(), ct);
        SetRefreshCookie(result.RefreshToken, result.RefreshTokenExpiresAt);
        return Ok(ToResponse(result));
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Refresh(CancellationToken ct)
    {
        var refreshToken = Request.Cookies[RefreshCookieName];
        var result = await _authService.RefreshAsync(refreshToken ?? string.Empty, GetUserAgent(), GetIp(), ct);
        SetRefreshCookie(result.RefreshToken, result.RefreshTokenExpiresAt);
        return Ok(ToResponse(result));
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        var refreshToken = Request.Cookies[RefreshCookieName];
        await _authService.LogoutAsync(refreshToken, ct);
        ClearRefreshCookie();
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<AuthUserDto>> Me(CancellationToken ct)
    {
        var userId = GetUserId();
        var user = await _authService.GetCurrentUserAsync(userId, ct);
        return Ok(user);
    }

    [HttpPut("profile")]
    [Authorize]
    public async Task<ActionResult<AuthUserDto>> UpdateProfile(
        [FromBody] UpdateProfileRequest request,
        CancellationToken ct)
    {
        var userId = GetUserId();
        var user = await _authService.UpdateProfileAsync(userId, request, ct);
        return Ok(user);
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(sub, out var userId))
        {
            throw new AuthException("unauthorized", "Kimlik doğrulama gerekli.", 401);
        }

        return userId;
    }

    private string? GetUserAgent() => Request.Headers.UserAgent.ToString();

    private string? GetIp() => HttpContext.Connection.RemoteIpAddress?.ToString();

    private static AuthResponse ToResponse(AuthTokensResult result)
        => new(result.AccessToken, result.AccessTokenExpiresAt, result.User);

    private void SetRefreshCookie(string refreshToken, DateTimeOffset expiresAt)
    {
        // Development: Lax + non-Secure for local Angular proxy (same-site via proxy).
        // Production: None + Secure for cross-origin SPA → API.
        var isDev = _env.IsDevelopment();
        Response.Cookies.Append(RefreshCookieName, refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = !isDev,
            SameSite = isDev ? SameSiteMode.Lax : SameSiteMode.None,
            Expires = expiresAt.UtcDateTime,
            Path = "/api/auth",
            IsEssential = true
        });
    }

    private void ClearRefreshCookie()
    {
        var isDev = _env.IsDevelopment();
        Response.Cookies.Append(RefreshCookieName, string.Empty, new CookieOptions
        {
            HttpOnly = true,
            Secure = !isDev,
            SameSite = isDev ? SameSiteMode.Lax : SameSiteMode.None,
            Expires = DateTimeOffset.UnixEpoch.UtcDateTime,
            Path = "/api/auth",
            IsEssential = true
        });
    }
}

public sealed record AuthResponse(
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAt,
    AuthUserDto User);
