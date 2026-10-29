# ফুলপুর ব্লাড ডোনার নেটওয়ার্ক — Backend API
**Phulpur Blood Donor Network Backend**

A robust, enterprise-grade RESTful API built with **Node.js, Express 5, TypeScript, MongoDB, and Prisma ORM**, implementing server-side Role-Based Access Control (RBAC), donor verification workflows, emergency blood request coordination, and an automated 120-day donation countdown tracking engine.

---

## 🚀 Key Features

1. **MongoDB Database Architecture:**
   - Native MongoDB integration with Prisma ORM (`@prisma/client@6.19.x`).
   - MongoDB-compatible ObjectIds (`String @id @default(auto()) @map("_id") @db.ObjectId`).
   - Database schema synchronization via `prisma db push`.

2. **Role-Based Access Control (RBAC):**
   - **`DONOR`**: Register, login, view/edit permitted profile fields, submit donation slips, and monitor personal 120-day donation countdowns.
   - **`ADMIN`**: Approve/reject pending donors, verify/reject blood donation slips, manage emergency requests, update platform contacts, and view operational metrics.
   - **`SUPERADMIN`**: Full administrator oversight (list admins, block/unblock admins, demote admins to donors, and safely delete admin accounts with history guards).

3. **120-Day Donation Countdown Engine (“পরবর্তী সম্ভাব্য রক্তদানের সময়”):**
   - Dynamic tracker based **strictly on the latest approved donation record**.
   - Pending and rejected donations never alter the countdown timeline.
   - Outputs days, hours, minutes, and seconds remaining in both English and Bengali numerals.
   - Returns clear status flags: `NO_RECORD`, `COUNTING`, or `READY`.

4. **Emergency Blood Requests (“জরুরি রক্তের প্রয়োজন”):**
   - Public and authenticated emergency blood requests with bag counts, blood groups, patient info, and location.
   - Status transitions (`ACTIVE`, `FULFILLED`, `CLOSED`) with owner and admin access controls.

5. **OpenAPI 3.0 & Swagger UI Documentation:**
   - Interactive Swagger API Explorer served live at `/api-docs` and `/docs`.
   - Raw OpenAPI JSON specification at `/api-docs/swagger.json`.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js (v20+ / v22+)
- **Framework:** Express.js 5 (`express@^5.1.0`)
- **Language:** TypeScript 5.9 with ES Modules
- **Database:** MongoDB
- **ORM:** Prisma ORM 6.19 (`@prisma/client`, `prisma`)
- **Authentication:** JWT (`jsonwebtoken`) & `bcryptjs`
- **Validation:** Zod 4 (`zod`)
- **Documentation:** Swagger UI Express (`swagger-ui-express`)
- **Testing:** Node Native Test Runner with `supertest`

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory (refer to `example.env`):

```env
NODE_ENV=development
PORT=5001

# MongoDB Connection String (Local MongoDB or MongoDB Atlas)
DATABASE_URL="mongodb://127.0.0.1:27017/phulpur_blood_network"

BCRYPT_SALT_ROUND=10
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000

# Authentication & JWT
JWT_SECRET=your_jwt_super_secret_key_2026
JWT_EXPIRE_IN=15m
JWT_REFRESH_EXPIRE_IN=30d

# Redis Settings (Optional)
REDIS_URL="redis://localhost:6379"

# Email Settings (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
EMAIL_FROM=no-reply@phulpurblood.org

# Super Admin Seed Credentials (Automatically created on server startup if not present)
NAME="Super Admin"
EMAIL="admin@phulpur.org"
PHONE="01700000000"
PASSWORD="AdminPassword123!"
AVATAR="https://i.ibb.co/VWkMFBWM/pngtree-user-icon-png-image-1796659.jpg"

FRONTEND_URL=http://localhost:3000
```

---

## 📦 Setup & Database Commands

```bash
# 1. Install dependencies
pnpm install

# 2. Push schema to MongoDB (creates collections & indexes)
pnpm db:push

# 3. Generate Prisma client
pnpm postinstall

# 4. Run automated test suite
pnpm test

# 5. Start development server (with tsx watch)
pnpm dev

# 6. Build production bundle
pnpm build
```

---

## 📚 API Endpoints Summary

### Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/register` — Public donor registration (forces `role: DONOR`, `status: PENDING`).
- `POST /api/v1/auth/login` — Login with phone/email and password (checks `isBlocked`).
- `POST /api/v1/auth/logout` — Logout.
- `GET /api/v1/auth/me` — Current authenticated profile with countdown summary.
- `POST /api/v1/auth/refresh-token` — Refresh access token.
- `POST /api/v1/auth/change-password` — Change password.
- `POST /api/v1/auth/forgot-password` — Password reset request.
- `POST /api/v1/auth/reset-password` — Complete password reset.

### Donors Directory & Profile (`/api/v1/donors`)
- `GET /api/v1/donors` — Public directory of approved, unblocked donors (filter by blood group, location, onlyAvailable).
- `GET /api/v1/donors/:id` — Public approved donor profile.
- `PATCH /api/v1/donors/me` — Update permitted profile fields (`name`, `currentAddress`, `permanentAddress`, `bloodGroup`, `gender`, `profileImage`).
- `GET /api/v1/donors/me/donations` — Authenticated donor's own donation history & countdown.

### Donation Records (`/api/v1/donations`)
- `POST /api/v1/donations` — Submit donation record with optional slip upload (defaults to `PENDING`).
- `GET /api/v1/donations/me` — Donor's donation records and 120-day countdown summary.

### Admin Management (`/api/v1/admin`) — *Requires ADMIN or SUPERADMIN*
- `GET /api/v1/admin/donors` — List donors for review (filter by `PENDING`, `APPROVED`, `isBlocked`).
- `PATCH /api/v1/admin/donors/:id/approve` — Approve pending donor registration.
- `PATCH /api/v1/admin/donors/:id/reject` — Reject pending donor registration.
- `PATCH /api/v1/admin/donors/:id/block` — Block donor account.
- `PATCH /api/v1/admin/donors/:id/unblock` — Unblock donor account.
- `GET /api/v1/admin/donations` — Review all donation records.
- `PATCH /api/v1/admin/donations/:id/approve` — Verify and approve donation record (resets countdown).
- `PATCH /api/v1/admin/donations/:id/reject` — Reject donation record.
- `PATCH /api/v1/admin/emergency-requests/:id/status` — Update emergency request status (`ACTIVE`, `FULFILLED`, `CLOSED`).
- `DELETE /api/v1/admin/emergency-requests/:id` — Delete emergency request.
- `PATCH /api/v1/admin/platform-contact` — Update platform contact details.
- `GET /api/v1/admin/reports` — Platform operational statistics.

### Super Admin Portal (`/api/v1/superadmin`) — *Requires SUPERADMIN*
- `GET /api/v1/superadmin/admins` — View list of administrator accounts.
- `PATCH /api/v1/superadmin/admins/:id/block` — Block administrator account.
- `PATCH /api/v1/superadmin/admins/:id/unblock` — Unblock administrator account.
- `PATCH /api/v1/superadmin/admins/:id/remove-role` — Revoke admin role (demote to `DONOR`).
- `DELETE /api/v1/superadmin/admins/:id` — Delete administrator account (safeguarded against audit history conflicts).

### Emergency Blood Requests (`/api/v1/emergency-requests`)
- `POST /api/v1/emergency-requests` — Create emergency blood request (public or authenticated).
- `GET /api/v1/emergency-requests` — View active emergency requests (filter by blood group, location).
- `GET /api/v1/emergency-requests/:id` — View single emergency request.
- `PATCH /api/v1/emergency-requests/:id` — Edit emergency request (creator or admin).

### Platform Contact & Stats
- `GET /api/v1/platform-contact` — Public view of platform contact configuration.
- `GET /api/v1/stats` — Public counters for total approved donors, total donations, and last donation days ago.

---

## 🛡️ Super Admin Initialization

Initial Super Admin seeding is automated during startup (`src/server.ts` invoking `seedSuperAdmin`):
- It reads the environment variables `NAME`, `PHONE`, `EMAIL`, `PASSWORD`.
- If no account with role `SUPERADMIN` exists in MongoDB, it creates the initial Super Admin account with role `SUPERADMIN` and status `APPROVED`.
- Public registration endpoints NEVER allow assigning `SUPERADMIN` or `ADMIN`.

---

## 🧪 Testing

Run the automated test suite covering:
- 120-Day Donation Countdown engine calculations and boundary conditions.
- Blood Group normalization and Bengali formatting across all 8 blood groups.
- MongoDB ObjectId validation.
- RBAC security checks (preventing donors from accessing admin endpoints, preventing admins from accessing superadmin endpoints).
- Public registration sanitization and privilege escalation prevention.

```bash
pnpm test
```
