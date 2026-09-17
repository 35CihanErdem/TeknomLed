using Microsoft.EntityFrameworkCore;
using TeknomLed.Domain.Auth;
using TeknomLed.Domain.Entities;

namespace TeknomLed.Infrastructure.Persistence;

public static class IdentitySeed
{
    private static readonly Guid CustomerRoleId = Guid.Parse("11111111-1111-1111-1111-111111111101");
    private static readonly Guid WorkerRoleId = Guid.Parse("11111111-1111-1111-1111-111111111102");
    private static readonly Guid ManagerRoleId = Guid.Parse("11111111-1111-1111-1111-111111111103");
    private static readonly Guid AdminRoleId = Guid.Parse("11111111-1111-1111-1111-111111111104");
    private static readonly Guid SuperAdminRoleId = Guid.Parse("11111111-1111-1111-1111-111111111105");

    public static async Task SeedAsync(AppDbContext db, CancellationToken ct = default)
    {
        await SeedRolesAsync(db, ct);
        await SeedPermissionsAsync(db, ct);
        await SeedRolePermissionsAsync(db, ct);
        await db.SaveChangesAsync(ct);
    }

    private static async Task SeedRolesAsync(AppDbContext db, CancellationToken ct)
    {
        var roles = new[]
        {
            new Role { Id = CustomerRoleId, Name = RoleNames.Customer, NormalizedName = RoleNames.Customer, Description = "Storefront customer" },
            new Role { Id = WorkerRoleId, Name = RoleNames.Worker, NormalizedName = RoleNames.Worker, Description = "Production worker" },
            new Role { Id = ManagerRoleId, Name = RoleNames.Manager, NormalizedName = RoleNames.Manager, Description = "Operations manager" },
            new Role { Id = AdminRoleId, Name = RoleNames.Admin, NormalizedName = RoleNames.Admin, Description = "Administrator" },
            new Role { Id = SuperAdminRoleId, Name = RoleNames.SuperAdmin, NormalizedName = RoleNames.SuperAdmin, Description = "Super administrator" }
        };

        foreach (var role in roles)
        {
            if (!await db.Roles.AnyAsync(r => r.NormalizedName == role.NormalizedName, ct))
            {
                db.Roles.Add(role);
            }
        }
    }

    private static async Task SeedPermissionsAsync(AppDbContext db, CancellationToken ct)
    {
        var permissions = PermissionNames.All.Select((name, index) => new Permission
        {
            Id = Guid.Parse($"22222222-2222-2222-2222-{index + 1:D12}"),
            Name = name,
            NormalizedName = name,
            Description = name
        });

        foreach (var permission in permissions)
        {
            if (!await db.Permissions.AnyAsync(p => p.NormalizedName == permission.NormalizedName, ct))
            {
                db.Permissions.Add(permission);
            }
        }
    }

    private static async Task SeedRolePermissionsAsync(AppDbContext db, CancellationToken ct)
    {
        await db.SaveChangesAsync(ct);

        var permissionMap = await db.Permissions.ToDictionaryAsync(p => p.NormalizedName, ct);

        async Task Ensure(Guid roleId, params string[] names)
        {
            foreach (var name in names)
            {
                if (!permissionMap.TryGetValue(name, out var permission))
                {
                    continue;
                }

                var exists = await db.RolePermissions.AnyAsync(
                    rp => rp.RoleId == roleId && rp.PermissionId == permission.Id,
                    ct);
                if (!exists)
                {
                    db.RolePermissions.Add(new RolePermission
                    {
                        RoleId = roleId,
                        PermissionId = permission.Id
                    });
                }
            }
        }

        // CUSTOMER: no staff permissions
        await Ensure(WorkerRoleId,
            PermissionNames.OrderView,
            PermissionNames.OrderUpdate,
            PermissionNames.StockView,
            PermissionNames.StockUpdate,
            PermissionNames.ProductView);

        await Ensure(ManagerRoleId,
            PermissionNames.OrderView,
            PermissionNames.OrderUpdate,
            PermissionNames.ProductView,
            PermissionNames.ProductCreate,
            PermissionNames.ProductUpdate,
            PermissionNames.StockView,
            PermissionNames.StockUpdate,
            PermissionNames.ReportView,
            PermissionNames.UserView);

        await Ensure(AdminRoleId,
            PermissionNames.OrderView,
            PermissionNames.OrderUpdate,
            PermissionNames.ProductView,
            PermissionNames.ProductCreate,
            PermissionNames.ProductUpdate,
            PermissionNames.StockView,
            PermissionNames.StockUpdate,
            PermissionNames.UserView,
            PermissionNames.UserRoleUpdate,
            PermissionNames.ReportView);

        await Ensure(SuperAdminRoleId, PermissionNames.All);
    }
}
