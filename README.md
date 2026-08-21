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

![AGPLv3](https://log.bh6rkw.dpdns.org/AGPLv3.svg)

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

![AGPLv3](https://log.bh6rkw.dpdns.org/AGPLv3.svg)

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
