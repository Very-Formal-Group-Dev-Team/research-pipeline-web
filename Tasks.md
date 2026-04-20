# Backend Migration Tasks

For the vibe coders ❤️
This document outlines all frontend processes, logic, and operations that need to be migrated to a dedicated backend server.

---

## User Profile Management API
---
Migrate profile CRUD operations to backend. Frontend pages directly query user profiles, exposing database schema and allowing unauthorized data access.

## File Upload & Storage Service
---
Create backend file upload service. Avatar and document uploads currently handled in frontend components with client-side validation only.

## Authorization & Access Control Middleware
---
Implement backend authorization layer. Role-based access control currently in Next.js middleware exposes business logic and can be bypassed.

## User Session Management
---
Move session handling to backend. Current implementation stores session tokens in browser with client-side authentication.

## Project CRUD Operations
---
Consolidate project operations in backend. Some routes exist in API folder but frontend pages still make direct database queries.

## Project Member Management Service
---
Backend service for managing project members. Join operations and member queries currently exposed in frontend with direct database access.

## Profile Completion Logic
---
Move profile completion workflow to backend. Business rules for profile validation and setup currently in frontend library functions.

## Database Query Abstraction Layer
---
Create backend API layer for all database operations. Frontend components directly access database client exposing database structure.

## Document Management API
---
Backend service for project documents. File validation, storage paths, and metadata management currently handled in frontend API routes.

## User Authentication Callbacks
---
Migrate OAuth callback handling to backend. Auth callback route processes sensitive user data and session creation in frontend.

## Role-Based Dashboard Data Service
---
Backend endpoints for dashboard data. Student, adviser, and coordinator dashboards make direct database queries from client-side components.

## Avatar Upload Service
---
Dedicated backend avatar upload endpoint. Frontend components directly upload files with client-side validation only.

## Project Code Validation Service
---
Backend validation for project join codes. Frontend join route handles project code lookup and member creation with exposed logic.

## User Profile Update Service
---
Backend service for profile updates. EditProfile component directly calls database with update logic in frontend.

## Project Fetch & Filter Service
---
Backend API for fetching user projects. Complex project queries with member joins and creator filtering currently in frontend components.

## File Type & Size Validation
---
Backend validation for all uploads. File validation currently in frontend components can be bypassed by malicious users.

## Project Member Status Management
---
Backend service for invitation and member status. Status updates and invitation acceptance logic currently in frontend API routes.

## User Role Assignment Logic
---
Backend service for role management. User role insertion and validation currently in frontend library function.

## OAuth Integration
---
Move OAuth sign-in to backend flow. OAuth redirect URLs and provider configuration currently managed in frontend components.

## File Storage Operations
---
Backend abstraction for storage operations. Direct storage access from frontend exposes bucket names and file paths.

## Project Document Reference Updates
---
Backend service for document references. Updating project records with document URLs currently in frontend API route.

## User Authentication State Verification
---
Backend session verification endpoints. Frontend pages verify auth state with direct database calls exposing session validation logic.

## Email Verification Workflow
---
Backend email verification flow. Registration email verification currently handled through exposed auth redirects.

## Project Membership Query Service
---
Backend API for project membership data. Complex queries joining projects and members currently executed from frontend pages.

## User Metadata Management
---
Backend service for user metadata. OAuth profile data extraction and storage currently in frontend callback route.

## Project Creation Validation
---
Backend validation service for project creation. Business rules for project data validation split between frontend and API routes.

## Storage URL Generation
---
Backend service for generating file URLs. Frontend components directly call URL generation exposing storage bucket configuration.

## User Logout & Session Cleanup
---
Backend logout endpoint with proper session cleanup. Current implementation uses client-side signOut with incomplete cleanup.

## Project Member Role Determination
---
Backend logic for assigning member roles. Role determination based on user type currently in frontend join API route.

## Onboarding Flow Management
---
Backend service for onboarding workflow. Profile existence checks and role-based redirects currently in frontend onboarding page.

## Project Code Generation
---
Backend service for unique project code generation. Code generation for projects currently in frontend create API route.

## User Profile Existence Check
---
Backend endpoint for profile status verification. Multiple frontend pages check profile existence with direct database queries.

## Multi-part Form Handling
---
Backend service for processing form uploads. Project creation with file uploads processes FormData in frontend API routes.

## Database Error Handling
---
Centralized backend error handling. Database errors currently exposed to frontend with detailed messages revealing schema information.

## Project Document Upload Workflow
---
Backend service for complete document upload flow. Validation, storage, and database updates currently split across frontend components.

## User Role-Based Redirects
---
Backend redirect service based on user roles. Role checking and redirect logic currently in frontend auth callback route.

## Adviser Project Access Control
---
Backend authorization for adviser project access. Adviser-specific project queries currently in frontend pages without backend validation.

## Project Member Deduplication
---
Backend logic for handling duplicate members. Member deduplication for creators currently in frontend project detail page.

## File Cache Control
---
Backend service for setting file cache headers. Cache control options currently configured in frontend upload calls.
