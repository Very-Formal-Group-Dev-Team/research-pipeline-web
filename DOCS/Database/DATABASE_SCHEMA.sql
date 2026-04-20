-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
-- Use this as reference when you guys are vibe coding lol, becareful tho.

CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  version_id uuid,
  parent_id uuid,
  user_id uuid NOT NULL,
  content text NOT NULL,
  section_ref text,
  is_resolved boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id),
  CONSTRAINT comments_version_id_fkey FOREIGN KEY (version_id) REFERENCES public.document_versions(id),
  CONSTRAINT comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.comments(id),
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.defense_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  defense_id uuid NOT NULL,
  project_id uuid NOT NULL,
  overall_score numeric,
  verdict USER-DEFINED,
  recommendations text,
  finalized_at timestamp with time zone,
  CONSTRAINT defense_results_pkey PRIMARY KEY (id),
  CONSTRAINT defense_results_defense_id_fkey FOREIGN KEY (defense_id) REFERENCES public.defenses(id),
  CONSTRAINT defense_results_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.defenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  defense_type USER-DEFINED NOT NULL,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone,
  location text,
  rubric_id uuid,
  status USER-DEFINED NOT NULL DEFAULT 'scheduled'::defense_status_enum,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT defenses_pkey PRIMARY KEY (id),
  CONSTRAINT defenses_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT defenses_rubric_id_fkey FOREIGN KEY (rubric_id) REFERENCES public.rubrics(id),
  CONSTRAINT defenses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.document_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  version_number integer NOT NULL DEFAULT 1,
  file_url text NOT NULL,
  file_size bigint,
  uploaded_by uuid NOT NULL,
  change_summary text,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::doc_version_status_enum,
  approved_by uuid,
  approved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT document_versions_pkey PRIMARY KEY (id),
  CONSTRAINT document_versions_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id),
  CONSTRAINT document_versions_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id),
  CONSTRAINT document_versions_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id)
);
CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  section USER-DEFINED NOT NULL,
  title text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  current_version_id uuid,
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT fk_documents_current_version FOREIGN KEY (current_version_id) REFERENCES public.document_versions(id)
);
CREATE TABLE public.evaluations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  defense_id uuid NOT NULL,
  project_id uuid NOT NULL,
  panelist_id uuid NOT NULL,
  criterion_id uuid NOT NULL,
  score numeric NOT NULL,
  comments text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT evaluations_pkey PRIMARY KEY (id),
  CONSTRAINT evaluations_defense_id_fkey FOREIGN KEY (defense_id) REFERENCES public.defenses(id),
  CONSTRAINT evaluations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT evaluations_panelist_id_fkey FOREIGN KEY (panelist_id) REFERENCES public.users(id),
  CONSTRAINT evaluations_criterion_id_fkey FOREIGN KEY (criterion_id) REFERENCES public.rubric_criteria(id)
);
CREATE TABLE public.project_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL,
  file_url text NOT NULL,
  file_name text,
  file_size bigint,
  uploaded_by uuid NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'uploaded'::proposal_document_status,
  change_summary text,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT project_documents_pkey PRIMARY KEY (id),
  CONSTRAINT project_documents_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.project_proposals(id),
  CONSTRAINT project_documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id)
);
CREATE TABLE public.project_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role USER-DEFINED NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'invited'::member_status_enum,
  invited_at timestamp with time zone NOT NULL DEFAULT now(),
  responded_at timestamp with time zone,
  CONSTRAINT project_members_pkey PRIMARY KEY (id),
  CONSTRAINT project_members_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT project_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.project_proposals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  title text NOT NULL,
  abstract text,
  description text,
  keywords ARRAY DEFAULT '{}'::text[],
  created_by uuid NOT NULL,
  adviser_id uuid,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::proposal_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT project_proposals_pkey PRIMARY KEY (id),
  CONSTRAINT project_proposals_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT project_proposals_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT project_proposals_adviser_id_fkey FOREIGN KEY (adviser_id) REFERENCES public.users(id)
);
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  project_type USER-DEFINED NOT NULL DEFAULT 'independent'::project_type_enum,
  paper_standard USER-DEFINED NOT NULL DEFAULT 'custom'::paper_standard_enum,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::project_status_enum,
  keywords ARRAY DEFAULT ARRAY[]::text[],
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  project_code uuid DEFAULT gen_random_uuid(),
  document_reference text,
  abstract text,
  program character varying,
  course character varying,
  section character varying,
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.rubric_criteria (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rubric_id uuid NOT NULL,
  criterion_name text NOT NULL,
  description text,
  weight numeric NOT NULL DEFAULT 0,
  max_score integer NOT NULL DEFAULT 5,
  order integer NOT NULL DEFAULT 0,
  CONSTRAINT rubric_criteria_pkey PRIMARY KEY (id),
  CONSTRAINT rubric_criteria_rubric_id_fkey FOREIGN KEY (rubric_id) REFERENCES public.rubrics(id)
);
CREATE TABLE public.rubrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  defense_type USER-DEFINED NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT rubrics_pkey PRIMARY KEY (id),
  CONSTRAINT rubrics_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role USER-DEFINED NOT NULL,
  institution_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text,
  avatar_url text,
  auth_provider USER-DEFINED NOT NULL DEFAULT 'email'::auth_provider_enum,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  status smallint NOT NULL DEFAULT '1'::smallint,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);