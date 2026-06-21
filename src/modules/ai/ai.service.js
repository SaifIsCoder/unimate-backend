import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppError } from "../../utils/app-error.js";
import env from "../../config/env.js";
import { pool } from "../../config/db.js";
import * as studentRepository from "../student/student.repository.js";
import * as gradesRepository from "../grades/grades.repository.js";
import * as assignmentRepository from "../assignment/assignment.repository.js";
import * as academicRules from "../../utils/academic-rules.js";

const safeJsonParse = (text, fallbackStart = "{", fallbackEnd = "}") => {
  const jsonStart = text.indexOf(fallbackStart);
  const jsonEnd = text.lastIndexOf(fallbackEnd) + 1;
  if (jsonStart !== -1 && jsonEnd !== -1) {
    return JSON.parse(text.slice(jsonStart, jsonEnd));
  }
  return null;
};

// Initialize Gemini Client safely
let genAI = null;
if (env.geminiApiKey) {
  try {
    genAI = new GoogleGenerativeAI(env.geminiApiKey);
  } catch (error) {
    console.error("Failed to initialize Google Gen AI SDK:", error.message);
  }
}

// ── SHARED HELPER: Fetch Aggregated Student Data ──────────────────────────────

const fetchStudentAcademicProfile = async (userId) => {
  const student = await studentRepository.findByUserId(userId);
  if (!student) {
    throw new AppError("Student profile not found", 404);
  }

  // 1. Fetch academic grades and compute transcript
  const rawTranscript = await gradesRepository.findTranscriptDataForStudent(student.id);
  const transcript = academicRules.transformTranscriptData(rawTranscript);

  // 2. Fetch assignments
  const assignmentsList = await assignmentRepository.findAssignmentsByStudent(student.id);
  const now = new Date();
  const assignments = assignmentsList.map(item => {
    let status = item.status;
    if (status === 'pending' && new Date(item.due) < now) {
      status = 'overdue';
    }
    return { ...item, status };
  });

  // 3. Fetch course attendance
  const attendanceQuery = `
    SELECT 
      e.offering_id,
      c.code AS course_code,
      c.title AS course_title,
      COUNT(ar.id) FILTER (WHERE ar.status = 'present') AS present_count,
      COUNT(ar.id) FILTER (WHERE ar.status = 'leave') AS leave_count,
      (SELECT COUNT(*)::int FROM attendance_sessions WHERE offering_id = e.offering_id) AS total_lectures
    FROM enrollments e
    JOIN course_offerings co ON co.id = e.offering_id
    JOIN courses c ON c.id = co.course_id
    LEFT JOIN attendance_records ar ON ar.enrollment_id = e.id
    WHERE e.student_id = $1 AND e.status = 'enrolled'
    GROUP BY e.id, e.offering_id, c.code, c.title
  `;
  const attendanceResult = await pool.query(attendanceQuery, [student.id]);
  
  let totalLectures = 0;
  let totalPresent = 0;
  let totalLeaves = 0;
  
  const attendanceCourses = attendanceResult.rows.map(row => {
    const present = parseInt(row.present_count, 10) || 0;
    const leaves = parseInt(row.leave_count, 10) || 0;
    const lectures = parseInt(row.total_lectures, 10) || 0;
    
    const adjustedTotal = lectures - leaves;
    let percentage = 100.0;
    if (adjustedTotal > 0) {
      percentage = (present / adjustedTotal) * 100;
    }
    
    totalLectures += lectures;
    totalPresent += present;
    totalLeaves += leaves;
    
    return {
      course_code: row.course_code,
      course_title: row.course_title,
      attendance_percentage: Number(percentage.toFixed(2)),
      present,
      total: lectures
    };
  });
  
  const overallAdjustedTotal = totalLectures - totalLeaves;
  let averageAttendance = 100.0;
  if (overallAdjustedTotal > 0) {
    averageAttendance = (totalPresent / overallAdjustedTotal) * 100;
  }

  // Get department details
  const deptQuery = `SELECT name, code FROM departments WHERE id = $1`;
  const deptRes = await pool.query(deptQuery, [student.department_id]);
  const departmentName = deptRes.rows[0]?.name || "Computer Science";

  return {
    student,
    departmentName,
    cgpa: Number(transcript.cgpa.toFixed(2)) || 0.0,
    creditsCompleted: 60, // Mock completed credit hours for Lumina math calculations
    creditsEnrolled: transcript.total_credit_hours || 0,
    averageAttendance: Number(averageAttendance.toFixed(2)),
    courses: transcript.courses,
    attendanceCourses,
    assignments
  };
};

// ── 1. DAILY BRIEFING ENGINE (`GET /ai/briefing`) ─────────────────────────────

export const getBriefing = async (userId) => {
  const profile = await fetchStudentAcademicProfile(userId);
  const targetCgpa = Number(profile.student.target_cgpa) || 3.0;

  // Query today's classes
  const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
  const classesQuery = `
    SELECT 
      c.title AS course_title,
      s.start_time,
      s.end_time,
      s.room
    FROM enrollments e
    JOIN course_offerings co ON co.id = e.offering_id
    JOIN courses c ON c.id = co.course_id
    JOIN schedules s ON s.offering_id = co.id
    WHERE e.student_id = $1 AND e.status = 'enrolled' AND s.day_of_week = $2
    ORDER BY s.start_time ASC
  `;
  const classesRes = await pool.query(classesQuery, [profile.student.id, dayOfWeek]);
  const todayClasses = classesRes.rows.map(row => `${row.course_title} at ${row.start_time} in ${row.room}`);

  // Pending deadlines
  const pendingAss = profile.assignments.filter(a => a.status === 'pending' || a.status === 'overdue');
  const pendingText = pendingAss.slice(0, 3).map(a => `${a.title} (due ${new Date(a.due).toLocaleDateString()})`);

  // Low attendance warning courses
  const lowAttendance = profile.attendanceCourses.filter(a => a.attendance_percentage < 75).map(a => `${a.course_title} (${a.attendance_percentage}%)`);

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        You are uniMate AI, a friendly academic coach.
        Based on the following student profile and daily status, write a concise 2-sentence briefing. Keep it encouraging.
        
        Student Data:
        - Name: ${profile.student.roll_number}
        - Class Schedule Today: ${todayClasses.join(", ") || "No classes scheduled today"}
        - Pending Deadlines: ${pendingText.join(", ") || "No urgent deadlines"}
        - Low Attendance Warnings: ${lowAttendance.join(", ") || "All attendance above 75%"}
        
        Output Format (Strict JSON):
        {
          "briefContent": "Your generated 2-sentence summary here."
        }
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}") + 1;
      if (jsonStart !== -1 && jsonEnd !== -1) {
        return JSON.parse(text.slice(jsonStart, jsonEnd));
      }
    } catch (error) {
      console.warn("Gemini briefing failed, falling back to rule-based summary:", error.message);
    }
  }

  // ── RULE-BASED FALLBACK: Daily Briefing ──
  const classBrief = todayClasses.length > 0 
    ? `You have ${todayClasses.length} lectures scheduled today starting with ${classesRes.rows[0].course_title} in ${classesRes.rows[0].room}.`
    : "You have no classes scheduled today; use this free time to catch up on self-study.";

  const assignmentBrief = pendingAss.length > 0
    ? `Make sure to allocate time for your ${pendingAss.length} pending assignments, specifically '${pendingAss[0].title}'.`
    : "Awesome job keeping your tasks updated—no outstanding assignments due immediately.";

  const attendanceBrief = lowAttendance.length > 0
    ? `Warning: Your attendance in ${lowAttendance[0]} is critical. Attend classes to avoid UOS exam restrictions.`
    : "Keep keeping your class attendance high and stay eligible!";

  return {
    briefContent: `Welcome back! ${classBrief} ${assignmentBrief} ${attendanceBrief}`
  };
};

// ── 2. INTERACTIVE COPILOT COMPANION (`POST /ai/copilot`) ──────────────────────

export const getCopilotReply = async (userId, query, activeCourseId) => {
  const profile = await fetchStudentAcademicProfile(userId);

  // Fetch grades & attendance for activeCourseId if provided
  let activeCourseData = null;
  if (activeCourseId) {
    const gradesQuery = `
      SELECT assessment_type, title, score, max_score
      FROM grades g
      JOIN enrollments e ON e.id = g.enrollment_id
      WHERE e.student_id = $1 AND e.offering_id = $2
    `;
    const gradesRes = await pool.query(gradesQuery, [profile.student.id, activeCourseId]);
    
    const attCourse = profile.attendanceCourses.find(a => a.offering_id === activeCourseId) || { present: 0, total: 0, attendance_percentage: 100 };
    
    activeCourseData = {
      grades: gradesRes.rows,
      attendance: attCourse
    };
  }

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        You are uniMate AI Copilot. Assist the student with their query.
        Use the UOS 2023 Semester Regulations to calculate targets if asked. 
        Attendance requirement is strictly 75% minimum to sit in final exams.
        
        Student Query: "${query}"
        Student Context:
        - Student Name: ${profile.student.roll_number}
        - Current CGPA: ${profile.cgpa}
        - Enrolled Credits: ${profile.creditsEnrolled}
        - Active Course Focus Data: ${activeCourseData ? JSON.stringify(activeCourseData, null, 2) : "None selected"}
        
        Output Format (Strict JSON):
        {
          "reply": "Your contextual response based on the UOS calculations...",
          "suggestedChips": ["Follow-up suggestion 1", "Follow-up suggestion 2"]
        }
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}") + 1;
      if (jsonStart !== -1 && jsonEnd !== -1) {
        return JSON.parse(text.slice(jsonStart, jsonEnd));
      }
    } catch (error) {
      console.warn("Gemini Copilot failed, falling back to rule-based reply:", error.message);
    }
  }

  // ── RULE-BASED FALLBACK: Copilot Reply ──
  let reply = `Hello! I am your uniMate AI companion. I see you are asking: "${query}". `;
  const chips = ["How do I calculate GPA?", "Check my attendance eligibility", "View my upcoming assignments"];

  if (activeCourseData) {
    const att = activeCourseData.attendance;
    reply += `Regarding your active course, your current attendance stands at ${att.attendance_percentage}%. `;
    if (att.attendance_percentage < 75) {
      reply += `This is below the UOS 75% requirement. You must attend more upcoming sessions to avoid exam ineligibility. `;
    } else {
      reply += `Your attendance is in good standing! `;
    }
  } else {
    reply += `Your overall average attendance is ${profile.averageAttendance}% across your enrolled semesters, with a current CGPA of ${profile.cgpa}. Let me know if you would like me to predict your GPA or target study hours!`;
  }

  return {
    reply,
    suggestedChips: chips
  };
};

// ── 3. LUMINA GRADE & GPA PROJECTION ENGINE (`POST /ai/grades/projection`) ────

export const getGradeProjection = async (userId, targetCgpaInput, studyIntensityInput) => {
  const profile = await fetchStudentAcademicProfile(userId);
  
  const targetCgpa = Number(targetCgpaInput) || Number(profile.student.target_cgpa) || 3.0;
  const intensity = studyIntensityInput || profile.student.study_intensity || "balanced";

  const completedCredits = profile.creditsCompleted;
  const remainingCredits = 48; // Standard remaining hours forecast
  const currentCgpa = profile.cgpa;

  // Mathematically derive required upcoming GPA to hit target CGPA
  // Formula: ((Target * Total) - (Current * Completed)) / Remaining
  const totalCredits = completedCredits + remainingCredits;
  let requiredGpa = ((targetCgpa * totalCredits) - (currentCgpa * completedCredits)) / remainingCredits;
  requiredGpa = Math.max(0.0, Math.min(4.0, Number(requiredGpa.toFixed(2))));

  // Math metrics for difficulty and comparisons
  const gap = targetCgpa - currentCgpa;
  let difficultyMultiplier = 1.0;
  let percentageHigherThanHistory = 0;

  if (gap > 0.5) difficultyMultiplier = 1.5;
  else if (gap > 0.2) difficultyMultiplier = 1.25;

  if (requiredGpa > currentCgpa) {
    percentageHigherThanHistory = Math.round(((requiredGpa - currentCgpa) / (currentCgpa || 1.0)) * 100);
  }

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        You are Lumina AI. Perform a credit-hour calculation to project targets.
        Formulas:
        - Required GPA per remaining semester = ((Target CGPA * (Completed Credits + Remaining Credits)) - (Current CGPA * Completed Credits)) / Remaining Credits
        - Compare Required GPA against the student's historical average GPA to compute difficulty percentages.
        
        Input metrics:
        - Current CGPA: ${currentCgpa}
        - Target Goal: ${targetCgpa}
        - Completed Credits: ${completedCredits}
        - Remaining Credits: ${remainingCredits}
        - Calculated Required GPA: ${requiredGpa}
        - Selected Study Vigor: ${intensity}
        
        Output Format (Strict JSON):
        {
          "requiredGpa": ${requiredGpa},
          "difficultyMultiplier": ${difficultyMultiplier},
          "percentageHigherThanHistory": ${percentageHigherThanHistory},
          "strategicAdvice": "Your tailored credit hour advice here..."
        }
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}") + 1;
      if (jsonStart !== -1 && jsonEnd !== -1) {
        return JSON.parse(text.slice(jsonStart, jsonEnd));
      }
    } catch (error) {
      console.warn("Gemini Lumina failed, falling back to rule-based projections:", error.message);
    }
  }

  // ── RULE-BASED FALLBACK: Lumina Grade Projection ──
  let strategicAdvice = "";
  if (requiredGpa > 3.8) {
    strategicAdvice = `To achieve your ambitious target CGPA of ${targetCgpa}, you will need near-perfect marks in your upcoming semesters. Allocate a minimum of 24 weekly hours for independent self-study, focus aggressively on maximum sessional credit scores, and seek immediate support for subjects graded below B.`;
  } else if (requiredGpa > currentCgpa) {
    strategicAdvice = `Hitting your goal of ${targetCgpa} requires a consistent improvement over your current performance. We recommend shifting to a 'high' or 'aggressive' study vigor, aiming for A- grades across core requirements, and resolving assignments at least 48 hours prior to deadlines.`;
  } else {
    strategicAdvice = `Your target CGPA of ${targetCgpa} is well within reach and below your current standing! Standard steady consistency is key: review weekly concepts for 2 hours daily to secure a successful academic outcome.`;
  }

  return {
    requiredGpa,
    difficultyMultiplier,
    percentageHigherThanHistory,
    strategicAdvice
  };
};

// ── 4. TIMELINE OPTIMIZER & STUDY PREP BLOCKS (`POST /ai/schedule/study-blocks`)

export const getStudyBlocks = async (userId, dateStr) => {
  const profile = await fetchStudentAcademicProfile(userId);
  const date = dateStr ? new Date(dateStr) : new Date();

  // Load classes for this weekday
  const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
  const classesQuery = `
    SELECT 
      c.code AS course_code,
      c.title AS course_title,
      s.start_time,
      s.end_time,
      s.room
    FROM enrollments e
    JOIN course_offerings co ON co.id = e.offering_id
    JOIN courses c ON c.id = co.course_id
    JOIN schedules s ON s.offering_id = co.id
    WHERE e.student_id = $1 AND e.status = 'enrolled' AND s.day_of_week = $2
    ORDER BY s.start_time ASC
  `;
  const classesRes = await pool.query(classesQuery, [profile.student.id, dayOfWeek]);
  const lectures = classesRes.rows;

  // Fetch pending deadlines due soon
  const soonDeadlines = profile.assignments.filter(a => a.status === 'pending');

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        You are the uniMate Timeline Optimizer.
        Evaluate the student's lecture slots and pending assignments for the date ${date.toDateString()}.
        Find free hours between lecture start/end times and inject recommended study blocks.
        Only suggest study blocks if there are pending deadlines.
        
        Student Timetable: ${JSON.stringify(lectures, null, 2)}
        Pending Assignments: ${JSON.stringify(soonDeadlines, null, 2)}
        
        Output Format (Strict JSON):
        {
          "insertedPrepBlocks": [
            {
              "title": "📚 AI Prep: [Subject Name]",
              "startTime": "HH:MM",
              "endTime": "HH:MM",
              "targetTaskId": "task_id_here",
              "room": "Suggested quiet campus location"
            }
          ]
        }
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}") + 1;
      if (jsonStart !== -1 && jsonEnd !== -1) {
        return JSON.parse(text.slice(jsonStart, jsonEnd));
      }
    } catch (error) {
      console.warn("Gemini schedule failed, falling back to rule-based optimizer:", error.message);
    }
  }

  // ── RULE-BASED FALLBACK: Schedule Timeline Optimizer ──
  const insertedPrepBlocks = [];
  
  if (soonDeadlines.length > 0) {
    const task = soonDeadlines[0];
    const subjectName = task.subject ? task.subject.split(" (")[0] : "Core Topics";
    
    if (lectures.length === 0) {
      // Free day - suggest morning block
      insertedPrepBlocks.push({
        title: `📚 AI Prep: ${subjectName}`,
        startTime: "10:00",
        endTime: "12:00",
        targetTaskId: task.id,
        room: "Library Quiet Room"
      });
    } else if (lectures.length === 1) {
      // 1 lecture - suggest 1.5h after lecture ends
      const endHour = parseInt(lectures[0].end_time.split(":")[0], 10);
      const startPrep = `${endHour + 1}:00`;
      const endPrep = `${endHour + 2}:30`;
      insertedPrepBlocks.push({
        title: `📚 AI Prep: ${subjectName}`,
        startTime: startPrep,
        endTime: endPrep,
        targetTaskId: task.id,
        room: "Campus Café study corner"
      });
    } else {
      // Multiple lectures - find gap between lecture 1 and lecture 2
      const endHourL1 = parseInt(lectures[0].end_time.split(":")[0], 10);
      const startHourL2 = parseInt(lectures[1].start_time.split(":")[0], 10);
      
      if (startHourL2 - endHourL1 > 1) {
        const startPrep = `${endHourL1}:30`;
        const endPrep = `${startHourL2 - 1}:30`;
        insertedPrepBlocks.push({
          title: `📚 AI Prep: ${subjectName}`,
          startTime: startPrep,
          endTime: endPrep,
          targetTaskId: task.id,
          room: "Lab-3 Quiet Zone"
        });
      } else {
        // No large gap, insert evening block
        insertedPrepBlocks.push({
          title: `📚 AI Prep: ${subjectName}`,
          startTime: "16:00",
          endTime: "17:30",
          targetTaskId: task.id,
          room: "Main Library Room-4"
        });
      }
    }
  }

  return { insertedPrepBlocks };
};

// ── 5. AI PRIORITY ENGINE (`POST /ai/tasks/prioritize`) ───────────────────────

export const prioritizeTasks = async (userId) => {
  const profile = await fetchStudentAcademicProfile(userId);
  const pendingTasks = profile.assignments.filter(a => a.status === 'pending' || a.status === 'overdue');

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        You are the uniMate Priority Engine.
        Evaluate the student's task list.
        Rank them using a score from 0 to 100 based on sessional weight, complexity, and proximity of the deadline.
        
        Input Tasks:
        ${JSON.stringify(pendingTasks, null, 2)}
        
        Output Format (Strict JSON):
        [
          {
            "taskId": "task_id",
            "priorityScore": 95, // 0-100 score
            "reason": "Calculated reason (e.g., Worth 15% of grade and due in 24 hours)"
          }
        ]
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const jsonStart = text.indexOf("[");
      const jsonEnd = text.lastIndexOf("]") + 1;
      if (jsonStart !== -1 && jsonEnd !== -1) {
        return JSON.parse(text.slice(jsonStart, jsonEnd));
      }
    } catch (error) {
      console.warn("Gemini prioritizer failed, falling back to rule-based prioritization:", error.message);
    }
  }

  // ── RULE-BASED FALLBACK: Priority Engine ──
  const now = new Date();
  const prioritized = pendingTasks.map(task => {
    // Proximity component (max 60 points)
    const hoursRemaining = Math.max(0, (new Date(task.due) - now) / (1000 * 60 * 60));
    let proximityScore = 60;
    if (hoursRemaining > 120) proximityScore = 15;
    else if (hoursRemaining > 72) proximityScore = 30;
    else if (hoursRemaining > 24) proximityScore = 45;

    // Weight/Complexity component (max 40 points)
    let weightScore = 20;
    if (task.priority === "Critical" || task.difficulty === "High") {
      weightScore = 40;
    } else if (task.priority === "Moderate") {
      weightScore = 30;
    }

    const priorityScore = Math.min(100, proximityScore + weightScore);
    
    let reason = `Estimated priority is ${priorityScore}/100. `;
    if (proximityScore >= 45) {
      reason += "Urgent: deadline is approaching inside 48 hours. ";
    }
    if (weightScore >= 30) {
      reason += "Carries significant academic weight for sessional criteria.";
    } else {
      reason += "Standard homework segment to secure your progress percentage.";
    }

    return {
      taskId: task.id,
      priorityScore,
      reason
    };
  });

  return prioritized.sort((a, b) => b.priorityScore - a.priorityScore);
};

// ── 6. ANNOUNCEMENTS SUMMARIZER (`GET /ai/announcements/summary`) ───────────────

export const getAnnouncementsSummary = async (userId) => {
  const profile = await fetchStudentAcademicProfile(userId);

  // Fetch recent announcements posted in past 48 hours targeted to student's department
  const announcementsQuery = `
    SELECT title, content, type, created_at
    FROM announcements
    WHERE (department_id = $1 OR department_id IS NULL)
      AND created_at >= NOW() - INTERVAL '48 hours'
    ORDER BY created_at DESC
  `;
  const announcementsRes = await pool.query(announcementsQuery, [profile.student.department_id]);
  const notices = announcementsRes.rows;

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        You are uniMate Summarizer.
        Review the following active announcements.
        Extract the single most critical task or deadline.
        Write a single, action-oriented sentence telling the student what to prioritize today.
        
        Announcements Feed:
        ${JSON.stringify(notices, null, 2)}
        
        Output Format (Strict JSON):
        {
          "summary": "Focus on the [Critical Notice Title] published [Time]. Your [Action] is required."
        }
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}") + 1;
      if (jsonStart !== -1 && jsonEnd !== -1) {
        return JSON.parse(text.slice(jsonStart, jsonEnd));
      }
    } catch (error) {
      console.warn("Gemini summarizer failed, falling back to rule-based notice compiler:", error.message);
    }
  }

  // ── RULE-BASED FALLBACK: Announcements Summary ──
  let summary = "There are no urgent department broadcasts or new schedule announcements published within the last 48 hours.";
  if (notices.length > 0) {
    const critical = notices.find(n => n.type === 'academic' || n.type === 'urgent') || notices[0];
    const timeText = new Date(critical.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    summary = `Focus on the '${critical.title}' notice published at ${timeText}. Your immediate review of this notification content is required.`;
  }

  return { summary };
};

export const getGpaGoal = async (userId, options = {}) => {
  const profile = await fetchStudentAcademicProfile(userId);
  const targetCgpa = Number(options.targetCgpa) || Number(profile.student.target_cgpa) || 3.0;
  const studyIntensity = options.studyIntensity || profile.student.study_intensity || "balanced";
  const projection = await getGradeProjection(userId, targetCgpa, studyIntensity);

  const prioritizedCourses = [...profile.courses]
    .sort((a, b) => {
      const creditGap = Number(b.credit_hours) - Number(a.credit_hours);
      if (creditGap !== 0) return creditGap;
      return Number(a.grade_point) - Number(b.grade_point);
    })
    .slice(0, 5)
    .map((course) => ({
      offeringId: course.offering_id,
      courseCode: course.course_code,
      courseTitle: course.course,
      creditHours: course.credit_hours,
      currentGradePoint: course.grade_point,
    }));

  return {
    targetCgpa,
    requiredGpa: projection.requiredGpa,
    difficultyMultiplier: projection.difficultyMultiplier,
    prioritizedCourses,
    notes: projection.strategicAdvice,
    upcomingAssessments: options.upcomingAssessments || [],
  };
};

export const getAttendanceGuardian = async (userId) => {
  const profile = await fetchStudentAcademicProfile(userId);

  const safelySkippable = {};
  const warnings = [];
  const courseSummaries = profile.attendanceCourses.map((course) => {
    const adjustedTotal = Math.max(0, course.total - (course.leave || 0));
    const currentPercentage = Number(course.attendance_percentage) || 0;
    let skippable = 0;

    if (adjustedTotal > 0 && currentPercentage >= 75) {
      skippable = Math.max(0, Math.floor((course.present / 0.75) - adjustedTotal));
    }

    safelySkippable[course.course_code] = skippable;

    if (currentPercentage < 75) {
      warnings.push(`${course.course_code} is below 75% attendance and needs immediate recovery.`);
    } else if (currentPercentage < 80) {
      warnings.push(`${course.course_code} is close to the attendance threshold with limited skip margin.`);
    }

    return {
      courseCode: course.course_code,
      courseTitle: course.course_title,
      attendancePercentage: currentPercentage,
      safelySkippable: skippable,
      present: course.present,
      totalClasses: course.total,
    };
  });

  return {
    safelySkippable,
    warnings,
    courses: courseSummaries,
  };
};

export const getSmartSchedule = async (userId, dateStr) => {
  const profile = await fetchStudentAcademicProfile(userId);
  const dayFilter = dateStr ? new Date(dateStr) : null;
  const dayOfWeek = dayFilter
    ? new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(dayFilter)
    : null;

  const query = `
    SELECT
      c.code AS course_code,
      c.title AS course_title,
      s.day_of_week,
      s.start_time,
      s.end_time,
      s.room
    FROM enrollments e
    JOIN course_offerings co ON co.id = e.offering_id
    JOIN courses c ON c.id = co.course_id
    JOIN schedules s ON s.offering_id = co.id
    WHERE e.student_id = $1 AND e.status = 'enrolled'
      ${dayOfWeek ? "AND s.day_of_week = $2" : ""}
    ORDER BY s.day_of_week ASC, s.start_time ASC
  `;
  const params = dayOfWeek ? [profile.student.id, dayOfWeek] : [profile.student.id];
  const result = await pool.query(query, params);

  const grouped = result.rows.reduce((acc, row) => {
    if (!acc[row.day_of_week]) {
      acc[row.day_of_week] = [];
    }
    acc[row.day_of_week].push(row);
    return acc;
  }, {});

  const congestedDays = [];
  const breakSuggestions = [];

  Object.entries(grouped).forEach(([day, classes]) => {
    const congestedCourses = [];

    for (let index = 0; index < classes.length - 1; index += 1) {
      const current = classes[index];
      const next = classes[index + 1];
      const currentEnd = new Date(`1970-01-01T${current.end_time}`);
      const nextStart = new Date(`1970-01-01T${next.start_time}`);
      const gapMinutes = (nextStart - currentEnd) / (1000 * 60);

      if (gapMinutes < 15) {
        congestedCourses.push(`${current.course_code} -> ${next.course_code}`);
      } else if (gapMinutes >= 45) {
        breakSuggestions.push({
          day,
          windowStart: current.end_time,
          windowEnd: next.start_time,
          suggestion: `Use the ${gapMinutes}-minute gap for revision or assignment prep.`,
        });
      }
    }

    if (congestedCourses.length > 0) {
      congestedDays.push({
        day,
        backToBackChains: congestedCourses,
      });
    }
  });

  return {
    congestedDays,
    breakSuggestions,
  };
};

export const getSkillTrends = async (userId) => {
  const profile = await fetchStudentAcademicProfile(userId);
  const postsQuery = `
    SELECT title, content
    FROM community_posts
    WHERE department_id = $1 AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 200
  `;
  const postsResult = await pool.query(postsQuery, [profile.student.department_id]);
  const posts = postsResult.rows;
  const combinedText = posts.map((post) => `${post.title} ${post.content}`).join(" ");

  if (genAI && combinedText.trim()) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        Perform NLP analysis on these department community posts and return strict JSON.
        Posts: ${combinedText}

        Output:
        {
          "trends": [
            { "skill": "AWS", "mentionCount": 4 }
          ],
          "recommendations": ["Take cloud-focused electives"]
        }
      `;
      const result = await model.generateContent(prompt);
      const parsed = safeJsonParse(result.response.text().trim());
      if (parsed) {
        return parsed;
      }
    } catch (error) {
      console.warn("Gemini skill trends failed, falling back to rule-based trend extraction:", error.message);
    }
  }

  const trackedSkills = [
    "aws",
    "azure",
    "gcp",
    "react",
    "next.js",
    "node",
    "python",
    "flutter",
    "docker",
    "kubernetes",
    "sql",
    "figma",
    "ui/ux",
    "machine learning",
    "ai",
    "data science",
    "cybersecurity",
  ];

  const normalizedText = combinedText.toLowerCase();
  const trends = trackedSkills
    .map((skill) => {
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matches = normalizedText.match(new RegExp(`\\b${escaped}\\b`, "g"));
      return {
        skill: skill.toUpperCase() === "AWS" ? "AWS" : skill,
        mentionCount: matches ? matches.length : 0,
      };
    })
    .filter((item) => item.mentionCount > 0)
    .sort((a, b) => b.mentionCount - a.mentionCount)
    .slice(0, 5);

  const recommendations = trends.length
    ? trends.slice(0, 3).map((trend) => `Explore practical work related to ${trend.skill}.`)
    : ["Community trend data is still limited; encourage more peer discussion posts."];

  return { trends, recommendations };
};
