import { supabase } from '../config/supabase';
import { Enrollment, PaginatedResponse, SingleResponse } from '../types';

export async function getEnrollmentsByStudent(
  studentId: string,
  limit = 50,
  offset = 0
): Promise<PaginatedResponse<Enrollment & { course?: { name: string; code: string; credits: number } }>> {
  const { data, error, count } = await supabase
    .from('enrollments')
    .select('*, course:courses(name, code, credits)', { count: 'exact' })
    .eq('student_id', studentId)
    .order('enrolled_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return {
    data: (data ?? []) as (Enrollment & { course?: { name: string; code: string; credits: number } })[],
    count: count ?? 0,
    error: error?.message ?? null,
  };
}

export async function enrollStudentInCourse(
  studentId: string,
  courseId: string,
  semester = 'Spring 2026'
): Promise<SingleResponse<Enrollment>> {
  const { data, error } = await supabase
    .from('enrollments')
    .insert([
      {
        student_id: studentId,
        course_id: courseId,
        semester,
        enrolled_at: new Date().toISOString(),
        status: 'enrolled',
      },
    ])
    .select()
    .single();

  return {
    data: (data ?? null) as Enrollment | null,
    error: error?.message ?? null,
  };
}
