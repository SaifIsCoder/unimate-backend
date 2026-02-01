# UniMate – Canonical Product Requirements Document (PRD)

> STATUS: AUTHORITATIVE  
> SCOPE: ALL CODE MUST COMPLY  
> AUDIENCE: AI AGENT, BACKEND, FRONTEND, MOBILE  
> RULE: IF CODE ≠ PRD → CODE IS WRONG

---

## 0. GLOBAL ENFORCEMENT RULES (AI MUST CHECK)

The system MUST satisfy ALL of the following:

- [ ] Multi-tenant (University = Tenant)
- [ ] Every model contains `tenantId`
- [ ] Every query is tenant-scoped
- [ ] Controllers contain NO business logic
- [ ] Services contain ALL business logic
- [ ] Role + permission based authorization
- [ ] Audit logging for EVERY write action
- [ ] Soft delete (no hard deletes)
- [ ] REST API, versioned (`/api/v1`)
- [ ] Mobile-first payload design
- [ ] AI features are optional and isolated

If any checkbox is ❌ → NON-COMPLIANT

---

## 1. ROLES (MUST EXIST)

The system MUST define the following roles:

- [ ] SuperAdmin (platform-level)
- [ ] UniversityAdmin (tenant-level)
- [ ] DepartmentAdmin
- [ ] Teacher
- [ ] Student
- [ ] Auditor (read-only)

Authorization MUST be permission-based.  
Hardcoded role checks are FORBIDDEN.

---

## 2. MULTI-TENANCY (MANDATORY)

### Rules
- [ ] One tenant = one university
- [ ] `tenantId` exists on ALL domain entities
- [ ] Tenant resolved via middleware
- [ ] Tenant injected into request context
- [ ] Cross-tenant access impossible by design

---

## 3. MODULE: ACADEMIC STRUCTURE

### 3.1 Academic Cycle
Required features:
- [ ] Create academic cycle
- [ ] Update academic cycle
- [ ] Archive academic cycle
- [ ] Prevent overlapping cycles
- [ ] Mark one active cycle per tenant

---

### 3.2 Department
Required features:
- [ ] CRUD departments
- [ ] Assign department admins
- [ ] Assign teachers to department
- [ ] Restrict cross-department access

---

### 3.3 Program
Required features:
- [ ] CRUD programs
- [ ] Assign to department
- [ ] Define duration
- [ ] Attach subjects
- [ ] Program visibility per academic cycle

---

### 3.4 Class
Required features:
- [ ] Create classes per program + cycle
- [ ] Assign teachers
- [ ] Assign subjects
- [ ] Multiple classes per day allowed
- [ ] Class capacity limits

---

### 3.5 Subject
Required features:
- [ ] Credit hours
- [ ] Theory / Lab type
- [ ] Assigned to programs
- [ ] Used in attendance & grading

---

## 4. MODULE: USER MANAGEMENT

### 4.1 User
Required features:
- [ ] Create user (admin only)
- [ ] Assign roles
- [ ] Assign department
- [ ] User status (active/suspended)
- [ ] Soft delete user

---

### 4.2 Authentication
Required features:
- [ ] Login
- [ ] Logout
- [ ] Refresh token
- [ ] Token invalidation
- [ ] Password hashing
- [ ] JWT access + refresh tokens

---

## 5. MODULE: ENROLLMENT

Required features:
- [ ] Enroll student into class
- [ ] Prevent duplicate enrollment
- [ ] Enforce eligibility rules
- [ ] Enrollment status tracking
- [ ] Batch enrollment support

---

## 6. MODULE: ATTENDANCE (CRITICAL)

Rules:
- Attendance is CLASS-SPECIFIC
- Multiple classes per day allowed
- Teacher can mark attendance ANY TIME later
- Admin can override attendance
- Overrides MUST be audit-logged

Required features:
- [ ] Mark present/absent
- [ ] Attendance history
- [ ] Attendance override
- [ ] Attendance reports
- [ ] Optional attendance locking

---

## 7. MODULE: ASSIGNMENTS & SUBMISSIONS

### 7.1 Assignment
Required features:
- [ ] Create assignment
- [ ] Due date
- [ ] Text or file submission
- [ ] Visibility rules

---

### 7.2 Submission
Required features:
- [ ] Student submission
- [ ] Late submission handling
- [ ] Submission versioning
- [ ] Teacher feedback

---

## 8. MODULE: GRADING

Required features:
- [ ] Grade per subject
- [ ] Weighted components
- [ ] Grade updates
- [ ] Grade override (admin only)
- [ ] Grade history tracking

---

## 9. MODULE: FINANCIALS

### 9.1 Fee
Required features:
- [ ] Fee structure per program
- [ ] Due dates
- [ ] Payment status
- [ ] Fee history

---

### 9.2 Fine
Required features:
- [ ] Attendance fines
- [ ] Late submission fines
- [ ] Manual fines
- [ ] Fine resolution tracking

---

## 10. MODULE: EVENTS & ANNOUNCEMENTS

### 10.1 Event
Required features:
- [ ] University-level events
- [ ] Department-level events
- [ ] Date & time
- [ ] Role-based visibility

---

### 10.2 Announcement
Required features:
- [ ] Role-based announcements
- [ ] Expiry date
- [ ] Read tracking

---

## 11. MODULE: AUDIT & GOVERNANCE (NON-OPTIONAL)

Audit logging MUST exist for:
- [ ] Authentication events
- [ ] Create / Update / Delete
- [ ] Attendance override
- [ ] Grade override
- [ ] Permission denial

Audit log MUST include:
- tenantId
- userId
- role
- action
- entity
- before/after snapshot
- timestamp
- requestId

---

## 12. MODULE: AI INTEGRATION

Rules:
- AI must NEVER block core flows
- AI must be feature-flag controlled

Required features:
- [ ] AI request logging
- [ ] Prompt metadata logging
- [ ] Duration logging
- [ ] Independent rate limiting

---

## 13. API STANDARDS

- [ ] REST
- [ ] `/api/v1` versioning
- [ ] Plural resources
- [ ] Pagination on all list endpoints
- [ ] Predictable HTTP status codes

---

## 14. ERROR HANDLING STANDARD

All errors MUST follow:
```json
{
  "code": "DOMAIN_ERROR_CODE",
  "message": "Human readable message",
  "requestId": "uuid"
}
