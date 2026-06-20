# Implementation Examples

This document provides real-world implementation examples for using the SpaceJam UI component library.

---

## 1. Dashboard Metrics Cards

```tsx
// apps/web/src/components/Dashboard/MetricsGrid.tsx
import { Card, CardHeader, CardTitle, CardBody, StatCard } from "@org/ui";

function MetricsGrid() {
  const stats = [
    {
      label: "Revenue (MTD)",
      value: "₹9.8L",
      change: 12,
      trend: "up",
    },
    {
      label: "Active Customers",
      value: "20",
      change: 5,
      trend: "up",
    },
    {
      label: "Outstanding Dues",
      value: "₹6.2L",
      change: 8,
      trend: "down",
    },
    {
      label: "Bookings Today",
      value: "3",
      change: 5,
      trend: "up",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} hoverable>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              {stat.label}
            </CardTitle>
          </CardHeader>
          <CardBody className="flex items-end justify-between">
            <div className="text-3xl font-bold text-[#1F1F1F]">
              {stat.value}
            </div>
            <div className={`text-sm ${stat.trend === "up" ? "text-[#10B981]" : "text-[#EF4444]"}`}>
              {stat.trend === "up" ? "↑" : "↓"} {stat.change}%
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
```

---

## 2. Booking Management Table

```tsx
// apps/web/src/components/Bookings/BookingTable.tsx
import { useState } from "react";
import { Table, TablePagination, Input, Button, Dialog, Badge, Select } from "@org/ui";

type Booking = {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  center: string;
  seats: string;
  date: string;
  time: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  amount: number;
};

const getStatusBadge = (status: Booking["status"]) => {
  const variants = {
    confirmed: "success",
    pending: "warning",
    cancelled: "danger",
    completed: "primary",
  } as const;

  const labels = {
    confirmed: "Confirmed",
    pending: "Pending",
    cancelled: "Cancelled",
    completed: "Completed",
  };

  return (
    <Badge variant={variants[status]}>
      {labels[status]}
    </Badge>
  );
};

export function BookingTable({ data }: { data: Booking[] }) {
  const [sortKey, setSortKey] = useState("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const columns = [
    { key: "customerName", header: "Customer", sortable: true },
    { key: "email", header: "Email" },
    { key: "center", header: "Center" },
    { key: "seats", header: "Seats" },
    { key: "date", header: "Date", sortable: true },
    { 
      key: "time", 
      header: "Time" 
    },
    {
      key: "status",
      header: "Status",
      cell: (_, row: Booking) => getStatusBadge(row.status),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right" as const,
      cell: (_, row: Booking) => `₹${row.amount.toLocaleString()}`,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right" as const,
      width: "100px",
    },
  ];

  const handleDelete = () => {
    // Delete selected bookings
    console.log("Deleting:", [...selectedKeys]);
    setSelectedKeys(new Set());
    setShowDeleteDialog(false);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Input
            placeholder="Search bookings..."
            leftIcon={<SearchIcon />}
            className="w-64"
          />
          <Select
            placeholder="Filter by status"
            options={[
              { value: "all", label: "All Status" },
              { value: "confirmed", label: "Confirmed" },
              { value: "pending", label: "Pending" },
              { value: "cancelled", label: "Cancelled" },
            ]}
            width="160px"
          />
        </div>
        {selectedKeys.size > 0 && (
          <Button variant="danger" onClick={() => setShowDeleteDialog(true)}>
            Delete ({selectedKeys.size})
          </Button>
        )}
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={data}
        rowKey="id"
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={setSortDirection}
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        selectable
        emptyMessage="No bookings found"
      />

      {/* Pagination */}
      <TablePagination
        page={1}
        pageSize={10}
        total={data.length}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
      />

      {/* Delete Dialog */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Bookings"
        description={`Are you sure you want to delete ${selectedKeys.size} booking${selectedKeys.size > 1 ? 's' : ''}?`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p>This action cannot be undone.</p>
      </Dialog>
    </div>
  );
}
```

---

## 3. Customer Profile Form

```tsx
// apps/web/src/components/Customer/CustomerForm.tsx
import { FormItem, Input, Textarea, Switch, Dialog } from "@org/ui";

export function CustomerForm({ customer }: { customer?: any }) {
  const [formData, setFormData] = useState({
    name: customer?.name || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    company: customer?.company || "",
    notes: customer?.notes || "",
    isActive: customer?.isActive ?? true,
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormItem
          label="Full Name"
          description="Enter the customer's legal name"
          required
          error={formData.name.length < 3 ? "Name must be at least 3 characters" : undefined}
        >
          <Input
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="John Doe"
          />
        </FormItem>

        <FormItem
          label="Email Address"
          required
          error={/\S+@\S+\.\S+/.test(formData.email) ? undefined : "Invalid email"}
        >
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="john@example.com"
          />
        </FormItem>

        <FormItem label="Phone Number">
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="+91 98765 43210"
          />
        </FormItem>

        <FormItem label="Company">
          <Input
            value={formData.company}
            onChange={(e) => handleChange("company", e.target.value)}
            placeholder="ABC Corp"
          />
        </FormItem>
      </div>

      <FormItem label="Notes">
        <Textarea
          value={formData.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          placeholder="Any special notes or requirements..."
          maxRows={4}
        />
      </FormItem>

      <FormItem label="Account Status">
        <div className="flex items-center gap-3">
          <Switch
            checked={formData.isActive}
            onChange={(checked) => handleChange("isActive", checked)}
            label="Active customer"
          />
          <Badge variant={formData.isActive ? "success" : "danger"}>
            {formData.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </FormItem>
    </div>
  );
}
```

---

## 4. Loading State Management

```tsx
// apps/web/src/components/Bookings/BookingList.tsx
import { useState } from "react";
import { Table, LoadingOverlay, EmptyState, Button, Toast } from "@org/ui";

export function BookingList() {
  const [data, setData] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      // const response = await fetch("/api/bookings");
      // setData(await response.json());
      setData(mockBookings);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[400px]">
      {loading && (
        <LoadingOverlay message="Loading bookings..." />
      )}

      {error && (
        <EmptyState
          icon={<AlertCircleIcon />}
          title="Error loading bookings"
          description="Please try again later"
          action={
            <Button onClick={fetchBookings}>
              Retry
            </Button>
          }
        />
      )}

      {!loading && !error && data.length === 0 && (
        <EmptyState
          icon={<InboxIcon />}
          title="No bookings yet"
          description="Create your first booking to get started"
          action={
            <Button onClick={createBooking}>
              Create Booking
            </Button>
          }
        />
      )}

      {!loading && !error && data.length > 0 && (
        <Table
          columns={columns}
          data={data}
          rowKey="id"
          loading={false}
        />
      )}
    </div>
  );
}
```

---

## 5. Toast Notification System

```tsx
// apps/web/src/components/Layout/Layout.tsx
import { ToastContainer } from "@org/ui";

export function Layout() {
  // This should be at the root level of your app
  return (
    <>
      <Header />
      <main>...</main>
      <ToastContainer position="top-right" />
      <Footer />
    </>
  );
}

// Usage in components
function BookingForm() {
  const { showToast } = useToast();

  const handleSubmit = async (data: any) => {
    try {
      await api.createBooking(data);
      showToast("success", "Booking Created", "Your booking has been created successfully");
    } catch (error) {
      showToast("error", "Error", "Failed to create booking");
    }
  };
}
```

---

## 6. Responsive Dashboard Layout

```tsx
// apps/web/src/components/Dashboard/DashboardLayout.tsx
import { Grid, Container, Sidebar, Header } from "@org/ui";

export function DashboardLayout() {
  return (
    <Container maxWidth="xl">
      <div className="grid grid-cols-1 lg:grid-cols-[80px_1fr] gap-6 mt-4">
        <Sidebar />
        <div className="space-y-6">
          <Header />
          <main>
            <MetricsGrid />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              <div className="lg:col-span-2">
                <BookingTable />
              </div>
              <div className="lg:col-span-1">
                <UpcomingBookings />
              </div>
            </div>
          </main>
        </div>
      </div>
    </Container>
  );
}
```

---

## 7. Advanced Search with Filters

```tsx
// apps/web/src/components/Search/SearchBox.tsx
import { useState } from "react";
import { Input, Select, Button, Card, CardHeader, CardBody } from "@org/ui";

export function SearchBox() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    dateRange: "thisMonth",
    center: "",
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching with:", { searchQuery, ...filters });
    // Trigger search
  };

  return (
    <Card>
      <form onSubmit={handleSearch}>
        <CardHeader>
          <CardTitle>Search Bookings</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Select
              value={filters.status}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              options={[
                { value: "all", label: "All Status" },
                { value: "confirmed", label: "Confirmed" },
                { value: "pending", label: "Pending" },
              ]}
            />
            <Select
              value={filters.dateRange}
              onChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
              options={[
                { value: "today", label: "Today" },
                { value: "thisWeek", label: "This Week" },
                { value: "thisMonth", label: "This Month" },
              ]}
            />
            <Button type="submit">Search</Button>
          </div>
        </CardBody>
      </form>
    </Card>
  );
}
```

---

## 8. Export/Import Features

```tsx
// apps/web/src/components/Bookings/ExportDialog.tsx
import { Dialog, Button, Toast } from "@org/ui";

export function ExportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [isExporting, setIsExporting] = useState(false);
  const [format, setFormat] = useState("csv");

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/bookings/export?format=${format}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bookings.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      showToast("success", "Exported", "Bookings exported successfully");
      onOpenChange(false);
    } catch (error) {
      showToast("error", "Export Failed", "Could not export bookings");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Export Bookings"
      description="Select format to export booking data"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} loading={isExporting}>
            Export
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">Select export format:</p>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setFormat("csv")}
              className={`p-4 border rounded-lg ${format === "csv" ? "border-[#FF6A2F] bg-[#FFF5F1]" : "border-gray-300"}`}
            >
              <div className="font-medium">CSV</div>
              <div className="text-sm text-gray-500">Spreadsheet compatible</div>
            </button>
            <button
              onClick={() => setFormat("pdf")}
              className={`p-4 border rounded-lg ${format === "pdf" ? "border-[#FF6A2F] bg-[#FFF5F1]" : "border-gray-300"}`}
            >
              <div className="font-medium">PDF</div>
              <div className="text-sm text-gray-500">Print-ready format</div>
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
```

---

## Best Practices

### 1. Component Organization

```
components/
├── ui/                    # Base components from @org/ui
├── dashboard/            # Dashboard-specific components
│   ├── MetricsGrid.tsx
│   └── BookingTable.tsx
├── customers/            # Customer-specific components
│   └── CustomerForm.tsx
└── bookings/             # Booking-specific components
    ├── SearchBox.tsx
    └── ExportDialog.tsx
```

### 2. State Management

- Use local state for UI interactions
- Use Context API or Redux for shared state
- Implement loading states with the LoadingOverlay component
- Show empty states when appropriate

### 3. Error Handling

- Display validation errors immediately
- Show toast notifications for async operations
- Implement retry logic for failed operations
- Log errors to monitoring service

### 4. Performance

- Implement pagination for large datasets
- Use virtual scrolling for very long lists
- Memoize expensive calculations
- Lazy load components

### 5. Accessibility

- Always provide labels for form inputs
- Use semantic HTML elements
- Ensure keyboard navigation
- Test with screen readers