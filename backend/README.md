# LabVentory Backend

Sistem REST API produksi untuk Multi-Lab Electronics Inventory Management. Mendukung multi-lab, peminjaman, notifikasi email, export PDF, audit log, dan dashboard analytics.

## Teknologi

- Node.js, Express.js
- PostgreSQL, Prisma ORM
- JWT Authentication, Role-based Authorization (superadmin, admin, student)
- OpenAPI 3 (Swagger UI)
- Nodemailer (SMTP)
- PDFKit (PDF export)
- node-cron (cron jobs)
- Zod (validasi input)
- Helmet, Rate Limiting, CORS, Centralized Error Handling
- Docker-ready

## Fitur Utama

- Autentikasi JWT (register, login) dan middleware role
- Manajemen Lab (superadmin)
- Kategori (admin/superadmin)
- Inventori (CRUD, QR code auto-generate)
- Peminjaman (request, approve/reject, return, auto stock update)
- Cron harian: auto mark late + reminder H-1
- Email notifikasi (approve, due reminder, late)
- Audit log (login, inventory CUD, approve/reject/return)
- Dashboard analytics (summary & statistik)
- Export PDF (borrowing history + inventory summary)

## Struktur Proyek

```
src/
  config/        # env, swagger, mailer
  controllers/   # business controllers
  routes/        # express routers
  services/      # domain services
  middleware/    # auth, validate, error handler
  prisma/        # prisma client
  utils/         # audit, qrcode, pdf, templates
  jobs/          # cron
  docs/          # openapi.json
  app.js
  server.js
prisma/
  schema.prisma
  seed.js
```

Tautan cepat (IDE):  
- App: [src/app.js](file:///d:/PROJECT/Hosting/LabVentory/backend/src/app.js)  
- Server: [src/server.js](file:///d:/PROJECT/Hosting/LabVentory/backend/src/server.js)  
- Prisma Schema: [prisma/schema.prisma](file:///d:/PROJECT/Hosting/LabVentory/backend/prisma/schema.prisma)  
- Swagger Spec: [src/docs/openapi.json](file:///d:/PROJECT/Hosting/LabVentory/backend/src/docs/openapi.json)  

## Prasyarat

- Node.js 18+
- PostgreSQL 13+

## Konfigurasi Environment

Salin `.env.sample` menjadi `.env`, lalu isi:

```
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public
JWT_SECRET=<random-64-byte-hex>
JWT_EXPIRES_IN=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=akun@gmail.com
SMTP_PASS=<App-Password-Gmail-tanpa-spasi>
MAIL_FROM="LabVentory <akun@gmail.com>"
```

Catatan:
- JWT_SECRET harus panjang & acak (64-byte hex disarankan).
- Gmail memerlukan 2FA + App Password (bukan password biasa). Tulis tanpa spasi.
- Port 587 = STARTTLS, 465 = SMTPS (secure). Transporter otomatis secure untuk 465.

## Instalasi & Inisialisasi

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Server berjalan di `http://localhost:4000`.  
REST base path: `/api` | Swagger UI: `http://localhost:4000/docs`.

## Menjalankan Produksi

```bash
npm start
```

Atau menggunakan Docker:

```bash
docker build -t labventory-backend ./backend
docker run --env-file ./backend/.env -p 4000:4000 labventory-backend
```

Pastikan `DATABASE_URL` mengarah ke instance PostgreSQL yang dapat diakses dari kontainer.

## Autentikasi & Peran

- superadmin: kelola multi-lab, CRUD lab, akses global
- admin: terikat ke satu lab, CRUD kategori/inventori labnya, approve/reject/return
- student: lihat inventori labnya, request peminjaman

Token: Bearer JWT di Authorization header. Masa berlaku default `7d`.

## Endpoint Inti

- Auth: `POST /api/auth/register`, `POST /api/auth/login`
- Labs (superadmin): `GET/POST /api/labs`, `PUT/DELETE /api/labs/:id`
- Categories (admin/superadmin): `GET/POST /api/categories`, `PUT/DELETE /api/categories/:id`
- Inventory: `GET/POST /api/inventory`, `GET/PUT/DELETE /api/inventory/:id`
- Borrowings: `GET/POST /api/borrowings`, `POST /api/borrowings/:id/(approve|reject|return)`
- Dashboard: `GET /api/dashboard/summary`
- Export PDF: `GET /api/export/borrowing?from=YYYY-MM-DD&to=YYYY-MM-DD`, `GET /api/export/inventory`

Dokumentasi lengkap tersedia di Swagger UI.

## Cron Jobs

- Jadwal: setiap hari pukul 09:00 server time.  
  - Tandai `late` untuk peminjaman overdue.  
  - Kirim reminder H-1 untuk peminjaman yang due besok.

## Email

- SMTP via Nodemailer.  
- Template sederhana: approve, reject, due reminder, late.  
- Untuk pengujian lokal gunakan Mailtrap.

## PDF Export

- Borrowing history (range tanggal) & inventory summary.  
- Response bertipe `application/pdf` dan diunduh sebagai attachment.

## Keamanan

- Password hashing (bcrypt)
- JWT + role-based authorization
- Helmet, CORS, Rate limiting
- Validasi input (Zod)
- Jangan commit `.env` ke repository publik

## Skrip NPM

```json
{
  "dev": "nodemon src/server.js",
  "start": "node src/server.js",
  "seed": "node prisma/seed.js",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev",
  "prisma:deploy": "prisma migrate deploy"
}
```

## Troubleshooting

- Email gagal mengirim (Gmail): pastikan 2FA aktif dan gunakan App Password (tanpa spasi), port 587, dan `SMTP_USER` sama dengan alamat di `MAIL_FROM`.
- Prisma error koneksi DB: cek `DATABASE_URL`, database dan kredensial Postgres.
- 401/403: pastikan header Authorization `Bearer <token>` dan role sesuai.

## Lisensi

Internal/Proprietary. Sesuaikan dengan kebutuhan Anda.

