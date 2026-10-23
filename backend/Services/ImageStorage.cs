using System.Net.Http.Headers;

namespace AuraTech.Api.Services;

public class ImageStorage
{
    public const long MaxBytes = 5 * 1024 * 1024;

    private readonly string? _supaUrl;
    private readonly string? _supaKey;
    private readonly string _bucket;
    private readonly IHttpClientFactory _http;
    private readonly ILogger<ImageStorage> _log;
    private readonly string _dir;

    public ImageStorage(IConfiguration cfg, IWebHostEnvironment env, IHttpClientFactory http, ILogger<ImageStorage> log)
    {
        _supaUrl = cfg["Supabase:Url"]?.Trim().TrimEnd('/');
        _supaKey = cfg["Supabase:ServiceKey"]?.Trim();
        _bucket = string.IsNullOrWhiteSpace(cfg["Supabase:Bucket"]) ? "product-images" : cfg["Supabase:Bucket"]!.Trim();
        _http = http;
        _log = log;
        var root = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
        _dir = Path.Combine(root, "uploads");
        if (!UsesSupabase) Directory.CreateDirectory(_dir);
    }

    public bool UsesSupabase => !string.IsNullOrWhiteSpace(_supaUrl) && !string.IsNullOrWhiteSpace(_supaKey);

    public static string? DetectExtension(byte[] head)
    {
        if (head.Length >= 3 && head[0] == 0xFF && head[1] == 0xD8 && head[2] == 0xFF) return ".jpg";
        if (head.Length >= 8 && head[0] == 0x89 && head[1] == 0x50 && head[2] == 0x4E && head[3] == 0x47
            && head[4] == 0x0D && head[5] == 0x0A && head[6] == 0x1A && head[7] == 0x0A) return ".png";
        if (head.Length >= 6 && head[0] == 'G' && head[1] == 'I' && head[2] == 'F' && head[3] == '8'
            && (head[4] == '7' || head[4] == '9') && head[5] == 'a') return ".gif";
        if (head.Length >= 12 && head[0] == 'R' && head[1] == 'I' && head[2] == 'F' && head[3] == 'F'
            && head[8] == 'W' && head[9] == 'E' && head[10] == 'B' && head[11] == 'P') return ".webp";
        return null;
    }

    private static string MimeFor(string ext) => ext switch
    {
        ".jpg" => "image/jpeg",
        ".png" => "image/png",
        ".gif" => "image/gif",
        _ => "image/webp"
    };

    private HttpRequestMessage NewRequest(HttpMethod method, string objectPath)
    {
        var req = new HttpRequestMessage(method, $"{_supaUrl}/storage/v1/object/{objectPath}");
        req.Headers.TryAddWithoutValidation("apikey", _supaKey);
        if (!_supaKey!.StartsWith("sb_")) req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _supaKey);
        return req;
    }

    public async Task<(string FileName, string Url)> SaveAsync(IFormFile file, string ext)
    {
        var name = Guid.NewGuid().ToString("N") + ext;

        if (!UsesSupabase)
        {
            await using var fs = new FileStream(Path.Combine(_dir, name), FileMode.CreateNew, FileAccess.Write);
            await file.CopyToAsync(fs);
            return (name, "/uploads/" + name);
        }

        byte[] bytes;
        await using (var ms = new MemoryStream())
        {
            await file.CopyToAsync(ms);
            bytes = ms.ToArray();
        }
        using var req = NewRequest(HttpMethod.Post, $"{_bucket}/{name}");
        req.Headers.TryAddWithoutValidation("x-upsert", "false");
        req.Content = new ByteArrayContent(bytes);
        req.Content.Headers.ContentType = new MediaTypeHeaderValue(MimeFor(ext));
        using var res = await _http.CreateClient().SendAsync(req);
        if (!res.IsSuccessStatusCode)
        {
            var body = await res.Content.ReadAsStringAsync();
            throw new InvalidOperationException($"Supabase Storage trả về {(int)res.StatusCode}: {body}");
        }
        return (name, $"{_supaUrl}/storage/v1/object/public/{_bucket}/{name}");
    }

    public async Task DeleteAsync(string fileName)
    {
        var safe = Path.GetFileName(fileName);
        if (!UsesSupabase)
        {
            var path = Path.Combine(_dir, safe);
            if (File.Exists(path)) File.Delete(path);
            return;
        }
        try
        {
            using var req = NewRequest(HttpMethod.Delete, $"{_bucket}/{safe}");
            using var res = await _http.CreateClient().SendAsync(req);
            if (!res.IsSuccessStatusCode)
                _log.LogWarning("Xóa file {File} trên Supabase Storage thất bại: {Status}", safe, (int)res.StatusCode);
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "Xóa file {File} trên Supabase Storage thất bại", safe);
        }
    }
}
