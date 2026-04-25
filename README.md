# Pitham Consultation

Spiritual consultation platform by **Shri Mayuresh Guruji Vispute**.  
Built with **Next.js 16** + **FastAPI** + **MySQL**.

## Tech Stack

| Layer        | Technology                                     |
| ------------ | ---------------------------------------------- |
| **Frontend** | Next.js 16, React 19, TypeScript, MUI v9       |
| **Backend**  | FastAPI, SQLAlchemy 2.0, Python 3.12+          |
| **Database** | MySQL (pymysql) / SQLite (dev)                 |
| **Payment**  | PhonePe Standard Checkout SDK                  |
| **Auth**     | JWT + Google OAuth + reCAPTCHA                 |
| **Email**    | Gmail SMTP                                     |
| **Video**    | Zoom Server-to-Server OAuth                    |
| **Charts**   | Recharts                                       |
| **i18n**     | Custom React Context (English, Hindi, Marathi) |

## Project Structure

```
pitham-consultation/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Homepage
│   ├── login/                  # Login page
│   ├── register/               # Registration page
│   ├── forgot-password/        # Password reset
│   ├── about/                  # About Guruji
│   ├── contact/                # Contact page with map
│   ├── terms/                  # Terms & Conditions
│   ├── privacy/                # Privacy Policy
│   ├── dashboard/              # User pages
│   │   ├── page.tsx            # User dashboard
│   │   ├── book-appointment/   # Book consultation (2-step: T&C + form)
│   │   ├── history/            # My consultations + timeline
│   │   ├── documents/          # Sadhna documents
│   │   ├── queries/            # Ask Guruji
│   │   └── profile/            # Edit profile
│   ├── admin/                  # Admin pages
│   │   ├── page.tsx            # Analytics dashboard (charts + stats)
│   │   ├── appointments/       # Manage consultations
│   │   ├── users/              # User management + role changes
│   │   ├── user-lists/         # Bulk user groups
│   │   ├── calendar/           # Appointment calendar
│   │   ├── documents/          # Sadhna doc gallery + assign
│   │   ├── recordings/         # Video recordings (bulk assign)
│   │   ├── queries/            # Reply to queries
│   │   └── settings/           # All settings (8 tabs)
│   └── appointments/
│       └── payment-status/     # PhonePe redirect page
│
├── components/                 # Shared UI components
│   ├── Navbar.tsx              # Navigation (role-aware, dark mode, i18n)
│   ├── Footer.tsx              # Global footer (social links from settings)
│   ├── ProfileCompleteCheck.tsx# Popup for incomplete profiles
│   ├── CookieConsent.tsx       # GDPR cookie banner
│   ├── SessionTimeout.tsx      # Auto-logout after 30min
│   ├── ErrorBoundary.tsx       # React error boundary
│   ├── AdminCharts.tsx         # Recharts wrappers
│   └── Captcha.tsx             # reCAPTCHA v2
│
├── services/
│   ├── api.ts                  # All API functions (grouped by section)
│   └── config.ts               # API_BASE, fileUrl, token helpers
│
├── i18n/
│   ├── messages.ts             # Translations (en, hi, mr ~1500 keys)
│   └── I18nProvider.tsx        # Translation context + t() hook
│
├── theme/
│   ├── theme.ts                # Light + dark MUI themes
│   ├── ThemeContext.tsx         # Dark mode toggle
│   ├── ThemeRegistry.tsx       # Provider wrapper
│   ├── colors.ts               # Brand palette (saffron, gold, maroon)
│   └── sharedStyles.ts         # Status chip colors
│
├── lib/
│   └── timeSlots.ts            # 9AM-7:30PM slots
│
├── middleware.ts               # Route protection + security headers
│
├── backend/
│   ├── main.py                 # FastAPI entry (CORS, security, routers)
│   ├── database.py             # SQLAlchemy engine + pooling
│   ├── models.py               # All DB models (User, Appointment, etc.)
│   ├── schemas.py              # Pydantic schemas
│   ├── routers/
│   │   ├── auth.py             # Auth (register, login, Google, profile, verify email, reset password)
│   │   ├── appointments.py     # Appointments (book, cancel, slot, complete, receipts, invoices)
│   │   ├── users.py            # Admin: users + role management
│   │   ├── documents.py        # Documents: gallery, assign, bulk
│   │   ├── recordings.py       # Recordings: bulk assign to lists
│   │   ├── queries.py          # User queries + admin replies
│   │   ├── user_lists.py       # User groups
│   │   ├── payments.py         # PhonePe: initiate, status, callback
│   │   ├── settings.py         # Site settings + approval queue
│   │   ├── analytics.py        # Dashboard analytics data
│   │   └── admin_tools.py      # Audit log, search, export, reminders
│   └── utils/
│       ├── auth.py             # JWT + bcrypt + role decorators
│       ├── email.py            # SMTP with branded templates
│       ├── zoom.py             # Zoom meeting API
│       ├── phonepe.py          # PhonePe SDK
│       ├── audit.py            # Audit log writer
│       ├── pdf_receipt.py      # Booking receipt PDF
│       └── pdf_invoice.py      # CA invoice PDF
│
└── public/
    ├── manifest.json           # PWA config
    ├── robots.txt              # SEO
    └── guruji.png              # Guruji photo
```

## Roles

| Role            | DB Value    | Access                                                         |
| --------------- | ----------- | -------------------------------------------------------------- |
| **Super Admin** | `admin`     | Full access to everything                                      |
| **Moderator**   | `moderator` | All except: audit log, export, invoices. Fee/T&C need approval |
| **User**        | `user`      | Dashboard, book, history, documents, queries, profile          |

## Setup

### Backend

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate          # Windows
pip install -r requirements.txt
cp .env.example .env            # Edit with your credentials
uvicorn main:app --reload
```

### Frontend

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

### Database

Tables auto-create on first start. For schema changes in production, run ALTER TABLE statements.

## Environment Variables

See `backend/.env.example` and `.env.local.example`.

## Key Integrations

| Service          | Setup                                                |
| ---------------- | ---------------------------------------------------- |
| **PhonePe**      | Get client_id + client_secret from PhonePe dashboard |
| **Google OAuth** | Create OAuth Client at Google Cloud Console          |
| **Zoom**         | Create Server-to-Server app at Zoom Marketplace      |
| **Gmail SMTP**   | Enable 2FA → generate App Password                   |
| **reCAPTCHA**    | Register at google.com/recaptcha (v2 checkbox)       |
