# TungZone

TungZone là website bán hàng công nghệ gồm giao diện khách hàng và trang quản trị.

Repo hiện có 2 hướng triển khai backend:
- `backend/`: bản monolith, phù hợp để chạy nhanh và ổn định với frontend.
- `microservices/`: bản tách service để phát triển theo kiến trúc microservices.

## Công nghệ sử dụng

- Frontend: `React 18`, `Vite`, `React Router`, `Axios`, `Tailwind CSS`
- Backend monolith: `Spring Boot 3`, `Spring Security`, `JWT`, `Spring Data JPA`
- Backend microservices: `Spring Boot 3`, `Spring Cloud Gateway`, `Eureka`
- Database: `MySQL`
- Java: `JDK 17`
- Build tool: `Maven`

## Cấu trúc dự án

```txt
tungzone/
|-- frontend/         # React + Vite
|-- backend/          # Spring Boot monolith
|-- microservices/    # Gateway + eureka + auth/catalog/order/payment
|-- run-logs/         # Log sinh ra khi chạy script start-all.ps1
|-- doctor.ps1        # Kiểm tra nhanh môi trường
|-- start-all.ps1     # Chạy toàn bộ microservices + frontend
|-- stop-all.ps1      # Dừng các tiến trình theo port
`-- README.md
```

## Chức năng chính

### Khách hàng
- Xem danh sách sản phẩm và chi tiết sản phẩm
- Đăng ký, đăng nhập email/password
- Đăng nhập Google
- Quản lý giỏ hàng và yêu thích
- Tạo thanh toán MoMo

### Quản trị
- Dashboard thống kê
- Quản lý danh mục
- Quản lý sản phẩm
- Quản lý người dùng
- Quản lý đơn hàng và cập nhật trạng thái
- Upload ảnh sản phẩm

## Yêu cầu môi trường

- `Node.js` 18 trở lên
- `JDK 17`
- `Maven`
- `MySQL 8`
- `ngrok` nếu cần test callback MoMo/IPN khi chạy local

## Chạy nhanh với monolith

Đây là cách nên dùng nếu bạn muốn chạy nhanh toàn bộ hệ thống.

### 1. Cấu hình database

Mở file `backend/src/main/resources/application.properties` và kiểm tra:

```properties
spring.datasource.url=jdbc:mysql://127.0.0.1:3306/tung_zone?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Ho_Chi_Minh
spring.datasource.username=root
spring.datasource.password=
```

Nếu MySQL của bạn có mật khẩu thì cập nhật lại `spring.datasource.password`.

### 2. Chạy backend monolith

```powershell
cd backend
mvn spring-boot:run
```

Backend chạy tại `http://localhost:8080`

### 3. Tạo file môi trường cho frontend

Tạo file `frontend/.env`:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_BACKEND_BASE_URL=http://localhost:8080
VITE_API_BASE_URL=http://localhost:8080/api
```

### 4. Chạy frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend chạy tại `http://localhost:5173`

## Chạy theo microservices

Repo có sẵn script để chạy toàn bộ microservices.

### Cách 1: chạy bằng script

Từ thư mục gốc dự án:

```powershell
.\doctor.ps1
.\start-all.ps1
```

Script sẽ khởi động:
- `eureka-server` tại `http://localhost:8761`
- `auth-service` tại cổng `8081`
- `catalog-service` tại cổng `8082`
- `order-service` tại cổng `8083`
- `payment-service` tại cổng `8084`
- `api-gateway` tại `http://localhost:8080`
- `frontend` tại `http://localhost:5173`

Khi không dùng nữa:

```powershell
.\stop-all.ps1
```

Lưu ý:
- `start-all.ps1` đang cố định sẵn các đường dẫn `JAVA_HOME`, `MAVEN_HOME` và `mysql.exe`.
- Nếu máy bạn cài Java, Maven hoặc MySQL ở vị trí khác, hãy sửa các biến ở đầu file `start-all.ps1` trước khi chạy.
- Script dùng các biến môi trường `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` nếu bạn muốn override cấu hình database mặc định.

### Cách 2: chạy từng service thủ công

```powershell
cd microservices\eureka-server
mvn spring-boot:run
```

```powershell
cd microservices\auth-service
mvn spring-boot:run
```

```powershell
cd microservices\catalog-service
mvn spring-boot:run
```

```powershell
cd microservices\order-service
mvn spring-boot:run
```

```powershell
cd microservices\payment-service
mvn spring-boot:run
```

```powershell
cd microservices\api-gateway
mvn spring-boot:run
```

Sau đó chạy frontend như bình thường trong thư mục `frontend/`.

Xem thêm chi tiết tại `microservices/README.md`.

## Cấu hình MoMo và ngrok

Khi chạy local, MoMo không thể gọi IPN vào `localhost`, vì vậy bạn cần một URL public. Cách đơn giản nhất là dùng `ngrok`.

### 1. Cài và đăng nhập ngrok

Sau khi cài `ngrok`, cấu hình authtoken:

```powershell
ngrok config add-authtoken <YOUR_NGROK_AUTHTOKEN>
```

### 2. Khởi động hệ thống local

- Nếu dùng monolith: chạy backend ở cổng `8080`
- Nếu dùng microservices: chạy `api-gateway` ở cổng `8080`

### 3. Mở tunnel cho backend/gateway

```powershell
ngrok http 8080
```

`ngrok` sẽ trả về một HTTPS URL dạng:

```txt
https://abc123.ngrok-free.app
```

### 4. Cập nhật IPN URL

Thay `app.momo.ipn-url` bằng URL public từ `ngrok`:

#### Nếu dùng monolith

Sửa file `backend/src/main/resources/application.properties`:

```properties
app.momo.ipn-url=https://abc123.ngrok-free.app/api/payments/momo/ipn
```

#### Nếu dùng microservices

Sửa file `microservices/payment-service/src/main/resources/application.properties`:

```properties
app.momo.ipn-url=https://abc123.ngrok-free.app/api/payments/momo/ipn
```

Lưu ý:
- Với microservices, IPN nên đi qua `api-gateway`, nên vẫn dùng path `/api/payments/momo/ipn`.
- Sau khi sửa cấu hình, hãy restart backend hoặc `payment-service` để nhận giá trị mới.

### 5. Redirect URL

Hiện tại cấu hình mặc định đang để:

```properties
app.momo.redirect-url=http://localhost:5173/cart
```

Giá trị này phù hợp khi bạn thanh toán ngay trên máy local đang chạy frontend.

Nếu bạn muốn mở luồng thanh toán từ điện thoại hoặc thiết bị khác ngoài máy local, hãy tạo thêm tunnel cho frontend:

```powershell
ngrok http 5173
```

Sau đó cập nhật:

```properties
app.momo.redirect-url=https://<frontend-ngrok-domain>/cart
```

## Tài khoản mẫu

- Admin
  - Email: `admin@tungzone.com`
  - Mật khẩu: `admin123`
- User
  - Email: `user@tungzone.com`
  - Mật khẩu: `user123`

## API chính của monolith

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`

### Public products
- `GET /api/products`
- `GET /api/products/{id}`

### Admin categories
- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `PUT /api/admin/categories/{id}`
- `DELETE /api/admin/categories/{id}`

### Admin products
- `GET /api/admin/products`
- `POST /api/admin/products`
- `PUT /api/admin/products/{id}`
- `DELETE /api/admin/products/{id}`

### Admin users
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PUT /api/admin/users/{id}/role`
- `DELETE /api/admin/users/{id}`

### Admin orders
- `GET /api/admin/orders`
- `PUT /api/admin/orders/{id}/status`

### Upload
- `POST /api/admin/uploads/image`

### Payment
- `POST /api/payments/momo/create`
- `POST /api/payments/momo/ipn`

## Route frontend quan trọng

### Public
- `/`
- `/products/:id`
- `/login`
- `/register`
- `/cart`
- `/favorites`

### Admin
- `/admin`
- `/admin/categories`
- `/admin/products`
- `/admin/users`
- `/admin/orders`

## Ghi chú

- Ảnh upload của admin được lưu mặc định tại `backend/uploads`
- Ảnh có thể truy cập qua `http://localhost:8080/images/uploads/{fileName}`
- Dữ liệu demo được seed khi backend chạy lần đầu
