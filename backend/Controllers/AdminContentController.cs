using AuraTech.Api.Data;
using AuraTech.Api.Models;
using AuraTech.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AuraTech.Api.Controllers;

[ApiController, Authorize]
[Route("api/admin/banners")]
public class AdminBannersController : ControllerBase
{
    private readonly AppDb _db;
    public AdminBannersController(AppDb db) { _db = db; }

    [HttpGet]
    public async Task<List<Banner>> List() =>
        await _db.Banners.AsNoTracking().OrderBy(b => b.SortOrder).ThenBy(b => b.Id).ToListAsync();

    private static string? Check(BannerInput i)
    {
        if (!TextUtil.IsSafeImageUrl(i.ImageUrl)) return "URL ảnh phải là đường dẫn /uploads/... hoặc https://...";
        if (!TextUtil.IsSafeLink(i.LinkUrl)) return "Liên kết phải bắt đầu bằng / hoặc http(s)://";
        return null;
    }

    private static void Apply(Banner b, BannerInput i)
    {
        b.Title = i.Title.Trim();
        b.Subtitle = i.Subtitle.Trim();
        b.ImageUrl = string.IsNullOrWhiteSpace(i.ImageUrl) ? null : i.ImageUrl.Trim();
        b.LinkUrl = string.IsNullOrWhiteSpace(i.LinkUrl) ? null : i.LinkUrl.Trim();
        b.LinkText = string.IsNullOrWhiteSpace(i.LinkText) ? null : i.LinkText.Trim();
        b.SortOrder = i.SortOrder;
        b.IsActive = i.IsActive;
    }

    [HttpPost]
    public async Task<IActionResult> Create(BannerInput input)
    {
        var err = Check(input);
        if (err != null) return BadRequest(new { message = err });
        var b = new Banner();
        Apply(b, input);
        _db.Banners.Add(b);
        await _db.SaveChangesAsync();
        return Ok(new { id = b.Id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, BannerInput input)
    {
        var b = await _db.Banners.FindAsync(id);
        if (b == null) return NotFound();
        var err = Check(input);
        if (err != null) return BadRequest(new { message = err });
        Apply(b, input);
        await _db.SaveChangesAsync();
        return Ok(new { id = b.Id });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var b = await _db.Banners.FindAsync(id);
        if (b == null) return NotFound();
        _db.Banners.Remove(b);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

[ApiController, Authorize]
[Route("api/admin/pages")]
public class AdminPagesController : ControllerBase
{
    private readonly AppDb _db;
    public AdminPagesController(AppDb db) { _db = db; }

    [HttpGet]
    public async Task<List<ContentPage>> List() =>
        await _db.Pages.AsNoTracking().OrderBy(p => p.SortOrder).ThenBy(p => p.Id).ToListAsync();

    [HttpPost]
    public async Task<IActionResult> Create(PageInput input)
    {
        var slug = string.IsNullOrWhiteSpace(input.Slug) ? TextUtil.Slug(input.Title) : input.Slug!;
        if (await _db.Pages.AnyAsync(p => p.Slug == slug))
            return Conflict(new { message = "Đường dẫn (slug) đã tồn tại." });
        var p = new ContentPage { Slug = slug, Title = input.Title.Trim(), Body = input.Body, ShowInFooter = input.ShowInFooter, SortOrder = input.SortOrder };
        _db.Pages.Add(p);
        await _db.SaveChangesAsync();
        return Ok(new { id = p.Id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, PageInput input)
    {
        var p = await _db.Pages.FindAsync(id);
        if (p == null) return NotFound();
        p.Title = input.Title.Trim();
        p.Body = input.Body;
        p.ShowInFooter = input.ShowInFooter;
        p.SortOrder = input.SortOrder;
        await _db.SaveChangesAsync();
        return Ok(new { id = p.Id });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var p = await _db.Pages.FindAsync(id);
        if (p == null) return NotFound();
        _db.Pages.Remove(p);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

[ApiController, Authorize]
[Route("api/admin/settings")]
public class AdminSettingsController : ControllerBase
{
    private readonly AppDb _db;
    public AdminSettingsController(AppDb db) { _db = db; }

    [HttpGet]
    public async Task<Dictionary<string, string>> Get() =>
        await _db.Settings.AsNoTracking().ToDictionaryAsync(s => s.Key, s => s.Value);

    [HttpPut]
    public async Task<IActionResult> Put(Dictionary<string, string> values)
    {
        var rows = await _db.Settings.ToListAsync();
        foreach (var row in rows)
        {
            if (!values.TryGetValue(row.Key, out var v)) continue;
            v = (v ?? "").Trim();
            if (v.Length > 2000) return BadRequest(new { message = $"Giá trị '{row.Key}' quá dài." });
            if (row.Key == "hero_image" && !TextUtil.IsSafeImageUrl(v))
                return BadRequest(new { message = "Ảnh hero phải là đường dẫn /uploads/... hoặc https://..." });
            if (row.Key.EndsWith("_url") && !TextUtil.IsSafeLink(v))
                return BadRequest(new { message = $"'{row.Key}' phải là liên kết http(s)://" });
            row.Value = v;
        }
        await _db.SaveChangesAsync();
        return Ok(new { message = "Đã lưu." });
    }
}

[ApiController, Authorize]
[Route("api/admin/media")]
public class AdminMediaController : ControllerBase
{
    private readonly AppDb _db;
    private readonly ImageStorage _storage;
    private readonly ILogger<AdminMediaController> _log;
    public AdminMediaController(AppDb db, ImageStorage storage, ILogger<AdminMediaController> log) { _db = db; _storage = storage; _log = log; }

    [HttpGet]
    public async Task<List<object>> List() =>
        (await _db.Media.AsNoTracking().OrderByDescending(m => m.Id).ToListAsync())
            .Select(m => (object)new { m.Id, m.Url, m.OriginalName, m.Size, m.CreatedAt }).ToList();

    [HttpPost]
    [RequestSizeLimit(ImageStorage.MaxBytes + 512 * 1024)]
    public async Task<IActionResult> Upload(IFormFile? file)
    {
        if (file == null || file.Length == 0) return BadRequest(new { message = "Chưa chọn file." });
        if (file.Length > ImageStorage.MaxBytes) return BadRequest(new { message = "Ảnh tối đa 5MB." });

        var head = new byte[12];
        int read;
        await using (var s = file.OpenReadStream()) read = await s.ReadAsync(head, 0, head.Length);
        var ext = ImageStorage.DetectExtension(head.AsSpan(0, read).ToArray());
        if (ext == null) return BadRequest(new { message = "Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF." });

        (string FileName, string Url) saved;
        try { saved = await _storage.SaveAsync(file, ext); }
        catch (Exception ex)
        {
            _log.LogError(ex, "Upload ảnh thất bại");
            var detail = ex switch
            {
                HttpRequestException => " Không kết nối được Supabase, kiểm tra Supabase__Url.",
                InvalidOperationException => " Chi tiết: " + (ex.Message.Length > 300 ? ex.Message[..300] : ex.Message),
                _ => ""
            };
            return StatusCode(502, new { message = "Không lưu được ảnh lên kho lưu trữ." + detail });
        }
        var original = Path.GetFileName(file.FileName);
        if (original.Length > 150) original = original[..150];
        var m = new MediaAsset { FileName = saved.FileName, Url = saved.Url, OriginalName = original, Size = file.Length };
        _db.Media.Add(m);
        await _db.SaveChangesAsync();
        return Ok(new { m.Id, m.Url, m.OriginalName, m.Size, m.CreatedAt });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, bool force = false)
    {
        var m = await _db.Media.FindAsync(id);
        if (m == null) return NotFound();
        var url = m.Url;
        var used = await _db.Products.CountAsync(p => p.ImageUrl == url) + await _db.Banners.CountAsync(b => b.ImageUrl == url);
        if (used > 0 && !force)
            return Conflict(new { message = $"Ảnh đang được dùng ở {used} nơi (sản phẩm/banner).", used });
        await _storage.DeleteAsync(m.FileName);
        _db.Media.Remove(m);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

[ApiController, Authorize]
[Route("api/admin/messages")]
public class AdminMessagesController : ControllerBase
{
    private readonly AppDb _db;
    public AdminMessagesController(AppDb db) { _db = db; }

    [HttpGet]
    public async Task<List<ContactMessage>> List() =>
        await _db.Messages.AsNoTracking().OrderByDescending(m => m.Id).Take(500).ToListAsync();

    [HttpPatch("{id:int}/read")]
    public async Task<IActionResult> MarkRead(int id, bool read = true)
    {
        var m = await _db.Messages.FindAsync(id);
        if (m == null) return NotFound();
        m.IsRead = read;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var m = await _db.Messages.FindAsync(id);
        if (m == null) return NotFound();
        _db.Messages.Remove(m);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

[ApiController, Authorize]
[Route("api/admin/stats")]
public class AdminStatsController : ControllerBase
{
    private readonly AppDb _db;
    public AdminStatsController(AppDb db) { _db = db; }

    [HttpGet]
    public async Task<object> Get() => new
    {
        products = await _db.Products.CountAsync(),
        activeProducts = await _db.Products.CountAsync(p => p.IsActive),
        productsWithoutImage = await _db.Products.CountAsync(p => p.ImageUrl == null || p.ImageUrl == ""),
        categories = await _db.Categories.CountAsync(),
        banners = await _db.Banners.CountAsync(b => b.IsActive),
        media = await _db.Media.CountAsync(),
        unreadMessages = await _db.Messages.CountAsync(m => !m.IsRead)
    };
}
