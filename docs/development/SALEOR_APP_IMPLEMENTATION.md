# VNPay Saleor Payment App - Architecture Implementation

## 📋 Overview

This is a complete implementation of a VNPay payment app for Saleor following the official Saleor Apps architecture pattern (based on the Stripe app).

## 🏗️ Architecture

### Folder Structure

```
src/
├── modules/                           # Business logic modules
│   ├── payment-app-configuration/    # Configuration management
│   │   ├── config-manager.ts         # CRUD operations
│   │   ├── input-schemas.ts          # Zod validation schemas
│   │   └── metadata-manager.ts       # Saleor metadata storage
│   └── payment-provider/             # Payment provider integration
│       └── vnpay-provider.ts         # VNPay client wrapper
├── pages/
│   ├── api/
│   │   ├── vnpay-configuration.ts    # Configuration API
│   │   ├── test-vnpay-connection.ts  # Test endpoint
│   │   └── webhooks/
│   │       └── vnpay-transaction-initialize-session.ts
│   └── vnpay-config.tsx              # Configuration UI page
├── lib/
│   ├── create-graphql-client.ts      # URQL client helper
│   └── vnpay/                        # VNPay API library
│       ├── vnpay-api.ts
│       └── types.ts
└── graphql/
    ├── GetAppMetadata.graphql
    └── UpdatePrivateMetadata.graphql
```

## 🚀 Key Features

### 1. Configuration Management

**Storage**: Saleor App Private Metadata (not localStorage)
**Validation**: Zod schemas for type safety
**Multi-config**: Support multiple configurations per app

```typescript
// Example configuration entry
{
  configurationId: "vnpay_12345",
  configurationName: "Sandbox Config",
  partnerCode: "9BPJ5NYM",
  accessKey: "YOUR_ACCESS_KEY",
  secretKey: "YOUR_SECRET_KEY",
  redirectUrl: "https://your-store.com/api/vnpay/return",
  ipnUrl: "https://your-store.com/api/vnpay/ipn",
  environment: "sandbox",
  channelId: "Q2hhbm5lbDox" // Optional channel assignment
}
```

### 2. Configuration UI (`/vnpay-config`)

**Features**:
- ✅ Add/Edit/Delete configurations
- ✅ Test connection button
- ✅ Environment selection (sandbox/production)
- ✅ Form validation
- ✅ Macaw UI components (Saleor design system)
- ✅ Error handling

**Access**: Available in Saleor Dashboard under Extensions → VNPay Configuration

### 3. API Endpoints

#### `GET /api/vnpay-configuration`
Get all configurations

#### `POST /api/vnpay-configuration`
Create new configuration

**Request**:
```json
{
  "configurationName": "Production Config",
  "partnerCode": "YOUR_CODE",
  "accessKey": "YOUR_KEY",
  "secretKey": "YOUR_SECRET",
  "redirectUrl": "https://...",
  "ipnUrl": "https://...",
  "environment": "production"
}
```

#### `PUT /api/vnpay-configuration`
Update existing configuration

**Request**:
```json
{
  "configurationId": "vnpay_12345",
  "configurationName": "Updated Name"
}
```

#### `DELETE /api/vnpay-configuration?id=vnpay_12345`
Delete configuration

#### `POST /api/test-vnpay-connection`
Test VNPay connectivity

**Request**:
```json
{
  "configurationId": "vnpay_12345"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Connection successful. Credentials are valid.",
  "configuration": {
    "name": "Sandbox Config",
    "environment": "sandbox",
    "partnerCode": "9BPJ5NYM"
  }
}
```

### 4. Webhook Handler

**Improved Architecture**:
- Uses configuration manager
- Supports channel-based config selection
- Fallback to default config
- Proper error handling
- Detailed logging

**Example**: [`vnpay-transaction-initialize-session.ts`](src/pages/api/webhooks/vnpay-transaction-initialize-session.ts)

## 📦 Installation

### 1. Install Dependencies

```bash
cd /Users/paco/Documents/Projects/saleor-app-template
pnpm install
```

This will install the new dependency: `zod@^3.22.4`

### 2. Generate GraphQL Types

```bash
pnpm run generate
```

This will generate TypeScript types from your GraphQL documents.

### 3. Start Development Server

```bash
pnpm run dev
```

### 4. Install in Saleor Dashboard

1. Open your Saleor Dashboard
2. Go to Apps → Install External App
3. Enter your app's manifest URL: `http://localhost:3000/api/manifest`
4. Authorize the app

### 5. Configure VNPay

1. In Dashboard, go to Extensions → VNPay Configuration
2. Click "Add Configuration"
3. Fill in your VNPay credentials:
   - Configuration Name: "Sandbox Config"
   - Partner Code: Your VNPay `vnp_TmnCode`
   - Access Key: Your access key
   - Secret Key: Your `vnp_HashSecret`
   - Redirect URL: `https://your-domain.com/api/vnpay/return`
   - IPN URL: `https://your-domain.com/api/vnpay/ipn`
   - Environment: Sandbox
4. Click "Test Connection" to verify
5. Click "Save Configuration"

## 🔧 Usage

### In Payment Webhooks

```typescript
import { VNPayConfigManager } from "@/modules/payment-app-configuration/config-manager";
import { VNPayProviderClient } from "@/modules/payment-provider/vnpay-provider";

// In your webhook handler
const configManager = new VNPayConfigManager(client, appId);

// Get config for specific channel
let config = await configManager.getConfigurationByChannelId(channelId);

// Or use default config
if (!config) {
  config = await configManager.getDefaultConfiguration();
}

// Initialize provider
const providerClient = new VNPayProviderClient(config);

// Create payment
const result = await providerClient.createPayment({
  orderId: "ORDER_123",
  amount: 100000,
  currency: "VND",
  orderInfo: "Test payment",
  ipAddress: "127.0.0.1",
});
```

### Assigning Configs to Channels

Currently, you can set `channelId` when creating a configuration:

```typescript
await configManager.addConfiguration({
  configurationName: "Channel UK Config",
  partnerCode: "...",
  // ... other fields
  channelId: "Q2hhbm5lbDox", // Specific channel
});
```

**Future Enhancement**: Add UI for channel mapping (similar to Adyen).

## 🆚 Comparison: Old vs New Architecture

| Aspect | Old (localStorage) | New (Metadata) |
|--------|-------------------|----------------|
| Storage | Client-side localStorage | Saleor metadata (server-side) |
| Persistence | Lost on browser clear | Permanent |
| Multi-instance | ❌ Per browser | ✅ Shared across all instances |
| Validation | Manual | ✅ Zod schema validation |
| Type Safety | Basic | ✅ Full TypeScript |
| Architecture | Monolithic | ✅ Module-based |
| Testability | Limited | ✅ Easy to test |
| Channel Support | No | ✅ Yes |
| Multi-config | Manual | ✅ Built-in |

## 📝 Code Examples

### Create Configuration Programmatically

```typescript
import { VNPayConfigManager } from "@/modules/payment-app-configuration/config-manager";

const configManager = new VNPayConfigManager(client, appId);

const newConfig = await configManager.addConfiguration({
  configurationName: "Production VNPay",
  partnerCode: "PROD123",
  accessKey: "access_key_here",
  secretKey: "secret_key_here",
  redirectUrl: "https://store.com/api/vnpay/return",
  ipnUrl: "https://store.com/api/vnpay/ipn",
  environment: "production",
});

console.log("Created config:", newConfig.configurationId);
```

### Test Payment Provider

```typescript
import { VNPayProviderClient } from "@/modules/payment-provider/vnpay-provider";

const provider = new VNPayProviderClient(config);

// Test connection
const test = await provider.testConnection();
console.log(test.success ? "✅ Connected" : "❌ Failed");

// Create payment
const payment = await provider.createPayment({
  orderId: "TEST_001",
  amount: 50000,
  currency: "VND",
  orderInfo: "Test Order",
  ipAddress: "127.0.0.1",
});

console.log("Payment URL:", payment.paymentUrl);
```

### Query Payment Status

```typescript
const result = await provider.queryPayment({
  orderId: "TEST_001",
  transactionDate: "20240315",
  ipAddress: "127.0.0.1",
});

console.log("Payment status:", result.paid ? "PAID" : "PENDING");
```

## 🧪 Testing

### Test Connection

1. Open configuration page
2. Select a configuration
3. Click "Test Connection"
4. Result will show connection status

### Test Payment Flow

1. Use the existing test page: `http://localhost:3000/vnpay-test`
2. Or use debug console: `http://localhost:3000/vnpay-debug`

## 🔐 Security Best Practices

1. **Never expose secret keys**: API responses exclude `secretKey`
2. **Use HTTPS**: Always use HTTPS in production
3. **Validate signatures**: Always verify IPN signatures
4. **Metadata encryption**: Consider encrypting sensitive metadata
5. **Permission checks**: Webhook handlers verify app permissions

## 📚 Additional Documentation

- [PAYMENT_APP_ARCHITECTURE.md](PAYMENT_APP_ARCHITECTURE.md) - Detailed architecture guide
- [VNPAY_CONFIGURATION.md](VNPAY_CONFIGURATION.md) - VNPay specific configuration
- [README_VNPAY.md](README_VNPAY.md) - VNPay integration guide

## 🎯 Next Steps

1. **Generate GraphQL types**: `pnpm run generate`
2. **Install dependencies**: `pnpm install`
3. **Start dev server**: `pnpm run dev`
4. **Install in Saleor**: Add app to Dashboard
5. **Configure VNPay**: Add credentials in config page
6. **Test connection**: Use "Test Connection" button
7. **Test payment**: Create test checkout in Saleor

## 🐛 Troubleshooting

### Configuration not saving

**Issue**: Configurations disappear after refresh  
**Solution**: You're using the old localStorage version. Use `/vnpay-config` page instead of `/configuration`

### Test connection fails

**Issue**: "Connection failed"  
**Solution**: 
- Verify your VNPay credentials
- Check if you're using correct environment (sandbox vs production)
- Ensure your partner code and secret key match

### Webhook not receiving events

**Issue**: Payment initialization doesn't trigger  
**Solution**:
- Check webhook is registered in manifest
- Verify app has correct permissions (HANDLE_PAYMENTS)
- Check Saleor logs for webhook errors

## 📞 Support

For VNPay specific issues:
- VNPay Documentation: https://sandbox.vnpayment.vn/apis/docs/
- VNPay Support: support@vnpay.vn

For Saleor app issues:
- Saleor Docs: https://docs.saleor.io/docs/3.x/developer/extending/apps/
- Saleor Discord: https://discord.gg/H52JTZAtSH

---

**Built with** ❤️ **following Saleor official app architecture**
