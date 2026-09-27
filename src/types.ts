export interface StudentProfile {
  studentName: string;
  studentNameAr?: string;
  studentId: string;
  field: string;
  degree: string;
  studentProgram: string;
  studentProgramAr: string;
  level: string;
  enrollmentStatus: string;
  academicStatus: string;
  totalPassedCH: number;
  cgpa: number;
  registeredCH: number;
  academicWarnings: number;
  advisorName: string;
  advisorEmail: string;
  passedCH?: number;
  requiredCH?: number;
  major?: string;
  faculty?: string;
  advisor?: string;
  email?: string;
  phone?: string;
  nationalId?: string;
  birthDate?: string;
  address?: string;
  emergencyContact?: string;
  term?: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  titleAr?: string;
  creditHours: number;
  lectureHours: number;
  labHours: number;
  department: string;
  level: number; // 1, 2, 3, 4
  semester: number; // 1 to 8
  prerequisites: string[];
  description: string;
  syllabus?: string[];
  instructor?: string;
  schedule?: string;
  hall?: string;
  grade?: string;
  status: 'passed' | 'registered' | 'available' | 'locked';
}

export interface AttendanceRecord {
  courseCode: string;
  courseName: string;
  totalSessions: number;
  attendedSessions: number;
  absentSessions: number;
  percentage: number;
  warningStatus: 'Normal' | 'Warning 1' | 'Warning 2' | 'Denied';
  absenceLogs: {
    date: string;
    sessionType: 'Lecture' | 'Lab' | 'Tutorial';
    excused: boolean;
  }[];
}

export interface ActivityMark {
  courseCode: string;
  courseName: string;
  creditHours: number;
  quizzes: number;
  maxQuizzes: number;
  assignments: number;
  maxAssignments: number;
  midterm: number;
  maxMidterm: number;
  labPractical: number;
  maxLabPractical: number;
  totalActivity: number;
  maxTotal: number;
}

export interface ExamScheduleItem {
  courseCode: string;
  courseName: string;
  examDate: string;
  examTime: string;
  hall: string;
  seatNumber: string;
  status: 'Upcoming' | 'Completed';
}

export interface CampusEvent {
  id: string;
  title: string;
  category: 'Academic' | 'Workshop' | 'Campus Life' | 'Career' | 'Sports';
  date: string; // YYYY-MM-DD
  time: string;
  location: string;
  description: string;
  organizer: string;
  featured?: boolean;
}

export interface CampusNews {
  id: string;
  title: string;
  category: 'Announcement' | 'Innovation' | 'Partnership' | 'Student Achievement';
  date: string;
  summary: string;
  content: string;
  image: string;
  readTime: string;
}

export interface FeeItem {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Due';
  semester: string;
}

export interface StudentRequestRecord {
  id: string;
  requestType: string;
  submittedDate: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Under Review';
  details: string;
  comments?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface UserAccount {
  id: string;
  email: string; // gmail or institutional email
  password?: string;
  role: 'student' | 'teacher' | 'admin';
  name: string;
  avatar?: string;
  createdAt: string;
  // Student-specific data
  studentProfile?: StudentProfile;
  courses?: Course[];
  attendance?: AttendanceRecord[];
  activityMarks?: ActivityMark[];
  requests?: StudentRequestRecord[];
  advisorNotes?: string[];
  // Teacher-specific data
  teacherProfile?: TeacherProfile;
  department?: string;
  academicTitle?: string;
  officeLocation?: string;
  officeHours?: string;
}

export interface TeacherProfile {
  teacherName: string;
  teacherNameAr?: string;
  staffId: string;
  field: string;
  degree: string;
  teacherProgram: string;
  teacherProgramAr: string;
  level: string;
  enrollmentStatus: string;
  academicStatus: string;
  totalTeachingCH: number;
  registeredAdvisingCH: number;
  cgpa?: number;
  rating?: number;
  department: string;
  faculty: string;
  email: string;
  phone?: string;
  officeLocation?: string;
  officeHours?: string;
  assignedCourses?: string[];
  adviseeCount?: number;
}

export type UserRole = 'teacher' | 'admin' | 'student';

export interface Admin {
  id: string;
  user_id: string;
  email?: string;
  created_at?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  teacherProfile?: Teacher;
  adminProfile?: Admin;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  count?: number | null;
}

export type StudentStatus = 'active' | 'inactive' | 'graduated' | 'suspended';

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  student_id?: string;
  date_of_birth?: string;
  grade_level?: string;
  field?: string;
  program?: string;
  cgpa?: number;
  accum_ch?: number;
  enrollment_date: string;
  status: StudentStatus;
  created_at: string;
  updated_at: string;
}

export type StudentInput = Omit<
  Student,
  'id' | 'created_at' | 'updated_at' | 'enrollment_date' | 'status'
> & {
  date_of_birth?: string;
  grade_level?: string;
  field?: string;
  program?: string;
  cgpa?: number;
  accum_ch?: number;
  enrollment_date?: string;
  status?: StudentStatus;
};

export interface Teacher {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  created_at: string;
  updated_at: string;
}

export type TeacherInput = Omit<Teacher, 'id' | 'created_at' | 'updated_at'>;

export interface CourseItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  credits: number;
  teacher_id?: string;
  created_at: string;
  updated_at: string;
}

export type CourseInput = Omit<CourseItem, 'id' | 'created_at' | 'updated_at'>;

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  enrolled_at: string;
  status: 'enrolled' | 'completed' | 'dropped';
}

export interface Grade {
  id: string;
  enrollment_id: string;
  grade_type: string;
  score: number;
  max_score: number;
  graded_at: string;
  feedback?: string;
}

export type GradeInput = Omit<Grade, 'id' | 'graded_at' | 'max_score'> & {
  max_score?: number;
};

export interface PaginatedResponse<T> {
  data: T[];
  count: number | null;
  error: string | null;
}

export interface SingleResponse<T> {
  data: T | null;
  error: string | null;
}

