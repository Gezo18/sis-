import { supabase } from '../config/supabase';
import { CourseItem, CourseInput, PaginatedResponse, SingleResponse } from '../types';

export async function getCourses(
  limit = 50,
  offset = 0,
  department?: string
): Promise<PaginatedResponse<CourseItem>> {
  let query = supabase
    .from('courses')
    .select('*, teacher:teachers(id, first_name, last_name, email)', { count: 'exact' });

  if (department) {
    query = query.eq('department', department);
  }

  const { data, error, count } = await query
    .order('code')
    .range(offset, offset + limit - 1);

  return {
    data: (data ?? []) as CourseItem[],
    count: count ?? 0,
    error: error?.message ?? null,
  };
}

export async function getCourseById(id: string): Promise<SingleResponse<CourseItem>> {
  const { data, error } = await supabase
    .from('courses')
    .select('*, teacher:teachers(id, first_name, last_name, email)')
    .eq('id', id)
    .single();

  return {
    data: (data ?? null) as CourseItem | null,
    error: error?.message ?? null,
  };
}

export async function createCourse(input: CourseInput): Promise<SingleResponse<CourseItem>> {
  const { data, error } = await supabase
    .from('courses')
    .insert([input])
    .select()
    .single();

  return {
    data: (data ?? null) as CourseItem | null,
    error: error?.message ?? null,
  };
}

export async function updateCourse(
  id: string,
  updates: Partial<CourseInput>
): Promise<SingleResponse<CourseItem>> {
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return {
    data: (data ?? null) as CourseItem | null,
    error: error?.message ?? null,
  };
}

export async function deleteCourse(id: string): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id);

  return {
    success: !error,
    error: error?.message ?? null,
  };
}
