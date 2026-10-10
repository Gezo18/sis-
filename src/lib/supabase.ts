import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserAccount, StudentProfile, StudentRequestRecord } from '../types/index';

const STORAGE_URL_KEY = 'sut_supabase_url_custom';
const STORAGE_ANON_KEY = 'sut_supabase_anon_key_custom';
const STORAGE_DISABLED_KEY = 'sut_supabase_disabled';
const DISABLED_URL = 'https://disabled.supabase.invalid';
const DISABLED_KEY = 'disabled';

const defaultUrl =
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  'https://gvskmkwwwkstsndaqyxa.supabase.co';

const defaultAnonKey =
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  'sb_publishable_Zes1ZkDIdPpAtHqeXXLtJQ_YXfeUDne';

const SIS_TABLES = [
  'admins',
  'teachers',
  'students',
  'courses',
  'enrollments',
  'grades',
  'attendance_records',
  'student_requests',
  'advisor_notes',
] as const;

export interface SupabaseTableCheck {
  table: typeof SIS_TABLES[number];
  status: 'ready' | 'restricted' | 'missing' | 'unavailable';
  message: string;
}

export interface SupabaseConnectionReport {
  success: boolean;
  message: string;
  tables: SupabaseTableCheck[];
}

function isServiceRoleKey(key: string): boolean {
  if (key.startsWith('sb_secret_')) return true;
  const payload = key.split('.')[1];
  if (!payload) return false;

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
    return JSON.parse(decoded).role === 'service_role';
  } catch {
    return false;
  }
}

export function getSupabaseConfig(): { url: string; anonKey: string } {
  try {
    if (localStorage.getItem(STORAGE_DISABLED_KEY) === 'true') {
      return { url: '', anonKey: '' };
    }
    const customUrl = localStorage.getItem(STORAGE_URL_KEY);
    const customKey = localStorage.getItem(STORAGE_ANON_KEY);
    return {
      url: (customUrl && customUrl.trim()) ? customUrl.trim() : defaultUrl,
      anonKey: (customKey && customKey.trim()) ? customKey.trim() : defaultAnonKey,
    };
  } catch {
    return { url: defaultUrl, anonKey: defaultAnonKey };
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey || isServiceRoleKey(anonKey)) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' ||
      (parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname));
  } catch {
    return false;
  }
}

let cachedClient: SupabaseClient | null = null;
let currentClientKey = '';

export function getSupabase(): SupabaseClient {
  const { url, anonKey } = getSupabaseConfig();
  const isDisabled = !url && !anonKey && (() => {
    try {
      return localStorage.getItem(STORAGE_DISABLED_KEY) === 'true';
    } catch {
      return false;
    }
  })();
  const safeUrl = isDisabled ? DISABLED_URL : (url || defaultUrl);
  const safeKey = isDisabled ? DISABLED_KEY : (anonKey || defaultAnonKey);

  const key = `${safeUrl}:::${safeKey}`;
  if (!cachedClient || currentClientKey !== key) {
    try {
      cachedClient = createClient(safeUrl, safeKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      currentClientKey = key;
    } catch (err) {
      console.error('Failed to create Supabase client:', err);
      cachedClient = createClient(defaultUrl, defaultAnonKey);
      currentClientKey = `${defaultUrl}:::${defaultAnonKey}`;
    }
  }
  return cachedClient;
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, property) {
    const client = getSupabase();
    const value = Reflect.get(client, property, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export function setSupabaseCredentials(url: string, anonKey: string): void {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(cleanUrl);
  } catch {
    throw new Error('Enter a valid Supabase project URL.');
  }

  const isLocalUrl = parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1';
  if (parsedUrl.protocol !== 'https:' && !(isLocalUrl && parsedUrl.protocol === 'http:')) {
    throw new Error('Supabase project URLs must use HTTPS (HTTP is allowed for localhost only).');
  }
  if (!cleanKey) {
    throw new Error('Enter a Supabase anon or publishable key.');
  }
  if (isServiceRoleKey(cleanKey)) {
    throw new Error('A service-role/secret key cannot be used in the browser. Use the anon or publishable key.');
  }

  try {
    localStorage.setItem(STORAGE_URL_KEY, cleanUrl);
    localStorage.setItem(STORAGE_ANON_KEY, cleanKey);
    localStorage.removeItem(STORAGE_DISABLED_KEY);
  } catch (err) {
    throw new Error(`Could not save Supabase credentials in this browser: ${err instanceof Error ? err.message : String(err)}`);
  }
  cachedClient = createClient(cleanUrl, cleanKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  currentClientKey = `${cleanUrl}:::${cleanKey}`;
}

export function clearSupabaseCredentials(): void {
  try {
    localStorage.removeItem(STORAGE_URL_KEY);
    localStorage.removeItem(STORAGE_ANON_KEY);
    localStorage.setItem(STORAGE_DISABLED_KEY, 'true');
  } catch (err) {
    throw new Error(`Could not disconnect Supabase in this browser: ${err instanceof Error ? err.message : String(err)}`);
  }
  try {
    cachedClient = createClient(DISABLED_URL, DISABLED_KEY);
    currentClientKey = `${DISABLED_URL}:::${DISABLED_KEY}`;
  } catch {
    cachedClient = null;
  }
}

export interface SupabaseStudentRow {
  id: string;
  student_id: string;
  email: string;
  student_name: string;
  cgpa: number;
  academic_status: string;
  academic_warnings: number;
  registered_ch: number;
  total_passed_ch: number;
  level: string | number;
  student_program: string;
  advisor_name: string;
  advisor_email: string;
  created_at?: string;
  updated_at?: string;
}

export const supabaseService = {
  isConfigured(): boolean {
    return isSupabaseConfigured();
  },

  getProjectUrl(): string | undefined {
    return getSupabaseConfig().url;
  },

  async testConnection(): Promise<SupabaseConnectionReport> {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: 'Supabase is not configured with a valid project URL and anon/publishable key.',
        tables: SIS_TABLES.map((table) => ({
          table,
          status: 'unavailable',
          message: 'Configure Supabase before checking this table.',
        })),
      };
    }

    const client = getSupabase();
    try {
      const tables = await Promise.all(SIS_TABLES.map(async (table): Promise<SupabaseTableCheck> => {
        const { error } = await client.from(table).select('*', { head: true, count: 'exact' }).limit(0);
        if (!error) return { table, status: 'ready', message: 'Table is reachable.' };

        const code = error.code?.toUpperCase() || '';
        const message = error.message || 'Unknown Supabase error';
        if (code === '42P01' || code === 'PGRST205' || /relation .* does not exist|table .* not found|schema cache/i.test(message)) {
          return { table, status: 'missing', message: 'Table is missing; apply the SIS schema.' };
        }
        if (code === '42501' || code === 'PGRST301' || /permission denied|not authorized|row-level security/i.test(message)) {
          return { table, status: 'restricted', message: 'Table exists; access is restricted for this session.' };
        }
        return { table, status: 'unavailable', message };
      }));

      const missing = tables.filter((table) => table.status === 'missing');
      const unavailable = tables.filter((table) => table.status === 'unavailable');
      const success = missing.length === 0 && unavailable.length === 0;
      const restrictedCount = tables.filter((table) => table.status === 'restricted').length;
      const message = !success
        ? `Supabase responded, but ${missing.length} required table(s) are missing and ${unavailable.length} check(s) failed.`
        : `Supabase is reachable and all ${tables.length} SIS tables exist${restrictedCount ? ` (${restrictedCount} access-restricted for this session)` : ''}.`;

      return {
        success,
        message,
        tables,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Network or configuration error: ${err.message || String(err)}`,
        tables: SIS_TABLES.map((table) => ({
          table,
          status: 'unavailable',
          message: 'Could not reach Supabase.',
        })),
      };
    }
  },

  /**
   * Fetch all student records directly from Supabase
   */
  async fetchStudentsFromSupabase(): Promise<SupabaseStudentRow[]> {
    const client = getSupabase();
    try {
      const { data, error } = await client
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching students from Supabase:', error.message);
        return [];
      }
      return (data || []) as SupabaseStudentRow[];
    } catch (err) {
      console.warn('Exception in fetchStudentsFromSupabase:', err);
      return [];
    }
  },

  /**
   * Lookup a specific student by email or student ID
   */
  async findStudentByEmailOrId(identifier: string): Promise<SupabaseStudentRow | null> {
    const client = getSupabase();
    const clean = identifier.trim().toLowerCase();
    try {
      // 1. Exact match on email
      const { data: byEmail, error: err1 } = await client
        .from('students')
        .select('*')
        .ilike('email', clean)
        .limit(1);

      if (!err1 && byEmail && byEmail.length > 0) {
        return byEmail[0] as SupabaseStudentRow;
      }

      // 2. Exact match on student_id
      const { data: byId, error: err2 } = await client
        .from('students')
        .select('*')
        .eq('student_id', clean)
        .limit(1);

      if (!err2 && byId && byId.length > 0) {
        return byId[0] as SupabaseStudentRow;
      }

      return null;
    } catch (err) {
      console.warn('Exception finding student on Supabase:', err);
      return null;
    }
  },

  async findStudentByAuthUserId(userId: string): Promise<SupabaseStudentRow | null> {
    try {
      const { data, error } = await getSupabase()
        .from('students')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Error fetching authenticated student profile:', error.message);
        return null;
      }
      return data as SupabaseStudentRow | null;
    } catch (err) {
      console.warn('Exception fetching authenticated student profile:', err);
      return null;
    }
  },

  /**
   * Sign in using Supabase Auth
   */
  async signInWithSupabaseAuth(email: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
    const client = getSupabase();
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Supabase auth failed' };
    }
  },

  /**
   * Register a user with Supabase Auth
   */
  async signUpWithSupabaseAuth(
    email: string,
    password: string,
    metadata: { fullName: string; studentId: string; program: string; level: string }
  ): Promise<{ success: boolean; user?: any; error?: string }> {
    const client = getSupabase();
    try {
      const { data, error } = await client.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password.trim(),
        options: {
          data: {
            full_name: metadata.fullName,
            student_id: metadata.studentId,
            student_program: metadata.program,
            level: metadata.level,
            role: 'student',
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Supabase signup failed' };
    }
  },

  /**
   * Insert or update a student profile in the Supabase students table
   */
  /**
   * Submit an academic request to Supabase student_requests table
   */
  async saveStudentRequest(
    studentId: string,
    request: StudentRequestRecord
  ): Promise<{ success: boolean; error?: string }> {
    const client = getSupabase();
    try {
      // Find student UUID from student_id
      const studentRow = await this.findStudentByEmailOrId(studentId);
      const studentDbUuid = studentRow?.id || null;

      const payload: Record<string, any> = {
        id: request.id,
        request_type: request.requestType,
        details: request.details || '',
        status: request.status || 'Under Review',
        submitted_date: request.submittedDate || new Date().toISOString().split('T')[0],
        comments: request.comments || 'Forwarded to Academic Advising & Registrar Office.',
      };

      if (studentDbUuid) {
        payload.student_id = studentDbUuid;
      }

      const { error } = await client.from('student_requests').insert(payload);
      if (error) {
        console.warn('Supabase saveStudentRequest warning:', error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.warn('Exception in saveStudentRequest:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Fetch all requests for a student from Supabase
   */
  async fetchStudentRequests(studentId: string): Promise<StudentRequestRecord[]> {
    const client = getSupabase();
    try {
      const studentRow = await this.findStudentByEmailOrId(studentId);
      if (!studentRow?.id) return [];

      const { data, error } = await client
        .from('student_requests')
        .select('*')
        .eq('student_id', studentRow.id)
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map((r: any) => ({
        id: r.id,
        requestType: r.request_type,
        submittedDate: r.submitted_date,
        status: r.status as any,
        details: r.details,
        comments: r.comments,
      }));
    } catch (err) {
      console.warn('Exception in fetchStudentRequests:', err);
      return [];
    }
  },

  async updateStudentByTeacher(
    studentId: string,
    profileUpdates: Partial<StudentProfile>,
    newAdvisorNote?: string
  ): Promise<{ success: boolean; error?: string }> {
    const client = getSupabase();
    try {
      const payload: Record<string, any> = {};
      if (profileUpdates.cgpa !== undefined) payload.cgpa = profileUpdates.cgpa;
      if (profileUpdates.academicStatus !== undefined) payload.academic_status = profileUpdates.academicStatus;
      if (profileUpdates.academicWarnings !== undefined) payload.academic_warnings = profileUpdates.academicWarnings;
      if (profileUpdates.registeredCH !== undefined) payload.registered_ch = profileUpdates.registeredCH;
      if (profileUpdates.totalPassedCH !== undefined) payload.total_passed_ch = profileUpdates.totalPassedCH;
      if (profileUpdates.level !== undefined) payload.level = profileUpdates.level;
      if (profileUpdates.advisorName !== undefined) payload.advisor_name = profileUpdates.advisorName;
      if (profileUpdates.advisorEmail !== undefined) payload.advisor_email = profileUpdates.advisorEmail;

      if (Object.keys(payload).length > 0) {
        const { error } = await client
          .from('students')
          .update(payload)
          .eq('student_id', studentId);

        if (error) {
          console.warn('Supabase updateStudent error:', error);
          return { success: false, error: error.message };
        }
      }

      if (newAdvisorNote) {
        const { data: student, error: studentError } = await client
          .from('students')
          .select('id')
          .eq('student_id', studentId)
          .maybeSingle();
        if (studentError || !student) {
          return { success: false, error: studentError?.message || 'Student profile not found for advisor note.' };
        }

        const { error: noteError } = await client.from('advisor_notes').insert({
          student_id: student.id,
          author: profileUpdates.advisorName || 'Faculty Advisor',
          note: newAdvisorNote,
        });
        if (noteError) {
          return { success: false, error: noteError.message };
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Unknown error' };
    }
  },
};
