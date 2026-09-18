using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TeknomLed.Application.Auth;
using TeknomLed.Application.Auth.Abstractions;
using TeknomLed.Application.Catalog;
using TeknomLed.Application.Catalog.Abstractions;
using TeknomLed.Application.Options;
using TeknomLed.Application.Persistence;
using TeknomLed.Infrastructure.Auth;
using TeknomLed.Infrastructure.Catalog;
using TeknomLed.Infrastructure.Configuration;
using TeknomLed.Infrastructure.Persistence;

namespace TeknomLed.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.PostConfigure<JwtOptions>(options =>
        {
            options.SigningKey = ConfigCrypto.UnprotectIfNeeded(options.SigningKey);
        });
        services.Configure<GoogleAuthOptions>(configuration.GetSection(GoogleAuthOptions.SectionName));
        services.Configure<CorsOptions>(configuration.GetSection(CorsOptions.SectionName));

        var connectionString = ConfigCrypto.UnprotectIfNeeded(
            configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is required."));

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICatalogService, CatalogService>();
        services.AddScoped<IAdminCatalogService, AdminCatalogService>();
        services.AddSingleton<IPasswordHasherService, PasswordHasherService>();
        services.AddSingleton<ITokenService, TokenService>();
        services.AddSingleton<IGoogleTokenValidator, GoogleTokenValidator>();
        services.AddSingleton<IMediaPathResolver, PassthroughMediaPathResolver>();

        return services;
    }
}
