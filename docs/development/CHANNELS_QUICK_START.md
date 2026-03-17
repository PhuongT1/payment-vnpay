# 🚀 Quick Start: Lấy Channels từ Saleor (Saleor's Way)

## TL;DR

```bash
# 1. GraphQL query đã có sẵn
graphql/queries/getChannels.graphql

# 2. Generate hook
pnpm generate

# 3. Dùng hook (như OrderExample)
import { useSaleorChannels } from '@/hooks/useSaleorChannels';

const { channels, loading, error } = useSaleorChannels();
```

**✅ Approach này giống Dummy Payment App của Saleor!**

---

## 🔑 Token Configuration

### **CÓ CẦN TOKEN KHÔNG?**

**Có**, nhưng **TỰ ĐỘNG** qua GraphQLProvider + AppBridge!

### **Cách Saleor Làm:**

1. **GraphQLProvider** wrap toàn bộ app ([_app.tsx](../../src/pages/_app.tsx))
2. AppBridge **tự inject token** vào mọi GraphQL request
3. URQL client **tự động** thêm `Authorization-Bearer` header
4. Bạn chỉ cần **dùng hook** - Done!

```typescript
// ❌ KHÔNG CẦN làm thế này:
const token = 'abc123...';
fetch('/api/channels', { headers: { 'Authorization': token }});

// ✅ Saleor's way:
const [{ data }] = useGetChannelsQuery(); // Token tự động!
```

---

## 📋 Cách Lấy Channels (Saleor Standard)

### **1. Hook `useSaleorChannels` (Khuyên dùng ⭐)**

File: [src/hooks/useSaleorChannels.ts](../../src/hooks/useSaleorChannels.ts)

```tsx
import { useSaleorChannels } from '@/hooks/useSaleorChannels';

function MyComponent() {
  const { channels, loading, error } = useSaleorChannels();

  return (
    <select>
      {channels.map(ch => (
        <option key={ch.id}>{ch.name}</option>
      ))}
    </select>
  );
}
```

**Internally sử dụng**: `useGetChannelsQuery()` - generated từ GraphQL query file.

### **2. Component `ChannelsSelector`**

```tsx
import { ChannelsSelector } from '@/components/common';

function ConfigForm() {
  const [selectedChannel, setSelectedChannel] = useState('');

  return (
    <ChannelsSelector 
      value={selectedChannel}
      onChange={setSelectedChannel}
    />
  );
}
```

### **3. Direct URQL Hook (Advanced)**

```typescript
import { useGetChannelsQuery } from '@/generated/graphql';

function MyComponent() {
  const [{ data, fetching, error }] = useGetChannelsQuery();
  
  const channels = data?.channels || [];
  
  return <div>...</div>;
}
```

---

## ⚙️ Setup

### **Bước 1: GraphQL Query** ✅ (Đã có)

File: `graphql/queries/getChannels.graphql`

```graphql
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

### **Bước 2: Generate Types**

```bash
pnpm generate
# Tạo hook: useGetChannelsQuery()
```

### **Bước 3: Sử dụng**

```tsx
const { channels, loading } = useSaleorChannels();
```

**Không cần config token!** GraphQLProvider + AppBridge tự xử lý.

---

## 🏗️ Architecture (Như Saleor)

```
┌─────────────────┐
│   _app.tsx      │
│                 │
│  AppBridgeProvider ◄─── Provides token from Saleor
│    │                │
│    └─ GraphQLProvider ◄─── Creates URQL client with token
│                 │
│    Your Component│
│    │             │
│    └─ useGetChannelsQuery() ◄─── Auto authenticated!
└─────────────────┘
```

### **Key Files:**

1. **[_app.tsx](../../src/pages/_app.tsx)** - Setup GraphQLProvider
2. **[GraphQLProvider.tsx](../../src/providers/GraphQLProvider.tsx)** - URQL client với auth
3. **[create-graphq-client.ts](../../src/lib/create-graphq-client.ts)** - Auth exchange config
4. **[getChannels.graphql](../../graphql/queries/getChannels.graphql)** - Query definition

---

## 🧪 Test Nhanh

```typescript
// Test trong component (có GraphQLProvider)
import { useSaleorChannels } from '@/hooks/useSaleorChannels';

function TestComponent() {
  const { channels, loading, error } = useSaleorChannels();

  console.log('Channels:', channels);
  console.log('Loading:', loading);
  console.log('Error:', error);

  return <div>Check console!</div>;
}
```

---

## 🔍 So Sánh: Saleor Way vs Custom API

| Aspect | Custom API Route | **Saleor Way (URQL)** |
|--------|------------------|----------------------|
| Token handling | Manual headers | ✅ Auto via GraphQLProvider |
| Type safety | Manual typing | ✅ Auto-generated from GraphQL |
| Caching | Manual | ✅ Built-in URQL cache |
| Error handling | Manual | ✅ Normalized errors |
| Consistency | Custom approach | ✅ Same as other Saleor apps |
| Example in Saleor | ❌ None | ✅ OrderExample, ProductExample |

**Kết luận:** Dùng URQL như Saleor!

---

## ⚠️ Troubleshooting

### **Error: "useGetChannelsQuery is not defined"**

→ Chưa run `pnpm generate`. Chạy lại để generate hooks.

### **Error: "No GraphQLProvider found"**

→ Component phải nằm trong `<GraphQLProvider>` tree (check [_app.tsx](../../src/pages/_app.tsx))

### **Empty channels[]**

→ App chưa install vào Dashboard. Install qua manifest URL để có token.

---

## 📚 Chi Tiết

Xem: [SALEOR_CHANNELS_GUIDE.md](SALEOR_CHANNELS_GUIDE.md)

---

**Approach này giống 100% với Dummy Payment App của Saleor!**

**Updated**: March 17, 2026
