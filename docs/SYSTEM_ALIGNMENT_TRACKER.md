# Pulse System Alignment & Authentication Fix Tracker

> **Created**: February 17, 2026  
> **Status**: In Progress  
> **Goal**: Fix auth, clear DBs, clean docs, align UI to backend

---

## Phase 1: Environment & Database Reset

- [ ] Start PostgreSQL, MongoDB, Redis
- [ ] Clear all PostgreSQL data (drop + recreate schema)
- [ ] Clear MongoDB data (drop pulse_logs database)
- [ ] Clear Redis cache (FLUSHALL)
- [ ] Verify backend starts without errors
- [ ] Verify tables recreated via SQLAlchemy init_db()

## Phase 2: Authentication Fix

- [ ] Test POST /api/auth/register (curl)
- [ ] Test POST /api/auth/login (curl)
- [ ] Test GET /api/auth/me with token
- [ ] Test token refresh flow
- [ ] Fix any backend auth issues found
- [ ] Fix any frontend auth issues found
- [ ] Verify full register → login → protected route → logout flow

## Phase 3: Documentation Cleanup

### Remove (outdated/completed migration docs)

- [ ] Delete docs/MIGRATION_PLAN.md
- [ ] Delete docs/FRONTEND_UPDATES_SUMMARY.md
- [ ] Delete docs/FRONTEND_BACKEND_ALIGNMENT.md
- [ ] Delete docs/FRONTEND_API_INTEGRATION.md
- [ ] Delete docs/IMPLEMENTATION_SUMMARY.md
- [ ] Delete docs/MULTI_TENANCY_IMPLEMENTATION_SUMMARY.md → consolidated into guide
- [ ] Delete docs/MULTI_TENANCY_IMPLEMENTATION.md → consolidated into guide
- [ ] Delete docs/MULTI_TENANCY_ARCHITECTURE.md → consolidated into guide
- [ ] Delete docs/Plan.md (original Vite/React plan, doesn't match Next.js system)

### Keep & Update

- [ ] Update docs/README.md (new TOC)
- [ ] Update docs/QUICKSTART.md
- [ ] Update docs/PROJECT_README.md (current status)
- [ ] Update docs/PRODUCT_SPECIFICATION.md (verify accuracy)
- [ ] Update docs/BACKEND_API_SPECIFICATION.md (verify all ~90 endpoints)
- [ ] Update docs/API_TESTING_GUIDE.md (verify examples work)
- [ ] Update docs/DEPLOYMENT_GUIDE.md
- [ ] Update docs/RBAC_AND_DB_CONSOLIDATION.md
- [ ] Update docs/DEVELOPMENT_ROADMAP.md
- [ ] Update docs/MARKET_READINESS_ROADMAP.md (mark completed phases)
- [ ] Update docs/MASTER_DATA_REFERENCE.md
- [ ] Update docs/MULTI_TENANCY_QUICK_REFERENCE.md

### Create New

- [ ] Create docs/MULTI_TENANCY_GUIDE.md (consolidated from 3 MT docs)

## Phase 4: UI–Backend Alignment

### Missing Pages to Create

- [ ] Notifications center page (/notifications)
- [ ] Employee self-service improvements (verify /employees/me views work)

### Existing Pages to Audit & Complete

- [ ] Dashboard (/) — verify uses all 3 dashboard endpoints
- [ ] Employees pages — verify CRUD + PTO approval + shift management
- [ ] Finance pages — verify transactions, categories, summary, trends
- [ ] Payroll pages — verify runs processing, items, mark-paid
- [ ] Communication pages — verify messaging + file management
- [ ] Settings/Security — verify 2FA setup/verify/disable UI
- [ ] Settings/Billing — verify subscription + invoices + usage UI
- [ ] Settings/Team — verify user invite/update/delete UI
- [ ] Reports — verify report generation + listing + download UI

## Phase 5: Testing & Validation

- [ ] Register new company → login → access all services
- [ ] RBAC: employee sees only self-service
- [ ] RBAC: manager sees management features
- [ ] RBAC: admin sees settings + billing
- [ ] No console errors on any page
- [ ] All forms validate properly

## Phase 6: Commit & Push

- [ ] git add, commit, push all changes

---

## Decisions Log

| Decision              | Choice                                | Reason                             |
| --------------------- | ------------------------------------- | ---------------------------------- |
| Docs cleanup strategy | Delete outdated, update core          | Remove noise, keep actionable docs |
| Self-service route    | Use existing /employees/me endpoints  | Already built in backend           |
| Notifications page    | Create new under (services)           | Backend has full notification API  |
| Multi-tenancy docs    | Consolidate 3 → 1 guide + 1 quickref  | Reduce duplication                 |
| Auth fix approach     | Test endpoints first, fix what breaks | Evidence-based debugging           |
