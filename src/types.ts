export interface StudentProfile {
  studentName: string;
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
  department?: string;
  academicTitle?: string;
  officeLocation?: string;
  officeHours?: string;
}
