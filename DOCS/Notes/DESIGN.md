# Design System Documentation

## Overview
The Student Research Portal design system provides a cohesive, accessible, and scalable foundation for building the platform's user interface. This document outlines the design tokens, component library, and best practices.

## Color Palette

### Primary Colors
- **Ivory** (`#FEFBF5`) - Primary background, soft off-white
- **Dark Slate Blue** (`#19374C`) - Primary text, deep navy-blue
- **Light Gray** (`#D5D5D5`) - Secondary background, neutral mid-gray
- **Sky Blue** (`#A1C1D9`) - Accent color, soft pastel blue
- **Crimson Red** (`#EC1E24`) - Alerts, errors, CTA
- **Muted Green** (`#76D474`) - Success states

### Extended Color Scale
Each color has a 50-900 scale for flexibility:
- `primary-{50-900}` - Based on Dark Slate Blue
- `accent-{50-900}` - Based on Sky Blue
- `success-{50-900}` - Based on Muted Green
- `error-{50-900}` - Based on Crimson Red
- `warning-{50-900}` - Yellow/amber tones
- `neutral-{50-900}` - Grayscale based on Light Gray

## Typography

### Font Families
- **Sans**: Inter, system-ui, sans-serif (Default)
- **Serif**: Georgia, serif (Headings, formal content)
- **Mono**: Fira Code, monospace (Code, version numbers)

### Font Sizes
```
xs:   0.75rem  (12px)
sm:   0.875rem (14px)
base: 1rem     (16px)
lg:   1.125rem (18px)
xl:   1.25rem  (20px)
2xl:  1.5rem   (24px)
3xl:  1.875rem (30px)
4xl:  2.25rem  (36px)
5xl:  3rem     (48px)
6xl:  3.75rem  (60px)
```

### Heading Hierarchy
- **H1**: 3xl-4xl, bold, primary-700
- **H2**: 2xl-3xl, semibold, primary-700
- **H3**: xl-2xl, semibold, primary-700
- **H4**: lg-xl, medium, primary-700
- **H5**: base-lg, medium, neutral-900
- **H6**: base, medium, neutral-900

## Spacing Scale
Standard spacing follows Tailwind's 4px base unit:
- Custom additions: `18` (4.5rem), `88` (22rem), `112` (28rem), `128` (32rem)

## Border Radius
- `sm`: 0.125rem
- `md`: 0.375rem
- `lg`: 0.5rem
- `xl`: 1rem (Custom)
- `2xl`: 1.5rem (Custom)
- `3xl`: 2rem (Custom)

## Shadows
- **Soft**: `0 2px 15px rgba(0, 0, 0, 0.08)` - Subtle elevation
- **Medium**: `0 4px 25px rgba(0, 0, 0, 0.12)` - Cards, modals
- **Hard**: `0 10px 40px rgba(0, 0, 0, 0.15)` - Popovers, dropdowns

## Animations
- **Fade In**: 0.3s ease-in-out
- **Slide In**: 0.3s ease-out (from left)
- **Slide Up**: 0.3s ease-out (from bottom)

## Component Library

### UI Components (`/components/ui/`)
1. **Button** - Primary, secondary, outline, ghost, success, error, warning variants
2. **Input** - Text input with label, error, helper text, icons
3. **Select** - Dropdown select with validation
4. **Card** - Container with header, title, description, footer subcomponents
5. **Badge** - Status indicators (draft, in-review, approved, etc.)
6. **Modal** - Dialog with overlay, customizable size
7. **Dropdown** - Action menus with icons and dividers
8. **Tabs** - Line and pill variants with badges
9. **Table** - Data table with sorting, striped rows, hover states
10. **Avatar** - User profile pictures with sizes and status indicators
11. **Tag** - Labels with remove functionality
12. **Toast** - Notification system (success, error, warning, info)

### Layout Components (`/components/layout/`)
1. **DashboardLayout** - Main layout with sidebar, header, footer
2. **Sidebar** - Role-based navigation (student, adviser, coordinator)
3. **Header** - Top navigation with user menu and notifications
4. **Footer** - Site footer with links
5. **EmptyState** - Placeholder for empty content areas

## Usage Guidelines

### Button Variants
- **Primary**: Main actions (Submit, Create, Save)
- **Secondary**: Secondary actions (Cancel, Back)
- **Outline**: Alternative actions
- **Ghost**: Tertiary actions, icon buttons
- **Success**: Positive confirmations (Approve, Accept)
- **Error**: Destructive actions (Delete, Remove)
- **Warning**: Caution actions

### Badge Usage
- **Draft**: Work in progress
- **In Review**: Submitted for feedback
- **Approved**: Accepted/completed
- **Rejected**: Declined
- **In Progress**: Active work
- **Pending**: Awaiting action

### Color Context
- Use `primary` colors for navigation, headers, primary actions
- Use `accent` colors for highlights, interactive elements
- Use `success` for positive feedback, completed states
- Use `error` for alerts, validation errors, destructive actions
- Use `warning` for caution, pending states
- Use `neutral` for text, borders, backgrounds

## Accessibility

### Contrast Ratios
All color combinations meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)

### Focus States
All interactive elements have visible focus rings using `focus:ring-2` with appropriate color

### Keyboard Navigation
- Modals close on Escape key
- Dropdowns close on outside click
- Tab navigation follows logical order

## Responsive Design

### Breakpoints (Tailwind defaults)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Mobile-First Approach
Design for mobile first, then enhance for larger screens using `md:`, `lg:` prefixes

## Component Examples

### Creating a Form
\`\`\`tsx
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/Button';

<form>
  <Input 
    label="Project Title" 
    placeholder="Enter title"
    required 
  />
  <Select
    label="Status"
    options={[
      { value: 'draft', label: 'Draft' },
      { value: 'review', label: 'In Review' }
    ]}
  />
  <Button variant="primary" type="submit">
    Submit
  </Button>
</form>
\`\`\`

### Creating a Data Table
\`\`\`tsx
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';

<Table
  data={projects}
  columns={[
    { key: 'title', header: 'Title' },
    { 
      key: 'status', 
      header: 'Status',
      render: (project) => <Badge variant={project.status}>{project.status}</Badge>
    }
  ]}
  keyExtractor={(item) => item.id}
/>
\`\`\`

### Using the Dashboard Layout
\`\`\`tsx
import DashboardLayout from '@/components/layout/DashboardLayout';

<DashboardLayout 
  role="student" 
  user={userData}
  onLogout={handleLogout}
>
  {/* Your page content */}
</DashboardLayout>
\`\`\`

## Future Enhancements
- Dark mode support
- RTL language support
- Animation preferences (reduced motion)
- Custom theme builder
- Component playground
