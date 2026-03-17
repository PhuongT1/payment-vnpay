# VNPay Payment App - Deployment Guide

## 🚀 Quick Deploy

### Option 1: Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/vnpay-payment-app)

1. Click "Deploy" button above
2. Connect your GitHub account
3. Configure environment variables:
   - `NEXT_PUBLIC_SALEOR_API_URL`: Your Saleor GraphQL endpoint
   - `APP_API_BASE_URL`: Will be auto-set to your Vercel URL
4. Deploy!

### Option 2: Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

1. Click "Deploy on Railway"
2. Configure environment variables (same as Vercel)
3. Deploy!

---

## 📋 Pre-Deployment Checklist

### Required Environment Variables

```bash
# REQUIRED
NEXT_PUBLIC_SALEOR_API_URL=https://your-store.saleor.cloud/graphql/
APP_API_BASE_URL=https://your-app-domain.com

# OPTIONAL (can configure via UI)
VNPAY_ENVIRONMENT=production
VNPAY_TMN_CODE=YOUR_CODE
VNPAY_HASH_SECRET=YOUR_SECRET
```

### Build Test

```bash
# Test build locally before deploying
pnpm build
pnpm start

# Should start on http://localhost:3000
```

---

## 🔧 Deployment Steps

### 1. Prepare Environment

Create `.env.production` file:

```bash
NEXT_PUBLIC_SALEOR_API_URL=https://your-production-saleor.com/graphql/
APP_API_BASE_URL=https://your-app.vercel.app
APP_IFRAME_BASE_URL=https://your-app.vercel.app
VNPAY_ENVIRONMENT=production
```

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### 3. Configure Saleor Dashboard

1. Go to Saleor Dashboard → Apps → Install external app
2. Enter manifest URL: `https://your-app.vercel.app/api/manifest`
3. Grant required permissions:
   - MANAGE_ORDERS
   - HANDLE_PAYMENTS
   - MANAGE_CHECKOUTS
   - MANAGE_CHANNELS
4. Install app

### 4. Configure VNPay

Option A: Via Environment Variables (recommended for production)
```bash
VNPAY_TMN_CODE=YOURCODE
VNPAY_HASH_SECRET=YOURSECRET
VNPAY_ENVIRONMENT=production
```

Option B: Via Dashboard UI
1. Open app in Saleor Dashboard
2. Click "Add new configuration"
3. Enter your VNPay production credentials
4. Assign to channels

---

## 🔐 Security

### Production Checklist

- [ ] Use HTTPS URLs only (enforced by Vercel/Railway)
- [ ] Set production VNPay credentials
- [ ] Enable security headers (already in vercel.json)
- [ ] Test payment flow end-to-end
- [ ] Monitor error logs
- [ ] Set up uptime monitoring

### Environment Variables Security

**DO NOT** commit `.env` files to git!

✅ Safe:
- `.env.example` (template with placeholders)
- `.env.local` (auto-ignored by git)

❌ Dangerous:
- `.env` with real credentials
- `.env.production` with secrets

---

## 🧪 Testing After Deployment

### 1. Test Manifest URL

```bash
curl https://your-app.vercel.app/api/manifest
# Should return JSON with app info
```

### 2. Test in Saleor Dashboard

1. Install app from manifest URL
2. Check if app appears in Apps list
3. Open app configuration page
4. Test creating VNPay config
5. Test assigning config to channel

### 3. Test Payment Flow

1. Create test order in Saleor
2. Select VNPay as payment method
3. Complete payment on VNPay page
4. Verify payment status in Saleor

---

## 🐛 Troubleshooting

### Manifest URL not working

**Issue**: `Error resolving manifest file`

**Fix**:
1. Check `APP_API_BASE_URL` is set correctly
2. Ensure URL is absolute (https://...)
3. Check build succeeded without errors

### Cannot save configuration

**Issue**: Config not persisting

**Fix**:
1. Check app has `MANAGE_CHANNELS` permission
2. Verify Saleor API URL is correct
3. Check browser console for errors

### Channels not loading

**Issue**: Empty channel list

**Fix**:
1. Check `NEXT_PUBLIC_SALEOR_API_URL` is set
2. Verify API endpoint is accessible
3. Check CORS settings in Saleor

---

## 📊 Monitoring

### Vercel

- View deployment logs: `vercel logs`
- Check analytics: Vercel Dashboard → Analytics
- Error tracking: Integrate Sentry (optional)

### Railway

- View logs: Railway Dashboard → Deployments → Logs
- Monitor resource usage: Dashboard → Metrics

---

## 🔄 Updating

### Deploy Updates

```bash
# Pull latest changes
git pull origin main

# Deploy
vercel --prod

# Or auto-deploy via GitHub integration
```

### Rollback

```bash
# Vercel
vercel rollback

# Railway
# Use Railway Dashboard → Deployments → Rollback
```

---

## 📞 Support

- **VNPay Sandbox**: http://sandbox.vnpayment.vn/devreg/
- **VNPay Production**: hotrovnpay@vnpay.vn | 1900 55 55 77
- **Saleor Docs**: https://docs.saleor.io/
- **Vercel Support**: https://vercel.com/support
- **Railway Support**: https://railway.app/help

---

**Last Updated**: March 17, 2026
