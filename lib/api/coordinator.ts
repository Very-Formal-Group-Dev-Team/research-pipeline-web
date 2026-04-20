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

export interface Course {
  id: string;
  institution_id: string;
  course_name: string;
  code: string;
  description: string | null;
  created_at: string;
  updated_at: string;
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

export interface Defense {
  id: string;
  project_id: string;
  adviser_id: string;
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
  created_by_name: string;
  adviser_name?: string;
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

export function addAdviserToInstitution(adviserId: string, courseId: string) {
  return post<{ success: boolean; course_id: string; assigned_projects: number }>('/coordinator/institution/advisers', { adviserId, courseId });
}

export function removeAdviserFromInstitution(adviserId: string) {
  return del<{ success: boolean }>(`/coordinator/institution/advisers/${adviserId}`);
}

// ─── Courses ────────────────────────────────────────────────────────────────

export function getCourses() {
  return get<Course[]>('/coordinator/courses');
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

export function verifyDefense(defenseId: string, payload: { venue?: string; verifiedSchedule?: string; verifiedEndTime?: string; notes?: string; forceApprove?: boolean }) {
  return post<Defense | VerifyDefenseConflict>(`/coordinator/defenses/${defenseId}/verify`, payload);
}

export function rejectDefense(defenseId: string, notes?: string) {
  return post<{ success: boolean }>(`/coordinator/defenses/${defenseId}/reject`, { notes });
}

export function setDefenseVenue(defenseId: string, venue: string) {
  return patch<{ success: boolean }>(`/coordinator/defenses/${defenseId}/venue`, { venue });
}

// ─── Course Defenses ────────────────────────────────────────────────────────

export interface CreateCourseDefensePayload {
  defenseType: 'proposal' | 'midterm' | 'final';
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  venue?: string;
}

export interface CourseDefenseResult {
  count: number;
  defenses: Defense[];
}

export function createDefenseForCourse(courseId: string, payload: CreateCourseDefensePayload) {
  return post<CourseDefenseResult>(`/coordinator/courses/${courseId}/defenses`, payload);
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
