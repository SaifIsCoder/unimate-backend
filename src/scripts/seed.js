require('dotenv').config();
const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Department = require('../models/Department');
const Program = require('../models/Program');
const AcademicCycle = require('../models/AcademicCycle');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Enrollment = require('../models/Enrollment');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Attendance = require('../models/Attendance');
const Grade = require('../models/Grade');
const Fee = require('../models/Fee');
const Fine = require('../models/Fine');
const Event = require('../models/Event');
const Announcement = require('../models/Announcement');
const { hashPassword } = require('../utils/password');

/**
 * Complete Seed Script
 * 
 * Creates 2 universities with full entity hierarchy:
 * - Tenants (Universities)
 * - Departments
 * - Programs
 * - Academic Cycles
 * - Classes
 * - Subjects
 * - Users (Admin, Teachers, Students)
 * - Enrollments
 * - Assignments & Submissions
 * - Attendance Records
 * - Grades
 * - Fees & Fines
 * - Events & Announcements
 */

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://devnitysaif_db_user:LJTPC2TmO15sqmE9@cluster.28r3yi6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster';

async function clearDatabase() {
  console.log('🗑️  Clearing existing data...');
  await Promise.all([
    Tenant.deleteMany({}),
    User.deleteMany({}),
    Department.deleteMany({}),
    Program.deleteMany({}),
    AcademicCycle.deleteMany({}),
    Class.deleteMany({}),
    Subject.deleteMany({}),
    Enrollment.deleteMany({}),
    Assignment.deleteMany({}),
    Submission.deleteMany({}),
    Attendance.deleteMany({}),
    Grade.deleteMany({}),
    Fee.deleteMany({}),
    Fine.deleteMany({}),
    Event.deleteMany({}),
    Announcement.deleteMany({})
  ]);
  console.log('✅ Database cleared');
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    await clearDatabase();

    // ========== UNIVERSITY DATA DEFINITIONS ==========
    const universities = [
      {
        name: 'Metropolitan Institute of Technology',
        code: 'MIT',
        country: 'United States',
        timezone: 'America/New_York',
        departments: [
          {
            name: 'Computer Science',
            code: 'CS',
            description: 'Department of Computer Science and Software Engineering',
            programs: [
              { name: 'BS Computer Science', description: '4-year undergraduate CS program', durationYears: 4, cycleType: 'semester', totalCycles: 8 },
              { name: 'MS Computer Science', description: '2-year graduate CS program', durationYears: 2, cycleType: 'semester', totalCycles: 4 }
            ],
            subjects: [
              { name: 'Introduction to Programming', code: 'CS101', creditHours: 3, type: 'theory' },
              { name: 'Data Structures', code: 'CS201', creditHours: 4, type: 'hybrid' },
              { name: 'Database Systems', code: 'CS301', creditHours: 3, type: 'lab' },
              { name: 'Web Development', code: 'CS321', creditHours: 3, type: 'lab' },
              { name: 'Machine Learning', code: 'CS401', creditHours: 4, type: 'theory' }
            ]
          },
          {
            name: 'Business Administration',
            code: 'BA',
            description: 'School of Business and Management',
            programs: [
              { name: 'BBA Business Administration', description: '4-year undergraduate business program', durationYears: 4, cycleType: 'semester', totalCycles: 8 }
            ],
            subjects: [
              { name: 'Principles of Management', code: 'BA101', creditHours: 3, type: 'theory' },
              { name: 'Financial Accounting', code: 'BA201', creditHours: 3, type: 'theory' },
              { name: 'Marketing Management', code: 'BA301', creditHours: 3, type: 'theory' }
            ]
          }
        ],
        teachers: ['Dr. James Wilson', 'Prof. Sarah Chen', 'Dr. Michael Brown'],
        students: ['Alice Johnson', 'Bob Smith', 'Charlie Davis', 'Diana Miller', 'Edward Lee', 'Fiona Garcia', 'George Martinez', 'Hannah Taylor']
      },
      {
        name: 'Global Tech University',
        code: 'GTU',
        country: 'Canada',
        timezone: 'America/Toronto',
        departments: [
          {
            name: 'Electrical Engineering',
            code: 'EE',
            description: 'Department of Electrical and Electronics Engineering',
            programs: [
              { name: 'BE Electrical Engineering', description: '4-year electrical engineering program', durationYears: 4, cycleType: 'semester', totalCycles: 8 }
            ],
            subjects: [
              { name: 'Circuit Analysis', code: 'EE101', creditHours: 4, type: 'hybrid' },
              { name: 'Digital Electronics', code: 'EE201', creditHours: 3, type: 'lab' },
              { name: 'Power Systems', code: 'EE301', creditHours: 4, type: 'theory' },
              { name: 'Control Systems', code: 'EE401', creditHours: 3, type: 'theory' }
            ]
          },
          {
            name: 'Mechanical Engineering',
            code: 'ME',
            description: 'Department of Mechanical Engineering',
            programs: [
              { name: 'BE Mechanical Engineering', description: '4-year mechanical engineering program', durationYears: 4, cycleType: 'semester', totalCycles: 8 }
            ],
            subjects: [
              { name: 'Engineering Mechanics', code: 'ME101', creditHours: 4, type: 'theory' },
              { name: 'Thermodynamics', code: 'ME201', creditHours: 3, type: 'theory' },
              { name: 'Fluid Mechanics', code: 'ME301', creditHours: 4, type: 'hybrid' }
            ]
          }
        ],
        teachers: ['Dr. Emily Watson', 'Prof. Robert Kim', 'Dr. Jennifer Liu'],
        students: ['Kevin Anderson', 'Laura White', 'Mark Thompson', 'Nancy Robinson', 'Oscar Clark', 'Patricia Hall']
      }
    ];

    const academicCycles = [
      { name: 'Fall 2024', startDate: '2024-09-01', endDate: '2024-12-20', current: false },
      { name: 'Spring 2025', startDate: '2025-01-15', endDate: '2025-05-15', current: true },
      { name: 'Summer 2025', startDate: '2025-06-01', endDate: '2025-08-15', current: false },
      { name: 'Fall 2025', startDate: '2025-09-01', endDate: '2025-12-20', current: false }
    ];

    const passwordHash = await hashPassword('password123');

    // ========== CREATE DATA ==========
    for (const uniData of universities) {
      console.log(`\n🏫 Creating University: ${uniData.name}`);

      // 1. Create Tenant
      const tenant = await Tenant.create({
        name: uniData.name,
        code: uniData.code,
        country: uniData.country,
        timezone: uniData.timezone,
        status: 'active',
        settings: {
          gradingSystem: 'percentage',
          cycleNaming: 'semester',
          attendancePolicy: { minimumPercentage: 75 }
        }
      });
      console.log(`   ✅ Tenant created: ${tenant.code}`);

      // 2. Create Admin User
      const admin = await User.create({
        tenantId: tenant._id,
        email: `admin@${uniData.code.toLowerCase()}.edu`,
        passwordHash,
        role: 'admin',
        status: 'active',
        profile: { fullName: `Admin ${uniData.code}`, phone: '+1234567890' }
      });
      console.log(`   ✅ Admin: admin@${uniData.code.toLowerCase()}.edu`);

      // 3. Create Teachers
      const teachers = [];
      for (const teacherName of uniData.teachers) {
        const emailName = teacherName.toLowerCase().replace(/[^a-z]/g, '');
        const teacher = await User.create({
          tenantId: tenant._id,
          email: `${emailName}@${uniData.code.toLowerCase()}.edu`,
          passwordHash,
          role: 'teacher',
          status: 'active',
          profile: { fullName: teacherName, phone: '+1987654321' }
        });
        teachers.push(teacher);
      }
      console.log(`   ✅ Teachers: ${teachers.length} created`);

      // 4. Create Students
      const students = [];
      for (const studentName of uniData.students) {
        const emailName = studentName.toLowerCase().replace(/[^a-z]/g, '');
        const student = await User.create({
          tenantId: tenant._id,
          email: `${emailName}@${uniData.code.toLowerCase()}.edu`,
          passwordHash,
          role: 'student',
          status: 'active',
          profile: { fullName: studentName, phone: '+1555555555' }
        });
        students.push(student);
      }
      console.log(`   ✅ Students: ${students.length} created`);

      // 5. Create Departments & Programs
      console.log(`\n   --- Creating Departments & Programs ---`);

      const programs = [];
      const allClasses = [];
      const allSubjects = [];
      let classCount = 0;
      let subjectCount = 0;
      let cycleCount = 0;

      for (const deptData of uniData.departments) {
        const department = await Department.create({
          tenantId: tenant._id,
          name: deptData.name,
          code: deptData.code,
          description: deptData.description,
          status: 'active'
        });

        for (const progData of deptData.programs) {
          const program = await Program.create({
            tenantId: tenant._id,
            departmentId: department._id,
            name: progData.name,
            description: progData.description,
            durationYears: progData.durationYears,
            cycleType: progData.cycleType,
            totalCycles: progData.totalCycles,
            creditSystem: 'credits',
            status: 'active'
          });
          programs.push(program);

          // 6. Create Academic Cycles FOR THIS PROGRAM
          // We'll create cycles for the current year +/- 1 year
          const programCycles = [];
          for (let i = 0; i < academicCycles.length; i++) {
            const cycleData = academicCycles[i];
            const cycle = await AcademicCycle.create({
              tenantId: tenant._id,
              programId: program._id,
              name: cycleData.name,
              sequenceNumber: i + 1, // Simple sequencing based on date
              startDate: new Date(cycleData.startDate),
              endDate: new Date(cycleData.endDate),
              status: cycleData.current ? 'active' : (new Date(cycleData.endDate) < new Date() ? 'completed' : 'upcoming')
            });
            programCycles.push(cycle);
            cycleCount++;
          }

          // Identify the current cycle for this program
          const currentCycle = programCycles.find(c => c.status === 'active') || programCycles[0];

          // 7. Create Subjects for this Program
          const programSubjects = [];
          for (const subjData of deptData.subjects) {
            const subject = await Subject.create({
              tenantId: tenant._id,
              programId: program._id,
              academicCycleId: currentCycle._id,
              name: subjData.name,
              code: subjData.code,
              creditHours: subjData.creditHours,
              type: subjData.type
            });
            programSubjects.push(subject);
            allSubjects.push(subject);
            subjectCount++;
          }

          // 8. Create Classes for this Program (for the current cycle)
          // Create classes for Year 1, Year 2, etc. running in this cycle
          for (let year = 1; year <= Math.min(progData.durationYears, 2); year++) {
            const classDoc = await Class.create({
              tenantId: tenant._id,
              programId: program._id,
              academicCycleId: currentCycle._id,
              name: `${program.name} - Year ${year} (${currentCycle.name})`,
              session: '2024-2025',
              section: String.fromCharCode(64 + year),
              capacity: 40,
              status: 'active'
            });
            // Attach temporary property for enrollments later
            classDoc._subjects = programSubjects;
            allClasses.push(classDoc);
            classCount++;
          }
        }
      }
      console.log(`   ✅ Departments: ${uniData.departments.length}, Programs: ${programs.length}`);
      console.log(`   ✅ Academic Cycles: ${cycleCount} created across all programs`);
      console.log(`   ✅ Subjects: ${subjectCount}, Classes: ${classCount}`);

      // 9. Create Enrollments
      let enrollmentCount = 0;
      for (let i = 0; i < students.length; i++) {
        const classIndex = i % allClasses.length;
        await Enrollment.create({
          tenantId: tenant._id,
          userId: students[i]._id,
          classId: allClasses[classIndex]._id,
          academicCycleId: allClasses[classIndex].academicCycleId,
          roleInClass: 'student',
          enrolledAt: new Date(),
          status: 'active'
        });
        enrollmentCount++;
      }

      // Additional: Enroll teachers in classes
      for (let i = 0; i < allClasses.length; i++) {
        const teacher = teachers[i % teachers.length];
        await Enrollment.create({
          tenantId: tenant._id,
          userId: teacher._id,
          classId: allClasses[i]._id,
          academicCycleId: allClasses[i].academicCycleId,
          roleInClass: 'teacher',
          enrolledAt: new Date(),
          status: 'active'
        });
        enrollmentCount++;
      }
      console.log(`   ✅ Enrollments: ${enrollmentCount} (Students + Teachers)`);

      // 10. Create Assignments
      const assignments = [];
      for (let i = 0; i < Math.min(3, allClasses.length); i++) {
        const classDoc = allClasses[i];
        // Use subjects belonging to this class's program
        const subjects = classDoc._subjects || allSubjects; // Fallback just in case
        const subject = subjects[0]; // Pick first subject
        const teacher = teachers[i % teachers.length];

        if (subject) {
          for (let j = 1; j <= 2; j++) {
            const assignment = await Assignment.create({
              tenantId: tenant._id,
              classId: classDoc._id,
              subjectId: subject._id,
              createdBy: teacher._id,
              title: `Assignment ${j}: ${subject.name}`,
              description: `Complete the exercises for ${subject.name}. Submit before the due date.`,
              dueDate: new Date(Date.now() + (7 + j * 7) * 24 * 60 * 60 * 1000),
              maxMarks: 100
            });
            assignments.push(assignment);
          }
        }
      }
      console.log(`   ✅ Assignments: ${assignments.length}`);

      // 9. Create Submissions (some students submitted)
      let submissionCount = 0;
      for (let i = 0; i < Math.min(4, students.length); i++) {
        const student = students[i];
        const assignment = assignments[i % assignments.length];
        await Submission.create({
          tenantId: tenant._id,
          assignmentId: assignment._id,
          studentId: student._id,
          content: 'This is my submission for the assignment.',
          submittedAt: new Date(),
          status: i < 2 ? 'graded' : 'submitted',
          marks: i < 2 ? 75 + Math.floor(Math.random() * 25) : undefined,
          feedback: i < 2 ? 'Good work!' : undefined,
          gradedBy: i < 2 ? teachers[0]._id : undefined,
          gradedAt: i < 2 ? new Date() : undefined
        });
        submissionCount++;
      }
      console.log(`   ✅ Submissions: ${submissionCount}`);

      // 10. Create Attendance Records
      let attendanceCount = 0;
      for (const classDoc of allClasses.slice(0, 2)) {
        // Only get student enrollments for attendance
        const enrolledStudents = await Enrollment.find({
          tenantId: tenant._id,
          classId: classDoc._id,
          roleInClass: 'student'
        });

        for (let day = 0; day < 5; day++) {
          const date = new Date();
          date.setDate(date.getDate() - day);
          await Attendance.create({
            tenantId: tenant._id,
            classId: classDoc._id,
            date,
            records: enrolledStudents.map(e => ({
              studentId: e.userId,
              status: Math.random() > 0.2 ? 'present' : (Math.random() > 0.5 ? 'absent' : 'late')
            })),
            // Use the first teacher created for this tenant as the specific marker
            markedBy: teachers[0]?._id
          });
          attendanceCount++;
        }
      }
      console.log(`   ✅ Attendance Records: ${attendanceCount}`);

      // 13. Create Grades
      let gradeCount = 0;
      for (let i = 0; i < Math.min(4, students.length); i++) {
        const student = students[i];
        const classDoc = allClasses[i % allClasses.length];
        const subjects = classDoc._subjects || allSubjects;
        const subject = subjects[0];

        if (subject) {
          await Grade.create({
            tenantId: tenant._id,
            classId: classDoc._id,
            studentId: student._id,
            subjectId: subject._id,
            component: 'Midterm',
            value: 70 + Math.floor(Math.random() * 30),
            maxValue: 100,
            weight: 30,
            gradedBy: teachers[0]._id,
            gradedAt: new Date()
          });
          gradeCount++;
        }
      }
      console.log(`   ✅ Grades: ${gradeCount}`);

      // 14. Create Fees
      let feeCount = 0;
      for (const student of students) {
        const classDoc = allClasses[0];
        await Fee.create({
          tenantId: tenant._id,
          studentId: student._id,
          classId: classDoc._id,
          type: 'tuition',
          amount: 5000 + Math.floor(Math.random() * 2000),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: Math.random() > 0.5 ? 'paid' : 'pending'
        });
        feeCount++;
      }
      console.log(`   ✅ Fees: ${feeCount}`);

      // 13. Create Fines (for some students)
      let fineCount = 0;
      for (let i = 0; i < 2; i++) {
        await Fine.create({
          tenantId: tenant._id,
          studentId: students[i]._id,
          reason: i === 0 ? 'Late library book return' : 'Damage to lab equipment',
          amount: 25 + Math.floor(Math.random() * 50),
          status: 'pending',
          type: i === 0 ? 'library' : 'manual',
          issuedBy: admin._id
        });
        fineCount++;
      }
      console.log(`   ✅ Fines: ${fineCount}`);

      // 14. Create Events
      const events = [
        { title: 'Annual Tech Fest', description: 'Join us for the annual technology festival!', days: 30 },
        { title: 'Career Fair', description: 'Meet top employers and explore opportunities.', days: 45 },
        { title: 'Guest Lecture: AI in Education', description: 'A special lecture on AI applications.', days: 14 }
      ];
      for (const eventData of events) {
        await Event.create({
          tenantId: tenant._id,
          title: eventData.title,
          description: eventData.description,
          scope: 'university',
          scopeId: tenant._id,
          startDate: new Date(Date.now() + eventData.days * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + (eventData.days + 1) * 24 * 60 * 60 * 1000),
          createdBy: admin._id
        });
      }
      console.log(`   ✅ Events: ${events.length}`);

      // 15. Create Announcements
      const announcements = [
        { title: 'Welcome to Spring 2025!', message: 'Welcome back students! Classes begin on January 15th.' },
        { title: 'Library Hours Extended', message: 'The library will now remain open until 10 PM during exam week.' },
        { title: 'Registration Reminder', message: 'Course registration for Summer 2025 opens next week.' }
      ];
      for (const annData of announcements) {
        await Announcement.create({
          tenantId: tenant._id,
          title: annData.title,
          message: annData.message,
          scope: 'university',
          scopeId: tenant._id,
          createdBy: admin._id
        });
      }
      console.log(`   ✅ Announcements: ${announcements.length}`);
    }

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   All users password: password123');
    console.log('   Admin emails: admin@mit.edu, admin@gtu.edu');
    console.log('   Teachers: drjameswilson@mit.edu, dremilywatson@gtu.edu, etc.');
    console.log('   Students: alicejohnson@mit.edu, kevinanderson@gtu.edu, etc.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
