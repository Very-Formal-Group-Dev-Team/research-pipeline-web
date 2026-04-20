/**
 * Mock data for the frontend demo.
 * All API calls are replaced with this static data.
 */

// ─── Users ──────────────────────────────────────────────────────────────────

export interface MockUser {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: 'student' | 'adviser' | 'coordinator';
}

export const MOCK_STUDENT: MockUser = {
  id: 'user-001',
  full_name: 'Juan Dela Cruz',
  email: 'juan.delacruz@mmcm.edu.ph',
  avatar_url: undefined,
  role: 'student',
};

export const MOCK_ADVISER: MockUser = {
  id: 'user-002',
  full_name: 'Dr. Maria Santos',
  email: 'maria.santos@mmcm.edu.ph',
  avatar_url: undefined,
  role: 'adviser',
};

export const MOCK_COORDINATOR: MockUser = {
  id: 'user-003',
  full_name: 'Prof. Michael Anderson',
  email: 'michael.anderson@mmcm.edu.ph',
  avatar_url: undefined,
  role: 'coordinator',
};

// ─── Projects ───────────────────────────────────────────────────────────────

export interface MockProject {
  id: string;
  project_code: string;
  title: string;
  description: string;
  abstract?: string;
  project_type: string;
  paper_standard: string;
  status: string;
  keywords: string[];
  document_reference?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  program?: string;
  course?: string;
  section?: string;
}

export const MOCK_PROJECTS: MockProject[] = [
  {
    id: 'proj-001',
    project_code: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    title: 'AI-Powered Academic Writing Assistant',
    description: 'A research project focused on developing an AI tool that helps students improve their academic writing through real-time feedback and suggestions.',
    abstract: 'This study aims to develop an artificial intelligence-powered writing assistant specifically designed for academic contexts. Utilizing natural language processing techniques, the system provides real-time grammar corrections, style improvements, and citation suggestions.',
    project_type: 'Thesis',
    paper_standard: 'IEEE',
    status: 'In Progress',
    keywords: ['Artificial Intelligence', 'NLP', 'Academic Writing', 'Machine Learning'],
    created_by: 'user-001',
    created_at: '2025-09-15T08:00:00Z',
    updated_at: '2026-01-20T14:30:00Z',
    program: 'BSCS',
    course: 'CS 400',
    section: 'A',
  },
  {
    id: 'proj-002',
    project_code: 'f7g8h9i0-j1k2-3456-lmno-pq7890123456',
    title: 'Smart Campus IoT Monitoring System',
    description: 'Design and implementation of an IoT-based environmental monitoring system for the campus facilities.',
    abstract: 'This research proposes a Smart Campus IoT Monitoring System that utilizes interconnected sensors to monitor environmental parameters such as temperature, humidity, and air quality across campus buildings.',
    project_type: 'Capstone',
    paper_standard: 'APA',
    status: 'Proposal',
    keywords: ['IoT', 'Smart Campus', 'Environmental Monitoring', 'Embedded Systems'],
    created_by: 'user-001',
    created_at: '2025-11-01T10:00:00Z',
    updated_at: '2026-02-10T09:00:00Z',
    program: 'BSCS',
    course: 'CS 401',
    section: 'B',
  },
  {
    id: 'proj-003',
    project_code: 'x1y2z3a4-b5c6-7890-defg-hi1234567890',
    title: 'Blockchain-Based Student Records Verification',
    description: 'Exploring the use of blockchain technology for secure and tamper-proof student academic records.',
    project_type: 'Thesis',
    paper_standard: 'IEEE',
    status: 'Completed',
    keywords: ['Blockchain', 'Security', 'Academic Records', 'Decentralization'],
    created_by: 'user-001',
    created_at: '2024-06-10T08:00:00Z',
    updated_at: '2025-05-15T16:00:00Z',
    program: 'BSIT',
    course: 'IT 400',
    section: 'A',
  },
];

// Projects for adviser view
export const MOCK_ADVISED_PROJECTS: MockProject[] = [
  {
    id: 'proj-001',
    project_code: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    title: 'AI-Powered Academic Writing Assistant',
    description: 'A research project focused on developing an AI tool for academic writing.',
    project_type: 'Thesis',
    paper_standard: 'IEEE',
    status: 'In Progress',
    keywords: ['AI', 'NLP'],
    created_by: 'user-001',
    created_at: '2025-09-15T08:00:00Z',
    updated_at: '2026-01-20T14:30:00Z',
  },
  {
    id: 'proj-004',
    project_code: 'd4e5f6g7-h8i9-0123-jklm-no4567890123',
    title: 'Mobile Health Tracking Application',
    description: 'Development of a cross-platform mobile application for tracking personal health metrics.',
    project_type: 'Capstone',
    paper_standard: 'APA',
    status: 'Pre-Defense',
    keywords: ['Mobile Development', 'Health Tech'],
    created_by: 'user-005',
    created_at: '2025-08-01T08:00:00Z',
    updated_at: '2026-02-01T10:00:00Z',
  },
  {
    id: 'proj-005',
    project_code: 'e5f6g7h8-i9j0-1234-klmn-op5678901234',
    title: 'Augmented Reality Campus Tour',
    description: 'An AR-based campus tour guide for new students and visitors.',
    project_type: 'Thesis',
    paper_standard: 'IEEE',
    status: 'Approved',
    keywords: ['AR', 'Campus', 'Tour'],
    created_by: 'user-006',
    created_at: '2025-07-15T08:00:00Z',
    updated_at: '2025-12-20T14:00:00Z',
  },
];

// ─── Project Members ────────────────────────────────────────────────────────

export interface MockProjectMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  users: {
    full_name: string;
    email: string;
    avatar_url?: string;
  } | null;
}

export const MOCK_PROJECT_MEMBERS: MockProjectMember[] = [
  {
    id: 'member-001',
    user_id: 'user-001',
    role: 'owner',
    status: 'accepted',
    users: {
      full_name: 'Juan Dela Cruz',
      email: 'juan.delacruz@mmcm.edu.ph',
    },
  },
  {
    id: 'member-002',
    user_id: 'user-004',
    role: 'member',
    status: 'accepted',
    users: {
      full_name: 'Ana Marie Reyes',
      email: 'ana.reyes@mmcm.edu.ph',
    },
  },
  {
    id: 'member-003',
    user_id: 'user-005',
    role: 'member',
    status: 'accepted',
    users: {
      full_name: 'Carlos Garcia',
      email: 'carlos.garcia@mmcm.edu.ph',
    },
  },
  {
    id: 'member-004',
    user_id: 'user-002',
    role: 'adviser',
    status: 'accepted',
    users: {
      full_name: 'Dr. Maria Santos',
      email: 'maria.santos@mmcm.edu.ph',
    },
  },
];

// ─── Invitations ────────────────────────────────────────────────────────────

export interface MockInvitation {
  id: number;
  type: string;
  projectTitle: string;
  from: string;
  date: string;
  status: string;
  description?: string;
  icon?: string;
}

export const MOCK_DASHBOARD_INVITATIONS: MockInvitation[] = [
  {
    id: 1,
    type: 'collaborator',
    projectTitle: 'Advanced Research Methods',
    from: 'Dr. Sarah Johnson',
    date: '2 days ago',
    status: 'pending',
    description: 'Research project focusing on quantitative analysis and statistical modeling',
    icon: '📊',
  },
  {
    id: 2,
    type: 'adviser',
    projectTitle: 'Machine Learning Fundamentals',
    from: 'Prof. Michael Chen',
    date: '1 week ago',
    status: 'pending',
    description: 'Introduction to ML algorithms and their applications in research',
    icon: '🤖',
  },
  {
    id: 3,
    type: 'collaborator',
    projectTitle: 'Literature Review Workshop',
    from: 'Dr. Emily Martinez',
    date: '3 days ago',
    status: 'pending',
    description: 'Learn systematic approaches to conducting comprehensive literature reviews',
    icon: '📚',
  },
];

export const MOCK_INVITATIONS_PAGE: MockInvitation[] = [
  {
    id: 1,
    type: 'collaborator',
    projectTitle: 'Machine Learning for Climate Prediction',
    from: 'Dr. Sarah Martinez',
    date: '2 days ago',
    status: 'pending',
  },
  {
    id: 2,
    type: 'adviser',
    projectTitle: 'Blockchain in Healthcare',
    from: 'Prof. Michael Chen',
    date: '1 week ago',
    status: 'pending',
  },
];

// ─── Defenses ───────────────────────────────────────────────────────────────

export interface MockDefense {
  id: number;
  projectTitle: string;
  type: string;
  date: string;
  time: string;
  location: string;
  panel: string[];
}

export const MOCK_DEFENSES: MockDefense[] = [
  {
    id: 1,
    projectTitle: 'AI-Powered Academic Writing Assistant',
    type: 'Proposal Defense',
    date: 'March 15, 2026',
    time: '2:00 PM - 4:00 PM',
    location: 'Room 305, Engineering Building',
    panel: ['Dr. Jane Smith', 'Prof. Robert Johnson', 'Dr. Maria Garcia'],
  },
  {
    id: 2,
    projectTitle: 'Smart Campus IoT Monitoring System',
    type: 'Final Defense',
    date: 'April 20, 2026',
    time: '9:00 AM - 11:00 AM',
    location: 'Room 201, Science Building',
    panel: ['Dr. Maria Santos', 'Prof. David Lee', 'Dr. Anna Cruz'],
  },
];

// ─── Coordinator Stats ──────────────────────────────────────────────────────

export const MOCK_COORDINATOR_STATS = {
  totalProjects: 156,
  activeStudents: 420,
  facultyAdvisers: 32,
  defensesThisMonth: 18,
};

export const MOCK_ADVISER_STATS = {
  totalAdvisees: 24,
  activeProjects: 12,
  upcomingDefenses: 3,
  completedProjects: 18,
};
