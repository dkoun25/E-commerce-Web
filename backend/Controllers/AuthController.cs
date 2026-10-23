using System.Security.Claims;
using AuraTech.Api.Data;
using AuraTech.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace AuraTech.Api.Controllers;

[ApiController]
public class AuthController : ControllerBase
{
    private readonly AppDb _db;
    private readonly TokenService _tokens;
    public AuthController(AppDb db, TokenService tokens) { _db = db; _tokens = tokens; }

    [HttpPost("api/auth/login")]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Login(LoginInput input)
    {
        var user = await _db.AdminUsers.FirstOrDefaultAsync(u => u.Username == input.Username);
        if (user == null || !PasswordHasher.Verify(input.Password, user.PasswordHash))
            return Unauthorized(new { message = "Sai tên đăng nhập hoặc mật khẩu." });
        var (token, expires) = _tokens.Create(user.Username);
        return Ok(new { token, expiresAt = expires, username = user.Username });
    }

    [Authorize]
    [HttpGet("api/auth/me")]
    public IActionResult Me() => Ok(new { username = User.Identity?.Name });

    [Authorize]
    [HttpPost("api/admin/password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordInput input)
    {
        var name = User.FindFirstValue(ClaimTypes.Name);
        var user = await _db.AdminUsers.FirstOrDefaultAsync(u => u.Username == name);
        if (user == null || !PasswordHasher.Verify(input.Current, user.PasswordHash))
            return BadRequest(new { message = "Mật khẩu hiện tại không đúng." });
        user.PasswordHash = PasswordHasher.Hash(input.New);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Đã đổi mật khẩu." });
    }
}
