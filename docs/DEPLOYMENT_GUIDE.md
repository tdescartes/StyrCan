# Production Deployment Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Migrations](#database-migrations)
4. [Docker Deployment](#docker-deployment)
5. [Kubernetes Deployment](#kubernetes-deployment)
6. [Monitoring & Logging](#monitoring--logging)
7. [Backup & Recovery](#backup--recovery)
8. [Security Checklist](#security-checklist)
9. [Performance Optimization](#performance-optimization)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Services

- **PostgreSQL 16+** (Primary database)
- **MongoDB 7.0+** (Audit logs, messaging)
- **Redis 7+** (Caching, sessions, Celery broker)
- **AWS S3** (File storage)
- **SMTP Service** (SendGrid or similar for emails)

### Required Tools

- Docker 24+ & Docker Compose
- kubectl (for Kubernetes deployment)
- Python 3.11+
- Node.js 20+

### External Services

- Stripe account (payment processing)
- SendGrid account (transactional emails)
- AWS account (S3 storage)
- Sentry account (error monitoring - optional but recommended)

---

## Environment Setup

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# Application
APP_NAME=Pulse
APP_VERSION=1.0.0
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=<generate-secure-random-key-minimum-32-characters>

# Database
DATABASE_URL=postgresql://user:password@host:5432/pulse_db
MONGODB_URL=mongodb://user:password@host:27017/pulse_logs?authSource=admin

# Redis
REDIS_URL=redis://host:6379/0

# AWS S3
AWS_ACCESS_KEY_ID=<your-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
AWS_REGION=us-east-1
S3_BUCKET_NAME=pulse-production-files

# Stripe
STRIPE_SECRET_KEY=sk_live_<your-stripe-key>
STRIPE_PUBLISHABLE_KEY=pk_live_<your-stripe-key>
STRIPE_WEBHOOK_SECRET=whsec_<your-webhook-secret>

# SendGrid
SENDGRID_API_KEY=SG.<your-sendgrid-key>
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Pulse

# Sentry (Optional)
SENTRY_DSN=<your-sentry-dsn>

# CORS
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Frontend Environment Variables

Create a `.env.production` file in the `frontend/` directory:

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_<your-stripe-key>
```

### Generating Secure Secret Key

```bash
# Python method
python -c "import secrets; print(secrets.token_urlsafe(32))"

# OpenSSL method
openssl rand -base64 32
```

---

## Database Migrations

### Initial Setup

1. **Ensure PostgreSQL is accessible:**

```bash
psql -h <host> -U <user> -d pulse_db -c "SELECT version();"
```

2. **Run Alembic migrations:**

```bash
cd backend
alembic upgrade head
```

3. **Verify migrations:**

```bash
alembic current
alembic history
```

### Creating New Migrations

```bash
# Auto-generate migration from model changes
alembic revision --autogenerate -m "Description of changes"

# Manual migration
alembic revision -m "Manual migration description"

# Apply migration
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

---

## Docker Deployment

### Development Environment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop all services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build
```

### Production Deployment

1. **Update docker-compose.prod.yml:**

```yaml
version: "3.8"

services:
  backend:
    image: ghcr.io/yourorg/pulse-backend:latest
    restart: always
    env_file:
      - .env.production
    expose:
      - "8000"
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: "1.0"
          memory: 1G
        reservations:
          cpus: "0.5"
          memory: 512M

  frontend:
    image: ghcr.io/yourorg/pulse-frontend:latest
    restart: always
    env_file:
      - .env.production
    expose:
      - "3000"
    deploy:
      replicas: 2

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
      - frontend
```

2. **Deploy:**

```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## Kubernetes Deployment

### Prerequisites

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Verify cluster connection
kubectl cluster-info
kubectl get nodes
```

### Deploy to Kubernetes

1. **Create namespace:**

```bash
kubectl apply -f kubernetes/namespace.yaml
```

2. **Create secrets:**

```bash
kubectl create secret generic pulse-secrets \
  --from-literal=database-url=postgresql://... \
  --from-literal=secret-key=... \
  --from-literal=stripe-key=... \
  -n pulse
```

3. **Apply configurations:**

```bash
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/postgres-pv.yaml
kubectl apply -f kubernetes/postgres-deployment.yaml
kubectl apply -f kubernetes/mongodb-deployment.yaml
kubectl apply -f kubernetes/redis-deployment.yaml
kubectl apply -f kubernetes/backend-deployment.yaml
kubectl apply -f kubernetes/frontend-deployment.yaml
kubectl apply -f kubernetes/ingress.yaml
```

4. **Verify deployment:**

```bash
kubectl get pods -n pulse
kubectl get services -n pulse
kubectl get ingress -n pulse
```

5. **View logs:**

```bash
kubectl logs -f deployment/pulse-backend -n pulse
kubectl logs -f deployment/pulse-frontend -n pulse
```

---

## Monitoring & Logging

### Sentry Setup

1. Create Sentry project at https://sentry.io
2. Copy DSN and add to environment variables
3. Verify error tracking:

```bash
# Trigger test error
curl -X POST https://api.yourdomain.com/test-sentry
```

### Application Logs

Backend logs are stored in `backend/logs/`:

- `app.log` - General application logs
- `error.log` - Error logs only
- `audit.log` - Audit trail logs

### Health Checks

```bash
# Backend health
curl https://api.yourdomain.com/health

# Database connectivity
curl https://api.yourdomain.com/health/db

# Full system status
curl https://api.yourdomain.com/health/detailed
```

---

## Backup & Recovery

### Database Backup

```bash
# PostgreSQL backup
pg_dump -h <host> -U <user> -d pulse_db -F c -f backup_$(date +%Y%m%d).dump

# Automated daily backups (cron)
0 2 * * * /usr/bin/pg_dump -h localhost -U pulse -d pulse_db -F c -f /backups/pulse_$(date +\%Y\%m\%d).dump

# MongoDB backup
mongodump --uri="mongodb://user:pass@host:27017/pulse_logs" --out=/backups/mongo_$(date +%Y%m%d)
```

### Database Restore

```bash
# PostgreSQL restore
pg_restore -h <host> -U <user> -d pulse_db backup_20240101.dump

# MongoDB restore
mongorestore --uri="mongodb://user:pass@host:27017/pulse_logs" /backups/mongo_20240101/pulse_logs
```

### S3 File Backup

Files are already stored in S3 with versioning enabled. Configure S3 lifecycle policies:

```json
{
  "Rules": [
    {
      "Id": "ArchiveOldFiles",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
```

---

## Security Checklist

### Pre-Deployment

- [ ] All environment variables set with production values
- [ ] Secret keys generated with cryptographically secure methods
- [ ] Database passwords are strong (16+ characters, mixed case, numbers, symbols)
- [ ] CORS origins restricted to production domains
- [ ] Debug mode disabled (`DEBUG=false`)
- [ ] SSL/TLS certificates configured
- [ ] Firewall rules configured (only necessary ports open)
- [ ] Rate limiting enabled
- [ ] SQL injection prevention verified (parameterized queries)
- [ ] XSS prevention verified (proper output encoding)
- [ ] CSRF protection enabled
- [ ] File upload validation enabled (type, size, content)

### Post-Deployment

- [ ] Verify HTTPS everywhere (no mixed content)
- [ ] Test authentication flows
- [ ] Test authorization (role-based access)
- [ ] Verify 2FA functionality
- [ ] Test password reset flow
- [ ] Review Sentry for errors
- [ ] Check application logs for warnings
- [ ] Run security audit (OWASP ZAP, Burp Suite)
- [ ] Verify backup processes
- [ ] Test disaster recovery procedures

---

## Performance Optimization

### Backend Optimization

1. **Enable connection pooling:**

```python
# In database.py
engine = create_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=40,
    pool_pre_ping=True,
    pool_recycle=3600
)
```

2. **Configure Redis caching:**

```python
# Cache frequently accessed data
@cache.cached(timeout=300, key_prefix='company_stats')
def get_company_statistics(company_id):
    # Expensive query
    pass
```

3. **Optimize database queries:**

```python
# Use eager loading
employees = db.query(Employee).options(
    joinedload(Employee.department),
    joinedload(Employee.payroll)
).all()
```

### Frontend Optimization

1. **Enable Next.js optimizations in `next.config.ts`:**

```typescript
const config = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  images: {
    domains: ["yourdomain.com"],
    formats: ["image/avif", "image/webp"],
  },
};
```

2. **Implement code splitting:**

```typescript
// Dynamic imports
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
});
```

### CDN Configuration

Use CloudFront or similar CDN for static assets:

- Cache frontend bundle files
- Cache images and media
- Set appropriate cache headers

---

## Troubleshooting

### Common Issues

**Issue: Database connection fails**

```bash
# Check PostgreSQL is running
systemctl status postgresql

# Verify connection string
psql $DATABASE_URL

# Check firewall rules
sudo ufw status
```

**Issue: Redis connection fails**

```bash
# Check Redis is running
redis-cli ping

# Verify connection
redis-cli -h <host> -p 6379 -a <password>
```

**Issue: File uploads fail**

```bash
# Verify S3 credentials
aws s3 ls s3://your-bucket-name --profile production

# Check IAM permissions
aws iam get-user-policy --user-name pulse-app --policy-name S3Access
```

**Issue: Emails not sending**

```bash
# Test SendGrid API key
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer $SENDGRID_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"personalizations":[{"to":[{"email":"test@example.com"}]}],"from":{"email":"noreply@yourdomain.com"},"subject":"Test","content":[{"type":"text/plain","value":"Test email"}]}'
```

### Logs Analysis

```bash
# Backend errors
tail -f backend/logs/error.log | grep ERROR

# Database slow queries
tail -f /var/log/postgresql/postgresql-16-main.log | grep "slow query"

# Nginx access logs
tail -f /var/log/nginx/access.log

# Docker container logs
docker-compose logs -f --tail=100 backend
```

### Performance Debugging

```bash
# Check database connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'pulse_db';

# Check Redis memory usage
redis-cli info memory

# Monitor CPU/Memory
htop
docker stats
```

---

## Post-Deployment Verification

1. **Functionality Tests:**
   - [ ] User registration
   - [ ] User login
   - [ ] Password reset
   - [ ] 2FA setup and verification
   - [ ] File upload
   - [ ] Report generation
   - [ ] Payment processing (Stripe)
   - [ ] Email delivery

2. **Performance Tests:**
   - [ ] Page load times < 2 seconds
   - [ ] API response times < 200ms
   - [ ] Database query times < 100ms
   - [ ] File upload speed acceptable

3. **Security Tests:**
   - [ ] SSL/TLS certificate valid
   - [ ] All API endpoints require authentication
   - [ ] Rate limiting working
   - [ ] CORS configured correctly
   - [ ] No sensitive data in logs

---

## Support & Maintenance

### Regular Maintenance Tasks

**Daily:**

- Monitor error logs
- Check Sentry for new errors
- Verify backup completion

**Weekly:**

- Review performance metrics
- Check disk space
- Update dependencies (if critical security patches)

**Monthly:**

- Full security audit
- Database maintenance (VACUUM, ANALYZE)
- Review and rotate logs
- Test disaster recovery

### Scaling Considerations

**Horizontal Scaling:**

- Add more backend pods/containers
- Use load balancer (Nginx, AWS ALB)
- Implement Redis Cluster for caching
- Use read replicas for PostgreSQL

**Vertical Scaling:**

- Increase container resources
- Upgrade database instance size
- Optimize application code

---

## Emergency Contacts

- **DevOps:** devops@yourdomain.com
- **Security:** security@yourdomain.com
- **On-Call:** +1-XXX-XXX-XXXX

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
