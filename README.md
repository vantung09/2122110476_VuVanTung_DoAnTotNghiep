# TungZone

TungZone la website ban hang cong nghe phuc vu de tai tot nghiep cua **Vu Van Tung - MSSV 2122110476**.

Du an hien chay theo huong **monolith**:

- `backend/`: Spring Boot REST API, JWT, MySQL, san pham, tai khoan, don hang, thanh toan.
- `frontend/`: React + Vite cho storefront va trang quan tri.

## Cau Truc

```txt
tungzone/
|-- backend/       # Spring Boot monolith
|-- frontend/      # React + Vite
|-- database/      # SQL dump va du lieu mau MySQL
|-- .github/       # Workflow deploy frontend neu can
|-- .vscode/       # Task VS Code neu dung
`-- vercel.json    # Cau hinh deploy frontend
```

## Khoi tao database

Tao database `tung_zone` trong MySQL 8, sau do import file `database/tung_zone.sql`.

```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS tung_zone CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
mysql -u root -p tung_zone < database\tung_zone.sql
```

File SQL gom cau truc bang va du lieu mau de co the kiem tra website ngay sau khi chay.

## Yeu Cau

- Node.js 18+
- npm 9+
- JDK 17+
- Maven 3.9+
- MySQL 8

## Chay Du An

Chay MySQL truoc.

Terminal 1: chay backend.

```powershell
cd backend
mvn spring-boot:run
```

Terminal 2: chay frontend.

```powershell
cd frontend
npm install
npm run dev
```

URL sau khi chay:

- Frontend: http://localhost:5173
- Admin login: http://localhost:5173/admin/login
- Backend API: http://localhost:8085/api

Tai khoan quan tri:

Khong co tai khoan admin mac dinh. Neu can tao hoac doi mat khau admin local, dat trong `backend/.env`:

```env
SEED_ADMIN_EMAIL=your-admin@example.com
SEED_ADMIN_PASSWORD=your-strong-password
SEED_ADMIN_FULL_NAME=Store Owner
```

Tai khoan user demo neu can test mua hang: `user@tungzone.com / user123`.

Dung app: bam `Ctrl + C` trong 2 terminal backend/frontend.

## Cau Hinh Mac Dinh

Backend da co san cau hinh local, khong can set `$env:*` neu dung MySQL mac dinh:

- Port: `8085`
- Database: `jdbc:mysql://127.0.0.1:3306/tung_zone`
- Username: `root`
- Password: rong
- JWT secret: local dev key

Khi chay tu thu muc `backend/`, Spring Boot tu doc file `backend/.env` neu file nay ton tai. Dat SMTP trong `backend/.env` de gui OTP email that:

```env
MAIL_ENABLED=true
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password
MAIL_FROM=your-email@gmail.com
```

Chi can set bien moi truong khi may ban dung cau hinh khac, vi du MySQL co mat khau:

```powershell
cd backend
$env:DB_PASSWORD="mat_khau_mysql_cua_ban"
mvn spring-boot:run
```

Frontend local dung:

```env
VITE_BACKEND_BASE_URL=http://localhost:8085
VITE_API_BASE_URL=http://localhost:8085/api
```

Khi deploy frontend len Vercel, set cac bien production trong Project Settings thay vi de mac dinh `localhost`:

```env
VITE_BACKEND_BASE_URL=https://your-backend-domain
VITE_API_BASE_URL=https://your-backend-domain/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Khi deploy backend, giu `JPA_DDL_AUTO=update` hoac `validate`. Khong dung `create`/`create-drop` voi database that vi Hibernate se tao lai schema va co the lam mat du lieu. App se chan startup neu phat hien cau hinh nay, tru khi ban co tinh dat `APP_ALLOW_DESTRUCTIVE_DDL=true` cho database test co the xoa.

## Don File Sinh Ra

Chay tu thu muc `tungzone/`:

```powershell
Remove-Item -Recurse -Force backend\target, frontend\dist, frontend\node_modules\.vite, run-logs -ErrorAction SilentlyContinue
```

## Build

Build frontend:

```powershell
cd frontend
npm install
npm run build
```

Build backend:

```powershell
cd backend
mvn clean package -DskipTests
```

## MoMo Va Ngrok

Ngrok chi can khi muon MoMo Sandbox goi IPN ve may local.

```powershell
ngrok http 8085
```

IPN URL se co dang:

```txt
https://your-ngrok-domain.ngrok-free.app/api/payments/momo/ipn
```

Dat bien moi truong truoc khi chay lai backend neu muon dung URL do:

```powershell
$env:MOMO_IPN_URL="https://your-ngrok-domain.ngrok-free.app/api/payments/momo/ipn"
$env:MOMO_REDIRECT_URL="http://localhost:5173/cart"
mvn spring-boot:run
```

## Ghi Chu

- File build/cache/log nhu `target/`, `dist/`, `.vite/`, `run-logs/` khong can commit.
- Anh upload local nam trong `backend/uploads/`.
- Neu frontend khong tai du lieu, kiem tra MySQL, backend `8085`, va `frontend/.env.development`.
