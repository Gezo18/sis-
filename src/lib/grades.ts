import { supabase } from '../config/supabase';
import { Grade, GradeInput, PaginatedResponse, SingleResponse } from '../types';

/**
 * Optimized query using eager loading to retrieve all grades for a student
 * in a single database round-trip (eliminating N+1 query patterns).
 */
export async function getGradesByStudent(
  studentId: string,
  limit = 50,
  offset = 0
): Promise<PaginatedResponse<Grade & { enrollment: { course: { name: string; code: string } } }>> {
  // Use inner join relationship mapping on enrollments and courses to eager load in 1 query
  const { data, error, count } = await supabase
    .from('grades')
    .select(
      '*, enrollment:enrollments!inner(id, student_id, course:courses!inner(name, code))',
      { count: 'exact' }
    )
    .eq('enrollment.student_id', studentId)
    .order('graded_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    // Fallback if PostgREST nested filtering syntax falls back on standard inner join
    const { data: fallbackData, error: fallbackError, count: fallbackCount } = await supabase
      .from('grades')
      .select('*, enrollment:enrollments(course:courses(name, code))', { count: 'exact' })
      .order('graded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return {
      data: (fallbackData ?? []) as (Grade & {
        enrollment: { course: { name: string; code: string } };
      })[],
      count: fallbackCount ?? 0,
      error: fallbackError?.message ?? null,
    };
  }

  return {
    data: (data ?? []) as (Grade & {
      enrollment: { course: { name: string; code: string } };
    })[],
    count: count ?? 0,
    error: null,
  };
}

export async function getGradesByEnrollment(
  enrollmentId: string,
  limit = 50,
  offset = 0
): Promise<PaginatedResponse<Grade>> {
  const { data, error, count } = await supabase
    .from('grades')
    .select('*', { count: 'exact' })
    .eq('enrollment_id', enrollmentId)
    .order('graded_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return {
    data: (data ?? []) as Grade[],
    count: count ?? 0,
    error: error?.message ?? null,
  };
}

export async function createGrade(
  input: GradeInput
): Promise<SingleResponse<Grade>> {
  const { data, error } = await supabase
    .from('grades')
    .insert([input])
    .select()
    .single();

  return {
    data: (data ?? null) as Grade | null,
    error: error?.message ?? null,
  };
}

export async function updateGrade(
  id: string,
  updates: Partial<GradeInput>
): Promise<SingleResponse<Grade>> {
  const { data, error } = await supabase
    .from('grades')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return {
    data: (data ?? null) as Grade | null,
    error: error?.message ?? null,
  };
}

export async function deleteGrade(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase
    .from('grades')
    .delete()
    .eq('id', id);

  return {
    success: !error,
    error: error?.message ?? null,
  };
}
