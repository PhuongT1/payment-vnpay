# Quick Start: MoMo Payment Integration

## Setup in 5 Minutes

### 1. Install Dependencies

```bash
cd saleor-app-template
pnpm install
```

### 2. Configure Environment

Create `.env` file:

```bash
cp .env.example .env
```

Add your MoMo credentials to `.env`:

```env
# MoMo Test Credentials (for development)
MOMO_PARTNER_CODE=MOMOBKUN20240101
MOMO_ACCESS_KEY=klm05TvNBzhg7h7j
MOMO_SECRET_KEY=at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa
MOMO_ENDPOINT=https://test-payment.momo.vn

# Your storefront URL
STOREFRONT_URL=http://localhost:3000
```

### 3. Generate Types

```bash
pnpm generate
```

### 4. Start Development Server

```bash
pnpm dev
```

App runs at: `http://localhost:3000`

### 5. Expose Local Server (for testing)

Use ngrok to expose your local server:

```bash
# Install ngrok if you haven't
brew install ngrok  # on macOS
# or download from https://ngrok.com/download

# Expose port 3000
ngrok http 3000
```

Copy the ngrok URL (e.g., `https://abc123.ngrok.io`) and update `.env`:

```env
APP_API_BASE_URL=https://abc123.ngrok.io
APP_IFRAME_BASE_URL=https://abc123.ngrok.io
```

### 6. Install App in Saleor

1. Go to your Saleor Dashboard → Apps
2. Click "Install External App"
3. Enter manifest URL: `https://abc123.ngrok.io/api/manifest`
4. Click "Install" and authorize

### 7. Test Payment Flow

1. Go to your storefront
2. Add products to cart
3. Go to checkout
4. The MoMo payment option should appear
5. Complete payment using MoMo test account

## MoMo Test Account

Use these test credentials in MoMo payment page:

- **Phone**: 0399888999
- **OTP**: 123456

Or scan the QR code with MoMo app (test mode).

## Webhook Endpoints

After installation, these webhooks will be registered:

- **Transaction Initialize**: `/api/webhooks/transaction-initialize-session`
- **Transaction Process**: `/api/webhooks/transaction-process-session`
- **Transaction Charge**: `/api/webhooks/transaction-charge-requested`
- **Transaction Refund**: `/api/webhooks/transaction-refund-requested`
- **Transaction Cancel**: `/api/webhooks/transaction-cancelation-requested`

## Additional Endpoints

- **MoMo IPN Callback**: `/api/momo/ipn`
- **Payment Return URL**: `/api/momo/return`

## Verify Installation

### Check App is Installed

```bash
curl https://your-saleor-instance.com/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query": "{ apps { edges { node { id name isActive } } } }"}'
```

### Check Webhooks are Registered

In Saleor Dashboard:
1. Go to Apps → Your App
2. Click on "Webhooks" tab
3. You should see 5 transaction webhooks

### Test Transaction Initialize

Trigger a checkout in your storefront and watch the logs:

```bash
# In your terminal where pnpm dev is running
# You should see:
# "Transaction Initialize Session webhook triggered"
```

## Troubleshooting

### "Cannot connect to Saleor"
- Ensure ngrok is running
- Check `APP_API_BASE_URL` in `.env`
- Verify Saleor can reach your ngrok URL

### "Invalid MoMo signature"
- Double-check your MoMo credentials
- Ensure no extra spaces in `.env` values

### Webhooks not triggering
- Check webhook registration in Saleor Dashboard
- Verify permissions (HANDLE_PAYMENTS, MANAGE_CHECKOUTS)
- Check app logs for errors

## Next Steps

1. Read full documentation: [MOMO_INTEGRATION.md](./MOMO_INTEGRATION.md)
2. Test refund flow
3. Configure production credentials
4. Deploy to production (Vercel, Railway, etc.)

## Production Deployment

### Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Set production MoMo credentials
```

### Environment Variables (Production)

```env
MOMO_PARTNER_CODE=your_production_partner_code
MOMO_ACCESS_KEY=your_production_access_key
MOMO_SECRET_KEY=your_production_secret_key
MOMO_ENDPOINT=https://payment.momo.vn
STOREFRONT_URL=https://your-production-storefront.com
```

## Support

- **MoMo**: business@momo.vn / 1900 54 54 10
- **Saleor Discord**: https://discord.gg/H52JTZAtSH
- **Documentation**: [MOMO_INTEGRATION.md](./MOMO_INTEGRATION.md)
