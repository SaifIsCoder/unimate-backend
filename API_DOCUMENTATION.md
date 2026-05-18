# 🎓 Unimate API Master Reference (v1.0)

Welcome to the comprehensive, production-grade API reference for the **Unimate Academic Management System**. This document describes all **91 endpoints** organized across 16 functional modules and system utilities.

---

## 🚀 General Information

### Base URL
```http
http://localhost:5000/api/v1
```

### Global Request Headers
All protected routes require standard headers:
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
Content-Type: application/json
```

### Response Envelope
All API endpoints return JSON wrapped in a standard success/error structure:

#### Success Response (200 OK / 201 Created)
```json
{
  "success": true,
  "data": {
    "id": "e3b0c442-98fc-11eb-a8b3-0242ac130003",
    "name": "Computer Science"
  },
  "meta": {
    "total": 120,
    "page": 1,
    "limit": 10
  }
}
```

#### Error Response (4xx / 5xx)
```json
{
  "success": false,
  "error": "Validation failed: 'email' must be a valid email address.",
  "code": "BAD_REQUEST"
}
```

---

## 🛡️ Role-Based Access Control (RBAC)

The system enforces strict permission rules based on the following roles:

*   👑 **SUPER_ADMIN**: Absolute system-wide administrative access. Can perform operations across all departments and manage Admins.
*   🏛️ **ADMIN**: Access restricted to their assigned `department_id`. Can manage courses, sections, students, teachers, and enrollments in their own department.
*   👨‍🏫 **TEACHER**: Instructor-level access. Authorized only for classes (offerings) they are actively teaching. Can set assignments, mark attendance, and submit grades.
*   🎓 **STUDENT**: Self-level access. Read-only view of their own profiles, schedules, grades, and attendance stats. Full write participation in the Community module.

---

## 📂 Master Module Index

Below is the directory of all functional modules. Click on any module to jump to its detailed endpoint documentation:

1.  [🔒 Authentication (`/auth`)](#1-auth) - 4 Endpoints
2.  [👥 User Accounts (`/users`)](#2-users) - 6 Endpoints
3.  [🏛️ Department Management (`/departments`)](#3-departments) - 5 Endpoints
4.  [📘 Course Catalog (`/courses`)](#4-courses) - 5 Endpoints
5.  [🏫 Course Offerings (`/offerings`)](#5-offerings) - 5 Endpoints
6.  [🎓 Student Management (`/students`)](#6-students) - 8 Endpoints
7.  [👨‍🏫 Teacher Management (`/teachers`)](#7-teachers) - 7 Endpoints
8.  [📝 Course Enrollments (`/enrollments`)](#8-enrollments) - 7 Endpoints
9.  [📅 Schedules & Timetables (`/schedules`)](#9-schedules) - 6 Endpoints
10. [📊 Attendance Tracking (`/attendance`)](#10-attendance) - 5 Endpoints
11. [✏️ Academic Assignments (`/assignments`)](#11-assignments) - 5 Endpoints
12. [💯 Grades & Transcripts (`/grades`)](#12-grades) - 4 Endpoints
13. [📢 Announcements & Broadcasts (`/announcements`)](#13-announcements) - 4 Endpoints
14. [🔔 Real-Time Notifications (`/notifications`)](#14-notifications) - 3 Endpoints
15. [💬 Community Social Forum (`/community`)](#15-community) - 10 Endpoints
16. [🛡️ Admin Identity Management (`/admins`)](#16-admins) - 5 Endpoints
17. [⚙️ System Utilities (`/`)](#17-system) - 2 Endpoints

---

<a id="1-auth"></a>
## 1. 🔒 Authentication (`/auth`)

Public entry points for identity validation and token generation, alongside student/teacher self-reset flows.

| Method | Endpoint | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login/admin` | Public | Log in as Admin/Super Admin. Returns JWT and user details. |
| `POST` | `/auth/login/student` | Public | Log in as a Student. Returns JWT, student profile, and token. |
| `POST` | `/auth/login/teacher` | Public | Log in as a Teacher. Returns JWT, teacher profile, and token. |
| `POST` | `/auth/reset-password` | Authenticated | Reset password for an authorized student or teacher account. |

### Payload Examples

#### Login Body (`POST /auth/login/admin`, `/auth/login/student`, `/auth/login/teacher`)
```json
{
  "email": "superadmin@unimate.com",
  "password": "adminpassword123"
}
```

#### Reset Password Body (`POST /auth/reset-password`)
```json
{
  "email": "student@unimate.edu"
}
```

---

<a id="2-users"></a>
## 2. 👥 User Accounts (`/users`)

Core user profile and identity management. Direct user provisioning (creating accounts with pre-defined roles) is controlled here.

| Method | Endpoint | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/users/me` | All Authenticated | Fetch active user credentials, status, and role info. |
| `POST` | `/users` | Admin, Super Admin | Register a user (Student, Teacher, Admin). Generates secure credentials. |
| `GET` | `/users` | Admin, Super Admin | List all registered users across the platform. |
| `GET` | `/users/:id` | Admin, Super Admin | Retrieve a user's master record (UUID matches). |
| `PATCH` | `/users/:id` | Admin, Super Admin | Modify user metadata (name, status) or force resets. |
| `DELETE` | `/users/:id` | Admin, Super Admin | Hard delete a user account from the persistence layer. |

### Payload Examples

#### Create User Body (`POST /users`)
```json
{
  "name": "New Faculty Member",
  "email": "newteacher@unimate.edu",
  "password": "teacherSecurePassword123!",
  "role": "TEACHER",
  "department_id": 1
}
```

#### Update User Body (`PATCH /users/:id`)
```json
{
  "name": "Johnathan Updated",
  "email": "john.updated@unimate.edu"
}
```

---

<a id="3-departments"></a>
## 3. 🏛️ Department Management (`/departments`)

System divisions reflecting university departments. Admins are bounded by their departments, and community postings are routed by department.

| Method | Endpoint | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/departments` | All Authenticated | Get all active university departments. |
| `GET` | `/departments/:id` | All Authenticated | View a specific department details by its integer ID. |
| `POST` | `/departments` | Admin, Super Admin | Add a new academic department. |
| `PATCH` | `/departments/:id` | Admin, Super Admin | Update details of a department (name, code, description). |
| `DELETE` | `/departments/:id` | Admin, Super Admin | Remove a department. Note: Cascades to courses. |

### Payload Examples

#### Create Department Body (`POST /departments`)
```json
{
  "name": "Computer Science",
  "code": "CS",
  "description": "Department of Computer Science & Information Technology"
}
```

#### Update Department Body (`PATCH /departments/:id`)
```json
{
  "name": "Computer Science and Software Engineering",
  "code": "CSSE"
}
```

---

<a id="4-courses"></a>
## 4. 📘 Course Catalog (`/courses`)

Standard catalog definition. A course acts as the syllabus/blueprint which is later scheduled as an "Offering" in specific terms.

| Method | Endpoint | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/courses` | Admin | Create a new course entry associated with an academic department. |
| `GET` | `/courses` | All Authenticated | Fetch full list of courses. Filterable via query: `?department_id=`. |
| `GET` | `/courses/:id` | All Authenticated | Fetch course record metadata by UUID. |
| `PATCH` | `/courses/:id` | Admin | Update course code, title, or credit hours. |
| `DELETE` | `/courses/:id` | Admin | Remove a course. Fails if active course offerings exist. |

### Payload Examples

#### Create Course Body (`POST /courses`)
```json
{
  "code": "CS-201",
  "name": "Data Structures and Algorithms",
  "credits": 4,
  "departmentId": "a5e4d3c2-b1a0-9f8e-7d6c-5b4a3f2e1d0c"
}
```

#### Update Course Body (`PATCH /courses/:id`)
```json
{
  "name": "Advanced Data Structures and Algorithms",
  "credits": 3
}
```

---

<a id="5-offerings"></a>
## 5. 🏫 Course Offerings (`/offerings`)

Represents a scheduled course section running in a specific semester, with an assigned teacher and maximum capacity.

| Method | Endpoint | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/offerings` | Admin | Schedule a class section. Hooks course, teacher, term, and section. |
| `GET` | `/offerings` | All Authenticated | Get all scheduled offerings. Filter by `?semester=`, `?teacher_id=`. |
| `GET` | `/offerings/:id` | All Authenticated | Fetch course offering statistics and profiles. |
| `PATCH` | `/offerings/:id` | Admin | Reassign teaching faculty, change sections, or capacity. |
| `DELETE` | `/offerings/:id` | Admin | Cancel and remove a course offering section. |

### Payload Examples

#### Create Offering Body (`POST /offerings`)
```json
{
  "courseId": "c1d2e3f4-g5h6-i7j8-k9l0-m1n2o3p4q5r6",
  "teacherId": "b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7",
  "semester": "Fall 2026",
  "section": "B"
}
```

#### Update Offering Body (`PATCH /offerings/:id`)
```json
{
  "section": "A+",
  "teacherId": "d3e4f5g6-h7i8-j9k0-l1m2-n3o4p5q6r7s8"
}
```

---

<a id="6-students"></a>
## 6. 🎓 Student Management (`/students`)

Student identity, program, major, current academic semester tracking, and registration profiles.

| Method | Endpoint | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/students/me` | Student | Retrieve student academic file (CGPA, semester standing, major). |
| `GET` | `/students/me/enrollments` | Student | List courses the student is taking in the active semester. |
| `GET` | `/students` | Admin | List all student profiles within their department. |
| `GET` | `/students/semester/:semester` | Admin | Retrieve all students enrolled in a specific semester (e.g. `4`). |
| `GET` | `/students/:id/enrollments` | Admin | Fetch academic history and enrollment logs of a specific student. |
| `GET` | `/students/:id` | Admin | Retrieve a single student's master profile record. |
| `PATCH` | `/students/:id` | Admin | Edit student record, update standing, semester, or major. |
| `DELETE` | `/students/:id` | Admin | Withdraw student completely and delete profile data. |

### Payload Examples

#### Update Student Body (`PATCH /students/:id`)
```json
{
  "major": "Software Engineering",
  "semester": 5
}
```

---

<a id="7-teachers"></a>
## 7. 👨‍🏫 Teacher Management (`/teachers`)

Instructor professional records, including academic departments, professional qualification levels, and designations.

| Method | Endpoint | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/teachers/me` | Teacher | Fetch profile details, qualifications, and department affiliation. |
| `GET` | `/teachers/me/offerings` | Teacher | Get the teacher's active classes/timetable sections. |
| `GET` | `/teachers` | Admin | Get all teachers belonging to the Admin's department. |
| `GET` | `/teachers/:id/offerings` | Admin | Fetch all sections assigned to a specific teacher. |
| `GET` | `/teachers/:id` | Admin | Retrieve a teacher profile record by UUID. |
| `PATCH` | `/teachers/:id` | Admin | Update professional status, designation, or qualifications. |
| `DELETE` | `/teachers/:id` | Admin | Offboard instructor and archive profile from the system. |

### Payload Examples

#### Update Teacher Body (`PATCH /teachers/:id`)
```json
{
  "designation": "Associate Professor",
  "qualification": "PhD in Machine Learning"
}
```

---

<a id="8-enrollments"></a>
## 8. 📝 Course Enrollments (`/enrollments`)

Links students to course offerings. Admins manage student course loading.

| Method | Endpoint | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/enrollments` | Admin | Enroll a student in a class offering. Checks capacity. |
| `GET` | `/enrollments` | Admin | List all enrollments in the department. Supports pagination. |
| `GET` | `/enrollments/student/:studentId` | Admin | Get all current and past enrollments for a specific student. |
| `GET` | `/enrollments/offering/:offeringId` | Admin | Get list of all enrolled students in a course offering. |
| `GET` | `/enrollments/:id` | Admin | Fetch single enrollment record detail. |
| `PATCH` | `/enrollments/:id` | Admin | Modify enrollment status (e.g., active, suspended, withdrawn). |
| `DELETE` | `/enrollments/:id` | Admin | Hard drop a student from a course section. |

### Payload Examples

#### Create Enrollment Body (`POST /enrollments`)
```json
{
  "studentId": "a1b2c3d4-e5f6-4g7h-8i9j-k0l1m2n3o4p5",
  "offeringId": "o1p2q3r4-s5t6-u7v8-w9x0-y1z2a3b4c5d6"
}
```

#### Update Enrollment Body (`PATCH /enrollments/:id`)
```json
{
  "status": "WITHDRAWN"
}
```

---

<a id="9-schedules"></a>
## 9. 📅 Schedules & Timetables (`/schedules`)

Manages the weekly academic timetable. Facilitates setting up repeating class slots and booking lecture rooms/labs.

| Method | Endpoint | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/schedules` | Admin, Teacher | Create a weekly recurring lecture/lab session in a specific room. |
| `GET` | `/schedules/offering/:offeringId` | All Authenticated | Get the weekly slot timetable list for a course section. |
| `DELETE` | `/schedules/:id` | Admin, Teacher | Cancel and remove a weekly recurring class schedule slot. |
| `POST` | `/schedules/exceptions` | Admin, Teacher | Declare a timetable exception (e.g. holiday, room change). |
| `GET` | `/schedules/offering/:offeringId/exceptions` | All Authenticated | Fetch active schedule exceptions for a class. |
| `DELETE` | `/schedules/exceptions/:id` | Admin, Teacher | Cancel a schedule exception and restore default timetable. |

### Payload Examples

#### Create Schedule Body (`POST /schedules`)
```json
{
  "offeringId": "o1p2q3r4-s5t6-u7v8-w9x0-y1z2a3b4c5d6",
  "day": "Monday",
  "startTime": "09:00",
  "endTime": "10:30",
  "room": "CS-Lab 3"
}
```

#### Create Schedule Exception Body (`POST /schedules/exceptions`)
```json
{
  "offeringId": "o1p2q3r4-s5t6-u7v8-w9x0-y1z2a3b4c5d6",
  "date": "2026-10-15",
  "reason": "Midterm Exam Clash",
  "isCancelled": true
}
```

---

<a id="10-attendance"></a>
## 10. 📊 Attendance Tracking (`/attendance`)

Facilitates teaching sessions tracking. Allows teachers to start teaching sessions and record student attendance.

| Method | Endpoint | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/attendance` | Admin, Teacher | Record attendance (Present/Absent/Late) for a student session. |
| `POST` | `/attendance/sessions` | Admin, Teacher | Start an explicit lecture/lab session on a date for attendance tracking. |
| `GET` | `/attendance/offering/:offeringId/sessions` | Admin, Teacher, Student | Fetch all registered teaching sessions for a class offering. |
| `GET` | `/attendance/session/:sessionId` | Admin, Teacher, Student | Fetch attendance list of all students for a specific session. |
| `GET` | `/attendance/offering/:offeringId` | Admin, Teacher, Student | View overall student statistics, counts, and percentages. |

### Payload Examples

#### Mark Attendance Body (`POST /attendance`)
```json
{
  "studentId": "a1b2c3d4-e5f6-4g7h-8i9j-k0l1m2n3o4p5",
  "sessionId": "s1t2u3v4-w5x6-y7z8-a9b0-c1d2e3f4g5h6",
  "status": "PRESENT"
}
```

#### Create Session Body (`POST /attendance/sessions`)
```json
{
  "offeringId": "o1p2q3r4-s5t6-u7v8-w9x0-y1z2a3b4c5d6",
  "date": "2026-05-17",
  "topic": "Graph Algorithms and Shortest Paths"
}
```

---

<a id="11-assignments"></a>
## 11. ✏️ Academic Assignments (`/assignments`)

Allows teachers to set tasks, deadlines, and weight categories (assignments, quizzes, presentations, projects) for a course section.

| Method | Endpoint | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/assignments` | Admin, Teacher | Publish a graded assessment, specifying title, description, and due date. |
| `GET` | `/assignments/offering/:offeringId` | All Authenticated | Fetch assignments, quizzes, and tasks for an offering section. |
| `PATCH` | `/assignments/:id` | Admin, Teacher | Modify assignment parameters (deadline, description, max points). |
| `PATCH` | `/assignments/:id/done` | Admin, Teacher | Lock/finish grading for an assignment. |
| `DELETE` | `/assignments/:id` | Admin, Teacher | Remove assessment. Note: Deletes student marks. |

### Joi Schema Validation

*   `offering_id`: UUID (Required)
*   `title`: String (Required)
*   `description`: String (Optional)
*   `assessment_type`: ENUM (`"assignment"`, `"quiz"`, `"presentation"`, `"project"`) (Default: `"assignment"`)
*   `due_date`: ISO Date string (Required)
*   `total_points`: Positive Number (Required)

### Payload Examples

#### Create Assignment Body (`POST /assignments`)
```json
{
  "offering_id": "o1p2q3r4-s5t6-u7v8-w9x0-y1z2a3b4c5d6",
  "title": "Semester Project Phase 1",
  "description": "Submit database model diagram and schema DDL",
  "assessment_type": "project",
  "due_date": "2026-06-15T23:59:59.000Z",
  "total_points": 50
}
```

#### Update Assignment Body (`PATCH /assignments/:id`)
```json
{
  "title": "Project Phase 1 (Revised)",
  "total_points": 40
}
```

---

<a id="12-grades"></a>
## 12. 💯 Grades & Transcripts (`/grades`)

Coordinates grade entry and handles automated CGPA aggregation according to the official **University of Sargodha (UOS) Undergraduate Semester Regulations 2023**.

| Method | Endpoint | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/grades` | Admin, Teacher | Grade a student task or input exam results (Mid, Final, Sessional). |
| `GET` | `/grades/offering/:offeringId` | Admin, Teacher | Retrieve the full graded spreadsheet for a section. |
| `GET` | `/grades/student/:studentId/offering/:offeringId/calculation` | Admin, Teacher, Student | Fetch detailed calculations: absolute rounded total and final GPA/Grade. |
| `GET` | `/grades/student/:studentId/transcript` | Admin, Student | Fetch student transcripts containing semester SGPA and aggregate CGPA. |

### Joi Schema Validation

*   `offering_id`: UUID (Required)
*   `student_id`: UUID (Required)
*   `assessment_type`: ENUM (`"assignment"`, `"sessional"`, `"midterm"`, `"final"`, `"practical"`, `"quiz"`, `"presentation"`, `"project"`) (Required)
*   `reference_id`: UUID (Optional, links to assignment table)
*   `title`: String (Required if type is sessional/mid/final, optional for linked assignments)
*   `score`: Number >= 0 (Required)
*   `max_score`: Positive Number (Required if type is midterm/final/sessional)

### Payload Examples

#### Assign Grade Body (`POST /grades`)
```json
{
  "offering_id": "o1p2q3r4-s5t6-u7v8-w9x0-y1z2a3b4c5d6",
  "student_id": "a1b2c3d4-e5f6-4g7h-8i9j-k0l1m2n3o4p5",
  "assessment_type": "midterm",
  "title": "Midterm Examination Fall 2026",
  "score": 26,
  "max_score": 30
}
```

---

<a id="13-announcements"></a>
## 13. 📢 Announcements & Broadcasts (`/announcements`)

Enables administrators and teachers to broadcast academic alerts and general announcements system-wide or targeted by department/offering.

| Method | Endpoint | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/announcements` | Admin, Teacher | Create an announcement. Triggers Push Alert to targeted users. |
| `GET` | `/announcements` | All Authenticated | Fetch active announcements filtered for user department or role. |
| `PATCH` | `/announcements/:id` | Admin, Teacher | Update announcement contents and resend push notifications. |
| `DELETE` | `/announcements/:id` | Admin, Teacher | Revoke announcement and delete it from user dashboards. |

### Payload Examples

#### Create Announcement Body (`POST /announcements`)
```json
{
  "title": "Semester Registration Closing",
  "content": "Please complete your course enrollment forms by next Friday.",
  "department_id": 1
}
```

#### Update Announcement Body (`PATCH /announcements/:id`)
```json
{
  "title": "Urgent: Semester Registration Closing",
  "content": "Please complete your course enrollment forms by this Wednesday."
}
```

---

<a id="14-notifications"></a>
## 14. 🔔 Real-Time Notifications (`/notifications`)

Handles mobile FCM device tokens, gets personal alert feeds, and manages user notification statuses.

| Method | Endpoint | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/notifications/token` | All Authenticated | Register a mobile FCM device token to enable push alerts. |
| `GET` | `/notifications` | All Authenticated | Retrieve personal alert logs. Supports pagination. |
| `PATCH` | `/notifications/:id/read` | All Authenticated | Mark a targeted in-app notification alert as read. |

### Payload Examples

#### Save Push Token Body (`POST /notifications/token`)
```json
{
  "token": "fcm_token_example_1234567890"
}
```

---

<a id="15-community"></a>
## 15. 💬 Community Social Forum (`/community`)

Department-level discussion forum. Enables academic discourse and Q&A. Students are capped at 3 comments per post.

| Method | Endpoint | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/community/posts` | Student, Teacher, Admin | Create a new community post inside user's department. |
| `GET` | `/community/posts` | Student, Teacher, Admin | Fetch discussion feed. Supports `?limit=` and `?offset=`. |
| `GET` | `/community/posts/:id` | Student, Teacher, Admin | Fetch complete thread detailing post, comments, and like status. |
| `PATCH` | `/community/posts/:id` | Student, Teacher, Admin | Edit a post content. Enforces authorship validation. |
| `DELETE` | `/community/posts/:id` | Student, Teacher, Admin | Delete a thread. Enforces authorship or department Admin role. |
| `POST` | `/community/posts/:id/comments` | Student, Teacher, Admin | Write a reply comment on a post thread. (Max 3/student). |
| `PATCH` | `/community/comments/:id` | Student, Teacher, Admin | Edit reply comment. Enforces authorship validation. |
| `DELETE` | `/community/comments/:id` | Student, Teacher, Admin | Delete reply comment. Enforces authorship or department Admin. |
| `POST` | `/community/posts/:id/like` | Student, Teacher, Admin | Add a like (upvote) to a specific thread post. |
| `DELETE` | `/community/posts/:id/like` | Student, Teacher, Admin | Unlike (remove upvote) from a specific post thread. |

### Payload Examples

#### Create Post Body (`POST /community/posts`)
```json
{
  "title": "Tips for Preparing FYP Presentations?",
  "content": "Does anyone have structured slides guidelines for Final Year Projects?",
  "category": "academic"
}
```

#### Create Comment Body (`POST /community/posts/:id/comments`)
```json
{
  "content": "Keep slides visual, explain methodology first, and test demo early!"
}
```

#### Update Comment Body (`PATCH /community/comments/:id`)
```json
{
  "content": "Keep slides highly visual, explain methodology first, and practice mock presentation!"
}
```

---

<a id="16-admins"></a>
## 16. 🛡️ Admin Identity Management (`/admins`)

Enables Super Admins to provision and manage standard Admin roles associated with specific university departments.

| Method | Endpoint | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/admins/me` | Admin, Super Admin | Fetch active administrator profile details. |
| `GET` | `/admins` | Admin, Super Admin | List all registered administrative staff profiles in the system. |
| `GET` | `/admins/:id` | Admin, Super Admin | Retrieve single administrative profile. |
| `PATCH` | `/admins/:id` | Admin, Super Admin | Edit administrative staff name or contact information. |
| `DELETE` | `/admins/:id` | Admin | Delete standard administrative staff profile. Enforces Super Admin rights. |

### Payload Examples

#### Update Admin Body (`PATCH /admins/:id`)
```json
{
  "name": "Senior Department Admin"
}
```

---

<a id="17-system"></a>
## 17. ⚙️ System Utilities (`/`)

Public platform management utilities to verify system status and review API routes interactively.

| Method | Endpoint | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | Verify server connectivity. Returns status `"ok"`. |
| `GET` | `/docs` | Public | Interactive Swagger UI sandbox. Useful for real-time testing. |

---

## ⚠️ Common Error Codes

| HTTP Status | Error Label | Description / Resolution |
| :--- | :--- | :--- |
| `400` | `Bad Request` | Validation constraint failed (missing parameters, data out of bounds). |
| `401` | `Unauthorized` | Credentials authentication failed (missing token, invalid password, or expired session). |
| `403` | `Forbidden` | Access role unauthorized (trying to modify data outside department or restricted role). |
| `404` | `Not Found` | Resource or route requested does not exist on this server. |
| `429` | `Too Many Requests` | Rate limit breached (default window enforces max 100 requests per 15 minutes). |
| `500` | `Internal Server Error` | Database connection glitch or unexpected code crash. |
