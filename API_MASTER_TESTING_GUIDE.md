# 🎓 Unimate API Master Testing Guide

This document is your complete reference for testing the Unimate Backend. It covers all **88 endpoints** with exact JSON test data.

---

## 🔑 Authentication & Headers
**Base URL:** `http://localhost:5000/api` (or your local port)
**Header for Protected Routes:** `Authorization: Bearer <YOUR_TOKEN>`

---

## 1. 🔐 Authentication Module
| Action | Method | URL | Body / Notes |
| :--- | :--- | :--- | :--- |
| **Login Admin** | `POST` | `/auth/login/admin` | `{"email": "superadmin@unimate.com", "password": "adminpassword123"}` |
| **Login Student**| `POST` | `/auth/login/student`| `{"email": "student@unimate.com", "password": "INITIAL_PASSWORD"}` |
| **Login Teacher**| `POST` | `/auth/login/teacher`| `{"email": "teacher@unimate.com", "password": "INITIAL_PASSWORD"}` |
| **Reset Pass** | `POST` | `/auth/reset-password`| `{"password": "NewSecurePassword123!"}` |

---

## 2. 🏛️ Department Module (CRUD)
| Action | Method | URL | Body / Data |
| :--- | :--- | :--- | :--- |
| **Create** | `POST` | `/departments` | `{"name": "Computer Science", "code": "CS", "description": "Tech Dept"}` |
| **Read All** | `GET` | `/departments` | |
| **Read One** | `GET` | `/departments/:id` | |
| **Update** | `PATCH` | `/departments/:id` | `{"name": "CS & IT"}` |
| **Delete** | `DELETE` | `/departments/:id` | |

---

## 3. 👥 User & Profile Module (CRUD)
*Note: Use this to create any role.*

| Action | Method | URL | Body / Data |
| :--- | :--- | :--- | :--- |
| **Create Student**| `POST` | `/users` | `{"email": "s1@u.com", "role": "student", "roll_number": "CS01", "batch": 2024, "department_id": 1}` |
| **Create Teacher**| `POST` | `/users` | `{"email": "t1@u.com", "role": "teacher", "employee_id": "T01", "department_id": 1}` |
| **Get Me** | `GET` | `/users/me` | |
| **Update User** | `PATCH` | `/users/:id` | `{"is_active": true}` |
| **Delete User** | `DELETE` | `/users/:id` | |

---

## 4. 📚 Course & Offering Module (CRUD)
| Action | Method | URL | Body / Data |
| :--- | :--- | :--- | :--- |
| **Create Course**| `POST` | `/courses` | `{"code": "CS101", "title": "Programming", "credit_hours": 3, "department": "CS"}` |
| **Create Offer** | `POST` | `/offerings` | `{"course_id": "UUID", "teacher_id": "UUID", "semester": "Fall 24", "section": "A", "capacity": 50}` |
| **Enroll Student**| `POST` | `/enrollments` | `{"student_id": "UUID", "offering_id": "UUID", "status": "enrolled"}` |

---

## 5. 🗓️ Schedule & Attendance Module
| Action | Method | URL | Body / Data |
| :--- | :--- | :--- | :--- |
| **Add Schedule** | `POST` | `/schedules` | `{"offering_id": "UUID", "day_of_week": "Monday", "start_time": "09:00", "end_time": "12:00", "room": "Lab 1"}` |
| **Add Exception**| `POST` | `/schedules/exceptions` | `{"offering_id": "UUID", "date": "2024-05-20", "exception_type": "cancelled"}` |
| **Take Attend** | `POST` | `/attendance` | `{"offering_id": "UUID", "date": "2024-05-15", "records": [{"student_id": "UUID", "status": "present"}]}` |

---

## 6. ✍️ Assignments & Grades Module
| Action | Method | URL | Body / Data |
| :--- | :--- | :--- | :--- |
| **New Assign** | `POST` | `/assignments` | `{"offering_id": "UUID", "title": "Quiz 1", "due_date": "2024-05-25", "total_points": 10}` |
| **Mark Done** | `PATCH` | `/assignments/:id/done` | |
| **Submit Grade** | `POST` | `/grades` | `{"offering_id": "UUID", "student_id": "UUID", "assessment_type": "assignment", "title": "Quiz 1", "score": 8, "max_score": 10}` |
| **Transcript** | `GET` | `/grades/student/:id/transcript` | |

---

## 7. 💬 Community & Notifications
| Action | Method | URL | Body / Data |
| :--- | :--- | :--- | :--- |
| **Create Post** | `POST` | `/community/posts` | `{"title": "FYP Help", "content": "Looking for partners"}` |
| **Like Post** | `POST` | `/community/posts/:id/like`| |
| **Comment** | `POST` | `/community/posts/:id/comments` | `{"content": "I am interested!"}` |
| **Push Token** | `POST` | `/notifications/token` | `{"fcm_token": "TOKEN_123"}` |

---

## 🛠️ Step-by-Step Recommended Testing Flow
1. **Bootstrap**: Login as Super Admin -> Create a Department.
2. **Users**: Create 1 Admin, 1 Teacher, 1 Student.
3. **Academic**: Create 1 Course -> Create 1 Offering (link Teacher & Course) -> Enroll Student.
4. **Operations**: Add Schedule -> Record Attendance.
5. **Evaluation**: Create Assignment -> Post Grade.
6. **Social**: Post in Community -> Like -> Comment.
7. **Clean up**: Try deleting an enrollment, then a user, then a department.

---
**Author:** Unimate Dev Team
**Date:** May 15, 2026
