# StyrCan Master Data Reference

This document defines the structured data for the two primary demonstration companies used to validate system integrity, multi-tenancy isolation, and feature completeness.

## 1. Company: Apex Dynamics (Tenant ID: ENT-001)

**Industry:** Financial Services | **Status:** Enterprise

### Users

| Email                    | Role          | Security    |
| :----------------------- | :------------ | :---------- |
| admin@apexdynamics.com   | SUPER_ADMIN   | 2FA Enabled |
| CFO@apexdynamics.com     | FINANCE_ADMIN | 2FA Enabled |
| auditor@apexdynamics.com | AUDITOR       | 2FA Enabled |

### Financial Sample (Total Records: 250)

- **Accounts:** Operating Account, Tax Reserve, Petty Cash.
- **Transactions:** Range from $5,000 to $50,000.
- **Currency:** USD.

### Payroll Sample (Employees: 15)

- **Status:** All active.
- **Pay Frequency:** Semi-monthly.
- **Data Points:** Base Salary, Benefits, Tax Deductions, Net Pay.

---

## 2. Company: Horizon Logistics (Tenant ID: LOG-002)

**Industry:** Transport & Storage | **Status:** Growth

### Users

| Email                     | Role  | Security               |
| :------------------------ | :---- | :--------------------- |
| operations@horizon.log    | ADMIN | 2FA Disabled (Pending) |
| fleet_manager@horizon.log | USER  | 2FA Disabled           |

### Files & Documents (Total Records: 120)

- **Types:** Invoices (PDF), Bill of Ladings (JPG), Contracts (DOCX).
- **S3 Mapping:** `uploads/LOG-002/invoices/...`
- **Metadata:** Document date, expiry date, extraction status.

### WebSocket Notification Feed

- **Triggers:** File Upload Complete, Report Generated, Security Login.

---

## 3. Onboarding Orchestration (Company Target: Stellar Solutions)

**Scenario:** Interactive Onboarding Demo

- **Objective:** Execute the registration flow.
- **Expected Outcome:** Empty state dashboard, automated welcome notification, and initialized S3 buckets.
