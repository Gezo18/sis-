# Elsewedy University of Technology (SUT) - Student Information System & Portal

A high-performance, full-stack web application and Student Information System (SIS) for Elsewedy University of Technology (SUT), built with React, Vite, Express, TypeScript, and Supabase / PostgreSQL.

---

## 🏛️ Database Architecture & Optimization Audit

As part of the Principal Database Architect and Senior Software Engineer audit, the database schema, query patterns, and security mechanisms have been optimized for maximum throughput, strict data integrity, and sub-50ms latency.

### 1. Schema Design & Data Integrity
- **Surrogate UUID Keys**: Primary keys across `admins`, `teachers`, `students`, `courses`, `enrollments`, `grades`, and `attendance_records` utilize UUIDv4 (`gen_random_uuid()`) to prevent enumeration attacks.
- **Strict Database Constraints**:
  - `CHECK (cgpa >= 0.00 AND cgpa <= 4.00)` on student cumulative GPA.
  - `CHECK (score >= 0.00 AND max_score > 0.00 AND score <= max_score)` on grade evaluations.
  - `CHECK (percentage >= 0.00 AND percentage <= 100.00)` on attendance percentage tracking.
  - `CHECK (academic_warnings >= 0 AND academic_warnings <= 5)` on student warning level caps.
- **Foreign Key Rules**:
  - All junction records (`enrollments`, `grades`, `attendance_records`, `student_requests`, `advisor_notes`) use `ON DELETE CASCADE` or `ON DELETE SET NULL` to ensure referential integrity.

### 2. High-Performance Composite Indexing Strategy
To eliminate table scans on read-heavy pages, composite B-tree indexes have been deployed:
- **`idx_students_search_name_email`**: `(last_name, first_name, email)` for fast autocomplete and prefix search.
- **`idx_students_status_level`**: `(status, level, faculty_department)` for administrative filters.
- **`idx_courses_dept_level_sem`**: `(department, level, semester)` for instant course catalog lookup.
- **`idx_enrollments_student_semester`**: `(student_id, semester, status)` for student transcript rendering.
- **`idx_grades_enrollment_graded`**: `(enrollment_id, graded_at DESC)` for ordered grade history.
- **`idx_attendance_warning_status`**: `(warning_status, percentage)` for academic probation alerts.
- **Foreign Key Index Coverage**: All foreign key columns (`teacher_id`, `student_id`, `course_id`, `enrollment_id`, `user_id`) are explicitly indexed to optimize `JOIN` execution plans.

### 3. ORM & Query Refactoring (N+1 Elimination)
- **Eager Loading**: Backend models in `src/lib/` (`students.ts`, `courses.ts`, `enrollments.ts`, `grades.ts`, `teachers.ts`) utilize PostgREST inner join syntax (`*, enrollment:enrollments!inner(course:courses(name, code))`) to retrieve relational data in a single database round-trip.
- **Cursor & Range Pagination**: All list-fetching queries include default pagination bounds (`limit`, `offset`) to prevent unbounded memory allocation and response payload sizes.

### 4. Row-Level Security (RLS) & Safeguards
- **Row-Level Security**: Enabled across all tables with fine-grained access policies separating `authenticated` student self-access, teacher multi-course scope, and admin system access.
- **SQL Injection Prevention**: All queries pass through parameterization validators (`validateParameterizedQuery`) and string sanitizers before execution.

---

## 🛠️ Getting Started

### Installation
```bash
bun install
```

### Development Server
```bash
bun run dev
```

### Type Check & Build
```bash
bun run lint
bun run build
```

### End-to-End Testing
```bash
bun run test:e2e
```
