# QSO Logbook

[![GitHub stars](https://img.shields.io/github/stars/mcxgjkh/qso-logbook?style=social)](https://github.com/mcxgjkh/qso-logbook)
[![GitHub forks](https://img.shields.io/github/forks/mcxgjkh/qso-logbook?style=social)](https://github.com/mcxgjkh/qso-logbook)
[![License](https://img.shields.io/badge/License-AGPLv3-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14+-000000?logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase)](https://supabase.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?logo=vercel)](https://vercel.com)

## Please choose a language you can understand:
[中文](#中文版本) | 
[English](#english-version)

## English Version

### Overview

**QSO Logbook** is a production‑ready, cloud‑native web application designed for amateur radio operators who need a secure, reliable, and feature‑rich system to manage their QSO (contact) logs. Built with modern web technologies, it leverages Next.js (App Router) on the frontend, Supabase (PostgreSQL) as the database, and is deployed on Vercel for global availability. The system implements strict role‑based access control (RBAC) – only users with `admin` or `dev` roles can access the logbook module, while ordinary `user` accounts are denied access entirely.

Beyond basic CRUD operations, the application provides ADIF import/export, seamless integration with ARRL`s Logbook of The World (LoTW) via automated GitHub Actions, and a comprehensive set of RESTful APIs that enable external software (such as WSJT‑X, N1MM Logger, and custom automation scripts) to push QSOs directly. Additional features include advanced filtering, visual statistics, duplicate detection, Maidenhead grid distance calculation, and award tracking (DXCC, IOTA, SOTA, POTA, WWFF). The entire system is hardened against common web attacks with security headers, CSRF tokens, and Row‑Level Security (RLS) policies in the database.

---

### Key Features

| Feature Area | Description |
|--------------|-------------|
| **Role‑Based Access** | Only `admin` and `dev` roles can access logs; `user` role is blocked at middleware and RLS levels. |
| **Full CRUD Operations** | Create, read, update, and delete QSO records with rich field sets following ADIF 3.1.4 standards. |
| **Advanced Filtering** | Filter logs by call sign, band, mode, date range, QSL status, LoTW upload status, and more. |
| **ADIF Import/Export** | Batch import from standard `.adi` files (auto‑deduplication) and export filtered data to ADIF. |
| **LoTW Integration** | One‑click manual upload and scheduled automated upload via GitHub Actions (using TQSL CLI). |
| **RESTful API** | Expose endpoints for querying, adding, updating, and deleting logs – ideal for third‑party integrations. |
| **Statistics Dashboard** | Visual cards showing total QSOs, monthly counts, unique callsigns, and LoTW pending items. |
| **Propagation Data** | Display current solar indices (SFI, A‑index, K‑index) and MUF predictions (optional integration). |
| **Grid Locator & Distance** | Calculate distances and show great‑circle paths based on Maidenhead locators. |
| **Award Progress** | Track DXCC, IOTA, SOTA, POTA, and WWFF achievements automatically. |
| **Batch Operations** | Bulk update QSL status, bulk delete, and bulk mark for LoTW upload. |
| **Audit Trail** | All user actions are logged for accountability and recovery purposes. |
| **Dark Mode** | Supports light/dark theme toggle for comfortable operation in any environment. |
| **Mobile‑Responsive** | Fully responsive UI that works on desktop, tablet, and smartphone. |

---

### Architecture

The application follows a **modern full‑stack architecture** with clear separation of concerns:

- **Frontend Layer:** Next.js 14+ with App Router – uses React Server Components for initial rendering and client‑side interactivity for dynamic features. Styles are built with Tailwind CSS.
- **Backend Layer:** Next.js API Routes (serverless functions) handle all business logic, authentication validation, and external service calls.
- **Database Layer:** Supabase PostgreSQL with Row‑Level Security (RLS) ensures data isolation. All queries are parameterized to prevent SQL injection.
- **Authentication:** Supabase Auth manages user sessions via secure HTTP‑only cookies. The middleware validates sessions and role permissions on every request.
- **External Integrations:**
  - **QRZ.com / HamQTH:** Optional API calls for auto‑completing call sign information.
  - **LoTW:** TQSL command‑line tool executed either manually via the UI (triggered by the API) or automatically via GitHub Actions.
  - **DX Cluster:** Real‑time spot feeds can be consumed (optional).
- **Deployment:** Vercel provides edge‑cached static assets and serverless functions. Environment secrets are stored securely.
- **CI/CD:** GitHub Actions handles automated LoTW uploads on a cron schedule and can also run database migrations.

---

### Database Schema

The core data model consists of two primary tables (plus auxiliary tables for extended features). Below is a detailed description.

#### Table: `qso_logs`

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key, auto‑increment |
| `user_id` | UUID | Foreign key to `auth.users`; sets ownership |
| `call_sign` | VARCHAR(20) | **Required** – callsign of the other station |
| `qso_date` | DATE | **Required** – UTC date of contact (ADIF format) |
| `time_on` | TIME | **Required** – UTC start time |
| `time_off` | TIME | UTC end time |
| `band`, `band_rx` | VARCHAR(10) | Frequency band (e.g., `20m`, `40m`) |
| `frequency`, `freq_rx` | NUMERIC(10,4) | Frequency in MHz |
| `mode`, `sub_mode` | VARCHAR(10) | Operating mode (e.g., `SSB`, `CW`, `FT8`) |
| `rst_sent`, `rst_rcvd` | VARCHAR(3) | Signal report (e.g., `599`) |
| `qsl_sent`, `qsl_rcvd` | CHAR(1) | QSL status: `Y` (sent/received), `N` (no), `R` (requested) |
| `qsl_sent_via`, `qsl_rcvd_via` | VARCHAR(10) | QSL routing: `B` (bureau), `D` (direct), `E` (electronic) |
| `operator`, `station_callsign` | VARCHAR(20) | Operator and station call (for multi‑op) |
| `country`, `my_country` | VARCHAR(50) | Country names |
| `cqz`, `itu_z` | INTEGER | CQ and ITU zones |
| `iota`, `sota`, `wwff`, `pota` | VARCHAR(20) | Island/Summit/Parks/WWFF references |
| `comment` | TEXT | Free‑form notes |
| `contest_id` | VARCHAR(50) | Contest identifier |
| `uploaded_to_lotw` | BOOLEAN | Default false; true when confirmed uploaded to LoTW |
| `lotw_upload_date` | TIMESTAMPTZ | Timestamp of successful LoTW upload |
| `adif_record_id` | VARCHAR(50) | Optional external ID for deduplication |
| `imported_from_adif` | BOOLEAN | Marks records created via ADIF batch import |
| `metadata` | JSONB | Flexible storage for future or custom fields |
| `created_at`, `updated_at` | TIMESTAMPTZ | Auto‑managed timestamps |

#### Table: `lotw_upload_history`

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key |
| `user_id` | UUID | Owner of the upload batch |
| `file_name` | VARCHAR(255) | Generated ADIF filename |
| `record_count` | INTEGER | Number of QSOs included |
| `uploaded_at` | TIMESTAMPTZ | Upload timestamp (auto default now) |
| `status` | VARCHAR(20) | `pending`, `success`, `failed` |
| `error_message` | TEXT | Error details if any |
| `tqsl_output` | TEXT | Captured stdout/stderr from TQSL |

#### Auxiliary Tables (extendable)
- `dxcc_entities` – for award tracking (prefix, country, CQ/ITU zones).
- `qso_tags` and `qso_tag_relations` – many‑to‑many tagging of QSOs.

**RLS Policies:**  
All tables are protected by Row‑Level Security. The main policy ensures that:
- A user can only access rows where `user_id = auth.uid()`.
- The user must have a role `admin` or `dev` in the `user_roles` table (checked via subquery).
- The `lotw_upload_history` policy is similarly restricted.

---

### API Endpoints (Overview)

All API routes are prefixed with `/api/qso/` and require a valid Supabase session (cookie or Bearer token). The endpoints return JSON and support common HTTP methods.

#### Public Endpoints (require authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/qso/logs` | List QSOs with pagination and filtering |
| POST | `/api/qso/logs` | Create a single QSO |
| GET | `/api/qso/logs/[id]` | Retrieve a single QSO |
| PUT | `/api/qso/logs/[id]` | Update a QSO |
| DELETE | `/api/qso/logs/[id]` | Delete a single QSO |
| DELETE | `/api/qso/logs/batch` | Batch delete (send list of IDs) |
| GET | `/api/qso/export/adif` | Export QSOs as ADIF (with same filters) |
| POST | `/api/qso/upload/lotw` | Trigger manual LoTW upload (generates ADIF and queues) |
| GET | `/api/qso/upload/lotw/history` | View upload history for the user |
| GET | `/api/qso/stats` | Aggregate statistics (totals, monthly, pending, etc.) |
| GET | `/api/qso/qrz` | Query QRZ.com or HamQTH for callsign data (if configured) |

All endpoints enforce that the requestor can only access their own data. Input validation is performed server‑side to ensure ADIF compliance.

---

### Environment Variables

Create a `.env.local` file in the project root with the following variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (e.g., `https://xxxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key (for client‑side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (used only in serverless functions and GitHub Actions) |
| `QRZ_API_KEY` | *(Optional)* API key for QRZ.com XML subscription |
| `TQSL_CONFIG_BASE64` | *(Optional)* Base64‑encoded TQSL configuration directory (used in GH Actions) |

---

### Getting Started (Development)

1. **Clone the repository**
   ```bash
   git clone https://github.com/mcxgjkh/qso-logbook.git
   cd qso-logbook
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
- Create a new Supabase project.
- Run the provided SQL migration scripts to create tables, indexes, and RLS policies.
- Ensure the `user_roles` table exists with roles `admin`, `dev`, `user` and that your user has the appropriate role.

4. **Configure environment**
- Copy `.env.example` to `.env.local` and fill in your Supabase credentials.

5. **Run development server**
   ```bash
   npm run dev
   ```
The app will be available at `http://localhost:3000`.

6. **Login**
- Use the Supabase Auth login page; after successful authentication, the middleware will check your role and grant access if you are `admin` or `dev`.

---

### Deployment to Vercel

1. Push your code to a GitHub repository.
2. Import the repository into Vercel.
3. Add the required environment variables in the Vercel dashboard.
4. Deploy – the platform will automatically detect Next.js and build the application.
5. Configure a custom domain (optional).

---

### CI/CD & Automated LoTW Uploads

The repository includes a GitHub Actions workflow (`.github/workflows/lotw-upload.yml`) that runs on a schedule (e.g., daily at 02:00 UTC). The workflow:
- Installs TQSL (Trusted QSL) via apt‑get.
- Retrieves pending QSOs (those not yet uploaded) from your Supabase database using the service role key.
- Generates an ADIF file from the pending records.
- Signs the ADIF with your TQSL certificate (stored as a GitHub secret) and uploads directly to ARRL LoTW.
- After successful upload, it calls back to your API to mark those QSOs as `uploaded_to_lotw = true` and records the history.

This eliminates the need for manual intervention and ensures your LoTW records stay current.

---

### Additional Features (Roadmap)

The following advanced features are planned or partially implemented:

- **DX Cluster Integration** – real‑time spotting feed with one‑click QSO logging.
- **Satellite and Repeater Support** – dedicated fields for satellite name and repeater details.
- **Eyeball QSOs** – log face‑to‑face meetings with other hams.
- **Cabrillo Export** – for contest submissions.
- **WSJT‑X Auto‑Import** – watch the log file and automatically add FT8/FT4 contacts.
- **CAT Control** – read frequency and mode directly from your rig (via Hamlib/OmniRig).
- **Propagation Forecast** – show MUF, grey‑line, and NOAA space weather charts.
- **Public Logbook** – a read‑only page to share recent QSOs (with privacy controls).

---

### Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m `Add some feature``).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a Pull Request.

Please ensure your code adheres to the existing style and includes appropriate tests (if any). For major changes, open an issue first to discuss what you would like to change.

---

### License

<div width="100%" style="overflow-x: auto;">
    <svg xmlns="https://www.w3.org/2000/svg" viewBox="280 50 260 100" width="100%" height="100%">
        <g id="g227" transform="translate(3.4383843,-105.21456)">
            <g id="g229">
            <path d="M 327.207,217.253 L 324.239,212.509 L 307.093,212.509 L 304.072,217.253 L 300.308,217.253 C 301.492,215.328 302.698,213.375 303.925,211.397 C 305.154,209.418 306.359,207.475 307.542,205.567 C 308.726,203.659 309.875,201.813 310.987,200.028 C 312.1,198.243 313.151,196.565 314.141,194.992 C 314.423,194.391 314.918,194.091 315.625,194.091 C 316.277,194.091 316.764,194.391 317.082,194.992 L 330.994,217.253 L 327.207,217.253 z M 309.133,209.223 L 322.146,209.223 L 316.183,199.656 C 315.989,199.338 315.812,199.179 315.653,199.179 C 315.476,199.179 315.299,199.338 315.124,199.656 L 309.133,209.223 z" id="path231"/>
            <path d="M 360.65,215.743 C 359.379,216.75 357.841,217.253 356.039,217.253 L 340.033,217.253 C 338.213,217.253 336.693,216.758 335.474,215.769 C 334.166,214.745 333.513,213.481 333.513,211.979 L 333.513,199.364 C 333.513,197.898 334.166,196.644 335.474,195.601 C 336.746,194.594 338.284,194.091 340.085,194.091 L 356.118,194.091 C 357.796,194.091 359.219,194.559 360.385,195.496 C 361.605,196.433 362.39,197.908 362.743,199.921 L 359.483,199.921 C 359.254,198.949 358.821,198.269 358.185,197.88 C 357.637,197.545 356.939,197.377 356.09,197.377 L 340.084,197.377 C 339.13,197.377 338.317,197.598 337.646,198.04 C 337.062,198.411 336.771,198.853 336.771,199.365 L 336.771,211.98 C 336.771,212.51 337.062,212.97 337.646,213.358 L 337.619,213.332 C 338.273,213.773 339.077,213.994 340.031,213.994 L 356.037,213.994 C 356.867,213.994 357.609,213.818 358.264,213.464 C 359.041,213.093 359.43,212.589 359.43,211.953 L 359.43,207.315 L 346.471,207.315 L 346.471,204.055 L 362.663,204.055 L 362.663,211.979 C 362.665,213.446 361.993,214.7 360.65,215.743 z" id="path233"/>
            <path d="M 394.863,205.805 C 393.644,206.795 392.115,207.289 390.278,207.289 L 370.959,207.289 L 370.959,217.253 L 367.7,217.253 L 367.7,199.365 C 367.7,197.899 368.353,196.645 369.661,195.602 C 370.933,194.595 372.471,194.092 374.271,194.092 L 390.278,194.092 C 392.062,194.092 393.582,194.595 394.837,195.602 C 396.162,196.645 396.824,197.899 396.824,199.365 L 396.824,202.015 C 396.824,203.517 396.171,204.78 394.863,205.805 z M 393.592,199.365 C 393.592,198.87 393.291,198.429 392.69,198.04 C 392.019,197.598 391.215,197.377 390.279,197.377 L 374.247,197.377 C 373.434,197.377 372.7,197.545 372.048,197.88 C 371.322,198.216 370.96,198.711 370.96,199.364 L 370.96,204.029 L 390.279,204.029 C 391.216,204.029 392.019,203.817 392.69,203.393 C 393.292,203.005 393.592,202.545 393.592,202.015 L 393.592,199.365 z" id="path235"/>
            <path d="M 430.983,212.085 C 430.717,213.658 429.976,214.921 428.756,215.875 C 427.572,216.794 426.142,217.253 424.463,217.253 L 408.43,217.253 C 406.628,217.253 405.1,216.758 403.846,215.769 C 402.521,214.745 401.859,213.481 401.859,211.979 L 401.859,194.117 L 405.171,194.117 L 405.171,211.979 C 405.171,212.509 405.463,212.969 406.046,213.357 L 406.019,213.331 C 406.673,213.772 407.477,213.993 408.431,213.993 L 424.464,213.993 C 425.277,213.993 425.984,213.817 426.584,213.463 L 426.559,213.463 C 427.195,213.074 427.626,212.412 427.857,211.476 L 430.454,211.476 L 430.983,212.085 z" id="path237"/>
            </g>         
            <g id="g239">
            <g id="g241">
                <path d="M 483.223,164.577 L 502.677,164.577 L 472.709,215.077 C 470.997,217.892 469.327,220.058 467.699,221.576 C 466.071,223.094 464.567,224.198 463.187,224.887 C 461.808,225.578 460.621,225.978 459.628,226.088 C 458.634,226.199 457.942,226.254 457.558,226.254 L 439.676,226.254 L 439.676,182.626 L 456.4,182.626 L 456.482,212.594 L 483.223,164.577 z" id="path243" style="fill:#742e68"/>
            </g>
            </g>
            <g id="g245">
            <rect x="291.90399" y="226.25301" width="147.772" height="14.173" id="rect247" style="fill:#742e68"/>
            <g id="g249">
                <path d="M 332.526,231.774 C 332.562,231.525 332.52,231.353 332.395,231.258 L 332.402,231.258 C 332.288,231.172 332.124,231.129 331.905,231.129 L 327.807,231.129 C 327.563,231.129 327.336,231.185 327.127,231.298 C 326.943,231.394 326.827,231.506 326.779,231.638 L 326.344,232.834 L 329.368,232.834 L 329.063,233.67 L 326.038,233.67 L 325.108,236.225 L 324.265,236.225 L 325.935,231.638 C 326.071,231.263 326.358,230.94 326.789,230.673 C 327.209,230.416 327.65,230.286 328.111,230.286 L 332.209,230.286 C 332.645,230.286 332.967,230.407 333.18,230.646 C 333.414,230.886 333.479,231.262 333.375,231.774 L 332.526,231.774 L 332.526,231.774 z" id="path251" style="fill:#ffffff"/>
                <path d="M 338.577,233.377 C 338.594,233.142 338.522,232.981 338.364,232.895 C 338.305,232.859 338.239,232.833 338.165,232.82 C 338.089,232.807 338.011,232.8 337.931,232.8 L 335.952,232.8 C 335.753,232.8 335.556,232.838 335.36,232.916 C 335.133,233.002 334.997,233.11 334.95,233.242 L 333.864,236.225 L 333.02,236.225 L 334.571,231.964 L 335.415,231.964 L 335.351,232.14 C 335.518,232.077 335.673,232.032 335.818,232.004 C 335.961,231.977 336.105,231.963 336.252,231.963 L 338.236,231.963 C 338.611,231.963 338.919,232.058 339.158,232.248 C 339.445,232.479 339.529,232.855 339.413,233.376 L 338.577,233.376 L 338.577,233.377 z" id="path253" style="fill:#ffffff"/>
                <path d="M 346.078,233.228 C 345.934,233.623 345.622,233.946 345.14,234.2 C 344.744,234.408 344.339,234.512 343.933,234.512 L 341.954,234.512 C 341.823,234.512 341.701,234.502 341.586,234.479 C 341.472,234.457 341.333,234.414 341.171,234.35 L 340.964,234.92 L 340.958,234.934 C 340.929,235.052 340.999,235.159 341.169,235.254 C 341.241,235.304 341.317,235.338 341.396,235.36 C 341.474,235.38 341.555,235.39 341.636,235.39 L 343.615,235.39 C 343.695,235.39 343.778,235.383 343.862,235.37 C 343.947,235.356 344.031,235.33 344.117,235.295 C 344.338,235.208 344.526,235.047 344.68,234.812 L 345.515,234.812 C 345.255,235.328 344.898,235.702 344.442,235.934 C 344.068,236.128 343.691,236.226 343.31,236.226 L 341.331,236.226 C 340.95,236.226 340.632,236.127 340.374,235.927 C 340.052,235.677 339.965,235.349 340.112,234.942 L 340.733,233.236 C 340.88,232.832 341.186,232.511 341.649,232.27 C 342.04,232.066 342.451,231.965 342.881,231.965 L 344.86,231.965 C 345.276,231.965 345.608,232.062 345.854,232.257 C 346.152,232.497 346.228,232.82 346.078,233.228 z M 345.229,233.242 C 345.27,233.134 345.229,233.038 345.11,232.957 C 344.98,232.853 344.793,232.801 344.548,232.801 L 342.576,232.801 C 342.404,232.801 342.209,232.839 341.991,232.917 C 341.762,232.999 341.624,233.105 341.576,233.236 C 341.529,233.362 341.588,233.469 341.752,233.555 C 341.898,233.637 342.068,233.677 342.258,233.677 L 344.237,233.677 C 344.471,233.677 344.693,233.628 344.902,233.528 C 345.081,233.446 345.19,233.351 345.229,233.242 z" id="path255" style="fill:#ffffff"/>
                <path d="M 352.712,233.228 C 352.567,233.623 352.255,233.946 351.774,234.2 C 351.377,234.408 350.973,234.512 350.566,234.512 L 348.588,234.512 C 348.456,234.512 348.335,234.502 348.22,234.479 C 348.106,234.457 347.967,234.414 347.806,234.35 L 347.597,234.92 L 347.593,234.934 C 347.563,235.052 347.632,235.159 347.802,235.254 C 347.874,235.304 347.95,235.338 348.029,235.36 C 348.108,235.38 348.189,235.39 348.269,235.39 L 350.248,235.39 C 350.328,235.39 350.412,235.383 350.496,235.37 C 350.58,235.356 350.666,235.33 350.751,235.295 C 350.973,235.208 351.16,235.047 351.314,234.812 L 352.148,234.812 C 351.888,235.328 351.531,235.702 351.076,235.934 C 350.701,236.128 350.324,236.226 349.943,236.226 L 347.964,236.226 C 347.584,236.226 347.265,236.127 347.007,235.927 C 346.685,235.677 346.599,235.349 346.747,234.942 L 347.367,233.236 C 347.514,232.832 347.819,232.511 348.284,232.27 C 348.674,232.066 349.085,231.965 349.514,231.965 L 351.493,231.965 C 351.909,231.965 352.241,232.062 352.487,232.257 C 352.786,232.497 352.86,232.82 352.712,233.228 z M 351.864,233.242 C 351.903,233.134 351.862,233.038 351.743,232.957 C 351.614,232.853 351.427,232.801 351.182,232.801 L 349.21,232.801 C 349.038,232.801 348.842,232.839 348.625,232.917 C 348.396,232.999 348.258,233.105 348.209,233.236 C 348.164,233.362 348.223,233.469 348.385,233.555 C 348.532,233.637 348.701,233.677 348.891,233.677 L 350.87,233.677 C 351.104,233.677 351.327,233.628 351.536,233.528 C 351.715,233.446 351.823,233.351 351.864,233.242 z" id="path257" style="fill:#ffffff"/>
                <path d="M 365.452,235.845 C 365.048,236.098 364.612,236.225 364.145,236.225 L 360.034,236.225 C 359.602,236.225 359.28,236.109 359.065,235.878 C 358.835,235.629 358.77,235.249 358.87,234.737 L 359.706,234.737 C 359.677,234.977 359.723,235.149 359.844,235.253 L 359.837,235.253 C 359.958,235.343 360.126,235.389 360.338,235.389 L 364.45,235.389 C 364.689,235.389 364.914,235.332 365.122,235.22 C 365.312,235.119 365.432,235.005 365.479,234.873 L 365.727,234.193 C 365.774,234.062 365.739,233.946 365.622,233.846 C 365.497,233.733 365.309,233.676 365.065,233.676 L 360.961,233.676 C 360.499,233.676 360.153,233.55 359.925,233.296 C 359.681,233.032 359.628,232.708 359.771,232.317 L 360.019,231.637 C 360.155,231.262 360.441,230.939 360.873,230.672 C 361.293,230.415 361.734,230.285 362.195,230.285 L 366.308,230.285 C 366.738,230.285 367.058,230.406 367.27,230.645 C 367.504,230.885 367.57,231.261 367.464,231.773 L 366.629,231.773 C 366.657,231.533 366.61,231.36 366.489,231.257 L 366.496,231.257 C 366.384,231.171 366.218,231.128 366.001,231.128 L 361.889,231.128 C 361.644,231.128 361.415,231.184 361.202,231.297 C 361.016,231.393 360.901,231.505 360.854,231.637 L 360.606,232.317 C 360.556,232.453 360.588,232.571 360.702,232.671 C 360.828,232.784 361.016,232.84 361.265,232.84 L 365.377,232.84 C 365.843,232.84 366.188,232.967 366.406,233.221 C 366.648,233.488 366.701,233.811 366.562,234.193 L 366.314,234.873 C 366.176,235.258 365.888,235.583 365.452,235.845 z" id="path259" style="fill:#ffffff"/>
                <path d="M 371.985,235.913 C 371.592,236.121 371.189,236.225 370.778,236.225 L 368.8,236.225 C 368.396,236.225 368.07,236.123 367.818,235.92 C 367.513,235.67 367.435,235.343 367.582,234.941 L 368.203,233.235 C 368.348,232.84 368.659,232.517 369.142,232.263 C 369.538,232.055 369.944,231.951 370.355,231.951 L 372.334,231.951 C 372.723,231.951 373.044,232.048 373.295,232.243 C 373.609,232.497 373.695,232.825 373.547,233.228 L 372.924,234.941 C 372.78,235.334 372.468,235.659 371.985,235.913 z M 372.703,233.228 C 372.749,233.101 372.69,232.996 372.528,232.908 C 372.389,232.831 372.221,232.793 372.026,232.793 L 370.047,232.793 C 369.848,232.793 369.654,232.829 369.465,232.901 C 369.233,232.992 369.094,233.1 369.047,233.227 L 368.422,234.947 C 368.375,235.074 368.434,235.18 368.597,235.266 C 368.744,235.347 368.91,235.388 369.097,235.388 L 371.081,235.388 C 371.172,235.388 371.264,235.379 371.363,235.361 C 371.459,235.342 371.558,235.314 371.659,235.272 C 371.891,235.182 372.031,235.071 372.079,234.94 L 372.703,233.228 z" id="path261" style="fill:#ffffff"/>
                <path d="M 375.837,232.8 L 374.59,236.225 L 373.747,236.225 L 375.442,231.563 C 375.588,231.164 375.861,230.845 376.262,230.604 C 376.614,230.396 377.054,230.292 377.584,230.292 L 377.285,231.115 C 376.953,231.164 376.713,231.228 376.562,231.304 C 376.412,231.382 376.32,231.469 376.285,231.563 L 376.139,231.964 L 376.981,231.964 L 376.677,232.8 L 375.837,232.8 z" id="path263" style="fill:#ffffff"/>
                <path d="M 379.655,232.8 L 378.409,236.225 L 377.559,236.225 L 378.805,232.8 L 377.969,232.8 L 378.274,231.964 L 379.11,231.964 L 379.721,230.286 L 380.57,230.286 L 379.96,231.964 L 380.803,231.964 L 380.499,232.8 L 379.655,232.8 z" id="path265" style="fill:#ffffff"/>
                <path d="M 386.091,235.898 C 385.734,236.111 385.329,236.218 384.881,236.218 C 384.637,236.218 384.408,236.183 384.198,236.115 C 383.987,236.047 383.808,235.941 383.661,235.796 C 383.407,235.937 383.144,236.043 382.876,236.115 C 382.607,236.188 382.351,236.224 382.105,236.224 C 381.674,236.224 381.353,236.12 381.139,235.912 C 380.903,235.676 380.86,235.352 381.009,234.94 L 382.092,231.963 L 382.936,231.963 L 381.85,234.946 C 381.803,235.073 381.842,235.176 381.967,235.258 C 382.104,235.344 382.294,235.387 382.538,235.387 C 382.787,235.387 383.008,235.344 383.197,235.258 C 383.383,235.181 383.5,235.075 383.551,234.94 L 384.219,233.105 L 385.062,233.105 L 384.391,234.947 C 384.344,235.079 384.383,235.18 384.512,235.253 C 384.648,235.339 384.833,235.382 385.069,235.382 C 385.323,235.382 385.545,235.339 385.735,235.253 C 385.923,235.176 386.037,235.074 386.083,234.947 L 387.169,231.964 L 388.02,231.964 L 386.937,234.941 C 386.792,235.339 386.509,235.659 386.091,235.898 z" id="path267" style="fill:#ffffff"/>
                <path d="M 392.438,235.92 C 392.042,236.124 391.633,236.225 391.212,236.225 L 389.234,236.225 C 388.808,236.225 388.472,236.126 388.228,235.926 C 387.933,235.69 387.86,235.367 388.011,234.954 C 388.156,234.556 388.467,234.234 388.947,233.989 C 389.343,233.781 389.75,233.676 390.161,233.676 L 392.14,233.676 C 392.267,233.676 392.387,233.689 392.5,233.711 C 392.615,233.733 392.753,233.776 392.915,233.84 L 393.125,233.262 C 393.152,233.14 393.085,233.032 392.925,232.936 C 392.781,232.846 392.626,232.8 392.459,232.8 L 390.48,232.8 C 390.394,232.8 390.309,232.807 390.224,232.82 C 390.14,232.834 390.055,232.86 389.97,232.895 C 389.748,232.981 389.56,233.143 389.407,233.377 L 388.571,233.377 C 388.835,232.861 389.191,232.487 389.638,232.256 C 390.012,232.061 390.391,231.964 390.778,231.964 L 392.761,231.964 C 393.151,231.964 393.471,232.061 393.721,232.256 C 394.039,232.501 394.124,232.829 393.975,233.241 L 393.354,234.947 C 393.209,235.352 392.903,235.675 392.438,235.92 z M 392.511,234.954 C 392.557,234.828 392.499,234.721 392.335,234.635 C 392.189,234.553 392.022,234.512 391.837,234.512 L 389.858,234.512 C 389.627,234.512 389.403,234.563 389.185,234.663 C 389.006,234.744 388.897,234.839 388.857,234.948 C 388.815,235.061 388.852,235.158 388.967,235.24 C 389.104,235.339 389.291,235.389 389.532,235.389 L 391.515,235.389 C 391.71,235.389 391.902,235.353 392.091,235.28 C 392.325,235.19 392.464,235.082 392.511,234.954 z" id="path269" style="fill:#ffffff"/>
                <path d="M 399.738,233.377 C 399.755,233.142 399.684,232.981 399.526,232.895 C 399.466,232.859 399.4,232.833 399.325,232.82 C 399.251,232.807 399.173,232.8 399.092,232.8 L 397.114,232.8 C 396.915,232.8 396.716,232.838 396.52,232.916 C 396.295,233.002 396.159,233.11 396.11,233.242 L 395.024,236.225 L 394.181,236.225 L 395.732,231.964 L 396.575,231.964 L 396.512,232.14 C 396.679,232.077 396.835,232.032 396.979,232.004 C 397.123,231.977 397.267,231.963 397.412,231.963 L 399.396,231.963 C 399.773,231.963 400.08,232.058 400.319,232.248 C 400.606,232.479 400.691,232.855 400.574,233.376 L 399.738,233.376 L 399.738,233.377 z" id="path271" style="fill:#ffffff"/>
                <path d="M 407.239,233.228 C 407.095,233.623 406.783,233.946 406.301,234.2 C 405.903,234.408 405.5,234.512 405.093,234.512 L 403.115,234.512 C 402.982,234.512 402.861,234.502 402.746,234.479 C 402.633,234.457 402.494,234.414 402.332,234.35 L 402.124,234.92 L 402.119,234.934 C 402.09,235.052 402.159,235.159 402.328,235.254 C 402.4,235.304 402.476,235.338 402.555,235.36 C 402.635,235.38 402.715,235.39 402.795,235.39 L 404.774,235.39 C 404.855,235.39 404.938,235.383 405.022,235.37 C 405.107,235.356 405.192,235.33 405.278,235.295 C 405.499,235.208 405.686,235.047 405.841,234.812 L 406.676,234.812 C 406.415,235.328 406.059,235.702 405.603,235.934 C 405.229,236.128 404.851,236.226 404.471,236.226 L 402.492,236.226 C 402.111,236.226 401.792,236.127 401.534,235.927 C 401.212,235.677 401.126,235.349 401.274,234.942 L 401.895,233.236 C 402.041,232.832 402.347,232.511 402.811,232.27 C 403.202,232.066 403.612,231.965 404.042,231.965 L 406.021,231.965 C 406.437,231.965 406.768,232.062 407.015,232.257 C 407.313,232.497 407.388,232.82 407.239,233.228 z M 406.392,233.242 C 406.431,233.134 406.391,233.038 406.271,232.957 C 406.142,232.853 405.955,232.801 405.71,232.801 L 403.739,232.801 C 403.567,232.801 403.371,232.839 403.153,232.917 C 402.924,232.999 402.786,233.105 402.738,233.236 C 402.692,233.362 402.751,233.469 402.914,233.555 C 403.061,233.637 403.229,233.677 403.42,233.677 L 405.398,233.677 C 405.633,233.677 405.855,233.628 406.064,233.528 C 406.243,233.446 406.352,233.351 406.392,233.242 z" id="path273" style="fill:#ffffff"/>
            </g>
            </g>
            <g id="g275">
            <path d="M 517.324,211.954 C 517.324,213.459 516.66,214.725 515.332,215.752 C 514.111,216.744 512.588,217.239 510.764,217.239 L 494.696,217.239 C 493.014,217.239 491.589,216.787 490.421,215.885 C 489.163,214.911 488.366,213.424 488.03,211.423 L 491.298,211.423 C 491.527,212.361 491.952,213.034 492.572,213.442 L 492.546,213.442 C 493.148,213.796 493.864,213.973 494.696,213.973 L 510.764,213.973 C 511.685,213.973 512.482,213.76 513.155,213.335 C 513.757,212.946 514.058,212.485 514.058,211.954 L 514.058,209.298 C 514.058,208.803 513.756,208.36 513.155,207.97 C 512.447,207.51 511.641,207.279 510.739,207.279 L 502.186,207.279 L 502.186,204.012 L 510.764,204.012 C 511.703,204.012 512.5,203.791 513.155,203.348 C 513.757,202.959 514.058,202.507 514.058,201.994 L 514.058,199.338 C 514.058,198.842 513.756,198.4 513.155,198.01 C 512.447,197.55 511.641,197.32 510.739,197.32 L 494.696,197.32 C 493.882,197.32 493.174,197.497 492.572,197.851 L 492.598,197.851 C 491.961,198.223 491.527,198.896 491.297,199.87 L 488.029,199.87 C 488.347,197.851 489.127,196.382 490.367,195.461 C 491.535,194.523 492.978,194.054 494.695,194.054 L 510.763,194.054 C 512.552,194.054 514.075,194.55 515.331,195.541 C 516.659,196.586 517.323,197.852 517.323,199.339 C 517.323,200.631 517.27,201.809 517.164,202.871 C 517.128,203.402 516.952,203.89 516.633,204.332 C 516.491,204.527 516.327,204.73 516.142,204.943 C 515.957,205.156 515.73,205.386 515.464,205.633 C 515.978,206.111 516.367,206.554 516.633,206.961 C 516.934,207.457 517.111,207.935 517.164,208.395 C 517.271,209.44 517.324,210.626 517.324,211.954 z" id="path277"/>
            </g>
        </g>
    </svg>
</div>

This project is licensed under the GNU Affero General Public License version 3.0 – see the `LICENSE` file for details.

---

### Support & Community

- For bugs and feature requests, please use the [GitHub Issues](https://github.com/mcxgjkh/qso-logbook/issues) page.
- For general questions, feel free to start a [Discussion](https://github.com/mcxgjkh/qso-logbook/discussions).
- We also welcome contributions to the documentation.

---

### Acknowledgements

- Built with [Next.js](https://nextjs.org/), [Supabase](https://supabase.io/), and [Tailwind CSS](https://tailwindcss.com/).
- ADIF parsing and generation based on the ADIF 3.1.4 specification.
- LoTW integration leverages the TQSL CLI tool provided by ARRL.
- Special thanks to the amateur radio community for continuous feedback and inspiration.

---

## 中文版本

### 项目概述

**QSO Logbook** 是一个生产级、云原生的业余无线电通联日志管理系统，专为需要安全、可靠且功能丰富的方式来管理 QSO（通联）记录的业余无线电爱好者设计。系统采用现代 Web 技术：前端使用 Next.js（App Router），数据库使用 Supabase（PostgreSQL），部署在 Vercel 上以实现全球快速访问。系统实施了严格的基于角色的访问控制（RBAC）—— 仅具有 `admin` 或 `dev` 角色的用户可以访问日志模块，普通的 `user` 帐户被完全拒绝访问。

除了基本的增删改查操作，应用程序还提供了 ADIF 导入/导出、通过 GitHub Actions 自动化与 ARRL 的 Logbook of The World（LoTW）无缝集成，以及一套全面的 RESTful API，允许外部软件（如 WSJT‑X、N1MM Logger 和自定义自动化脚本）直接推送 QSO。其他功能包括高级筛选、可视化统计、重复检测、梅登黑德网格距离计算和奖状追踪（DXCC、IOTA、SOTA、POTA、WWFF）。整个系统通过安全头、CSRF 令牌和数据库行级安全（RLS）策略加固，抵御常见 Web 攻击。

---

### 主要功能

| 功能领域 | 描述 |
|---------|------|
| **基于角色的访问控制** | 仅 `admin` 和 `dev` 角色可访问日志；`user` 角色在中间件和 RLS 层面被拦截。 |
| **完整 CRUD 操作** | 创建、读取、更新和删除 QSO 记录，字段丰富，遵循 ADIF 3.1.4 标准。 |
| **高级筛选** | 按呼号、波段、模式、日期范围、QSL 状态、LoTW 上传状态等筛选日志。 |
| **ADIF 导入/导出** | 从标准 `.adi` 文件批量导入（自动去重），并将筛选后的数据导出为 ADIF。 |
| **LoTW 集成** | 一键手动上传和通过 GitHub Actions 定时自动上传（使用 TQSL 命令行工具）。 |
| **RESTful API** | 提供查询、新增、更新、删除日志的端点，便于第三方集成。 |
| **统计仪表盘** | 展示总通联数、月通联数、唯一呼号数、待上传 LoTW 数量等可视化卡片。 |
| **传播数据** | 显示实时太阳指数（SFI、A 指数、K 指数）和 MUF 预测（可选集成）。 |
| **网格定位与距离** | 基于梅登黑德网格计算距离并显示大圆路径。 |
| **奖状进度** | 自动追踪 DXCC、IOTA、SOTA、POTA 和 WWFF 的成就进度。 |
| **批量操作** | 批量更新 QSL 状态、批量删除、批量标记 LoTW 上传。 |
| **审计日志** | 记录所有用户操作，便于问责和数据恢复。 |
| **深色模式** | 支持亮/暗主题切换，适应不同环境操作。 |
| **移动响应式** | 完全响应式 UI，在桌面、平板和手机上均能正常使用。 |

---

### 架构设计

应用程序遵循 **现代全栈架构**，关注点明确分离：

- **前端层：** Next.js 14+ 配合 App Router – 使用 React Server Components 进行初始渲染，客户端交互用于动态功能。样式使用 Tailwind CSS 构建。
- **后端层：** Next.js API Routes（无服务器函数）处理所有业务逻辑、认证验证和外部服务调用。
- **数据库层：** Supabase PostgreSQL 配合行级安全（RLS）确保数据隔离。所有查询均使用参数化方式防止 SQL 注入。
- **认证层：** Supabase Auth 通过安全的 HTTP‑only Cookie 管理用户会话。中间件在每个请求中验证会话和角色权限。
- **外部集成：**
- **QRZ.com / HamQTH：** 可选 API 调用，用于自动补全呼号信息。
- **LoTW：** 通过 UI 手动触发（由 API 调用）或通过 GitHub Actions 自动执行 TQSL 命令行工具。
- **DX Cluster：** 可消费实时 spot 数据（可选）。
- **部署：** Vercel 提供边缘缓存的静态资源和无服务器函数。环境密钥安全存储。
- **CI/CD：** GitHub Actions 处理定时 LoTW 自动上传，也可运行数据库迁移。

---

### 数据库结构

核心数据模型由两个主表（以及用于扩展功能的辅助表）组成。详细描述如下。

#### 表：`qso_logs`

| 列名 | 类型 | 描述 |
|------|------|------|
| `id` | BIGSERIAL | 主键，自增 |
| `user_id` | UUID | 外键关联 `auth.users`，确定所有者 |
| `call_sign` | VARCHAR(20) | **必填** – 对方呼号 |
| `qso_date` | DATE | **必填** – 通联 UTC 日期（ADIF 格式） |
| `time_on` | TIME | **必填** – UTC 开始时间 |
| `time_off` | TIME | UTC 结束时间 |
| `band`, `band_rx` | VARCHAR(10) | 频率波段（例如 `20m`, `40m`） |
| `frequency`, `freq_rx` | NUMERIC(10,4) | 频率（MHz） |
| `mode`, `sub_mode` | VARCHAR(10) | 操作模式（例如 `SSB`, `CW`, `FT8`） |
| `rst_sent`, `rst_rcvd` | VARCHAR(3) | 信号报告（例如 `599`） |
| `qsl_sent`, `qsl_rcvd` | CHAR(1) | QSL 状态：`Y`（已发送/已收到），`N`（否），`R`（已请求） |
| `qsl_sent_via`, `qsl_rcvd_via` | VARCHAR(10) | QSL 路由：`B`（管理局），`D`（直邮），`E`（电子） |
| `operator`, `station_callsign` | VARCHAR(20) | 操作员和台站呼号（用于多操作员） |
| `country`, `my_country` | VARCHAR(50) | 国家名称 |
| `cqz`, `itu_z` | INTEGER | CQ 分区和 ITU 分区 |
| `iota`, `sota`, `wwff`, `pota` | VARCHAR(20) | 岛屿/山峰/公园/WWFF 参考编号 |
| `comment` | TEXT | 自由格式备注 |
| `contest_id` | VARCHAR(50) | 竞赛标识符 |
| `uploaded_to_lotw` | BOOLEAN | 默认为 false；确认上传至 LoTW 后变为 true |
| `lotw_upload_date` | TIMESTAMPTZ | 成功上传至 LoTW 的时间戳 |
| `adif_record_id` | VARCHAR(50) | 可选的外部 ID，用于去重 |
| `imported_from_adif` | BOOLEAN | 标记通过 ADIF 批量导入创建的记录 |
| `metadata` | JSONB | 灵活存储未来或自定义字段 |
| `created_at`, `updated_at` | TIMESTAMPTZ | 自动管理的时间戳 |

#### 表：`lotw_upload_history`

| 列名 | 类型 | 描述 |
|------|------|------|
| `id` | BIGSERIAL | 主键 |
| `user_id` | UUID | 上传批次的所有者 |
| `file_name` | VARCHAR(255) | 生成的 ADIF 文件名 |
| `record_count` | INTEGER | 包含的 QSO 数量 |
| `uploaded_at` | TIMESTAMPTZ | 上传时间戳（默认自动设为当前时间） |
| `status` | VARCHAR(20) | `pending`（待处理），`success`（成功），`failed`（失败） |
| `error_message` | TEXT | 错误详情（如有） |
| `tqsl_output` | TEXT | 捕获的 TQSL 标准输出/错误 |

#### 辅助表（可扩展）
- `dxcc_entities` – 用于奖状追踪（前缀、国家、CQ/ITU 分区）。
- `qso_tags` 和 `qso_tag_relations` – QSO 的多对多标签关联。

**RLS 策略：**  
所有表均由行级安全策略保护。主要策略确保：
- 用户只能访问 `user_id = auth.uid()` 的行。
- 用户必须在 `user_roles` 表中具有 `admin` 或 `dev` 角色（通过子查询检查）。
- `lotw_upload_history` 的策略类似。

---

### API 端点概览

所有 API 路由均以 `/api/qso/` 为前缀，并需要有效的 Supabase 会话（Cookie 或 Bearer Token）。端点返回 JSON 格式，支持常见的 HTTP 方法。

#### 公开端点（需认证）

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/qso/logs` | 分页和筛选列出 QSO |
| POST | `/api/qso/logs` | 创建单个 QSO |
| GET | `/api/qso/logs/[id]` | 获取单个 QSO |
| PUT | `/api/qso/logs/[id]` | 更新 QSO |
| DELETE | `/api/qso/logs/[id]` | 删除单个 QSO |
| DELETE | `/api/qso/logs/batch` | 批量删除（发送 ID 列表） |
| GET | `/api/qso/export/adif` | 导出 QSO 为 ADIF（支持相同筛选条件） |
| POST | `/api/qso/upload/lotw` | 触发手动 LoTW 上传（生成 ADIF 并排队） |
| GET | `/api/qso/upload/lotw/history` | 查看用户的上传历史 |
| GET | `/api/qso/stats` | 聚合统计（总数、月统计、待上传等） |
| GET | `/api/qso/qrz` | 查询 QRZ.com 或 HamQTH 获取呼号数据（如已配置） |

所有端点均强制要求请求者只能访问自己的数据。服务端进行输入验证以确保 ADIF 合规性。

---

### 环境变量

在项目根目录下创建 `.env.local` 文件，包含以下变量：

| 变量名 | 描述 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 您的 Supabase 项目 URL（例如 `https://xxxxx.supabase.co`） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 公开匿名密钥（用于客户端） |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色密钥（仅用于无服务器函数和 GitHub Actions） |
| `QRZ_API_KEY` | *(可选)* QRZ.com XML 订阅的 API 密钥 |
| `TQSL_CONFIG_BASE64` | *(可选)* Base64 编码的 TQSL 配置目录（用于 GitHub Actions） |

---

### 开发环境搭建

1. **克隆仓库**
   ```bash
   git clone https://github.com/mcxgjkh/qso-logbook.git
   cd qso-logbook
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **设置 Supabase**
- 创建一个新的 Supabase 项目。
- 运行提供的 SQL 迁移脚本以创建表、索引和 RLS 策略。
- 确保 `user_roles` 表存在且包含 `admin`, `dev`, `user` 角色，并将您的用户分配为适当角色。

4. **配置环境**
- 将 `.env.example` 复制为 `.env.local` 并填写 Supabase 凭证。

5. **运行开发服务器**
   ```bash
   npm run dev
   ```
应用将在 `http://localhost:3000` 运行。

6. **登录**
- 使用 Supabase Auth 登录页面；成功认证后，中间件将检查您的角色，如果为 `admin` 或 `dev` 则授予访问权限。

---

### 部署到 Vercel

1. 将代码推送到 GitHub 仓库。
2. 在 Vercel 中导入该仓库。
3. 在 Vercel 仪表板中添加所需的环境变量。
4. 部署 – 平台将自动检测 Next.js 并构建应用。
5. 配置自定义域名（可选）。

---

### CI/CD 与自动化 LoTW 上传

仓库包含一个 GitHub Actions 工作流（`.github/workflows/lotw-upload.yml`），按计划运行（例如每天 UTC 02:00）。该工作流：
- 通过 apt‑get 安装 TQSL。
- 使用服务角色密钥从 Supabase 数据库检索待上传的 QSO（尚未上传的记录）。
- 从待上传记录生成 ADIF 文件。
- 使用您的 TQSL 证书（以 GitHub Secret 存储）对 ADIF 签名，并直接上传至 ARRL LoTW。
- 上传成功后，回调您的 API 将这些 QSO 标记为 `uploaded_to_lotw = true`，并记录历史。

这消除了手动干预的需要，确保您的 LoTW 记录保持最新。

---

### 补充功能（路线图）

以下高级功能已计划或部分实现：

- **DX Cluster 集成** – 实时 spot 流，支持一键记录 QSO。
- **卫星和中继支持** – 专用字段记录卫星名称和中继详情。
- **Eyeball QSO** – 记录与其他火腿的面对面会面。
- **Cabrillo 导出** – 用于竞赛提交。
- **WSJT‑X 自动导入** – 监控日志文件并自动添加 FT8/FT4 通联。
- **CAT 控制** – 直接读取电台的频率和模式（通过 Hamlib/OmniRig）。
- **传播预测** – 显示 MUF、灰线和 NOAA 空间天气图表。
- **公开日志** – 只读页面，分享最近的 QSO（带隐私控制）。

---

### 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库。
2. 创建功能分支（`git checkout -b feature/your-feature`）。
3. 提交更改（`git commit -m `Add some feature``）。
4. 推送到分支（`git push origin feature/your-feature`）。
5. 打开一个 Pull Request。

请确保代码符合现有风格，并包含适当的测试（如有）。对于重大更改，请先开一个 Issue 讨论。

---

### 许可证

<div width="100%" style="overflow-x: auto;">
    <svg xmlns="https://www.w3.org/2000/svg" viewBox="280 50 260 100" width="100%" height="100%">
        <g id="g227" transform="translate(3.4383843,-105.21456)">
            <g id="g229">
            <path d="M 327.207,217.253 L 324.239,212.509 L 307.093,212.509 L 304.072,217.253 L 300.308,217.253 C 301.492,215.328 302.698,213.375 303.925,211.397 C 305.154,209.418 306.359,207.475 307.542,205.567 C 308.726,203.659 309.875,201.813 310.987,200.028 C 312.1,198.243 313.151,196.565 314.141,194.992 C 314.423,194.391 314.918,194.091 315.625,194.091 C 316.277,194.091 316.764,194.391 317.082,194.992 L 330.994,217.253 L 327.207,217.253 z M 309.133,209.223 L 322.146,209.223 L 316.183,199.656 C 315.989,199.338 315.812,199.179 315.653,199.179 C 315.476,199.179 315.299,199.338 315.124,199.656 L 309.133,209.223 z" id="path231"/>
            <path d="M 360.65,215.743 C 359.379,216.75 357.841,217.253 356.039,217.253 L 340.033,217.253 C 338.213,217.253 336.693,216.758 335.474,215.769 C 334.166,214.745 333.513,213.481 333.513,211.979 L 333.513,199.364 C 333.513,197.898 334.166,196.644 335.474,195.601 C 336.746,194.594 338.284,194.091 340.085,194.091 L 356.118,194.091 C 357.796,194.091 359.219,194.559 360.385,195.496 C 361.605,196.433 362.39,197.908 362.743,199.921 L 359.483,199.921 C 359.254,198.949 358.821,198.269 358.185,197.88 C 357.637,197.545 356.939,197.377 356.09,197.377 L 340.084,197.377 C 339.13,197.377 338.317,197.598 337.646,198.04 C 337.062,198.411 336.771,198.853 336.771,199.365 L 336.771,211.98 C 336.771,212.51 337.062,212.97 337.646,213.358 L 337.619,213.332 C 338.273,213.773 339.077,213.994 340.031,213.994 L 356.037,213.994 C 356.867,213.994 357.609,213.818 358.264,213.464 C 359.041,213.093 359.43,212.589 359.43,211.953 L 359.43,207.315 L 346.471,207.315 L 346.471,204.055 L 362.663,204.055 L 362.663,211.979 C 362.665,213.446 361.993,214.7 360.65,215.743 z" id="path233"/>
            <path d="M 394.863,205.805 C 393.644,206.795 392.115,207.289 390.278,207.289 L 370.959,207.289 L 370.959,217.253 L 367.7,217.253 L 367.7,199.365 C 367.7,197.899 368.353,196.645 369.661,195.602 C 370.933,194.595 372.471,194.092 374.271,194.092 L 390.278,194.092 C 392.062,194.092 393.582,194.595 394.837,195.602 C 396.162,196.645 396.824,197.899 396.824,199.365 L 396.824,202.015 C 396.824,203.517 396.171,204.78 394.863,205.805 z M 393.592,199.365 C 393.592,198.87 393.291,198.429 392.69,198.04 C 392.019,197.598 391.215,197.377 390.279,197.377 L 374.247,197.377 C 373.434,197.377 372.7,197.545 372.048,197.88 C 371.322,198.216 370.96,198.711 370.96,199.364 L 370.96,204.029 L 390.279,204.029 C 391.216,204.029 392.019,203.817 392.69,203.393 C 393.292,203.005 393.592,202.545 393.592,202.015 L 393.592,199.365 z" id="path235"/>
            <path d="M 430.983,212.085 C 430.717,213.658 429.976,214.921 428.756,215.875 C 427.572,216.794 426.142,217.253 424.463,217.253 L 408.43,217.253 C 406.628,217.253 405.1,216.758 403.846,215.769 C 402.521,214.745 401.859,213.481 401.859,211.979 L 401.859,194.117 L 405.171,194.117 L 405.171,211.979 C 405.171,212.509 405.463,212.969 406.046,213.357 L 406.019,213.331 C 406.673,213.772 407.477,213.993 408.431,213.993 L 424.464,213.993 C 425.277,213.993 425.984,213.817 426.584,213.463 L 426.559,213.463 C 427.195,213.074 427.626,212.412 427.857,211.476 L 430.454,211.476 L 430.983,212.085 z" id="path237"/>
            </g>         
            <g id="g239">
            <g id="g241">
                <path d="M 483.223,164.577 L 502.677,164.577 L 472.709,215.077 C 470.997,217.892 469.327,220.058 467.699,221.576 C 466.071,223.094 464.567,224.198 463.187,224.887 C 461.808,225.578 460.621,225.978 459.628,226.088 C 458.634,226.199 457.942,226.254 457.558,226.254 L 439.676,226.254 L 439.676,182.626 L 456.4,182.626 L 456.482,212.594 L 483.223,164.577 z" id="path243" style="fill:#742e68"/>
            </g>
            </g>
            <g id="g245">
            <rect x="291.90399" y="226.25301" width="147.772" height="14.173" id="rect247" style="fill:#742e68"/>
            <g id="g249">
                <path d="M 332.526,231.774 C 332.562,231.525 332.52,231.353 332.395,231.258 L 332.402,231.258 C 332.288,231.172 332.124,231.129 331.905,231.129 L 327.807,231.129 C 327.563,231.129 327.336,231.185 327.127,231.298 C 326.943,231.394 326.827,231.506 326.779,231.638 L 326.344,232.834 L 329.368,232.834 L 329.063,233.67 L 326.038,233.67 L 325.108,236.225 L 324.265,236.225 L 325.935,231.638 C 326.071,231.263 326.358,230.94 326.789,230.673 C 327.209,230.416 327.65,230.286 328.111,230.286 L 332.209,230.286 C 332.645,230.286 332.967,230.407 333.18,230.646 C 333.414,230.886 333.479,231.262 333.375,231.774 L 332.526,231.774 L 332.526,231.774 z" id="path251" style="fill:#ffffff"/>
                <path d="M 338.577,233.377 C 338.594,233.142 338.522,232.981 338.364,232.895 C 338.305,232.859 338.239,232.833 338.165,232.82 C 338.089,232.807 338.011,232.8 337.931,232.8 L 335.952,232.8 C 335.753,232.8 335.556,232.838 335.36,232.916 C 335.133,233.002 334.997,233.11 334.95,233.242 L 333.864,236.225 L 333.02,236.225 L 334.571,231.964 L 335.415,231.964 L 335.351,232.14 C 335.518,232.077 335.673,232.032 335.818,232.004 C 335.961,231.977 336.105,231.963 336.252,231.963 L 338.236,231.963 C 338.611,231.963 338.919,232.058 339.158,232.248 C 339.445,232.479 339.529,232.855 339.413,233.376 L 338.577,233.376 L 338.577,233.377 z" id="path253" style="fill:#ffffff"/>
                <path d="M 346.078,233.228 C 345.934,233.623 345.622,233.946 345.14,234.2 C 344.744,234.408 344.339,234.512 343.933,234.512 L 341.954,234.512 C 341.823,234.512 341.701,234.502 341.586,234.479 C 341.472,234.457 341.333,234.414 341.171,234.35 L 340.964,234.92 L 340.958,234.934 C 340.929,235.052 340.999,235.159 341.169,235.254 C 341.241,235.304 341.317,235.338 341.396,235.36 C 341.474,235.38 341.555,235.39 341.636,235.39 L 343.615,235.39 C 343.695,235.39 343.778,235.383 343.862,235.37 C 343.947,235.356 344.031,235.33 344.117,235.295 C 344.338,235.208 344.526,235.047 344.68,234.812 L 345.515,234.812 C 345.255,235.328 344.898,235.702 344.442,235.934 C 344.068,236.128 343.691,236.226 343.31,236.226 L 341.331,236.226 C 340.95,236.226 340.632,236.127 340.374,235.927 C 340.052,235.677 339.965,235.349 340.112,234.942 L 340.733,233.236 C 340.88,232.832 341.186,232.511 341.649,232.27 C 342.04,232.066 342.451,231.965 342.881,231.965 L 344.86,231.965 C 345.276,231.965 345.608,232.062 345.854,232.257 C 346.152,232.497 346.228,232.82 346.078,233.228 z M 345.229,233.242 C 345.27,233.134 345.229,233.038 345.11,232.957 C 344.98,232.853 344.793,232.801 344.548,232.801 L 342.576,232.801 C 342.404,232.801 342.209,232.839 341.991,232.917 C 341.762,232.999 341.624,233.105 341.576,233.236 C 341.529,233.362 341.588,233.469 341.752,233.555 C 341.898,233.637 342.068,233.677 342.258,233.677 L 344.237,233.677 C 344.471,233.677 344.693,233.628 344.902,233.528 C 345.081,233.446 345.19,233.351 345.229,233.242 z" id="path255" style="fill:#ffffff"/>
                <path d="M 352.712,233.228 C 352.567,233.623 352.255,233.946 351.774,234.2 C 351.377,234.408 350.973,234.512 350.566,234.512 L 348.588,234.512 C 348.456,234.512 348.335,234.502 348.22,234.479 C 348.106,234.457 347.967,234.414 347.806,234.35 L 347.597,234.92 L 347.593,234.934 C 347.563,235.052 347.632,235.159 347.802,235.254 C 347.874,235.304 347.95,235.338 348.029,235.36 C 348.108,235.38 348.189,235.39 348.269,235.39 L 350.248,235.39 C 350.328,235.39 350.412,235.383 350.496,235.37 C 350.58,235.356 350.666,235.33 350.751,235.295 C 350.973,235.208 351.16,235.047 351.314,234.812 L 352.148,234.812 C 351.888,235.328 351.531,235.702 351.076,235.934 C 350.701,236.128 350.324,236.226 349.943,236.226 L 347.964,236.226 C 347.584,236.226 347.265,236.127 347.007,235.927 C 346.685,235.677 346.599,235.349 346.747,234.942 L 347.367,233.236 C 347.514,232.832 347.819,232.511 348.284,232.27 C 348.674,232.066 349.085,231.965 349.514,231.965 L 351.493,231.965 C 351.909,231.965 352.241,232.062 352.487,232.257 C 352.786,232.497 352.86,232.82 352.712,233.228 z M 351.864,233.242 C 351.903,233.134 351.862,233.038 351.743,232.957 C 351.614,232.853 351.427,232.801 351.182,232.801 L 349.21,232.801 C 349.038,232.801 348.842,232.839 348.625,232.917 C 348.396,232.999 348.258,233.105 348.209,233.236 C 348.164,233.362 348.223,233.469 348.385,233.555 C 348.532,233.637 348.701,233.677 348.891,233.677 L 350.87,233.677 C 351.104,233.677 351.327,233.628 351.536,233.528 C 351.715,233.446 351.823,233.351 351.864,233.242 z" id="path257" style="fill:#ffffff"/>
                <path d="M 365.452,235.845 C 365.048,236.098 364.612,236.225 364.145,236.225 L 360.034,236.225 C 359.602,236.225 359.28,236.109 359.065,235.878 C 358.835,235.629 358.77,235.249 358.87,234.737 L 359.706,234.737 C 359.677,234.977 359.723,235.149 359.844,235.253 L 359.837,235.253 C 359.958,235.343 360.126,235.389 360.338,235.389 L 364.45,235.389 C 364.689,235.389 364.914,235.332 365.122,235.22 C 365.312,235.119 365.432,235.005 365.479,234.873 L 365.727,234.193 C 365.774,234.062 365.739,233.946 365.622,233.846 C 365.497,233.733 365.309,233.676 365.065,233.676 L 360.961,233.676 C 360.499,233.676 360.153,233.55 359.925,233.296 C 359.681,233.032 359.628,232.708 359.771,232.317 L 360.019,231.637 C 360.155,231.262 360.441,230.939 360.873,230.672 C 361.293,230.415 361.734,230.285 362.195,230.285 L 366.308,230.285 C 366.738,230.285 367.058,230.406 367.27,230.645 C 367.504,230.885 367.57,231.261 367.464,231.773 L 366.629,231.773 C 366.657,231.533 366.61,231.36 366.489,231.257 L 366.496,231.257 C 366.384,231.171 366.218,231.128 366.001,231.128 L 361.889,231.128 C 361.644,231.128 361.415,231.184 361.202,231.297 C 361.016,231.393 360.901,231.505 360.854,231.637 L 360.606,232.317 C 360.556,232.453 360.588,232.571 360.702,232.671 C 360.828,232.784 361.016,232.84 361.265,232.84 L 365.377,232.84 C 365.843,232.84 366.188,232.967 366.406,233.221 C 366.648,233.488 366.701,233.811 366.562,234.193 L 366.314,234.873 C 366.176,235.258 365.888,235.583 365.452,235.845 z" id="path259" style="fill:#ffffff"/>
                <path d="M 371.985,235.913 C 371.592,236.121 371.189,236.225 370.778,236.225 L 368.8,236.225 C 368.396,236.225 368.07,236.123 367.818,235.92 C 367.513,235.67 367.435,235.343 367.582,234.941 L 368.203,233.235 C 368.348,232.84 368.659,232.517 369.142,232.263 C 369.538,232.055 369.944,231.951 370.355,231.951 L 372.334,231.951 C 372.723,231.951 373.044,232.048 373.295,232.243 C 373.609,232.497 373.695,232.825 373.547,233.228 L 372.924,234.941 C 372.78,235.334 372.468,235.659 371.985,235.913 z M 372.703,233.228 C 372.749,233.101 372.69,232.996 372.528,232.908 C 372.389,232.831 372.221,232.793 372.026,232.793 L 370.047,232.793 C 369.848,232.793 369.654,232.829 369.465,232.901 C 369.233,232.992 369.094,233.1 369.047,233.227 L 368.422,234.947 C 368.375,235.074 368.434,235.18 368.597,235.266 C 368.744,235.347 368.91,235.388 369.097,235.388 L 371.081,235.388 C 371.172,235.388 371.264,235.379 371.363,235.361 C 371.459,235.342 371.558,235.314 371.659,235.272 C 371.891,235.182 372.031,235.071 372.079,234.94 L 372.703,233.228 z" id="path261" style="fill:#ffffff"/>
                <path d="M 375.837,232.8 L 374.59,236.225 L 373.747,236.225 L 375.442,231.563 C 375.588,231.164 375.861,230.845 376.262,230.604 C 376.614,230.396 377.054,230.292 377.584,230.292 L 377.285,231.115 C 376.953,231.164 376.713,231.228 376.562,231.304 C 376.412,231.382 376.32,231.469 376.285,231.563 L 376.139,231.964 L 376.981,231.964 L 376.677,232.8 L 375.837,232.8 z" id="path263" style="fill:#ffffff"/>
                <path d="M 379.655,232.8 L 378.409,236.225 L 377.559,236.225 L 378.805,232.8 L 377.969,232.8 L 378.274,231.964 L 379.11,231.964 L 379.721,230.286 L 380.57,230.286 L 379.96,231.964 L 380.803,231.964 L 380.499,232.8 L 379.655,232.8 z" id="path265" style="fill:#ffffff"/>
                <path d="M 386.091,235.898 C 385.734,236.111 385.329,236.218 384.881,236.218 C 384.637,236.218 384.408,236.183 384.198,236.115 C 383.987,236.047 383.808,235.941 383.661,235.796 C 383.407,235.937 383.144,236.043 382.876,236.115 C 382.607,236.188 382.351,236.224 382.105,236.224 C 381.674,236.224 381.353,236.12 381.139,235.912 C 380.903,235.676 380.86,235.352 381.009,234.94 L 382.092,231.963 L 382.936,231.963 L 381.85,234.946 C 381.803,235.073 381.842,235.176 381.967,235.258 C 382.104,235.344 382.294,235.387 382.538,235.387 C 382.787,235.387 383.008,235.344 383.197,235.258 C 383.383,235.181 383.5,235.075 383.551,234.94 L 384.219,233.105 L 385.062,233.105 L 384.391,234.947 C 384.344,235.079 384.383,235.18 384.512,235.253 C 384.648,235.339 384.833,235.382 385.069,235.382 C 385.323,235.382 385.545,235.339 385.735,235.253 C 385.923,235.176 386.037,235.074 386.083,234.947 L 387.169,231.964 L 388.02,231.964 L 386.937,234.941 C 386.792,235.339 386.509,235.659 386.091,235.898 z" id="path267" style="fill:#ffffff"/>
                <path d="M 392.438,235.92 C 392.042,236.124 391.633,236.225 391.212,236.225 L 389.234,236.225 C 388.808,236.225 388.472,236.126 388.228,235.926 C 387.933,235.69 387.86,235.367 388.011,234.954 C 388.156,234.556 388.467,234.234 388.947,233.989 C 389.343,233.781 389.75,233.676 390.161,233.676 L 392.14,233.676 C 392.267,233.676 392.387,233.689 392.5,233.711 C 392.615,233.733 392.753,233.776 392.915,233.84 L 393.125,233.262 C 393.152,233.14 393.085,233.032 392.925,232.936 C 392.781,232.846 392.626,232.8 392.459,232.8 L 390.48,232.8 C 390.394,232.8 390.309,232.807 390.224,232.82 C 390.14,232.834 390.055,232.86 389.97,232.895 C 389.748,232.981 389.56,233.143 389.407,233.377 L 388.571,233.377 C 388.835,232.861 389.191,232.487 389.638,232.256 C 390.012,232.061 390.391,231.964 390.778,231.964 L 392.761,231.964 C 393.151,231.964 393.471,232.061 393.721,232.256 C 394.039,232.501 394.124,232.829 393.975,233.241 L 393.354,234.947 C 393.209,235.352 392.903,235.675 392.438,235.92 z M 392.511,234.954 C 392.557,234.828 392.499,234.721 392.335,234.635 C 392.189,234.553 392.022,234.512 391.837,234.512 L 389.858,234.512 C 389.627,234.512 389.403,234.563 389.185,234.663 C 389.006,234.744 388.897,234.839 388.857,234.948 C 388.815,235.061 388.852,235.158 388.967,235.24 C 389.104,235.339 389.291,235.389 389.532,235.389 L 391.515,235.389 C 391.71,235.389 391.902,235.353 392.091,235.28 C 392.325,235.19 392.464,235.082 392.511,234.954 z" id="path269" style="fill:#ffffff"/>
                <path d="M 399.738,233.377 C 399.755,233.142 399.684,232.981 399.526,232.895 C 399.466,232.859 399.4,232.833 399.325,232.82 C 399.251,232.807 399.173,232.8 399.092,232.8 L 397.114,232.8 C 396.915,232.8 396.716,232.838 396.52,232.916 C 396.295,233.002 396.159,233.11 396.11,233.242 L 395.024,236.225 L 394.181,236.225 L 395.732,231.964 L 396.575,231.964 L 396.512,232.14 C 396.679,232.077 396.835,232.032 396.979,232.004 C 397.123,231.977 397.267,231.963 397.412,231.963 L 399.396,231.963 C 399.773,231.963 400.08,232.058 400.319,232.248 C 400.606,232.479 400.691,232.855 400.574,233.376 L 399.738,233.376 L 399.738,233.377 z" id="path271" style="fill:#ffffff"/>
                <path d="M 407.239,233.228 C 407.095,233.623 406.783,233.946 406.301,234.2 C 405.903,234.408 405.5,234.512 405.093,234.512 L 403.115,234.512 C 402.982,234.512 402.861,234.502 402.746,234.479 C 402.633,234.457 402.494,234.414 402.332,234.35 L 402.124,234.92 L 402.119,234.934 C 402.09,235.052 402.159,235.159 402.328,235.254 C 402.4,235.304 402.476,235.338 402.555,235.36 C 402.635,235.38 402.715,235.39 402.795,235.39 L 404.774,235.39 C 404.855,235.39 404.938,235.383 405.022,235.37 C 405.107,235.356 405.192,235.33 405.278,235.295 C 405.499,235.208 405.686,235.047 405.841,234.812 L 406.676,234.812 C 406.415,235.328 406.059,235.702 405.603,235.934 C 405.229,236.128 404.851,236.226 404.471,236.226 L 402.492,236.226 C 402.111,236.226 401.792,236.127 401.534,235.927 C 401.212,235.677 401.126,235.349 401.274,234.942 L 401.895,233.236 C 402.041,232.832 402.347,232.511 402.811,232.27 C 403.202,232.066 403.612,231.965 404.042,231.965 L 406.021,231.965 C 406.437,231.965 406.768,232.062 407.015,232.257 C 407.313,232.497 407.388,232.82 407.239,233.228 z M 406.392,233.242 C 406.431,233.134 406.391,233.038 406.271,232.957 C 406.142,232.853 405.955,232.801 405.71,232.801 L 403.739,232.801 C 403.567,232.801 403.371,232.839 403.153,232.917 C 402.924,232.999 402.786,233.105 402.738,233.236 C 402.692,233.362 402.751,233.469 402.914,233.555 C 403.061,233.637 403.229,233.677 403.42,233.677 L 405.398,233.677 C 405.633,233.677 405.855,233.628 406.064,233.528 C 406.243,233.446 406.352,233.351 406.392,233.242 z" id="path273" style="fill:#ffffff"/>
            </g>
            </g>
            <g id="g275">
            <path d="M 517.324,211.954 C 517.324,213.459 516.66,214.725 515.332,215.752 C 514.111,216.744 512.588,217.239 510.764,217.239 L 494.696,217.239 C 493.014,217.239 491.589,216.787 490.421,215.885 C 489.163,214.911 488.366,213.424 488.03,211.423 L 491.298,211.423 C 491.527,212.361 491.952,213.034 492.572,213.442 L 492.546,213.442 C 493.148,213.796 493.864,213.973 494.696,213.973 L 510.764,213.973 C 511.685,213.973 512.482,213.76 513.155,213.335 C 513.757,212.946 514.058,212.485 514.058,211.954 L 514.058,209.298 C 514.058,208.803 513.756,208.36 513.155,207.97 C 512.447,207.51 511.641,207.279 510.739,207.279 L 502.186,207.279 L 502.186,204.012 L 510.764,204.012 C 511.703,204.012 512.5,203.791 513.155,203.348 C 513.757,202.959 514.058,202.507 514.058,201.994 L 514.058,199.338 C 514.058,198.842 513.756,198.4 513.155,198.01 C 512.447,197.55 511.641,197.32 510.739,197.32 L 494.696,197.32 C 493.882,197.32 493.174,197.497 492.572,197.851 L 492.598,197.851 C 491.961,198.223 491.527,198.896 491.297,199.87 L 488.029,199.87 C 488.347,197.851 489.127,196.382 490.367,195.461 C 491.535,194.523 492.978,194.054 494.695,194.054 L 510.763,194.054 C 512.552,194.054 514.075,194.55 515.331,195.541 C 516.659,196.586 517.323,197.852 517.323,199.339 C 517.323,200.631 517.27,201.809 517.164,202.871 C 517.128,203.402 516.952,203.89 516.633,204.332 C 516.491,204.527 516.327,204.73 516.142,204.943 C 515.957,205.156 515.73,205.386 515.464,205.633 C 515.978,206.111 516.367,206.554 516.633,206.961 C 516.934,207.457 517.111,207.935 517.164,208.395 C 517.271,209.44 517.324,210.626 517.324,211.954 z" id="path277"/>
            </g>
        </g>
    </svg>
</div>

本项目采用 GNU Affero General Public License version 3.0 许可证 – 详见 `LICENSE` 文件。

---

### 支持与社区

- 对于 bug 和功能请求，请使用 [GitHub Issues](https://github.com/mcxgjkh/qso-logbook/issues) 页面。
- 对于一般性问题，欢迎在 [Discussions](https://github.com/mcxgjkh/qso-logbook/discussions) 中发起讨论。
- 我们也欢迎对文档的贡献。

---

### 致谢

- 使用 [Next.js](https://nextjs.org/)、[Supabase](https://supabase.io/) 和 [Tailwind CSS](https://tailwindcss.com/) 构建。
- ADIF 解析和生成基于 ADIF 3.1.4 规范。
- LoTW 集成利用了 ARRL 提供的 TQSL 命令行工具。
- 特别感谢业余无线电社区的持续反馈和灵感。

---