// ─────────────────────────── Design tokens ───────────────────────────
export * from "./tokens";

// ─────────────────────────── Layout ───────────────────────────
export { default as PageContainer } from "./layout/PageContainer";
export { default as PageHeader } from "./layout/PageHeader";
export { default as Section } from "./layout/Section";
export { default as SectionGroup } from "./layout/SectionGroup";
export { default as Toolbar } from "./layout/Toolbar";

// ─────────────────────────── Controls ───────────────────────────
export { default as Button } from "./controls/Button";
export { default as IconButton } from "./controls/IconButton";
export { default as Input } from "./controls/Input";
export { default as Textarea } from "./controls/Textarea";
export { default as Select } from "./controls/Select";
export { default as NumberInput } from "./controls/NumberInput";
export { default as Checkbox } from "./controls/Checkbox";
export { default as Switch } from "./controls/Switch";
export { default as SearchField } from "./controls/SearchField";
export { default as Field, Label, inputClasses } from "./controls/Field";
export { default as FormGrid, FormRow } from "./controls/FormGrid";

// ─────────────────────────── Display ───────────────────────────
export { default as StatTile } from "./display/StatTile";
export { default as StatusBadge } from "./display/StatusBadge";
export { default as RoleBadge } from "./display/RoleBadge";
export { default as RarityBadge } from "./display/RarityBadge";
export { default as Avatar } from "./display/Avatar";
export { default as MoneyAmount } from "./display/MoneyAmount";
export { default as DateTag } from "./display/DateTag";
export { default as EmptyState } from "./display/EmptyState";
export { default as Skeleton } from "./display/Skeleton";
export { default as KeyValueList } from "./display/KeyValueList";
export { default as DataList } from "./display/DataList";

// ─────────────────────────── Feedback ───────────────────────────
export { default as Modal } from "./feedback/Modal";
export { default as ConfirmDialog } from "./feedback/ConfirmDialog";
export { default as Tabs } from "./feedback/Tabs";

// ─────────────────────────── Composants existants (compat) ───────────────────────────
export { default as Card } from "./Card";
export { default as Toast } from "./Toast";
export { default as MessageModal } from "./MessageModal";
export { default as UserSearchSelect } from "./UserSearchSelect";
export { default as NotificationCenter } from "./NotificationCenter";
export { default as SettingsPanel } from "./SettingsPanel";
export { default as SecureDeleteButton } from "./SecureDeleteButton";
export { default as ErrorBoundary } from "./ErrorBoundary";

// ─────────────────────────── Hooks partagés ───────────────────────────
export { default as useConfirm } from "../../hooks/useConfirm";
export { default as useDebouncedValue } from "../../hooks/useDebouncedValue";
export { default as useFormSubmit } from "../../hooks/useFormSubmit";
