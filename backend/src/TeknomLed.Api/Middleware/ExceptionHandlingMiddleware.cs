using System.Text.Json;
using TeknomLed.Application.Auth.Dtos;

namespace TeknomLed.Api.Middleware;

public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger,
        IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (AuthException ex)
        {
            _logger.LogWarning("Auth error {Code}: {Message}", ex.Code, ex.Message);
            await WriteErrorAsync(context, ex.StatusCode, ex.Code, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled server error");
            var message = _env.IsDevelopment()
                ? "Beklenmeyen bir sunucu hatası oluştu."
                : "Beklenmeyen bir sunucu hatası oluştu.";
            await WriteErrorAsync(context, StatusCodes.Status500InternalServerError, "server_error", message);
        }
    }

    private static async Task WriteErrorAsync(HttpContext context, int status, string code, string message)
    {
        if (context.Response.HasStarted)
        {
            return;
        }

        context.Response.Clear();
        context.Response.StatusCode = status;
        context.Response.ContentType = "application/json";

        var payload = new
        {
            error = new
            {
                code,
                message
            }
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
    }
}
