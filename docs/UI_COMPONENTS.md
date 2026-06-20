# SpaceJam UI Component Library

Production-grade UI components for the SpaceJam coworking space management system.

## Installation

```bash
npm install @org/ui
# or workspace
npm install @org/source
```

### Import

```typescript
import { Button, Card, Input, Table, Dialog, Spinner, EmptyState } from "@org/ui";
```

---

## Component Architecture

### Primitives Layer

Core atoms that compose all other components.

| Component | Path | Description |
|-----------|-----|------------|
| `Button` | `primitives/Button` | Versatile button with variants, sizes, loading |
| `Input` | `primitives/Input` | Text input with validation, icons |
| `Card` | `primitives/Card` | Container with header/body/footer |
| `Spinner` | `primitives/Spinner` | Loading indicator |
| `Skeleton` | `primitives/Skeleton` | Content placeholder |
| `Badge` | `primitives/Badge` | Status badge/tag |

---

## Usage Examples

### Button

```tsx
import { Button } from "@org/ui";

// Primary button
<Button>Save Changes</Button>

// Secondary button
<Button variant="secondary">Cancel</Button>

// Loading state
<Button loading>Submitting...</Button>

// With icon
<Button leftIcon={<SaveIcon />}>Save</Button>

// Full width
<Button fullWidth>Submit</Button>

// Sizes
<Button size="xs">Tiny</Button>
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>
<Button variant="success">Success</Button>
<Button variant="link">Link</Button>
```

### Button Props

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success" | "link";
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "icon";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  loadingText?: string;
}
```

---

### Input

```tsx
import { Input } from "@org/ui";

// Basic input
<Input label="Email" type="email" placeholder="Enter email" />

// With error
<Input label="Password" type="password" error="Password is required" />

// With description
<Input label="Name" description="Your full name as it appears on ID" />

// With icon
<Input label="Search" leftIcon={<MagnifyingGlassIcon />} placeholder="Search..." />

// Clearable
<Input label="Name" clearable placeholder="Type something" />

// Required
<Input label="Email" required placeholder="email@example.com" />

// Disabled
<Input label="Email" disabled value="readonly@example.com" />
```

### Input Props

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  warning?: string;
  description?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearable?: boolean;
  required?: boolean;
  inputId?: string;
}
```

---

### Card

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from "@org/ui";

// Basic card
<Card>
  <CardBody>Content goes here</CardBody>
</Card>

// With header
<Card>
  <CardHeader>
    <CardTitle>Revenue</CardTitle>
    <CardDescription>Monthly revenue for March</CardDescription>
  </CardHeader>
  <CardBody>
    <div className="text-3xl font-bold">₹9.8L</div>
  </CardBody>
</Card>

// With actions
<Card>
  <CardHeader
    leftAction={<Badge>New</Badge>}
    rightAction={<Button size="sm">View All</Button>}
  >
    <CardTitle>Recent Bookings</CardTitle>
  </CardHeader>
  <CardBody>...</CardBody>
  <CardFooter>
    <Button variant="ghost">Cancel</Button>
    <Button>Confirm</Button>
  </CardFooter>
</Card>

// Elevated variant
<Card variant="elevated">...</Card>

// Outlined
<Card variant="outlined">...</Card>

// Clickable
<Card onClick={() => navigate('/details')}>Click me</Card>
```

### Card Props

```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outlined" | "elevated";
  hoverable?: boolean;
  onClick?: () => void;
  padding?: "none" | "sm" | "md" | "lg";
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
}
```

---

### Table

```tsx
import { Table, TablePagination } from "@org/ui";

// Define columns
const columns = [
  { key: "name", header: "Name", sortable: true },
  { key: "email", header: "Email" },
  {
    key: "status",
    header: "Status",
    cell: (row) => <Badge>{row.status}</Badge>,
  },
  { key: "actions", header: "Actions", align: "right" },
];

// Simple table
<Table
  columns={columns}
  data={users}
  rowKey="id"
/>

// Sortable
<Table
  columns={columns}
  data={users}
  rowKey="id"
  sortKey={sortKey}
  sortDirection={sortDirection}
  onSort={(key, dir) => setSort(key, dir)}
/>

// Selectable rows
<Table
  columns={columns}
  data={users}
  rowKey="id"
  selectable
  selectedKeys={selectedKeys}
  onSelectionChange={setSelectedKeys}
/>

// With loading
<Table columns={columns} data={[]} loading rowKey="id" />

// With pagination
<>
  <Table columns={columns} data={paginatedData} rowKey="id" />
  <TablePagination
    page={page}
    pageSize={pageSize}
    total={total}
    onPageChange={setPage}
    onPageSizeChange={setPageSize}
  />
</>
```

### Table Props

```typescript
interface TableColumn<T = unknown> {
  key: string;
  header: string;
  cell?: (row: T, rowIndex: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
  fixed?: boolean;
}

interface TableProps<T = unknown> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: keyof T | ((row: T) => string);
  sortKey?: string;
  sortDirection?: SortDirection;
  onSort?: (key: string, direction: SortDirection) => void;
  onRowClick?: (row: T, rowIndex: number) => void;
  selectedKeys?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  selectable?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}
```

---

### Dialog

```tsx
import { Dialog } from "@org/ui";

// Basic dialog
<Dialog
  open={isOpen}
  onOpenChange={setOpen}
  title="Confirm Delete"
  description="Are you sure you want to delete this item?"
  footer={
    <>
      <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      <Button variant="danger" onClick={handleDelete}>Delete</Button>
    </>
  }
>
  <p>This action cannot be undone.</p>
</Dialog>

// Sizes
<Dialog size="sm" title="Small">...</Dialog>
<Dialog size="md" title="Medium">...</Dialog>
<Dialog size="lg" title="Large">...</Dialog>
<Dialog size="xl" title="Extra Large">...</Dialog>
```

### Dialog Props

```typescript
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  closeOnOverlay?: boolean;
}
```

---

### Loading States

```tsx
import { Spinner, Skeleton, LoadingOverlay, EmptyState, NoData } from "@org/ui";

// Spinner sizes
<Spinner size="sm" />
<Spinner size="md" />
<Spinner size="lg" />
<Spinner size="xl" />

// Skeleton variants
<Skeleton variant="text" width="200px" />
<Skeleton variant="circular" width="48px" height="48px" />
<Skeleton variant="rectangular" width="100%" height="200px" />
<Skeleton variant="thumbnail" width="100px" height="100px" />

// Full loading overlay
<LoadingOverlay message="Loading bookings..." />

// Empty state
<EmptyState
  icon={<DocumentTextIcon />}
  title="No bookings yet"
  description="Create your first booking to get started"
  action={<Button>Create Booking</Button>}
/>

// No data preset
<NoData message="No users found" onAction={handleRefresh} actionLabel="Refresh" />
```

---

### Toast Notifications

```tsx
import { Toast, useToast } from "@org/ui";

function Example() {
  const { toasts, showToast, dismissToast } = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      showToast("success", "Saved!", "Your changes have been saved");
    } catch {
      showToast("error", "Error", "Failed to save changes");
    }
  };

  return (
    <>
      <Button onClick={handleSave}>Save</Button>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
```

### Toast Types

- `success` — Green background (#ECFDF5), checkmark icon
- `error` — Red background (#FEF2F2), X icon
- `warning` — Amber background (#FFFBEB), warning icon
- `info` — Orange background (#FFF7ED), info icon

---

### Icons

```tsx
import { icons } from "@org/ui";

const { Menu, XMark, User, Bell, CheckCircle, ... } = icons;

// Usage
<icons.User className="text-gray-500" />
<icons.Bell ariaLabel="Notifications" size={24} />
```

### Available Icons

| Name | Usage |
|------|-------|
| `Menu` | Hamburger menu |
| `XMark` | Close button |
| `MagnifyingGlass` | Search |
| `ChevronLeft/Right` | Pagination |
| `User` | User profile |
| `Bell` | Notifications |
| `CheckCircle` | Success |
| `XCircle` | Error |
| `AlertCircle` | Warning |
| `InformationCircle` | Info |
| `DocumentText` | Document |
| `Inbox` | Empty inbox |
| `Calendar` | Date picker |
| `ChartBar` | Charts |
| `Clock` | Time |
| `CreditCard` | Payments |

---

### Form Components

```tsx
import { FormItem, Select, Textarea, Switch, Badge } from "@org/ui";

// Form field with label + error
<FormItem label="Email" error="Invalid email" required>
  <Input placeholder="email@example.com" />
</FormItem>

// Select dropdown
<Select
  label="Country"
  options={[
    { value: "in", label: "India" },
    { value: "us", label: "United States" },
  ]}
  placeholder="Select country"
/>

// Textarea
<Textarea
  label="Description"
  placeholder="Enter description..."
  resize="vertical"
  maxRows={4}
/>

// Switch toggle
<Switch
  checked={enabled}
  onChange={setEnabled}
  label="Enable notifications"
/>
```

---

### Layout

```tsx
import { Grid, Container, SkipLink } from "@org/ui";

// Max-width container
<Container>
  <main>Content</main>
</Container>

// Responsive grid
<Grid columns={3} gap={4}>
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</Grid>

// Auto-fill grid
<Grid minItemWidth="250px">
  {items.map(item => <Card>{item}</Card>)}
</Grid>

// Skip link for accessibility
<>
  <SkipLink targetId="main-content" />
  <main id="main-content">Main content</main>
</>
```

---

### Badge

```tsx
import { Badge } from "@org/ui";

// Variants
<Badge>Default</Badge>
<Badge variant="primary">Active</Badge>
<Badge variant="success">Verified</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="danger">Error</Badge>
<Badge variant="neutral">Inactive</Badge>

// Sizes
<Badge size="sm">Small</Badge>
<Badge size="md">Medium</Badge>
```

---

## Design System Reference

### Colors

| Purpose | Value | Usage |
|---------|-------|-------|
| Primary | `#FF6A2F` | Buttons, links, focus |
| Text dark | `#1F1F1F` | Headings, body |
| Text muted | `#6B7280` | Descriptions, hints |
| Border | `#E5E7EB` | Dividers, inputs |
| Success | `#10B981` | Positive states |
| Error | `#EF4444` | Errors |
| Warning | `#F59E0B` | Warnings |
| Background | `#FBF6F4` | Page background |
| Card | `#FFFFFF` | Card surfaces |

### Spacing

- `xs`: 4px
- `sm`: 8px
- `md`: 16px
- `lg`: 24px
- `xl`: 32px

### Border Radius

- Small: 8px (buttons, inputs)
- Medium: 12px (badges)
- Large: 14px (cards)
- Full: 9999px (pills, avatars)

---

## Accessibility Checklist

- [ ] All interactive elements keyboard-accessible
- [ ] Focus rings visible (`focus-visible:ring`)
- [ ] ARIA labels on icon-only buttons
- [ ] `aria-invalid` on error inputs
- [ ] `aria-describedby` linking inputs to error/description
- [ ] `role="dialog"` on modals
- [ ] Focus trap in modals
- [ ] Escape closes modals
- [ ] Skip link to main content
- [ ] Color contrast ≥ 4.5:1
- [ ] Screen reader announcements for loading states