using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace TeknomLed.Api.Authorization;

public static class PermissionNames
{
    public const string ProductView = "PRODUCT_VIEW";
    public const string ProductCreate = "PRODUCT_CREATE";
    public const string ProductUpdate = "PRODUCT_UPDATE";
    public const string UserRoleUpdate = "USER_ROLE_UPDATE";
}

public sealed class PermissionRequirement : IAuthorizationRequirement
{
    public PermissionRequirement(string permission)
    {
        Permission = permission;
    }

    public string Permission { get; }
}

public sealed class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        // Permissions are loaded via /me for UX; API policies can later load from DB.
        // For Phase 7 foundation, role claims are on the JWT; permission policies are registered
        // and ready. Handlers succeed when a dedicated permission claim exists.
        var hasPermission = context.User.Claims.Any(c =>
            c.Type == "permission" &&
            string.Equals(c.Value, requirement.Permission, StringComparison.OrdinalIgnoreCase));

        if (hasPermission)
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public sealed class RequirePermissionAttribute : AuthorizeAttribute
{
    public RequirePermissionAttribute(string permission)
    {
        Policy = $"perm:{permission}";
    }
}

public static class AuthorizationExtensions
{
    public static IServiceCollection AddTeknomLedAuthorization(this IServiceCollection services)
    {
        services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();
        services.AddAuthorization(options =>
        {
            foreach (var permission in Domain.Auth.PermissionNames.All)
            {
                options.AddPolicy($"perm:{permission}", policy =>
                    policy.Requirements.Add(new PermissionRequirement(permission)));
            }
        });

        return services;
    }
}
