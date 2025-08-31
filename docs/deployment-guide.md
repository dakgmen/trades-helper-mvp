# Tradie Helper - Production Deployment Guide

## Overview

This guide covers deploying the Tradie Helper platform to production with:
- **Frontend**: React app deployed to Vercel
- **Backend**: Express.js API deployed to Railway
- **Database**: Supabase (PostgreSQL with real-time features)
- **Payments**: Stripe Connect for escrow payments
- **Storage**: Supabase Storage for file uploads

## Prerequisites

### Required Accounts & Services
1. **Vercel Account** - For frontend hosting
2. **Railway Account** - For backend API hosting  
3. **Supabase Project** - Database and storage
4. **Stripe Account** - Payment processing (with Connect enabled)

### Required CLI Tools
```bash
# Install Vercel CLI
npm install -g vercel

# Install Railway CLI  
npm install -g @railway/cli

# Optional: Supabase CLI for database management
npm install -g supabase
```

## Pre-Deployment Setup

### 1. Environment Configuration

Create production environment variables:

```bash
# Copy and edit the production environment file
cp .env.example .env.production
```

Update `.env.production` with your production values:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# Stripe Configuration (Live Keys)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Domain Configuration
FRONTEND_URL=https://your-app.vercel.app
```

### 2. Database Setup

Apply database schema and security policies:

```sql
-- 1. Run in Supabase SQL Editor
-- Apply schema
\i docs/database-schema.sql

-- Apply RLS policies
\i docs/rls-policies.sql

-- Setup storage buckets
\i docs/storage-setup.sql
```

### 3. Stripe Configuration

1. **Enable Stripe Connect** in your Stripe Dashboard
2. **Configure Webhooks** (add after deployment):
   - Endpoint: `https://your-api.railway.app/api/stripe/webhook`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `account.updated`
3. **Test with Stripe Test Mode** first

## Deployment Steps

### Automated Deployment

Use the deployment script for easy deployment:

```bash
# Make script executable
chmod +x scripts/deploy.sh

# Deploy to staging
./scripts/deploy.sh staging

# Deploy to production
./scripts/deploy.sh production
```

### Manual Deployment

#### 1. Deploy Frontend (Vercel)

```bash
# Build and deploy frontend
npm install
npm run build:prod
vercel --prod
```

#### 2. Deploy Backend (Railway)

```bash
# Deploy API server
cd api
npm install
railway up --environment production
```

### 3. Configure Environment Variables

#### Vercel Environment Variables:
```bash
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production  
vercel env add VITE_STRIPE_PUBLISHABLE_KEY production
```

#### Railway Environment Variables:
```bash
railway variables set SUPABASE_SERVICE_ROLE_KEY=your_key
railway variables set STRIPE_SECRET_KEY=sk_live_...
railway variables set STRIPE_WEBHOOK_SECRET=whsec_...
railway variables set FRONTEND_URL=https://your-app.vercel.app
```

## Post-Deployment Configuration

### 1. Update Stripe Webhook URLs

In Stripe Dashboard:
1. Go to **Developers → Webhooks**
2. Update endpoint URL to: `https://your-api.railway.app/api/stripe/webhook`
3. Test webhook delivery

### 2. Configure CORS

Update `FRONTEND_URL` in Railway to match your Vercel domain:
```bash
railway variables set FRONTEND_URL=https://tradie-helper.vercel.app
```

### 3. Set up Custom Domains (Optional)

#### Vercel Custom Domain:
1. Go to Vercel dashboard → Project Settings → Domains
2. Add your custom domain
3. Configure DNS records

#### Railway Custom Domain:
1. Go to Railway dashboard → Project Settings → Domains
2. Add custom domain for API
3. Update CORS settings

## Testing & Validation

### 1. Smoke Tests

Run these tests after deployment:

```bash
# Test API health
curl https://your-api.railway.app/api/health

# Test frontend loads
curl -I https://your-app.vercel.app
```

### 2. User Flow Testing

1. **Registration**: Create tradie and helper accounts
2. **Verification**: Test ID document upload
3. **Job Posting**: Create and publish jobs
4. **Applications**: Apply for jobs
5. **Payments**: Test escrow payment flow
6. **Messaging**: Test real-time messaging

### 3. Payment Testing

Use Stripe test cards:
```
Success: 4242424242424242
Decline: 4000000000000002
```

## Monitoring & Maintenance

### Error Tracking

Add Sentry for error monitoring:

```bash
# Install Sentry
npm install @sentry/react @sentry/node

# Configure in production
SENTRY_DSN=your_sentry_dsn
```

### Performance Monitoring

1. **Vercel Analytics**: Monitor frontend performance
2. **Railway Metrics**: Monitor API response times  
3. **Supabase Logs**: Monitor database queries
4. **Stripe Dashboard**: Monitor payment success rates

### Database Maintenance

```sql
-- Run monthly to clean up orphaned files
SELECT cleanup_orphaned_files();

-- Monitor storage usage
SELECT * FROM storage_usage_summary;
```

## Security Checklist

### Production Security Setup

- [ ] Environment variables stored securely (not in code)
- [ ] Stripe live keys configured (not test keys)
- [ ] HTTPS enforced on all domains
- [ ] CORS properly configured
- [ ] RLS policies enabled on all database tables
- [ ] File upload limits enforced
- [ ] Rate limiting enabled on API endpoints
- [ ] Error messages don't expose sensitive data

### Ongoing Security

- [ ] Regular dependency updates
- [ ] Monitor security alerts  
- [ ] Review access logs
- [ ] Rotate API keys quarterly
- [ ] Monitor failed authentication attempts

## Troubleshooting

### Common Issues

#### Frontend Issues:
- **Build failures**: Check TypeScript errors with `npm run typecheck`
- **Environment variables**: Ensure all VITE_ prefixed variables are set
- **Routing issues**: Check vercel.json configuration

#### Backend Issues:
- **500 errors**: Check Railway logs for detailed error messages
- **CORS errors**: Verify FRONTEND_URL environment variable
- **Database connection**: Test Supabase service role key

#### Payment Issues:
- **Webhook failures**: Check Stripe webhook logs
- **Connect issues**: Verify Stripe Connect is enabled
- **Test vs Live mode**: Ensure consistent key usage

### Getting Help

1. **Check logs**: Vercel and Railway provide detailed deployment logs
2. **Monitor errors**: Use browser dev tools and server logs
3. **Test locally**: Reproduce issues in development environment
4. **Documentation**: Refer to Stripe, Supabase, and platform docs

## Scaling Considerations

### Performance Optimization

- **CDN**: Vercel provides global CDN automatically
- **Database**: Consider read replicas for high traffic
- **Caching**: Implement Redis for session storage
- **File Storage**: Consider CDN for file uploads

### Infrastructure Scaling

- **API**: Railway auto-scales based on traffic
- **Database**: Supabase handles scaling automatically
- **Monitoring**: Set up alerts for high usage

---

## Support

For deployment issues:
1. Check the troubleshooting section above
2. Review platform-specific documentation
3. Test changes in staging environment first