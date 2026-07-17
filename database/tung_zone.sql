-- phpMyAdmin SQL Dump
-- version 6.0.0-dev+20260324.466df794d2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Jul 17, 2026 at 04:11 AM
-- Server version: 8.0.45
-- PHP Version: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `tung_zone`
--

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` bigint NOT NULL,
  `active` bit(1) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `description` text,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `active`, `created_at`, `description`, `name`) VALUES
(1, b'1', '2026-04-01 10:40:07.536431', '', 'iPhone'),
(2, b'1', '2026-04-01 10:40:07.615623', '', 'Mac'),
(4, b'1', '2026-04-01 10:40:07.638366', '', 'Âm thanh'),
(5, b'1', '2026-04-01 10:40:07.650366', '', 'Banner'),
(6, b'1', '2026-04-01 10:40:07.656367', '', 'iPad'),
(7, b'1', '2026-04-01 10:40:07.662381', '', 'Watch'),
(8, b'1', '2026-04-01 10:40:07.668378', '', 'Tai nghe'),
(10, b'1', '2026-04-08 08:42:24.428618', '', 'Phu kien');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` bigint NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `status` enum('CANCELLED','COMPLETED','CONFIRMED','PENDING','SHIPPING') NOT NULL,
  `total_amount` double NOT NULL,
  `user_id` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `created_at`, `status`, `total_amount`, `user_id`) VALUES
(1, '2026-03-28 15:17:58.402376', 'CANCELLED', 37980000, 2),
(2, '2026-03-28 20:24:14.606323', 'COMPLETED', 23990000, 3),
(3, '2026-03-28 20:24:18.766184', 'COMPLETED', 23990000, 3),
(4, '2026-03-28 20:24:19.968308', 'COMPLETED', 23990000, 3),
(5, '2026-03-28 20:29:45.618904', 'COMPLETED', 47980000, 3),
(6, '2026-03-28 20:31:03.406032', 'COMPLETED', 47980000, 3),
(7, '2026-03-29 19:56:16.311895', 'COMPLETED', 1590000, 6),
(8, '2026-03-29 22:12:53.512215', 'CONFIRMED', 23990000, 3),
(9, '2026-03-29 22:49:31.820449', 'CONFIRMED', 65990000, 3),
(10, '2026-03-29 22:50:11.757618', 'CONFIRMED', 37990000, 3),
(16, '2026-04-09 14:57:53.648064', 'PENDING', 1190000, 5),
(17, '2026-04-09 15:06:00.153341', 'PENDING', 1190000, 5),
(18, '2026-04-09 15:06:28.095226', 'PENDING', 1190000, 5),
(19, '2026-04-09 15:23:50.294873', 'COMPLETED', 65990000, 4),
(20, '2026-04-09 15:47:12.553450', 'PENDING', 42990000, 4),
(21, '2026-04-09 15:47:28.190196', 'PENDING', 42990000, 4),
(22, '2026-04-14 20:19:36.082316', 'COMPLETED', 42990000, 7),
(23, '2026-04-14 20:44:17.196050', 'CONFIRMED', 1190000, 2),
(24, '2026-04-14 21:05:01.011056', 'PENDING', 690000, 7),
(25, '2026-04-22 08:20:51.313087', 'COMPLETED', 5990000, 8),
(26, '2026-04-23 20:22:04.382976', 'COMPLETED', 37990000, 8),
(27, '2026-05-05 22:59:38.654779', 'CONFIRMED', 8990000, 4),
(28, '2026-05-06 08:06:37.423905', 'COMPLETED', 42990000, 8),
(29, '2026-05-06 08:56:40.530709', 'CONFIRMED', 42990000, 7),
(32, '2026-05-06 10:03:35.904092', 'CONFIRMED', 42990000, 7),
(33, '2026-05-06 10:15:17.932870', 'COMPLETED', 37990000, 7),
(34, '2026-05-06 10:28:51.206891', 'COMPLETED', 42990000, 7),
(35, '2026-05-06 10:53:58.403786', 'COMPLETED', 42990000, 7),
(36, '2026-05-11 22:19:39.820474', 'COMPLETED', 42990000, 7);

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` bigint NOT NULL,
  `price` double DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `order_id` bigint NOT NULL,
  `product_id` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `price`, `quantity`, `order_id`, `product_id`) VALUES
(1, 31990000, 1, 1, 1),
(2, 5990000, 1, 1, 3),
(3, 23990000, 1, 2, 17),
(4, 23990000, 1, 3, 17),
(5, 23990000, 1, 4, 17),
(6, 23990000, 2, 5, 17),
(7, 23990000, 2, 6, 17),
(8, 1590000, 1, 7, 71),
(9, 23990000, 1, 8, 17),
(10, 65990000, 1, 9, 45),
(11, 37990000, 1, 10, 13),
(19, 1190000, 1, 16, 73),
(20, 1190000, 1, 17, 73),
(21, 1190000, 1, 18, 73),
(22, 65990000, 1, 19, 45),
(23, 42990000, 1, 20, 12),
(24, 42990000, 1, 21, 12),
(25, 42990000, 1, 22, 12),
(26, 1190000, 1, 23, 73),
(27, 690000, 1, 24, 23),
(28, 5990000, 1, 25, 3),
(29, 37990000, 1, 26, 13),
(30, 8990000, 1, 27, 18),
(31, 42990000, 1, 28, 12),
(32, 42990000, 1, 29, 44),
(35, 42990000, 1, 32, 44),
(36, 37990000, 1, 33, 13),
(37, 42990000, 1, 34, 12),
(38, 42990000, 1, 35, 12),
(39, 42990000, 1, 36, 12);

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` bigint NOT NULL,
  `amount` double NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `method` varchar(50) DEFAULT NULL,
  `payment_url` varchar(500) DEFAULT NULL,
  `status` enum('CANCELLED','COMPLETED','FAILED','PENDING') NOT NULL,
  `transaction_ref` varchar(255) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `order_id` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `amount`, `created_at`, `method`, `payment_url`, `status`, `transaction_ref`, `updated_at`, `order_id`) VALUES
(1, 1190000, '2026-04-09 14:57:53.872854', 'MOMO', 'https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT1pSUU8yMDI2MDMyOF9URVNUfDE2&s=4ef9f9ee645bb5f887a386f0f2a0668881b7468286859711854f2d1f442fbda4', 'COMPLETED', 'REQ_246e3e90-21e5-4cb0-903f-1f2029eccbfa', '2026-04-09 14:57:54.501683', 16),
(2, 1190000, '2026-04-09 15:06:00.241765', 'MOMO', 'https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT1pSUU8yMDI2MDMyOF9URVNUfDE3&s=5763f4addcc27992fac1ff58ef8b17d31985cd0b6ca4648390e3e544369865e3', 'COMPLETED', 'REQ_356d9805-1cc9-4cce-8615-ee21d4c5de46', '2026-04-09 15:06:00.652121', 17),
(3, 1190000, '2026-04-09 15:06:28.106114', 'MOMO', 'https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT1pSUU8yMDI2MDMyOF9URVNUfDE4&s=58f1c2f2c3a49b42557029c8c30b89af6de8a82c95dc7080c6ca3ff8f02ddbf0', 'FAILED', 'REQ_1fbdaed2-6061-49f6-84fc-05fb50e84b8e', '2026-04-09 15:06:28.224356', 18),
(4, 65990000, '2026-04-09 15:23:50.706858', 'MOMO', '', 'COMPLETED', 'REQ_c31cdb2c-6d4f-43c6-bcbb-d9489fc7d553', '2026-04-09 15:23:50.706858', 19),
(5, 42990000, '2026-04-09 15:47:12.615137', 'MOMO', 'https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT1pSUU8yMDI2MDMyOF9URVNUfDIw&s=993ad606a291edcfd3512c1416086822260fc2a329b4e72ad0797e360877c1ee', 'FAILED', 'REQ_17f8ba05-c54d-453f-b687-536389b18a68', '2026-04-09 15:47:40.827921', 20),
(6, 42990000, '2026-04-09 15:47:28.200157', 'MOMO', 'https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT1pSUU8yMDI2MDMyOF9URVNUfDIx&s=218389216cc9125550218dca64e5f35a5e6347ad9a370405956c425ae0e3fe12', 'COMPLETED', 'REQ_2a475ac4-913a-446d-ad94-eb228263d854', '2026-04-09 15:47:28.322862', 21),
(7, 42990000, '2026-04-14 20:19:36.154039', 'MOMO', 'https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT1pSUU8yMDI2MDMyOF9URVNUfDIy&s=8c1dc3331fbfd23ba7da19a736f5c46173e9b43005f59553b643cc9567e99b88', 'FAILED', 'REQ_14258f7e-24e9-4198-87cf-6be8899af4cc', '2026-04-14 20:19:36.542862', 22),
(8, 690000, '2026-04-14 21:05:01.068217', 'MOMO', 'https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT1pSUU8yMDI2MDMyOF9URVNUfDI0&s=f5e0b228dcc21f09445f9721d3d8c2ef32c8d746c936649dce97342fedb4bc57', 'COMPLETED', 'REQ_ffe4c4c0-86d8-4ed3-836e-b12bc6995b62', '2026-04-14 21:05:01.199106', 24),
(9, 5990000, '2026-04-22 08:20:51.377394', 'MOMO', 'https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT1pSUU8yMDI2MDMyOF9URVNUfDI1&s=dc5ff3d23561ef827bd69ee1033ba67435b1b1c058b40771f03c282fb6a04b3c', 'COMPLETED', 'REQ_fb6d422d-9f7e-40c6-8cdc-85b6564551ed', '2026-04-22 08:20:52.284377', 25),
(10, 37990000, '2026-04-23 20:22:04.468524', 'MOMO', 'https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT1pSUU8yMDI2MDMyOF9URVNUfDI2&s=c40cb26b58d14f947ad18b31a8a0ceca3444bf40de141338a98ae6f74ab7339c', 'COMPLETED', 'REQ_745d3da1-7eb6-464d-b409-c5c014e17dd7', '2026-04-23 20:22:04.834279', 26),
(12, 8990000, '2026-05-05 22:59:38.719272', 'MOMO', 'https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT1pSUU8yMDI2MDMyOF9URVNUfDI3&s=377cd26e37bb547d36cd965d39e2ada54c7175f2abb6d0b74f52fed77defa3a6', 'COMPLETED', 'REQ_37a98640-71ed-40e5-97ab-2699281c1e38', '2026-05-05 22:59:39.069892', 27),
(13, 42990000, '2026-05-06 08:56:40.568912', 'MOMO', 'https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT1pSUU8yMDI2MDMyOF9URVNUfDI5&s=c7f3c73ecd2a09ecee9f017fbdbacfade54b27e0e699513efde4645b52c87e11', 'COMPLETED', 'REQ_98e4d2d1-452a-4f6f-8575-aa16954e9106', NULL, 29),
(16, 42990000, '2026-05-06 10:03:35.952947', 'MOMO', 'https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT1pSUU8yMDI2MDMyOF9URVNUfDMy&s=3e1c9bb83965277e16cfa49bd849e589e28b456975c3ecc0c9d13d7f22e477d7', 'FAILED', 'REQ_9ead3d9d-cf27-49fd-8713-5851350c5bcc', NULL, 32),
(17, 37990000, '2026-05-06 10:15:17.951254', 'MOMO', 'https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT1pSUU8yMDI2MDMyOF9URVNUfDMz&s=9bf054d8c85acc8886e69561c95a0090af6a24b6c20f468c8d2e8e538f1361ff', 'COMPLETED', 'REQ_bd1c902d-2f86-4ea7-beab-25a38908b81d', '2026-05-06 10:27:48.401354', 33),
(18, 42990000, '2026-05-06 10:28:51.240270', 'MOMO', 'https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT1pSUU8yMDI2MDMyOF9URVNUfDM0&s=9e936d8af218fe60951bca58809c3652469a969dd0b2561647783f83b45eb2e3', 'COMPLETED', 'REQ_4b7e78fc-32b8-4c2d-9c1d-2ce2c982631a', '2026-05-06 10:28:51.664718', 34),
(19, 42990000, '2026-05-06 10:53:58.419971', 'MOMO', 'https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT1pSUU8yMDI2MDMyOF9URVNUfDM1&s=c25a793ce4b9548586c491a89a997ac077ce4099f2e4d610a1c06d9cec34259b', 'COMPLETED', 'REQ_88540e61-4409-49a1-a730-7d8b075106b9', NULL, 35),
(20, 42990000, '2026-05-11 22:19:39.854728', 'MOMO', 'https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT1pSUU8yMDI2MDMyOF9URVNUfDM2&s=2683f97b90d7a6eccda3ec2d7085f5a3435e7f91f38096d60761592f911b381c', 'COMPLETED', 'REQ_476c4649-0d78-4f20-80d4-2f111d9f63a8', NULL, 36);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` bigint NOT NULL,
  `active` bit(1) DEFAULT NULL,
  `brand` varchar(255) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `description` text,
  `image_url` varchar(255) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `original_price` double DEFAULT NULL,
  `price` double DEFAULT NULL,
  `stock` int DEFAULT NULL,
  `category_id` bigint DEFAULT NULL,
  `flash_sale` bit(1) DEFAULT NULL,
  `flash_sale_end_at` datetime(6) DEFAULT NULL,
  `flash_sale_quantity` int DEFAULT NULL,
  `flash_sale_sold` int DEFAULT NULL,
  `flash_sale_start_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `active`, `brand`, `category`, `created_at`, `description`, `image_url`, `name`, `original_price`, `price`, `stock`, `category_id`, `flash_sale`, `flash_sale_end_at`, `flash_sale_quantity`, `flash_sale_sold`, `flash_sale_start_at`) VALUES
(1, b'1', 'Apple', 'iPhone', '2026-03-28 15:17:58.369509', 'Điện thoại cao cấp, chip mạnh, camera đẹp.', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=1200&auto=format&fit=crop', 'iPhone 15 Pro Max 256GB', 34990000, 31990000, 20, 1, b'0', NULL, 0, 0, NULL),
(2, b'1', 'Apple', 'Mac', '2026-03-28 15:17:58.379234', 'Laptop mỏng nhẹ, pin lâu, phù hợp học tập và làm việc.', 'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?q=80&w=1200&auto=format&fit=crop', 'MacBook Air M3 13 inch', 29990000, 27990000, 15, 2, b'0', NULL, 0, 0, NULL),
(3, b'1', 'Apple', 'Phụ kiện', '2026-03-28 15:17:58.387753', 'Tai nghe chống ồn, âm thanh tốt, kết nối nhanh.', 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=1200&auto=format&fit=crop', 'AirPods Pro 2', 6490000, 5990000, 30, 10, b'0', NULL, 0, 0, NULL),
(4, b'1', 'Apple', 'iPhone', '2026-03-28 16:12:09.222190', 'Khung titan, camera Pro 48MP, màn hình ProMotion 120Hz.', '/images/iphone-16-pro-max-titan-sa-mac-thumbnew-650x650.png', 'iPhone 16 Pro Max Titan Sa Mạc 256GB', 36990000, 33990000, 18, 1, NULL, NULL, NULL, NULL, NULL),
(5, b'1', 'Apple', 'iPhone', '2026-03-28 16:12:09.281931', 'Hiệu năng mạnh mẽ, chụp ảnh thiếu sáng ấn tượng.', '/images/iphone-16-pro-den-650x650.png', 'iPhone 16 Pro Đen 256GB', 32990000, 29990000, 22, 1, NULL, NULL, NULL, NULL, NULL),
(6, b'1', 'Apple', 'iPhone', '2026-03-28 16:12:09.295515', 'Màn hình lớn, pin bền bỉ, camera sắc nét.', '/images/iphone-16-plus-trang-thumb-650x650.png', 'iPhone 16 Plus Trắng 256GB', 28990000, 26990000, 25, 1, NULL, NULL, NULL, NULL, NULL),
(7, b'1', 'Apple', 'iPhone', '2026-03-28 16:12:09.310845', 'Thiết kế gọn nhẹ, hiệu năng cân bằng, phù hợp mọi nhu cầu.', '/images/iphone-16e-black-thumbtz-650x650.png', 'iPhone 16e Black 128GB', 23990000, 21990000, 30, 1, NULL, NULL, NULL, NULL, NULL),
(8, b'1', 'Apple', 'iPhone', '2026-03-28 16:12:09.324805', 'Camera 48MP, Dynamic Island, pin trâu cả ngày.', '/images/iphone-15-plus-black-1-2-650x650.png', 'iPhone 15 Plus Black 128GB', 21990000, 18990000, 24, 1, NULL, NULL, NULL, NULL, NULL),
(9, b'1', 'Apple', 'iPhone', '2026-03-28 16:12:09.339123', 'Màu xanh thời thượng, sạc USB-C, ảnh chân dung sắc nét.', '/images/iphone-15-green-1-2-650x650.png', 'iPhone 15 Green 256GB', 23990000, 20990000, 20, 1, NULL, NULL, NULL, NULL, NULL),
(10, b'1', 'Apple', 'iPhone', '2026-03-28 16:12:09.352545', 'Chip A15 Bionic, camera kép ổn định, phù hợp học tập.', '/images/iphone-14-blue-1-2-650x650.png', 'iPhone 14 Blue 128GB', 16990000, 13990000, 28, 1, NULL, NULL, NULL, NULL, NULL),
(11, b'1', 'Apple', 'iPhone', '2026-03-28 16:12:09.366510', 'Hiệu năng ổn định, thiết kế bền bỉ, giá dễ tiếp cận.', '/images/iphone-13-black-1-2-3-650x650.png', 'iPhone 13 Black 128GB', 14990000, 11990000, 35, 1, NULL, NULL, NULL, NULL, NULL),
(12, b'1', 'Apple', 'iPhone', '2026-03-28 16:12:09.416065', 'Dung lượng lớn, camera chuyên nghiệp, hiệu năng flagship.', '/images/iphone-17-pro-max-sliver-thumb-650x650.png', 'iPhone 17 Pro Max Silver 512GB', 45990000, 42990000, 8, 1, NULL, NULL, NULL, NULL, NULL),
(13, b'1', 'Apple', 'iPhone', '2026-03-28 16:12:09.456961', 'Phiên bản màu cam nổi bật, màn hình 120Hz, chip A19 Pro.', '/images/iphone-17-pro-cam-thumb-650x650.png', 'iPhone 17 Pro Cam 256GB', 40990000, 37990000, 10, 1, b'1', '2026-05-12 22:01:00.000000', 0, 0, '2026-05-11 22:01:00.000000'),
(14, b'1', 'Apple', 'iPhone', '2026-03-28 16:12:09.477095', 'Thiết kế cao cấp, pin tốt hơn, hỗ trợ AI thông minh.', '/images/iphone-17-blue-thumb-650x650.png', 'iPhone 17 Blue 256GB', 36990000, 33990000, 12, 1, NULL, NULL, NULL, NULL, NULL),
(15, b'1', 'Apple', 'iPhone', '2026-03-28 16:12:09.499836', 'Màu hồng nhẹ nhàng, camera kép, sạc nhanh 30W.', '/images/iphone-17e-256gb-hong-thumb-650x650.png', 'iPhone 17e 256GB Hồng', 28990000, 25990000, 16, 1, NULL, NULL, NULL, NULL, NULL),
(16, b'1', 'Apple', 'iPhone', '2026-03-28 16:12:09.518261', 'Siêu mỏng nhẹ, màn hình sáng, tối ưu cho công việc.', '/images/iphone-air-vang-thumb_0-650x650.png', 'iPhone Air Vàng 256GB', 30990000, 27990000, 14, 1, b'1', '2026-05-12 22:01:00.000000', 0, 0, '2026-05-11 22:01:00.000000'),
(17, b'1', 'Apple', 'iPhone', '2026-03-28 16:12:09.532850', 'Phiên bản tiêu chuẩn, hiệu năng ổn định, camera nâng cấp.', '/images/ip16-thumb-1-650x650.png', 'iPhone 16 128GB', 25990000, 23990000, 26, 1, b'1', '2026-05-12 22:01:00.000000', 0, 0, '2026-05-11 22:01:00.000000'),
(18, b'1', 'JBL', 'Âm thanh', '2026-03-28 16:12:09.547961', 'Âm trầm mạnh, pin lâu, phù hợp tiệc ngoài trời.', '/images/loa-bluetooth-jbl-partybox-320-pbstage320as-thumb-650x650.png', 'Loa Bluetooth JBL PartyBox 320', 10990000, 8990000, 12, 4, NULL, NULL, NULL, NULL, NULL),
(19, b'1', 'Marshall', 'Âm thanh', '2026-03-28 16:12:09.563016', 'Thiết kế cổ điển, âm thanh cân bằng, pin 20 giờ.', '/images/loa-bluetooth-marshall-kilburn-ii-650x650.png', 'Loa Bluetooth Marshall Kilburn II', 7990000, 6990000, 10, 4, NULL, NULL, NULL, NULL, NULL),
(20, b'1', 'Jincase', 'Phụ kiện', '2026-03-28 16:12:09.579073', 'Chống trầy, chống vân tay, độ trong suốt cao.', '/images/mieng-dan-kinh-cuong-luc-iphone-16-pro-max-premium-jincase-thumb-650x650.png', 'Miếng dán kính cường lực iPhone 16 Pro Max Jincase', 390000, 290000, 80, 10, NULL, NULL, NULL, NULL, NULL),
(21, b'1', 'Jincase', 'Phụ kiện', '2026-03-28 16:12:09.593045', 'Kháng va đập, tương thích MagSafe, siêu mỏng nhẹ.', '/images/op-lung-iphone-15-magsafe-pc-tpu-jc-jcs003-ava-plus-thumb-638878306858413205-650x650.png', 'Ốp lưng iPhone 15 MagSafe JC-JCS003', 490000, 390000, 60, 10, NULL, NULL, NULL, NULL, NULL),
(22, b'1', 'Anker', 'Phụ kiện', '2026-03-28 16:12:09.606731', 'Sạc không dây chuẩn Qi2, hỗ trợ PD 27W.', '/images/pin-sac-du-phong-10000mah-khong-day-magnetic-qi2-type-c-pd-27w-anker-maggo-a1654-trang-thumb-650x650.png', 'Pin sạc dự phòng Anker MagGo 10000mAh', 1790000, 1490000, 45, 10, NULL, NULL, NULL, NULL, NULL),
(23, b'1', 'Targus', 'Phụ kiện', '2026-03-28 16:12:09.621655', 'Bảo vệ laptop, chống nước nhẹ, nhiều ngăn tiện dụng.', '/images/tui-chong-soc-133-targus-citygear-tss930gl-80-080822-044639-650x650.png', 'Túi chống sốc 13.3\" Targus CityGear', 890000, 690000, 25, 10, NULL, NULL, NULL, NULL, NULL),
(24, b'1', 'Apple', 'Banner', '2026-03-28 16:12:09.635261', 'Banner ưu đãi iPhone 15 Plus.', '/images/0563809d876094fa2bb7606be2055307.png', 'Banner iPhone 15 Plus', NULL, 18990000, 0, 5, NULL, NULL, NULL, NULL, NULL),
(25, b'1', 'Apple', 'Banner', '2026-03-28 16:12:09.648751', 'Banner ưu đãi iPhone 14.', '/images/38356f3a92241b0370c46bd784756025.png', 'Banner iPhone 14', NULL, 13990000, 0, 5, NULL, NULL, NULL, NULL, NULL),
(26, b'1', 'Apple', 'Banner', '2026-03-28 16:12:09.662267', 'Banner iPad Air M4 mới ra mắt.', '/images/9a9b662b46b6c9bc3c4db6d4ebc6c2b8.jpg', 'Banner iPad Air M4', NULL, 16690000, 0, 5, NULL, NULL, NULL, NULL, NULL),
(27, b'1', 'Apple', 'Banner', '2026-03-28 16:12:09.675150', 'Banner MacBook Neo giá tốt.', '/images/d0b16b549d82743e1793bef778366361.png', 'Banner MacBook Neo', NULL, 18990000, 0, 5, NULL, NULL, NULL, NULL, NULL),
(28, b'1', 'Apple', 'Banner', '2026-03-28 16:12:09.689854', 'Banner Apple Watch Series 11.', '/images/ee47b489951f3039bfad24e9840c66a8.png', 'Banner Apple Watch Series 11', NULL, 11190000, 0, 5, NULL, NULL, NULL, NULL, NULL),
(29, b'1', 'Apple', 'Banner', '2026-03-28 16:12:09.702479', 'Banner iPhone 17e giá trị tối ưu.', '/images/fafecfcac0d54395454c28fd5a6bcc84.jpg', 'Banner iPhone 17e', NULL, 25990000, 0, 5, NULL, NULL, NULL, NULL, NULL),
(30, b'1', 'Apple', 'iPad', '2026-03-28 18:47:41.795552', 'Man hinh Liquid Retina, ho tro Apple Pencil, pin tot ca ngay.', '/images/hinhanh/ipad-11-5g-sliver-thumb-650x650.png', 'iPad 11 5G Silver 128GB', 18990000, 16990000, 20, 6, NULL, NULL, NULL, NULL, NULL),
(31, b'1', 'Apple', 'iPad', '2026-03-28 18:47:41.832332', 'May nhe, dung luong pin ben bi, phu hop hoc tap.', '/images/hinhanh/ipad-11-wifi-yellow-thumb-650x650.png', 'iPad 11 WiFi Yellow 128GB', 15990000, 13990000, 25, 6, NULL, NULL, NULL, NULL, NULL),
(32, b'1', 'Apple', 'iPad', '2026-03-28 18:47:41.846524', 'Chip M3 manh me, man hinh rong, phu hop cong viec sang tao.', '/images/hinhanh/ipad-air-m3-11-inch-wifi-gray-thumb-650x650.png', 'iPad Air M3 11 inch WiFi Gray 256GB', 20990000, 18990000, 18, 6, NULL, NULL, NULL, NULL, NULL),
(33, b'1', 'Apple', 'iPad', '2026-03-28 18:47:41.857526', 'Man hinh 13 inch, am thanh song dong, pin su dung ca ngay.', '/images/hinhanh/ipad-air-m3-13-inch-wifi-purple-thumb-650x650.png', 'iPad Air M3 13 inch WiFi Purple 256GB', 23990000, 21990000, 14, 6, NULL, NULL, NULL, NULL, NULL),
(34, b'1', 'Apple', 'iPad', '2026-03-28 18:47:41.867745', 'Nho gon de mang, man hinh sac net, ho tro Apple Pencil.', '/images/hinhanh/ipad-mini-7-wifi-purple-thumbtz-650x650.png', 'iPad mini 7 WiFi Purple 128GB', 14990000, 12990000, 22, 6, NULL, NULL, NULL, NULL, NULL),
(35, b'1', 'Apple', 'iPad', '2026-03-28 18:47:41.878065', 'Man hinh ProMotion 120Hz, chip manh, ho tro cong viec nang.', '/images/hinhanh/ipad-pro-11-inch-wifi-silver-thumb-650x650.png', 'iPad Pro 11 inch WiFi Silver 256GB', 27990000, 24990000, 12, 6, NULL, NULL, NULL, NULL, NULL),
(36, b'1', 'Apple', 'iPad', '2026-03-28 18:47:41.888069', 'Man hinh rong 13 inch, am thanh hay, phu hop thiet ke.', '/images/hinhanh/ipad-pro-13-inch-wifi-nano-silver-650x650.png', 'iPad Pro 13 inch WiFi Nano Silver 512GB', 37990000, 34990000, 10, 6, NULL, NULL, NULL, NULL, NULL),
(37, b'1', 'Apple', 'iPad', '2026-03-28 18:47:41.899156', 'Chip M5 hieu nang cao, tuong thich Magic Keyboard.', '/images/hinhanh/ipad-pro-m5-wifi-13-inch-black-thumbtz-650x650.png', 'iPad Pro M5 13 inch WiFi Black 512GB', 42990000, 39990000, 8, 6, NULL, NULL, NULL, NULL, NULL),
(38, b'1', 'Apple', 'iPad', '2026-03-28 18:47:41.910384', 'Man hinh 11 inch, chip M5, phu hop cong viec linh hoat.', '/images/hinhanh/ipad-pro-m5-wifi-11-inch-black-thumbtz-650x650.png', 'iPad Pro M5 11 inch WiFi Black 256GB', 35990000, 32990000, 10, 6, NULL, NULL, NULL, NULL, NULL),
(39, b'1', 'Apple', 'Mac', '2026-03-28 18:47:41.920584', 'Thiet ke mong nhe, pin ben, phu hop hoc tap va van phong.', '/images/hinhanh/mac-air-m2-13-xanh-new-1-650x650.png', 'MacBook Air M2 13 inch Midnight 256GB', 21990000, 18990000, 18, 2, NULL, NULL, NULL, NULL, NULL),
(40, b'1', 'Apple', 'Mac', '2026-03-28 18:47:41.931446', 'Chip M4, man hinh sac net, sac nhanh USB-C.', '/images/hinhanh/macbook-air-13-inch-m4-thumb-xanh-den-650x650.png', 'MacBook Air M4 13 inch Midnight 256GB', 27990000, 24990000, 16, 2, NULL, NULL, NULL, NULL, NULL),
(41, b'1', 'Apple', 'Mac', '2026-03-28 18:47:41.943016', 'Man hinh 15 inch rong rai, am thanh lon, pin tot.', '/images/hinhanh/macbook-air-15-inch-m4-thumb-xanh-da-troi-650x650.png', 'MacBook Air M4 15 inch Sky Blue 256GB', 31990000, 28990000, 12, 2, NULL, NULL, NULL, NULL, NULL),
(42, b'1', 'Apple', 'Mac', '2026-03-28 18:47:41.956583', 'Cau hinh 16GB/512GB, phu hop do hoa va cong viec nang.', '/images/hinhanh/macbook-air-13-inch-m5-16gb-512gb-bac-thumb-639082164936546333-650x650.png', 'MacBook Air M5 13 inch 16GB 512GB Silver', 34990000, 31990000, 10, 2, NULL, NULL, NULL, NULL, NULL),
(43, b'1', 'Apple', 'Mac', '2026-03-28 18:47:41.968574', 'Man hinh lon, chip M5 manh, lam viec da nhiem tot.', '/images/hinhanh/macbook-air-15-inch-m5-16gb-512gb-thumb-639081774113369129-650x650.png', 'MacBook Air M5 15 inch 16GB 512GB Silver', 38990000, 35990000, 8, 2, NULL, NULL, NULL, NULL, NULL),
(44, b'1', 'Apple', 'Mac', '2026-03-28 18:47:41.978576', 'Man hinh ProMotion, hieu nang cao, phu hop pro user.', '/images/hinhanh/macbook-pro-14-inch-m5-16gb-512gb-den-650x650.png', 'MacBook Pro M5 14 inch 16GB 512GB Space Black', 45990000, 42990000, 8, 2, NULL, NULL, NULL, NULL, NULL),
(45, b'1', 'Apple', 'Mac', '2026-03-28 18:47:41.992631', 'Cau hinh manh cho do hoa, render va lap trinh.', '/images/hinhanh/macbook-pro-16-inch-m5-pro-24gb-1tb-bac-thumb-1-2-650x650.png', 'MacBook Pro M5 Pro 16 inch 24GB 1TB Silver', 69990000, 65990000, 5, 2, NULL, NULL, NULL, NULL, NULL),
(46, b'1', 'Apple', 'Mac', '2026-03-28 18:47:42.008629', 'Gia tot, gon nhe, thich hop hoc tap va van phong.', '/images/hinhanh/macbook-neo-13-inch-a18-pro-8gb-256gb-hong-thumb-650x650.png', 'MacBook Neo 13 inch A18 Pro 8GB 256GB Pink', 19990000, 17990000, 12, 2, NULL, NULL, NULL, NULL, NULL),
(47, b'1', 'Apple', 'Watch', '2026-03-28 18:47:42.019634', 'Theo doi suc khoe co ban, thoi luong pin tot.', '/images/hinhanh/apple-watch-se-3-40mm-vien-nhom-day-the-thao-starlight-thumb-650x650.png', 'Apple Watch SE 3 GPS 40mm Starlight', 7990000, 6990000, 18, 7, NULL, NULL, NULL, NULL, NULL),
(48, b'1', 'Apple', 'Watch', '2026-03-28 18:47:42.033630', 'Ho tro eSIM, nghe goi doc lap, theo doi van dong.', '/images/hinhanh/apple-watch-se-3-gps-cellular-40mm-vien-nhom-day-the-thao-starlight-thumb-650x650.png', 'Apple Watch SE 3 GPS + Cellular 40mm Starlight', 9990000, 8990000, 12, 7, NULL, NULL, NULL, NULL, NULL),
(49, b'1', 'Apple', 'Watch', '2026-03-28 18:47:42.046623', 'Man hinh sang, do Suc khoe nang cao, ho tro LTE.', '/images/hinhanh/apple-watch-series-10-lte-42mm-day-vai-den-tb-650x650.png', 'Apple Watch Series 10 LTE 42mm Black', 12990000, 11990000, 10, 7, NULL, NULL, NULL, NULL, NULL),
(50, b'1', 'Apple', 'Watch', '2026-03-28 18:47:42.057632', 'Thiet ke moi, do nhip tim, theo doi the luc.', '/images/hinhanh/apple-watch-series-11-42mm-vien-nhom-day-the-thao-vang-hong-thumb-650x650.png', 'Apple Watch Series 11 42mm Rose Gold', 14990000, 13990000, 10, 7, NULL, NULL, NULL, NULL, NULL),
(51, b'1', 'Apple', 'Watch', '2026-03-28 18:47:42.069629', 'Khung titanium, day Milan sang, ho tro eSIM.', '/images/hinhanh/apple-watch-series-11-gps-cellular-vien-titanium-day-milan-titan-thumb-650x650.png', 'Apple Watch Series 11 Titanium Milan', 23990000, 21990000, 6, 7, NULL, NULL, NULL, NULL, NULL),
(52, b'1', 'Apple', 'Watch', '2026-03-28 18:47:42.083623', 'Khung titanium, day the thao ben, theo doi suc khoe.', '/images/hinhanh/apple-watch-series-11-gps-cellular-vien-titanium-day-the-thao-vamg-thumb-650x650.png', 'Apple Watch Series 11 Titanium Gold', 22990000, 20990000, 6, 7, NULL, NULL, NULL, NULL, NULL),
(53, b'1', 'Apple', 'Watch', '2026-03-28 18:47:42.137211', 'Chiu luc tot, pin ben, ho tro the thao ngoai troi.', '/images/hinhanh/apple-watch-ultra-3-gps-cellular-49mm-vien-titanium-day-alpine-den-thumb-650x650.png', 'Apple Watch Ultra 3 49mm Alpine Black', 25990000, 23990000, 6, 7, NULL, NULL, NULL, NULL, NULL),
(54, b'1', 'Apple', 'Watch', '2026-03-28 18:47:42.189833', 'Khang nuoc tot, ho tro GPS chinh xac, man hinh sang.', '/images/hinhanh/apple-watch-ultra-3-gps-cellular-49mm-vien-titanium-day-ocean-titan-thumb-650x650.png', 'Apple Watch Ultra 3 49mm Ocean Titanium', 25990000, 23990000, 6, 7, NULL, NULL, NULL, NULL, NULL),
(55, b'1', 'Apple', 'Watch', '2026-03-28 18:47:42.208834', 'Thiet ke ben, phu hop chay bo, leo nui, trekking.', '/images/hinhanh/apple-watch-ultra-3-gps-cellular-49mm-vien-titanium-day-trail-den-thumb-650x650.png', 'Apple Watch Ultra 3 49mm Trail Black', 25990000, 23990000, 6, 7, NULL, NULL, NULL, NULL, NULL),
(56, b'1', 'Apple', 'Tai nghe', '2026-03-28 18:47:42.233868', 'Am thanh can bang, ket noi nhanh, pin ben.', '/images/hinhanh/airpods-4-thumb-1-650x650.png', 'AirPods 4', 4490000, 3990000, 25, 8, NULL, NULL, NULL, NULL, NULL),
(57, b'1', 'Apple', 'Tai nghe', '2026-03-28 18:47:42.250396', 'Sac USB-C, chong on, am thanh trong treo.', '/images/hinhanh/airpods-4-thumb-650x650.png', 'AirPods 4 USB-C', 4690000, 4190000, 20, 8, NULL, NULL, NULL, NULL, NULL),
(58, b'1', 'Apple', 'Tai nghe', '2026-03-28 18:47:42.263291', 'Chong on chu dong, che do xuyen am, hop tai thoai.', '/images/hinhanh/tai-nghe-bluetooth-airpods-pro-2nd-gen-usb-c-charge-apple-thumb-12-1-650x650.png', 'AirPods Pro 2 USB-C', 5990000, 5490000, 18, 8, NULL, NULL, NULL, NULL, NULL),
(59, b'1', 'Apple', 'Tai nghe', '2026-03-28 18:47:42.278094', 'Am thanh cao cap, chong on manh, ket noi on dinh.', '/images/hinhanh/airpods-pro-3-100925-025234-544-650x650.png', 'AirPods Pro 3', 6990000, 6490000, 14, 8, b'1', '2026-05-14 21:55:00.000000', 0, 0, '2026-05-13 21:55:00.000000'),
(60, b'1', 'Apple', 'Tai nghe', '2026-03-28 18:47:42.294272', 'Tai nghe co day, mic ro, am thanh on dinh.', '/images/hinhanh/tai-nghe-co-day-apple-mtjy3-thumb-650x650.png', 'Apple EarPods USB-C', 790000, 590000, 60, 8, NULL, NULL, NULL, NULL, NULL),
(61, b'1', 'JBL', 'Tai nghe', '2026-03-28 18:47:42.324291', 'Nho gon, de treo, am thanh manh, chong nuoc.', '/images/hinhanh/loa-bluetooth-jbl-clip-5-thumb-650x650.png', 'Loa Bluetooth JBL Clip 5', 2490000, 1990000, 22, 8, NULL, NULL, NULL, NULL, NULL),
(62, b'1', 'JBL', 'Tai nghe', '2026-03-28 18:47:42.338537', 'Cong suat lon, pin ben, ho tro sac nguoc.', '/images/hinhanh/bluetooth-jbl-charge-5-xanh-la-thumb-1-2-650x650.png', 'Loa Bluetooth JBL Charge 5', 3490000, 2990000, 20, 8, NULL, NULL, NULL, NULL, NULL),
(63, b'1', 'Marshall', 'Tai nghe', '2026-03-28 18:47:42.352874', 'Thiet ke co dien, am thanh day, nghe nhac hay.', '/images/hinhanh/loa-bluetooth-marshall-acton-iii-kem-650x650.png', 'Loa Bluetooth Marshall Acton III', 8990000, 7990000, 10, 8, NULL, NULL, NULL, NULL, NULL),
(64, b'1', 'Marshall', 'Tai nghe', '2026-03-28 18:47:42.366871', 'Nho gon, am thanh can bang, pin ben.', '/images/hinhanh/loa-bluetooth-marshall-emberton-iii-650x650.png', 'Loa Bluetooth Marshall Emberton III', 5490000, 4990000, 12, 8, NULL, NULL, NULL, NULL, NULL),
(65, b'1', 'Sony', 'Tai nghe', '2026-03-28 18:47:42.384484', 'Bass manh, chong nuoc, ket noi on dinh.', '/images/hinhanh/loa-bluetooth-sony-srs-ult10-230724-112025-650x650.png', 'Loa Bluetooth Sony SRS-ULT10', 3290000, 2790000, 12, 8, NULL, NULL, NULL, NULL, NULL),
(66, b'1', 'Apple', 'Phu kien', '2026-03-28 18:47:42.396097', 'Sac nhanh 20W, tuong thich iPhone va iPad.', '/images/hinhanh/adapter-sac-type-c-20w-cho-iphone-ipad-apple-mhje3-101021-023343-650x650.png', 'Adapter sac Apple USB-C 20W', 590000, 490000, 80, 10, b'1', '2026-05-14 21:54:00.000000', 0, 0, '2026-05-13 21:54:00.000000'),
(67, b'1', 'Apple', 'Phu kien', '2026-03-28 18:47:42.415608', 'Cap sac va truyen du lieu, ben va on dinh.', '/images/hinhanh/cap-type-c-type-c-1m-apple-mqkj3-thumb-5-650x650.png', 'Cap Apple USB-C to USB-C 1m', 690000, 590000, 70, 10, NULL, NULL, NULL, NULL, NULL),
(68, b'1', 'Apple', 'Phu kien', '2026-03-28 18:47:42.428683', 'Ve va ghi chu muot, do chinh xac cao.', '/images/hinhanh/apple-pencil-pro-650x650.png', 'Apple Pencil Pro', 3490000, 3290000, 20, 10, NULL, NULL, NULL, NULL, NULL),
(69, b'1', 'Apple', 'Phu kien', '2026-03-28 18:47:42.442682', 'Bao ve man hinh, gap dung nhieu goc, nhe.', '/images/hinhanh/bao-da-smart-folio-cho-ipad-pro-m4-11-inch-thumb-650x650.png', 'Bao da Smart Folio iPad Pro M4 11 inch', 2790000, 2490000, 25, 10, NULL, NULL, NULL, NULL, NULL),
(70, b'1', 'Apple', 'Phu kien', '2026-03-28 18:47:42.457690', 'Day deo thoi trang, de dang phoi do.', '/images/hinhanh/day-deo-cheo-apple-vang-neon-mgge4-thumb-638942391913305355-650x650.png', 'Day deo cheo Apple Neon', 990000, 790000, 30, 10, NULL, NULL, NULL, NULL, NULL),
(71, b'1', 'Apple', 'Phu kien', '2026-03-28 18:47:42.470828', 'Ho tro MagSafe, chat lieu ben dep, chong tray.', '/images/hinhanh/op-lung-magsafe-iphone-17-pro-max-techwoven-apple-thumb-650x650.png', 'Op lung MagSafe iPhone 17 Pro Max Techwoven', 1890000, 1590000, 28, 10, NULL, NULL, NULL, NULL, NULL),
(72, b'1', 'TopZone', 'Phu kien', '2026-03-28 18:47:42.484981', 'Thiet ke sang, bao ve camera va mat lung.', 'http://localhost:8080/images/hinhanh/titan-tu-nhien-topzone-1-2-650x650.png', 'Apple Wath series 2', 1390000, 1190000, 20, 7, b'1', '2026-05-12 22:00:00.000000', 0, 0, '2026-05-11 22:00:00.000000'),
(73, b'1', 'TopZone', 'Phu kien', '2026-04-01 10:19:58.614821', 'Thiet ke sang, bao ve camera va mat lung.', 'http://localhost:8080/images/hinhanh/titan-tu-nhien-topzone-1-2-650x650.png', 'Apple Watch Series 7', 1390000, 1190000, 20, 7, b'1', '2026-06-03 21:59:00.000000', 0, 0, '2026-06-02 21:54:00.000000'),
(82, b'1', 'TopZone', NULL, '2026-05-11 22:18:04.219325', 'Thiet ke sang, bao ve camera va mat lung.', '/images/hinhanh/titan-tu-nhien-topzone-1-2-650x650.png', 'Op lung Titanium tu nhien', 1390000, 1190000, 20, 10, b'1', '2026-06-03 21:53:00.000000', 0, 0, '2026-06-02 21:53:00.000000');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('ADMIN','USER') NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `password_reset_expires_at` datetime(6) DEFAULT NULL,
  `password_reset_token` varchar(120) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `created_at`, `email`, `full_name`, `password`, `role`, `address`, `phone_number`, `password_reset_expires_at`, `password_reset_token`) VALUES
(2, '2026-03-28 15:17:58.172201', 'user@vscode22.com', 'Demo User', '$2a$10$ERuRsOLl2qNrmsvN4uW2KOkWA16b4JfMEgiRv6vGjVE1Rv99FGZwW', 'USER', NULL, NULL, NULL, NULL),
(3, '2026-03-28 18:13:17.963231', 'lovuong@gmail.com', 'tung vu', '$2a$10$nZLhnVHZxJL2KzKK16nkJ.AV67k2uiNLOOFIFKS.v/SIPzMyXNFW.', 'USER', NULL, NULL, NULL, NULL),
(4, '2026-03-29 19:38:05.034858', 'admin@tungzone.com', 'Văn Tùng', '$2a$10$bxCTXIJPNrbW0u/k1q5qPuYWsCwX4R8kHt2ftx0qI80nKOaIi6x5G', 'ADMIN', NULL, NULL, NULL, NULL),
(5, '2026-03-29 19:38:05.230065', 'user@tungzone.com', 'Demo User', '$2a$10$87NuCHoY7JxpK9tdzn6MjeS8ZdrO.GHDXFehIfPCwCqxRe3L7FZ/q', 'USER', NULL, NULL, NULL, NULL),
(6, '2026-03-29 19:55:50.244861', 'vantung991339@gmail.com', 'Tùng văn', '$2a$10$XWYTanxycN0q2dCYBNpY0uCRfQzKFdr9rEz.6mEzpXUoBZj1df13S', 'USER', NULL, NULL, NULL, NULL),
(7, '2026-04-08 09:48:39.598356', 'tungrt6@gmail.com', 'Tung Van', '$2a$10$6GwSBSX5JZoeJmsVdXX2wevJbj2xFmqNZTIu1HQ0PREQEbv3ZnG/K', 'ADMIN', NULL, '0375683521', '2026-05-06 12:08:03.940832', '$2a$10$D/iQNt.EPpABPt/K.X98eOA9qxDai/SDEwQmocTdmsau7IRR3FNMW'),
(8, '2026-04-22 08:20:23.428394', 'linhvu@gmai.com', 'linh vu', '$2a$10$Bb9DUAsjQmuXwi1/yxSgHuVTNqCpuPbD6xyPmAH/zs4NDO/wZGY3a', 'USER', NULL, NULL, '2026-05-06 08:17:57.480624', '$2a$10$H/uDEp4ezx/kDzX57nYUyu9qgeQvpuDl9vcSMuWzL86w8KjfD8//O');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UKt8o6pivur7nn124jehx7cygw5` (`name`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK32ql8ubntj5uh44ph9659tiih` (`user_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FKbioxgbv59vetrxe0ejfubep1w` (`order_id`),
  ADD KEY `FKocimc7dtr037rh4ls4l95nlfi` (`product_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK81gagumt0r8y3rmudcgpbk42l` (`order_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FKog2rp4qthbtt2lfyhfo32lsw9` (`category_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UK6dotkott2kjsp8vw4d0m25fb7` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=83;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `FK32ql8ubntj5uh44ph9659tiih` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `FKbioxgbv59vetrxe0ejfubep1w` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  ADD CONSTRAINT `FKocimc7dtr037rh4ls4l95nlfi` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `FK81gagumt0r8y3rmudcgpbk42l` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`);

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `FKog2rp4qthbtt2lfyhfo32lsw9` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
