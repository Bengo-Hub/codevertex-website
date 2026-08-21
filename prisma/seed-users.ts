import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function createUsers() {
  console.log('👤 Creating users...');

  // 1. Create Site Admin (for admin panel)
  const adminUser = await prisma.siteUser.upsert({
    where: { email: 'admin@codevertexafrica.com' },
    update: {},
    create: {
      id: 'admin-site-user',
      email: 'admin@codevertexafrica.com',
      fullName: 'Platform Admin',
      role: 'admin',
      avatarUrl: 'https://ui-avatars.com/api/?name=Admin+User&background=random',
    },
  });
  console.log('  ✓ Admin user created:', adminUser.email);

  // 2. Create a Student User
  const studentUser = await prisma.studentUser.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      id: 'student-1',
      email: 'student@example.com',
      fullName: 'Test Student',
      phone: '+254700000000',
      dob: new Date('2000-01-01'),
    },
  });
  console.log('  ✓ Student user created:', studentUser.email);

  // 3. Create another student
  const studentUser2 = await prisma.studentUser.upsert({
    where: { email: 'student2@example.com' },
    update: {},
    create: {
      id: 'student-2',
      email: 'student2@example.com',
      fullName: 'Jane Doe',
      phone: '+254711111111',
      dob: new Date('2001-05-15'),
    },
  });
  console.log('  ✓ Student user created:', studentUser2.email);

  console.log('✅ Users created successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('   Admin: admin@codevertexafrica.com');
  console.log('   Student: student@example.com');
  console.log('   Student 2: student2@example.com');
}

createUsers()
  .catch((e) => {
    console.error('❌ Failed to create users:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());