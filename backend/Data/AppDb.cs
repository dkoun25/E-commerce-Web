using AuraTech.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AuraTech.Api.Data;

public class AppDb : DbContext
{
    public AppDb(DbContextOptions<AppDb> options) : base(options) { }

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Banner> Banners => Set<Banner>();
    public DbSet<ContentPage> Pages => Set<ContentPage>();
    public DbSet<SiteSetting> Settings => Set<SiteSetting>();
    public DbSet<MediaAsset> Media => Set<MediaAsset>();
    public DbSet<ContactMessage> Messages => Set<ContactMessage>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Category>().HasIndex(x => x.Slug).IsUnique();
        b.Entity<Product>().HasIndex(x => x.Slug).IsUnique();
        b.Entity<Product>().HasOne(p => p.Category).WithMany(c => c.Products)
            .HasForeignKey(p => p.CategoryId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<ContentPage>().HasIndex(x => x.Slug).IsUnique();
        b.Entity<SiteSetting>().HasKey(x => x.Key);
        b.Entity<AdminUser>().HasIndex(x => x.Username).IsUnique();
    }
}
