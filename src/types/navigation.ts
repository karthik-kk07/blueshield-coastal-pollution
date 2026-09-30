export type AppRoute =
  | '/'
  | '/login'
  | '/register'
  | '/report'
  | '/verify'
  | '/assignments'
  | `/assignments/${string}`
  | '/field'
  | '/dashboard'
  | '/map'
  | '/analytics'
  | '/hotspots'
  | '/prevention'
  | '/entry-points'
  | '/profile'
  | '/admin'
  | '/admin/historical-data';

export interface NavItem {
  label: string;
  href: AppRoute;
  iconName: string;
  requiredRole?: ('public_reporter' | 'verified_volunteer' | 'field_officer' | 'analyst' | 'admin')[];
  badgeCount?: number;
}
