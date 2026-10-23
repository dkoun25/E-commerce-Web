using AuraTech.Api.Models;
using AuraTech.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace AuraTech.Api.Data;

public static class Seed
{
    public static readonly Dictionary<string, string> DefaultSettings = new()
    {
        ["site_name"] = "Aura Tech",
        ["tagline"] = "Linh kiện máy tính chính hãng",
        ["announcement"] = "",
        ["hotline"] = "0347071025",
        ["email"] = "computersupport@aura.vn",
        ["address"] = "Hàm Thuận, Lâm Đồng, Việt Nam",
        ["working_hours"] = "08:00 - 21:00 (Thứ 2 - Chủ nhật)",
        ["facebook_url"] = "",
        ["zalo_url"] = "",
        ["youtube_url"] = "",
        ["footer_about"] = "Aura Tech cung cấp CPU, card đồ họa, mainboard, RAM, SSD, nguồn, tản nhiệt, vỏ case, màn hình và gaming gear cho game thủ, người làm đồ họa và văn phòng.",
        ["contact_intro"] = "Cần tư vấn cấu hình, báo giá hoặc hỗ trợ sau mua? Gửi thông tin cho chúng tôi, nhân viên sẽ liên hệ lại sớm nhất.",
        ["hero_eyebrow"] = "Aura Tech - linh kiện máy tính",
        ["hero_title"] = "Xung nhịp chuẩn,",
        ["hero_highlight"] = "từng chi tiết.",
        ["hero_lead"] = "Aura Tech chọn lọc CPU, GPU, Mainboard, RAM, SSD và Gaming Gear cho game thủ, dân đồ họa và cả những bộ máy văn phòng cần sự ổn định.",
        ["hero_tag1"] = "DDR5 6000 MHz",
        ["hero_tag2"] = "PCIe 4.0 NVMe",
        ["hero_tag3"] = "RTX 4070 SUPER 12GB",
        ["hero_image"] = "",
        ["about_text"] = "Aura Tech là cửa hàng linh kiện máy tính theo hướng chọn lọc: ít mã hàng nhưng đủ các nhóm chính, thông số rõ ràng, dễ so sánh.",
        ["copyright"] = "© 2026 Aura Tech. Website demo, giá và sản phẩm chỉ mang tính minh họa."
    };

    public static void Initialize(AppDb db, IConfiguration cfg)
    {
        if (!db.AdminUsers.Any())
        {
            var user = cfg["Admin:Username"] ?? "admin";
            var pass = cfg["Admin:Password"];
            if (string.IsNullOrWhiteSpace(pass) || pass.Length < 8)
                throw new InvalidOperationException("Chưa cấu hình Admin:Password (tối thiểu 8 ký tự). Đặt qua biến môi trường Admin__Password.");
            db.AdminUsers.Add(new AdminUser { Username = user, PasswordHash = PasswordHasher.Hash(pass) });
        }

        foreach (var kv in DefaultSettings)
            if (!db.Settings.Any(s => s.Key == kv.Key))
                db.Settings.Add(new SiteSetting { Key = kv.Key, Value = kv.Value });

        if (!db.Categories.Any())
        {
            var cats = new (string Slug, string Tag, string Name, int Hue)[]
            {
                ("cpu", "CPU", "Bộ vi xử lý", 255), ("gpu", "GPU", "Card đồ họa", 150), ("mainboard", "Mainboard", "Bo mạch chủ", 200),
                ("ram", "RAM", "Bộ nhớ RAM", 320), ("ssd", "SSD", "Ổ cứng SSD", 25), ("psu", "PSU", "Nguồn máy tính", 50),
                ("tan-nhiet", "Tản nhiệt", "Tản nhiệt", 180), ("vo-case", "Vỏ case", "Vỏ case", 280), ("man-hinh", "Màn hình", "Màn hình", 220),
                ("gaming-gear", "Gaming Gear", "Gaming Gear và phụ kiện", 350)
            };
            var i = 0;
            foreach (var (slug, tag, name, hue) in cats)
                db.Categories.Add(new Category { Name = name, Tag = tag, Hue = hue, Slug = slug, SortOrder = i++ });
            db.SaveChanges();
        }

        if (!db.Products.Any())
        {
            var c = db.Categories.ToDictionary(x => x.Slug, x => x.Id);
            Product P(string cat, string name, string brand, string model, long price, long? old, string? badge,
                string[] specs, string desc, string? img = null, string? src = null) => new()
            {
                CategoryId = c[cat], Name = name, Slug = TextUtil.Slug(name), Brand = brand, Model = model,
                Price = price, OldPrice = old, Badge = badge, SpecsText = string.Join("\n", specs),
                Description = desc, ImageUrl = img, SourceUrl = src,
                SearchText = TextUtil.Fold($"{name} {brand} {model}")
            };
            var list = new List<Product>
            {
                P("cpu", "AMD Ryzen 7 7800X3D", "AMD", "Ryzen 7 7800X3D", 10490000, 11990000, "Bán chạy",
                    new[] { "8 nhân 16 luồng", "Xung nhịp tối đa 5,0 GHz", "Socket AM5, TDP 120W" },
                    "Vi xử lý gaming với bộ nhớ đệm 3D V-Cache, cho khung hình ổn định ở các tựa game nặng về CPU.",
                    "https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2505503-ryzen-7-7800x3d-front.jpg",
                    "https://www.amd.com/en/products/processors/desktops/ryzen/7000-series/amd-ryzen-7-7800x3d.html"),
                P("gpu", "ASUS Dual GeForce RTX 4070 SUPER 12GB", "ASUS", "DUAL-RTX4070S-12G", 16990000, 17990000, "Bán chạy",
                    new[] { "12GB GDDR6X, bus 192-bit", "7168 nhân CUDA", "Hỗ trợ DLSS 3" },
                    "Card đồ họa phù hợp chơi game 1440p với thiết lập cao, kèm khả năng dựng hình và xử lý AI cơ bản.",
                    "https://dlcdnwebimgs.asus.com/gain/e76a9831-faa5-4709-94b4-3498f4e78014/w800",
                    "https://www.asus.com/bg/motherboards-components/graphics-cards/dual/dual-rtx4070s-12g/"),
                P("mainboard", "ASUS ROG STRIX B650-A GAMING WIFI", "ASUS", "ROG STRIX B650-A GAMING WIFI", 6390000, null, "Mới",
                    new[] { "Socket AM5, chuẩn ATX", "RAM DDR5", "Wi-Fi 6E tích hợp" },
                    "Mainboard AM5 đủ cổng kết nối, phù hợp ghép cùng các dòng Ryzen 7000 cho bộ máy gaming."),
                P("ram", "Corsair Vengeance DDR5 32GB (2x16GB) 6000MHz CL30", "Corsair", "Vengeance DDR5 32GB 6000MHz CL30", 3290000, 3690000, null,
                    new[] { "Kit 2x16GB DDR5", "Bus 6000 MHz, CL30", "Hỗ trợ AMD EXPO" },
                    "Bộ nhớ DDR5 dung lượng 32GB cho chơi game, làm đồ họa và đa nhiệm nặng."),
                P("ssd", "Samsung 990 PRO 1TB NVMe PCIe 4.0", "Samsung", "990 PRO 1TB MZ-V9P1T0BW", 3190000, null, "Bán chạy",
                    new[] { "Dung lượng 1TB, M.2 2280", "Đọc tới 7.450 MB/s", "Chuẩn PCIe 4.0 x4" },
                    "SSD tốc độ cao cho ổ hệ điều hành và thư viện game, rút ngắn đáng kể thời gian tải."),
                P("psu", "Corsair RM850e 850W 80 Plus Gold", "Corsair", "RM850e 850W", 3490000, null, null,
                    new[] { "Công suất 850W", "Chuẩn 80 Plus Gold", "ATX 3.0, đầu cấp PCIe 5.0" },
                    "Nguồn full modular, đủ công suất cho cấu hình có card đồ họa tầm cao và dễ đi dây gọn gàng."),
                P("tan-nhiet", "Noctua NH-D15", "Noctua", "NH-D15", 2990000, 3290000, null,
                    new[] { "Tản khí hai tháp", "Hai quạt 140mm", "Hỗ trợ Intel LGA1700, AMD AM4/AM5" },
                    "Tản nhiệt khí hiệu năng cao, vận hành êm, phù hợp các CPU nhiều nhân cần nhiệt độ thấp."),
                P("vo-case", "NZXT H5 Flow", "NZXT", "H5 Flow", 2190000, null, "Mới",
                    new[] { "Mid Tower, hỗ trợ ATX", "Mặt trước dạng lưới", "Kèm 2 quạt 120mm" },
                    "Vỏ case thoáng khí, thiết kế gọn, dễ lắp ráp và đi dây cho bộ máy tầm trung."),
                P("man-hinh", "LG UltraGear 27GP850-B 27 inch", "LG", "27GP850-B", 7490000, 8290000, null,
                    new[] { "27 inch QHD 2560x1440", "Tấm nền Nano IPS", "Tần số quét 165Hz" },
                    "Màn hình gaming QHD màu sắc tốt, tần số quét cao cho game bắn súng và đua xe."),
                P("gaming-gear", "Logitech G PRO X SUPERLIGHT 2", "Logitech", "G PRO X SUPERLIGHT 2", 3590000, null, "Mới",
                    new[] { "Chuột không dây LIGHTSPEED", "Trọng lượng khoảng 60g", "Cảm biến tối đa 32.000 DPI" },
                    "Chuột gaming siêu nhẹ dành cho người chơi esports, kết nối không dây độ trễ thấp.")
            };
            var order = 0;
            foreach (var p in list) { p.SortOrder = order++; db.Products.Add(p); }
        }

        if (!db.Banners.Any())
        {
            db.Banners.Add(new Banner { Title = "Nâng cấp bộ máy, giá mềm hơn", Subtitle = "Một số CPU, card đồ họa và SSD đang có giá ưu đãi. Xem ngay danh sách sản phẩm giảm giá.", LinkUrl = "/san-pham?khuyen-mai=1", LinkText = "Xem sản phẩm giảm giá", SortOrder = 0 });
        }

        if (!db.Pages.Any())
        {
            db.Pages.AddRange(
                new ContentPage { Slug = "gioi-thieu", Title = "Giới thiệu", ShowInFooter = true, SortOrder = 0,
                    Body = "Aura Tech là cửa hàng linh kiện máy tính theo hướng chọn lọc: đủ các nhóm chính, thông số rõ ràng, dễ so sánh.\n\nChúng tôi tư vấn ghép cấu hình tương thích giữa CPU, mainboard, RAM, nguồn và card đồ họa để khách hàng không phải tự mò mẫm.\n\nĐây là nội dung mẫu, hãy chỉnh sửa trong trang quản trị." },
                new ContentPage { Slug = "huong-dan-mua-hang", Title = "Hướng dẫn mua hàng", ShowInFooter = true, SortOrder = 1,
                    Body = "Bước 1: Chọn sản phẩm và thêm vào giỏ hàng.\nBước 2: Mở giỏ hàng, nhập họ tên và số điện thoại rồi gửi yêu cầu đặt hàng.\nBước 3: Nhân viên liên hệ xác nhận đơn, địa chỉ giao hàng và hình thức thanh toán.\n\nĐây là nội dung mẫu, hãy chỉnh sửa trong trang quản trị." },
                new ContentPage { Slug = "chinh-sach-bao-hanh", Title = "Chính sách bảo hành", ShowInFooter = true, SortOrder = 2,
                    Body = "Sản phẩm được bảo hành theo chính sách của nhà sản xuất hoặc nhà phân phối chính hãng.\n\nThời hạn và điều kiện bảo hành cụ thể được ghi trên phiếu bảo hành hoặc thông tin sản phẩm.\n\nĐây là nội dung mẫu, hãy thay bằng chính sách thực tế của cửa hàng." },
                new ContentPage { Slug = "chinh-sach-van-chuyen", Title = "Chính sách vận chuyển", ShowInFooter = true, SortOrder = 3,
                    Body = "Aura Tech giao hàng toàn quốc qua đơn vị vận chuyển đối tác.\n\nLinh kiện dễ vỡ như card đồ họa và màn hình được đóng gói chống sốc.\n\nPhí và thời gian giao hàng sẽ được nhân viên thông báo khi xác nhận đơn.\n\nĐây là nội dung mẫu, hãy thay bằng chính sách thực tế của cửa hàng." },
                new ContentPage { Slug = "chinh-sach-doi-tra", Title = "Chính sách đổi trả", ShowInFooter = true, SortOrder = 4,
                    Body = "Điều kiện đổi trả phụ thuộc vào tình trạng sản phẩm, phụ kiện đi kèm và lý do đổi trả.\n\nVui lòng liên hệ hotline hoặc email để được hướng dẫn.\n\nĐây là nội dung mẫu, hãy thay bằng chính sách thực tế của cửa hàng." },
                new ContentPage { Slug = "chinh-sach-bao-mat", Title = "Chính sách bảo mật", ShowInFooter = true, SortOrder = 5,
                    Body = "Thông tin bạn gửi qua biểu mẫu liên hệ và yêu cầu đặt hàng (họ tên, số điện thoại, email, nội dung) chỉ dùng để tư vấn và xử lý đơn hàng.\n\nChúng tôi không bán hoặc chia sẻ thông tin này cho bên thứ ba vì mục đích quảng cáo.\n\nĐây là nội dung mẫu, hãy rà soát lại theo quy định pháp luật hiện hành trước khi vận hành thật." });
        }

        db.SaveChanges();
    }
}
