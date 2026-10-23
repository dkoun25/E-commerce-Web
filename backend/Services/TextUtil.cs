using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace AuraTech.Api.Services;

public static class TextUtil
{
    public static string Fold(string? s)
    {
        if (string.IsNullOrWhiteSpace(s)) return "";
        var d = s.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(d.Length);
        foreach (var ch in d)
            if (CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark) sb.Append(ch);
        return sb.ToString().Normalize(NormalizationForm.FormC)
            .Replace('đ', 'd').Replace('Đ', 'D').ToLowerInvariant();
    }

    public static string Slug(string? s)
    {
        var slug = Regex.Replace(Fold(s), "[^a-z0-9]+", "-").Trim('-');
        if (slug.Length > 80) slug = slug[..80].Trim('-');
        return slug.Length == 0 ? "muc" : slug;
    }

    public static bool IsSafeImageUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)) return true;
        if (url.Length > 500) return false;
        if (url.StartsWith("/uploads/") && !url.Contains("..")) return true;
        return Uri.TryCreate(url, UriKind.Absolute, out var u) && u.Scheme == Uri.UriSchemeHttps;
    }

    public static bool IsSafeLink(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)) return true;
        if (url.Length > 500) return false;
        if (url.StartsWith("/") && !url.StartsWith("//")) return true;
        return Uri.TryCreate(url, UriKind.Absolute, out var u) &&
               (u.Scheme == Uri.UriSchemeHttps || u.Scheme == Uri.UriSchemeHttp);
    }
}
