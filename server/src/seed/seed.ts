import bcrypt from 'bcryptjs'
import { connectDB, disconnectDB } from '../config/db'
import { Course, Department, Skill, User } from '../models'

const INITIAL_DEPARTMENTS = [
  { department_code: 'CSE', department_name: 'Computer Science & Engineering' },
  {
    department_code: 'EEE',
    department_name: 'Electrical & Electronic Engineering',
  },
  { department_code: 'BBA', department_name: 'Business Administration' },
]

const INITIAL_SKILLS = [
  { skill_name: 'TypeScript', category: 'Programming' },
  { skill_name: 'React', category: 'Web Development' },
  { skill_name: 'Node.js', category: 'Backend Development' },
  { skill_name: 'MongoDB', category: 'Databases' },
  { skill_name: 'Data Structures & Algorithms', category: 'Computer Science' },
  { skill_name: 'Machine Learning', category: 'AI & Data Science' },
  { skill_name: 'UI/UX Design', category: 'Design' },
]

/**
 * Idempotent database seed script for core departments, courses, skills,
 * and an optional development admin account.
 */
const runSeed = async (): Promise<void> => {
  await connectDB()

  const deptMap = new Map<string, string>()
  for (const dept of INITIAL_DEPARTMENTS) {
    const doc = await Department.findOneAndUpdate(
      { department_code: dept.department_code },
      { $setOnInsert: dept },
      { new: true, upsert: true },
    )
    deptMap.set(dept.department_code, doc._id.toString())
  }
  console.log(`✅ Seeded ${deptMap.size} departments`)

  const cseId = deptMap.get('CSE')
  if (cseId) {
    const courses = [
      {
        department_id: cseId,
        course_code: 'CSE4104',
        course_name: 'Software Engineering Project',
        semester: '7th',
      },
      {
        department_id: cseId,
        course_code: 'CSE3101',
        course_name: 'Database Management Systems',
        semester: '5th',
      },
      {
        department_id: cseId,
        course_code: 'CSE2101',
        course_name: 'Data Structures and Algorithms',
        semester: '3rd',
      },
    ]

    for (const course of courses) {
      await Course.findOneAndUpdate(
        { course_code: course.course_code },
        { $setOnInsert: course },
        { upsert: true },
      )
    }
    console.log(`✅ Seeded ${courses.length} sample CSE courses`)
  }

  for (const skill of INITIAL_SKILLS) {
    await Skill.findOneAndUpdate(
      { skill_name: skill.skill_name },
      { $setOnInsert: skill },
      { upsert: true },
    )
  }
  console.log(`✅ Seeded ${INITIAL_SKILLS.length} skills`)

  const adminEmail = process.env.SEED_ADMIN_EMAIL
  const adminPassword = process.env.SEED_ADMIN_PASSWORD
  if (adminEmail && adminPassword) {
    const existingAdmin = await User.findOne({
      email: adminEmail.toLowerCase(),
    })
    if (!existingAdmin) {
      const password_hash = await bcrypt.hash(adminPassword, 12)
      await User.create({
        name: 'Platform Administrator',
        email: adminEmail.toLowerCase(),
        password_hash,
        role: 'admin',
        is_email_verified: true,
        verification_status: 'verified',
        account_status: 'active',
      })
      console.log(`✅ Seeded initial admin user: ${adminEmail}`)
    }
  } else {
    console.log(
      'ℹ️ Skipped admin seed (set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env to create one)',
    )
  }

  await disconnectDB()
}

runSeed().catch(async (err) => {
  console.error('❌ Seed failed:', err)
  await disconnectDB()
  process.exit(1)
})
