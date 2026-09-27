import { supabase } from '../config/supabase';
import { Student, StudentInput, PaginatedResponse, SingleResponse } from '../types';

function sanitizeForPostgREST(input: string): string {
  return input.replace(/[,().%]/g, '');
}

export async function getStudents(
  limit = 50,
  offset = 0
): Promise<PaginatedResponse<Student>> {
  const { data, error, count } = await supabase
    .from('students')
    .select('*', { count: 'exact' })
    .order('last_name')
    .range(offset, offset + limit - 1);

  return {
    data: (data ?? []) as Student[],
    count: count ?? 0,
    error: error?.message ?? null,
  };
}

export async function getStudentById(id: string): Promise<SingleResponse<Student>> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single();

  return {
    data: (data ?? null) as Student | null,
    error: error?.message ?? null,
  };
}

export async function searchStudents(query: string): Promise<PaginatedResponse<Student>> {
  const safe = sanitizeForPostgREST(query);
  if (!safe) return { data: [], count: 0, error: null };

  const { data, error, count } = await supabase
    .from('students')
    .select('*', { count: 'exact' })
    .or(`first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,email.ilike.%${safe}%`)
    .order('last_name');

  return {
    data: (data ?? []) as Student[],
    count: count ?? 0,
    error: error?.message ?? null,
  };
}

export async function createStudent(input: StudentInput): Promise<SingleResponse<Student>> {
  const { data, error } = await supabase
    .from('students')
    .insert([input])
    .select()
    .single();

  return {
    data: (data ?? null) as Student | null,
    error: error?.message ?? null,
  };
}

export async function updateStudent(
  id: string,
  updates: Partial<StudentInput>
): Promise<SingleResponse<Student>> {
  const { data, error } = await supabase
    .from('students')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return {
    data: (data ?? null) as Student | null,
    error: error?.message ?? null,
  };
}

export async function deleteStudent(id: string): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);

  return {
    success: !error,
    error: error?.message ?? null,
  };
}
