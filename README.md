# Student Research Monitoring and Collaboration Portal

A comprehensive web-based platform for managing academic research projects from proposal to publication, initially targeting Mapúa Malayan Colleges with plans to expand to other institutions.

## 🎯 Features

### Core Functionality
- **User Authentication** - Google OAuth + Email authentication via Supabase
- **Project Management** - Create, track, and manage research projects
- **Collaboration** - Invite collaborators, advisers, and panel members
- **Document Management** - Upload and version control (GitHub-style)
- **Defense Scheduling** - Coordinate and schedule defense events
- **Evaluation System** - Rubric-based grading during defenses
- **Role-Based Dashboards** - Student, Adviser, and Coordinator views

### Tech Stack
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Icons**: React Icons

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd student-research-web
```

2. Install dependencies
```bash
pnpm install
```

3. Set up environment variables
Create a \`.env.local\` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📁 Project Structure

```
student-research-web/
├── app/
│   ├── (auth)/              # Authentication routes (login, register)
│   ├── (dashboard)/         # Protected dashboard routes
│   │   ├── student/         # Student-specific pages
│   │   ├── adviser/         # Adviser-specific pages
│   │   └── coordinator/     # Coordinator-specific pages
│   ├── dev/                 # Development tools (component showcase)
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/
│   ├── ui/                  # Reusable UI components
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Dropdown.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Select.tsx
│   │   ├── Table.tsx
│   │   ├── Tabs.tsx
│   │   ├── Tag.tsx
│   │   └── Toast.tsx
│   └── layout/              # Layout components
│       ├── DashboardLayout.tsx
│       ├── EmptyState.tsx
│       ├── Footer.tsx
│       ├── Header.tsx
│       └── Sidebar.tsx
├── lib/
│   └── supabaseClient.tsx   # Supabase configuration
├── middleware.ts            # Route protection middleware
├── tailwind.config.js       # Tailwind CSS configuration
├── DESIGN.md               # Design system documentation
└── README.md
```

## 🎨 Design System

The project uses a custom design system built with Tailwind CSS. See [DESIGN.md](./DESIGN.md) for detailed documentation.

### Key Design Tokens
- **Colors**: Primary (Dark Slate Blue), Accent (Sky Blue), Success (Muted Green), Error (Crimson Red)
- **Typography**: Inter (sans), Georgia (serif), Fira Code (mono)
- **Components**: 11 core UI components + 5 layout components

### Component Showcase
Visit `/dev/components` in development mode to see all available components with interactive examples.

## 🔐 Authentication & Authorization

### Routes
- **Public**: `/`, `/login`, `/register`
- **Protected**: All `/dashboard/*` routes

### Roles
1. **Student** - Create projects, collaborate, view defenses
2. **Adviser** - Manage advisees, review projects, schedule defenses
3. **Coordinator** - System-wide management, rubrics, user administration

### Middleware
Route protection is handled by Next.js middleware that checks Supabase authentication tokens.

## 📱 Dashboard Features

### Student Dashboard
- My Projects overview
- Create new projects
- Manage invitations
- View upcoming defenses
- Profile management

### Adviser Dashboard
- Advisee management
- Projects overview
- Defense scheduling
- Document reviews

### Coordinator Dashboard
- System-wide statistics
- All projects view
- Defense management
- Rubric configuration
- User administration

## 🧩 Component Usage

### Example: Creating a Form
```tsx
import { Input, Select, Button } from '@/components/ui';

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
```

### Example: Using Dashboard Layout
```tsx
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function MyPage() {
  return (
    <DashboardLayout role="student" user={userData} onLogout={handleLogout}>
      {/* Your content */}
    </DashboardLayout>
  );
}
```

## 🛠️ Development

### Available Scripts
- \`pnpm dev\` - Start development server
- \`pnpm build\` - Build for production
- \`pnpm start\` - Start production server
- \`pnpm lint\` - Run ESLint

### Code Style
- TypeScript for type safety
- Client components use \`'use client'\` directive
- Tailwind CSS for styling (avoid inline styles)
- Components follow atomic design principles

## 📋 Roadmap

### Phase 1: Core UI Foundation ✅
- [x] Design system configuration
- [x] Component library (11 UI + 5 Layout components)
- [x] Route structure with (auth) and (dashboard) groups
- [x] Role-based navigation
- [x] Authentication middleware

### Phase 2: Backend Integration (Next)
- [ ] Supabase database schema
- [ ] User role management
- [ ] Project CRUD operations
- [ ] Invitation system
- [ ] Document upload/storage

### Phase 3: Collaboration Features
- [ ] Real-time comments
- [ ] Document version control
- [ ] Notification system
- [ ] Activity feeds

### Phase 4: Defense Management
- [ ] Schedule creation
- [ ] Rubric builder
- [ ] Panel evaluation interface
- [ ] Results dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

Developed for Mapúa Malayan Colleges

## 📞 Support

For issues and questions, please create an issue in the GitHub repository.

