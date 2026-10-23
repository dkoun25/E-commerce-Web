using System.ComponentModel.DataAnnotations;
using AuraTech.Api.Models;

namespace AuraTech.Api;

public class ProductDto
{
    public int Id { get; set; }
    public string Slug { get; set; } = "";
    public string Name { get; set; } = "";
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = "";
    public string CategorySlug { get; set; } = "";
    public string Brand { get; set; } = "";
    public string Model { get; set; } = "";
    public long Price { get; set; }
    public long? OldPrice { get; set; }
    public string? Badge { get; set; }
    public string Description { get; set; } = "";
    public List<string> Specs { get; set; } = new();
    public string? ImageUrl { get; set; }
    public string? SourceUrl { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }

    public static ProductDto From(Product p) => new()
    {
        Id = p.Id, Slug = p.Slug, Name = p.Name, CategoryId = p.CategoryId,
        CategoryName = p.Category?.Name ?? "", CategorySlug = p.Category?.Slug ?? "",
        Brand = p.Brand, Model = p.Model, Price = p.Price, OldPrice = p.OldPrice, Badge = p.Badge,
        Description = p.Description,
        Specs = p.SpecsText.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList(),
        ImageUrl = p.ImageUrl, SourceUrl = p.SourceUrl, IsActive = p.IsActive, SortOrder = p.SortOrder
    };
}

public class ProductInput
{
    [Required, StringLength(200)] public string Name { get; set; } = "";
    [Range(1, int.MaxValue)] public int CategoryId { get; set; }
    [StringLength(80)] public string Brand { get; set; } = "";
    [StringLength(200)] public string Model { get; set; } = "";
    [Range(0, 100_000_000_000)] public long Price { get; set; }
    [Range(0, 100_000_000_000)] public long? OldPrice { get; set; }
    [StringLength(30)] public string? Badge { get; set; }
    [StringLength(5000)] public string Description { get; set; } = "";
    public List<string> Specs { get; set; } = new();
    public string? ImageUrl { get; set; }
    public string? SourceUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}

public class CategoryDto
{
    public int Id { get; set; }
    public string Slug { get; set; } = "";
    public string Name { get; set; } = "";
    public string Tag { get; set; } = "";
    public int Hue { get; set; }
    public int SortOrder { get; set; }
    public int ProductCount { get; set; }
}

public class CategoryInput
{
    [Required, StringLength(80)] public string Name { get; set; } = "";
    [StringLength(30)] public string? Tag { get; set; }
    [Range(0, 360)] public int Hue { get; set; } = 255;
    public int SortOrder { get; set; }
}

public class BannerInput
{
    [Required, StringLength(160)] public string Title { get; set; } = "";
    [StringLength(300)] public string Subtitle { get; set; } = "";
    public string? ImageUrl { get; set; }
    public string? LinkUrl { get; set; }
    [StringLength(40)] public string? LinkText { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public class PageInput
{
    [Required, StringLength(120)] public string Title { get; set; } = "";
    [RegularExpression("^[a-z0-9]+(-[a-z0-9]+)*$")] [StringLength(80)] public string? Slug { get; set; }
    [StringLength(20000)] public string Body { get; set; } = "";
    public bool ShowInFooter { get; set; } = true;
    public int SortOrder { get; set; }
}

public class ContactInput
{
    [Required, StringLength(100)] public string Name { get; set; } = "";
    [StringLength(120), EmailAddress] public string? Email { get; set; }
    [StringLength(20)] public string? Phone { get; set; }
    [StringLength(120)] public string? Subject { get; set; }
    [Required, StringLength(3000, MinimumLength = 5)] public string Message { get; set; } = "";
    public string? Website { get; set; }
}

public class LoginInput
{
    [Required] public string Username { get; set; } = "";
    [Required] public string Password { get; set; } = "";
}

public class ChangePasswordInput
{
    [Required] public string Current { get; set; } = "";
    [Required, MinLength(8), StringLength(100)] public string New { get; set; } = "";
}
