# Dynamic Rubric System Design

## Current `rubrics` Table

The existing table should remain as the rubric master/header table.

```sql
CREATE TABLE rubrics (
    id CHAR(36) PRIMARY KEY,
    name TEXT NOT NULL,
    defense_type ENUM('proposal','midterm','final') NOT NULL,
    created_by CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Purpose

| Field        | Description                              |
| ------------ | ---------------------------------------- |
| id           | Unique rubric identifier                 |
| name         | Rubric name                              |
| defense_type | Defense stage (Proposal, Midterm, Final) |
| created_by   | User who created the rubric              |
| created_at   | Date and time created                    |

---

## Dynamic Criteria Table

Instead of storing fixed criteria such as Presentation, Documentation, or Q&A as columns, create a separate table to store rubric criteria dynamically.

```sql
CREATE TABLE rubric_criteria (
    id CHAR(36) PRIMARY KEY,
    rubric_id CHAR(36) NOT NULL,
    criterion_name VARCHAR(255) NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (rubric_id)
        REFERENCES rubrics(id)
        ON DELETE CASCADE
);
```

### Example Data

#### rubrics

| id | name                    |
| -- | ----------------------- |
| R1 | Proposal Defense Rubric |

#### rubric_criteria

| rubric_id | criterion_name      | weight |
| --------- | ------------------- | ------ |
| R1        | Presentation        | 20     |
| R1        | Technical Content   | 30     |
| R1        | Documentation       | 20     |
| R1        | Question and Answer | 30     |

Total Weight = 100%

---

## Supporting Adviser Rubrics

If advisers can also create rubrics, add a role column to distinguish between coordinator and adviser rubrics.

```sql
ALTER TABLE rubrics
ADD COLUMN role ENUM('coordinator','adviser') NOT NULL;
```

### Example

| id | name                       | role        | defense_type |
| -- | -------------------------- | ----------- | ------------ |
| 1  | Final Defense Rubric       | coordinator | final        |
| 2  | Progress Monitoring Rubric | adviser     | NULL         |

This allows:

* Coordinators to create Proposal, Midterm, and Final Defense rubrics.
* Advisers to create project monitoring and evaluation rubrics.
* Both roles to use the same rubric engine.

---

## Validation Rules

A rubric may contain any number of criteria.

Before saving:

```text
SUM(weight) = 100
```

Example:

| Criterion     | Weight |
| ------------- | ------ |
| Attendance    | 20     |
| Documentation | 30     |
| Progress      | 50     |
| Total         | 100    |

Valid

---

| Criterion     | Weight |
| ------------- | ------ |
| Attendance    | 20     |
| Documentation | 30     |
| Progress      | 40     |
| Total         | 90     |

Invalid

The Save button should remain disabled until the total equals exactly 100%.

---

## Evaluation Scores

To store actual rubric evaluations, create an evaluation scores table.

```sql
CREATE TABLE evaluation_scores (
    id CHAR(36) PRIMARY KEY,
    evaluation_id CHAR(36) NOT NULL,
    criterion_id CHAR(36) NOT NULL,
    score DECIMAL(5,2) NOT NULL
);
```

### Example

| evaluation_id | criterion_id | score |
| ------------- | ------------ | ----- |
| E1            | C1           | 18    |
| E1            | C2           | 25    |
| E1            | C3           | 19    |

Weighted score formula:

```text
(score / max_score) × weight
```

---

## Final Recommendation

### Keep

* `rubrics` table as the rubric master table.

### Add

* `rubric_criteria` table for dynamic criteria.
* `role` column in `rubrics` if both advisers and coordinators create rubrics.
* `evaluation_scores` table for storing evaluation results.

### Avoid

Do not store criteria such as:

```sql
presentation
documentation
qa
innovation
```

as separate columns in the `rubrics` table. All criteria should be stored as rows in `rubric_criteria` to support unlimited dynamic criteria and flexible weight distribution.
