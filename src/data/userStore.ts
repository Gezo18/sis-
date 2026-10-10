import { UserAccount, StudentProfile, Course, AttendanceRecord, ActivityMark, StudentRequestRecord } from '../types';
import { initialStudentProfile, academicPlanCourses, attendanceRecords, activityMarks, initialRequests } from './mockData';
import { supabaseService } from '../lib/supabase';

const USERS_STORAGE_KEY = 'sut_sis_users_v6';
const CURRENT_USER_ID_KEY = 'sut_sis_current_user_id_v6';

// Clear legacy cached session keys if present
try {
  localStorage.removeItem('sut_sis_current_user_id_v1');
  localStorage.removeItem('sut_sis_current_user_id_v2');
  localStorage.removeItem('sut_sis_current_user_id_v3');
  localStorage.removeItem('sut_sis_current_user_id_v4');
  localStorage.removeItem('sut_sis_current_user_id_v5');
  localStorage.removeItem('sut_sis_users_v1');
  localStorage.removeItem('sut_sis_users_v2');
  localStorage.removeItem('sut_sis_users_v3');
  localStorage.removeItem('sut_sis_users_v4');
  localStorage.removeItem('sut_sis_users_v5');
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
    id: 'usr_teacher_hend',
    email: 'hend.fouad@sut.edu.eg',
    password: 'teacher123',
    role: 'teacher',
    name: 'Dr. Hend Adel Ahmed Fouad',
    academicTitle: 'Associate Professor & Staff Member',
    department: 'Computer Engineering & Artificial Intelligence',
    officeLocation: 'Engineering Building B, Floor 3, Room 304',
    officeHours: 'Sundays & Tuesdays (10:00 AM - 01:00 PM)',
    createdAt: '2024-01-15T08:00:00Z',
    teacherProfile: {
      teacherName: 'Dr. Hend Adel Ahmed Fouad',
      teacherNameAr: 'د. هند عادل أحمد فؤاد',
      staffId: '100248',
      field: 'Field of Engineering Technology',
      degree: 'Ph.D. in Computer Science & AI',
      teacherProgram: 'Artificial Intelligence & Data Science Technology Program',
      teacherProgramAr: 'برنامج تكنولوجيا الذكاء الاصطناعي وعلوم البيانات - 2023',
      level: 'Senior Faculty (Level 4 Advisor)',
      enrollmentStatus: 'Active Full-Time Faculty',
      academicStatus: 'Good Standing',
      totalTeachingCH: 16.0,
      registeredAdvisingCH: 420,
      cgpa: 4.0,
      rating: 4.9,
      department: 'Computer Engineering & Artificial Intelligence',
      faculty: 'Faculty of Engineering & Technology',
      email: 'hend.fouad@sut.edu.eg',
      phone: '+20 (15) 412-884',
      officeLocation: 'Engineering Building B, Floor 3, Room 304',
      officeHours: 'Sundays & Tuesdays (10:00 AM - 01:00 PM)',
      assignedCourses: ['CET442 - Selected Topic in Data Science', 'CS102 - Data Structures & Algorithms', 'ET104 - Embedded Systems'],
      adviseeCount: 28,
    },
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
      advisorName: 'Pending Staff Assignment',
      advisorEmail: '',
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
    advisorNotes: [],
  },
  {
    id: 'usr_student_youssef',
    email: 'youssef.mansour@sut.edu.eg',
    password: 'password123',
    role: 'student',
    name: 'Youssef Mansour',
    createdAt: '2025-09-01T08:00:00Z',
    studentProfile: {
      studentName: 'Youssef Mansour',
      studentId: '240101185',
      field: 'Field of Engineering Technology',
      degree: 'B.Tech',
      studentProgram: 'Artificial Intelligence & Data Science Technology Program',
      studentProgramAr: 'برنامج تكنولوجيا الذكاء الاصطناعي وعلوم البيانات - 2023',
      level: 'Level 3',
      enrollmentStatus: 'Enrolled',
      academicStatus: 'Good Standing',
      totalPassedCH: 68.0,
      cgpa: 3.62,
      registeredCH: 18,
      academicWarnings: 0,
      advisorName: 'Dr. Hend Adel Ahmed Fouad',
      advisorEmail: 'hend.fouad@sut.edu.eg',
    },
    courses: [
      {
        id: 'crs_cet442',
        code: 'CET442',
        title: 'Selected Topic in Data Science',
        creditHours: 3,
        lectureHours: 2,
        labHours: 2,
        department: 'Computer Engineering & Technology',
        level: 3,
        semester: 5,
        prerequisites: ['CS201'],
        description: 'Advanced data science methodologies and deep learning applications.',
        instructor: 'Dr. Hend Adel Ahmed Fouad',
        status: 'registered',
      },
      {
        id: 'crs_cs102',
        code: 'CS102',
        title: 'Data Structures & Algorithms',
        creditHours: 3,
        lectureHours: 2,
        labHours: 2,
        department: 'Computer Science',
        level: 2,
        semester: 3,
        prerequisites: ['CS101'],
        description: 'Analysis of algorithms, balanced trees, and graphs.',
        instructor: 'Dr. Hend Adel Ahmed Fouad',
        status: 'registered',
      }
    ],
    attendance: [
      {
        courseCode: 'CET442',
        courseName: 'Selected Topic in Data Science',
        totalSessions: 14,
        attendedSessions: 14,
        absentSessions: 0,
        percentage: 100.0,
        warningStatus: 'Normal',
        absenceLogs: [],
      }
    ],
    activityMarks: [],
    requests: [],
    advisorNotes: [
      '[Feb 18, 2026 by Dr. Hend Fouad]: Advisee showing strong aptitude in neural networks and PyTorch development.',
    ],
  },
  {
    id: 'usr_student_salma',
    email: 'salma.hassan@sut.edu.eg',
    password: 'password123',
    role: 'student',
    name: 'Salma Ahmed Hassan',
    createdAt: '2025-09-01T08:00:00Z',
    studentProfile: {
      studentName: 'Salma Ahmed Hassan',
      studentId: '240102006',
      field: 'Field of Engineering Technology',
      degree: 'B.Tech',
      studentProgram: 'Artificial Intelligence & Data Science Technology Program',
      studentProgramAr: 'برنامج تكنولوجيا الذكاء الاصطناعي وعلوم البيانات - 2023',
      level: 'Level 3',
      enrollmentStatus: 'Enrolled',
      academicStatus: 'Good Standing',
      totalPassedCH: 72.0,
      cgpa: 3.85,
      registeredCH: 16,
      academicWarnings: 0,
      advisorName: 'Dr. Hend Adel Ahmed Fouad',
      advisorEmail: 'hend.fouad@sut.edu.eg',
    },
    courses: [
      {
        id: 'crs_cet442',
        code: 'CET442',
        title: 'Selected Topic in Data Science',
        creditHours: 3,
        lectureHours: 2,
        labHours: 2,
        department: 'Computer Engineering & Technology',
        level: 3,
        semester: 5,
        prerequisites: ['CS201'],
        description: 'Advanced data science methodologies and deep learning applications.',
        instructor: 'Dr. Hend Adel Ahmed Fouad',
        status: 'registered',
      }
    ],
    attendance: [
      {
        courseCode: 'CET442',
        courseName: 'Selected Topic in Data Science',
        totalSessions: 14,
        attendedSessions: 14,
        absentSessions: 0,
        percentage: 100.0,
        warningStatus: 'Normal',
        absenceLogs: [],
      }
    ],
    activityMarks: [],
    requests: [],
    advisorNotes: [],
  },
  {
    id: 'usr_student_karim',
    email: 'karim.mostafa@sut.edu.eg',
    password: 'password123',
    role: 'student',
    name: 'Karim Mostafa El-Sayed',
    createdAt: '2025-09-01T08:00:00Z',
    studentProfile: {
      studentName: 'Karim Mostafa El-Sayed',
      studentId: '250103550',
      field: 'Field of Engineering Technology',
      degree: 'B.Tech',
      studentProgram: 'Computer Science Technology Program',
      studentProgramAr: 'برنامج تكنولوجيا علوم الحاسب - 2023',
      level: 'Level 1',
      enrollmentStatus: 'Enrolled',
      academicStatus: 'Pending Staff Evaluation',
      totalPassedCH: 18.0,
      cgpa: 3.15,
      registeredCH: 15,
      academicWarnings: 0,
      advisorName: 'Pending Staff Assignment',
      advisorEmail: '',
    },
    courses: [],
    attendance: [],
    activityMarks: [],
    requests: [],
    advisorNotes: [],
  },
  {
    id: 'usr_student_nourhan',
    email: 'nourhan.abdelaziz@sut.edu.eg',
    password: 'password123',
    role: 'student',
    name: 'Nourhan Mohamed Abdelaziz',
    createdAt: '2025-09-01T08:00:00Z',
    studentProfile: {
      studentName: 'Nourhan Mohamed Abdelaziz',
      studentId: '230101792',
      field: 'Field of Engineering Technology',
      degree: 'B.Tech',
      studentProgram: 'Artificial Intelligence & Data Science Technology Program',
      studentProgramAr: 'برنامج تكنولوجيا الذكاء الاصطناعي وعلوم البيانات - 2023',
      level: 'Level 4',
      enrollmentStatus: 'Enrolled',
      academicStatus: 'Good Standing',
      totalPassedCH: 102.0,
      cgpa: 3.42,
      registeredCH: 18,
      academicWarnings: 0,
      advisorName: 'Pending Staff Assignment',
      advisorEmail: '',
    },
    courses: [],
    attendance: [],
    activityMarks: [],
    requests: [],
    advisorNotes: [],
  },
];

let inMemoryUsers: UserAccount[] = [...defaultUsers];
let inMemoryCurrentUserId: string | null = null;

export const userStore = {
  getUsers(): UserAccount[] {
    try {
      if (typeof localStorage === 'undefined') {
        return inMemoryUsers;
      }
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
        return defaultUsers;
      }
      let users: UserAccount[] = JSON.parse(stored);
      // Ensure any fake teacher accounts are purged
      const cleaned = users.filter(u => u.id !== 'usr_teacher_faculty' && u.email.toLowerCase() !== 'faculty@sut.edu.eg');
      let changed = cleaned.length !== users.length;
      users = cleaned;

      // Ensure default accounts exist and keep credentials in sync
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
    inMemoryUsers = users;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      }
    } catch (e) {
      console.error('Failed to save users to localStorage', e);
    }
  },

  getCurrentUser(): UserAccount | null {
    try {
      let currentId: string | null = null;
      if (typeof localStorage !== 'undefined') {
        currentId = localStorage.getItem(CURRENT_USER_ID_KEY);
      } else {
        currentId = inMemoryCurrentUserId;
      }
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
    inMemoryCurrentUserId = user ? user.id : null;
    try {
      if (typeof localStorage !== 'undefined') {
        if (user) {
          localStorage.setItem(CURRENT_USER_ID_KEY, user.id);
        } else {
          localStorage.removeItem(CURRENT_USER_ID_KEY);
        }
      }
    } catch {
      // In-memory fallback handles state
    }
  },

  registerUser(user: UserAccount): void {
    const users = this.getUsers();
    const existingIndex = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (existingIndex !== -1) {
      users[existingIndex] = { ...users[existingIndex], ...user };
    } else {
      users.unshift(user);
    }
    this.saveUsers(users);
  },

  async registerStudentAccount(params: {
    name: string;
    email: string;
    password?: string;
    studentId?: string;
    program?: string;
    level?: string;
  }): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
    const users = this.getUsers();
    const normalizedEmail = params.email.trim().toLowerCase();

    // Check if account with this email or student ID already exists in Supabase
    if (supabaseService.isConfigured()) {
      const existingSupabase = await supabaseService.findStudentByEmailOrId(normalizedEmail);
      if (existingSupabase) {
        // If password matches or supplied, authenticate this account
        if (params.password) {
          return this.authenticate(normalizedEmail, params.password);
        }
        return {
          success: false,
          error: `An account with email "${normalizedEmail}" already exists on Supabase. Please sign in with your password.`,
        };
      }
    }

    // Check local store
    const existingIndex = users.findIndex(u => u.email.toLowerCase() === normalizedEmail);
    if (existingIndex !== -1) {
      return this.authenticate(normalizedEmail, params.password);
    }

    // Determine unique studentId
    let finalStudentId = params.studentId?.trim() || '';
    if (!finalStudentId) {
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
      academicStatus: 'Good Standing',
      totalPassedCH: 0.0,
      cgpa: 0.0,
      registeredCH: 0,
      academicWarnings: 0,
      advisorName: 'Pending Staff Assignment',
      advisorEmail: '',
    };

    const newUser: UserAccount = {
      id: 'usr_student_' + finalStudentId,
      email: normalizedEmail,
      password: supabaseService.isConfigured() ? undefined : (params.password || 'password123'),
      authProvider: supabaseService.isConfigured() ? 'supabase' : 'local',
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

    // Supabase creates the linked student row from Auth metadata in a database
    // trigger; the client must not create privileged academic fields itself.
    if (supabaseService.isConfigured()) {
      const authResult = await supabaseService.signUpWithSupabaseAuth(normalizedEmail, params.password || 'password123', {
        fullName: params.name.trim(),
        studentId: finalStudentId,
        program: programName,
        level: params.level || 'Level 1',
      });
      if (!authResult.success || !authResult.user?.id) {
        return {
          success: false,
          error: authResult.error || 'Supabase did not return the new account. Please try again.',
        };
      }

      const profile = await supabaseService.findStudentByAuthUserId(authResult.user.id);
      if (!profile) {
        return {
          success: false,
          error: 'Your account was created, but the SIS profile is not available yet. If email confirmation is enabled, verify your email and sign in.',
        };
      }
      newUser.id = profile.id;
    }

    users.unshift(newUser);
    this.saveUsers(users);
    this.setCurrentUser(newUser);

    return { success: true, user: newUser };
  },

  /**
   * Comprehensive asynchronous authentication against Supabase and local store.
   * NEVER gives a default account to a user who entered their own credentials.
   */
  async authenticate(
    identifier: string,
    password?: string
  ): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
    if (!identifier || !identifier.trim()) {
      return { success: false, error: 'Please enter your University Email or Student ID.' };
    }

    const clean = identifier.trim().toLowerCase();
    const cleanPass = (password || '').trim();
    if (!cleanPass) {
      return { success: false, error: 'Please enter your password.' };
    }

    // Authenticate first, then resolve the student profile by the trusted Auth
    // user ID. Unauthenticated email/student-ID lookups are blocked by RLS.
    if (supabaseService.isConfigured() && clean.includes('@')) {
      try {
        const authRes = await supabaseService.signInWithSupabaseAuth(clean, cleanPass);
        if (authRes.success && authRes.user?.id) {
          const supabaseStudent = await supabaseService.findStudentByAuthUserId(authRes.user.id);
          if (!supabaseStudent) {
            return {
              success: false,
              error: 'This Supabase account has no linked student profile. Contact your SIS administrator.',
            };
          }

          const users = this.getUsers();
          let matchedUser = users.find(u =>
            u.role === 'student' &&
            (u.email.toLowerCase() === supabaseStudent.email.toLowerCase() ||
              u.studentProfile?.studentId === supabaseStudent.student_id)
          );
          const studentProgram = supabaseStudent.student_program || 'Computer Science Technology Program';
          const studentProgramAr = studentProgram.includes('Computer Science')
            ? 'برنامج تكنولوجيا علوم الحاسب - 2023'
            : 'برنامج الهندسة التكنولوجية - 2023';

          const studentProfile: StudentProfile = {
            studentName: supabaseStudent.student_name,
            studentId: supabaseStudent.student_id,
            field: 'Field of Engineering Technology',
            degree: 'B.Tech',
            studentProgram: studentProgram,
            studentProgramAr: studentProgramAr,
            level: String(supabaseStudent.level || 'Level 1'),
            enrollmentStatus: 'Enrolled',
            academicStatus: supabaseStudent.academic_status || 'Good Standing',
            totalPassedCH: Number(supabaseStudent.total_passed_ch) || 0.0,
            cgpa: Number(supabaseStudent.cgpa) || 0.0,
            registeredCH: Number(supabaseStudent.registered_ch) || 0,
            academicWarnings: Number(supabaseStudent.academic_warnings) || 0,
            advisorName: supabaseStudent.advisor_name || 'Pending Staff Assignment',
            advisorEmail: supabaseStudent.advisor_email || '',
          };

          // Fetch student requests from Supabase
          const remoteRequests = await supabaseService.fetchStudentRequests(supabaseStudent.student_id);

          if (!matchedUser) {
            matchedUser = {
              id: supabaseStudent.id || `usr_student_${supabaseStudent.student_id}`,
              email: supabaseStudent.email.toLowerCase(),
              authProvider: 'supabase',
              role: 'student',
              name: supabaseStudent.student_name,
              createdAt: supabaseStudent.created_at || new Date().toISOString(),
              studentProfile,
              courses: JSON.parse(JSON.stringify(academicPlanCourses.map(c => ({ ...c, status: 'available', grade: undefined })))),
              attendance: [],
              activityMarks: [],
              requests: remoteRequests,
              advisorNotes: [],
            };
            users.unshift(matchedUser);
          } else {
            matchedUser.name = supabaseStudent.student_name;
            matchedUser.studentProfile = studentProfile;
            matchedUser.id = supabaseStudent.id;
            matchedUser.authProvider = 'supabase';
            delete matchedUser.password;
            if (remoteRequests.length > 0) {
              matchedUser.requests = remoteRequests;
            }
          }

          this.saveUsers(users);
          this.setCurrentUser(matchedUser);
          return { success: true, user: matchedUser };
        }
      } catch (err) {
        console.warn('Supabase query error in authenticate:', err);
      }
    }

    // 2. Check local users list (Faculty Advisor Dr. Hend or pre-saved users)
    const users = this.getUsers();
    let user = users.find(u => {
      const email = u.email.toLowerCase();
      const studentId = u.studentProfile?.studentId?.trim().toLowerCase();
      const staffId = u.teacherProfile?.staffId?.trim().toLowerCase();
      const name = u.name.toLowerCase();

      return (
        email === clean ||
        (studentId && studentId === clean) ||
        (staffId && staffId === clean) ||
        name === clean
      );
    });

    // Dedicated Teacher role shortcuts for demonstration
    if (!user) {
      if (clean === 'hend' || clean === '100248' || clean === 'hend.fouad@sut.edu.eg') {
        user = users.find(u => u.id === 'usr_teacher_hend') || users.find(u => u.role === 'teacher');
      }
    }

    // If local user matched:
    if (user) {
      const hasDatabaseId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.id);
      if (user.authProvider === 'supabase' || (supabaseService.isConfigured() && hasDatabaseId)) {
        return {
          success: false,
          error: `Incorrect password for ${user.email}. Please verify your Supabase password and try again.`,
        };
      }

      if (!user.password || user.password !== cleanPass) {
        return {
          success: false,
          error: `Incorrect password for ${user.email}. Please verify your password and try again.`,
        };
      }

      this.setCurrentUser(user);
      return { success: true, user };
    }

    // If no user was found matching their exact credentials:
    return {
      success: false,
      error: `No student or staff account found for "${identifier}". Please create a new student account with your details or verify your credentials.`,
    };
  },

  /**
   * Synchronize all student records from Supabase into the local store
   */
  async syncWithSupabase(): Promise<void> {
    if (!supabaseService.isConfigured()) return;
    try {
      const remoteStudents = await supabaseService.fetchStudentsFromSupabase();
      if (!remoteStudents || remoteStudents.length === 0) return;

      const users = this.getUsers();
      let changed = false;

      for (const s of remoteStudents) {
        const existingIdx = users.findIndex(
          u => u.email.toLowerCase() === s.email.toLowerCase() || u.studentProfile?.studentId === s.student_id
        );

        const studentProfile: StudentProfile = {
          studentName: s.student_name,
          studentId: s.student_id,
          field: 'Field of Engineering Technology',
          degree: 'B.Tech',
          studentProgram: s.student_program || 'Computer Science Technology Program',
          studentProgramAr: (s.student_program || '').includes('Computer Science')
            ? 'برنامج تكنولوجيا علوم الحاسب - 2023'
            : 'برنامج الهندسة التكنولوجية - 2023',
          level: String(s.level || 'Level 1'),
          enrollmentStatus: 'Enrolled',
          academicStatus: s.academic_status || 'Good Standing',
          totalPassedCH: Number(s.total_passed_ch) || 0.0,
          cgpa: Number(s.cgpa) || 0.0,
          registeredCH: Number(s.registered_ch) || 0,
          academicWarnings: Number(s.academic_warnings) || 0,
          advisorName: s.advisor_name || 'Pending Staff Assignment',
          advisorEmail: s.advisor_email || '',
        };

        if (existingIdx !== -1) {
          users[existingIdx].name = s.student_name;
          users[existingIdx].id = s.id;
          users[existingIdx].authProvider = 'supabase';
          delete users[existingIdx].password;
          users[existingIdx].studentProfile = studentProfile;
          changed = true;
        } else {
          users.push({
            id: s.id || `usr_student_${s.student_id}`,
            email: s.email.toLowerCase(),
            authProvider: 'supabase',
            role: 'student',
            name: s.student_name,
            createdAt: s.created_at || new Date().toISOString(),
            studentProfile,
            courses: JSON.parse(JSON.stringify(academicPlanCourses.map(c => ({ ...c, status: 'available', grade: undefined })))),
            attendance: [],
            activityMarks: [],
            requests: [],
            advisorNotes: [],
          });
          changed = true;
        }
      }

      if (changed) {
        this.saveUsers(users);
      }

      // If active user is a student, update active session with latest profile from Supabase
      const current = this.getCurrentUser();
      if (current && current.role === 'student') {
        const fresh = users.find(u => u.id === current.id || u.email.toLowerCase() === current.email.toLowerCase());
        if (fresh) {
          this.setCurrentUser(fresh);
        }
      }
    } catch (err) {
      console.warn('syncWithSupabase error:', err);
    }
  },

  getAllStudents(): UserAccount[] {
    const users = this.getUsers();
    return users.filter(u => u.role === 'student');
  },

  getAllTeachers(): UserAccount[] {
    const users = this.getUsers();
    return users.filter(u => u.role === 'teacher');
  },

  registerTeacherAccount(data: {
    name: string;
    email: string;
    password?: string;
    staffId?: string;
    department?: string;
    academicTitle?: string;
  }): { success: boolean; user?: UserAccount; error?: string } {
    const users = this.getUsers();
    const cleanEmail = data.email.trim().toLowerCase();

    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'A staff account with this email already exists.' };
    }

    const newStaffId = data.staffId?.trim() || String(Math.floor(100000 + Math.random() * 900000));

    const newTeacher: UserAccount = {
      id: `usr_teacher_${Date.now()}`,
      email: cleanEmail,
      password: data.password || 'teacher123',
      role: 'teacher',
      name: data.name,
      academicTitle: data.academicTitle || 'Faculty Member & Academic Advisor',
      department: data.department || 'Computer Engineering & Artificial Intelligence',
      officeLocation: 'Building B, Floor 3, Room 304',
      officeHours: 'Sundays & Tuesdays (10:00 AM - 01:00 PM)',
      createdAt: new Date().toISOString(),
      teacherProfile: {
        teacherName: data.name,
        teacherNameAr: data.name,
        staffId: newStaffId,
        field: 'Field of Engineering Technology',
        degree: 'Ph.D. / M.Sc.',
        teacherProgram: 'Artificial Intelligence & Data Science Technology Program',
        teacherProgramAr: 'برنامج تكنولوجيا الذكاء الاصطناعي وعلوم البيانات - 2023',
        level: 'Senior Faculty',
        enrollmentStatus: 'Active Full-Time Faculty',
        academicStatus: 'Good Standing',
        totalTeachingCH: 16.0,
        registeredAdvisingCH: 350,
        cgpa: 4.0,
        rating: 4.9,
        department: data.department || 'Computer Engineering & Artificial Intelligence',
        faculty: 'Faculty of Engineering & Technology',
        email: cleanEmail,
        phone: '+20 (15) 412-884',
        officeLocation: 'Building B, Floor 3, Room 304',
        officeHours: 'Sundays & Tuesdays (10:00 AM - 01:00 PM)',
        assignedCourses: ['CET442 - Selected Topic in Data Science', 'CS102 - Data Structures & Algorithms'],
        adviseeCount: 28,
      },
    };

    users.push(newTeacher);
    this.saveUsers(users);
    this.setCurrentUser(newTeacher);
    return { success: true, user: newTeacher };
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

    // Save directly to Supabase student_requests table
    if (supabaseService.isConfigured()) {
      supabaseService.saveStudentRequest(studentId, request).catch(err => {
        console.warn('Failed to save student request to Supabase:', err);
      });
    }

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
      const profile = student.studentProfile;
      if (profile) {
        supabaseService.updateStudentByTeacher(studentId, {
          cgpa: profile.cgpa,
          totalPassedCH: profile.totalPassedCH,
          academicStatus: profile.academicStatus,
          academicWarnings: profile.academicWarnings,
        }).then(result => {
          if (!result.success) console.warn('Supabase academic profile sync warning:', result.error);
        });
      }
    }

    return { success: true };
  },

  /**
   * Assign an advisor to a student
   */
  assignAdvisorToStudent(studentId: string, advisorName: string, advisorEmail: string): { success: boolean; error?: string } {
    const users = this.getUsers();
    const index = users.findIndex(u => u.studentProfile?.studentId === studentId);
    if (index === -1) {
      return { success: false, error: 'Student not found.' };
    }

    const student = { ...users[index] };
    if (student.studentProfile) {
      student.studentProfile = {
        ...student.studentProfile,
        advisorName,
        advisorEmail,
      };
    }
    const notes = student.advisorNotes ? [...student.advisorNotes] : [];
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    notes.unshift(`[${dateStr} by ${advisorName}]: Officially assigned to faculty advising roster.`);
    student.advisorNotes = notes;

    users[index] = student;
    this.saveUsers(users);

    if (supabaseService.isConfigured()) {
      supabaseService.updateStudentByTeacher(studentId, {
        advisorName,
        advisorEmail,
      }).then(result => {
        if (!result.success) console.warn('Supabase advisor assignment sync warning:', result.error);
      });
    }

    return { success: true };
  },

  /**
   * Remove an advisor assignment from a student
   */
  removeAdvisorFromStudent(studentId: string): { success: boolean; error?: string } {
    const users = this.getUsers();
    const index = users.findIndex(u => u.studentProfile?.studentId === studentId);
    if (index === -1) {
      return { success: false, error: 'Student not found.' };
    }

    const student = { ...users[index] };
    if (student.studentProfile) {
      student.studentProfile = {
        ...student.studentProfile,
        advisorName: 'Pending Staff Assignment',
        advisorEmail: '',
      };
    }

    users[index] = student;
    this.saveUsers(users);

    if (supabaseService.isConfigured()) {
      supabaseService.updateStudentByTeacher(studentId, {
        advisorName: 'Pending Staff Assignment',
        advisorEmail: '',
      }).then(result => {
        if (!result.success) console.warn('Supabase advisor removal sync warning:', result.error);
      });
    }

    return { success: true };
  },

  /**
   * Enroll a student in a course taught by a teacher
   */
  enrollStudentInTeacherCourse(
    studentId: string,
    courseCode: string,
    courseTitle?: string,
    teacherName?: string
  ): { success: boolean; error?: string } {
    const users = this.getUsers();
    const index = users.findIndex(u => u.studentProfile?.studentId === studentId);
    if (index === -1) {
      return { success: false, error: 'Student not found.' };
    }

    const student = { ...users[index] };
    const courses = student.courses ? [...student.courses] : [];
    const cleanCode = courseCode.split('-')[0].trim().toUpperCase();
    const cIdx = courses.findIndex(c => c.code.toUpperCase() === cleanCode);

    const title = courseTitle || (cIdx !== -1 ? courses[cIdx].title : `${cleanCode} Course`);
    const instructor = teacherName || 'Dr. Hend Adel Ahmed Fouad';

    if (cIdx !== -1) {
      courses[cIdx] = {
        ...courses[cIdx],
        status: 'registered',
        instructor,
      };
    } else {
      courses.push({
        id: `crs_${cleanCode.toLowerCase()}_${Date.now()}`,
        code: cleanCode,
        title,
        creditHours: 3,
        lectureHours: 2,
        labHours: 2,
        department: 'Computer Engineering & Technology',
        level: 3,
        semester: 5,
        prerequisites: [],
        description: `${title} at Elsewedy University of Technology.`,
        instructor,
        status: 'registered',
      });
    }

    // Ensure attendance record exists
    const attendance = student.attendance ? [...student.attendance] : [];
    const aIdx = attendance.findIndex(a => a.courseCode.toUpperCase() === cleanCode);
    if (aIdx === -1) {
      attendance.push({
        courseCode: cleanCode,
        courseName: title,
        totalSessions: 14,
        attendedSessions: 14,
        absentSessions: 0,
        percentage: 100.0,
        warningStatus: 'Normal',
        absenceLogs: [],
      });
    }

    // Recalculate registered CH
    const registeredCH = courses
      .filter(c => c.status === 'registered')
      .reduce((sum, c) => sum + (c.creditHours || 3), 0);

    student.courses = courses;
    student.attendance = attendance;
    if (student.studentProfile) {
      student.studentProfile.registeredCH = registeredCH;
    }

    users[index] = student;
    this.saveUsers(users);

    if (supabaseService.isConfigured()) {
      if (student.studentProfile) {
        supabaseService.updateStudentByTeacher(studentId, {
          registeredCH: student.studentProfile.registeredCH,
        }).then(result => {
          if (!result.success) console.warn('Supabase course enrollment sync warning:', result.error);
        });
      }
    }

    return { success: true };
  },

  /**
   * Drop a student from a teacher's course
   */
  dropStudentFromTeacherCourse(studentId: string, courseCode: string): { success: boolean; error?: string } {
    const users = this.getUsers();
    const index = users.findIndex(u => u.studentProfile?.studentId === studentId);
    if (index === -1) {
      return { success: false, error: 'Student not found.' };
    }

    const student = { ...users[index] };
    const courses = student.courses ? [...student.courses] : [];
    const cleanCode = courseCode.split('-')[0].trim().toUpperCase();
    const cIdx = courses.findIndex(c => c.code.toUpperCase() === cleanCode);
    if (cIdx !== -1) {
      courses[cIdx] = {
        ...courses[cIdx],
        status: 'available',
      };
    }

    const registeredCH = courses
      .filter(c => c.status === 'registered')
      .reduce((sum, c) => sum + (c.creditHours || 3), 0);

    student.courses = courses;
    if (student.studentProfile) {
      student.studentProfile.registeredCH = registeredCH;
    }

    users[index] = student;
    this.saveUsers(users);

    if (supabaseService.isConfigured()) {
      if (student.studentProfile) {
        supabaseService.updateStudentByTeacher(studentId, {
          registeredCH: student.studentProfile.registeredCH,
        }).then(result => {
          if (!result.success) console.warn('Supabase course drop sync warning:', result.error);
        });
      }
    }

    return { success: true };
  },

  /**
   * Check if a student is enrolled in a specific course code
   */
  isStudentEnrolledInCourse(student: UserAccount, courseCode: string): boolean {
    if (!student.courses) return false;
    const cleanCode = courseCode.split('-')[0].trim().toUpperCase();
    return student.courses.some(c => 
      c.code.toUpperCase() === cleanCode && (c.status === 'registered' || c.status === 'passed')
    );
  },

  /**
   * Reset data back to default initial seed
   */
  resetToDefaults(): void {
    localStorage.removeItem(USERS_STORAGE_KEY);
    localStorage.removeItem(CURRENT_USER_ID_KEY);
  }
};
