namespace AuraTech.Api.Models;

public class Category
{
    public int Id { get; set; }
    public string Slug { get; set; } = "";
    public string Name { get; set; } = "";
    public string Tag { get; set; } = "";
    public int Hue { get; set; } = 255;
    public int SortOrder { get; set; }
    public List<Product> Products { get; set; } = new();
}

public class Product
{
    public int Id { get; set; }
    public string Slug { get; set; } = "";
    public string Name { get; set; } = "";
    public int CategoryId { get; set; }
    public Category? Category { get; set; }
    public string Brand { get; set; } = "";
    public string Model { get; set; } = "";
    public long Price { get; set; }
    public long? OldPrice { get; set; }
    public string? Badge { get; set; }
    public string Description { get; set; } = "";
    public string SpecsText { get; set; } = "";
    public string? ImageUrl { get; set; }
    public string? SourceUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
    public string SearchText { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Banner
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string Subtitle { get; set; } = "";
    public string? ImageUrl { get; set; }
    public string? LinkUrl { get; set; }
    public string? LinkText { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public class ContentPage
{
    public int Id { get; set; }
    public string Slug { get; set; } = "";
    public string Title { get; set; } = "";
    public string Body { get; set; } = "";
    public bool ShowInFooter { get; set; } = true;
    public int SortOrder { get; set; }
}

public class SiteSetting
{
    public string Key { get; set; } = "";
    public string Value { get; set; } = "";
}

public class MediaAsset
{
    public int Id { get; set; }
    public string FileName { get; set; } = "";
    public string OriginalName { get; set; } = "";
    public string Url { get; set; } = "";
    public long Size { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class ContactMessage
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Subject { get; set; }
    public string Message { get; set; } = "";
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class AdminUser
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string PasswordHash { get; set; } = "";
}
