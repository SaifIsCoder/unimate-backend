Backend Node.js/Express endpoints needed:

1. GET /api/v1/schedules/my 
   → Return student's timetable from offerings table
   
2. GET /api/v1/attendance/my/summary
   → Sum attendance from attendance_records, group by course
   
3. GET /api/v1/grades/my/summary
   → Calculate current GPA from grades table (UOS rules)
   
4. GET /api/v1/assignments/my?status=pending
   → Return assignments from assignments table filtered by status
   
5. GET /api/v1/assignments/:id
   → Return single assignment details
   
6. POST /api/v1/assignments/:id/submit
   → Save submission to assignment_submissions table
   
7. GET /api/v1/events/upcoming?limit=1
   → Return upcoming events from events table
   
8. GET /api/v1/grades/my/course/:courseId
   → Return grade breakdown for specific course




   AI Layer Architecture
Your 5 AI Features:

GPA Goal Tracker 📊

Student sets target CGPA → AI calculates required grades
Shows which courses matter most (credit-weighted)
Location: GradesScreen


Attendance Guardian 📍

AI predicts: "You can skip 2 more classes and stay above 75%"
Warns about critical courses
Location: HomeScreen


Smart Schedule ⏰

AI detects "3 back-to-back classes"
Suggests break times and prep work
Location: ScheduleScreen


Skill-Trend Heatmap 🔥

NLP analyzes community posts
Shows: "80% seniors getting AWS certified"
Recommends courses based on trends
Location: CommunityTab


Task Prioritization ✅

AI ranks assignments by urgency + difficulty
"Start DB project - you struggle with this, due in 2 days"
Location: TasksScreen



// 5 new routes in /routes/ai.js
POST   /api/v1/ai/gpa-goal
GET    /api/v1/ai/attendance-guardian
GET    /api/v1/ai/smart-schedule
GET    /api/v1/ai/skill-trends
POST   /api/v1/ai/prioritize-tasks