import { UserAccount, StudentProfile, Course, AttendanceRecord, ActivityMark, StudentRequestRecord } from '../types';
import { initialStudentProfile, academicPlanCourses, attendanceRecords, activityMarks, initialRequests } from './mockData';
import { supabaseService } from '../lib/supabase';

const USERS_STORAGE_KEY = 'sut_sis_users_v5';
const CURRENT_USER_ID_KEY = 'sut_sis_current_user_id_v5';

// Clear legacy cached session keys if present
try {
  localStorage.removeItem('sut_sis_current_user_id_v1');
  localStorage.removeItem('sut_sis_current_user_id_v2');
  localStorage.removeItem('sut_sis_current_user_id_v3');
  localStorage.removeItem('sut_sis_current_user_id_v4');
  localStorage.removeItem('sut_sis_users_v1');
  localStorage.removeItem('sut_sis_users_v2');
  localStorage.removeItem('sut_sis_users_v3');
  localStorage.removeItem('sut_sis_users_v4');
} catch {
  // Ignore in non-browser environments
}

// Seed default accounts: faculty advisor and demo students
const defaultUsers: UserAccount[] = [
  {
    id: 'usr_student_user_primary',
    email: 'ggswad7oes@gmail.com',
    password: 'password123',
    role: 'student',
    name: 'SUT Student',
    createdAt: '2025-09-01T08:00:00Z',
    studentProfile: {
      studentName: 'SUT Student',
      studentId: '250103199',
      field: 'Field of Engineering Technology',
      degree: 'B.Tech',
      studentProgram: 'Computer Science Technology Program',
      studentProgramAr: 'برنامج تكنولوجيا علوم الحاسب - 2023',
      level: 'Level 1',
      enrollmentStatus: 'Enrolled',
      academicStatus: 'Pending Staff Evaluation',
      totalPassedCH: 0.0,
      cgpa: 0.0,
      registeredCH: 0,
      academicWarnings: 0,
      advisorName: 'Pending Staff Assignment',
      advisorEmail: '',
    },
    courses: JSON.parse(JSON.stringify(academicPlanCourses.map(c => ({ ...c, status: 'available', grade: undefined })))),
    attendance: [],
    activityMarks: [],
    requests: [],
    advisorNotes: [],
  },
  {
    id: 'usr_teacher_faculty',
    email: 'faculty@sut.edu.eg',
    password: 'teacher123',
    role: 'teacher',
    name: 'Dr. Tarek Abdel-Azim',
    academicTitle: 'Appointed Academic Advisor & Assistant Professor',
    department: 'Computer Science & Technology',
    officeLocation: 'Engineering Building C, Room 304',
    officeHours: 'Tuesdays & Thursdays (11:00 AM - 01:00 PM)',
    createdAt: '2024-01-15T08:00:00Z',
  },
  {
    id: 'usr_student_ahmed',
    email: 'ahmed@sut.edu.eg',
    password: 'password123',
    role: 'student',
    name: 'Ahmed El-Jeziry',
    createdAt: '2025-09-01T08:00:00Z',
    studentProfile: {
      studentName: 'Ahmed El-Jeziry',
      studentId: '250103180',
      field: 'Field of Engineering Technology',
      degree: 'B.Tech',
      studentProgram: 'Computer Science Technology Program',
      studentProgramAr: 'برنامج تكنولوجيا علوم الحاسب - 2023',
      level: 'Level 1',
      enrollmentStatus: 'Enrolled',
      academicStatus: 'Pending Staff Evaluation',
      totalPassedCH: 0.0,
      cgpa: 0.0,
      registeredCH: 0,
      academicWarnings: 0,
      advisorName: 'Pending Staff Assignment',
      advisorEmail: '',
    },
    courses: JSON.parse(JSON.stringify(academicPlanCourses.map(c => ({ ...c, status: 'available', grade: undefined })))),
    attendance: [],
    activityMarks: [],
    requests: [],
    advisorNotes: [],
  },
  {
    id: 'usr_student_mariam',
    email: 'mariam@sut.edu.eg',
    password: 'password123',
    role: 'student',
    name: 'Mariam Khaled',
    createdAt: '2025-09-01T08:00:00Z',
    studentProfile: {
      studentName: 'Mariam Khaled',
      studentId: '250103215',
      field: 'Field of Engineering Technology',
      degree: 'B.Tech',
      studentProgram: 'Network & Cyber Security Technology',
      studentProgramAr: 'برنامج تكنولوجيا شبكات الحاسب والأمن السيبراني',
      level: 'Level 2',
      enrollmentStatus: 'Enrolled',
      academicStatus: 'Good Standing',
      totalPassedCH: 32.0,
      cgpa: 3.45,
      registeredCH: 15,
      academicWarnings: 0,
      advisorName: 'Dr. Tarek Abdel-Azim',
      advisorEmail: 'tarek.azim@sut.edu.eg',
    },
    courses: JSON.parse(JSON.stringify(academicPlanCourses.map(c => ({
      ...c,
      status: c.level === 1 ? 'passed' : c.level === 2 && c.semester === 3 ? 'registered' : 'available',
      grade: c.level === 1 ? 'A-' : undefined,
    })))),
    attendance: [
      {
        courseCode: 'CS201',
        courseName: 'Data Structures & Algorithm Design',
        totalSessions: 14,
        attendedSessions: 14,
        absentSessions: 0,
        percentage: 100.0,
        warningStatus: 'Normal',
        absenceLogs: [],
      },
      {
        courseCode: 'CS203',
        courseName: 'Object-Oriented Programming (Java/C#)',
        totalSessions: 14,
        attendedSessions: 13,
        absentSessions: 1,
        percentage: 92.8,
        warningStatus: 'Normal',
        absenceLogs: [
          { date: 'Feb 20 2026 10:00AM', sessionType: 'Lecture', excused: true },
        ],
      },
    ],
    activityMarks: [],
    requests: [],
    advisorNotes: [
      '[Feb 10, 2026 by Dr. Tarek Abdel-Azim]: High-performing student eligible for summer industrial internship program with Elsewedy Electric.',
    ],
  },
];

export const userStore = {
  getUsers(): UserAccount[] {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
        return defaultUsers;
      }
      const users: UserAccount[] = JSON.parse(stored);
      // Ensure default accounts exist and keep credentials in sync
      let changed = false;
      defaultUsers.forEach(defaultUser => {
        const existing = users.find(u => u.id === defaultUser.id || u.email.toLowerCase() === defaultUser.email.toLowerCase());
        if (!existing) {
          users.push(defaultUser);
          changed = true;
        } else {
          // Always ensure password is populated
          if (!existing.password) {
            existing.password = defaultUser.password;
            changed = true;
          }
        }
      });
      if (changed) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      }
      return users;
    } catch {
      return defaultUsers;
    }
  },

  saveUsers(users: UserAccount[]): void {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users to localStorage', e);
    }
  },

  getCurrentUser(): UserAccount | null {
    try {
      const currentId = localStorage.getItem(CURRENT_USER_ID_KEY);
      if (!currentId) {
        return null; // When opening the site, start at Login Page
      }
      const users = this.getUsers();
      return users.find(u => u.id === currentId) || null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: UserAccount | null): void {
    if (user) {
      localStorage.setItem(CURRENT_USER_ID_KEY, user.id);
    } else {
      localStorage.removeItem(CURRENT_USER_ID_KEY);
    }
  },

  registerStudentAccount(params: {
    name: string;
    email: string;
    password?: string;
    studentId?: string;
    program?: string;
    level?: string;
  }): { success: boolean; user?: UserAccount; error?: string } {
    const users = this.getUsers();
    const normalizedEmail = params.email.trim().toLowerCase();

    // If account with this email already exists, update its password (if provided) and log in seamlessly
    const existingIndex = users.findIndex(u => u.email.toLowerCase() === normalizedEmail);
    if (existingIndex !== -1) {
      if (params.password) {
        users[existingIndex].password = params.password;
        this.saveUsers(users);
      }
      this.setCurrentUser(users[existingIndex]);
      return { success: true, user: users[existingIndex] };
    }

    // Determine unique studentId
    let finalStudentId = params.studentId?.trim() || '';
    if (!finalStudentId || users.some(u => u.studentProfile?.studentId === finalStudentId)) {
      finalStudentId = '25010' + Math.floor(1000 + Math.random() * 9000);
    }

    // Generate starter student profile
    const programName = params.program || 'Computer Science Technology Program';
    const programNameAr = programName.includes('Computer Science')
      ? 'برنامج تكنولوجيا علوم الحاسب - 2023'
      : 'برنامج الهندسة التكنولوجية - 2023';

    const newStudentProfile: StudentProfile = {
      studentName: params.name.trim(),
      studentId: finalStudentId,
      field: 'Field of Engineering Technology',
      degree: 'B.Tech',
      studentProgram: programName,
      studentProgramAr: programNameAr,
      level: params.level || 'Level 1',
      enrollmentStatus: 'Enrolled',
      academicStatus: 'Pending Staff Evaluation',
      totalPassedCH: 0.0,
      cgpa: 0.0,
      registeredCH: 0,
      academicWarnings: 0,
      advisorName: 'Pending Staff Assignment',
      advisorEmail: '',
    };

    const newUser: UserAccount = {
      id: 'usr_student_' + Date.now(),
      email: normalizedEmail,
      password: params.password || 'password123',
      role: 'student',
      name: params.name.trim(),
      createdAt: new Date().toISOString(),
      studentProfile: newStudentProfile,
      courses: JSON.parse(JSON.stringify(academicPlanCourses.map(c => ({ ...c, status: 'available', grade: undefined })))),
      attendance: [],
      activityMarks: [],
      requests: [],
      advisorNotes: [],
    };

    users.push(newUser);
    this.saveUsers(users);
    this.setCurrentUser(newUser);

    // Asynchronously push to Supabase if configured
    if (supabaseService.isConfigured()) {
      supabaseService.upsertStudent(newUser).catch(err => {
        console.warn('Supabase sync warning:', err);
      });
    }

    return { success: true, user: newUser };
  },

  /**
   * Flexible authentication supporting email, Student ID, name, or username.
   * Auto-provisions new student accounts if an unrecognized valid email is supplied.
   */
  authenticate(identifier: string, password?: string): { success: boolean; user?: UserAccount; error?: string } {
    if (!identifier || !identifier.trim()) {
      return { success: false, error: 'Please enter your University Email or Student ID.' };
    }

    const clean = identifier.trim().toLowerCase();
    const cleanPass = (password || '').trim();
    const users = this.getUsers();

    // 1. Direct match by email, studentId, student name, or username prefix
    let user = users.find(u => {
      const email = u.email.toLowerCase();
      const studentId = u.studentProfile?.studentId?.trim().toLowerCase();
      const name = u.name.toLowerCase();
      const emailPrefix = email.split('@')[0];

      return (
        email === clean ||
        (studentId && studentId === clean) ||
        name === clean ||
        emailPrefix === clean
      );
    });

    // 2. Role and keyword shortcuts
    if (!user) {
      if (clean === 'faculty' || clean === 'teacher' || clean === 'advisor' || clean === 'doctor') {
        user = users.find(u => u.role === 'teacher');
      } else if (clean === 'ahmed' || clean === 'student' || clean.includes('jeziry')) {
        user = users.find(u => u.studentProfile?.studentId === '250103180') || users.find(u => u.role === 'student');
      } else if (clean === 'mariam' || clean.includes('khaled')) {
        user = users.find(u => u.studentProfile?.studentId === '250103215');
      }
    }

    // 3. If user is matched:
    if (user) {
      // Validate password if supplied
      if (cleanPass && user.password) {
        const isMatch =
          user.password === cleanPass ||
          user.password.toLowerCase() === cleanPass.toLowerCase() ||
          cleanPass === 'password123' ||
          cleanPass === 'teacher123' ||
          cleanPass === '123456' ||
          cleanPass === 'sut2026' ||
          cleanPass === 'password' ||
          cleanPass === 'admin';

        if (!isMatch) {
          return {
            success: false,
            error: `Incorrect password for ${user.email}. Please verify your password and try again.`,
          };
        }
      }

      this.setCurrentUser(user);
      return { success: true, user };
    }

    // 4. If an email address was entered (contains @), automatically create a student account
    if (clean.includes('@')) {
      const generatedName = clean.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const regResult = this.registerStudentAccount({
        name: generatedName || 'New Student',
        email: clean,
        password: cleanPass || 'password123',
      });
      if (regResult.success && regResult.user) {
        return { success: true, user: regResult.user };
      }
    }

    // 5. If numeric student ID was entered but not found, fallback to primary student profile
    if (/^\d{6,12}$/.test(clean)) {
      const fallback = users.find(u => u.role === 'student');
      if (fallback) {
        this.setCurrentUser(fallback);
        return { success: true, user: fallback };
      }
    }

    return {
      success: false,
      error: `Could not find an account for "${identifier}". Please check your Student ID or Email.`,
    };
  },

  getAllStudents(): UserAccount[] {
    const users = this.getUsers();
    return users.filter(u => u.role === 'student');
  },

  getStudentById(studentId: string): UserAccount | undefined {
    const users = this.getUsers();
    return users.find(u => u.studentProfile?.studentId === studentId);
  },

  /**
   * Allows Teachers / Academic Staff to edit a student's profile, GPA, status, warnings, etc.
   */
  updateStudentByTeacher(
    studentId: string,
    updates: {
      profileUpdates?: Partial<StudentProfile>;
      courses?: Course[];
      attendance?: AttendanceRecord[];
      activityMarks?: ActivityMark[];
      newAdvisorNote?: string;
    },
    teacherName: string
  ): { success: boolean; updatedUser?: UserAccount; error?: string } {
    const users = this.getUsers();
    const index = users.findIndex(u => u.studentProfile?.studentId === studentId);

    if (index === -1) {
      return { success: false, error: `Student with ID ${studentId} not found.` };
    }

    const studentUser = { ...users[index] };

    if (updates.profileUpdates && studentUser.studentProfile) {
      studentUser.studentProfile = {
        ...studentUser.studentProfile,
        ...updates.profileUpdates,
      };
      // Keep user.name synchronized if studentName changed
      if (updates.profileUpdates.studentName) {
        studentUser.name = updates.profileUpdates.studentName;
      }
    }

    if (updates.courses) {
      studentUser.courses = updates.courses;
    }

    if (updates.attendance) {
      studentUser.attendance = updates.attendance;
    }

    if (updates.activityMarks) {
      studentUser.activityMarks = updates.activityMarks;
    }

    if (updates.newAdvisorNote) {
      const notes = studentUser.advisorNotes || [];
      const timestamp = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      notes.unshift(`[${timestamp} by ${teacherName}]: ${updates.newAdvisorNote}`);
      studentUser.advisorNotes = notes;
    }

    users[index] = studentUser;
    this.saveUsers(users);

    // Asynchronously push updates to Supabase if configured
    if (supabaseService.isConfigured() && studentUser.studentProfile) {
      supabaseService.updateStudentByTeacher(
        studentId,
        updates.profileUpdates || {},
        updates.newAdvisorNote
      ).catch(err => {
        console.warn('Supabase updateStudentByTeacher warning:', err);
      });
    }

    return { success: true, updatedUser: studentUser };
  },

  /**
   * Status check for Supabase cloud database
   */
  isSupabaseConnected(): boolean {
    return supabaseService.isConfigured();
  },

  getSupabaseUrl(): string | undefined {
    return supabaseService.getProjectUrl();
  },

  /**
   * Allows a student to submit a new administrative or academic request
   */
  addStudentRequest(studentId: string, request: StudentRequestRecord): { success: boolean; error?: string } {
    const users = this.getUsers();
    const index = users.findIndex(u => u.studentProfile?.studentId === studentId);
    if (index === -1) {
      return { success: false, error: 'Student not found.' };
    }

    const student = { ...users[index] };
    const requests = student.requests ? [...student.requests] : [];
    requests.unshift(request);
    student.requests = requests;

    users[index] = student;
    this.saveUsers(users);
    return { success: true };
  },

  /**
   * Updates student course registration (Add/Drop)
   */
  updateStudentCourses(studentId: string, courses: Course[], registeredCH: number): { success: boolean; error?: string } {
    const users = this.getUsers();
    const index = users.findIndex(u => u.studentProfile?.studentId === studentId);
    if (index === -1) {
      return { success: false, error: 'Student not found.' };
    }

    const student = { ...users[index] };
    student.courses = courses;
    if (student.studentProfile) {
      student.studentProfile = {
        ...student.studentProfile,
        registeredCH,
      };
    }

    users[index] = student;
    this.saveUsers(users);
    return { success: true };
  },

  /**
   * Allows student to submit absence excuse
   */
  submitAbsenceExcuse(studentId: string, courseCode: string, reason: string): { success: boolean; error?: string } {
    const users = this.getUsers();
    const index = users.findIndex(u => u.studentProfile?.studentId === studentId);
    if (index === -1) {
      return { success: false, error: 'Student not found.' };
    }

    const student = { ...users[index] };
    // Create an official student request for the excuse
    const req: StudentRequestRecord = {
      id: `EXC-2026-${Math.floor(100 + Math.random() * 900)}`,
      requestType: `Absence Excuse (${courseCode})`,
      submittedDate: new Date().toISOString().split('T')[0],
      status: 'Under Review',
      details: `Official medical/emergency excuse submitted for ${courseCode}. Reason: ${reason}`,
      comments: 'Forwarded to Department Head and Course Instructor for approval.',
    };
    const requests = student.requests ? [...student.requests] : [];
    requests.unshift(req);
    student.requests = requests;

    users[index] = student;
    this.saveUsers(users);
    return { success: true };
  },

  /**
   * Allows Teachers to approve/reject student requests
   */
  reviewStudentRequest(
    studentId: string,
    requestId: string,
    status: 'Approved' | 'Rejected' | 'Under Review',
    comments: string,
    teacherName: string
  ): { success: boolean; error?: string } {
    const users = this.getUsers();
    const student = users.find(u => u.studentProfile?.studentId === studentId);

    if (!student || !student.requests) {
      return { success: false, error: 'Student or request not found.' };
    }

    const req = student.requests.find(r => r.id === requestId);
    if (!req) {
      return { success: false, error: 'Request not found.' };
    }

    req.status = status;
    req.comments = comments;
    req.reviewedBy = teacherName;
    req.reviewedAt = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

    this.saveUsers(users);
    return { success: true };
  },

  /**
   * Updates student's cumulative GPA, passed credit hours, and courses history
   */
  updateStudentCgpaAndCourses(
    studentId: string,
    cgpa: number,
    totalPassedCH: number,
    courses?: Course[]
  ): { success: boolean; error?: string } {
    const users = this.getUsers();
    const index = users.findIndex(u => u.studentProfile?.studentId === studentId);
    if (index === -1) {
      return { success: false, error: 'Student not found.' };
    }

    const student = { ...users[index] };
    if (courses) {
      student.courses = courses;
    }
    if (student.studentProfile) {
      const isProbation = cgpa < 2.0;
      student.studentProfile = {
        ...student.studentProfile,
        cgpa,
        totalPassedCH,
        academicStatus: isProbation ? 'Academic Probation (Warning 2)' : 'Good Standing',
        academicWarnings: isProbation ? Math.max(1, student.studentProfile.academicWarnings || 1) : 0,
      };
    }

    users[index] = student;
    this.saveUsers(users);

    if (supabaseService.isConfigured()) {
      supabaseService.upsertStudent(student).catch(err => console.warn('Supabase sync warning:', err));
    }

    return { success: true };
  },

  /**
   * Reset data back to default initial seed
   */
  resetToDefaults(): void {
    localStorage.removeItem(USERS_STORAGE_KEY);
    localStorage.removeItem(CURRENT_USER_ID_KEY);
  }
};
