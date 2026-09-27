import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserAccount, StudentProfile, StudentRequestRecord } from '../types/index';

const STORAGE_URL_KEY = 'sut_supabase_url_custom';
const STORAGE_ANON_KEY = 'sut_supabase_anon_key_custom';

const defaultUrl =
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  'https://gvskmkwwwkstsndaqyxa.supabase.co';

const defaultAnonKey =
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  'sb_publishable_Zes1ZkDIdPpAtHqeXXLtJQ_YXfeUDne';

export function getSupabaseConfig(): { url: string; anonKey: string } {
  try {
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
  return Boolean(url && anonKey && url.startsWith('http'));
}

let cachedClient: SupabaseClient | null = null;
let currentClientKey = '';

export function getSupabase(): SupabaseClient {
  const { url, anonKey } = getSupabaseConfig();
  const safeUrl = url || defaultUrl;
  const safeKey = anonKey || defaultAnonKey;

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

export const supabase: SupabaseClient = getSupabase();

export function setSupabaseCredentials(url: string, anonKey: string): void {
  try {
    localStorage.setItem(STORAGE_URL_KEY, url.trim());
    localStorage.setItem(STORAGE_ANON_KEY, anonKey.trim());
  } catch (err) {
    console.warn('Failed to save Supabase credentials:', err);
  }
  const key = `${url.trim()}:::${anonKey.trim()}`;
  try {
    cachedClient = createClient(url.trim(), anonKey.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    currentClientKey = key;
  } catch (err) {
    console.error('Failed to recreate client:', err);
  }
}

export function clearSupabaseCredentials(): void {
  try {
    localStorage.removeItem(STORAGE_URL_KEY);
    localStorage.removeItem(STORAGE_ANON_KEY);
  } catch (err) {
    console.warn('Failed to clear Supabase credentials:', err);
  }
  try {
    cachedClient = createClient(defaultUrl, defaultAnonKey);
    currentClientKey = `${defaultUrl}:::${defaultAnonKey}`;
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

  async testConnection(): Promise<{ success: boolean; message: string }> {
    const client = getSupabase();
    try {
      const { data, error } = await client.from('students').select('id').limit(1);
      if (error) {
        if (error.code === '42P01') {
          return {
            success: true,
            message: 'Connected to Supabase! The tables need to be created using the SQL schema provided.',
          };
        }
        return {
          success: false,
          message: `Supabase error (${error.code || 'UNKNOWN'}): ${error.message}`,
        };
      }
      return {
        success: true,
        message: `Connection successful! Connected to Supabase project (${data ? data.length : 0} record test query succeeded).`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Network or configuration error: ${err.message || String(err)}`,
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
  async upsertStudent(user: UserAccount): Promise<{ success: boolean; data?: any; error?: string }> {
    const client = getSupabase();
    const p = user.studentProfile;
    if (!p) return { success: false, error: 'User is not a student' };

    try {
      const studentPayload: Record<string, any> = {
        student_id: p.studentId,
        email: user.email.toLowerCase().trim(),
        student_name: p.studentName,
        cgpa: p.cgpa || 0,
        academic_status: p.academicStatus || 'Good Standing',
        academic_warnings: p.academicWarnings || 0,
        registered_ch: p.registeredCH || 0,
        total_passed_ch: p.totalPassedCH || p.passedCH || 0,
        level: p.level || 'Level 1',
        student_program: p.studentProgram || 'Computer Science Technology Program',
        advisor_name: p.advisorName || 'Pending Staff Assignment',
        advisor_email: p.advisorEmail || '',
      };

      const { data, error } = await client
        .from('students')
        .upsert(studentPayload, { onConflict: 'student_id' })
        .select();

      if (error) {
        console.warn('Supabase upsertStudent error:', error);
        return { success: false, error: error.message };
      }
      return { success: true, data: data ? data[0] : null };
    } catch (err: any) {
      console.warn('Supabase upsertStudent exception:', err);
      return { success: false, error: err.message || 'Unknown error' };
    }
  },

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
        try {
          await client.from('advisor_notes').insert({
            author: profileUpdates.advisorName || 'Faculty Advisor',
            note: newAdvisorNote,
          });
        } catch {
          // Optional advisor note insert
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Unknown error' };
    }
  },
};
