import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserAccount, StudentProfile, Course, AttendanceRecord, StudentRequestRecord } from '../types';

const DEFAULT_SUPABASE_URL = 'https://gvskmkwwwkstsndaqyxa.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_Zes1ZkDIdPpAtHqeXXLtJQ_YXfeUDne';

const getEnvOrStorage = (key: string, storageKey: string, fallbackDefault = ''): string => {
  const envVal = (import.meta.env as any)[key];
  if (envVal && typeof envVal === 'string' && envVal.trim() !== '') {
    return envVal.trim();
  }
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored && typeof stored === 'string' && stored.trim() !== '') {
      return stored.trim();
    }
  } catch {
    // Ignore in non-browser context
  }
  return fallbackDefault;
};

export const getSupabaseConfig = (): { url: string; anonKey: string } => {
  return {
    url: getEnvOrStorage('VITE_SUPABASE_URL', 'sut_supabase_url', DEFAULT_SUPABASE_URL),
    anonKey: getEnvOrStorage('VITE_SUPABASE_ANON_KEY', 'sut_supabase_anon_key', DEFAULT_SUPABASE_ANON_KEY),
  };
};

export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey && url.startsWith('http') && anonKey.length > 20);
};

export const setSupabaseCredentials = (url: string, anonKey: string): void => {
  try {
    localStorage.setItem('sut_supabase_url', url.trim());
    localStorage.setItem('sut_supabase_anon_key', anonKey.trim());
    supabaseInstance = null; // reset client instance
  } catch (e) {
    console.error('Failed to save Supabase credentials', e);
  }
};

export const clearSupabaseCredentials = (): void => {
  try {
    localStorage.removeItem('sut_supabase_url');
    localStorage.removeItem('sut_supabase_anon_key');
    supabaseInstance = null;
  } catch (e) {
    console.error('Failed to clear Supabase credentials', e);
  }
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseInstance) {
    try {
      const { url, anonKey } = getSupabaseConfig();
      supabaseInstance = createClient(url, anonKey);
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return supabaseInstance;
};

export const supabaseService = {
  isConfigured(): boolean {
    return isSupabaseConfigured();
  },

  getProjectUrl(): string | undefined {
    return getSupabaseConfig().url;
  },

  /**
   * Test connection to Supabase and verify tables
   */
  async testConnection(): Promise<{ success: boolean; message: string; tableCount?: number }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, message: 'Supabase URL or Anon Key is missing or invalid.' };
    }

    try {
      // Test querying students table
      const { data, error } = await supabase.from('students').select('student_id').limit(1);
      if (error) {
        if (
          error.code === '42P01' ||
          error.code === 'PGRST205' ||
          error.message?.includes('relation "public.students" does not exist') ||
          error.message?.includes("Could not find the table 'public.students'")
        ) {
          return {
            success: false,
            message: 'Connected to your Supabase project successfully! Next, run the SQL schema script in your Supabase SQL Editor to create the "students" table.',
          };
        }
        return { success: false, message: error.message };
      }

      return {
        success: true,
        message: 'Successfully connected to Supabase and verified the database schema!',
        tableCount: data ? data.length : 0,
      };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Failed to communicate with Supabase server.' };
    }
  },

  /**
   * Sync student account to Supabase 'students' table
   */
  async upsertStudent(account: UserAccount): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase || !account.studentProfile) {
      return { success: false, error: 'Supabase is not configured or user is not a student.' };
    }

    try {
      const { error } = await supabase.from('students').upsert({
        email: account.email,
        student_id: account.studentProfile.studentId,
        student_name: account.studentProfile.studentName,
        cgpa: account.studentProfile.cgpa,
        academic_status: account.studentProfile.academicStatus,
        academic_warnings: account.studentProfile.academicWarnings,
        registered_ch: account.studentProfile.registeredCH,
        total_passed_ch: account.studentProfile.totalPassedCH,
        level: account.studentProfile.level,
        student_program: account.studentProfile.studentProgram,
        advisor_name: account.studentProfile.advisorName,
        advisor_email: account.studentProfile.advisorEmail,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'student_id' });

      if (error) {
        console.warn('Supabase upsertStudent error:', error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (e: any) {
      console.warn('Supabase network or schema error:', e);
      return { success: false, error: e.message || 'Network error connecting to Supabase.' };
    }
  },

  /**
   * Fetch all students from Supabase
   */
  async fetchStudents(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured.' };
    }

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('student_name', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Sync teacher updates for a student directly to Supabase
   */
  async updateStudentByTeacher(
    studentId: string,
    updates: Partial<StudentProfile>,
    advisorNote?: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.cgpa !== undefined) updatePayload.cgpa = updates.cgpa;
      if (updates.academicStatus !== undefined) updatePayload.academic_status = updates.academicStatus;
      if (updates.academicWarnings !== undefined) updatePayload.academic_warnings = updates.academicWarnings;
      if (updates.studentName !== undefined) updatePayload.student_name = updates.studentName;
      if (updates.registeredCH !== undefined) updatePayload.registered_ch = updates.registeredCH;
      if (updates.totalPassedCH !== undefined) updatePayload.total_passed_ch = updates.totalPassedCH;
      if (updates.level !== undefined) updatePayload.level = updates.level;

      const { error } = await supabase
        .from('students')
        .update(updatePayload)
        .eq('student_id', studentId);

      if (error) {
        return { success: false, error: error.message };
      }

      if (advisorNote) {
        await supabase.from('advisor_notes').insert({
          student_id: studentId,
          note: advisorNote,
          created_at: new Date().toISOString(),
        });
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Realtime subscription to student record changes
   */
  subscribeToStudent(studentId: string, onUpdate: (payload: any) => void) {
    const supabase = getSupabase();
    if (!supabase) return () => {};

    const channel = supabase
      .channel(`student-${studentId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'students', filter: `student_id=eq.${studentId}` },
        (payload) => {
          onUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
