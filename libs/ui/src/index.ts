export { SetUpNewCenter } from './lib';
export * from './lib';

// Re-export all components from lib index for single-import convenience
export { Button, variantStyles, sizeStyles } from './components/primitives/Button';
export { Input } from './components/primitives/Input';
export { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from './components/primitives/Card';
export { Spinner } from './components/primitives/Spinner';
export { Skeleton } from './components/primitives/Skeleton';
export { Badge } from './components/primitives/Badge';

// Composite
export { Table, TablePagination } from './components/composite/Table';
export { Dialog } from './components/composite/Dialog';
export { Toast, useToast } from './components/composite/Toast';
export { LoadingOverlay } from './components/composite/LoadingOverlay';
export { EmptyState } from './components/composite/EmptyState';
export { NoData } from './components/composite/NoData';
export { Select } from './components/composite/Select';
export { Textarea } from './components/composite/Textarea';
export { Switch } from './components/composite/Switch';
export { FormItem } from './components/composite/FormItem';
export { icons } from './components/composite/Icons';

// Layout
export { Grid } from './components/layout/Grid';
export { Container } from './components/layout/Container';

// Accessibility
export { SkipLink } from './components/accessibility/SkipLink';
export { useFocusTrap } from './components/accessibility/useFocusTrap';