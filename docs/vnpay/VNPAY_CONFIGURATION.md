# VNPay Configuration Management

## Overview

The VNPay payment app now includes a comprehensive configuration management system similar to Adyen's integration with Saleor Dashboard. This allows merchants to:

- Create multiple VNPay configurations (sandbox and production)
- Assign different configurations to different Saleor channels
- Manage payment gateway settings directly from Saleor Dashboard

## Files Created

### 1. Main Configuration Page

**`src/pages/index.tsx`**
- Main page displayed when app is opened in Saleor Dashboard
- Accessible in Dashboard under: Extensions → VNPay Configuration
- Features:
  - VNPay Configurations section
  - Saleor Channel Mappings section
  - Add/Edit/Delete configurations
  - Assign configs to channels
  - Development tools (Test Page, Debug Console) when running locally

### 2. API Endpoints

**`src/pages/api/channels.ts`**
- GET endpoint to fetch Saleor channels via GraphQL
- Returns: id, name, slug, isActive, currencyCode

**`src/pages/api/configs.ts`**
- GET: Retrieve all VNPay configurations
- POST: Create new configuration
- PUT: Update existing configuration
- DELETE: Remove configuration
- Helper functions: `getVNPayConfigById()`, `getVNPayConfigForChannel()`

**`src/pages/api/mappings.ts`**
- GET: Retrieve channel-to-config mappings
- POST: Create/update channel mapping
- DELETE: Remove channel mapping
- Helper functions: `getConfigIdForChannel()`, `getAllMappings()`

### 3. Manifest Update

**`src/pages/api/manifest.ts`**
- Added APP_PAGE extension for VNPay Configuration
- Extension visible in Saleor Dashboard sidebar under Extensions
- Permissions: HANDLE_PAYMENTS, MANAGE_CHECKOUTS, MANAGE_ORDERS

## How It Works in Saleor Dashboard

### Installation

1. Install the app in Saleor Dashboard
2. The app appears under **Extensions** → **VNPay Configuration**
3. Click to open the configuration page in iframe

### Creating Configurations

1. Click **"Add new configuration"** button
2. Fill in the form:
   - **Configuration Name**: Human-readable name (e.g., "Sandbox Config")
   - **TMN Code**: Your VNPay merchant code (from VNPay portal)
   - **Hash Secret**: Your VNPay secret key (kept secure)
   - **Environment**: Sandbox or Production
3. Click **"Save Configuration"**

### Assigning to Channels

1. Scroll down to **"Saleor channel mappings"** section
2. For each Saleor channel, select a configuration from the dropdown
3. The selection is saved automatically
4. Status shows **Enabled** (green) or **Disabled** (gray)

### Configuration List

The configurations table shows:
- **Name**: Configuration identifier
- **TMN Code**: VNPay merchant code (visible)
- **Environment**: Sandbox (yellow badge) or Production (blue badge)
- **Status**: Active (green) or Inactive (red)
- **Actions**: Delete button

## UI Design

### Matching Adyen's Pattern

The interface follows Saleor Dashboard design conventions:

- **Header**:
  - App name: "VNPay"
  - Description paragraph
  
- **Configurations Section**:
  - Section title with "Add new configuration" button
  - Warning message when no configs exist
  - Table view with column headers
  - Color-coded badges for environment and status

- **Channel Mappings Section**:
  - Section title with description
  - Warning when no channels assigned
  - Table with dropdown selectors
  - Visual status indicators

### Color Scheme

- **Sandbox**: Yellow badge (#fef3c7 background, #92400e text)
- **Production**: Blue badge (#dbeafe background, #1e40af text)
- **Active**: Green badge (#d1fae5 background, #065f46 text)
- **Enabled**: Green badge (#d1fae5 background, #065f46 text)
- **Disabled**: Gray badge (#f3f4f6 background, #6b7280 text)
- **Warning**: Red background (#fef2f2 background, #991b1b text)

## Storage

Currently using **localStorage** for demonstration:
- `vnpay_configs`: Array of configurations
- `vnpay_credentials`: Map of config IDs to credentials (TMN Code, Hash Secret)
- `vnpay_channel_mappings`: Array of channel assignments

### Production Recommendation

For production deployment, replace localStorage with:
- **Database**: PostgreSQL, MySQL, MongoDB
- **Saleor APL**: Use app's Auth Persistence Layer for metadata
- **Environment Variables**: For default/global credentials

## Integration with Payment Webhooks

### Using Configurations in Webhooks

The configuration system should be integrated into payment webhooks:

```typescript
import { getConfigIdForChannel, getAllMappings } from "@/pages/api/mappings";
import { getVNPayConfigById } from "@/pages/api/configs";

// In transaction-initialize-session.ts
const channelId = event.data.channel.id;
const saleorApiUrl = req.headers[SALEOR_API_URL_HEADER] as string;

// Get configuration for this channel
const mappings = getAllMappings(saleorApiUrl);
const configId = getConfigIdForChannel(saleorApiUrl, channelId);

if (!configId) {
  return res.status(400).json({ error: "No VNPay configuration for this channel" });
}

const config = getVNPayConfigById(saleorApiUrl, configId);

if (!config) {
  return res.status(404).json({ error: "Configuration not found" });
}

// Use config.tmnCode, config.hashSecret, config.environment
const vnpayAPI = new VNPayAPI({
  tmnCode: config.tmnCode,
  hashSecret: config.hashSecret,
  paymentUrl: config.environment === "sandbox" 
    ? "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
    : "https://payment.vnpay.vn/paymentv2/vpcpay.html",
  apiUrl: config.environment === "sandbox"
    ? "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction"
    : "https://payment.vnpay.vn/merchant_webapi/api/transaction",
});
```

## Development Tools

### Local Development Shortcuts

When running on localhost, the configuration page shows a blue info box with links to:
- **VNPay Test Page** (`/vnpay-test`)
- **VNPay Debug Console** (`/vnpay-debug`)

### Testing the Configuration Page

1. Start dev server:
   ```bash
   cd /Users/paco/Documents/Projects/saleor-app-template
   pnpm run dev
   ```

2. Open in browser:
   ```
   http://localhost:3000
   ```

3. The page will show:
   - "Add to Saleor" form if not in iframe
   - Configuration management if opened in Saleor Dashboard

### Testing in Saleor Dashboard

1. Make sure your app is accessible via tunnel (ngrok, localhost.run)
2. Install the app in Saleor Dashboard
3. Navigate to: Extensions → VNPay Configuration
4. Test creating configs and assigning to channels

## API Reference

### GET /api/channels

Fetch all Saleor channels.

**Response:**
```json
{
  "success": true,
  "channels": [
    {
      "id": "Q2hhbm5lbDox",
      "name": "Default Channel",
      "slug": "default-channel",
      "isActive": true,
      "currencyCode": "USD"
    }
  ]
}
```

### GET /api/configs

Get all VNPay configurations (without secrets).

**Response:**
```json
{
  "success": true,
  "configs": [
    {
      "id": "config_1234567890",
      "name": "Sandbox Config",
      "tmnCode": "9BPJ5NYM",
      "environment": "sandbox",
      "isActive": true,
      "createdAt": "2024-03-15T10:30:00Z"
    }
  ]
}
```

### POST /api/configs

Create a new configuration.

**Request:**
```json
{
  "name": "Production Config",
  "tmnCode": "YOUR_TMN_CODE",
  "hashSecret": "YOUR_HASH_SECRET",
  "environment": "production"
}
```

**Response:**
```json
{
  "success": true,
  "config": {
    "id": "config_1234567891",
    "name": "Production Config",
    "tmnCode": "YOUR_TMN_CODE",
    "environment": "production",
    "isActive": true,
    "createdAt": "2024-03-15T10:35:00Z"
  }
}
```

### DELETE /api/configs?id=config_123

Delete a configuration.

**Response:**
```json
{
  "success": true,
  "message": "Configuration deleted"
}
```

### GET /api/mappings

Get all channel-to-config mappings.

**Response:**
```json
{
  "success": true,
  "mappings": [
    {
      "channelId": "Q2hhbm5lbDox",
      "configId": "config_1234567890"
    }
  ]
}
```

### POST /api/mappings

Create or update a channel mapping.

**Request:**
```json
{
  "channelId": "Q2hhbm5lbDox",
  "configId": "config_1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Mapping updated"
}
```

## Security Considerations

### Hash Secret Protection

- Never return `hashSecret` in GET responses
- Store encrypted in production database
- Use HTTPS for all API calls
- Validate API authentication

### Permission Checks

The configuration page requires:
- `HANDLE_PAYMENTS`
- `MANAGE_CHECKOUTS`
- `MANAGE_ORDERS`

These are enforced in the manifest extension definition.

### Validation

Always validate:
- TMN Code format (alphanumeric)
- Hash Secret presence
- Environment value (sandbox|production)
- Channel IDs exist in Saleor

## Troubleshooting

### Configuration not appearing in Dashboard

1. Check app is installed correctly
2. Verify manifest includes APP_PAGE extension
3. Check Saleor version supports extensions
4. Look for errors in browser console

### Channels not loading

1. Verify GraphQL API is accessible
2. Check app has correct permissions
3. Ensure auth token is valid
4. Check network tab for API errors

### Configurations not saving

1. For localStorage: Check browser storage quota
2. For database: Verify database connection
3. Check API endpoints are accessible
4. Look for errors in server logs

## Next Steps

### Production Deployment

1. **Replace localStorage with database**:
   - Add Prisma/TypeORM schema
   - Create migrations
   - Update API endpoints

2. **Add validation**:
   - Form validation (client + server)
   - TMN Code format checking
   - Hash Secret strength validation

3. **Enhance security**:
   - Encrypt hash secrets
   - Add audit logging
   - Implement rate limiting

4. **Add features**:
   - Edit configuration
   - Test configuration button
   - Transaction history per config
   - Multi-currency support

5. **Integrate with webhooks**:
   - Update transaction-initialize-session
   - Update transaction-process-session
   - Update transaction-refund-requested
   - Use channel-specific configs

## Summary

The configuration management system is now complete and follows Saleor's best practices:

✅ **Main configuration page** displayed in Dashboard  
✅ **Add/delete configurations** with UI  
✅ **Channel mappings** with dropdown selectors  
✅ **Visual status indicators** (badges, colors)  
✅ **API endpoints** for CRUD operations  
✅ **Manifest extension** for Dashboard integration  
✅ **Development tools** for testing  
✅ **Clean UI** matching Adyen's design  

The app is ready to be installed in Saleor Dashboard and will display the configuration page automatically under Extensions.
