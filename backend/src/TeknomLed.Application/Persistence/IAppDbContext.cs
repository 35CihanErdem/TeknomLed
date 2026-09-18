using TeknomLed.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace TeknomLed.Application.Persistence;

public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<ExternalLogin> ExternalLogins { get; }
    DbSet<Role> Roles { get; }
    DbSet<Permission> Permissions { get; }
    DbSet<UserRole> UserRoles { get; }
    DbSet<RolePermission> RolePermissions { get; }
    DbSet<RefreshSession> RefreshSessions { get; }

    DbSet<Category> Categories { get; }
    DbSet<Product> Products { get; }
    DbSet<ProductVariant> ProductVariants { get; }
    DbSet<ApplicationArea> ApplicationAreas { get; }
    DbSet<ProductApplicationArea> ProductApplicationAreas { get; }
    DbSet<ProductSpecification> ProductSpecifications { get; }
    DbSet<ProductMedia> ProductMedia { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
