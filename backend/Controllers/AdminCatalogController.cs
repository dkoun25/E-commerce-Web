using AuraTech.Api.Data;
using AuraTech.Api.Models;
using AuraTech.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AuraTech.Api.Controllers;

[ApiController, Authorize]
[Route("api/admin/products")]
public class AdminProductsController : ControllerBase
{
    private readonly AppDb _db;
    public AdminProductsController(AppDb db) { _db = db; }

    [HttpGet]
    public async Task<List<ProductDto>> List(string? q, int? categoryId)
    {
        var query = _db.Products.AsNoTracking().Include(p => p.Category).AsQueryable();
        if (categoryId != null) query = query.Where(p => p.CategoryId == categoryId);
        if (!string.IsNullOrWhiteSpace(q)) { var t = TextUtil.Fold(q); query = query.Where(p => p.SearchText.Contains(t)); }
        var items = await query.OrderBy(p => p.SortOrder).ThenBy(p => p.Id).ToListAsync();
        return items.Select(ProductDto.From).ToList();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductDto>> Get(int id)
    {
        var p = await _db.Products.AsNoTracking().Include(x => x.Category).FirstOrDefaultAsync(x => x.Id == id);
        return p == null ? NotFound() : ProductDto.From(p);
    }

    private async Task<string?> Validate(ProductInput i)
    {
        if (!await _db.Categories.AnyAsync(c => c.Id == i.CategoryId)) return "Danh mục không tồn tại.";
        if (i.OldPrice != null && i.OldPrice <= i.Price) return "Giá cũ phải lớn hơn giá bán (hoặc để trống).";
        if (!TextUtil.IsSafeImageUrl(i.ImageUrl)) return "URL ảnh phải là đường dẫn /uploads/... hoặc https://...";
        if (!TextUtil.IsSafeLink(i.SourceUrl)) return "URL nguồn tham chiếu không hợp lệ.";
        return null;
    }

    private static void Apply(Product p, ProductInput i)
    {
        p.Name = i.Name.Trim();
        p.CategoryId = i.CategoryId;
        p.Brand = i.Brand.Trim();
        p.Model = i.Model.Trim();
        p.Price = i.Price;
        p.OldPrice = i.OldPrice;
        p.Badge = string.IsNullOrWhiteSpace(i.Badge) ? null : i.Badge.Trim();
        p.Description = i.Description.Trim();
        p.SpecsText = string.Join("\n", i.Specs.Select(s => s.Trim()).Where(s => s.Length > 0)
            .Select(s => s.Length > 200 ? s[..200] : s).Take(12));
        p.ImageUrl = string.IsNullOrWhiteSpace(i.ImageUrl) ? null : i.ImageUrl.Trim();
        p.SourceUrl = string.IsNullOrWhiteSpace(i.SourceUrl) ? null : i.SourceUrl.Trim();
        p.IsActive = i.IsActive;
        p.SortOrder = i.SortOrder;
        p.SearchText = TextUtil.Fold($"{p.Name} {p.Brand} {p.Model}");
    }

    [HttpPost]
    public async Task<IActionResult> Create(ProductInput input)
    {
        var err = await Validate(input);
        if (err != null) return BadRequest(new { message = err });
        var p = new Product();
        Apply(p, input);
        var baseSlug = TextUtil.Slug(p.Name);
        var slug = baseSlug;
        for (var n = 2; await _db.Products.AnyAsync(x => x.Slug == slug); n++) slug = $"{baseSlug}-{n}";
        p.Slug = slug;
        _db.Products.Add(p);
        await _db.SaveChangesAsync();
        return Ok(new { id = p.Id, slug = p.Slug });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, ProductInput input)
    {
        var p = await _db.Products.FindAsync(id);
        if (p == null) return NotFound();
        var err = await Validate(input);
        if (err != null) return BadRequest(new { message = err });
        Apply(p, input);
        await _db.SaveChangesAsync();
        return Ok(new { id = p.Id, slug = p.Slug });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var p = await _db.Products.FindAsync(id);
        if (p == null) return NotFound();
        _db.Products.Remove(p);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

[ApiController, Authorize]
[Route("api/admin/categories")]
public class AdminCategoriesController : ControllerBase
{
    private readonly AppDb _db;
    public AdminCategoriesController(AppDb db) { _db = db; }

    [HttpGet]
    public async Task<List<CategoryDto>> List() =>
        await _db.Categories.AsNoTracking().OrderBy(c => c.SortOrder).ThenBy(c => c.Id)
            .Select(c => new CategoryDto { Id = c.Id, Slug = c.Slug, Name = c.Name, Tag = c.Tag, Hue = c.Hue, SortOrder = c.SortOrder, ProductCount = c.Products.Count })
            .ToListAsync();

    [HttpPost]
    public async Task<IActionResult> Create(CategoryInput input)
    {
        var baseSlug = TextUtil.Slug(input.Name);
        var slug = baseSlug;
        for (var n = 2; await _db.Categories.AnyAsync(x => x.Slug == slug); n++) slug = $"{baseSlug}-{n}";
        var c = new Category { Name = input.Name.Trim(), Tag = string.IsNullOrWhiteSpace(input.Tag) ? input.Name.Trim() : input.Tag.Trim(), Hue = input.Hue, Slug = slug, SortOrder = input.SortOrder };
        _db.Categories.Add(c);
        await _db.SaveChangesAsync();
        return Ok(new { id = c.Id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, CategoryInput input)
    {
        var c = await _db.Categories.FindAsync(id);
        if (c == null) return NotFound();
        c.Name = input.Name.Trim();
        c.Tag = string.IsNullOrWhiteSpace(input.Tag) ? c.Name : input.Tag.Trim();
        c.Hue = input.Hue;
        c.SortOrder = input.SortOrder;
        await _db.SaveChangesAsync();
        return Ok(new { id = c.Id });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var c = await _db.Categories.FindAsync(id);
        if (c == null) return NotFound();
        if (await _db.Products.AnyAsync(p => p.CategoryId == id))
            return Conflict(new { message = "Danh mục đang có sản phẩm. Hãy chuyển hoặc xóa sản phẩm trước." });
        _db.Categories.Remove(c);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
