# TungZone Microservices

Kiến trúc microservices được scaffold song song với backend monolith để bạn chuyển dần mà vẫn giữ dữ liệu hiện có.

## Thành phần

- `eureka-server` chạy cổng `8761`
- `api-gateway` chạy cổng `8080`
- `auth-service` chạy cổng `8081`
- `catalog-service` chạy cổng `8082`
- `order-service` chạy cổng `8083`
- `payment-service` chạy cổng `8084`

## Ranh giới service

- `auth-service`: đăng ký, đăng nhập, Google login, quản lý người dùng admin
- `catalog-service`: sản phẩm, danh mục, upload ảnh, phục vụ ảnh tĩnh `/images/**`
- `order-service`: quản lý đơn hàng cho admin và người dùng
- `payment-service`: tạo thanh toán MoMo, nhận IPN, xử lý callback thanh toán
- `api-gateway`: điểm vào duy nhất cho frontend React qua các route `/api/**`
- `eureka-server`: service discovery cho toàn bộ hệ thống

## Ghi chú migration

- Giai đoạn này các service vẫn **dùng chung database `tung_zone`** để giữ nguyên dữ liệu cũ.
- Frontend hiện tại không cần đổi base URL vì vẫn gọi `http://localhost:8080/api/...` thông qua gateway.
- Backend monolith trong thư mục `backend` vẫn có thể dùng để đối chiếu hoặc fallback.

## Cách chạy

### Cách 1: chạy bằng script ở thư mục gốc

Từ thư mục gốc dự án `tungzone/`:

```powershell
.\doctor.ps1
.\start-all.ps1
```

Script sẽ tự chạy:
- `eureka-server`
- `auth-service`
- `catalog-service`
- `order-service`
- `payment-service`
- `api-gateway`
- `frontend`

Để dừng toàn bộ:

```powershell
.\stop-all.ps1
```

Lưu ý:
- `start-all.ps1` đang dùng sẵn các đường dẫn local cho `JAVA_HOME`, `MAVEN_HOME` và `mysql.exe`.
- Nếu máy bạn cài ở vị trí khác, hãy sửa phần biến ở đầu file `start-all.ps1`.
- Bạn có thể override database bằng biến môi trường `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`.

### Cách 2: chạy thủ công từng service

Mở 6 cửa sổ terminal riêng:

```powershell
cd D:\2122110476_VuVanTung_DOANTN\tungzone\microservices\eureka-server
mvn spring-boot:run
```

```powershell
cd D:\2122110476_VuVanTung_DOANTN\tungzone\microservices\auth-service
mvn spring-boot:run
```

```powershell
cd D:\2122110476_VuVanTung_DOANTN\tungzone\microservices\catalog-service
mvn spring-boot:run
```

```powershell
cd D:\2122110476_VuVanTung_DOANTN\tungzone\microservices\order-service
mvn spring-boot:run
```

```powershell
cd D:\2122110476_VuVanTung_DOANTN\tungzone\microservices\payment-service
mvn spring-boot:run
```

```powershell
cd D:\2122110476_VuVanTung_DOANTN\tungzone\microservices\api-gateway
mvn spring-boot:run
```

Sau đó chạy frontend:

```powershell
cd D:\2122110476_VuVanTung_DOANTN\tungzone\frontend
npm install
npm run dev
```

## Luồng gateway

Frontend chỉ cần gọi gateway tại `http://localhost:8080`.

Một số route chính đang được map qua gateway:
- `/api/auth/**` -> `auth-service`
- `/api/products/**`, `/api/admin/products/**`, `/api/admin/categories/**`, `/api/admin/uploads/**` -> `catalog-service`
- `/api/admin/orders/**`, `/api/orders/**` -> `order-service`
- `/api/payments/momo/**` -> `payment-service`
- `/images/**` -> `catalog-service`

## Cấu hình MoMo và ngrok

Khi chạy local, MoMo không thể gọi callback/IPN vào `localhost`, nên bạn cần public cổng `8080` bằng `ngrok`.

### 1. Cài và cấu hình ngrok

```powershell
ngrok config add-authtoken <YOUR_NGROK_AUTHTOKEN>
```

### 2. Chạy hệ thống microservices

Đảm bảo `api-gateway` đang chạy ở cổng `8080`.

### 3. Tạo public tunnel cho gateway

```powershell
ngrok http 8080
```

Ví dụ `ngrok` trả về:

```txt
https://abc123.ngrok-free.app
```

### 4. Cập nhật IPN URL cho payment-service

Sửa file `microservices/payment-service/src/main/resources/application.properties`:

```properties
app.momo.ipn-url=https://abc123.ngrok-free.app/api/payments/momo/ipn
```

Lưu ý:
- Nên giữ path `/api/payments/momo/ipn` vì request cần đi qua `api-gateway`.
- Sau khi sửa file cấu hình, hãy restart `payment-service`.

### 5. Cấu hình redirect URL nếu cần test từ thiết bị khác

Mặc định:

```properties
app.momo.redirect-url=http://localhost:5173/cart
```

Nếu bạn test thanh toán trên điện thoại hoặc thiết bị khác, hãy mở thêm tunnel cho frontend:

```powershell
ngrok http 5173
```

Sau đó đổi lại:

```properties
app.momo.redirect-url=https://<frontend-ngrok-domain>/cart
```

## Hướng nâng cấp tiếp theo

- Tách database riêng cho từng service
- Thêm config server
- Bổ sung tracing, logging tập trung và health check đầy đủ
- Tách thêm service riêng nếu cần cho banner hoặc media
