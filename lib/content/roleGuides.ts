import type { DashboardRole } from '@/lib/auth/roleAccess';

export type RoleGuideVariant = 'concise' | 'full';

export interface RoleCapability {
  label: string;
  description: string;
}

export interface RoleWorkflow {
  title: string;
  steps: string[];
}

export interface RoleGuideConcise {
  role: DashboardRole;
  label: string;
  overview: string;
  keyTasks: string[];
  capabilities: RoleCapability[];
}

export interface RoleGuideFull extends RoleGuideConcise {
  workflows: RoleWorkflow[];
  tips: string[];
}

export type RoleGuide = RoleGuideConcise | RoleGuideFull;

export const ROLE_GUIDE_ORDER: DashboardRole[] = [
  'student',
  'adviser',
  'coordinator',
  'admin',
];

export const CONCISE_ROLE_GUIDES: Record<DashboardRole, RoleGuideConcise> = {
  student: {
    role: 'student',
    label: 'Student',
    overview:
      'Your student account is ready. You can join or create a research project, collaborate with your team, upload and version papers, leave and respond to inline document comments, and track defenses and meetings.',
    keyTasks: [
      'Join an existing project with a project code or accept a pending invitation',
      'Create a new research project and invite teammates and advisers',
      'Upload and version your research papers, then request adviser review',
      'Open any paper version to read adviser feedback and add inline comments on the manuscript',
      'Check Events for defenses, meetings, and institution announcements',
      'Respond to notifications about reviews, comments, invitations, and project updates',
    ],
    capabilities: [
      { label: 'Dashboard', description: 'Announcements, invitations, and quick actions' },
      { label: 'My Projects', description: 'View, create, and manage your research projects and paper versions' },
      { label: 'Document comments', description: 'Inline comments on paper versions with replies and status tracking' },
      { label: 'Notifications', description: 'Alerts for invitations, reviews, comments, and project activity' },
      { label: 'Events', description: 'Defenses, meetings, and institution events' },
      { label: 'Recordings', description: 'Recorded meetings and transcripts' },
      { label: 'Profile', description: 'Update your display name, avatar, and status' },
    ],
  },
  adviser: {
    role: 'adviser',
    label: 'Teacher / Adviser',
    overview:
      'Your adviser account is ready. You can manage advisee projects, review papers with inline document comments, schedule meetings, and monitor defense schedules for your students.',
    keyTasks: [
      'Review advisee projects and leave inline comments on paper versions',
      'Resolve comments or request revision as students address your feedback',
      'Schedule and attend adviser meetings with your students',
      'Advance projects through research stages as students progress',
      'Create and manage evaluation rubrics for defenses',
      'Stay on top of notifications for review requests and schedule changes',
    ],
    capabilities: [
      { label: 'Dashboard', description: 'Stats on advisees, projects, events, and pending reviews' },
      { label: 'My Advisees', description: 'View advised projects, papers, meetings, and team details' },
      { label: 'Document comments', description: 'Inline feedback on manuscripts with resolve and revision requests' },
      { label: 'Notifications', description: 'Review requests, comment updates, invitations, and schedule alerts' },
      { label: 'Events', description: 'Institution events, meetings, and defense schedules' },
      { label: 'Recordings', description: 'Recorded meetings and transcripts' },
      { label: 'Rubrics', description: 'View and manage evaluation rubrics' },
      { label: 'Profile', description: 'Update your display name, avatar, and status' },
    ],
  },
  coordinator: {
    role: 'coordinator',
    label: 'Coordinator',
    overview:
      'Your coordinator account is ready. You can manage institution courses, advisers, defenses, and projects across your organization.',
    keyTasks: [
      'Set up courses and assign faculty advisers to student groups',
      'Review and approve defense schedules in the pending queue',
      'Manage institution-wide events and calendars',
      'Oversee all projects and track progress across advisers',
      'Create and maintain rubrics used for evaluations',
    ],
    capabilities: [
      { label: 'Dashboard', description: 'Institution stats, defense verification, and calendar overview' },
      { label: 'Events', description: 'Institution events and defense schedules' },
      { label: 'Notifications', description: 'Defense and schedule notifications' },
      { label: 'Recordings', description: 'Recorded meetings and transcripts' },
      { label: 'Courses', description: 'Create courses and assign faculty advisers' },
      { label: 'All Projects', description: 'Browse projects by adviser or institution-wide' },
      { label: 'Rubrics', description: 'Create and manage evaluation rubrics' },
      { label: 'Profile', description: 'Update your display name, avatar, and status' },
    ],
  },
  admin: {
    role: 'admin',
    label: 'Admin',
    overview:
      'Your admin account is ready. You manage institutions and programs that power the research portal for your organization.',
    keyTasks: [
      'Register and manage institutions in the system',
      'Configure programs under each institution',
      'Enable or disable institutions as needed',
      'Monitor the platform setup for coordinators and users',
    ],
    capabilities: [
      { label: 'Dashboard', description: 'Platform overview with quick access to institutions' },
      { label: 'Institutions', description: 'Create, list, and manage institutions and programs' },
      { label: 'Profile', description: 'Update your display name, avatar, and status' },
    ],
  },
};

export const FULL_ROLE_GUIDES: Record<DashboardRole, RoleGuideFull> = {
  student: {
    ...CONCISE_ROLE_GUIDES.student,
    overview:
      'Your student account is ready. Archivum is where you manage your research project from first draft through defense. You can create a project and invite teammates, join an existing group with a project code, or accept an invitation from a leader or adviser. Upload papers with version history, request adviser feedback, exchange inline comments on the manuscript, track meetings and defenses on your schedule, and stay on top of invitations and review updates through notifications.',
    keyTasks: [
      'Create a new research project (Thesis or Capstone) and invite collaborators and advisers',
      'Join an existing project using a project code from the dashboard, or accept a pending invitation',
      'Upload and version your research papers with commit messages and document previews',
      'Request adviser review on your latest paper version with a focus note',
      'Open Comment on any paper version to read adviser feedback, reply in threads, and add your own inline notes',
      'Manage your team: share your project code, approve join requests, and invite members',
      'Edit your abstract, project details, and keywords (including AI-assisted keyword extraction)',
      'Check Events for institution announcements, adviser meetings, and defense schedules',
      'Join online meetings and defenses, then revisit recordings and transcripts afterward',
      'Respond to notifications about invitations, join requests, reviews, comment updates, and schedule changes',
      'Keep your profile up to date with a display name, avatar, and status message',
    ],
    capabilities: [
      {
        label: 'Dashboard',
        description:
          'Your home base: announcements calendar, join-a-project card, pending invitations, and quick links to events.',
      },
      {
        label: 'My Projects',
        description:
          'Browse, search, and filter all projects you belong to. Create new projects, accept invitations, and open any project to manage papers, team, and details. Each paper version has a Comment link for inline manuscript feedback.',
      },
      {
        label: 'Document comments',
        description:
          'Select text in the document preview to leave a comment anchored to that passage. Read adviser feedback in the comments sidebar, reply in threads, and filter by status (open, needs revision, resolved) or author. Comment counts appear on each version in Paper Version History.',
      },
      {
        label: 'Notifications',
        description:
          'Central inbox for project invitations, join requests, paper review updates, comment activity, defense and meeting alerts, and other project activity. Mark items read as you go.',
      },
      {
        label: 'Events',
        description:
          'Three tabs (Events, Meetings, and Defenses) showing institution activities, adviser meetings you can join, and defense schedules for your projects.',
      },
      {
        label: 'Recordings',
        description:
          'Watch meeting and defense recordings with synced transcripts. Open from the sidebar or via Transcription links on event cards.',
      },
      {
        label: 'Profile',
        description:
          'Update your display name, profile photo, and status. Email and role are managed by your institution.',
      },
    ],
    workflows: [
      {
        title: 'Start or join a research project',
        steps: [
          'From the dashboard, choose Create Project or enter a project code under Join a Project.',
          'If invited, accept the invitation from the dashboard, My Projects, or Notifications.',
          'After joining, open the project to view your project code, team, and paper history.',
          'Share your project code with teammates who still need to join, or invite them directly from the project page.',
        ],
      },
      {
        title: 'Submit a paper version for adviser review',
        steps: [
          'Open your project and go to Paper Version History.',
          'If you have no versions yet, generate a template for your paper standard or upload your first DOC/DOCX file.',
          'Upload a new version with a commit message describing what changed.',
          'On the latest real upload, choose Request Review and add a focus note (at least 20 characters) for your adviser.',
          'Watch for a review notification. You can withdraw a pending request if you need to upload a correction first.',
        ],
      },
      {
        title: 'Work with inline document comments',
        steps: [
          'From Paper Version History, choose Comment on the version you want to discuss.',
          'Read highlighted passages and adviser notes in the comments sidebar. Click a comment to jump to its location in the document.',
          'Select text in the preview to add your own inline comment or reply to an existing thread.',
          'Address comments marked needs revision in your next upload, then reply or ask your adviser to resolve them.',
          'Use the sidebar filters to focus on open items or comments from your adviser.',
        ],
      },
      {
        title: 'Prepare for a meeting or defense',
        steps: [
          'Open Events and check the Meetings or Defenses tab for upcoming sessions.',
          'Expand defense cards to see location, adviser, and panelist details.',
          'Use Join Meeting or Join Defense when the session is online.',
          'After the session, open Recordings or the Transcription link to review what was discussed.',
        ],
      },
      {
        title: 'Manage your project team',
        steps: [
          'Open your project and scroll to Team Members.',
          'As leader, approve or decline join requests from students who used your project code.',
          'Use Invite Members to add collaborators or advisers by name.',
          'Transfer leadership to a collaborator before leaving if you are the project leader.',
        ],
      },
    ],
    tips: [
      'There are three ways to join a project: create one, accept an invitation, or enter a project code on the dashboard.',
      'Only the latest uploaded paper version can be sent for adviser review, not templates or older versions.',
      'Inline comments are anchored to selected text. If you edit that passage in a new version, Archivum flags the comment as modified or orphaned.',
      'Comment threads stay on the version where they were created. Open a newer version to see how earlier feedback maps forward.',
      'Projects lock when marked Completed or For Publication: you cannot leave or submit new review requests.',
      'Research stages (Topic Proposal through For Publication) are updated by your adviser. You can view but not change them.',
      'Use cross-referencing on your project to discover related studies after setting keywords.',
    ],
  },
  adviser: {
    ...CONCISE_ROLE_GUIDES.adviser,
    overview:
      'Your adviser account is ready. You oversee the research projects assigned to you: track progress, move projects through research stages, review paper versions with inline document comments, book meetings with students, and monitor defense schedules. The dashboard surfaces pending paper reviews and recent advisee activity so you can respond quickly. You can also join projects with a project code when invited or accept pending invitations from student leaders.',
    keyTasks: [
      'Review advisee projects, advance research stages, and read abstracts and project details',
      'Leave inline comments on paper versions and manage open, resolved, and revision-requested feedback',
      'Mark paper versions as reviewed after students submit review requests with focus notes',
      'Book, edit, cancel, and complete adviser meetings from a project or the Meeting Schedule page',
      'Manage project teams: invite members, remove collaborators, and transfer the main adviser role',
      'Join advisee projects via project code or accept invitations from student leaders',
      'Monitor pending reviews and recent activity from your dashboard',
      'View defense schedules and institution events for your advisees in Events',
      'Create and maintain evaluation rubrics for proposal, midterm, and final defenses',
      'Join online meetings and defenses, and revisit recordings and transcripts afterward',
      'Stay current on review requests, comment updates, invitations, and schedule changes via notifications',
    ],
    capabilities: [
      {
        label: 'Dashboard',
        description:
          'Overview stats for advisees, active projects, and upcoming events. Includes pending paper reviews, recent activity, a join-project card, and a schedule calendar.',
      },
      {
        label: 'My Advisees',
        description:
          'All projects you advise, with search and filters by course and program. Open any project to manage stage, team, meetings, and paper versions. Each version has a Review & comment link for inline manuscript feedback.',
      },
      {
        label: 'Document comments',
        description:
          'Select text in the document preview to leave feedback anchored to a passage. Resolve comments when addressed, request revision when more work is needed, or reopen resolved threads. Filter the sidebar by status or author and reply in threads with students.',
      },
      {
        label: 'Notifications',
        description:
          'Alerts for review requests, comment activity, invitations, meeting updates, defense schedules, and other advisee activity. Review-request notifications link directly to the paper versions section.',
      },
      {
        label: 'Events',
        description:
          'Institution events plus Meetings and Defenses tabs for sessions involving your advisees. Filter meetings by status and join online sessions from cards.',
      },
      {
        label: 'Recordings',
        description:
          'Access recordings and synced transcripts from meetings and defenses you participated in.',
      },
      {
        label: 'Rubrics',
        description:
          'Create and edit defense rubrics with weighted criteria for Proposal, Midterm, and Final defenses. Criteria weights must total 100%.',
      },
      {
        label: 'Profile',
        description:
          'Update your display name, avatar, and availability status visible to students and coordinators.',
      },
    ],
    workflows: [
      {
        title: 'Review a student paper with inline comments',
        steps: [
          'Check Pending Reviews on your dashboard or open the notification for a review request.',
          'Open the project and choose Review & comment on the requested version in Paper Version History.',
          'Read the student\'s focus note and use the document preview to compare changes from the previous version.',
          'Select text in the manuscript to leave inline feedback. Use Request revision for items the student must fix, or Resolve when a point is addressed.',
          'Reply in comment threads as needed. When finished, choose Mark reviewed. You will be warned if open or revision-requested comments remain.',
        ],
      },
      {
        title: 'Schedule a meeting with advisees',
        steps: [
          'Open the project and go to the Meetings section, or use the Meeting Schedule page from the sidebar area.',
          'Choose Book a Meeting and set the date, time, modality, and participants.',
          'Students see the meeting under Events. Edit, cancel, or mark complete as needed.',
          'Join online sessions from the meeting card when the session starts.',
        ],
      },
      {
        title: 'Move a project through research stages',
        steps: [
          'Open the advisee project from My Advisees.',
          'In Research Stage, select the next stage (for example, Approved, Ongoing, or For Pre-Defense).',
          'Students see the updated stage on their project and receive a notification.',
          'Stages progress from Topic Proposal through For Publication (or Rejected).',
        ],
      },
      {
        title: 'Join or manage an advisee project',
        steps: [
          'Accept a pending invitation from a student leader, or enter a project code on your dashboard.',
          'From the project page, invite additional members or remove collaborators as needed.',
          'Transfer the main adviser role before stepping off a project you no longer advise.',
        ],
      },
    ],
    tips: [
      'You cannot upload paper versions. Students upload, and you review and mark versions as reviewed.',
      'Formal defenses are scheduled and verified by coordinators; you view schedules in Events but do not approve them.',
      'Pending Reviews on your dashboard is the fastest way to see which papers need your attention.',
      'Use inline comments for specific passage-level feedback. Mark reviewed when you are done, even if some threads stay open — you will be asked to confirm.',
      'Comments flagged as modified or orphaned mean the underlying text changed in a newer version. Check the latest upload before resolving.',
      'Rubrics you create can be selected by coordinators when scheduling defenses for your advisees.',
      'Use the document preview diff to spot changes between paper versions without downloading each file.',
    ],
  },
  coordinator: {
    ...CONCISE_ROLE_GUIDES.coordinator,
    overview:
      'Your coordinator account is ready. You manage research activity across your institution: set up courses and assign faculty advisers, schedule and verify defenses, publish institution events, and maintain evaluation rubrics. The dashboard highlights pending defense requests that need your approval. You can browse all projects institution-wide to monitor progress without stepping into day-to-day advising.',
    keyTasks: [
      'Create courses and assign or remove faculty advisers for each course',
      'Schedule institution events such as workshops, orientations, and deadlines',
      'Schedule formal defenses and assign panelists, rubrics, venues, and modalities',
      'Review pending defense requests: approve, move to a new slot, or reject with reason',
      'Manage approved defenses: complete, cancel, or batch-assign time slots across groups',
      'Browse all projects by adviser or institution-wide to monitor research progress',
      'Create and maintain defense rubrics used during evaluations',
      'Track defense verification, schedule changes, and institution events via notifications',
      'Use the dashboard calendar to see upcoming defenses and events at a glance',
      'Review recordings and transcripts from institution meetings when needed',
    ],
    capabilities: [
      {
        label: 'Dashboard',
        description:
          'Institution stats for total projects, pending defenses, courses, and faculty advisers. Includes defense verification shortcuts and a full schedule calendar with month, week, day, year, and agenda views.',
      },
      {
        label: 'Events',
        description:
          'Schedule institution events and defenses. Three tabs (Institution Events, Pending, and Approved) for creating activities and managing the defense pipeline from request to completion.',
      },
      {
        label: 'Notifications',
        description:
          'Defense verification updates, schedule changes, institution event alerts, and other coordination notices. Mark all read when you have caught up.',
      },
      {
        label: 'Recordings',
        description:
          'Browse recordings and transcripts from meetings and defenses across your institution.',
      },
      {
        label: 'Courses',
        description:
          'Create and edit courses, then assign or remove faculty advisers who supervise student research groups. This is where faculty-adviser management lives.',
      },
      {
        label: 'All Projects',
        description:
          'Read-only oversight of every project in your institution, grouped by adviser or listed together with research stage, course, and project code details.',
      },
      {
        label: 'Rubrics',
        description:
          'Institution-wide defense rubrics with weighted criteria for Proposal, Midterm, and Final evaluations. Weights across all criteria must total 100%.',
      },
      {
        label: 'Profile',
        description:
          'Update your display name, avatar, and coordination status.',
      },
    ],
    workflows: [
      {
        title: 'Set up courses and advisers',
        steps: [
          'Open Courses and choose New Course to add name, code, and description.',
          'Expand a course and use Add Adviser to link faculty who will supervise student groups.',
          'Remove advisers from a course when assignments change.',
          'Students and advisers can then associate projects with the correct course.',
        ],
      },
      {
        title: 'Schedule and verify a defense',
        steps: [
          'From Events, choose Schedule and pick Defense (or schedule an Institution Event separately).',
          'Choose by course or select specific groups, then set defense type, rubric, date, location, and modality (Online, Face-to-Face, or Hybrid).',
          'Assign panelists before submitting the defense request.',
          'Pending defenses appear under the Pending tab. Approve, move to a new slot, or reject each request.',
          'Approved defenses move to the Approved tab where you can complete, cancel, or batch-assign time slots.',
        ],
      },
      {
        title: 'Publish an institution event',
        steps: [
          'From Events, choose Schedule and pick Event.',
          'Fill in the title, description, date, time, and location.',
          'Edit, cancel, or mark the event complete as the date passes.',
          'Students and advisers see institution events in their Events tab.',
        ],
      },
      {
        title: 'Monitor institution-wide progress',
        steps: [
          'Open All Projects and switch between By Adviser and All Projects views.',
          'Review research stage badges, course assignments, and project codes across groups.',
          'Follow up with advisers when projects need attention before defense season.',
        ],
      },
    ],
    tips: [
      'Faculty advisers are managed under Courses. There is no separate advisers menu in the sidebar.',
      'The Pending tab is for defenses awaiting your approve, move, or reject decision; Approved is for confirmed schedules.',
      'Use Assign Defense Batches after scheduling to assign time slots when multiple groups defend on the same day.',
      'All Projects is read-only oversight. Advisers handle day-to-day project management on their own accounts.',
      'Rubrics must total 100% across criteria weights before they can be used during defense scheduling.',
    ],
  },
  admin: {
    ...CONCISE_ROLE_GUIDES.admin,
    overview:
      'Your admin account is ready. You configure the institutions and academic programs that power Archivum for schools and departments. Register new institutions, enable or disable access, and maintain the program catalog students choose when creating projects. Coordinators and users under each institution rely on this setup before they can manage courses, projects, and defenses.',
    keyTasks: [
      'Register new institutions with a name and institution code',
      'Enable or disable institutions when onboarding new schools or retiring access',
      'Manage each institution\'s program catalog, the list students pick during project creation',
      'Add, edit, and activate or deactivate individual programs under an institution',
      'Review institution details and keep names and codes accurate over time',
      'Use the dashboard as a quick entry point to institution management',
    ],
    capabilities: [
      {
        label: 'Dashboard',
        description:
          'Platform overview with a direct link to institution management. Use it as your starting point when setting up or auditing schools.',
      },
      {
        label: 'Institutions',
        description:
          'Create institutions, toggle Active/Inactive status, and open each institution to edit details and manage its program list.',
      },
      {
        label: 'Profile',
        description:
          'Update your admin display name, avatar, and status. Email and role are fixed for your account.',
      },
    ],
    workflows: [
      {
        title: 'Onboard a new institution',
        steps: [
          'Open Institutions and choose New Institution.',
          'Enter the institution name and code, then save.',
          'Open Manage on the new institution to add programs students can select.',
          'Confirm the institution is Active so coordinators and users can sign in.',
        ],
      },
      {
        title: 'Maintain a program catalog',
        steps: [
          'From Institutions, open Manage on the target school.',
          'Under Programs, add each degree or track with name, code, and description.',
          'Edit program details when offerings change.',
          'Toggle programs Active or Inactive. Inactive programs won\'t appear for new projects.',
        ],
      },
      {
        title: 'Retire or pause an institution',
        steps: [
          'Open Institutions and locate the school to disable.',
          'Toggle the institution to Inactive and confirm the change.',
          'Re-enable the institution later if access should be restored.',
        ],
      },
    ],
    tips: [
      'Inactive institutions cannot be used by coordinators and users until re-enabled.',
      'Inactive programs are hidden when students create new projects but existing projects keep their program.',
      'Coordinators need institutions and programs set up before students can classify projects correctly.',
      'Keep institution codes stable. They are used as identifiers across the platform.',
      'Admin accounts do not manage courses, defenses, or projects directly; that happens at the coordinator level.',
    ],
  },
};

export function getRoleGuide(role: DashboardRole, variant: RoleGuideVariant = 'full'): RoleGuide {
  return variant === 'concise' ? CONCISE_ROLE_GUIDES[role] : FULL_ROLE_GUIDES[role];
}

export function isFullRoleGuide(guide: RoleGuide): guide is RoleGuideFull {
  return 'workflows' in guide;
}

/** @deprecated Use getRoleGuide(role, 'full') */
export const ROLE_GUIDES = FULL_ROLE_GUIDES;
