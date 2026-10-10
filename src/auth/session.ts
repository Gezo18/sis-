import { supabase } from '../config/supabase';
import { AuthUser, Teacher, Admin, ApiResponse } from '../types';

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

      // Authenticated does not imply staff access. A public Auth account must
      // have an explicit row in the corresponding role table.
      await supabase.auth.signOut();
      return null;
    }
  } catch (err) {
    console.warn('Supabase auth session check failed:', err);
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
        return { data: user, error: null };
      }
    }

    return { data: null, error: 'Authentication succeeded but user profile could not be retrieved.' };
  } catch (err: any) {
    return handleLocalOrMockLogin(email, password, err?.message || 'Login failed');
  }
}

function handleLocalOrMockLogin(_email: string, _password: string, fallbackErrMsg: string): ApiResponse<AuthUser> {
  return {
    data: null,
    error: fallbackErrMsg || 'Invalid email or password. Staff access requires a provisioned Supabase role.',
  };
}

export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.warn('Supabase signOut error', e);
  }
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
      // Teacher rows are provisioned by an administrator; self-service role
      // assignment is intentionally blocked by database policy.
      const { error: profileError } = await supabase.from('teachers').insert([
        {
          user_id: data.user.id,
          first_name: firstName,
          last_name: lastName,
          email: email.trim(),
          department: department,
        },
      ]);
      if (profileError) {
        await supabase.auth.signOut();
        return { data: null, error: `Auth account created, but teacher access must be provisioned by an administrator: ${profileError.message}` };
      }

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

      return { data: authUser, error: null };
    }

    return { data: null, error: 'Registration completed. Check email for confirmation if required.' };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to sign up teacher.' };
  }
}
