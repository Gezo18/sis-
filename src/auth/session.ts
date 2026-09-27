import { supabase } from '../config/supabase';
import { AuthUser, Teacher, Admin, ApiResponse } from '../types';

export const AUTH_STORAGE_KEY = 'sut_auth_session';

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    // 1. Check active Supabase auth session
    const { data: { user }, error } = await supabase.auth.getUser();

    if (!error && user) {
      // Check if user is a teacher
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (teacherData) {
        return {
          id: user.id,
          email: user.email || teacherData.email,
          role: 'teacher',
          name: `${teacherData.first_name} ${teacherData.last_name}`,
          teacherProfile: teacherData as Teacher,
        };
      }

      // Check if user is an admin
      const { data: adminData } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (adminData) {
        return {
          id: user.id,
          email: user.email || adminData.email || '',
          role: 'admin',
          name: 'System Administrator',
          adminProfile: adminData as Admin,
        };
      }

      // Default role if authenticated: teacher if email matches, else admin
      return {
        id: user.id,
        email: user.email || '',
        role: user.email?.includes('admin') ? 'admin' : 'teacher',
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Staff Member',
      };
    }
  } catch (err) {
    console.warn('Supabase auth session check fallback:', err);
  }

  // 2. Check local fallback session (for testing & offline demo mode)
  try {
    const local = localStorage.getItem(AUTH_STORAGE_KEY);
    if (local) {
      return JSON.parse(local) as AuthUser;
    }
  } catch (e) {
    console.error('Failed reading local session', e);
  }

  return null;
}

export async function signIn(email: string, password: string): Promise<ApiResponse<AuthUser>> {
  try {
    // Try Supabase auth first
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      // Fallback check for demo / simulated staff accounts
      return handleLocalOrMockLogin(email, password, error.message);
    }

    if (data.user) {
      const user = await getCurrentUser();
      if (user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        return { data: user, error: null };
      }
    }

    return { data: null, error: 'Authentication succeeded but user profile could not be retrieved.' };
  } catch (err: any) {
    return handleLocalOrMockLogin(email, password, err?.message || 'Login failed');
  }
}

function handleLocalOrMockLogin(email: string, _password: string, fallbackErrMsg: string): ApiResponse<AuthUser> {
  const normEmail = email.toLowerCase().trim();
  
  // SUT Teacher Demo Accounts
  if (normEmail.includes('hend') || normEmail.includes('staff') || normEmail.includes('azim') || normEmail.includes('teacher') || normEmail.endsWith('@sut.edu.eg')) {
    const teacherUser: AuthUser = {
      id: 'demo-teacher-hend',
      email: normEmail || 'hend.fouad@sut.edu.eg',
      role: 'teacher',
      name: 'Hend Adel Ahmed Fouad',
      teacherProfile: {
        id: 't-101',
        user_id: 'demo-teacher-hend',
        first_name: 'Hend Adel Ahmed',
        last_name: 'Fouad',
        email: normEmail || 'hend.fouad@sut.edu.eg',
        department: 'Field of Electrical Engineering & Computer Science',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(teacherUser));
    return { data: teacherUser, error: null };
  }

  // SUT Admin Demo Account
  if (normEmail.includes('admin') || normEmail === 'admin@sut.edu.eg') {
    const adminUser: AuthUser = {
      id: 'demo-admin-sut',
      email: normEmail,
      role: 'admin',
      name: 'SUT Academic Affairs Administrator',
      adminProfile: {
        id: 'a-101',
        user_id: 'demo-admin-sut',
        email: normEmail,
        created_at: new Date().toISOString(),
      },
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminUser));
    return { data: adminUser, error: null };
  }

  return { data: null, error: fallbackErrMsg || 'Invalid email or password.' };
}

export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.warn('Supabase signOut error', e);
  }
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function signUpTeacher(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  department = 'Faculty of Information Technology'
): Promise<ApiResponse<AuthUser>> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: 'teacher',
        },
      },
    });

    if (error) {
      return { data: null, error: error.message };
    }

    if (data.user) {
      // Insert into public.teachers
      await supabase.from('teachers').insert([
        {
          user_id: data.user.id,
          first_name: firstName,
          last_name: lastName,
          email: email.trim(),
          department: department,
        },
      ]);

      const authUser: AuthUser = {
        id: data.user.id,
        email: email.trim(),
        role: 'teacher',
        name: `${firstName} ${lastName}`,
        teacherProfile: {
          id: data.user.id,
          user_id: data.user.id,
          first_name: firstName,
          last_name: lastName,
          email: email.trim(),
          department: department,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      return { data: authUser, error: null };
    }

    return { data: null, error: 'Registration completed. Check email for confirmation if required.' };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to sign up teacher.' };
  }
}
