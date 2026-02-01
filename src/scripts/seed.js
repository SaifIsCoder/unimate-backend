require('dotenv').config();
const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Department = require('../models/Department');
const Program = require('../models/Program');
const AcademicCycle = require('../models/AcademicCycle');
const Class = require('../models/Class');
const { hashPassword } = require('../utils/password');

/**
 * Seed Script
 * 
 * WHY: Creates initial data for testing and development.
 * Seeds 1 university (tenant) with 1 admin user.
 * This is the minimum viable data to start using the system.
 */

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://devnitysaif_db_user:LJTPC2TmO15sqmE9@cluster.28r3yi6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster';


async function seed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - comment out in production)
    console.log('🗑️  Clearing existing data...');
    await Tenant.deleteMany({});
    await User.deleteMany({});
    await Department.deleteMany({});
    await Program.deleteMany({});
    await AcademicCycle.deleteMany({});
    await Class.deleteMany({});

    // --- University 1 & 2 ---
    const universities = [
      {
        name: 'Sample University',
        code: 'SU',
        country: 'United States',
        timezone: 'America/New_York',
        adminEmail: 'admin@sampleuniversity.edu',
        adminName: 'System Administrator',
        department: {
          name: 'Computer Science',
          code: 'CS',
          description: 'Department of Computer Science'
        },
        program: {
          name: 'Bachelor of Science in Computer Science',
          description: '4-year undergraduate program in Computer Science',
          durationYears: 4,
          cycleType: 'semester',
          totalCycles: 8,
          creditSystem: 'credits'
        },
        cycles: ['Fall 2024', 'Spring 2025', 'Fall 2025', 'Spring 2026'],
        classSession: '2024-2025'
      },
      {
        name: 'Global Tech University',
        code: 'GTU',
        country: 'Canada',
        timezone: 'America/Toronto',
        adminEmail: 'admin@globaltech.edu',
        adminName: 'Global Admin',
        department: {
          name: 'Electrical Engineering',
          code: 'EE',
          description: 'Department of Electrical Engineering'
        },
        program: {
          name: 'Bachelor of Engineering in Electrical',
          description: '4-year undergraduate program in Electrical Engineering',
          durationYears: 4,
          cycleType: 'semester',
          totalCycles: 8,
          creditSystem: 'credits'
        },
        cycles: ['Winter 2024', 'Summer 2024', 'Winter 2025', 'Summer 2025'],
        classSession: '2024-2025'
      }
    ];


    for (const uni of universities) {
      // Create Tenant (University)
      console.log(`🏫 Creating tenant: ${uni.name}`);
      const tenant = await Tenant.create({
        name: uni.name,
        code: uni.code,
        country: uni.country,
        timezone: uni.timezone,
        status: 'active',
        settings: {
          gradingSystem: 'percentage',
          cycleNaming: 'semester',
          attendancePolicy: {
            minimumPercentage: 75
          }
        }
      });
      console.log(`✅ Created tenant: ${tenant.name} (${tenant.code})`);

      // Create Admin User
      console.log('👤 Creating admin user...');
      const adminPassword = await hashPassword('admin123');
      const admin = await User.create({
        tenantId: tenant._id,
        email: uni.adminEmail.toLowerCase(),
        passwordHash: adminPassword,
        role: 'admin',
        status: 'active',
        profile: {
          fullName: uni.adminName,
          phone: '+1234567890'
        }
      });
      console.log(`✅ Created admin user: ${admin.email}`);

      // Create Students
      console.log('👨‍🎓 Creating students...');
      const studentPassword = await hashPassword('student123');
      for (let i = 1; i <= 3; i++) {
        await User.create({
          tenantId: tenant._id,
          email: `student${i}@${tenant.code.toLowerCase()}.edu`,
          passwordHash: studentPassword,
          role: 'student',
          status: 'active',
          profile: {
            fullName: `Student ${i} ${tenant.code}`,
            phone: `+1000000000${i}`
          }
        });
      }
      console.log('✅ Created 3 students');

      // Create Teacher
      console.log('👩‍🏫 Creating teacher...');
      const teacherPassword = await hashPassword('teacher123');
      await User.create({
        tenantId: tenant._id,
        email: `teacher@${tenant.code.toLowerCase()}.edu`,
        passwordHash: teacherPassword,
        role: 'teacher',
        status: 'active',
        profile: {
          fullName: `Teacher ${tenant.code}`,
          phone: '+19999999999'
        }
      });
      console.log('✅ Created teacher');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

// Run seed
seed();
