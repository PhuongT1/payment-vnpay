# VNPay Components

Modern, modular VNPay payment integration components with Material UI-inspired design.

## File Structure

```
vnpay/
├── AppHeader.tsx                  # Navigation header with VNPay logo (185 lines)
├── ManageExtensionPage.tsx        # Extension management page (200 lines)
├── ConfigurationForm.tsx          # Config creation/editing form (146 lines)
├── ConfigurationTable.tsx         # VNPay configs table (187 lines)
├── ChannelMappingsTable.tsx       # Channel-config mappings (153 lines)
├── ConfigurationPage.tsx          # Main configuration layout (149 lines)
├── EmptyState.tsx                 # Empty state component (56 lines)
├── SectionLayout.tsx              # Reusable 2-column layout (40 lines)
├── VNPayTestPage.tsx              # Payment testing interface (181 lines)
├── VNPayDebugPage.tsx             # Debug console with logs (197 lines)
├── VNPayLogo.tsx                  # Official VNPay logo SVG (72 lines)
└── index.ts                       # Centralized exports (16 lines)
```

## Component Overview

### AppHeader
- **Purpose**: Top navigation bar with VNPay logo and page navigation
- **Props**: `currentPage`, `onNavigate`, `isLocalHost`
- **Features**: 
  - Official VNPay logo with gradient
  - Back button navigation
  - Development Tools inline (Test Page, Debug Console)
  - Manage extension, Support, Homepage buttons
  - Material UI-inspired design with gradients

### VNPayLogo
- **Purpose**: Official VNPay logo in SVG format
- **Exports**: `VNPayLogo` (icon), `VNPayLogoHorizontal` (logo + text)
- **Features**:
  - Professional blue gradient (#0066CC to #003D7A)
  - Scalable SVG for crisp display
  - Horizontal variant with VNPay text

### VNPayTestPage
- **Purpose**: Test payment initialization with real-time feedback
- **Features**:
  - Clean form for test parameters
  - Real-time API testing
  - Success/error state display
  - Modern Material UI design

### VNPayDebugPage
- **Purpose**: Advanced debugging console with real-time logs
- **Features**:
  - Real-time log streaming (last 100 entries)
  - Color-coded log levels (info, success, error, warning)
  - Dark console UI (optimal for debugging)
  - JSON data inspection

### Other Components
Same as before with updated Material UI styling and gradients.

## Navigation Flow

```
Main Page (ConfigurationPage)
    ├─> Test Page (VNPayTestPage) ─> Back
    ├─> Debug Console (VNPayDebugPage) ─> Back
    └─> Manage Extension (ManageExtensionPage) ─> Back
```

## Design System

### Color Palette
- **Primary Blue**: `#0066CC` (VNPay brand color)
- **Dark Blue**: `#003D7A` (Gradient end)
- **Success**: `#10b981`
- **Error**: `#ef4444`
- **Warning**: `#f59e0b`
- **Info**: `#6b7280`

### Gradients
- **Primary Gradient**: `linear-gradient(135deg, #0066CC 0%, #003D7A 100%)`
- **Background Gradient**: `linear-gradient(to right, #ffffff 0%, #f8fafc 100%)`
- **Light Blue**: `linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)`

### Button Styles
- **Primary**: Blue gradient with shadow
- **Secondary**: White with border
- **Danger**: Red background

## Usage Example

```tsx
import { 
  AppHeader, 
  VNPayTestPage, 
  VNPayDebugPage,
  ConfigurationPage 
} from "@/components/vnpay";

// In your page component
const [currentPage, setCurrentPage] = useState<"main" | "test" | "debug" | "manage">("main");

<AppHeader currentPage={currentPage} onNavigate={setCurrentPage} isLocalHost={true} />

{currentPage === "test" && <VNPayTestPage />}
{currentPage === "debug" && <VNPayDebugPage />}
{currentPage === "main" && <ConfigurationPage {...props} />}
```

## Line Count Summary

All components are under 200 lines (senior-level standard):
- Largest: ManageExtensionPage (200 lines)
- Smallest: SectionLayout (40 lines)
- Average: ~135 lines per component

## Future Enhancements

- [ ] Extract inline styles to CSS modules
- [ ] Add unit tests for each component
- [ ] Implement error boundaries
- [ ] Add loading states with skeletons
- [ ] Improve accessibility (ARIA labels)
- [ ] Add TypeScript strict mode
- [ ] Implement real-time WebSocket logs

