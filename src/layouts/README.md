# Layout Architecture Documentation

## 📐 Clean Architecture - Presentation Layer

Dự án sử dụng **shared layout pattern** để đảm bảo UI đồng nhất trên toàn bộ ứng dụng.

---

## 🏗️ Cấu Trúc Thư Mục

```
src/
├── layouts/                    # Shared Layout Components
│   ├── MainLayout.tsx         # Layout chính với header, navigation
│   ├── PageContainer.tsx      # Container cho nội dung page
│   └── index.ts              # Export module
│
├── components/
│   ├── common/               # (Planned) Common UI components
│   └── vnpay/               # VNPay-specific components
│       ├── AppHeader.tsx    # Header component (được sử dụng trong MainLayout)
│       ├── VNPayTestPage.tsx       # Page component (chỉ render nội dung)
│       ├── VNPayDebugPage.tsx      # Page component
│       ├── ManageExtensionPage.tsx # Page component
│       └── ConfigurationPage.tsx   # Page component
│
└── pages/
    └── index.tsx            # Root page sử dụng MainLayout
```

---

## 🎯 Design Patterns

### 1. **Container/Presentational Pattern**

**Container Component** (Smart):
```tsx
// pages/index.tsx
<MainLayout currentPage={currentPage} onNavigate={setCurrentPage}>
  <VNPayTestPage onNavigate={setCurrentPage} />
</MainLayout>
```

**Presentational Component** (Dumb):
```tsx
// components/vnpay/VNPayTestPage.tsx
export const VNPayTestPage = ({ onNavigate }) => (
  <PageContainer>
    {/* Chỉ render nội dung page */}
  </PageContainer>
);
```

### 2. **Composition Pattern**

Các component được compose lại với nhau:
```
MainLayout
  └── AppHeader (sticky header)
  └── main (content area)
      └── PageContainer
          └── Page Components
```

---

## 📦 Components Chi Tiết

### `MainLayout.tsx`

**Chức năng:**
- Wrapper layout cho toàn bộ app
- Chứa header, navigation, và content area
- Quản lý global styles

**Props:**
```typescript
interface MainLayoutProps {
  children: ReactNode;          // Nội dung page
  currentPage: PageView;         // Trang hiện tại
  onNavigate: (page: PageView) => void;  // Handler navigation
  isLocalHost: boolean;          // Development mode flag
  pageTitle?: string;            // SEO title (optional)
}
```

**Example:**
```tsx
<MainLayout
  currentPage="test"
  onNavigate={handleNavigate}
  isLocalHost={true}
>
  <YourPageContent />
</MainLayout>
```

### `PageContainer.tsx`

**Chức năng:**
- Container với responsive padding
- Max-width constraint (default 1400px)
- Center alignment
- Mobile-optimized spacing

**Props:**
```typescript
interface PageContainerProps {
  children: ReactNode;
  maxWidth?: number;     // Default: 1600px
  style?: CSSProperties; // Custom inline styles
  className?: string;    // Custom CSS class
}
```

**Example:**
```tsx
<PageContainer maxWidth={1200}>
  <h1>My Page Title</h1>
  <p>Content here</p>
</PageContainer>
```

**Responsive Behavior:**
- Desktop (>768px): `padding: 48px max(24px, calc((100vw - 1600px) / 2))`
- Mobile (≤768px): `padding: 32px 20px`

---

## 🔧 Cách Sử Dụng

### 1. Tạo Page Mới

```tsx
// components/vnpay/MyNewPage.tsx
import { PageContainer } from "../../layouts";
import { Breadcrumbs } from "./Breadcrumbs";
import { PageHeading } from "./PageHeading";

export const MyNewPage = ({ onNavigate }) => (
  <PageContainer>
    <Breadcrumbs currentPage="My Page" onNavigate={onNavigate} />
    <PageHeading title="My Awesome Page" />
    
    {/* Your page content here */}
  </PageContainer>
);
```

### 2. Thêm Page Vào Router

```tsx
// pages/index.tsx
import { MyNewPage } from "../components/vnpay/MyNewPage";

const IndexPage = () => {
  const [currentPage, setCurrentPage] = useState<PageView>("main");
  
  return (
    <MainLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {currentPage === "mynewpage" && <MyNewPage onNavigate={setCurrentPage} />}
    </MainLayout>
  );
};
```

---

## ✨ Best Practices

### ✅ DO's:

1. **Sử dụng MainLayout cho tất cả pages:**
```tsx
<MainLayout {...props}>
  <PageContent />
</MainLayout>
```

2. **Sử dụng PageContainer trong page components:**
```tsx
export const MyPage = () => (
  <PageContainer>
    {/* Content */}
  </PageContainer>
);
```

3. **Tách logic và presentation:**
```tsx
// Good: Smart component
const IndexPage = () => {
  const [data, setData] = useState();
  return <MainLayout><MyPage data={data} /></MainLayout>;
};

// Good: Dumb component
const MyPage = ({ data }) => <PageContainer>{data}</PageContainer>;
```

### ❌ DON'Ts:

1. **Không tự render container trong page component:**
```tsx
// Bad
const MyPage = () => (
  <div style={{ padding: "48px" }}>
    {/* Content */}
  </div>
);

// Good
const MyPage = () => (
  <PageContainer>
    {/* Content */}
  </PageContainer>
);
```

2. **Không tự render header trong page component:**
```tsx
// Bad
const MyPage = () => (
  <>
    <AppHeader />  {/* ❌ Đừng làm thế này */}
    <div>Content</div>
  </>
);

// Good - Header đã có trong MainLayout
const MyPage = () => (
  <PageContainer>
    <div>Content</div>
  </PageContainer>
);
```

3. **Không hardcode padding/margin riêng lẻ:**
```tsx
// Bad
<div style={{ padding: "48px 64px" }}>

// Good - Dùng PageContainer
<PageContainer>
```

---

## 📱 Responsive Design

### Breakpoints:

- **Mobile**: ≤ 768px
- **Tablet**: 769px - 1024px
- **Desktop**: > 1024px

### Responsive Padding Formula:

```css
padding: 48px max(24px, calc((100vw - 1600px) / 2));
```

**Giải thích:**
- Vertical padding: `48px` cố định
- Horizontal padding: động dựa theo viewport
  - Khi viewport < 1648px: padding = `24px`
  - Khi viewport > 1648px: padding tăng để center content

---

## 🎨 Styling Guidelines

### Font Family:
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
  'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
  'Helvetica Neue', sans-serif;
```

### Colors (Material Blue Gradient):
```javascript
Primary Gradient: linear-gradient(135deg, #0066CC 0%, #003D7A 100%)
Background: #f8fafc
Border: #e5e7eb
Text Primary: #111827
Text Secondary: #6b7280
```

### Spacing Scale (8px grid):
```
8px, 16px, 24px, 32px, 48px, 64px
```

---

## 🚀 Migration Guide

### Cũ → Mới

**Before:**
```tsx
const MyPage = () => (
  <div style={{ padding: "48px 64px", maxWidth: "1400px" }}>
    <h1>Title</h1>
  </div>
);
```

**After:**
```tsx
import { PageContainer } from "../../layouts";

const MyPage = () => (
  <PageContainer>
    <h1>Title</h1>
  </PageContainer>
);
```

---

## 📚 References

- [React Composition Pattern](https://reactjs.org/docs/composition-vs-inheritance.html)
- [Container/Presentational Pattern](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

## 📝 Changelog

### v1.0.0 (2026-03-17)
- ✅ Tạo `MainLayout.tsx` - Shared layout với header
- ✅ Tạo `PageContainer.tsx` - Responsive content wrapper
- ✅ Refactor `VNPayTestPage` để sử dụng PageContainer
- ✅ Refactor `VNPayDebugPage` để sử dụng PageContainer
- ✅ Refactor `ManageExtensionPage` để sử dụng PageContainer
- ✅ Refactor `ConfigurationPage` để sử dụng PageContainer
- ✅ Update `pages/index.tsx` để sử dụng MainLayout
- ✅ Đảm bảo layout đồng nhất trên toàn bộ app

---

**Author:** Senior Developer Team  
**Last Updated:** March 17, 2026
