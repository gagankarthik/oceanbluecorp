// The portal kit. Import from "@/components/portal/kit"; see ../README.md.
// loading.tsx (server) files import "@/components/portal/kit/skeletons" directly.
export { sectionTone, type Section } from "./tone";
export { Button, Spinner, type ButtonVariant } from "./Button";
export { Page, PageHeader, Panel, KpiRow, InsightsRow, ListPage, ListPageState, PillButton } from "./layout";
export { CrmListSkeleton } from "./skeletons";
export { Modal, ConfirmDialog, Drawer, useDialog, deleteConfirmText } from "./overlay";
export { InsightsSheet, useInSheet } from "./insights";
export { EmptyState, ErrorState, NoAccess } from "./states";
export {
  Skeleton,
  HeaderSkeleton,
  StatCardSkeleton,
  KpiRowSkeleton,
  PanelSkeleton,
  InsightsSkeleton,
  TableSkeleton,
  ListPageSkeleton,
  DashboardSkeleton,
  DetailSkeleton,
  FormSkeleton,
} from "./skeletons";
export { NavProgressProvider, NavProgressBar, useNavProgress, usePortalRouter } from "./NavProgress";
export { StatCard, Segmented, Badge, StatusBadge, statusTone, Avatar, ProgressBar, KeyValue, BarList, type Tone } from "../ui";
