using AuraTech.Api.Data;
using AuraTech.Api.Models;
using AuraTech.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace AuraTech.Api.Controllers;

[ApiController]
[Route("api")]
public class PublicController : ControllerBase
{
    private readonly AppDb _db;
    public PublicController(AppDb db) { _db = db; }

    [HttpGet("categories")]
    public async Task<List<CategoryDto>> Categories() =>
        await _db.Categories.AsNoTracking().OrderBy(c => c.SortOrder).ThenBy(c => c.Id)
            .Select(c => new CategoryDto
            {
                Id = c.Id, Slug = c.Slug, Name = c.Name, Tag = c.Tag, Hue = c.Hue, SortOrder = c.SortOrder,
                ProductCount = c.Products.Count(p => p.IsActive)
            }).ToListAsync();

    [HttpGet("products")]
    public async Task<List<ProductDto>> Products(string? category, string? q, string? sort, bool? onSale, string? badge, int? take)
    {
        var query = _db.Products.AsNoTracking().Include(p => p.Category).Where(p => p.IsActive);
        if (!string.IsNullOrWhiteSpace(category)) query = query.Where(p => p.Category!.Slug == category);
        if (onSale == true) query = query.Where(p => p.OldPrice != null && p.OldPrice > p.Price);
        if (!string.IsNullOrWhiteSpace(badge)) query = query.Where(p => p.Badge == badge);
        if (!string.IsNullOrWhiteSpace(q))
        {
            var t = TextUtil.Fold(q.Trim());
            query = query.Where(p => p.SearchText.Contains(t) || p.Category!.Slug.Contains(t));
        }
        query = sort switch
        {
            "price_asc" => query.OrderBy(p => p.Price),
            "price_desc" => query.OrderByDescending(p => p.Price),
            "name" => query.OrderBy(p => p.Name),
            _ => query.OrderBy(p => p.SortOrder).ThenBy(p => p.Id)
        };
        if (take is > 0) query = query.Take(Math.Min(take.Value, 100));
        var items = await query.ToListAsync();
        return items.Select(ProductDto.From).ToList();
    }

    [HttpGet("products/{slug}")]
    public async Task<ActionResult<ProductDto>> Product(string slug)
    {
        var p = await _db.Products.AsNoTracking().Include(x => x.Category)
            .FirstOrDefaultAsync(x => x.Slug == slug && x.IsActive);
        return p == null ? NotFound() : ProductDto.From(p);
    }

    [HttpGet("banners")]
    public async Task<List<Banner>> Banners() =>
        await _db.Banners.AsNoTracking().Where(b => b.IsActive).OrderBy(b => b.SortOrder).ThenBy(b => b.Id).ToListAsync();

    [HttpGet("settings")]
    public async Task<Dictionary<string, string>> Settings() =>
        await _db.Settings.AsNoTracking().ToDictionaryAsync(s => s.Key, s => s.Value);

    [HttpGet("pages")]
    public async Task<List<object>> Pages() =>
        (await _db.Pages.AsNoTracking().Where(p => p.ShowInFooter).OrderBy(p => p.SortOrder).ThenBy(p => p.Id)
            .Select(p => new { p.Slug, p.Title }).ToListAsync()).Cast<object>().ToList();

    [HttpGet("pages/{slug}")]
    public async Task<ActionResult<ContentPage>> Page(string slug)
    {
        var p = await _db.Pages.AsNoTracking().FirstOrDefaultAsync(x => x.Slug == slug);
        return p == null ? NotFound() : p;
    }

    [HttpPost("contact")]
    [EnableRateLimiting("contact")]
    public async Task<IActionResult> Contact(ContactInput input)
    {
        if (!string.IsNullOrEmpty(input.Website)) return NoContent();
        var phone = input.Phone?.Trim();
        var email = input.Email?.Trim();
        if (string.IsNullOrWhiteSpace(phone) && string.IsNullOrWhiteSpace(email))
            return BadRequest(new { message = "Vui lòng nhập số điện thoại hoặc email để chúng tôi liên hệ lại." });
        if (!string.IsNullOrEmpty(phone) && !System.Text.RegularExpressions.Regex.IsMatch(phone, @"^[0-9+\s().-]{8,20}$"))
            return BadRequest(new { message = "Số điện thoại không hợp lệ." });
        _db.Messages.Add(new ContactMessage
        {
            Name = input.Name.Trim(), Email = string.IsNullOrWhiteSpace(email) ? null : email,
            Phone = string.IsNullOrWhiteSpace(phone) ? null : phone,
            Subject = string.IsNullOrWhiteSpace(input.Subject) ? null : input.Subject.Trim(),
            Message = input.Message.Trim()
        });
        await _db.SaveChangesAsync();
        return Ok(new { message = "Đã gửi thành công" });
    }
}
