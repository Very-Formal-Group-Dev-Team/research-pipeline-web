# Local Jitsi Integration Roadmap

## Overview

This document outlines the implementation plan for integrating a locally hosted Jitsi Meet server into the Research Management Portal.

The goal is to provide online defense sessions while keeping video conferencing separate from the main application.

During development, Jitsi will be hosted locally using Docker.

---

# Current Progress

## Completed

### Defenses Table

The following fields have been added:

```sql
meeting_room VARCHAR(255)
meeting_url TEXT
meeting_provider VARCHAR(50)
```

### Meetings Table

The following fields have been added:

```sql
meeting_room VARCHAR(255)
meeting_url TEXT
meeting_provider VARCHAR(50)
```

### Purpose

| Field            | Description                  |
| ---------------- | ---------------------------- |
| meeting_room     | Unique Jitsi room identifier |
| meeting_url      | Full Jitsi meeting URL       |
| meeting_provider | Meeting platform provider    |

---

# Development Architecture

```text
Research Portal
(localhost:3000)
        │
        ▼
Meeting URL
        │
        ▼
Jitsi Meet
(localhost:8000)
```

---

# Phase 1 - Local Jitsi Deployment

## Objective

Deploy Jitsi Meet locally using Docker.

### Prerequisites

* Docker Desktop installed
* Docker Compose installed
* Git installed

### Tasks

* [ ] Install Docker Desktop
* [ ] Clone Jitsi Docker repository
* [ ] Configure environment variables
* [ ] Start Jitsi containers
* [ ] Verify local access

### Success Criteria

Users can access:

```text
http://localhost:8000
```

and the Jitsi landing page loads successfully.

---

# Phase 2 - Meeting Generation

## Objective

Automatically generate meeting rooms for online defenses.

### Example Meeting

```text
meeting_provider:
Jitsi

meeting_room:
DEFENSE-a84c7d32-b8d2-47d4

meeting_url:
http://localhost:8000/DEFENSE-a84c7d32-b8d2-47d4
```

### Tasks

* [ ] Generate unique room names
* [ ] Generate meeting URLs
* [ ] Save meeting information
* [ ] Associate meetings with defenses

### Success Criteria

Every online defense receives a unique Jitsi room.

---

# Phase 3 - Defense Scheduling Integration

## Objective

Automatically create meeting information during scheduling.

### Workflow

```text
Coordinator
    ↓
Schedules Defense
    ↓
Modality = Online
    ↓
Generate Room
    ↓
Generate URL
    ↓
Save Meeting
```

### Tasks

* [ ] Detect online defenses
* [ ] Generate room identifier
* [ ] Generate meeting URL
* [ ] Save provider as Jitsi

### Success Criteria

Meeting information is automatically generated during scheduling.

---

# Phase 4 - Student Access

## Objective

Allow students to join scheduled defenses.

### Tasks

* [ ] Display meeting information
* [ ] Display Join Defense button
* [ ] Open Jitsi meeting URL

### Example

```text
Join Defense
```

Redirects to:

```text
http://localhost:8000/DEFENSE-a84c7d32-b8d2-47d4
```

---

# Phase 5 - Adviser Access

## Objective

Allow advisers to join assigned defenses.

### Tasks

* [ ] Display assigned defenses
* [ ] Display meeting details
* [ ] Display Join Defense button

### Success Criteria

Advisers can join meetings directly from the portal.

---

# Phase 6 - Panelist Access

## Objective

Allow panelists to join assigned defenses.

### Tasks

* [ ] Display assigned defenses
* [ ] Display meeting details
* [ ] Display Join Defense button

### Success Criteria

Panelists can join meetings directly from the portal.

---

# Phase 7 - Notifications

## Objective

Distribute meeting links to participants.

### Tasks

* [ ] Include meeting URL in notifications
* [ ] Include meeting information on defense pages
* [ ] Include meeting details in emails (future)

### Example Notification

```text
Your Proposal Defense has been scheduled.

Date:
June 15, 2026

Time:
8:00 AM

Meeting Link:
http://localhost:8000/DEFENSE-a84c7d32-b8d2-47d4
```

---

# Phase 8 - LAN Testing

## Objective

Allow multiple devices on the same network to join.

### Example

```text
http://192.168.1.100:8000/DEFENSE-a84c7d32-b8d2-47d4
```

### Tasks

* [ ] Determine local IP address
* [ ] Verify firewall settings
* [ ] Test from another device
* [ ] Test student and panelist access

### Success Criteria

Multiple devices can join the same meeting.

---

# Phase 9 - Security

## Objective

Reduce accidental meeting access.

### Tasks

* [ ] Use UUID-based room names
* [ ] Enable lobby mode
* [ ] Configure moderator approval

### Avoid

```text
DEFENSE-001
```

### Use

```text
DEFENSE-a84c7d32-b8d2-47d4
```

---

# Future Migration to Production

When moving to production:

Replace:

```text
http://localhost:8000
```

with:

```text
https://meet.yourdomain.com
```

No database changes should be required.

Only the generated URL base needs to change.

---

# Final Workflow

```text
Coordinator
    ↓
Schedules Defense
    ↓
System Generates Room
    ↓
Meeting Saved
    ↓
Notifications Sent
    ↓
Students Join
    ↓
Advisers Join
    ↓
Panelists Join
    ↓
Jitsi Meeting Opens
```
