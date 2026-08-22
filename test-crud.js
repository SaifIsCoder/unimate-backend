import prisma from './src/config/prisma.js';

async function main() {
  console.log('--- Starting CRUD Verification ---');
  
  // CREATE
  console.log('1. Testing CREATE...');
  const newDept = await prisma.department.create({
    data: {
      name: 'QA Test Department',
      code: 'QA101',
      description: 'Created during QA Audit',
    },
  });
  console.log(`Created Department: ID=${newDept.id}, Name=${newDept.name}`);

  // READ
  console.log('2. Testing READ...');
  const readDept = await prisma.department.findUnique({
    where: { id: newDept.id },
  });
  console.log(`Read Department: Name=${readDept.name}, Code=${readDept.code}`);

  // UPDATE
  console.log('3. Testing UPDATE...');
  const updatedDept = await prisma.department.update({
    where: { id: newDept.id },
    data: { description: 'Updated during QA Audit' },
  });
  console.log(`Updated Department: Description=${updatedDept.description}`);

  // DELETE
  console.log('4. Testing DELETE...');
  const deletedDept = await prisma.department.delete({
    where: { id: newDept.id },
  });
  console.log(`Deleted Department: ID=${deletedDept.id}`);
  
  // VERIFY DELETE
  const checkDeleted = await prisma.department.findUnique({
    where: { id: newDept.id },
  });
  if (!checkDeleted) {
    console.log('Verification: Department successfully deleted from DB.');
  } else {
    console.log('Verification Failed: Department still exists!');
  }

  console.log('--- CRUD Verification Complete ---');
}

main()
  .catch((e) => {
    console.error('Error during CRUD test:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
