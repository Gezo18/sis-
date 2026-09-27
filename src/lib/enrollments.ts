import { supabase } from '../config/supabase';
import { Enrollment, PaginatedResponse, SingleResponse } from '../types';

export async function getEnrollmentsByStudent(
  studentId: string
): Promise<PaginatedResponse<Enrollment & { course?: { name: string; code: string } }>> {
  const { data, error, count } = await supabase
    .from('enrollments')
    .select('*, course:courses(name, code)', { count: 'exact' })
    .eq('student_id', studentId);

  return {
    data: (data ?? []) as (Enrollment & { course?: { name: string; code: string } })[],
    count: count ?? 0,
    error: error?.message ?? null,
  };
}

export async function enrollStudentInCourse(
  studentId: string,
  courseId: string
): Promise<SingleResponse<Enrollment>> {
  const { data, error } = await supabase
    .from('enrollments')
    .insert([
      {
        student_id: studentId,
        course_id: courseId,
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
