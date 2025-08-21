export interface SectionHeaderProps {
  title: string;
  actionText?: string;
  onActionClick?: () => void;
  showFilter?: boolean;
  onFilterChange?: (value: string) => void;
}
