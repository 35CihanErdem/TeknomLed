using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using TeknomLed.Domain.Catalog;
using TeknomLed.Domain.Entities;

namespace TeknomLed.Infrastructure.Persistence;

/// <summary>
/// Development/test catalog seed adapted from the Angular mock catalog.
/// NOT official customer product data.
/// </summary>
public static class CatalogSeed
{
    private const string Img = "/assets/images/home";

    public static async Task SeedAsync(AppDbContext db, CancellationToken ct = default)
    {
        if (await db.Products.AnyAsync(ct))
        {
            return;
        }

        var now = DateTimeOffset.UtcNow;

        var categories = new[]
        {
            Cat("duvar-aplikleri", "Duvar Aplikleri", 1),
            Cat("zemin-spotlari", "Zemin Spotları", 2),
            Cat("lineer-aydinlatma", "Lineer Aydınlatma", 3),
            Cat("sarkit-aydinlatma", "Sarkıt Aydınlatma", 4),
            Cat("panel-aydinlatma", "Panel Aydınlatma", 5),
            Cat("yol-peyzaj", "Yol & Peyzaj", 6),
        };

        var areas = new[]
        {
            Area("bahce", "Bahçe", 1),
            Area("cephe", "Cephe", 2),
            Area("teras", "Teras", 3),
            Area("yol-yuruyus", "Yol & Yürüyüş", 4),
            Area("ic-mekan", "İç Mekân", 5),
            Area("ticari-alan", "Ticari Alan", 6),
            Area("peyzaj", "Peyzaj", 7),
        };

        db.Categories.AddRange(categories);
        db.ApplicationAreas.AddRange(areas);

        Category Cat(string slug, string name, int order) => new()
        {
            Id = DevGuid($"cat:{slug}"),
            Slug = slug,
            Name = name,
            IsActive = true,
            SortOrder = order,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };

        ApplicationArea Area(string slug, string name, int order) => new()
        {
            Id = DevGuid($"area:{slug}"),
            Slug = slug,
            Name = name,
            IsActive = true,
            SortOrder = order
        };

        Guid CatId(string slug) => categories.First(c => c.Slug == slug).Id;
        Guid AreaId(string name) => areas.First(a => a.Name == name).Id;

        void AddProduct(
            string key,
            string slug,
            string name,
            string shortDescription,
            string categorySlug,
            string[] areaNames,
            bool featured,
            (string type, string file, string alt, int sort)[] media,
            (string name, string value, int sort)[] specs,
            (string sku, int? watt, int? lumen, int? kelvin, string? dims, decimal price, int stock)[] variants)
        {
            var productId = DevGuid($"product:{key}");
            var product = new Product
            {
                Id = productId,
                Slug = slug,
                Name = name,
                ShortDescription = shortDescription,
                CategoryId = CatId(categorySlug),
                IsFeatured = featured,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            };

            foreach (var areaName in areaNames)
            {
                product.ProductApplicationAreas.Add(new ProductApplicationArea
                {
                    ProductId = productId,
                    ApplicationAreaId = AreaId(areaName)
                });
            }

            foreach (var (type, file, alt, sort) in media)
            {
                product.Media.Add(new ProductMedia
                {
                    Id = DevGuid($"media:{key}:{type}:{sort}"),
                    ProductId = productId,
                    Type = type,
                    Path = $"{Img}/{file}",
                    AltText = alt,
                    SortOrder = sort,
                    IsActive = true,
                    CreatedAtUtc = now
                });
            }

            foreach (var (specName, value, sort) in specs)
            {
                product.Specifications.Add(new ProductSpecification
                {
                    Id = DevGuid($"spec:{key}:{specName}"),
                    ProductId = productId,
                    Name = specName,
                    Value = value,
                    SortOrder = sort
                });
            }

            foreach (var v in variants)
            {
                product.Variants.Add(new ProductVariant
                {
                    Id = DevGuid($"variant:{v.sku}"),
                    ProductId = productId,
                    Sku = v.sku,
                    Watt = v.watt,
                    Lumen = v.lumen,
                    Kelvin = v.kelvin,
                    Dimensions = v.dims,
                    Price = v.price,
                    Stock = v.stock,
                    IsActive = true,
                    CreatedAtUtc = now,
                    UpdatedAtUtc = now
                });
            }

            db.Products.Add(product);
        }

        AddProduct(
            "line-wall-120", "line-wall-120", "LINE WALL 120",
            "Cephe ve duvar için lineer wallwasher.",
            "duvar-aplikleri",
            ["Cephe", "Teras", "Ticari Alan"],
            true,
            [
                (MediaTypes.Default, "product-linea.jpg", "LINE WALL 120 duvar aplik", 0),
                (MediaTypes.Application, "category-facade.jpg", "LINE WALL 120 uygulama", 1),
                (MediaTypes.LightOn, "product-linea.jpg", "LINE WALL 120 lights on", 2),
                (MediaTypes.LightOff, "category-path.jpg", "LINE WALL 120 lights off", 3),
            ],
            [
                ("IP", "IP65", 0),
                ("Material", "Alüminyum", 1),
                ("Voltage", "24V DC", 2),
                ("Mounting", "Duvar", 3),
            ],
            [
                ("LW120-30K-20", 20, 1200, 3000, "1200×45×55 mm", 2490m, 24),
                ("LW120-40K-20", 20, 1350, 4000, "1200×45×55 mm", 2590m, 18),
                ("LW120-30K-30", 30, 1850, 3000, "1200×45×55 mm", 2890m, 12),
            ]);

        AddProduct(
            "arc-wall", "arc-wall", "ARC WALL",
            "Yukarı-aşağı yıkama yapan kompakt duvar aplik.",
            "duvar-aplikleri",
            ["Cephe", "Teras", "Bahçe"],
            true,
            [
                (MediaTypes.Default, "product-aura.jpg", "ARC WALL duvar aplik", 0),
                (MediaTypes.Gallery, "category-decorative.jpg", "ARC WALL detay", 1),
            ],
            [
                ("IP", "IP65", 0),
                ("Material", "Alüminyum döküm", 1),
                ("Voltage", "220–240V", 2),
                ("Mounting", "Duvar", 3),
            ],
            [
                ("AW-30K-12", 12, 780, 3000, null, 1280m, 40),
                ("AW-27K-12", 12, 720, 2700, null, 1280m, 22),
            ]);

        AddProduct(
            "terra-spot", "terra-spot", "TERRA SPOT",
            "Gömülü zemin spotu; bahçe ve yol uygulamaları.",
            "zemin-spotlari",
            ["Bahçe", "Yol & Yürüyüş", "Peyzaj"],
            true,
            [
                (MediaTypes.Default, "product-terra.jpg", "TERRA SPOT zemin spotu", 0),
                (MediaTypes.Application, "category-garden.jpg", "TERRA SPOT peyzaj", 1),
            ],
            [
                ("IP", "IP67", 0),
                ("Material", "Paslanmaz çelik", 1),
                ("Voltage", "24V DC", 2),
                ("Mounting", "Gömülü zemin", 3),
                ("Beam Angle", "25° / 40°", 4),
            ],
            [
                ("TS-30K-7", 7, 420, 3000, null, 890m, 56),
                ("TS-40K-7", 7, 460, 4000, null, 920m, 34),
                ("TS-30K-10", 10, 610, 3000, null, 1090m, 20),
            ]);

        AddProduct(
            "step-line", "step-line", "STEP LINE",
            "Merdiven ve basamak kenarı için lineer şerit.",
            "lineer-aydinlatma",
            ["Teras", "İç Mekân", "Ticari Alan"],
            false,
            [
                (MediaTypes.Default, "category-interior.jpg", "STEP LINE lineer aydınlatma", 0),
                (MediaTypes.Gallery, "product-terra.jpg", "STEP LINE detay", 1),
            ],
            [
                ("IP", "IP65", 0),
                ("Material", "Alüminyum profil", 1),
                ("Voltage", "24V DC", 2),
                ("Mounting", "Gömülü / yüzey", 3),
            ],
            [
                ("SL-27K-8", 8, 480, 2700, "600 mm", 740m, 60),
                ("SL-30K-8", 8, 510, 3000, "600 mm", 760m, 48),
            ]);

        AddProduct(
            "nova-60", "nova-60", "NOVA 60",
            "60×60 profesyonel panel; ofis ve ticari alanlar.",
            "panel-aydinlatma",
            ["İç Mekân", "Ticari Alan"],
            true,
            [
                (MediaTypes.Default, "product-aura.jpg", "NOVA 60 LED panel", 0),
                (MediaTypes.Application, "category-interior.jpg", "NOVA 60 uygulama", 1),
            ],
            [
                ("IP", "IP44", 0),
                ("Material", "Alüminyum çerçeve", 1),
                ("Voltage", "220–240V", 2),
                ("Mounting", "Asma tavan", 3),
            ],
            [
                ("N60-40K-40", 40, 4200, 4000, "595×595×10 mm", 2450m, 30),
                ("N60-65K-40", 40, 4400, 6500, "595×595×10 mm", 2490m, 16),
                ("N60-30K-40", 40, 4000, 3000, "595×595×10 mm", 2520m, 10),
            ]);

        AddProduct(
            "axis-mini", "axis-mini", "AXIS MINI",
            "Kompakt yönlendirilebilir spot; vitrin ve cephe.",
            "zemin-spotlari",
            ["Cephe", "Ticari Alan", "Peyzaj"],
            false,
            [
                (MediaTypes.Default, "product-wall.jpg", "AXIS MINI spot", 0),
                (MediaTypes.Application, "category-facade.jpg", "AXIS MINI cephe", 1),
            ],
            [
                ("IP", "IP65", 0),
                ("Material", "Alüminyum", 1),
                ("Voltage", "24V DC", 2),
                ("Beam Angle", "15° / 24°", 3),
                ("Mounting", "Zemin / duvar braketi", 4),
            ],
            [
                ("AM-30K-6", 6, 380, 3000, null, 980m, 45),
                ("AM-40K-6", 6, 410, 4000, null, 980m, 28),
            ]);

        AddProduct(
            "luma-path", "luma-path", "LUMA PATH",
            "Yürüyüş yolu ve peyzaj için bollard aydınlatma.",
            "yol-peyzaj",
            ["Yol & Yürüyüş", "Bahçe", "Peyzaj"],
            false,
            [
                (MediaTypes.Default, "category-path.jpg", "LUMA PATH yol aydınlatma", 0),
                (MediaTypes.Application, "category-garden.jpg", "LUMA PATH bahçe", 1),
            ],
            [
                ("IP", "IP65", 0),
                ("Material", "Alüminyum + PC", 1),
                ("Voltage", "220–240V", 2),
                ("Mounting", "Zemin montaj", 3),
            ],
            [
                ("LP-30K-15", 15, 980, 3000, "H 800 mm", 3180m, 14),
                ("LP-40K-15", 15, 1050, 4000, "H 800 mm", 3180m, 9),
            ]);

        AddProduct(
            "edge-40", "edge-40", "EDGE 40",
            "İnce kenarlı lineer profil; niş ve tavan hatları.",
            "lineer-aydinlatma",
            ["İç Mekân", "Ticari Alan"],
            false,
            [
                (MediaTypes.Default, "product-linea.jpg", "EDGE 40 lineer profil", 0),
                (MediaTypes.Application, "category-interior.jpg", "EDGE 40 uygulama", 1),
            ],
            [
                ("IP", "IP54", 0),
                ("Material", "Alüminyum ekstrüzyon", 1),
                ("Voltage", "24V DC", 2),
                ("Mounting", "Gömülü / asma", 3),
            ],
            [
                ("E40-30K-18", 18, 1400, 3000, "1000 mm", 1650m, 32),
                ("E40-40K-18", 18, 1500, 4000, "1000 mm", 1650m, 26),
                ("E40-30K-28", 28, 2200, 3000, "1500 mm", 2190m, 11),
            ]);

        AddProduct(
            "frame-wall", "frame-wall", "FRAME WALL",
            "Kare çerçeve formunda mimari duvar lambası.",
            "duvar-aplikleri",
            ["Cephe", "Teras", "İç Mekân"],
            false,
            [
                (MediaTypes.Default, "product-wall.jpg", "FRAME WALL duvar lambası", 0),
                (MediaTypes.Gallery, "category-decorative.jpg", "FRAME WALL detay", 1),
            ],
            [
                ("IP", "IP54", 0),
                ("Material", "Alüminyum", 1),
                ("Voltage", "220–240V", 2),
                ("Mounting", "Duvar", 3),
            ],
            [
                ("FW-27K-14", 14, 860, 2700, null, 1420m, 19),
                ("FW-30K-14", 14, 900, 3000, null, 1420m, 27),
            ]);

        AddProduct(
            "orbit-spot", "orbit-spot", "ORBIT SPOT",
            "Döner başlıklı bahçe spotu; ağaç ve heykel vurgusu.",
            "yol-peyzaj",
            ["Bahçe", "Peyzaj", "Teras"],
            false,
            [
                (MediaTypes.Default, "category-garden.jpg", "ORBIT SPOT bahçe spotu", 0),
                (MediaTypes.Gallery, "product-terra.jpg", "ORBIT SPOT detay", 1),
            ],
            [
                ("IP", "IP65", 0),
                ("Material", "Alüminyum döküm", 1),
                ("Voltage", "24V DC", 2),
                ("Beam Angle", "12° / 30°", 3),
                ("Mounting", "Kazık / taban", 4),
            ],
            [
                ("OS-30K-9", 9, 540, 3000, null, 1180m, 38),
                ("OS-40K-9", 9, 580, 4000, null, 1180m, 21),
                ("OS-30K-18", 18, 1100, 3000, null, 1680m, 15),
            ]);

        AddProduct(
            "linea-pro", "linea-pro", "LINEA PRO",
            "Profesyonel dış mekân lineer; uzun cephe hatları.",
            "lineer-aydinlatma",
            ["Cephe", "Ticari Alan", "Peyzaj"],
            true,
            [
                (MediaTypes.Default, "product-linea.jpg", "LINEA PRO lineer aydınlatma", 0),
                (MediaTypes.Application, "project-facade.jpg", "LINEA PRO cephe", 1),
                (MediaTypes.LightOn, "product-linea.jpg", "LINEA PRO lights on", 2),
                (MediaTypes.LightOff, "category-path.jpg", "LINEA PRO lights off", 3),
            ],
            [
                ("IP", "IP67", 0),
                ("Material", "Alüminyum + temperli cam", 1),
                ("Voltage", "24V DC", 2),
                ("Mounting", "Yüzey / braket", 3),
            ],
            [
                ("LPRO-30K-24", 24, 1900, 3000, "1000 mm", 3560m, 17),
                ("LPRO-40K-24", 24, 2050, 4000, "1000 mm", 3560m, 13),
                ("LPRO-30K-48", 48, 3800, 3000, "2000 mm", 6120m, 6),
            ]);

        AddProduct(
            "aura-60", "aura-60", "AURA 60",
            "Sarkıt aydınlatma; lobiler ve yemek alanları.",
            "sarkit-aydinlatma",
            ["İç Mekân", "Ticari Alan"],
            true,
            [
                (MediaTypes.Default, "category-decorative.jpg", "AURA 60 sarkıt aydınlatma", 0),
                (MediaTypes.Gallery, "product-aura.jpg", "AURA 60 detay", 1),
            ],
            [
                ("IP", "IP44", 0),
                ("Material", "Metal + cam", 1),
                ("Voltage", "220–240V", 2),
                ("Mounting", "Tavan askı", 3),
            ],
            [
                ("A60-27K-22", 22, 1600, 2700, null, 4280m, 8),
                ("A60-30K-22", 22, 1700, 3000, null, 4280m, 11),
                ("A60-30K-35", 35, 2600, 3000, null, 5120m, 5),
            ]);

        await db.SaveChangesAsync(ct);
    }

    private static Guid DevGuid(string key)
    {
        var hash = MD5.HashData(Encoding.UTF8.GetBytes($"teknomled-dev:{key}"));
        return new Guid(hash);
    }
}
