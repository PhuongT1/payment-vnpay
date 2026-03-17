# Layout Architecture Visual Guide

## 🏗️ Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                     📱 Browser Window                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  MainLayout.tsx                       │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │          🎯 AppHeader (sticky)                  │  │  │
│  │  │  ┌──────┐  ┌────────┐  ┌──────┐  ┌──────┐      │  │  │
│  │  │  │ Logo │  │  Test  │  │ Debug│  │ Home │      │  │  │
│  │  │  └──────┘  └────────┘  └──────┘  └──────┘      │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │           📦 PageContainer                      │  │  │
│  │  │  ┌───────────────────────────────────────────┐  │  │  │
│  │  │  │       🔷 Page Component                  │  │  │  │
│  │  │  │  (VNPayTestPage / DebugPage / etc)       │  │  │  │
│  │  │  │                                           │  │  │  │
│  │  │  │  • Breadcrumbs                           │  │  │  │
│  │  │  │  • Page Heading                          │  │  │  │
│  │  │  │  • Content Sections                      │  │  │  │
│  │  │  │  • Forms, Tables, etc                    │  │  │  │
│  │  │  └───────────────────────────────────────────┘  │  │  │
│  │  │                                                  │  │  │
│  │  │  Responsive Padding:                             │  │  │
│  │  │  Desktop: 48px calc((100vw - 1600px) / 2)       │  │  │
│  │  │  Mobile:  32px 20px                              │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  │  (Footer - có thể thêm sau)                           │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

```
User Action
    ↓
┌─────────────────┐
│ pages/index.tsx │  (Smart Component - State Management)
└────────┬────────┘
         │ Passes: currentPage, onNavigate, isLocalHost
         ↓
┌──────────────────┐
│  MainLayout.tsx  │  (Layout Wrapper)
└────────┬─────────┘
         │ Renders: AppHeader + Children
         ↓
┌───────────────────┐
│  AppHeader.tsx    │  (Navigation Component)  
└───────────────────┘
         ↓
┌──────────────────────┐
│ Page Component       │  (VNPayTestPage, DebugPage, etc)
└──────────┬───────────┘
           │ Uses PageContainer
           ↓
┌───────────────────────┐
│  PageContainer.tsx    │  (Responsive Wrapper)
└──────────┬────────────┘
           │ Renders: Children with padding
           ↓
      Page Content
```

---

## 📱 Responsive Behavior

### Desktop (> 768px)
```
┌────────────────────────────────────────────────┐
│        Flexible Padding (grows with viewport)  │
│   ┌────────────────────────────────────────┐   │
│   │                                        │   │
│   │          Content (max 1600px)         │   │
│   │                                        │   │
│   └────────────────────────────────────────┘   │
│        Padding: calc((100vw - 1600px) / 2)     │
└────────────────────────────────────────────────┘
```

### Mobile (≤ 768px)
```
┌──────────────────────────┐
│20px│                 │20px│
│    │    Content      │    │
│    │  (full width)   │    │
│    │                 │    │
└──────────────────────────┘
```

---

## 🎨 Style Inheritance

```
MainLayout (Root)
├── Global Styles
│   ├── Font Family: system-ui, -apple-system, ...
│   ├── Body: margin: 0, padding: 0
│   ├── Box-sizing: border-box
│   └── Scrollbar styling
│
├── Layout Styles
│   ├── Background: #f8fafc
│   ├── Min-height: 100vh
│   └── Display: flex, flex-direction: column
│
└── Children (inherit all)
    ├── AppHeader
    │   └── Position: sticky, top: 0, z-index: 100
    │
    └── PageContainer
        ├── Max-width: 1400px
        ├── Margin: 0 auto
        └── Responsive padding
```

---

## 🔧 Component Responsibilities

| Component | Type | Responsibilities |
|-----------|------|-----------------|
| **MainLayout** | Container | • Wrap entire app<br>• Provide global styles<br>• Manage header visibility<br>• Handle navigation state |
| **PageContainer** | Wrapper | • Consistent padding<br>• Max-width constraint (1600px)<br>• Responsive behavior<br>• Center content |
| **AppHeader** | Presentation | • Display logo<br>• Navigation buttons<br>• Sticky positioning<br>• Back button logic |
| **Page Components** | Smart/Dumb | • Render page content<br>• Handle page-specific logic<br>• Use PageContainer<br>• NOT responsible for layout |

---

## 🧩 Code Example Flow

### 1. User visits `/` → Loads `pages/index.tsx`

```tsx
// pages/index.tsx
const [currentPage, setCurrentPage] = useState<PageView>("main");

return (
  <MainLayout 
    currentPage={currentPage}
    onNavigate={setCurrentPage}
    isLocalHost={true}
  >
    {currentPage === "test" && <VNPayTestPage onNavigate={setCurrentPage} />}
  </MainLayout>
);
```

### 2. MainLayout wraps content with header

```tsx
// layouts/MainLayout.tsx
export const MainLayout = ({ children, currentPage, onNavigate }) => (
  <div style={{ minHeight: "100vh" }}>
    <AppHeader currentPage={currentPage} onNavigate={onNavigate} />
    <main>{children}</main>
  </div>
);
```

### 3. Page Component renders with PageContainer

```tsx
// components/vnpay/VNPayTestPage.tsx
export const VNPayTestPage = ({ onNavigate }) => (
  <PageContainer>
    <Breadcrumbs currentPage="Test Payment" onNavigate={onNavigate} />
    <PageHeading title="VNPay Payment Test" />
    {/* Page content */}
  </PageContainer>
);
```

### 4. Final DOM Structure

```html
<div> <!-- MainLayout -->
  <style>/* Global styles */</style>
  
  <div> <!-- AppHeader -->
    <img src="/vnpay-logo.svg" />
    <button>Test Page</button>
    <button>Debug Console</button>
  </div>
  
  <main> <!-- Main content area -->
    <div> <!-- PageContainer -->
      <nav> <!-- Breadcrumbs -->
        <a>Home</a> / Test Payment
      </nav>
      
      <h1> <!-- PageHeading -->
        VNPay Payment Test
      </h1>
      
      <!-- Page content -->
    </div>
  </main>
</div>
```

---

## ✨ Benefits Visualization

### Before Refactoring (Inconsistent)
```
Page 1:  [Header] → [Padding: 48px 64px] → [Content]
Page 2:  [Header] → [Padding: 48px calc(...)] → [Content]
Page 3:  [Header] → [Padding: 32px 24px] → [Content]
❌ Different paddings, styles, hard to maintain
```

### After Refactoring (Consistent)
```
All Pages: [MainLayout] → [PageContainer] → [Content]
✅ Same header, same padding, same responsive behavior
✅ Single source of truth
✅ Easy to update globally
```

---

## 🎯 Key Principles

1. **DRY (Don't Repeat Yourself)**
   - ❌ Before: Padding code repeated 4 times
   - ✅ After: Padding defined once in PageContainer

2. **Separation of Concerns**
   - ❌ Before: Pages responsible for layout + content
   - ✅ After: Layout handles layout, Pages handle content

3. **Composition over Inheritance**
   - ✅ Components compose together
   - ✅ MainLayout wraps PageContainer wraps Content

4. **Single Responsibility Principle**
   - MainLayout: Layout structure
   - PageContainer: Content spacing
   - Page Components: Business logic
   - AppHeader: Navigation

---

**Last Updated:** March 17, 2026  
**Architecture Pattern:** Clean Architecture + Composition  
**Status:** ✅ Production Ready
