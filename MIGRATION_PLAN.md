# Migration Plan: `frontend-next` → `frontend`

## Executive Summary

**What we're doing:** Moving the full StyrCan business management application from `frontend-next` into `frontend`, while **restructuring into a service-oriented architecture** with four distinct service packages.

**Why it matters:** `frontend` is the canonical project folder wired into CI/CD, Kubernetes, and docker-compose. The new architecture organizes features into self-contained service modules, each with its own dashboard, sidebar, and navigation — making the platform scalable and maintainable.

**Key architectural change:** Instead of a flat `/dashboard/*` structure, we're building **four service packages** (Employees, Finance, Payroll, Communication) plus global Settings, each as a self-contained module.

---

## Service Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        STYRCAN PLATFORM                             │
├─────────────┬─────────────┬─────────────┬─────────────┬────────────┤
│  EMPLOYEES  │   FINANCE   │   PAYROLL   │    COMMS    │  SETTINGS  │
│   Service   │   Service   │   Service   │   Service   │  (Global)  │
├─────────────┼─────────────┼─────────────┼─────────────┼────────────┤
│ • Dashboard │ • Dashboard │ • Dashboard │ • Dashboard │ • Profile  │
│ • Directory │ • Ledger    │ • Runs      │ • Inbox     │ • Company  │
│ • Schedule  │ • Budget    │ • History   │ • Broadcast │ • Security │
│ • Time Off  │ • Reports   │ • Taxes     │ • Threads   │ • Billing  │
│ • Reviews   │ • Categories│ • Employees │ • Files     │ • Theme    │
└─────────────┴─────────────┴─────────────┴─────────────┴────────────┘
```

---

## Service Definitions

### 🧑‍💼 Employees Service

**Purpose:** Centralized directory for staff records, scheduling, and time-off tracking.

| Feature       | Description                                                            | Status    |
| ------------- | ---------------------------------------------------------------------- | --------- |
| **Dashboard** | Employee KPIs, recent hires, PTO alerts, upcoming shifts               | ✅ Ready  |
| **Directory** | Employee list with CRUD, search, department/status filters, CSV export | ✅ Ready  |
| **Schedule**  | Shift scheduling calendar view, create/edit shifts                     | ✅ Ready  |
| **Time Off**  | PTO requests, balances, approval workflow                              | ✅ Ready  |
| **Reviews**   | Performance reviews, goals tracking                                    | 🔮 Future |

**KPIs:** Total Employees, Active Count, Pending PTO Requests, Open Shifts  
**Primary Actions:** Add Employee, Approve PTO, Create Shift

---

### 💰 Finance Service

**Purpose:** Real-time visibility into cash flow, expense categorization, and budget controls.

| Feature        | Description                                               | Status    |
| -------------- | --------------------------------------------------------- | --------- |
| **Dashboard**  | Revenue/expense charts, trends, cash flow summary         | ✅ Ready  |
| **Ledger**     | Transaction list with CRUD, type/category filters, search | ✅ Ready  |
| **Budget**     | Budget planning by category, alerts when over budget      | 🔮 Future |
| **Reports**    | Financial reports, exports, tax summaries                 | 🔮 Future |
| **Categories** | Expense category management                               | ✅ Ready  |

**KPIs:** Monthly Revenue, Monthly Expenses, Net Balance, Budget Usage %  
**Primary Actions:** Add Transaction, Set Budget, Export Report

---

### 💵 Payroll Service

**Purpose:** Automated calculations for salaries, taxes, and direct deposits.

| Feature           | Description                                               | Status    |
| ----------------- | --------------------------------------------------------- | --------- |
| **Dashboard**     | Next payroll date, total payroll amount, pending payments | ✅ Ready  |
| **Payroll Runs**  | Create, view, process payroll runs                        | ✅ Ready  |
| **History**       | Past payment records, completed runs                      | ✅ Ready  |
| **Tax Documents** | W-2, 1099 generation and management                       | 🔮 Future |
| **By Employee**   | Per-employee payroll breakdown, payment history           | ✅ Ready  |

**KPIs:** Next Run Date, Total Gross, Total Net, Pending Payments  
**Primary Actions:** Run Payroll, Process Payments, Mark as Paid

---

### 💬 Communication Service

**Purpose:** Secure messaging and company-wide announcements in a single hub.

| Feature        | Description                                         | Status       |
| -------------- | --------------------------------------------------- | ------------ |
| **Dashboard**  | Unread count, recent messages, latest broadcasts    | ⚠️ Mock Data |
| **Inbox**      | Direct & group messages, chat UI with read receipts | ⚠️ Mock Data |
| **Broadcasts** | Company-wide announcements, priority levels         | 🔮 Future    |
| **Threads**    | Searchable conversation history                     | ⚠️ Mock Data |
| **Files**      | Shared file vault, document storage                 | 🔮 Future    |

**KPIs:** Unread Messages, Active Threads, Recent Broadcasts  
**Primary Actions:** Send Message, Create Broadcast, Share File

---

### ⚙️ Global Settings

**Purpose:** User profile, company settings, and platform configuration.

| Feature           | Description                         | Status       |
| ----------------- | ----------------------------------- | ------------ |
| **Profile**       | User profile management, avatar     | ✅ Ready     |
| **Company**       | Company settings, branding          | ✅ Ready     |
| **Security**      | Password change, 2FA (future)       | ⚠️ Partial   |
| **Notifications** | Notification preferences            | ⚠️ Mock Data |
| **Appearance**    | Theme selection (light/dark/system) | ✅ Ready     |
| **Billing**       | Subscription, payments              | ⚠️ Mock Data |

---

## Subscription & Pricing Architecture

> _Each service package is individually licensable, enabling flexible subscription tiers._

### Pricing Tiers

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           STYRCAN PRICING PLANS                                 │
├───────────────────────┬───────────────────────┬─────────────────────────────────┤
│    STANDARD EDITION   │  PROFESSIONAL EDITION │      ENTERPRISE EDITION         │
│        $49/mo         │        $129/mo        │           Custom                │
│    Up to 5 members    │    Up to 50 members   │       Scalable limits           │
├───────────────────────┼───────────────────────┼─────────────────────────────────┤
│ ✅ Core Employee Hub  │ ✅ Core Employee Hub  │ ✅ All Professional features    │
│ ✅ Financial Ledger   │ ✅ Financial Ledger   │ ✅ System Automation (API)      │
│ ✅ Standard Reports   │ ✅ Automated Payroll  │ ✅ Full Audit Exports           │
│ ✅ 5GB Secure Storage │ ✅ Shift Logic        │ ✅ Priority SLA                 │
│                       │ ✅ AI Finance Tags    │ ✅ Dedicated Account Hub        │
│                       │ ✅ 50GB Secure Storage│ ✅ Unlimited Storage            │
│                       │                       │ ✅ Custom Integrations          │
└───────────────────────┴───────────────────────┴─────────────────────────────────┘
```

---

### Feature-to-Plan Mapping

| Feature                    | Standard | Professional | Enterprise | Service Package |
| -------------------------- | :------: | :----------: | :--------: | --------------- |
| **EMPLOYEES SERVICE**      |          |              |            |                 |
| Employee Directory         |    ✅    |      ✅      |     ✅     | Employees       |
| Employee Profiles          |    ✅    |      ✅      |     ✅     | Employees       |
| Basic Scheduling           |    ✅    |      ✅      |     ✅     | Employees       |
| Shift Logic (Auto-assign)  |    ❌    |      ✅      |     ✅     | Employees       |
| PTO Management             |    ✅    |      ✅      |     ✅     | Employees       |
| Performance Reviews        |    ❌    |      ✅      |     ✅     | Employees       |
| **FINANCE SERVICE**        |          |              |            |                 |
| Financial Ledger           |    ✅    |      ✅      |     ✅     | Finance         |
| Transaction CRUD           |    ✅    |      ✅      |     ✅     | Finance         |
| Expense Categories         |    ✅    |      ✅      |     ✅     | Finance         |
| Standard Reports           |    ✅    |      ✅      |     ✅     | Finance         |
| AI Finance Tags            |    ❌    |      ✅      |     ✅     | Finance         |
| Budget Planning            |    ❌    |      ✅      |     ✅     | Finance         |
| Advanced Analytics         |    ❌    |      ❌      |     ✅     | Finance         |
| **PAYROLL SERVICE**        |          |              |            |                 |
| View Payroll Runs          |    ✅    |      ✅      |     ✅     | Payroll         |
| Manual Payroll Entry       |    ✅    |      ✅      |     ✅     | Payroll         |
| Automated Payroll          |    ❌    |      ✅      |     ✅     | Payroll         |
| Tax Calculations           |    ❌    |      ✅      |     ✅     | Payroll         |
| Direct Deposit Integration |    ❌    |      ✅      |     ✅     | Payroll         |
| W-2/1099 Generation        |    ❌    |      ❌      |     ✅     | Payroll         |
| **COMMUNICATION SERVICE**  |          |              |            |                 |
| Direct Messages            |    ✅    |      ✅      |     ✅     | Communication   |
| Group Threads              |    ✅    |      ✅      |     ✅     | Communication   |
| Company Broadcasts         |    ❌    |      ✅      |     ✅     | Communication   |
| File Sharing (5GB)         |    ✅    |      —       |     —      | Communication   |
| File Sharing (50GB)        |    —     |      ✅      |     —      | Communication   |
| File Sharing (Unlimited)   |    —     |      —       |     ✅     | Communication   |
| Message Search & Archive   |    ❌    |      ✅      |     ✅     | Communication   |
| **PLATFORM & SUPPORT**     |          |              |            |                 |
| Member Limit               |    5     |      50      | Unlimited  | Global          |
| Email Support              |    ✅    |      ✅      |     ✅     | Global          |
| Priority Support           |    ❌    |      ✅      |     ✅     | Global          |
| Dedicated Account Manager  |    ❌    |      ❌      |     ✅     | Global          |
| API Access                 |    ❌    |      ❌      |     ✅     | Global          |
| Custom Integrations        |    ❌    |      ❌      |     ✅     | Global          |
| Full Audit Exports         |    ❌    |      ❌      |     ✅     | Global          |
| SSO / SAML                 |    ❌    |      ❌      |     ✅     | Global          |

---

### À La Carte Add-Ons

> _Customers can purchase individual service packages as add-ons to their base plan._

| Add-On Package           | Price   | Description                                           |
| ------------------------ | ------- | ----------------------------------------------------- |
| 🧑‍💼 **Employees Pro**     | +$29/mo | Shift Logic, Performance Reviews, Advanced Scheduling |
| 💰 **Finance Pro**       | +$29/mo | AI Finance Tags, Budget Planning, Custom Reports      |
| 💵 **Payroll Pro**       | +$39/mo | Automated Payroll, Tax Calculations, Direct Deposit   |
| 💬 **Communication Pro** | +$19/mo | Broadcasts, 50GB Storage, Message Archive             |
| 📊 **Analytics Pack**    | +$49/mo | Advanced dashboards, data exports, trend analysis     |
| 🔐 **Security Pack**     | +$29/mo | SSO/SAML, 2FA enforcement, audit logs                 |

---

### Subscription Data Model

```typescript
// types/subscription.ts

interface SubscriptionPlan {
  id: string;
  name: "standard" | "professional" | "enterprise";
  displayName: string;
  price: number; // monthly in cents (4900, 12900, 0 for custom)
  memberLimit: number; // 5, 50, -1 for unlimited
  storageGB: number; // 5, 50, -1 for unlimited
  features: FeatureFlag[];
  addOns: AddOn[];
}

interface FeatureFlag {
  key: string;
  service: "employees" | "finance" | "payroll" | "communication" | "global";
  enabled: boolean;
}

interface AddOn {
  id: string;
  name: string;
  price: number; // monthly in cents
  features: string[]; // feature keys unlocked
}

interface CompanySubscription {
  companyId: string;
  planId: string;
  status: "active" | "trial" | "past_due" | "canceled";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  memberCount: number;
  storageUsedGB: number;
  addOns: string[]; // add-on IDs
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}
```

---

### Feature Gating Implementation

```typescript
// lib/features.ts

const PLAN_FEATURES: Record<string, FeatureFlag[]> = {
  standard: [
    { key: 'employees.directory', service: 'employees', enabled: true },
    { key: 'employees.schedule.basic', service: 'employees', enabled: true },
    { key: 'employees.schedule.shift_logic', service: 'employees', enabled: false },
    { key: 'finance.ledger', service: 'finance', enabled: true },
    { key: 'finance.ai_tags', service: 'finance', enabled: false },
    { key: 'payroll.view', service: 'payroll', enabled: true },
    { key: 'payroll.automated', service: 'payroll', enabled: false },
    { key: 'communication.messages', service: 'communication', enabled: true },
    { key: 'communication.broadcasts', service: 'communication', enabled: false },
  ],
  professional: [
    // All standard features + ...
    { key: 'employees.schedule.shift_logic', service: 'employees', enabled: true },
    { key: 'employees.reviews', service: 'employees', enabled: true },
    { key: 'finance.ai_tags', service: 'finance', enabled: true },
    { key: 'finance.budget', service: 'finance', enabled: true },
    { key: 'payroll.automated', service: 'payroll', enabled: true },
    { key: 'payroll.tax_calc', service: 'payroll', enabled: true },
    { key: 'communication.broadcasts', service: 'communication', enabled: true },
    { key: 'communication.archive', service: 'communication', enabled: true },
  ],
  enterprise: [
    // All professional features + ...
    { key: 'finance.advanced_analytics', service: 'finance', enabled: true },
    { key: 'payroll.w2_1099', service: 'payroll', enabled: true },
    { key: 'global.api_access', service: 'global', enabled: true },
    { key: 'global.audit_exports', service: 'global', enabled: true },
    { key: 'global.sso_saml', service: 'global', enabled: true },
  ],
};

// Hook for checking feature access
function useFeature(featureKey: string): boolean {
  const { subscription } = useAuth();
  const planFeatures = PLAN_FEATURES[subscription.planId] || [];
  const addOnFeatures = subscription.addOns.flatMap(a => a.features);

  return planFeatures.some(f => f.key === featureKey && f.enabled)
    || addOnFeatures.includes(featureKey);
}

// Component for gating features
function FeatureGate({ feature, children, fallback }: {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const hasAccess = useFeature(feature);

  if (!hasAccess) {
    return fallback || <UpgradePrompt feature={feature} />;
  }

  return <>{children}</>;
}
```

---

### Service Access Control

| Service          | Standard Access    | Professional Access | Enterprise Access |
| ---------------- | ------------------ | ------------------- | ----------------- |
| 🧑‍💼 Employees     | Core features only | Full access         | Full + API        |
| 💰 Finance       | Ledger + Reports   | + AI Tags, Budget   | + Analytics API   |
| 💵 Payroll       | View-only          | Full automation     | + Tax docs        |
| 💬 Communication | Basic messaging    | + Broadcasts        | + Archive API     |
| ⚙️ Settings      | Profile, Company   | + Billing mgmt      | + SSO, Audit      |

---

### UI Integration Points

#### 1. Service Header — Plan Badge

```
┌──────────────────────────────────────────────────────────────────────┐
│ 🏢 StyrCan [PRO]  [Employees] [Finance] [Payroll] [Comms]   🔔 👤 ⚙️│
└──────────────────────────────────────────────────────────────────────┘
                │
                └── Shows current plan (Standard/Pro/Enterprise)
```

#### 2. Locked Feature Indicators

```tsx
// Sidebar item with lock icon for unavailable features
<SidebarItem
  icon={locked ? <Lock /> : <Play />}
  label="Automated Payroll"
  disabled={locked}
  onClick={locked ? showUpgradeModal : navigate}
/>
```

#### 3. Upgrade Prompts

- **Inline prompt:** "Upgrade to Professional to unlock AI Finance Tags"
- **Modal:** Full comparison table with "Upgrade Now" CTA
- **Dashboard widget:** "You're using 4/5 members. Upgrade for more."

#### 4. Usage Meters

```
Members:  ████████░░ 4/5
Storage:  ██░░░░░░░░ 1.2/5 GB
```

---

### Billing Integration (Stripe)

| Component                   | Purpose                            | Status     |
| --------------------------- | ---------------------------------- | ---------- |
| `/settings/billing`         | Subscription management UI         | 🔶 Planned |
| `/api/billing/checkout`     | Create Stripe checkout session     | 🔶 Planned |
| `/api/billing/portal`       | Redirect to Stripe customer portal | 🔶 Planned |
| `/api/billing/webhook`      | Handle Stripe events               | 🔶 Planned |
| `CompanySubscription` table | Store subscription state           | 🔶 Planned |

---

### Migration Phase Addition

Add to **Phase 10 — Settings Module**:

- [ ] **10.7** Create subscription types (`types/subscription.ts`)
- [ ] **10.8** Create feature gating utilities (`lib/features.ts`)
- [ ] **10.9** Create `useFeature` hook and `FeatureGate` component
- [ ] **10.10** Update Settings/Billing page with plan management UI
- [ ] **10.11** Add upgrade prompts and locked feature indicators

---

## Route Structure

```
/                           → Home (service selector + overview dashboard)
│
├── /employees              → EMPLOYEES SERVICE
│   ├── /employees          → Employee dashboard (KPIs, recent hires, PTO alerts)
│   ├── /employees/directory→ Employee list with CRUD, search, filters
│   ├── /employees/schedule → Shift scheduling calendar view
│   ├── /employees/pto      → PTO requests, balances, approval workflow
│   └── /employees/reviews  → Performance reviews (future phase)
│
├── /finance                → FINANCE SERVICE
│   ├── /finance            → Finance dashboard (revenue/expense charts, trends)
│   ├── /finance/ledger     → Transaction list with CRUD, filters, search
│   ├── /finance/budget     → Budget planning by category, alerts
│   ├── /finance/reports    → Financial reports, exports, summaries
│   └── /finance/categories → Expense category management
│
├── /payroll                → PAYROLL SERVICE
│   ├── /payroll            → Payroll dashboard (next run, totals, alerts)
│   ├── /payroll/runs       → Payroll run management, create/process/view
│   ├── /payroll/history    → Payment history, past runs
│   ├── /payroll/taxes      → Tax documents (W-2, 1099) (future phase)
│   └── /payroll/employees  → Per-employee payroll breakdown
│
├── /communication          → COMMUNICATION SERVICE
│   ├── /communication      → Comms dashboard (unread count, recent activity)
│   ├── /communication/inbox→ Direct & group messages, chat UI
│   ├── /communication/broadcast → Company-wide announcements
│   ├── /communication/threads → Searchable conversation history
│   └── /communication/files→ Shared file vault (future phase)
│
├── /settings               → GLOBAL SETTINGS (not a service)
│   ├── /settings           → Settings overview
│   ├── /settings/profile   → User profile management
│   ├── /settings/company   → Company settings
│   ├── /settings/security  → Password, 2FA (future)
│   ├── /settings/notifications → Notification preferences
│   ├── /settings/appearance→ Theme selection
│   └── /settings/billing   → Subscription & payments
│
└── /(auth)                 → AUTHENTICATION (unchanged)
    ├── /login
    ├── /register
    └── /forgot-password
```

---

## Sidebar Navigation Per Service

### Employees Service Sidebar

| Item      | Route                  | Icon            | Description                |
| --------- | ---------------------- | --------------- | -------------------------- |
| Dashboard | `/employees`           | LayoutDashboard | Service overview & KPIs    |
| Directory | `/employees/directory` | Users           | Employee list & management |
| Schedule  | `/employees/schedule`  | Calendar        | Shift scheduling           |
| Time Off  | `/employees/pto`       | Clock           | PTO requests & balances    |
| Reviews   | `/employees/reviews`   | Star            | Performance reviews        |

### Finance Service Sidebar

| Item       | Route                 | Icon            | Description                 |
| ---------- | --------------------- | --------------- | --------------------------- |
| Dashboard  | `/finance`            | LayoutDashboard | Financial overview & charts |
| Ledger     | `/finance/ledger`     | BookOpen        | Transaction management      |
| Budget     | `/finance/budget`     | PiggyBank       | Budget planning             |
| Reports    | `/finance/reports`    | FileText        | Financial reports           |
| Categories | `/finance/categories` | Tags            | Expense categories          |

### Payroll Service Sidebar

| Item          | Route                | Icon            | Description               |
| ------------- | -------------------- | --------------- | ------------------------- |
| Dashboard     | `/payroll`           | LayoutDashboard | Payroll overview & alerts |
| Payroll Runs  | `/payroll/runs`      | Play            | Create & process payroll  |
| History       | `/payroll/history`   | History         | Past payment records      |
| Tax Documents | `/payroll/taxes`     | FileCheck       | W-2, 1099 generation      |
| By Employee   | `/payroll/employees` | User            | Per-employee breakdown    |

### Communication Service Sidebar

| Item       | Route                      | Icon            | Description             |
| ---------- | -------------------------- | --------------- | ----------------------- |
| Dashboard  | `/communication`           | LayoutDashboard | Comms overview          |
| Inbox      | `/communication/inbox`     | Inbox           | Direct & group messages |
| Broadcasts | `/communication/broadcast` | Megaphone       | Company announcements   |
| Threads    | `/communication/threads`   | MessageSquare   | Conversation history    |
| Files      | `/communication/files`     | FolderOpen      | Shared file vault       |

---

## Global Header & Service Switcher

```
┌──────────────────────────────────────────────────────────────────────┐
│ 🏢 StyrCan    [Employees] [Finance] [Payroll] [Comms]    🔔 👤 ⚙️   │
└──────────────────────────────────────────────────────────────────────┘
         │           │                                      │  │  │
         │           └── Service tabs (highlighted = active) │  │  │
         │                                                   │  │  │
         └── Logo/Home link                                  │  │  │
                                            Notifications ───┘  │  │
                                            User menu ──────────┘  │
                                            Settings ──────────────┘
```

---

## Cross-Service Data Flows

| From                         | To                                              | Integration                                             | Implementation |
| ---------------------------- | ----------------------------------------------- | ------------------------------------------------------- | -------------- |
| Employees → Payroll          | Employee salary data feeds payroll calculations | API joins employee + payroll data                       |
| Payroll → Finance            | Processed payroll creates expense transactions  | Backend auto-creates transactions on payroll completion |
| Employees → Communication    | Employee directory populates message recipients | Shared user/employee API endpoint                       |
| Finance → Payroll            | Budget alerts before payroll processing         | Dashboard shows warning if payroll > budget             |
| All Services → Communication | System notifications for actions                | Backend triggers notification on CRUD events            |

---

## Migration Strategy (11 Phases)

---

### Phase 1 — Foundation: Dependencies & Config

> _Get `frontend` package.json aligned with `frontend-next` so everything can import and compile._

- [ ] **1.1** Merge `package.json` dependencies
  - **Add 30+ packages:** `@radix-ui/*` (18 packages), `@tanstack/react-query`, `zustand`, `zod`, `lucide-react`, `recharts`, `socket.io-client`, `sonner`, `next-themes`, `react-hook-form`, `@hookform/resolvers`, `class-variance-authority`, `clsx`, `tailwind-merge`, `date-fns`, `tailwindcss-animate`
  - **Keep existing:** `next: 16.1.6`, `react: 19.2.3`, `react-dom: 19.2.3`

- [ ] **1.2** Update `next.config.ts`
  - Add environment-aware output mode (export for GitHub Pages, standalone for Docker)
  - Add remote image patterns, env passthrough, turbopack alias

- [ ] **1.3** Create `.env` file with API URL, app name

- [ ] **1.4** Copy Docker files (`Dockerfile`, `.dockerignore`)

- [ ] **1.5** Run `npm install`

---

### Phase 2 — Design System: Global Styles & UI Components

> _Bring over the visual foundation before any pages use it._

- [ ] **2.1** Replace `globals.css` — CSS variables for theming, custom scrollbar utilities

- [ ] **2.2** Copy all 11 UI components to `src/components/ui/`
  - avatar, badge, button, card, dialog, dropdown-menu, input, label, scroll-area, select, sonner

- [ ] **2.3** Validate component imports

---

### Phase 3 — Core Infrastructure: Types, API, State, Hooks

> _Wire up the data layer that every page depends on._

- [ ] **3.1** Copy `src/types/index.ts` — 20+ interfaces (User, Employee, Company, Transaction, etc.)

- [ ] **3.2** Copy `src/lib/api/client.ts` — Full REST client with 40+ endpoint methods

- [ ] **3.3** Copy `src/lib/utils.ts` — cn(), formatCurrency, formatDate, getInitials, truncate

- [ ] **3.4** Copy `src/stores/auth-store.ts` — Zustand auth store with persist

- [ ] **3.5** Copy `src/hooks/use-toast.ts` — Sonner toast wrapper

---

### Phase 4 — App Shell: Layout, Providers, Home

> _Build the global application shell with service switcher._

- [ ] **4.1** Create `src/app/providers.tsx` — React Query, ThemeProvider, Toaster

- [ ] **4.2** Replace `src/app/layout.tsx` — Inter font, StyrCan metadata, Providers wrapper

- [ ] **4.3** Create `src/app/page.tsx` — Home page with service selector cards

- [ ] **4.4** Create `src/components/layout/service-header.tsx` — Global header with service tabs

- [ ] **4.5** Create `src/components/layout/service-sidebar.tsx` — Reusable sidebar component

---

### Phase 5 — Auth Module

> _Bring the authentication flows._

- [ ] **5.1** Create `src/app/(auth)/login/page.tsx` — Login form with Zod validation

- [ ] **5.2** Create `src/app/(auth)/register/page.tsx` — Registration with password requirements

- [ ] **5.3** Create `src/app/(auth)/forgot-password/page.tsx` — Password reset flow

---

### Phase 6 — Employees Service Package 🧑‍💼

> _Self-contained employee management module._

- [ ] **6.1** Create `src/app/(services)/employees/layout.tsx`
  - Employees-specific sidebar: Dashboard, Directory, Schedule, Time Off, Reviews
  - Auth guard, service header integration

- [ ] **6.2** Create `src/app/(services)/employees/page.tsx` — Employees Dashboard
  - KPIs: Total employees, Active count, Pending PTO, Open shifts
  - Recent hires, PTO requests pending, upcoming shifts

- [ ] **6.3** Create `src/app/(services)/employees/directory/page.tsx`
  - Employee list with CRUD, search, filters, pagination, CSV export
  - Add/Edit/Delete dialogs

- [ ] **6.4** Create `src/app/(services)/employees/schedule/page.tsx`
  - Shift calendar view, create/edit shifts

- [ ] **6.5** Create `src/app/(services)/employees/pto/page.tsx`
  - PTO requests list, approve/deny workflow

---

### Phase 7 — Finance Service Package 💰

> _Self-contained financial management module._

- [ ] **7.1** Create `src/app/(services)/finance/layout.tsx`
  - Finance-specific sidebar: Dashboard, Ledger, Budget, Reports, Categories

- [ ] **7.2** Create `src/app/(services)/finance/page.tsx` — Finance Dashboard
  - KPIs: Revenue, Expenses, Net Balance
  - Charts, recent transactions, budget alerts

- [ ] **7.3** Create `src/app/(services)/finance/ledger/page.tsx`
  - Transaction list with CRUD, filters, pagination, CSV export

- [ ] **7.4** Create `src/app/(services)/finance/categories/page.tsx`
  - Expense category management

---

### Phase 8 — Payroll Service Package 💵

> _Self-contained payroll processing module._

- [ ] **8.1** Create `src/app/(services)/payroll/layout.tsx`
  - Payroll-specific sidebar: Dashboard, Runs, History, Taxes, By Employee

- [ ] **8.2** Create `src/app/(services)/payroll/page.tsx` — Payroll Dashboard
  - KPIs: Next run, Total gross/net, Pending payments
  - Quick actions

- [ ] **8.3** Create `src/app/(services)/payroll/runs/page.tsx`
  - Payroll run list, create/process/view, employee breakdown

- [ ] **8.4** Create `src/app/(services)/payroll/history/page.tsx`
  - Past runs, payment records

- [ ] **8.5** Create `src/app/(services)/payroll/employees/page.tsx`
  - Per-employee payroll view

---

### Phase 9 — Communication Service Package 💬

> _Self-contained messaging module._

- [ ] **9.1** Create `src/app/(services)/communication/layout.tsx`
  - Comms-specific sidebar: Dashboard, Inbox, Broadcasts, Threads, Files

- [ ] **9.2** Create `src/app/(services)/communication/page.tsx` — Comms Dashboard
  - KPIs: Unread, Active threads, Recent broadcasts
  - ⚠️ Currently uses mock data

- [ ] **9.3** Create `src/app/(services)/communication/inbox/page.tsx`
  - Chat-style messaging UI
  - ⚠️ Currently uses mock data

- [ ] **9.4** Create `src/app/(services)/communication/threads/page.tsx`
  - Searchable message history
  - ⚠️ Currently uses mock data

---

### Phase 10 — Settings Module ⚙️

> _Global settings (not a service)._

- [ ] **10.1** Create `src/app/(settings)/settings/layout.tsx`
  - Settings sidebar: Profile, Company, Security, Notifications, Appearance, Billing

- [ ] **10.2** Create settings sub-pages:
  - `/settings/profile` — User profile
  - `/settings/company` — Company settings
  - `/settings/security` — Password change
  - `/settings/notifications` — Preferences
  - `/settings/appearance` — Theme
  - `/settings/billing` — Subscription

---

### Phase 11 — Verification & Cleanup

> _Make sure everything works._

- [ ] **11.1** Run `npm run type-check` — Fix TypeScript errors

- [ ] **11.2** Run `npm run lint` — Fix ESLint issues

- [ ] **11.3** Run `npm run build` — Verify production build

- [ ] **11.4** Run `npm run dev` — Smoke test all services

- [ ] **11.5** Test cross-service navigation

- [ ] **11.6** Archive `frontend-next` folder (optional)

---

## File Structure After Migration

```
frontend/src/
├── app/
│   ├── globals.css
│   ├── layout.tsx                    # Root layout with Providers
│   ├── page.tsx                      # Home / Service selector
│   ├── providers.tsx                 # React Query, Theme, Toaster
│   │
│   ├── (auth)/                       # Auth route group
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   │
│   ├── (services)/                   # Service modules route group
│   │   ├── employees/                # EMPLOYEES SERVICE
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Dashboard
│   │   │   ├── directory/page.tsx
│   │   │   ├── schedule/page.tsx
│   │   │   └── pto/page.tsx
│   │   │
│   │   ├── finance/                  # FINANCE SERVICE
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Dashboard
│   │   │   ├── ledger/page.tsx
│   │   │   └── categories/page.tsx
│   │   │
│   │   ├── payroll/                  # PAYROLL SERVICE
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Dashboard
│   │   │   ├── runs/page.tsx
│   │   │   ├── history/page.tsx
│   │   │   └── employees/page.tsx
│   │   │
│   │   └── communication/            # COMMUNICATION SERVICE
│   │       ├── layout.tsx
│   │       ├── page.tsx              # Dashboard
│   │       ├── inbox/page.tsx
│   │       └── threads/page.tsx
│   │
│   └── (settings)/                   # Settings route group
│       └── settings/
│           ├── layout.tsx
│           ├── profile/page.tsx
│           ├── company/page.tsx
│           ├── security/page.tsx
│           ├── notifications/page.tsx
│           ├── appearance/page.tsx
│           └── billing/page.tsx
│
├── components/
│   ├── layout/
│   │   ├── service-header.tsx        # Global header
│   │   └── service-sidebar.tsx       # Reusable sidebar
│   └── ui/                           # 11 shadcn/ui components
│
├── hooks/
│   └── use-toast.ts
│
├── lib/
│   ├── utils.ts
│   └── api/client.ts
│
├── stores/
│   └── auth-store.ts
│
└── types/
    └── index.ts
```

---

## File Count Summary

| Category                  | Files         | Estimated Lines  |
| ------------------------- | ------------- | ---------------- |
| **Config**                | 5             | ~150             |
| **Types & Utils**         | 3             | ~490             |
| **UI Components**         | 11            | ~935             |
| **Layout Components**     | 2             | ~300             |
| **State & Hooks**         | 2             | ~155             |
| **App Shell**             | 3             | ~100             |
| **Auth Pages**            | 3             | ~548             |
| **Employees Service**     | 5             | ~1,200           |
| **Finance Service**       | 4             | ~900             |
| **Payroll Service**       | 5             | ~1,100           |
| **Communication Service** | 4             | ~600             |
| **Settings Module**       | 7             | ~700             |
| **Total**                 | **~54 files** | **~7,178 lines** |

---

## Known Limitations & Future Work

### Features Using Mock Data

- Communication inbox/threads — needs WebSocket
- Settings notifications — not persisted
- Settings billing — needs Stripe

### Future Phase Features

| Feature                   | Service       | Priority |
| ------------------------- | ------------- | -------- |
| Performance Reviews       | Employees     | Medium   |
| Budget Planning           | Finance       | High     |
| Financial Reports         | Finance       | High     |
| Tax Documents (W-2, 1099) | Payroll       | Medium   |
| File Vault                | Communication | Low      |
| Two-Factor Auth           | Settings      | High     |
| Audit Logs                | Global        | Medium   |

---

## Risk Register

| Risk                         | Impact            | Mitigation                                |
| ---------------------------- | ----------------- | ----------------------------------------- |
| Tailwind v4 breaking changes | Styles may break  | Audit `@layer`, `@apply` usage            |
| Service route collisions     | 404 errors        | Clear route group naming                  |
| Shared state complexity      | Race conditions   | Keep auth in Zustand, rest in React Query |
| Large bundle size            | Slow initial load | Code splitting per service                |

---

## Progress Log

| Date | Phase | Tasks Completed | Notes                       |
| ---- | ----- | --------------- | --------------------------- |
| —    | —     | —               | _Migration not yet started_ |
