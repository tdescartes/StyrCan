# 🚀 PULSE - MARKET READINESS ROADMAP

**Status:** In Progress  
**Start Date:** February 16, 2026  
**Target Completion:** April 10, 2026 (8 weeks)  
**Current Phase:** Phase 1 - Revenue & Compliance

---

## 📊 EXECUTIVE SUMMARY

**Current Readiness Score:** 35/100  
**Target Score:** 95/100 (Production-Ready)

### Critical Gaps Identified
- ❌ No payment processing (Stripe not integrated)
- ❌ No email service (password reset broken)
- ❌ No 2FA/MFA security
- ❌ Missing Terms of Service and Privacy Policy
- ❌ 3 major features are stubs (Reviews, Taxes, File Sharing)
- ❌ No real-time messaging (WebSocket)
- ❌ No background job processing
- ❌ No file storage integration

### What's Already Working ✅
- Multi-tenancy architecture with tenant isolation
- JWT authentication with refresh tokens
- Basic CRUD for all modules (Employees, Finance, Payroll, Communication)
- Audit logging middleware
- Docker Compose development environment
- Type-safe frontend with TypeScript
- Modern UI with shadcn/ui components

---

## 🎯 PHASED IMPLEMENTATION PLAN

### **PHASE 1: REVENUE & COMPLIANCE** (Week 1-3)
**Goal:** Make it legal and profitable  
**Status:** 🟡 Not Started  
**Priority:** P0 - Launch Blocker

#### 1.1 Stripe Integration ⬜
**Estimated Effort:** 1.5 weeks  
**Dependencies:** None

##### Backend Tasks
- [ ] Add `stripe==8.0.0` to requirements.txt
- [ ] Create `Subscription` model with fields:
  - id, company_id, stripe_subscription_id, stripe_customer_id
  - plan_id, status, current_period_start, current_period_end
  - cancel_at_period_end, created_at, updated_at
- [ ] Create Alembic migration `005_add_subscriptions`
- [ ] Add to Company model: `stripe_customer_id`, `stripe_subscription_id`
- [ ] Create `backend/app/routers/billing.py` with endpoints:
  - `POST /api/billing/checkout` - Create Stripe Checkout Session
  - `POST /api/billing/portal` - Redirect to Customer Portal
  - `POST /api/billing/webhooks` - Handle webhook events
  - `GET /api/billing/invoices` - List invoices
  - `GET /api/billing/subscription` - Current subscription details
- [ ] Create Stripe service class `backend/app/utils/stripe_service.py`
- [ ] Implement webhook handlers for 12 events:
  - customer.subscription.created
  - customer.subscription.updated
  - customer.subscription.deleted
  - invoice.payment_succeeded
  - invoice.payment_failed
  - customer.updated
  - payment_method.attached
  - (5 more)
- [ ] Add Stripe config to `backend/app/config.py`:
  - STRIPE_SECRET_KEY
  - STRIPE_PUBLISHABLE_KEY
  - STRIPE_WEBHOOK_SECRET
  - STRIPE_PRICE_IDS (4 plans)

##### Frontend Tasks
- [ ] Install `@stripe/stripe-js` and `@stripe/react-stripe-js`
- [ ] Replace mock payment data in `billing/page.tsx`
- [ ] Create Stripe Elements payment form
- [ ] Add "Upgrade Plan" flow with Checkout
- [ ] Add "Manage Billing" button → Stripe Portal
- [ ] Display real invoice history
- [ ] Add subscription status badges
- [ ] Show current plan usage/limits

##### Testing
- [ ] Test all 4 plan purchases with test cards
- [ ] Test subscription upgrades/downgrades
- [ ] Test failed payment handling
- [ ] Test webhook delivery with Stripe CLI

---

#### 1.2 Subscription Feature Gating ⬜
**Estimated Effort:** 3 days  
**Dependencies:** Stripe integration

##### Backend Tasks
- [ ] Create `backend/app/middleware/subscription.py`
- [ ] Implement feature gate decorator `@require_plan("employees")`
- [ ] Add plan limits to config:
  - Employees: max_employees per plan
  - Payroll: max_payroll_runs per plan
  - Finance: max_transactions per plan
  - Communication: max_messages per plan
- [ ] Apply decorators to protected endpoints
- [ ] Return 402 Payment Required when limit exceeded

##### Frontend Tasks
- [ ] Create `useSubscription` hook
- [ ] Add upgrade prompts when hitting limits
- [ ] Disable features not in current plan
- [ ] Show "Upgrade to unlock" badges

---

#### 1.3 Email Service (SendGrid) ⬜
**Estimated Effort:** 4 days  
**Dependencies:** None

##### Backend Tasks
- [ ] Add `sendgrid==6.11.0` to requirements.txt
- [ ] Create `backend/app/utils/email.py` service class
- [ ] Add SendGrid config to `backend/app/config.py`:
  - SENDGRID_API_KEY
  - SENDER_EMAIL
  - SENDER_NAME
- [ ] Create email templates directory `backend/app/templates/emails/`
- [ ] Create 5 email templates (Jinja2 HTML):
  - `password_reset.html`
  - `email_verification.html`
  - `welcome.html`
  - `invoice_receipt.html`
  - `payment_failed.html`
- [ ] Implement email methods:
  - `send_password_reset(email, token)`
  - `send_verification_email(email, token)`
  - `send_welcome_email(user)`
  - `send_invoice_email(invoice)`
  - `send_payment_failed_email(subscription)`
- [ ] Update `auth.py` password reset to send actual emails
- [ ] Add email verification on signup
- [ ] Add `email_verified` field to User model

##### Testing
- [ ] Send test emails for all templates
- [ ] Verify links work correctly
- [ ] Test email delivery to spam folders
- [ ] Test unsubscribe flow

---

#### 1.4 Terms of Service & Privacy Policy ⬜
**Estimated Effort:** 1 week (including legal review)  
**Dependencies:** None

##### Frontend Tasks
- [ ] Create `frontend/src/app/(legal)/layout.tsx`
- [ ] Create `frontend/src/app/(legal)/terms/page.tsx`
- [ ] Create `frontend/src/app/(legal)/privacy/page.tsx`
- [ ] Write Terms of Service content (template + customize)
- [ ] Write Privacy Policy content (GDPR compliant)
- [ ] Add GDPR data handling sections:
  - What data we collect
  - How we use it
  - User rights (access, deletion, export)
  - Cookie policy
  - Third-party services (Stripe, SendGrid, AWS)
- [ ] Update register page to require acceptance checkbox
- [ ] Add footer links to terms/privacy on all pages
- [ ] **Get legal review before going live** ⚠️

---

### **PHASE 2: SECURITY & INFRASTRUCTURE** (Week 4-5)
**Goal:** Production-grade security and observability  
**Status:** 🔴 Not Started  
**Priority:** P0 - Security Critical

#### 2.1 Two-Factor Authentication (2FA) ⬜
**Estimated Effort:** 1 week  
**Dependencies:** Email service

##### Backend Tasks
- [ ] Add `pyotp==2.9.0` to requirements.txt
- [ ] Add to User model:
  - `two_factor_enabled` (Boolean)
  - `two_factor_secret` (String, encrypted)
- [ ] Create migration `006_add_2fa_to_users`
- [ ] Add 2FA endpoints to `auth.py`:
  - `POST /api/auth/2fa/setup` - Generate QR code
  - `POST /api/auth/2fa/verify-setup` - Verify and enable
  - `POST /api/auth/2fa/verify-login` - Verify during login
  - `POST /api/auth/2fa/disable` - Turn off 2FA
  - `GET /api/auth/2fa/recovery-codes` - Generate codes
- [ ] Modify login flow: check 2FA after password
- [ ] Generate and encrypt TOTP secrets
- [ ] Create QR code generation endpoint

##### Frontend Tasks
- [ ] Update `settings/security/page.tsx` (remove "Coming Soon")
- [ ] Add 2FA setup wizard:
  - Step 1: Scan QR code
  - Step 2: Enter verification code
  - Step 3: Save recovery codes
- [ ] Add 2FA prompt during login (after password)
- [ ] Show 2FA status badge in settings
- [ ] Add "Disable 2FA" option with password confirm

##### Testing
- [ ] Test setup with Google Authenticator
- [ ] Test setup with Authy
- [ ] Test login with 2FA enabled
- [ ] Test recovery codes
- [ ] Test disabling 2FA

---

#### 2.2 Rate Limiting ⬜
**Estimated Effort:** 2 days  
**Dependencies:** Redis

##### Backend Tasks
- [ ] Add `slowapi==0.1.9` to requirements.txt
- [ ] Create `backend/app/middleware/rate_limit.py`
- [ ] Configure limits:
  - Login: 5 requests per minute
  - API (authenticated): 100 requests per minute
  - API (public): 20 requests per minute
  - Webhooks: 1000 requests per minute
- [ ] Add rate limit headers to responses
- [ ] Return 429 Too Many Requests when exceeded
- [ ] Use Redis for distributed rate limiting

##### Testing
- [ ] Test login brute force protection
- [ ] Test API rate limits
- [ ] Test rate limit reset

---

#### 2.3 File Storage (AWS S3) ⬜
**Estimated Effort:** 4 days  
**Dependencies:** None

##### Backend Tasks
- [ ] Add `boto3==1.34.0` to requirements.txt
- [ ] Create `backend/app/utils/storage.py` service class
- [ ] Add AWS config to `backend/app/config.py`:
  - AWS_ACCESS_KEY_ID
  - AWS_SECRET_ACCESS_KEY
  - AWS_S3_BUCKET_NAME
  - AWS_REGION
- [ ] Create File model:
  - id, company_id, uploaded_by, filename, s3_key
  - size_bytes, mime_type, category, reference_type, reference_id
- [ ] Create migration `007_add_files_table`
- [ ] Create `backend/app/routers/files.py`:
  - `POST /api/files/upload` - Generate pre-signed upload URL
  - `GET /api/files/{id}/download` - Generate pre-signed download URL
  - `GET /api/files` - List files with filtering
  - `DELETE /api/files/{id}` - Delete file
- [ ] Implement S3 operations:
  - Upload with pre-signed URLs (client-side upload)
  - Download with pre-signed URLs (temporary access)
  - Delete objects
- [ ] Add file validation (size limits, mime types)

##### Frontend Tasks
- [ ] Create `FileUpload` component (drag-and-drop)
- [ ] Show upload progress
- [ ] Display file list with thumbnails
- [ ] Add download buttons
- [ ] Show file size and type

##### Testing
- [ ] Test file uploads (various types)
- [ ] Test file downloads
- [ ] Test file deletion
- [ ] Test S3 permissions

---

#### 2.4 Background Jobs (Celery + Redis) ⬜
**Estimated Effort:** 1 week  
**Dependencies:** Redis

##### Backend Tasks
- [ ] Add `celery[redis]==5.3.4` to requirements.txt
- [ ] Create `backend/app/celery_app.py`
- [ ] Configure Celery with Redis broker
- [ ] Create `backend/app/tasks/` directory
- [ ] Create `backend/app/tasks/email.py`:
  - `send_email_async(recipient, subject, template, data)`
- [ ] Create `backend/app/tasks/payroll.py`:
  - `process_payroll_run_async(payroll_run_id)`
- [ ] Create `backend/app/tasks/reports.py`:
  - `generate_report_async(report_type, company_id, date_range)`
- [ ] Update payroll processing to use async task
- [ ] Update email sending to use async task
- [ ] Add task status tracking

##### Infrastructure Tasks
- [ ] Add celery worker to `docker-compose.yml`
- [ ] Add celery beat for scheduled tasks (optional)
- [ ] Configure task retries and error handling

##### Testing
- [ ] Test email task execution
- [ ] Test payroll task execution
- [ ] Test task failures and retries

---

#### 2.5 Error Monitoring (Sentry) ⬜
**Estimated Effort:** 2 days  
**Dependencies:** None

##### Backend Tasks
- [ ] Add `sentry-sdk[fastapi]==1.40.0` to requirements.txt
- [ ] Initialize Sentry in `main.py`
- [ ] Add SENTRY_DSN to config
- [ ] Configure error sampling rate
- [ ] Add user context to errors
- [ ] Test error capture

##### Frontend Tasks
- [ ] Add `@sentry/nextjs` to package.json
- [ ] Create `sentry.client.config.ts`
- [ ] Create `sentry.server.config.ts`
- [ ] Configure error boundary
- [ ] Test error capture

---

### **PHASE 3: COMPLETE STUB FEATURES** (Week 6-8)
**Goal:** Remove all "Coming Soon" pages  
**Status:** 🔴 Not Started  
**Priority:** P1 - Feature Completeness

#### 3.1 Performance Reviews System ⬜
**Estimated Effort:** 2 weeks  
**Dependencies:** None

##### Backend Tasks
- [ ] Create models in `backend/app/models/review.py`:
  - ReviewCycle (id, company_id, name, start_date, end_date, status)
  - Review (id, company_id, employee_id, reviewer_id, cycle_id, status, overall_rating)
  - ReviewQuestion (id, cycle_id, question_text, category, weight)
  - ReviewAnswer (id, review_id, question_id, rating, comment)
- [ ] Create migration `008_add_review_tables`
- [ ] Create `backend/app/routers/reviews.py`:
  - `POST /api/reviews/cycles` - Create cycle
  - `GET /api/reviews/cycles` - List cycles
  - `GET /api/reviews/cycles/{id}` - Get cycle details
  - `GET /api/reviews/cycles/{id}/employees` - Employees needing reviews
  - `POST /api/reviews` - Create/submit review
  - `GET /api/reviews/{id}` - View review
  - `PUT /api/reviews/{id}` - Update review
  - `GET /api/employees/{id}/reviews` - Review history
- [ ] Create review schemas
- [ ] Add default question templates

##### Frontend Tasks
- [ ] Redesign `employees/reviews/page.tsx` (remove stub)
- [ ] Create review cycle management UI
- [ ] Create review form with:
  - 5-point rating scale per question
  - Comment boxes
  - Overall rating calculation
  - Submit/save draft
- [ ] Create review history view
- [ ] Add analytics dashboard:
  - Average ratings by category
  - Rating distribution
  - Trend over time

##### Testing
- [ ] Create test review cycle
- [ ] Complete test reviews
- [ ] View review history
- [ ] Test analytics

---

#### 3.2 Tax Documents (W-2/1099) ⬜
**Estimated Effort:** 1.5 weeks  
**Dependencies:** None

##### Backend Tasks
- [ ] Add `reportlab==4.0.0` to requirements.txt
- [ ] Add to Employee model: `ssn_encrypted`, `tax_id_type`
- [ ] Add to PayrollItem model:
  - federal_tax, state_tax, fica_tax, medicare_tax
- [ ] Create migration `009_add_tax_fields`
- [ ] Create `backend/app/utils/tax_calculator.py`:
  - `calculate_federal_withholding(gross, allowances, filing_status)`
  - `calculate_state_tax(gross, state)`
  - `calculate_fica(gross)`
  - `calculate_medicare(gross)`
- [ ] Update payroll processing to calculate taxes
- [ ] Create `backend/app/utils/pdf.py`:
  - `generate_w2_pdf(employee_id, year)`
  - `generate_1099_pdf(contractor_id, year)`
  - `generate_pay_stub_pdf(payroll_item_id)`
- [ ] Add endpoints to `payroll.py`:
  - `GET /api/payroll/tax-documents?year={year}` - List documents
  - `GET /api/payroll/tax-documents/{id}/download` - PDF download
  - `POST /api/payroll/tax-documents/generate` - Batch generate

##### Frontend Tasks
- [ ] Redesign `payroll/taxes/page.tsx` (remove stub)
- [ ] Add year selector dropdown
- [ ] Display document list (W-2s, 1099s)
- [ ] Add "Download All" button (ZIP)
- [ ] Show generation status
- [ ] Add tax summary dashboard

##### Testing
- [ ] Generate test W-2 (verify IRS format)
- [ ] Generate test 1099
- [ ] Test tax calculations
- [ ] Download PDFs

---

#### 3.3 File Attachments in Messaging ⬜
**Estimated Effort:** 3 days  
**Dependencies:** File storage (Phase 2)

##### Backend Tasks
- [ ] Add `attachment_ids` field to Message model (MongoDB)
- [ ] Update `messaging.py` to handle file references
- [ ] Link files to messages

##### Frontend Tasks
- [ ] Add file upload to message composer in `communication/page.tsx`
- [ ] Display attached files in messages
- [ ] Add file preview (images, PDFs)
- [ ] Add download button for attachments

##### Testing
- [ ] Send message with image
- [ ] Send message with PDF
- [ ] Test file preview
- [ ] Test download

---

#### 3.4 Real-Time WebSocket Chat ⬜
**Estimated Effort:** 1 week  
**Dependencies:** Redis

##### Backend Tasks
- [ ] Add `python-socketio==5.11.0` to requirements.txt
- [ ] Create `backend/app/websocket.py`
- [ ] Initialize Socket.IO in `main.py`
- [ ] Implement events:
  - `connect` - Authenticate with JWT
  - `join_room` - Join company room
  - `send_message` - Broadcast to room
  - `typing` - Typing indicator
  - `read_receipt` - Mark as read
  - `disconnect`
- [ ] Configure Redis adapter for multi-server scaling
- [ ] Add WebSocket CORS config

##### Frontend Tasks
- [ ] Add `socket.io-client` to package.json
- [ ] Create `frontend/src/lib/websocket.ts` hook
- [ ] Update `communication/page.tsx` to use WebSocket
- [ ] Add real-time message updates
- [ ] Add typing indicators
- [ ] Add online/offline status
- [ ] Add read receipts

##### Testing
- [ ] Test message delivery (real-time)
- [ ] Test typing indicators
- [ ] Test multi-user chat
- [ ] Test reconnection handling

---

#### 3.5 Employee Benefits Management ⬜
**Estimated Effort:** 1 week  
**Dependencies:** None

##### Backend Tasks
- [ ] Create models in `backend/app/models/benefits.py`:
  - Benefit (id, company_id, name, type, provider, monthly_cost)
  - EmployeeBenefit (id, employee_id, benefit_id, enrollment_date, status)
- [ ] Create migration `010_add_benefits_tables`
- [ ] Create `backend/app/routers/benefits.py`:
  - `POST /api/benefits` - Create benefit
  - `GET /api/benefits` - List benefits
  - `POST /api/employees/{id}/benefits` - Enroll employee
  - `GET /api/employees/{id}/benefits` - Employee benefits
  - `DELETE /api/employees/{id}/benefits/{benefit_id}` - Unenroll

##### Frontend Tasks
- [ ] Create `employees/benefits/page.tsx`
- [ ] Benefits catalog UI
- [ ] Enrollment form
- [ ] Employee benefits list
- [ ] Benefits cost summary

---

### **PHASE 4: ADVANCED FEATURES & POLISH** (Week 9-12)
**Goal:** Market-leading experience  
**Status:** 🔴 Not Started  
**Priority:** P2 - Competitive Edge

#### 4.1 Advanced Payroll Tax Calculations ⬜
**Estimated Effort:** 2 weeks  
**Dependencies:** Tax documents

##### Implementation
- [ ] Implement IRS Publication 15 tables
- [ ] Add all 50 state tax tables
- [ ] Local tax calculations (major cities)
- [ ] Pre-tax deduction handling (401k, HSA)
- [ ] Post-tax deduction handling (garnishments)
- [ ] Multi-state payroll support

---

#### 4.2 Bank Integration (Plaid) ⬜
**Estimated Effort:** 1.5 weeks  
**Dependencies:** None

##### Backend Tasks
- [ ] Add `plaid-python==16.0.0` to requirements.txt
- [ ] Add Plaid config (client_id, secret, environment)
- [ ] Create endpoints:
  - `POST /api/finance/plaid/link-token` - Create link token
  - `POST /api/finance/plaid/exchange-token` - Exchange public token
  - `GET /api/finance/plaid/transactions` - Fetch transactions
  - `POST /api/finance/plaid/webhooks` - Handle webhooks

##### Frontend Tasks
- [ ] Add Plaid Link component
- [ ] Bank connection UI
- [ ] Auto-import transactions
- [ ] Transaction matching

---

#### 4.3 Invoice Generation ⬜
**Estimated Effort:** 1 week  
**Dependencies:** PDF generation

##### Backend Tasks
- [ ] Create Invoice model
- [ ] Create invoice router
- [ ] Generate invoice PDFs
- [ ] Send invoice emails

##### Frontend Tasks
- [ ] Invoice creation form
- [ ] Invoice list
- [ ] Invoice preview
- [ ] Payment tracking

---

#### 4.4 Onboarding Wizard ⬜
**Estimated Effort:** 1.5 weeks  
**Dependencies:** None

##### Frontend Tasks
- [ ] Create `frontend/src/app/(onboarding)/` directory
- [ ] Create 5-step wizard:
  - Step 1: Company info
  - Step 2: Select plan
  - Step 3: Payment setup
  - Step 4: Add first employee
  - Step 5: Customize settings
- [ ] Progress indicator
- [ ] Skip/back navigation
- [ ] Save partial progress

---

#### 4.5 Customer Support Integration ⬜
**Estimated Effort:** 3 days  
**Dependencies:** None

##### Frontend Tasks
- [ ] Add Intercom script
- [ ] Configure Intercom settings
- [ ] Add support widget to all pages
- [ ] Pass user context to Intercom

---

#### 4.6 Advanced Reporting & Export ⬜
**Estimated Effort:** 1 week  
**Dependencies:** None

##### Backend Tasks
- [ ] Add CSV export endpoints to all routers
- [ ] Add PDF export for reports
- [ ] Custom date range filtering
- [ ] Advanced filtering options

##### Frontend Tasks
- [ ] Export buttons on all tables
- [ ] Date range picker
- [ ] Filter builder UI

---

#### 4.7 UI/UX Polish ⬜
**Estimated Effort:** 1 week  
**Dependencies:** None

##### Tasks
- [ ] Add loading skeletons to all data tables
- [ ] Beautiful empty states with CTAs
- [ ] Form validation with real-time feedback
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] ARIA labels on all interactive elements
- [ ] Keyboard navigation (tab through tables)
- [ ] Error boundaries on all pages
- [ ] Toast notifications for all mutations
- [ ] Confetti for major actions
- [ ] Responsive design fixes (mobile)

---

## 📋 DEPENDENCIES & INTEGRATIONS

### Required Third-Party Services

| Service | Purpose | Tier | Monthly Cost | API Keys Needed |
|---------|---------|------|--------------|-----------------|
| **Stripe** | Payment processing | Usage-based | 2.9% + $0.30/txn | STRIPE_SECRET_KEY<br>STRIPE_PUBLISHABLE_KEY<br>STRIPE_WEBHOOK_SECRET |
| **SendGrid** | Transactional email | Free → Essentials | $0 → $20 | SENDGRID_API_KEY |
| **AWS S3** | File storage | Pay-as-you-go | ~$5 | AWS_ACCESS_KEY_ID<br>AWS_SECRET_ACCESS_KEY<br>AWS_S3_BUCKET_NAME |
| **Sentry** | Error monitoring | Developer | $0 → $26 | SENTRY_DSN |
| **Intercom** *(Phase 4)* | Customer support | Start | $74 | INTERCOM_APP_ID |
| **Plaid** *(Phase 4)* | Bank connections | Launch | $0 → custom | PLAID_CLIENT_ID<br>PLAID_SECRET |

### Python Package Additions

```txt
# Phase 1
stripe==8.0.0
sendgrid==6.11.0

# Phase 2
pyotp==2.9.0
slowapi==0.1.9
boto3==1.34.0
celery[redis]==5.3.4
sentry-sdk[fastapi]==1.40.0

# Phase 3
reportlab==4.0.0
python-socketio==5.11.0

# Phase 4
plaid-python==16.0.0
```

### Frontend Package Additions

```json
{
  "@stripe/stripe-js": "^2.4.0",
  "@stripe/react-stripe-js": "^2.4.0",
  "socket.io-client": "^4.7.0",
  "@sentry/nextjs": "^7.100.0"
}
```

---

## 🗄️ DATABASE SCHEMA CHANGES

### New Tables

```sql
-- Phase 1
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    plan_id VARCHAR(50),
    status VARCHAR(20),
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Phase 2
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id),
    filename VARCHAR(255),
    s3_key VARCHAR(500),
    size_bytes INTEGER,
    mime_type VARCHAR(100),
    category VARCHAR(50),
    reference_type VARCHAR(50),
    reference_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Phase 3
CREATE TABLE review_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255),
    start_date DATE,
    end_date DATE,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id),
    cycle_id UUID REFERENCES review_cycles(id),
    status VARCHAR(20),
    overall_rating DECIMAL(3,2),
    submitted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE review_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_id UUID REFERENCES review_cycles(id) ON DELETE CASCADE,
    question_text TEXT,
    category VARCHAR(50),
    weight INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE review_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    question_id UUID REFERENCES review_questions(id),
    rating INTEGER,
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255),
    type VARCHAR(50),
    provider VARCHAR(255),
    monthly_cost DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE employee_benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    benefit_id UUID REFERENCES benefits(id),
    enrollment_date DATE,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Phase 4
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE,
    client_name VARCHAR(255),
    amount DECIMAL(10,2),
    status VARCHAR(20),
    due_date DATE,
    paid_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Modified Tables

```sql
-- Phase 1: Companies table
ALTER TABLE companies ADD COLUMN stripe_customer_id VARCHAR(255);
ALTER TABLE companies ADD COLUMN stripe_subscription_id VARCHAR(255);

-- Phase 2: Users table
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN two_factor_secret VARCHAR(255);

-- Phase 3: Employees table
ALTER TABLE employees ADD COLUMN ssn_encrypted VARCHAR(255);
ALTER TABLE employees ADD COLUMN tax_id_type VARCHAR(20);

-- Phase 3: PayrollItems table
ALTER TABLE payroll_items ADD COLUMN federal_tax DECIMAL(10,2);
ALTER TABLE payroll_items ADD COLUMN state_tax DECIMAL(10,2);
ALTER TABLE payroll_items ADD COLUMN fica_tax DECIMAL(10,2);
ALTER TABLE payroll_items ADD COLUMN medicare_tax DECIMAL(10,2);
```

---

## 🚦 MIGRATION CHECKLIST

### Alembic Migrations to Create

1. ✅ `001_initial_schema.py` - *Already exists*
2. ✅ `002_add_company_id_to_child_tables.py` - *Already exists*
3. ✅ `004_company_constraints.py` - *Already exists*
4. ⬜ `005_add_subscriptions.py` - Phase 1
5. ⬜ `006_add_2fa_to_users.py` - Phase 2
6. ⬜ `007_add_files_table.py` - Phase 2
7. ⬜ `008_add_review_tables.py` - Phase 3
8. ⬜ `009_add_tax_fields.py` - Phase 3
9. ⬜ `010_add_benefits_tables.py` - Phase 3
10. ⬜ `011_add_invoices_table.py` - Phase 4

---

## ✅ TESTING STRATEGY

### Unit Tests (Backend)
- [ ] All routers (80% coverage target)
- [ ] All models
- [ ] All utilities (email, storage, tax calculator)
- [ ] Middleware

### Integration Tests
- [ ] Auth flow (signup → login → 2FA)
- [ ] Payroll processing end-to-end
- [ ] Payment flow (Stripe checkout → webhook)
- [ ] File upload/download

### E2E Tests (Frontend)
- [ ] Critical user flows with Playwright:
  - Signup + onboarding
  - Create employee → run payroll
  - Send message
  - Generate report

### Performance Tests
- [ ] Load testing with k6 (1000 concurrent users)
- [ ] Database query optimization
- [ ] API response times (<200ms)

### Security Tests
- [ ] OWASP Top 10 checklist
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting verification
- [ ] 2FA bypass attempts

### Accessibility Tests
- [ ] WCAG 2.1 AA compliance
- [ ] Screen reader testing
- [ ] Keyboard navigation
- [ ] Color contrast

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Launch
- [ ] All Phase 1-2 tasks complete
- [ ] All critical tests passing
- [ ] Security audit passed
- [ ] Terms of Service + Privacy Policy reviewed by lawyer
- [ ] SSL certificates installed
- [ ] Domain configured
- [ ] Environment variables set in production
- [ ] Database backups configured
- [ ] Monitoring (Sentry) active
- [ ] Error alerting configured
- [ ] Load testing passed (1000 users)

### Launch Day
- [ ] Deploy to production
- [ ] Run smoke tests
- [ ] Monitor error rates
- [ ] Monitor performance
- [ ] Test payment flow with real card
- [ ] Test email delivery
- [ ] Announce launch 🎉

### Post-Launch
- [ ] Monitor for 48 hours
- [ ] Fix critical bugs immediately
- [ ] Gather user feedback
- [ ] Plan Phase 3-4 features based on usage

---

## 📊 PROGRESS TRACKING

### Overall Progress
- **Phase 1:** 0% (0/10 tasks)
- **Phase 2:** 0% (0/10 tasks)
- **Phase 3:** 0% (0/12 tasks)
- **Phase 4:** 0% (0/15 tasks)
- **Total:** 0% (0/47 major tasks)

### Time Tracking
- **Estimated Total:** 8-12 weeks
- **Elapsed:** 0 weeks
- **Remaining:** 8-12 weeks
- **On Track:** ✅ Yes

---

## 🎯 SUCCESS METRICS

### Technical Metrics
- **Test Coverage:** Target 80%
- **API Response Time:** <200ms (p95)
- **Error Rate:** <0.1%
- **Uptime:** >99.9%
- **Page Load Time:** <2s

### Business Metrics
- **Successful Payments:** >95%
- **Email Deliverability:** >99%
- **User Onboarding Completion:** >60%
- **Feature Adoption:** Track usage of each module

---

## 📝 NOTES & DECISIONS

### Architecture Decisions
1. **Stripe over Paddle:** Better feature set, lower fees for SaaS
2. **SendGrid over AWS SES:** Easier setup, better templates
3. **AWS S3 over Azure Blob:** Cost-effective for small files
4. **Celery over AWS Lambda:** Better control, no vendor lock-in
5. **Socket.IO over raw WebSockets:** Fallback support, rooms built-in

### Security Decisions
1. **2FA using TOTP (not SMS):** More secure, no SMS costs
2. **Pre-signed URLs for files:** No direct S3 access from frontend
3. **Rate limiting with Redis:** Distributed, fast
4. **JWT with refresh tokens:** Stateless, scalable

### UI/UX Decisions
1. **Keep existing design system:** Don't change styles/layout
2. **Progressive disclosure:** Show advanced features gradually
3. **Empty states with CTAs:** Guide users to next action
4. **Inline validation:** Immediate feedback on forms

---

## 🔗 RELATED DOCUMENTATION

- [Backend API Specification](./BACKEND_API_SPECIFICATION.md)
- [Multi-Tenancy Architecture](./MULTI_TENANCY_ARCHITECTURE.md)
- [Frontend-Backend Alignment](./FRONTEND_BACKEND_ALIGNMENT.md)
- [Development Roadmap](./DEVELOPMENT_ROADMAP.md)

---

**Last Updated:** February 16, 2026  
**Next Review:** Weekly (every Monday)  
**Owner:** Development Team
