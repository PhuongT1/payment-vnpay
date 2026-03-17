<div align="center">
  <h1>🇻🇳 VNPay Payment Gateway</h1>
  <p><strong>Production-ready VNPay integration for Saleor Commerce Platform</strong></p>
</div>

<div align="center">
  <a href="https://vercel.com/new/clone">
    <img src="https://vercel.com/button" alt="Deploy with Vercel" />
  </a>
  <a href="https://railway.app/new/template">
    <img src="https://railway.app/button.svg" alt="Deploy on Railway" />
  </a>
</div>

<br />

<div align="center">
  <a href="https://saleor.io/">Saleor</a>
  <span> | </span>
  <a href="https://vnpay.vn/">VNPay</a>
  <span> | </span>
  <a href="docs/deployment/DEPLOYMENT_GUIDE.md">Deployment Guide</a>
  <span> | </span>
  <a href="docs/architecture/PAYMENT_APP_ARCHITECTURE.md">Architecture</a>
</div>

<br />

> [!NOTE]
> **Enterprise-grade payment integration** with multi-channel support, persistent configuration, and production security.

## ✨ Features

- 💳 **VNPay Integration** - Complete payment gateway implementation
- 🏪 **Multi-Channel Support** - Different VNPay credentials per sales channel
- 💾 **Persistent Storage** - Configurations saved via Saleor Metadata API
- 🔐 **Production Security** - Security headers, HTTPS enforcement, validation
- 📱 **Responsive UI** - Mobile-friendly configuration dashboard
- 🌐 **Environment Switching** - Sandbox ↔ Production toggle
- ✅ **Form Validation** - React Hook Form + Zod type-safe validation
- 📊 **Real-time Data** - Dynamic channel/permission loading from Saleor API

## 🚀 Quick Start

### Prerequisites

- **Node.js** >=22.0.0
- **pnpm** >=10.0.0
- **Saleor** >=3.20
- **VNPay Account** ([Register here](http://sandbox.vnpayment.vn/devreg/))

### 1. Deploy to Cloud

**Option A: Vercel** (Recommended)

```bash
npm i -g vercel
vercel deploy --prod
```

**Option B: Railway**

```bash
railway up
```

### 2. Install to Saleor Dashboard

1. Go to **Saleor Dashboard** → **Apps**
2. Click **Install external app**
3. Enter manifest URL: `https://your-app.vercel.app/api/manifest`
4. Grant required permissions
5. Install!

### 3. Configure VNPay

1. Open installed app in Dashboard
2. Click **Add new configuration**
3. Enter VNPay credentials:
   - **TMN Code**: Your VNPay Terminal/Merchant Code
   - **Hash Secret**: Your VNPay Hash Secret Key
4. Assign to channels
5. Save configuration

🎉 **Done!** VNPay is now active on selected channels.

---

## 🛠️ Local Development

### Install Dependencies

```bash
pnpm install
```

### Configure Environment

Create `.env` file:

```bash
# Required
NEXT_PUBLIC_SALEOR_API_URL=https://your-saleor.com/graphql/
APP_API_BASE_URL=http://localhost:3000

# Optional (can configure via UI)
VNPAY_ENVIRONMENT=sandbox
VNPAY_TMN_CODE=YOUR_TEST_CODE
VNPAY_HASH_SECRET=YOUR_TEST_SECRET
```

See [.env.example](.env.example) for all options.

### Start Dev Server

```bash
pnpm dev
# Open http://localhost:3000
```

### Expose to Internet (for Saleor integration)

Use tunneling tools:

```bash
# Using ngrok
ngrok http 3000

# Using localtunnel
npx localtunnel --port 3000
```

### Install App to Saleor

```
https://your-saleor-dashboard.com/apps/install?manifestUrl=https://your-tunnel-url.ngrok.io/api/manifest
```

---

## 📁 Project Structure

```
saleor-app-template/
├── src/
│   ├── components/
│   │   ├── common/           # Reusable form components
│   │   │   ├── TextField.tsx
│   │   │   ├── SelectField.tsx
│   │   │   └── FormField.tsx
│   │   └── ...
│   ├── hooks/
│   │   ├── useChannels.ts    # Fetch Saleor channels
│   │   └── useMetadata.ts    # VNPay config CRUD
│   ├── layouts/
│   │   ├── MainLayout.tsx    # Shared layout wrapper
│   │   └── PageContainer.tsx # Responsive container
│   ├── lib/
│   │   ├── saleor/
│   │   │   ├── metadata-service.ts  # Metadata API
│   │   │   └── channels-service.ts  # Channels API
│   │   ├── validation/
│   │   │   └── vnpay-config.schema.ts  # Zod schemas
│   │   └── env-validator.ts  # Environment validation
│   └── pages/
│       ├── index.tsx         # Configuration UI
│       └── api/
│           ├── manifest.ts   # App manifest
│           └── ...
├── graphql/
│   ├── queries/              # GraphQL queries
│   └── mutations/            # GraphQL mutations
├── docs/                     # Documentation
│   ├── architecture/
│   ├── deployment/
│   ├── vnpay/
│   └── development/
└── public/                   # Static assets
```

---

## 📖 Documentation

- **[Deployment Guide](docs/deployment/DEPLOYMENT_GUIDE.md)** - Production deployment steps
- **[Getting Started](docs/deployment/GETTING_STARTED.md)** - Initial setup guide
- **[Architecture](docs/architecture/PAYMENT_APP_ARCHITECTURE.md)** - System architecture
- **[VNPay Integration](docs/vnpay/)** - VNPay-specific documentation
- **[Testing Guide](docs/development/TESTING.md)** - Testing workflows

---

## 🧪 Testing

### Type Checking

```bash
pnpm check-types
```

### Linting

```bash
pnpm lint
```

### Run Tests

```bash
pnpm test
```

### Test Payment Flow

1. Create test order in Saleor storefront
2. Select VNPay as payment method
3. Complete payment on VNPay sandbox page
4. Verify payment status in Saleor Dashboard

**VNPay Test Cards**: See [VNPay Sandbox Guide](docs/vnpay/VNPAY_SANDBOX_TEST.md)

---

## 🔐 Security Features

- ✅ **HTTPS Enforcement** (via Vercel/Railway)
- ✅ **Security Headers** (CSP, X-Frame-Options, XSS Protection)
- ✅ **Environment Validation** (validates required vars on startup)
- ✅ **Form Validation** (React Hook Form + Zod schemas)
- ✅ **Server-side Storage** (Saleor Metadata API, not localStorage)
- ✅ **Permission-based Access** (Saleor Dashboard permissions)

---

## 🌐 VNPay Environments

### Sandbox (Testing)

- **Dashboard**: http://sandbox.vnpayment.vn/
- **Register**: http://sandbox.vnpayment.vn/devreg/
- **Support**: 1900 55 55 77

### Production

- **Website**: https://vnpay.vn/
- **Support**: hotrovnpay@vnpay.vn | 1900 55 55 77

Toggle environment in `.env`:
```bash
VNPAY_ENVIRONMENT=production  # or sandbox
```

---

## 📊 Technology Stack

- **Framework**: Next.js 15
- **UI Library**: Material UI (@saleor/macaw-ui)
- **Form Management**: React Hook Form + Zod
- **API Client**: urql (GraphQL)
- **Language**: TypeScript (strict mode)
- **Package Manager**: pnpm
- **Deployment**: Vercel / Railway

---

## 🔄 Development Workflow

### 1. Make Changes

```bash
git checkout -b feature/your-feature
# Make changes...
```

### 2. Validate

```bash
pnpm check-types      # TypeScript
pnpm lint             # ESLint
pnpm test             # Vitest
```

### 3. Deploy

```bash
git push origin feature/your-feature
# Create PR → Auto-deploy preview (Vercel)
```

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/name`
3. Commit changes: `git commit -m 'Description'`
4. Push: `git push origin feature/name`
5. Open Pull Request

---

## 📝 License

BSD-3-Clause AND CC-BY-4.0

---

## 📞 Support

**VNPay**: 1900 55 55 77 | hotrovnpay@vnpay.vn  
**Saleor**: https://docs.saleor.io/ | https://discord.gg/H52JTZAtSH

---

<div align="center">
  <p><strong>Built with ❤️ for Vietnam e-commerce</strong></p>
</div>
