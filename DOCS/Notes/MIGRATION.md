# Migration Guide: Old Routes → New Routes

This document helps you navigate from the old route structure to the new organized structure.

## Route Changes

### Authentication Routes (Moved to `(auth)` group)

| Old Path | New Path | Notes |
|----------|----------|-------|
| `/login` | `/(auth)/login` | Same URL, different file location |
| `/register` | `/(auth)/register` | Same URL, different file location |

**File Locations:**
- Old: `app/login/page.tsx` → New: `app/(auth)/login/page.tsx`
- Old: `app/register/page.tsx` → New: `app/(auth)/register/page.tsx`

### Student Routes (Reorganized under `(dashboard)/student`)

| Old Path | New Path | Component |
|----------|----------|-----------|
| `/home-student` | `/dashboard/student/projects` | My Projects |
| `/home-student/dashboard` | `/dashboard/student/projects` | Combined into projects |
| N/A | `/dashboard/student/invitations` | New - Invitations |
| N/A | `/dashboard/student/defenses` | New - Defense Schedule |
| N/A | `/dashboard/student/profile` | New - Profile |

### Adviser Routes (New Structure)

| Path | Description |
|------|-------------|
| `/dashboard/adviser` | Adviser dashboard homepage |
| `/dashboard/adviser/advisees` | Manage advisees |
| `/dashboard/adviser/projects` | View all projects |
| `/dashboard/adviser/defenses` | Defense scheduling |
| `/dashboard/adviser/profile` | Adviser profile |

### Coordinator Routes (New Structure)

| Path | Description |
|------|-------------|
| `/dashboard/coordinator` | Coordinator dashboard |
| `/dashboard/coordinator/projects` | All projects view |
| `/dashboard/coordinator/defenses` | Defense management |
| `/dashboard/coordinator/rubrics` | Rubric configuration |
| `/dashboard/coordinator/users` | User management |
| `/dashboard/coordinator/settings` | System settings |

## Component Import Changes

### Old Imports
\`\`\`tsx
import Button from '@/components/Button';
import StatusIcon from '@/components/StatusIcon';
\`\`\`

### New Imports (Multiple Options)

**Option 1: Direct Imports**
\`\`\`tsx
import Button from '@/components/Button';
import { Card, Badge, Input } from '@/components/ui';
import { DashboardLayout, Header } from '@/components/layout';
\`\`\`

**Option 2: Barrel Imports**
\`\`\`tsx
import * as UI from '@/components/ui';
import * as Layout from '@/components/layout';

<UI.Card>
  <UI.Badge>Status</UI.Badge>
</UI.Card>
\`\`\`

## New Components Available

### UI Components (`/components/ui/`)
1. ✅ `Button` - Enhanced with new variants
2. ✅ `StatusIcon` - Existing, now integrated
3. 🆕 `Input` - Form input with validation
4. 🆕 `Select` - Dropdown select
5. 🆕 `Card` - Content container
6. 🆕 `Badge` - Status badges
7. 🆕 `Modal` - Dialog/popup
8. 🆕 `Dropdown` - Action menus
9. 🆕 `Tabs` - Tab navigation
10. 🆕 `Table` - Data table
11. 🆕 `Avatar` - User avatars
12. 🆕 `Tag` - Labels
13. 🆕 `Toast` - Notifications

### Layout Components (`/components/layout/`)
1. 🆕 `DashboardLayout` - Main dashboard wrapper
2. 🆕 `Sidebar` - Navigation sidebar
3. 🆕 `Header` - Top navigation
4. 🆕 `Footer` - Page footer
5. 🆕 `EmptyState` - Empty placeholders

## Authentication Changes

### Old Approach (Per-page)
\`\`\`tsx
// In every dashboard page
useEffect(() => {
  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) router.push('/login');
  };
  checkAuth();
}, []);
\`\`\`

### New Approach (Centralized)

**Middleware** (`middleware.ts`):
- Automatically protects all `/dashboard/*` routes
- Redirects unauthenticated users to `/login`
- Redirects authenticated users away from `/login` and `/register`

**Dashboard Layout** (`app/(dashboard)/layout.tsx`):
- Handles auth state management
- Shows loading state during auth check
- Shared across all dashboard pages

### Migration Example

**Before:**
\`\`\`tsx
// app/home-student/dashboard/page.tsx
export default function Dashboard() {
  const [user, setUser] = useState(null);
  // ... auth logic
  return <div>Content</div>;
}
\`\`\`

**After:**
\`\`\`tsx
// app/(dashboard)/student/projects/page.tsx
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function StudentProjectsPage() {
  // No auth logic needed - handled by middleware & layout
  return (
    <DashboardLayout role="student" user={user} onLogout={handleLogout}>
      <div>Content</div>
    </DashboardLayout>
  );
}
\`\`\`

## Button Variant Changes

### Old Props
\`\`\`tsx
<Button color="primaryBg" size="md">Click</Button>
<Button color="alert">Delete</Button>
\`\`\`

### New Props (Backward Compatible)
\`\`\`tsx
// New variants (recommended)
<Button variant="primary" size="md">Click</Button>
<Button variant="error">Delete</Button>

// Old variants still work
<Button variant="primaryBg" size="md">Click</Button>
<Button variant="alert">Delete</Button>
\`\`\`

### New Features
\`\`\`tsx
<Button 
  variant="primary" 
  leftIcon={<FiPlus />}
  loading={isLoading}
  fullWidth
>
  Create Project
</Button>
\`\`\`

## Key Differences

### Route Groups
- Parentheses in folder names like `(auth)` and `(dashboard)` don't appear in URLs
- `app/(auth)/login/page.tsx` → URL: `/login`
- `app/(dashboard)/student/projects/page.tsx` → URL: `/dashboard/student/projects`

### Layout Inheritance
- `app/(auth)/layout.tsx` wraps all auth pages
- `app/(dashboard)/layout.tsx` wraps all dashboard pages
- Reduces code duplication

### Sidebar Navigation
Old pages had hardcoded navigation. New structure uses:
- `<Sidebar role="student" />` - Shows student menu
- `<Sidebar role="adviser" />` - Shows adviser menu
- `<Sidebar role="coordinator" />` - Shows coordinator menu

## Testing Checklist

- [ ] Navigate to `/login` - should show auth layout
- [ ] Login successfully - should redirect to dashboard
- [ ] Try accessing `/dashboard/student/projects` without auth - should redirect to login
- [ ] Check sidebar navigation - links should highlight active page
- [ ] Test logout - should redirect to login
- [ ] Visit `/dev/components` - should show component showcase

## Breaking Changes

1. **Old route paths** like `/home-student` need to be updated to `/dashboard/student/projects`
2. **Button prop** `color` is now `variant` (but `color` still works for backward compatibility)
3. **Auth logic** should be removed from individual pages (handled by middleware)

## Need Help?

- See [DESIGN.md](./DESIGN.md) for design system documentation
- See [README.md](./README.md) for project overview
- Visit `/dev/components` for component examples
