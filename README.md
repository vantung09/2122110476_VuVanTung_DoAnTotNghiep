# TungZone - React + Spring Boot + Laragon MySQL

Dự án fullstack mô phỏng website bán hàng kiểu TopZone.

## Công nghệ

- Frontend: React + Vite + React Router + Axios
- Backend: Spring Boot 3 + Spring Security + JWT + JPA
- Database: MySQL chạy bằng **Laragon**

## Tính năng

- Đăng ký / đăng nhập bằng JWT
- Trang chủ hiển thị sản phẩm
- Xem chi tiết sản phẩm
- Trang quản trị:
  - Quản lý sản phẩm: thêm / sửa / xóa
  - Quản lý người dùng: xem / xóa / đổi quyền
  - Quản lý đơn hàng: xem / cập nhật trạng thái

## Tài khoản mẫu

Sau khi chạy backend lần đầu, dữ liệu mẫu sẽ tự seed:

- Admin
  - Email: `admin@tungzone.com`
  - Password: `admin123`
- User
  - Email: `user@tungzone.com`
  - Password: `user123`

## Cấu hình Laragon

Mặc định file `backend/src/main/resources/application.properties` đang để cấu hình phổ biến của Laragon:

```properties
spring.datasource.url=jdbc:mysql://127.0.0.1:3306/tung_zone?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Ho_Chi_Minh
spring.datasource.username=root
spring.datasource.password=
```

Nếu Laragon của bạn có mật khẩu MySQL, chỉ cần sửa lại dòng `spring.datasource.password`.

## Cách chạy backend

```bash
cd backend
mvn spring-boot:run
```

Backend mặc định chạy tại:

```txt
http://localhost:8080
```

## Cách chạy frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend mặc định chạy tại:

```txt
http://localhost:5173
```

## Mở bằng VS Code

- Mở folder `tungzone`
- Chạy Laragon và bật MySQL
- Mở terminal 1: chạy backend
- Mở terminal 2: chạy frontend

## API chính

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Public
- `GET /api/products`
- `GET /api/products/{id}`

### Admin - Products
- `GET /api/admin/products`
- `POST /api/admin/products`
- `PUT /api/admin/products/{id}`
- `DELETE /api/admin/products/{id}`

### Admin - Users
- `GET /api/admin/users`
- `PUT /api/admin/users/{id}/role`
- `DELETE /api/admin/users/{id}`

### Admin - Orders
- `GET /api/admin/orders`
- `PUT /api/admin/orders/{id}/status`

## Ghi chú

- Đây là starter project để bạn mở rộng tiếp.
- Chưa có giỏ hàng / checkout thật.
- Chưa có upload ảnh thật, hiện dùng `imageUrl`.
- Có thể nâng tiếp giao diện cho giống TopZone hơn.
