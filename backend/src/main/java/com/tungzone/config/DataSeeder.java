package com.tungzone.config;

import com.tungzone.entity.Order;
import com.tungzone.entity.OrderItem;
import com.tungzone.entity.OrderStatus;
import com.tungzone.entity.Product;
import com.tungzone.entity.Role;
import com.tungzone.entity.User;
import com.tungzone.repository.OrderRepository;
import com.tungzone.repository.ProductRepository;
import com.tungzone.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        User admin = userRepository.findByEmail("admin@tungzone.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .fullName("System Admin")
                        .email("admin@tungzone.com")
                        .password(passwordEncoder.encode("admin123"))
                        .role(Role.ADMIN)
                        .build())
        );

        User user = userRepository.findByEmail("user@tungzone.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .fullName("Demo User")
                        .email("user@tungzone.com")
                        .password(passwordEncoder.encode("user123"))
                        .role(Role.USER)
                        .build())
        );

        String imageBaseUrl = "http://localhost:8080/images/";
        String assetBaseUrl = "http://localhost:8080/images/hinhanh/";

        List<ProductSeed> seeds = List.of(
                new ProductSeed(
                        "iPhone 16 Pro Max Titan Sa Mạc 256GB",
                        "Apple",
                        33990000.0,
                        36990000.0,
                        18,
                        imageBaseUrl + "iphone-16-pro-max-titan-sa-mac-thumbnew-650x650.png",
                        "Khung titan, camera Pro 48MP, màn hình ProMotion 120Hz.",
                        "iPhone",
                        true
                ),
                new ProductSeed(
                        "iPhone 16 Pro Đen 256GB",
                        "Apple",
                        29990000.0,
                        32990000.0,
                        22,
                        imageBaseUrl + "iphone-16-pro-den-650x650.png",
                        "Hiệu năng mạnh mẽ, chụp ảnh thiếu sáng ấn tượng.",
                        "iPhone",
                        true
                ),
                new ProductSeed(
                        "iPhone 16 Plus Trắng 256GB",
                        "Apple",
                        26990000.0,
                        28990000.0,
                        25,
                        imageBaseUrl + "iphone-16-plus-trang-thumb-650x650.png",
                        "Màn hình lớn, pin bền bỉ, camera sắc nét.",
                        "iPhone",
                        true
                ),
                new ProductSeed(
                        "iPhone 16e Black 128GB",
                        "Apple",
                        21990000.0,
                        23990000.0,
                        30,
                        imageBaseUrl + "iphone-16e-black-thumbtz-650x650.png",
                        "Thiết kế gọn nhẹ, hiệu năng cân bằng, phù hợp mọi nhu cầu.",
                        "iPhone",
                        true
                ),
                new ProductSeed(
                        "iPhone 15 Plus Black 128GB",
                        "Apple",
                        18990000.0,
                        21990000.0,
                        24,
                        imageBaseUrl + "iphone-15-plus-black-1-2-650x650.png",
                        "Camera 48MP, Dynamic Island, pin trâu cả ngày.",
                        "iPhone",
                        true
                ),
                new ProductSeed(
                        "iPhone 15 Green 256GB",
                        "Apple",
                        20990000.0,
                        23990000.0,
                        20,
                        imageBaseUrl + "iphone-15-green-1-2-650x650.png",
                        "Màu xanh thời thượng, sạc USB-C, ảnh chân dung sắc nét.",
                        "iPhone",
                        true
                ),
                new ProductSeed(
                        "iPhone 14 Blue 128GB",
                        "Apple",
                        13990000.0,
                        16990000.0,
                        28,
                        imageBaseUrl + "iphone-14-blue-1-2-650x650.png",
                        "Chip A15 Bionic, camera kép ổn định, phù hợp học tập.",
                        "iPhone",
                        true
                ),
                new ProductSeed(
                        "iPhone 13 Black 128GB",
                        "Apple",
                        11990000.0,
                        14990000.0,
                        35,
                        imageBaseUrl + "iphone-13-black-1-2-3-650x650.png",
                        "Hiệu năng ổn định, thiết kế bền bỉ, giá dễ tiếp cận.",
                        "iPhone",
                        true
                ),
                new ProductSeed(
                        "iPhone 17 Pro Max Silver 512GB",
                        "Apple",
                        42990000.0,
                        45990000.0,
                        8,
                        imageBaseUrl + "iphone-17-pro-max-sliver-thumb-650x650.png",
                        "Dung lượng lớn, camera chuyên nghiệp, hiệu năng flagship.",
                        "iPhone",
                        true
                ),
                new ProductSeed(
                        "iPhone 17 Pro Cam 256GB",
                        "Apple",
                        37990000.0,
                        40990000.0,
                        10,
                        imageBaseUrl + "iphone-17-pro-cam-thumb-650x650.png",
                        "Phiên bản màu cam nổi bật, màn hình 120Hz, chip A19 Pro.",
                        "iPhone",
                        true
                ),
                new ProductSeed(
                        "iPhone 17 Blue 256GB",
                        "Apple",
                        33990000.0,
                        36990000.0,
                        12,
                        imageBaseUrl + "iphone-17-blue-thumb-650x650.png",
                        "Thiết kế cao cấp, pin tốt hơn, hỗ trợ AI thông minh.",
                        "iPhone",
                        true
                ),
                new ProductSeed(
                        "iPhone 17e 256GB Hồng",
                        "Apple",
                        25990000.0,
                        28990000.0,
                        16,
                        imageBaseUrl + "iphone-17e-256gb-hong-thumb-650x650.png",
                        "Màu hồng nhẹ nhàng, camera kép, sạc nhanh 30W.",
                        "iPhone",
                        true
                ),
                new ProductSeed(
                        "iPhone Air Vàng 256GB",
                        "Apple",
                        27990000.0,
                        30990000.0,
                        14,
                        imageBaseUrl + "iphone-air-vang-thumb_0-650x650.png",
                        "Siêu mỏng nhẹ, màn hình sáng, tối ưu cho công việc.",
                        "iPhone",
                        true
                ),
                new ProductSeed(
                        "iPhone 16 128GB",
                        "Apple",
                        23990000.0,
                        25990000.0,
                        26,
                        imageBaseUrl + "ip16-thumb-1-650x650.png",
                        "Phiên bản tiêu chuẩn, hiệu năng ổn định, camera nâng cấp.",
                        "iPhone",
                        true
                ),
                new ProductSeed(
                        "iPad 11 5G Silver 128GB",
                        "Apple",
                        16990000.0,
                        18990000.0,
                        20,
                        assetBaseUrl + "ipad-11-5g-sliver-thumb-650x650.png",
                        "Man hinh Liquid Retina, ho tro Apple Pencil, pin tot ca ngay.",
                        "iPad",
                        true
                ),
                new ProductSeed(
                        "iPad 11 WiFi Yellow 128GB",
                        "Apple",
                        13990000.0,
                        15990000.0,
                        25,
                        assetBaseUrl + "ipad-11-wifi-yellow-thumb-650x650.png",
                        "May nhe, dung luong pin ben bi, phu hop hoc tap.",
                        "iPad",
                        true
                ),
                new ProductSeed(
                        "iPad Air M3 11 inch WiFi Gray 256GB",
                        "Apple",
                        18990000.0,
                        20990000.0,
                        18,
                        assetBaseUrl + "ipad-air-m3-11-inch-wifi-gray-thumb-650x650.png",
                        "Chip M3 manh me, man hinh rong, phu hop cong viec sang tao.",
                        "iPad",
                        true
                ),
                new ProductSeed(
                        "iPad Air M3 13 inch WiFi Purple 256GB",
                        "Apple",
                        21990000.0,
                        23990000.0,
                        14,
                        assetBaseUrl + "ipad-air-m3-13-inch-wifi-purple-thumb-650x650.png",
                        "Man hinh 13 inch, am thanh song dong, pin su dung ca ngay.",
                        "iPad",
                        true
                ),
                new ProductSeed(
                        "iPad mini 7 WiFi Purple 128GB",
                        "Apple",
                        12990000.0,
                        14990000.0,
                        22,
                        assetBaseUrl + "ipad-mini-7-wifi-purple-thumbtz-650x650.png",
                        "Nho gon de mang, man hinh sac net, ho tro Apple Pencil.",
                        "iPad",
                        true
                ),
                new ProductSeed(
                        "iPad Pro 11 inch WiFi Silver 256GB",
                        "Apple",
                        24990000.0,
                        27990000.0,
                        12,
                        assetBaseUrl + "ipad-pro-11-inch-wifi-silver-thumb-650x650.png",
                        "Man hinh ProMotion 120Hz, chip manh, ho tro cong viec nang.",
                        "iPad",
                        true
                ),
                new ProductSeed(
                        "iPad Pro 13 inch WiFi Nano Silver 512GB",
                        "Apple",
                        34990000.0,
                        37990000.0,
                        10,
                        assetBaseUrl + "ipad-pro-13-inch-wifi-nano-silver-650x650.png",
                        "Man hinh rong 13 inch, am thanh hay, phu hop thiet ke.",
                        "iPad",
                        true
                ),
                new ProductSeed(
                        "iPad Pro M5 13 inch WiFi Black 512GB",
                        "Apple",
                        39990000.0,
                        42990000.0,
                        8,
                        assetBaseUrl + "ipad-pro-m5-wifi-13-inch-black-thumbtz-650x650.png",
                        "Chip M5 hieu nang cao, tuong thich Magic Keyboard.",
                        "iPad",
                        true
                ),
                new ProductSeed(
                        "iPad Pro M5 11 inch WiFi Black 256GB",
                        "Apple",
                        32990000.0,
                        35990000.0,
                        10,
                        assetBaseUrl + "ipad-pro-m5-wifi-11-inch-black-thumbtz-650x650.png",
                        "Man hinh 11 inch, chip M5, phu hop cong viec linh hoat.",
                        "iPad",
                        true
                ),
                new ProductSeed(
                        "MacBook Air M2 13 inch Midnight 256GB",
                        "Apple",
                        18990000.0,
                        21990000.0,
                        18,
                        assetBaseUrl + "mac-air-m2-13-xanh-new-1-650x650.png",
                        "Thiet ke mong nhe, pin ben, phu hop hoc tap va van phong.",
                        "Mac",
                        true
                ),
                new ProductSeed(
                        "MacBook Air M4 13 inch Midnight 256GB",
                        "Apple",
                        24990000.0,
                        27990000.0,
                        16,
                        assetBaseUrl + "macbook-air-13-inch-m4-thumb-xanh-den-650x650.png",
                        "Chip M4, man hinh sac net, sac nhanh USB-C.",
                        "Mac",
                        true
                ),
                new ProductSeed(
                        "MacBook Air M4 15 inch Sky Blue 256GB",
                        "Apple",
                        28990000.0,
                        31990000.0,
                        12,
                        assetBaseUrl + "macbook-air-15-inch-m4-thumb-xanh-da-troi-650x650.png",
                        "Man hinh 15 inch rong rai, am thanh lon, pin tot.",
                        "Mac",
                        true
                ),
                new ProductSeed(
                        "MacBook Air M5 13 inch 16GB 512GB Silver",
                        "Apple",
                        31990000.0,
                        34990000.0,
                        10,
                        assetBaseUrl + "macbook-air-13-inch-m5-16gb-512gb-bac-thumb-639082164936546333-650x650.png",
                        "Cau hinh 16GB/512GB, phu hop do hoa va cong viec nang.",
                        "Mac",
                        true
                ),
                new ProductSeed(
                        "MacBook Air M5 15 inch 16GB 512GB Silver",
                        "Apple",
                        35990000.0,
                        38990000.0,
                        8,
                        assetBaseUrl + "macbook-air-15-inch-m5-16gb-512gb-thumb-639081774113369129-650x650.png",
                        "Man hinh lon, chip M5 manh, lam viec da nhiem tot.",
                        "Mac",
                        true
                ),
                new ProductSeed(
                        "MacBook Pro M5 14 inch 16GB 512GB Space Black",
                        "Apple",
                        42990000.0,
                        45990000.0,
                        8,
                        assetBaseUrl + "macbook-pro-14-inch-m5-16gb-512gb-den-650x650.png",
                        "Man hinh ProMotion, hieu nang cao, phu hop pro user.",
                        "Mac",
                        true
                ),
                new ProductSeed(
                        "MacBook Pro M5 Pro 16 inch 24GB 1TB Silver",
                        "Apple",
                        65990000.0,
                        69990000.0,
                        5,
                        assetBaseUrl + "macbook-pro-16-inch-m5-pro-24gb-1tb-bac-thumb-1-2-650x650.png",
                        "Cau hinh manh cho do hoa, render va lap trinh.",
                        "Mac",
                        true
                ),
                new ProductSeed(
                        "MacBook Neo 13 inch A18 Pro 8GB 256GB Pink",
                        "Apple",
                        17990000.0,
                        19990000.0,
                        12,
                        assetBaseUrl + "macbook-neo-13-inch-a18-pro-8gb-256gb-hong-thumb-650x650.png",
                        "Gia tot, gon nhe, thich hop hoc tap va van phong.",
                        "Mac",
                        true
                ),
                new ProductSeed(
                        "Apple Watch SE 3 GPS 40mm Starlight",
                        "Apple",
                        6990000.0,
                        7990000.0,
                        18,
                        assetBaseUrl + "apple-watch-se-3-40mm-vien-nhom-day-the-thao-starlight-thumb-650x650.png",
                        "Theo doi suc khoe co ban, thoi luong pin tot.",
                        "Watch",
                        true
                ),
                new ProductSeed(
                        "Apple Watch SE 3 GPS + Cellular 40mm Starlight",
                        "Apple",
                        8990000.0,
                        9990000.0,
                        12,
                        assetBaseUrl + "apple-watch-se-3-gps-cellular-40mm-vien-nhom-day-the-thao-starlight-thumb-650x650.png",
                        "Ho tro eSIM, nghe goi doc lap, theo doi van dong.",
                        "Watch",
                        true
                ),
                new ProductSeed(
                        "Apple Watch Series 10 LTE 42mm Black",
                        "Apple",
                        11990000.0,
                        12990000.0,
                        10,
                        assetBaseUrl + "apple-watch-series-10-lte-42mm-day-vai-den-tb-650x650.png",
                        "Man hinh sang, do Suc khoe nang cao, ho tro LTE.",
                        "Watch",
                        true
                ),
                new ProductSeed(
                        "Apple Watch Series 11 42mm Rose Gold",
                        "Apple",
                        13990000.0,
                        14990000.0,
                        10,
                        assetBaseUrl + "apple-watch-series-11-42mm-vien-nhom-day-the-thao-vang-hong-thumb-650x650.png",
                        "Thiet ke moi, do nhip tim, theo doi the luc.",
                        "Watch",
                        true
                ),
                new ProductSeed(
                        "Apple Watch Series 11 Titanium Milan",
                        "Apple",
                        21990000.0,
                        23990000.0,
                        6,
                        assetBaseUrl + "apple-watch-series-11-gps-cellular-vien-titanium-day-milan-titan-thumb-650x650.png",
                        "Khung titanium, day Milan sang, ho tro eSIM.",
                        "Watch",
                        true
                ),
                new ProductSeed(
                        "Apple Watch Series 11 Titanium Gold",
                        "Apple",
                        20990000.0,
                        22990000.0,
                        6,
                        assetBaseUrl + "apple-watch-series-11-gps-cellular-vien-titanium-day-the-thao-vamg-thumb-650x650.png",
                        "Khung titanium, day the thao ben, theo doi suc khoe.",
                        "Watch",
                        true
                ),
                new ProductSeed(
                        "Apple Watch Ultra 3 49mm Alpine Black",
                        "Apple",
                        23990000.0,
                        25990000.0,
                        6,
                        assetBaseUrl + "apple-watch-ultra-3-gps-cellular-49mm-vien-titanium-day-alpine-den-thumb-650x650.png",
                        "Chiu luc tot, pin ben, ho tro the thao ngoai troi.",
                        "Watch",
                        true
                ),
                new ProductSeed(
                        "Apple Watch Ultra 3 49mm Ocean Titanium",
                        "Apple",
                        23990000.0,
                        25990000.0,
                        6,
                        assetBaseUrl + "apple-watch-ultra-3-gps-cellular-49mm-vien-titanium-day-ocean-titan-thumb-650x650.png",
                        "Khang nuoc tot, ho tro GPS chinh xac, man hinh sang.",
                        "Watch",
                        true
                ),
                new ProductSeed(
                        "Apple Watch Ultra 3 49mm Trail Black",
                        "Apple",
                        23990000.0,
                        25990000.0,
                        6,
                        assetBaseUrl + "apple-watch-ultra-3-gps-cellular-49mm-vien-titanium-day-trail-den-thumb-650x650.png",
                        "Thiet ke ben, phu hop chay bo, leo nui, trekking.",
                        "Watch",
                        true
                ),
                new ProductSeed(
                        "AirPods 4",
                        "Apple",
                        3990000.0,
                        4490000.0,
                        25,
                        assetBaseUrl + "airpods-4-thumb-1-650x650.png",
                        "Am thanh can bang, ket noi nhanh, pin ben.",
                        "Tai nghe",
                        true
                ),
                new ProductSeed(
                        "AirPods 4 USB-C",
                        "Apple",
                        4190000.0,
                        4690000.0,
                        20,
                        assetBaseUrl + "airpods-4-thumb-650x650.png",
                        "Sac USB-C, chong on, am thanh trong treo.",
                        "Tai nghe",
                        true
                ),
                new ProductSeed(
                        "AirPods Pro 2 USB-C",
                        "Apple",
                        5490000.0,
                        5990000.0,
                        18,
                        assetBaseUrl + "tai-nghe-bluetooth-airpods-pro-2nd-gen-usb-c-charge-apple-thumb-12-1-650x650.png",
                        "Chong on chu dong, che do xuyen am, hop tai thoai.",
                        "Tai nghe",
                        true
                ),
                new ProductSeed(
                        "AirPods Pro 3",
                        "Apple",
                        6490000.0,
                        6990000.0,
                        14,
                        assetBaseUrl + "airpods-pro-3-100925-025234-544-650x650.png",
                        "Am thanh cao cap, chong on manh, ket noi on dinh.",
                        "Tai nghe",
                        true
                ),
                new ProductSeed(
                        "Apple EarPods USB-C",
                        "Apple",
                        590000.0,
                        790000.0,
                        60,
                        assetBaseUrl + "tai-nghe-co-day-apple-mtjy3-thumb-650x650.png",
                        "Tai nghe co day, mic ro, am thanh on dinh.",
                        "Tai nghe",
                        true
                ),
                new ProductSeed(
                        "Loa Bluetooth JBL Clip 5",
                        "JBL",
                        1990000.0,
                        2490000.0,
                        22,
                        assetBaseUrl + "loa-bluetooth-jbl-clip-5-thumb-650x650.png",
                        "Nho gon, de treo, am thanh manh, chong nuoc.",
                        "Tai nghe",
                        true
                ),
                new ProductSeed(
                        "Loa Bluetooth JBL Charge 5",
                        "JBL",
                        2990000.0,
                        3490000.0,
                        20,
                        assetBaseUrl + "bluetooth-jbl-charge-5-xanh-la-thumb-1-2-650x650.png",
                        "Cong suat lon, pin ben, ho tro sac nguoc.",
                        "Tai nghe",
                        true
                ),
                new ProductSeed(
                        "Loa Bluetooth Marshall Acton III",
                        "Marshall",
                        7990000.0,
                        8990000.0,
                        10,
                        assetBaseUrl + "loa-bluetooth-marshall-acton-iii-kem-650x650.png",
                        "Thiet ke co dien, am thanh day, nghe nhac hay.",
                        "Tai nghe",
                        true
                ),
                new ProductSeed(
                        "Loa Bluetooth Marshall Emberton III",
                        "Marshall",
                        4990000.0,
                        5490000.0,
                        12,
                        assetBaseUrl + "loa-bluetooth-marshall-emberton-iii-650x650.png",
                        "Nho gon, am thanh can bang, pin ben.",
                        "Tai nghe",
                        true
                ),
                new ProductSeed(
                        "Loa Bluetooth Sony SRS-ULT10",
                        "Sony",
                        2790000.0,
                        3290000.0,
                        12,
                        assetBaseUrl + "loa-bluetooth-sony-srs-ult10-230724-112025-650x650.png",
                        "Bass manh, chong nuoc, ket noi on dinh.",
                        "Tai nghe",
                        true
                ),
                new ProductSeed(
                        "Adapter sac Apple USB-C 20W",
                        "Apple",
                        490000.0,
                        590000.0,
                        80,
                        assetBaseUrl + "adapter-sac-type-c-20w-cho-iphone-ipad-apple-mhje3-101021-023343-650x650.png",
                        "Sac nhanh 20W, tuong thich iPhone va iPad.",
                        "Phu kien",
                        true
                ),
                new ProductSeed(
                        "Cap Apple USB-C to USB-C 1m",
                        "Apple",
                        590000.0,
                        690000.0,
                        70,
                        assetBaseUrl + "cap-type-c-type-c-1m-apple-mqkj3-thumb-5-650x650.png",
                        "Cap sac va truyen du lieu, ben va on dinh.",
                        "Phu kien",
                        true
                ),
                new ProductSeed(
                        "Apple Pencil Pro",
                        "Apple",
                        3290000.0,
                        3490000.0,
                        20,
                        assetBaseUrl + "apple-pencil-pro-650x650.png",
                        "Ve va ghi chu muot, do chinh xac cao.",
                        "Phu kien",
                        true
                ),
                new ProductSeed(
                        "Bao da Smart Folio iPad Pro M4 11 inch",
                        "Apple",
                        2490000.0,
                        2790000.0,
                        25,
                        assetBaseUrl + "bao-da-smart-folio-cho-ipad-pro-m4-11-inch-thumb-650x650.png",
                        "Bao ve man hinh, gap dung nhieu goc, nhe.",
                        "Phu kien",
                        true
                ),
                new ProductSeed(
                        "Day deo cheo Apple Neon",
                        "Apple",
                        790000.0,
                        990000.0,
                        30,
                        assetBaseUrl + "day-deo-cheo-apple-vang-neon-mgge4-thumb-638942391913305355-650x650.png",
                        "Day deo thoi trang, de dang phoi do.",
                        "Phu kien",
                        true
                ),
                new ProductSeed(
                        "Op lung MagSafe iPhone 17 Pro Max Techwoven",
                        "Apple",
                        1590000.0,
                        1890000.0,
                        28,
                        assetBaseUrl + "op-lung-magsafe-iphone-17-pro-max-techwoven-apple-thumb-650x650.png",
                        "Ho tro MagSafe, chat lieu ben dep, chong tray.",
                        "Phu kien",
                        true
                ),
                new ProductSeed(
                        "Op lung Titanium tu nhien",
                        "TopZone",
                        1190000.0,
                        1390000.0,
                        20,
                        assetBaseUrl + "titan-tu-nhien-topzone-1-2-650x650.png",
                        "Thiet ke sang, bao ve camera va mat lung.",
                        "Phu kien",
                        true
                ),
                new ProductSeed(
                        "Loa Bluetooth JBL PartyBox 320",
                        "JBL",
                        8990000.0,
                        10990000.0,
                        12,
                        imageBaseUrl + "loa-bluetooth-jbl-partybox-320-pbstage320as-thumb-650x650.png",
                        "Âm trầm mạnh, pin lâu, phù hợp tiệc ngoài trời.",
                        "Âm thanh",
                        true
                ),
                new ProductSeed(
                        "Loa Bluetooth Marshall Kilburn II",
                        "Marshall",
                        6990000.0,
                        7990000.0,
                        10,
                        imageBaseUrl + "loa-bluetooth-marshall-kilburn-ii-650x650.png",
                        "Thiết kế cổ điển, âm thanh cân bằng, pin 20 giờ.",
                        "Âm thanh",
                        true
                ),
                new ProductSeed(
                        "Miếng dán kính cường lực iPhone 16 Pro Max Jincase",
                        "Jincase",
                        290000.0,
                        390000.0,
                        80,
                        imageBaseUrl + "mieng-dan-kinh-cuong-luc-iphone-16-pro-max-premium-jincase-thumb-650x650.png",
                        "Chống trầy, chống vân tay, độ trong suốt cao.",
                        "Phụ kiện",
                        true
                ),
                new ProductSeed(
                        "Ốp lưng iPhone 15 MagSafe JC-JCS003",
                        "Jincase",
                        390000.0,
                        490000.0,
                        60,
                        imageBaseUrl + "op-lung-iphone-15-magsafe-pc-tpu-jc-jcs003-ava-plus-thumb-638878306858413205-650x650.png",
                        "Kháng va đập, tương thích MagSafe, siêu mỏng nhẹ.",
                        "Phụ kiện",
                        true
                ),
                new ProductSeed(
                        "Pin sạc dự phòng Anker MagGo 10000mAh",
                        "Anker",
                        1490000.0,
                        1790000.0,
                        45,
                        imageBaseUrl + "pin-sac-du-phong-10000mah-khong-day-magnetic-qi2-type-c-pd-27w-anker-maggo-a1654-trang-thumb-650x650.png",
                        "Sạc không dây chuẩn Qi2, hỗ trợ PD 27W.",
                        "Phụ kiện",
                        true
                ),
                new ProductSeed(
                        "Túi chống sốc 13.3\" Targus CityGear",
                        "Targus",
                        690000.0,
                        890000.0,
                        25,
                        imageBaseUrl + "tui-chong-soc-133-targus-citygear-tss930gl-80-080822-044639-650x650.png",
                        "Bảo vệ laptop, chống nước nhẹ, nhiều ngăn tiện dụng.",
                        "Phụ kiện",
                        true
                ),
                new ProductSeed(
                        "Banner iPhone 15 Plus",
                        "Apple",
                        18990000.0,
                        null,
                        0,
                        imageBaseUrl + "0563809d876094fa2bb7606be2055307.png",
                        "Banner ưu đãi iPhone 15 Plus.",
                        "Banner",
                        true
                ),
                new ProductSeed(
                        "Banner iPhone 14",
                        "Apple",
                        13990000.0,
                        null,
                        0,
                        imageBaseUrl + "38356f3a92241b0370c46bd784756025.png",
                        "Banner ưu đãi iPhone 14.",
                        "Banner",
                        true
                ),
                new ProductSeed(
                        "Banner iPad Air M4",
                        "Apple",
                        16690000.0,
                        null,
                        0,
                        imageBaseUrl + "9a9b662b46b6c9bc3c4db6d4ebc6c2b8.jpg",
                        "Banner iPad Air M4 mới ra mắt.",
                        "Banner",
                        true
                ),
                new ProductSeed(
                        "Banner MacBook Neo",
                        "Apple",
                        18990000.0,
                        null,
                        0,
                        imageBaseUrl + "d0b16b549d82743e1793bef778366361.png",
                        "Banner MacBook Neo giá tốt.",
                        "Banner",
                        true
                ),
                new ProductSeed(
                        "Banner Apple Watch Series 11",
                        "Apple",
                        11190000.0,
                        null,
                        0,
                        imageBaseUrl + "ee47b489951f3039bfad24e9840c66a8.png",
                        "Banner Apple Watch Series 11.",
                        "Banner",
                        true
                ),
                new ProductSeed(
                        "Banner iPhone 17e",
                        "Apple",
                        25990000.0,
                        null,
                        0,
                        imageBaseUrl + "fafecfcac0d54395454c28fd5a6bcc84.jpg",
                        "Banner iPhone 17e giá trị tối ưu.",
                        "Banner",
                        true
                )
        );

        List<Product> seededProducts = new ArrayList<>();
        for (ProductSeed seed : seeds) {
            seededProducts.add(upsertProduct(seed));
        }

        if (orderRepository.count() == 0) {
            List<Product> orderCandidates = seededProducts.stream()
                    .filter(product -> !"Banner".equalsIgnoreCase(product.getCategory()))
                    .toList();

            if (orderCandidates.size() >= 2) {
                Product first = orderCandidates.get(0);
                Product second = orderCandidates.get(1);

                Order order = Order.builder()
                        .user(user)
                        .totalAmount(first.getPrice() + second.getPrice())
                        .status(OrderStatus.PENDING)
                        .build();

                OrderItem item1 = OrderItem.builder()
                        .order(order)
                        .product(first)
                        .quantity(1)
                        .price(first.getPrice())
                        .build();

                OrderItem item2 = OrderItem.builder()
                        .order(order)
                        .product(second)
                        .quantity(1)
                        .price(second.getPrice())
                        .build();

                order.setItems(List.of(item1, item2));
                orderRepository.save(order);
            }
        }
    }

    private Product upsertProduct(ProductSeed seed) {
        return productRepository.findByName(seed.name()).map(existing -> {
            boolean dirty = false;

            if (isBlank(existing.getBrand()) && !isBlank(seed.brand())) {
                existing.setBrand(seed.brand());
                dirty = true;
            }
            if (existing.getPrice() == null && seed.price() != null) {
                existing.setPrice(seed.price());
                dirty = true;
            }
            if (existing.getOriginalPrice() == null && seed.originalPrice() != null) {
                existing.setOriginalPrice(seed.originalPrice());
                dirty = true;
            }
            if (existing.getStock() == null && seed.stock() != null) {
                existing.setStock(seed.stock());
                dirty = true;
            }
            if (shouldUpdateImage(existing.getImageUrl(), seed.imageUrl())) {
                existing.setImageUrl(seed.imageUrl());
                dirty = true;
            }
            if (isBlank(existing.getDescription()) && !isBlank(seed.description())) {
                existing.setDescription(seed.description());
                dirty = true;
            }
            if (isBlank(existing.getCategory()) && !isBlank(seed.category())) {
                existing.setCategory(seed.category());
                dirty = true;
            }
            if (existing.getActive() == null && seed.active() != null) {
                existing.setActive(seed.active());
                dirty = true;
            }

            return dirty ? productRepository.save(existing) : existing;
        }).orElseGet(() -> productRepository.save(Product.builder()
                .name(seed.name())
                .brand(seed.brand())
                .price(seed.price())
                .originalPrice(seed.originalPrice())
                .stock(seed.stock())
                .imageUrl(seed.imageUrl())
                .description(seed.description())
                .category(seed.category())
                .active(seed.active())
                .build()));
    }

    private boolean shouldUpdateImage(String currentUrl, String seedUrl) {
        if (isBlank(seedUrl)) {
            return false;
        }
        if (isBlank(currentUrl)) {
            return true;
        }
        String normalized = currentUrl.toLowerCase();
        if (normalized.contains("/images/uploads/")) {
            return false;
        }
        if (normalized.contains("unsplash")
                || normalized.contains("placeholder")
                || normalized.contains("via.placeholder")) {
            return true;
        }
        return !currentUrl.equals(seedUrl);
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

}
