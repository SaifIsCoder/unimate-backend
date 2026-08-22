import prisma from './src/config/prisma.js';
import bcrypt from 'bcryptjs';

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const sysDept = await prisma.department.upsert({
    where: { code: 'SYS' },
    update: {},
    create: {
      code: 'SYS',
      name: 'System Administration'
    }
  });

  const user = await prisma.user.upsert({
    where: { email: 'superadmin@unimate.com' },
    update: { 
      passwordHash: hashedPassword, 
      role: 'super_admin' 
    },
    create: {
      email: 'superadmin@unimate.com',
      passwordHash: hashedPassword,
      role: 'super_admin',
      isActive: true,
      admin: {
        create: {
          adminId: 'SUPER-001',
          departmentId: sysDept.id
        }
      }
    },
  });

  if (user.role === 'super_admin') {
    await prisma.admin.updateMany({
      where: { userId: user.id },
      data: { departmentId: sysDept.id }
    });
  }

  const student = await prisma.user.upsert({
    where: { email: 'student@university.edu' },
    update: { 
      passwordHash: hashedPassword, 
      role: 'student' 
    },
    create: {
      email: 'student@university.edu',
      passwordHash: hashedPassword,
      role: 'student',
      isActive: true,
      student: {
        create: {
          rollNumber: 'R-001',
          department: { connect: { id: sysDept.id } },
          batch: 2024
        }
      }
    },
  });

  if (student.role === 'student') {
    await prisma.student.updateMany({
      where: { userId: student.id },
      data: { departmentId: sysDept.id }
    });
  }

  console.log('Created super admin:', user.email);
  console.log('Created student:', student.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
