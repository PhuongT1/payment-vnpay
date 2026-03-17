# REFACTORING PLAN - VNPay Saleor App

## 📋 PHÂN TÍCH HIỆN TRẠNG

### ❌ VẤN ĐỀ PHÁT HIỆN

1. **Project Structure**
   - ❌ Tên project: "saleor-app-template" → Cần đổi thành "vnpay-payment-app"
   - ❌ 30+ file .md rải rác (MoMo, SPSS, architecture docs)
   - ❌ CSV files SPSS không liên quan (5 files)
   - ❌ Thiếu docs organization structure
   - ✅ Code structure tốt (layouts/, components/ organized)

2. **Environment Configuration**
   - ❌ .env chỉ có localhost, chưa production-ready
   - ❌ Thiếu APP_IFRAME_BASE_URL, APP_API_BASE_URL config
   - ❌ Chưa có NEXT_PUBLIC_SALEOR_API_URL
   - ⚠️ VNPay config hard-coded trong .env

3. **Data Persistence**
   - ❌ Config lưu trong localStorage → Mất khi clear browser
   - ❌ Chưa dùng Saleor Metadata API
   - ❌ Chưa có database/backend để persist data
   - ⚠️ Channel mappings không persistent

4. **Form Validation**
   - ❌ Không dùng React Hook Form
   - ❌ Manual validation trong components
   - ❌ Thiếu reusable Input/Select components
   - ❌ Không có FormField wrapper

5. **Saleor Integration**
   - ❌ Channels hard-coded trong code
   - ❌ Permissions hard-coded trong manifest
   - ❌ Chưa có GraphQL queries để fetch từ Saleor
   - ⚠️ App có thể chạy standalone mà không cần Saleor

6. **Deployment Readiness**
   - ❌ Chưa có deployment config (Vercel, Railway, etc)
   - ❌ Manifest URL chưa dynamic
   - ❌ CORS/Security headers chưa config
   - ❌ Error boundary chưa có

---

## 🎯 KẾ HOẠCH THỰC THI (8 PHASES)

### **PHASE 1: Cleanup & Organization** ⏱️ 30 min

#### 1.1 Xóa Files Không Liên Quan
```bash
# Files cần XÓA:
- Bang_*.csv (5 files SPSS)
- SPSS_*.md (3 files)
- HUONG_DAN_SPSS*.md
- HUONG_DAN_CHUYEN_DOI.md
- convert-to-pdf.js
- convert_to_pdf.py
- MOMO_*.md (5 files)
- MOCK_*.md (2 files)
```

#### 1.2 Tổ Chức Lại Docs
```
docs/
├── architecture/
│   ├── ARCHITECTURE_VISUAL.md
│   ├── LAYOUT_REFACTORING.md
│   └── PAYMENT_APP_ARCHITECTURE.md
├── deployment/
│   ├── GETTING_STARTED.md
│   └── DEPLOYMENT_GUIDE.md (new)
├── vnpay/
│   ├── VNPAY_CONFIGURATION.md
│   ├── VNPAY_QUICKSTART.md
│   ├── VNPAY_SETUP_COMPLETE.md
│   ├── VNPAY_TEST_CARDS.md
│   └── README_VNPAY.md
└── development/
    ├── TESTING.md
    ├── TEST_FLOW.md
    └── SALEOR_APP_IMPLEMENTATION.md
```

#### 1.3 Update package.json
```json
{
  "name": "vnpay-payment-app",
  "version": "1.0.0",
  "description": "VNPay Payment Gateway Integration for Saleor",
  "author": "Your Team",
  "homepage": "https://github.com/yourusername/vnpay-payment-app"
}
```

---

### **PHASE 2: Environment & Configuration** ⏱️ 20 min

#### 2.1 Tạo .env.example Chi Tiết
```bash
# Required for all environments
NEXT_PUBLIC_SALEOR_API_URL=https://your-saleor-instance.com/graphql/
APP_API_BASE_URL=https://your-app-domain.com
APP_IFRAME_BASE_URL=https://your-app-domain.com

# VNPay Configuration (Override via Dashboard UI)
VNPAY_TMN_CODE=your_terminal_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_ENVIRONMENT=sandbox # or production

# Auto-configured (don't change)
VNPAY_PAYMENT_URL_SANDBOX=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_PAYMENT_URL_PRODUCTION=https://payment.vnpay.vn/paymentv2/vpcpay.html
```

#### 2.2 Validate .env on Startup
```typescript
// src/lib/env-validator.ts
export function validateEnv() {
  const required = [
    'NEXT_PUBLIC_SALEOR_API_URL',
    'APP_API_BASE_URL'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}
```

---

### **PHASE 3: Saleor Metadata API Integration** ⏱️ 45 min

#### 3.1 GraphQL Queries/Mutations
```graphql
# graphql/mutations/setMetadata.graphql
mutation SetAppMetadata($id: ID!, $input: [MetadataInput!]!) {
  updateMetadata(id: $id, input: $input) {
    item {
      metadata {
        key
        value
      }
    }
  }
}

# graphql/queries/getAppMetadata.graphql
query GetAppMetadata {
  app {
    id
    metadata {
      key
      value
    }
  }
}

# graphql/queries/getChannels.graphql
query GetChannels {
  channels {
    id
    name
    slug
    isActive
  }
}
```

#### 3.2 Metadata Service
```typescript
// src/lib/saleor/metadata-service.ts
export class MetadataService {
  async saveVNPayConfig(config: VNPayConfig) {
    // Save to Saleor Metadata API
  }
  
  async getVNPayConfigs(): Promise<VNPayConfig[]> {
    // Fetch from Saleor Metadata API
  }
  
  async saveChannelMapping(channelId: string, configId: string) {
    // Save channel → config mapping
  }
}
```

#### 3.3 Replace localStorage with Metadata
```typescript
// Before: localStorage.setItem('vnpay_configs', ...)
// After: await metadataService.saveVNPayConfig(config)
```

---

### **PHASE 4: React Hook Form Integration** ⏱️ 40 min

#### 4.1 Install Dependencies
```bash
pnpm add react-hook-form zod @hookform/resolvers
```

#### 4.2 Tạo Validation Schemas
```typescript
// src/lib/validation/vnpay-config.schema.ts
import { z } from 'zod';

export const vnpayConfigSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  tmnCode: z.string().min(8, 'Terminal code must be 8 characters'),
  hashSecret: z.string().min(32, 'Hash secret must be at least 32 characters'),
  environment: z.enum(['sandbox', 'production']),
});

export type VNPayConfigFormData = z.infer<typeof vnpayConfigSchema>;
```

#### 4.3 Refactor ConfigurationForm
```typescript
// src/components/vnpay/ConfigurationForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export const ConfigurationForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(vnpayConfigSchema),
  });
  
  const onSubmit = async (data: VNPayConfigFormData) => {
    await metadataService.saveVNPayConfig(data);
  };
};
```

---

### **PHASE 5: Reusable Form Components** ⏱️ 35 min

#### 5.1 TextField Component
```typescript
// src/components/common/TextField.tsx
interface TextFieldProps {
  label: string;
  error?: string;
  register: UseFormRegister;
  name: string;
  type?: string;
  placeholder?: string;
}

export const TextField: React.FC<TextFieldProps> = ({
  label, error, register, name, type = 'text', placeholder
}) => (
  <div>
    <label>{label}</label>
    <input {...register(name)} type={type} placeholder={placeholder} />
    {error && <span className="error">{error}</span>}
  </div>
);
```

#### 5.2 SelectField Component
```typescript
// src/components/common/SelectField.tsx
interface SelectFieldProps {
  label: string;
  error?: string;
  register: UseFormRegister;
  name: string;
  options: Array<{ value: string; label: string }>;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label, error, register, name, options
}) => (
  <div>
    <label>{label}</label>
    <select {...register(name)}>
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
    {error && <span className="error">{error}</span>}
  </div>
);
```

#### 5.3 FormField Wrapper
```typescript
// src/components/common/FormField.tsx
export const FormField: React.FC<{
  label: string;
  error?: string;
  children: React.ReactNode;
}> = ({ label, error, children }) => (
  <div className="form-field">
    <label className="form-label">{label}</label>
    <div className="form-input">{children}</div>
    {error && <p className="form-error">{error}</p>}
  </div>
);
```

---

### **PHASE 6: Saleor GraphQL Queries** ⏱️ 30 min

#### 6.1 Channels Query
```graphql
# graphql/queries/channels.graphql
query GetChannels {
  channels {
    id
    name
    slug
    isActive
    currencyCode
  }
}
```

#### 6.2 Fetch Channels Hook
```typescript
// src/hooks/useChannels.ts
import { useQuery } from '@tanstack/react-query';

export const useChannels = () => {
  return useQuery({
    queryKey: ['saleor-channels'],
    queryFn: async () => {
      const response = await fetch(process.env.NEXT_PUBLIC_SALEOR_API_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: GetChannelsDocument,
        }),
      });
      return response.json();
    },
  });
};
```

#### 6.3 Replace Hard-coded Channels
```typescript
// Before:
const channels = [
  { id: '1', name: 'Default Channel' },
  { id: '2', name: 'Channel-PLN' },
];

// After:
const { data: channels, isLoading } = useChannels();
```

---

### **PHASE 7: Permissions & Manifest** ⏱️ 25 min

#### 7.1 Update manifest.ts
```typescript
permissions: [
  "MANAGE_ORDERS",
  "HANDLE_PAYMENTS",
  "MANAGE_CHECKOUTS",
  "MANAGE_CHANNELS", // Add this
],
```

#### 7.2 Permission Checker
```typescript
// src/lib/saleor/permission-checker.ts
export const hasPermission = (permission: string) => {
  // Check if app has permission from Saleor
};
```

#### 7.3 Protected Routes
```typescript
// Wrap admin pages with permission check
export const withPermission = (Component, requiredPermission) => {
  return (props) => {
    if (!hasPermission(requiredPermission)) {
      return <p>You don't have permission</p>;
    }
    return <Component {...props} />;
  };
};
```

---

### **PHASE 8: Deployment Config** ⏱️ 30 min

#### 8.1 Vercel Config (vercel.json)
```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_SALEOR_API_URL": "@saleor-api-url",
    "APP_API_BASE_URL": "@app-api-base-url"
  }
}
```

#### 8.2 Railway Config (railway.json)
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "pnpm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### 8.3 Update Manifest for Production
```typescript
// src/pages/api/manifest.ts
const apiBaseURL = process.env.APP_API_BASE_URL || appBaseUrl;
const iframeBaseUrl = process.env.APP_IFRAME_BASE_URL || appBaseUrl;

// Ensure URLs are absolute
if (!apiBaseURL.startsWith('http')) {
  throw new Error('APP_API_BASE_URL must be absolute URL');
}
```

---

## ✅ CHECKLIST TRƯỚC KHI DEPLOY

### Code Quality
- [ ] TypeScript: No errors
- [ ] ESLint: No warnings
- [ ] All forms use React Hook Form
- [ ] All API calls use React Query
- [ ] Error boundaries implemented

### Configuration
- [ ] .env.example updated
- [ ] .env.production ready
- [ ] Environment validation on startup
- [ ] CORS configured
- [ ] Security headers set

### Saleor Integration
- [ ] Metadata API tested
- [ ] Channels fetched from Saleor
- [ ] Permissions checked
- [ ] Webhooks registered
- [ ] Auth flow works

### Testing
- [ ] Manual test: Config save/load
- [ ] Manual test: Channel mapping
- [ ] Manual test: Payment flow
- [ ] Test in Saleor Dashboard
- [ ] Test manifest URL

### Deployment
- [ ] Build succeeds (pnpm build)
- [ ] No console errors
- [ ] Manifest accessible
- [ ] Can install in Saleor Dashboard
- [ ] Payment flow works end-to-end

---

## 🚀 TIMELINE

| Phase | Task | Time | Total |
|-------|------|------|-------|
| 1 | Cleanup & Organization | 30 min | 30 min |
| 2 | Environment Config | 20 min | 50 min |
| 3 | Metadata API | 45 min | 1h 35min |
| 4 | React Hook Form | 40 min | 2h 15min |
| 5 | Form Components | 35 min | 2h 50min |
| 6 | GraphQL Queries | 30 min | 3h 20min |
| 7 | Permissions | 25 min | 3h 45min |
| 8 | Deployment | 30 min | **4h 15min** |

**Total Estimated Time: 4 hours 15 minutes**

---

## 📝 NOTES

### Saleor Metadata API Limits
- Max key length: 256 chars
- Max value length: 10,000 chars
- Store JSON stringified config
- Use namespaced keys: `vnpay:config:${id}`

### Production Checklist
- [ ] Update APP_API_BASE_URL to production domain
- [ ] Update APP_IFRAME_BASE_URL to production domain
- [ ] Set VNPAY_ENVIRONMENT=production
- [ ] Use production VNPay credentials
- [ ] Enable error tracking (Sentry?)
- [ ] Set up monitoring
- [ ] Configure rate limiting

---

**Created:** March 17, 2026  
**Author:** Senior Developer  
**Status:** READY TO EXECUTE
