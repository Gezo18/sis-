import { supabase } from '../config/supabase';
import { Grade, GradeInput, PaginatedResponse, SingleResponse } from '../types';

export async function getGradesByStudent(
  studentId: string
): Promise<PaginatedResponse<Grade & { enrollment: { course: { name: string; code: string } } }>> {
  // Step 1: Find all enrollment IDs for this student
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select('id')
    .eq('student_id', studentId);

  if (enrollError) {
    return { data: [], count: 0, error: enrollError.message };
  }

  const enrollmentIds = (enrollments ?? []).map((e) => e.id);
  if (enrollmentIds.length === 0) {
    return { data: [], count: 0, error: null };
  }

  // Step 2: Get grades for those enrollments
  const { data, error, count } = await supabase
    .from('grades')
    .select(
      '*, enrollment:enrollments(course:courses(name, code))',
      { count: 'exact' }
    )
    .in('enrollment_id', enrollmentIds) // ← correct filter
    .order('graded_at', { ascending: false });

  return {
    data: (data ?? []) as (Grade & {
      enrollment: { course: { name: string; code: string } };
    })[],
    count: count ?? 0,
    error: error?.message ?? null,
  };
}

export async function getGradesByEnrollment(
  enrollmentId: string
): Promise<PaginatedResponse<Grade>> {
  const { data, error, count } = await supabase
    .from('grades')
    .select('*', { count: 'exact' })
    .eq('enrollment_id', enrollmentId)
    .order('graded_at', { ascending: false });

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
