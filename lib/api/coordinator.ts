/**
 * Coordinator API service.
 */

import { get, post, put, patch, del } from './client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Institution {
  id: string;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
}

export interface InstitutionAdviser {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
  role_assigned_at: string;
}

export interface CourseAdviser {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
}

export interface Course {
  id: string;
  institution_id: string;
  course_name: string;
  code: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  advisers?: CourseAdviser[];
}

export interface CoordinatorStats {
  totalProjects: number;
  totalAdvisers: number;
  pendingDefenses: number;
  totalCourses: number;
}

export interface DashboardData {
  institution: Institution;
  stats: CoordinatorStats;
}

export interface BookedDefenseSummary {
  id: string;
  project_id: string;
  project_title: string;
  project_code: string;
}

export interface Defense {
  id: string;
  project_id: string;
  course_id?: string | null;
  course_name?: string | null;
  course_code?: string | null;
  adviser_id?: string;
  defense_type: string;
  start_time: string;
  end_time: string | null;
  location: string;
  modality: string;
  status: string;
  venue: string | null;
  verified_schedule: string | null;
  proposed_schedule: string | null;
  project_title: string;
  project_code: string;
  rubric_id?: string | null;
  panelist_ids?: string | null;
  created_by_name: string;
  adviser_name?: string;
  panelist_names?: string | null;
  meeting_room?: string | null;
  meeting_url?: string | null;
  meeting_provider?: string | null;
}

export interface BookDefenseScheduleResult extends Defense {
  booked_defenses?: BookedDefenseSummary[];
}

export interface VerifyDefenseConflict {
  conflict: true;
  message: string;
  max_overlap_minutes?: number;
  candidate_total_minutes?: number;
  effective_minutes?: number;
  conflicts: Array<{
    domain: string;
    defense_id: string;
    project_id: string;
    start_time: string;
    end_time: string | null;
    participant_id?: string;
  }>;
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export function getCoordinatorDashboard() {
  return get<DashboardData>('/coordinator/dashboard');
}

// ─── Institution ────────────────────────────────────────────────────────────

export function getMyInstitution() {
  return get<Institution>('/coordinator/institution');
}

export function getInstitutionAdvisers() {
  return get<InstitutionAdviser[]>('/coordinator/institution/advisers');
}

export function getInstitutionPanelists() {
  return get<InstitutionAdviser[]>('/coordinator/institution/panelists');
}

export function addAdviserToInstitution(adviserId: string, courseId: string) {
  return post<{ success: boolean; course_id: string; assigned_projects: number }>('/coordinator/institution/advisers', { adviserId, courseId });
}

export function removeAdviserFromInstitution(adviserId: string) {
  return del<{ success: boolean }>(`/coordinator/institution/advisers/${adviserId}`);
}

export function removeAdviserFromCourse(courseId: string, adviserId: string) {
  return del<{ success: boolean; removed_assignments: number }>(
    `/coordinator/courses/${courseId}/advisers/${adviserId}`,
  );
}

// ─── Courses ────────────────────────────────────────────────────────────────

export function getCourses() {
  return get<Course[]>('/coordinator/courses');
}

export interface CourseGroup {
  id: string;
  title: string;
  project_code: string;
}

export function getCourseGroups(courseId: string) {
  return get<CourseGroup[]>(`/coordinator/courses/${courseId}/groups`);
}

export function createCourse(payload: { courseName: string; code: string; description?: string }) {
  return post<Course>('/coordinator/courses', payload);
}

export function updateCourse(courseId: string, payload: { courseName?: string; code?: string; description?: string }) {
  return put<Course>(`/coordinator/courses/${courseId}`, payload);
}

export function deleteCourse(courseId: string) {
  return del<{ success: boolean }>(`/coordinator/courses/${courseId}`);
}

// ─── Defense Verification ───────────────────────────────────────────────────

export function getAllDefenses() {
  return get<Defense[]>('/coordinator/defenses');
}

export function getPendingDefenses() {
  return get<Defense[]>('/coordinator/defenses/pending');
}

export function verifyDefense(
  defenseId: string,
  payload: {
    venue?: string;
    location?: string;
    modality?: string;
    verifiedSchedule?: string;
    verifiedEndTime?: string;
    notes?: string;
    forceApprove?: boolean;
    holdDefense?: boolean;
    defenseType?: 'proposal' | 'midterm' | 'final';
    rubricId?: string;
    panelistIds?: string[];
  },
) {
  return post<Defense | VerifyDefenseConflict>(`/coordinator/defenses/${defenseId}/verify`, payload);
}

export function rejectDefense(defenseId: string, notes?: string) {
  return post<{ success: boolean }>(`/coordinator/defenses/${defenseId}/reject`, { notes });
}

export function setDefenseVenue(defenseId: string, venue: string) {
  return patch<{ success: boolean }>(`/coordinator/defenses/${defenseId}/venue`, { venue });
}

export function deleteDefense(defenseId: string) {
  return del<{ success: boolean; previousStatus?: string }>(`/coordinator/defenses/${defenseId}`);
}

export function cancelCoordinatorDefense(defenseId: string) {
  return patch<{ success: boolean; previousStatus: string }>(`/coordinator/defenses/${defenseId}/cancel`, {});
}

export function completeCoordinatorDefense(defenseId: string) {
  return patch<{ success: boolean; previousStatus: string }>(`/coordinator/defenses/${defenseId}/complete`, {});
}

export function revertCoordinatorDefense(defenseId: string, previousStatus: string) {
  return patch<{ success: boolean; status: string }>(`/coordinator/defenses/${defenseId}/revert`, {
    previousStatus,
  });
}

// ─── Course Defenses ────────────────────────────────────────────────────────

export interface CreateCourseDefensePayload {
  defenseType: 'proposal' | 'midterm' | 'final';
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  venue?: string;
  forceSchedule?: boolean;
  holdDefense?: boolean;
}

export interface CourseDefenseConflict {
  conflict: true;
  message: string;
  max_overlap_minutes: number;
  candidate_total_minutes: number;
  effective_minutes: number;
  conflicts: Array<{
    defense_id: string;
    project_id: string;
    start_time: string;
    end_time: string;
    overlap_minutes: number;
  }>;
}

export interface CourseDefenseResult {
  count: number;
  defenses: Defense[];
  status: string;
}

export function createDefenseForCourse(courseId: string, payload: CreateCourseDefensePayload) {
  return post<CourseDefenseResult | CourseDefenseConflict>(`/coordinator/courses/${courseId}/defenses`, payload);
}

export type DefenseType = 'proposal' | 'midterm' | 'final';

export interface RubricCriterion {
  id?: string;
  rubric_id?: string;
  criterion_name: string;
  weight: number;
  description?: string | null;
  max_score?: number;
  order?: number;
}

export interface CoordinatorRubric {
  id: string;
  name: string;
  description: string;
  defense_type: DefenseType;
  role?: 'coordinator' | 'adviser';
  created_at: string;
  criteria_count?: number;
  total_weight?: number;
  criteria?: RubricCriterion[];
}

export interface RubricCriterionInput {
  criterionName: string;
  weight: number;
  description?: string | null;
}

export interface SaveCoordinatorRubricPayload {
  name: string;
  description: string;
  defenseType: DefenseType;
  criteria: RubricCriterionInput[];
}

export const SAMPLE_COORDINATOR_RUBRIC: SaveCoordinatorRubricPayload = {
  name: 'Proposal Defense Rubric',
  description:
    'Standard rubric for proposal defenses. Evaluates delivery, technical depth, documentation quality, and Q&A performance.',
  defenseType: 'proposal',
  criteria: [
    {
      criterionName: 'Presentation',
      weight: 20,
      description: 'Clarity, organization, and professionalism of the oral presentation.',
    },
    {
      criterionName: 'Technical Content',
      weight: 30,
      description: 'Depth and accuracy of methodology, analysis, and findings.',
    },
    {
      criterionName: 'Documentation',
      weight: 20,
      description: 'Quality and completeness of written materials submitted.',
    },
    {
      criterionName: 'Question and Answer',
      weight: 30,
      description: 'Ability to respond thoughtfully to panel questions.',
    },
  ],
};

export interface BookDefenseSchedulePayload {
  courseId: string;
  projectId?: string;
  rubricId?: string;
  defenseType: 'proposal' | 'midterm' | 'final';
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  venue?: string;
  modality?: string;
  panelistIds?: string[];
  projectIds?: string[];
  forceApprove?: boolean;
}

export function getCoordinatorRubrics() {
  return get<CoordinatorRubric[]>('/coordinator/rubrics');
}

export function getCoordinatorRubric(rubricId: string) {
  return get<CoordinatorRubric>(`/coordinator/rubrics/${rubricId}`);
}

export function createCoordinatorRubric(payload: SaveCoordinatorRubricPayload) {
  return post<CoordinatorRubric>('/coordinator/rubrics', payload);
}

export function updateCoordinatorRubric(rubricId: string, payload: SaveCoordinatorRubricPayload) {
  return put<CoordinatorRubric>(`/coordinator/rubrics/${rubricId}`, payload);
}

export function deleteCoordinatorRubric(rubricId: string) {
  return del<{ success: boolean }>(`/coordinator/rubrics/${rubricId}`);
}

export function bookDefenseSchedule(payload: BookDefenseSchedulePayload) {
  return post<BookDefenseScheduleResult | VerifyDefenseConflict>('/coordinator/defenses/book', payload);
}

// ─── Projects ───────────────────────────────────────────────────────────────

export interface InstitutionProject {
  id: string;
  title: string;
  project_code: string;
  status: string;
  project_type: string;
  created_at: string;
  updated_at: string;
  course_id: string | null;
  /** Course name entered on project create/edit (projects.course). */
  course_label: string | null;
  course_name: string | null;
  course_code: string | null;
}

export interface AdviserWithProjects {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  projects: {
    id: string;
    title: string;
    project_code: string;
    status: string;
    project_type: string;
    created_at: string;
  }[];
}

export function getInstitutionProjects() {
  return get<InstitutionProject[]>('/coordinator/projects');
}

export function getProjectsByAdviser() {
  return get<AdviserWithProjects[]>('/coordinator/projects/by-adviser');
}
