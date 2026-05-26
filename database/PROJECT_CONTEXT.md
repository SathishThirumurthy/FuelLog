# FuelLog — Project Summary & Context
> Share this file at the start of any new chat session to continue development

---

## Project Overview
FuelLog is a full-stack car fuel and service tracking web application.
- **Owner:** Sathish Thirumurthy
- **GitHub:** https://github.com/SathishThirumurthy/FuelLog
- **Status:** Fully functional with PostgreSQL integration

---

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | React 18 + TypeScript + Vite            |
| Backend    | Node.js + Express 5                     |
| Database   | PostgreSQL (local, DB name: Sathish)    |
| Auth       | JWT (jsonwebtoken) + bcrypt             |
| Email      | Nodemailer + Gmail SMTP                 |
| Styling    | Custom CSS (no Tailwind, no UI library) |
| Charts     | Chart.js + react-chartjs-2             |

---

## Local Development

### Folder Structure
```
Documents/Projects/FuelLog/
├── fuellog-frontend/     ← React app (port 5173)
├── fuellog-backend/      ← Express API (port 3001)
└── database/
    ├── fuellog_schema_and_data.sql   ← original schema + Baleno data
    └── alter_users_table.sql         ← users table migration
```

### Start Frontend
```bash
cd ~/Documents/Projects/FuelLog/fuellog-frontend
npm run dev
```

### Start Backend
```bash
cd ~/Documents/Projects/FuelLog/fuellog-backend
npm run dev
```

---

## Database Schema

### Table: users
```
id            SERIAL PRIMARY KEY
email         VARCHAR(100) UNIQUE    ← used as login ID
password_hash VARCHAR(255)           ← bcrypt hashed
status        VARCHAR(20)            ← 'pending' | 'verified'
verify_token  VARCHAR(255)           ← UUID, cleared after verification
created_at    TIMESTAMP
last_login    TIMESTAMP
```

### Table: cars
```
id         VARCHAR(50) PRIMARY KEY
name       VARCHAR(100)
country    CHAR(2)                   ← 'IN' or 'US'
purchased  DATE
sold       DATE
note       TEXT
reg        VARCHAR(30)
active     BOOLEAN
user_id    INTEGER → users(id)       ← links car to user
created_at TIMESTAMP
```

### Table: fuel_entries
```
id             VARCHAR(50) PRIMARY KEY
car_id         VARCHAR(50) → cars(id)
entry_date     DATE
odometer_km    NUMERIC(10,2)
fuel_qty       NUMERIC(8,2)
price_per_unit NUMERIC(8,2)
distance_km    NUMERIC(10,2)
mileage        NUMERIC(8,2)
amount         NUMERIC(10,2)
place          VARCHAR(200)
user_id        INTEGER → users(id)   ← links entry to user
created_at     TIMESTAMP
```

### Table: service_entries
```
id           VARCHAR(50) PRIMARY KEY
car_id       VARCHAR(50) → cars(id)
service_date DATE
odometer_km  NUMERIC(10,2)
amount       NUMERIC(10,2)
remarks      TEXT
user_id      INTEGER → users(id)     ← links entry to user
created_at   TIMESTAMP
```

---

## API Endpoints

### Base URL: http://localhost:3001

### Auth (Public — no token required)
| Method | Endpoint                  | Purpose                        |
|--------|---------------------------|--------------------------------|
| POST   | /api/auth/signup          | Register new user + send email |
| GET    | /api/auth/verify?token=xx | Verify email token             |
| POST   | /api/auth/login           | Login → returns JWT token      |
| POST   | /api/auth/resend          | Resend verification email      |

### Cars (Protected — JWT required)
| Method | Endpoint                   | Purpose            |
|--------|----------------------------|--------------------|
| GET    | /api/cars                  | Get all user's cars|
| POST   | /api/cars                  | Add new car        |
| PATCH  | /api/cars/:id              | Update car         |
| PATCH  | /api/cars/:id/setactive    | Set active car     |
| DELETE | /api/cars/:id              | Delete car         |

### Fuel Entries (Protected — JWT required)
| Method | Endpoint          | Purpose                    |
|--------|-------------------|----------------------------|
| GET    | /api/fuel/:carId  | Get all fuel entries        |
| POST   | /api/fuel         | Add new fuel entry          |
| PATCH  | /api/fuel/:id     | Update fuel entry           |
| DELETE | /api/fuel/:id     | Delete fuel entry           |

### Service Entries (Protected — JWT required)
| Method | Endpoint             | Purpose                    |
|--------|----------------------|----------------------------|
| GET    | /api/service/:carId  | Get all service entries    |
| POST   | /api/service         | Add new service entry      |
| PATCH  | /api/service/:id     | Update service entry       |
| DELETE | /api/service/:id     | Delete service entry       |

### Reports (Protected — JWT required)
| Method | Endpoint                        | Purpose                  |
|--------|---------------------------------|--------------------------|
| GET    | /api/reports/summary/:carId     | Dashboard stats          |
| GET    | /api/reports/yearly/:carId      | Yearly breakdown         |
| GET    | /api/reports/monthly/:carId     | Monthly spend chart      |
| GET    | /api/reports/stations/:carId    | Top fuel stations        |

### JWT Usage
```
All protected routes require this header:
Authorization: Bearer <jwt_token>

Token is stored in: localStorage.getItem('fl_token')
Token expires: 7 days
```

---

## Frontend Structure

```
fuellog-frontend/src/
├── App.tsx                    ← Main app, loads data from API
├── main.tsx                   ← React entry point
├── styles/global.css          ← All CSS (themes, layout, components)
├── types/index.ts             ← TypeScript interfaces
├── utils/
│   ├── api.ts                 ← Central API helper (all fetch calls)
│   ├── storage.ts             ← localStorage keys only
│   ├── units.ts               ← IN/US unit system logic
│   ├── chartSetup.ts          ← Chart.js registration
│   └── seedData.ts            ← Baleno sample data (legacy, not used)
└── components/
    ├── Login.tsx              ← Email + password login → calls API
    ├── SignUp.tsx             ← New signup form → calls API
    ├── VerifyEmail.tsx        ← Check inbox screen + resend
    ├── Header.tsx             ← Top bar with theme picker + logout
    ├── Nav.tsx                ← Page navigation tabs
    ├── Toast.tsx              ← Notification toasts
    ├── NewCarModal.tsx        ← Add car modal
    ├── DeleteModal.tsx        ← Confirm delete modal
    ├── Dashboard.tsx          ← Stats + 4 charts (reads from data prop)
    ├── Entries.tsx            ← Fuel log table + pagination
    ├── AddEntry.tsx           ← Add/edit fuel entry → calls API
    ├── Service.tsx            ← Service form + history → calls API
    ├── Reports.tsx            ← Yearly reports + top stations
    └── Cars.tsx               ← Car cards + set active
```

---

## Backend Structure

```
fuellog-backend/
├── .env                       ← DB + Gmail secrets (not in GitHub)
├── .gitignore                 ← ignores node_modules + .env
├── package.json
├── server.js                  ← Express entry point
├── middleware/
│   └── auth.js                ← JWT verification middleware
└── routes/
    ├── auth.js                ← signup, verify, login, resend
    ├── cars.js                ← car CRUD filtered by user_id
    ├── fuel.js                ← fuel entries CRUD filtered by user_id
    ├── service.js             ← service entries CRUD filtered by user_id
    └── reports.js             ← summary, yearly, monthly, stations
```

---

## Key Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| Auth method | JWT token | Stateless, simple |
| Password storage | bcrypt (10 rounds) | Industry standard |
| Email service | Gmail SMTP | Simple for personal use |
| User identifier | Email address | No separate username needed |
| Token storage | localStorage | Simple for personal app |
| Data isolation | user_id on all tables | Each user sees only their data |
| New user garage | Empty (no sample data) | Clean start for new users |
| Existing Baleno data | Assigned to first user | Preserved historical data |

---

## Authentication Flow

```
SIGNUP:
User fills email + password
→ POST /api/auth/signup
→ bcrypt hash password
→ Save user (status: pending)
→ Generate UUID token
→ Send verification email via Gmail
→ Show VerifyEmail screen

VERIFY:
User clicks email link
→ Browser opens localhost:5173?token=xxx
→ App detects token in URL
→ GET /api/auth/verify?token=xxx
→ Update status to 'verified'
→ Clear verify_token in DB
→ Show success toast
→ Redirect to login

LOGIN:
User enters email + password
→ POST /api/auth/login
→ Check status = 'verified'
→ bcrypt.compare password
→ Generate JWT (7 day expiry)
→ Store token in localStorage
→ Load all user data from API
→ Show Dashboard
```

---

## Data Flow

```
Frontend (React)
    ↓ Uses api.ts helper
    ↓ Attaches JWT token automatically
    ↓ HTTP requests
Express API (Node.js)
    ↓ auth middleware verifies JWT
    ↓ Extracts user_id from token
    ↓ All queries filtered by user_id
PostgreSQL Database
    ↓ Returns only user's data
```

---

## Themes Available
dark | light | ocean | forest | sunset
Stored in: localStorage.getItem('fuellog_theme')

---

## Pages / Navigation
dashboard | entries | addEntry | service | reports | cars

---

## Sample Data
- Car: Maruti Baleno (id: 'baleno', country: 'IN')
- 289 fuel entries (2016–2025)
- 35 service entries (2016–2025)
- Assigned to first registered user

---

## Pending / Future Enhancements
- [ ] Forgot password / reset via email
- [ ] Resend verification link on Login page
- [ ] Deploy to production (Railway or Render)
- [ ] Mobile responsive improvements
- [ ] Export data as PDF report
- [ ] Push notifications for service reminders

---

## Environment Variables Required (.env)
```
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=Sathish
DB_USER=<postgres username>
DB_PASSWORD=<postgres password>
JWT_SECRET=<any long random string>
GMAIL_USER=<gmail address>
GMAIL_APP_PASSWORD=<16 char app password>
FRONTEND_URL=http://localhost:5173
```
