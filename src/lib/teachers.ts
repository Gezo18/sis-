import { supabase } from '../config/supabase';
import { Teacher, TeacherInput, PaginatedResponse, SingleResponse } from '../types';

export async function getTeachers(
  limit = 50,
  offset = 0
): Promise<PaginatedResponse<Teacher>> {
  const { data, error, count } = await supabase
    .from('teachers')
    .select('*', { count: 'exact' })
    .order('last_name')
    .range(offset, offset + limit - 1);

  return {
    data: (data ?? []) as Teacher[],
    count: count ?? 0,
    error: error?.message ?? null,
  };
}

export async function getTeacherById(id: string): Promise<SingleResponse<Teacher>> {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('id', id)
    .single();

  return {
    data: (data ?? null) as Teacher | null,
    error: error?.message ?? null,
  };
}

export async function createTeacher(input: TeacherInput): Promise<SingleResponse<Teacher>> {
  const { data, error } = await supabase
    .from('teachers')
    .insert([input])
    .select()
    .single();

  return {
    data: (data ?? null) as Teacher | null,
    error: error?.message ?? null,
  };
}

export async function updateTeacher(
  id: string,
  updates: Partial<TeacherInput>
): Promise<SingleResponse<Teacher>> {
  const { data, error } = await supabase
    .from('teachers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return {
    data: (data ?? null) as Teacher | null,
    error: error?.message ?? null,
  };
}

export async function deleteTeacher(id: string): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase
    .from('teachers')
    .delete()
    .eq('id', id);

  return {
    success: !error,
    error: error?.message ?? null,
  };
}
