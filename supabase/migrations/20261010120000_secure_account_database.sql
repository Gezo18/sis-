-- Link SIS records to Supabase Auth, make the course catalog public, and
-- replace permissive policies with account-scoped least-privilege access.
-- Apply after the base schema and prior schema optimization migrations.

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS advisor_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL;
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_user_id
  ON public.students(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_students_advisor_teacher_id
  ON public.students(advisor_teacher_id);
CREATE INDEX IF NOT EXISTS idx_courses_published_catalog
  ON public.courses(department, level, semester, code) WHERE is_published;

-- Link existing rows to Auth users by their verified login email.
UPDATE public.students s
SET user_id = u.id
FROM auth.users u
WHERE s.user_id IS NULL
  AND lower(s.email) = lower(u.email);

UPDATE public.teachers t
SET user_id = u.id
FROM auth.users u
WHERE t.user_id IS NULL
  AND lower(t.email) = lower(u.email);

UPDATE public.admins a
SET user_id = u.id
FROM auth.users u
WHERE a.user_id IS NULL
  AND lower(a.email) = lower(u.email);

CREATE OR REPLACE FUNCTION public.create_student_profile_for_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  full_name TEXT := trim(COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''));
  first_name TEXT := split_part(trim(COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')), ' ', 1);
  parsed_level TEXT := regexp_replace(COALESCE(NEW.raw_user_meta_data ->> 'level', ''), '\D', '', 'g');
BEGIN
  IF COALESCE(NEW.raw_user_meta_data ->> 'role', '') <> 'student' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.students (
    user_id, student_id, first_name, last_name, email, student_program, level
  )
  VALUES (
    NEW.id,
    NULLIF(trim(NEW.raw_user_meta_data ->> 'student_id'), ''),
    first_name,
    trim(substr(full_name, length(first_name) + 1)),
    lower(NEW.email),
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'student_program'), ''),
             'Computer Science Technology Program'),
    CASE WHEN parsed_level IN ('1', '2', '3', '4', '5') THEN parsed_level::INTEGER ELSE 1 END
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_student_profile_after_auth_signup ON auth.users;
CREATE TRIGGER create_student_profile_after_auth_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_student_profile_for_auth_user();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.current_teacher_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT id FROM public.teachers WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_student_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT id FROM public.students WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_teacher_for_student(target_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = target_student_id
      AND s.advisor_teacher_id = public.current_teacher_id()
  ) OR EXISTS (
    SELECT 1
    FROM public.enrollments e
    JOIN public.courses c ON c.id = e.course_id
    WHERE e.student_id = target_student_id
      AND c.teacher_id = public.current_teacher_id()
  );
$$;

-- A permissive legacy policy ORs with every new policy, so remove all prior
-- policies on these tables before installing the restrictive policy set.
DO $$
DECLARE
  policy_row RECORD;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('admins', 'teachers', 'students', 'courses', 'enrollments',
                        'grades', 'attendance_records', 'student_requests', 'advisor_notes')
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  END LOOP;
END $$;

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_and_manage_admins" ON public.admins FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "teachers_public_directory" ON public.teachers FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "teachers_admin_manage" ON public.teachers FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "students_read_self_or_assigned_staff" ON public.students FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin() OR public.is_teacher_for_student(id));
CREATE POLICY "students_staff_update" ON public.students FOR UPDATE TO authenticated
  USING (public.is_admin() OR public.is_teacher_for_student(id))
  WITH CHECK (public.is_admin() OR public.is_teacher_for_student(id));
CREATE POLICY "students_admin_delete" ON public.students FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "courses_public_catalog" ON public.courses FOR SELECT TO anon, authenticated
  USING (is_published OR public.is_admin() OR teacher_id = public.current_teacher_id());
CREATE POLICY "courses_staff_insert" ON public.courses FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR teacher_id = public.current_teacher_id());
CREATE POLICY "courses_staff_update" ON public.courses FOR UPDATE TO authenticated
  USING (public.is_admin() OR teacher_id = public.current_teacher_id())
  WITH CHECK (public.is_admin() OR teacher_id = public.current_teacher_id());
CREATE POLICY "courses_staff_delete" ON public.courses FOR DELETE TO authenticated
  USING (public.is_admin() OR teacher_id = public.current_teacher_id());

CREATE POLICY "enrollments_read_self_or_staff" ON public.enrollments FOR SELECT TO authenticated
  USING (student_id = public.current_student_id() OR public.is_admin()
         OR EXISTS (SELECT 1 FROM public.courses c
                    WHERE c.id = enrollments.course_id AND c.teacher_id = public.current_teacher_id()));
CREATE POLICY "enrollments_insert_self_or_staff" ON public.enrollments FOR INSERT TO authenticated
  WITH CHECK (
    (student_id = public.current_student_id() AND EXISTS (
      SELECT 1 FROM public.courses c WHERE c.id = enrollments.course_id AND c.is_published
    ))
    OR public.is_admin()
    OR EXISTS (SELECT 1 FROM public.courses c
               WHERE c.id = enrollments.course_id AND c.teacher_id = public.current_teacher_id())
  );
CREATE POLICY "enrollments_staff_update" ON public.enrollments FOR UPDATE TO authenticated
  USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.courses c
                                      WHERE c.id = enrollments.course_id AND c.teacher_id = public.current_teacher_id()))
  WITH CHECK (public.is_admin() OR EXISTS (SELECT 1 FROM public.courses c
                                           WHERE c.id = enrollments.course_id AND c.teacher_id = public.current_teacher_id()));
CREATE POLICY "enrollments_staff_delete" ON public.enrollments FOR DELETE TO authenticated
  USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.courses c
                                      WHERE c.id = enrollments.course_id AND c.teacher_id = public.current_teacher_id()));

CREATE POLICY "grades_read_self_or_staff" ON public.grades FOR SELECT TO authenticated
  USING (public.is_admin() OR EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.id = grades.enrollment_id
      AND (e.student_id = public.current_student_id()
           OR EXISTS (SELECT 1 FROM public.courses c
                      WHERE c.id = e.course_id AND c.teacher_id = public.current_teacher_id()))
  ));
CREATE POLICY "grades_staff_insert" ON public.grades FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR EXISTS (
    SELECT 1 FROM public.enrollments e JOIN public.courses c ON c.id = e.course_id
    WHERE e.id = grades.enrollment_id AND c.teacher_id = public.current_teacher_id()
  ));
CREATE POLICY "grades_staff_update" ON public.grades FOR UPDATE TO authenticated
  USING (public.is_admin() OR EXISTS (
    SELECT 1 FROM public.enrollments e JOIN public.courses c ON c.id = e.course_id
    WHERE e.id = grades.enrollment_id AND c.teacher_id = public.current_teacher_id()
  ))
  WITH CHECK (public.is_admin() OR EXISTS (
    SELECT 1 FROM public.enrollments e JOIN public.courses c ON c.id = e.course_id
    WHERE e.id = grades.enrollment_id AND c.teacher_id = public.current_teacher_id()
  ));
CREATE POLICY "grades_staff_delete" ON public.grades FOR DELETE TO authenticated
  USING (public.is_admin() OR EXISTS (
    SELECT 1 FROM public.enrollments e JOIN public.courses c ON c.id = e.course_id
    WHERE e.id = grades.enrollment_id AND c.teacher_id = public.current_teacher_id()
  ));

CREATE POLICY "attendance_read_self_or_staff" ON public.attendance_records FOR SELECT TO authenticated
  USING (student_id = public.current_student_id() OR public.is_admin()
         OR public.is_teacher_for_student(student_id));
CREATE POLICY "attendance_staff_insert" ON public.attendance_records FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.is_teacher_for_student(student_id));
CREATE POLICY "attendance_staff_update" ON public.attendance_records FOR UPDATE TO authenticated
  USING (public.is_admin() OR public.is_teacher_for_student(student_id))
  WITH CHECK (public.is_admin() OR public.is_teacher_for_student(student_id));
CREATE POLICY "attendance_staff_delete" ON public.attendance_records FOR DELETE TO authenticated
  USING (public.is_admin() OR public.is_teacher_for_student(student_id));

CREATE POLICY "requests_read_self_or_staff" ON public.student_requests FOR SELECT TO authenticated
  USING (student_id = public.current_student_id() OR public.is_admin()
         OR public.is_teacher_for_student(student_id));
CREATE POLICY "requests_insert_self" ON public.student_requests FOR INSERT TO authenticated
  WITH CHECK (student_id = public.current_student_id()
              AND status IN ('Pending', 'Under Review')
              AND reviewed_by IS NULL AND reviewed_at IS NULL);
CREATE POLICY "requests_staff_update" ON public.student_requests FOR UPDATE TO authenticated
  USING (public.is_admin() OR public.is_teacher_for_student(student_id))
  WITH CHECK (public.is_admin() OR public.is_teacher_for_student(student_id));
CREATE POLICY "requests_admin_delete" ON public.student_requests FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "advisor_notes_staff_read" ON public.advisor_notes FOR SELECT TO authenticated
  USING (public.is_admin() OR public.is_teacher_for_student(student_id));
CREATE POLICY "advisor_notes_staff_insert" ON public.advisor_notes FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.is_teacher_for_student(student_id));
CREATE POLICY "advisor_notes_staff_update" ON public.advisor_notes FOR UPDATE TO authenticated
  USING (public.is_admin() OR public.is_teacher_for_student(student_id))
  WITH CHECK (public.is_admin() OR public.is_teacher_for_student(student_id));
CREATE POLICY "advisor_notes_staff_delete" ON public.advisor_notes FOR DELETE TO authenticated
  USING (public.is_admin() OR public.is_teacher_for_student(student_id));

REVOKE ALL ON public.admins, public.teachers, public.students, public.courses,
  public.enrollments, public.grades, public.attendance_records,
  public.student_requests, public.advisor_notes FROM anon, authenticated;
GRANT SELECT ON public.teachers, public.courses TO anon, authenticated;
GRANT SELECT ON public.students, public.enrollments, public.grades,
  public.attendance_records, public.student_requests, public.advisor_notes,
  public.admins TO authenticated;
GRANT INSERT ON public.enrollments, public.student_requests TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.teachers, public.courses, public.enrollments,
  public.grades, public.attendance_records, public.student_requests,
  public.advisor_notes, public.admins TO authenticated;
GRANT UPDATE, DELETE ON public.students TO authenticated;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_teacher_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_student_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_teacher_for_student(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_teacher_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_student_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_teacher_for_student(UUID) TO authenticated;
REVOKE ALL ON FUNCTION public.create_student_profile_for_auth_user() FROM PUBLIC, anon, authenticated;
