export type DashboardRole = 'student' | 'adviser' | 'coordinator';

const ROLE_PREFIXES: Record<DashboardRole, string> = {
  student: '/student',
  adviser: '/adviser',
  coordinator: '/coordinator',
};

/** Map stored user_roles values to a dashboard role. */
export function normalizeUserRole(role: string | null | undefined): DashboardRole | null {
  if (!role || typeof role !== 'string') return null;

  const normalized = role.trim().toLowerCase();
  if (normalized === 'student') return 'student';
  if (normalized === 'adviser' || normalized === 'teacher') return 'adviser';
  if (normalized === 'coordinator') return 'coordinator';

  return null;
}

export function getRoleHomePath(role: string | null | undefined): string {
  const dashboardRole = normalizeUserRole(role);
  if (!dashboardRole) return '/onboarding';
  return ROLE_PREFIXES[dashboardRole];
}

export function getRoleProfilePath(role: string | null | undefined): string {
  return `${getRoleHomePath(role)}/profile`;
}

export function getRoleNotificationsPath(role: string | null | undefined): string {
  return `${getRoleHomePath(role)}/notifications`;
}

function isDefenseMeetingPath(pathname: string): boolean {
  return /^\/defenses\/[^/]+\/meeting\/?$/.test(pathname);
}

function getRequiredRoleForPath(pathname: string): DashboardRole | null {
  if (isDefenseMeetingPath(pathname)) {
    return null;
  }

  if (pathname === '/defenses' || pathname.startsWith('/defenses/')) {
    return 'adviser';
  }

  for (const [role, prefix] of Object.entries(ROLE_PREFIXES) as [DashboardRole, string][]) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return role;
    }
  }

  return null;
}

export function canAccessPath(role: string | null | undefined, pathname: string): boolean {
  const requiredRole = getRequiredRoleForPath(pathname);
  if (!requiredRole) return true;

  const userRole = normalizeUserRole(role);
  return userRole === requiredRole;
}

export function isRoleProtectedPath(pathname: string): boolean {
  return getRequiredRoleForPath(pathname) !== null;
}
