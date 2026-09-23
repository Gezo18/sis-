import React, { useState, useEffect, useMemo } from 'react';
import { StudentProfile, Course, UserAccount } from '../../types';
import { SisStudentDataCard } from './SisStudentDataCard';
import { academicPlanCourses } from '../../data/mockData';
import { userStore } from '../../data/userStore';
import { 
  CheckCircle2, Clock, Lock, Sparkles, Filter, Calculator, 
  BookOpen, Award, TrendingUp, AlertTriangle, ArrowRight, 
  RotateCcw, Save, ShieldAlert, ShieldCheck, Target, RefreshCw
} from 'lucide-react';

interface Props {
  student: StudentProfile;
  currentUser?: UserAccount | null;
  onDataUpdated?: () => void;
}

// SUT Polytechnic 4.0 Scale Grade Points Map
export const GRADE_POINTS: Record<string, number> = {
  'A+': 4.0,
  'A': 4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B': 3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C': 2.0,
  'C-': 1.7,
  'D+': 1.3,
  'D': 1.0,
  'F': 0.0,
};

export const GRADE_SCALE_TABLE = [
  { grade: 'A+', points: 4.0, range: '95% - 100%', label: 'Exceptional / Highest Distinction' },
  { grade: 'A',  points: 4.0, range: '90% - 94%',  label: 'Excellent' },
  { grade: 'A-', points: 3.7, range: '85% - 89%',  label: 'Very Good (High)' },
  { grade: 'B+', points: 3.3, range: '80% - 84%',  label: 'Very Good' },
  { grade: 'B',  points: 3.0, range: '75% - 79%',  label: 'Good (High)' },
  { grade: 'B-', points: 2.7, range: '70% - 74%',  label: 'Good' },
  { grade: 'C+', points: 2.3, range: '65% - 69%',  label: 'Satisfactory (High)' },
  { grade: 'C',  points: 2.0, range: '60% - 64%',  label: 'Pass / Minimum Graduation Standard' },
  { grade: 'C-', points: 1.7, range: '55% - 59%',  label: 'Conditional Pass (Below 2.00 threshold)' },
  { grade: 'D+', points: 1.3, range: '53% - 54%',  label: 'Marginal Pass' },
  { grade: 'D',  points: 1.0, range: '50% - 52%',  label: 'Bare Minimum Pass' },
  { grade: 'F',  points: 0.0, range: '< 50%',       label: 'Fail (0 Quality Points, counts in CGPA)' },
];

export const getGradePoint = (grade?: string): number | null => {
  if (!grade) return null;
  const clean = grade.trim().toUpperCase();
  return GRADE_POINTS[clean] !== undefined ? GRADE_POINTS[clean] : null;
};

export const SisAcademicPlan: React.FC<Props> = ({ student, currentUser, onDataUpdated }) => {
  const [courses, setCourses] = useState<Course[]>(() => {
    return currentUser?.courses && currentUser.courses.length > 0
      ? currentUser.courses
      : academicPlanCourses;
  });

  useEffect(() => {
    if (currentUser?.courses && currentUser.courses.length > 0) {
      setCourses(currentUser.courses);
    }
  }, [currentUser]);

  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Calculator panel state
  const [showGpaCalculator, setShowGpaCalculator] = useState(true);
  const [calculatorTab, setCalculatorTab] = useState<'history' | 'simulator' | 'target' | 'scale'>('history');
  
  // Interactive test override for historical grades (What-if grade retake / revision)
  const [gradeOverrides, setGradeOverrides] = useState<Record<string, string>>({});
  const [allowGradeOverrides, setAllowGradeOverrides] = useState(false);

  // Anticipated grades for registered / in-progress courses in simulator
  const [simulatedGrades, setSimulatedGrades] = useState<Record<string, string>>({
    cs102: 'B+',
    math102: 'B',
    hum231: 'A-',
    et104: 'B',
  });

  // Target CGPA Goal
  const [targetCgpa, setTargetCgpa] = useState<number>(2.0);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // 1. Calculate Historical GPA automatically from student's graded courses
  const {
    historicalCourses,
    totalHistoricalPoints,
    totalHistoricalGradedCH,
    totalPassedCH,
    computedHistoricalCgpa,
    semesterGroups,
  } = useMemo(() => {
    // Collect all courses that have a grade (or override) and are not currently registered
    const graded = courses.filter(c => {
      if (c.status === 'registered') return false;
      const currentGrade = allowGradeOverrides && gradeOverrides[c.id] ? gradeOverrides[c.id] : c.grade;
      return currentGrade && getGradePoint(currentGrade) !== null;
    });

    let pointsSum = 0;
    let gradedChSum = 0;
    let passedChSum = 0;

    const groups: Record<string, { label: string; level: number; semester: number; courses: Array<Course & { activeGrade: string; points: number; qualityPoints: number }>; ch: number; points: number; gpa: number }> = {};

    graded.forEach(c => {
      const activeGrade = allowGradeOverrides && gradeOverrides[c.id] ? gradeOverrides[c.id] : c.grade!;
      const pts = getGradePoint(activeGrade) ?? 0;
      const qualityPts = pts * c.creditHours;

      pointsSum += qualityPts;
      gradedChSum += c.creditHours;
      if (activeGrade !== 'F') {
        passedChSum += c.creditHours;
      }

      const key = `L${c.level}S${c.semester}`;
      if (!groups[key]) {
        groups[key] = {
          label: `Level ${c.level} • Semester ${c.semester}`,
          level: c.level,
          semester: c.semester,
          courses: [],
          ch: 0,
          points: 0,
          gpa: 0,
        };
      }

      groups[key].courses.push({
        ...c,
        activeGrade,
        points: pts,
        qualityPoints: qualityPts,
      });
      groups[key].ch += c.creditHours;
      groups[key].points += qualityPts;
    });

    Object.values(groups).forEach(g => {
      g.gpa = g.ch > 0 ? g.points / g.ch : 0;
    });

    const cgpa = gradedChSum > 0 ? pointsSum / gradedChSum : 0;

    return {
      historicalCourses: graded,
      totalHistoricalPoints: pointsSum,
      totalHistoricalGradedCH: gradedChSum,
      totalPassedCH: passedChSum,
      computedHistoricalCgpa: cgpa,
      semesterGroups: Object.values(groups).sort((a, b) => a.level !== b.level ? a.level - b.level : a.semester - b.semester),
    };
  }, [courses, gradeOverrides, allowGradeOverrides]);

  // 2. Calculate In-Progress / Registered Courses Simulation
  const registeredCourses = useMemo(() => courses.filter(c => c.status === 'registered'), [courses]);

  const {
    registeredCH,
    simulatedTermPoints,
    simulatedTermGpa,
    projectedTotalCH,
    projectedTotalPoints,
    projectedCgpa,
    cgpaDelta,
  } = useMemo(() => {
    let regCH = 0;
    let simPoints = 0;

    registeredCourses.forEach(c => {
      const grade = simulatedGrades[c.id] || 'B';
      const pts = getGradePoint(grade) ?? 3.0;
      regCH += c.creditHours;
      simPoints += pts * c.creditHours;
    });

    const termGpa = regCH > 0 ? simPoints / regCH : 0;
    const projCH = totalHistoricalGradedCH + regCH;
    const projPts = totalHistoricalPoints + simPoints;
    const projCgpa = projCH > 0 ? projPts / projCH : computedHistoricalCgpa;
    const delta = projCgpa - computedHistoricalCgpa;

    return {
      registeredCH: regCH,
      simulatedTermPoints: simPoints,
      simulatedTermGpa: termGpa,
      projectedTotalCH: projCH,
      projectedTotalPoints: projPts,
      projectedCgpa: projCgpa,
      cgpaDelta: delta,
    };
  }, [registeredCourses, simulatedGrades, totalHistoricalGradedCH, totalHistoricalPoints, computedHistoricalCgpa]);

  // 3. Target GPA Goal Calculation
  const targetAnalysis = useMemo(() => {
    if (registeredCH === 0) return null;
    const totalCHWithTerm = totalHistoricalGradedCH + registeredCH;
    const requiredTotalPoints = targetCgpa * totalCHWithTerm;
    const requiredTermPoints = requiredTotalPoints - totalHistoricalPoints;
    const requiredAvgGpa = requiredTermPoints / registeredCH;

    // Max possible if student gets straight 4.0 in current term
    const maxPossiblePoints = totalHistoricalPoints + (4.0 * registeredCH);
    const maxPossibleCgpa = maxPossiblePoints / totalCHWithTerm;

    return {
      requiredAvgGpa,
      maxPossibleCgpa,
      isAchievable: requiredAvgGpa <= 4.0,
      isAlreadyMet: requiredAvgGpa <= 0,
    };
  }, [targetCgpa, registeredCH, totalHistoricalGradedCH, totalHistoricalPoints]);

  // Sync auto-computed historical CGPA back to student profile in userStore
  const handleSyncComputedCgpa = () => {
    if (!student.studentId) return;
    const roundedCgpa = parseFloat(computedHistoricalCgpa.toFixed(2));
    const roundedPassed = parseFloat(totalPassedCH.toFixed(1));

    userStore.updateStudentCgpaAndCourses(student.studentId, roundedCgpa, roundedPassed, courses);
    if (onDataUpdated) {
      onDataUpdated();
    }
    setSyncSuccessMsg(`Profile synchronized! Official CGPA updated to ${roundedCgpa.toFixed(2)} with ${roundedPassed} passed credit hours.`);
    setTimeout(() => setSyncSuccessMsg(null), 4000);
  };

  // Helper to set preset grades for registered courses
  const applyPresetToRegistered = (presetGrade: string) => {
    const updated: Record<string, string> = {};
    registeredCourses.forEach(c => {
      updated[c.id] = presetGrade;
    });
    setSimulatedGrades(updated);
  };

  // Reset grade overrides
  const resetOverrides = () => {
    setGradeOverrides({});
    setAllowGradeOverrides(false);
  };

  // Academic Standing Helper
  const getStandingBadge = (gpa: number) => {
    if (gpa >= 3.6) {
      return { label: 'Highest Distinction (Honors)', bg: 'bg-purple-100 text-purple-900 border-purple-300' };
    }
    if (gpa >= 3.0) {
      return { label: 'Very Good Standing', bg: 'bg-blue-100 text-blue-900 border-blue-300' };
    }
    if (gpa >= 2.5) {
      return { label: 'Good Standing', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
    }
    if (gpa >= 2.0) {
      return { label: 'Satisfactory (Good Standing)', bg: 'bg-teal-100 text-teal-900 border-teal-300' };
    }
    return { label: 'Academic Warning / Probation (Under 2.00)', bg: 'bg-red-100 text-red-900 border-red-300' };
  };

  const filteredCourses = courses.filter(c => {
    if (selectedLevel !== 'all' && c.level !== selectedLevel) return false;
    if (selectedStatus !== 'all' && c.status !== selectedStatus) return false;
    return true;
  });

  return (
    <div className="flex-1 bg-white min-h-[calc(100vh-60px)] flex flex-col font-sans">
      {/* Top Banner: Dark charcoal bar with orange hamburger icon */}
      <div className="bg-[#5a626a] text-white px-4 py-2.5 flex items-center justify-between border-b border-[#444950] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1 w-5">
            <span className="h-0.5 w-full bg-[#f39c12] rounded-xs"></span>
            <span className="h-0.5 w-full bg-[#f39c12] rounded-xs"></span>
            <span className="h-0.5 w-full bg-[#f39c12] rounded-xs"></span>
          </div>
          <h2 className="text-[15px] font-bold tracking-wide text-gray-100">Student Academic Plan & GPA Calculator</h2>
        </div>

        <button
          type="button"
          onClick={() => setShowGpaCalculator(!showGpaCalculator)}
          className="bg-[#6fa324] hover:bg-[#5f8e1e] text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>{showGpaCalculator ? 'Hide GPA Calculator' : 'Open GPA Calculator'}</span>
        </button>
      </div>

      <div className="p-4 sm:p-5 space-y-4 max-w-6xl">
        {/* 1. Student Data Card */}
        <SisStudentDataCard student={student} />

        {/* Sync Success Alert */}
        {syncSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-sm text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{syncSuccessMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setSyncSuccessMsg(null)}
              className="text-emerald-700 hover:text-emerald-900 cursor-pointer text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* 2. AUTOMATED GPA CALCULATOR & ANALYZER PANEL */}
        {showGpaCalculator && (
          <div className="bg-[#fcfdfd] border-2 border-[#0c4ca3]/30 rounded-md shadow-sm overflow-hidden animate-in fade-in duration-150">
            {/* Calculator Header Ribbon */}
            <div className="bg-linear-to-r from-[#1c2c48] via-[#0c4ca3] to-[#125875] text-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <Calculator className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm sm:text-base text-white tracking-wide">
                        Cumulative GPA Calculator & Grade Analyzer
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10.5px] font-extrabold bg-amber-400 text-gray-950 uppercase tracking-wider">
                        Auto-Computed
                      </span>
                    </div>
                    <p className="text-xs text-blue-100">
                      Automated cumulative calculation from official student course history (SUT 4.0 Scale).
                    </p>
                  </div>
                </div>

                {/* Quick Profile Sync Button */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSyncComputedCgpa}
                    className="bg-[#6fa324] hover:bg-[#5f8e1e] text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    title="Synchronize this auto-computed CGPA to student profile in the database"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Apply Computed CGPA to Profile</span>
                  </button>
                </div>
              </div>

              {/* High-Level Overview Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-white/15 text-xs">
                {/* 1. Auto-Computed CGPA */}
                <div className="bg-white/10 backdrop-blur-xs p-3 rounded-lg border border-white/15">
                  <span className="text-blue-200 block text-[11px] font-medium">Computed CGPA (History):</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-black text-white">{computedHistoricalCgpa.toFixed(2)}</span>
                    <span className="text-xs text-blue-200">/ 4.00</span>
                  </div>
                  <span className="text-[10px] text-blue-200 block mt-0.5 truncate">
                    {totalHistoricalPoints.toFixed(1)} Pts ÷ {totalHistoricalGradedCH.toFixed(1)} CH
                  </span>
                </div>

                {/* 2. Official Record Profile CGPA */}
                <div className="bg-white/10 backdrop-blur-xs p-3 rounded-lg border border-white/15">
                  <span className="text-blue-200 block text-[11px] font-medium">Official Record CGPA:</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className={`text-2xl font-black ${
                      (student.cgpa || 0) < 2.0 ? 'text-amber-300' : 'text-emerald-300'
                    }`}>
                      {(student.cgpa || 0).toFixed(2)}
                    </span>
                    <span className="text-xs text-blue-200">/ 4.00</span>
                  </div>
                  <span className="text-[10px] text-blue-200 block mt-0.5">
                    {Math.abs(computedHistoricalCgpa - (student.cgpa || 0)) < 0.02 ? (
                      <span className="text-emerald-300 font-semibold">✓ Exactly Synced</span>
                    ) : (
                      <span className="text-amber-300 font-semibold">Ready to sync</span>
                    )}
                  </span>
                </div>

                {/* 3. Graded & Passed CH */}
                <div className="bg-white/10 backdrop-blur-xs p-3 rounded-lg border border-white/15">
                  <span className="text-blue-200 block text-[11px] font-medium">Total Passed Load:</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-black text-white">{totalPassedCH.toFixed(1)}</span>
                    <span className="text-xs text-blue-200">CH</span>
                  </div>
                  <span className="text-[10px] text-blue-200 block mt-0.5">
                    {historicalCourses.length} Completed Courses
                  </span>
                </div>

                {/* 4. Projected CGPA (with current term) */}
                <div className="bg-white/10 backdrop-blur-xs p-3 rounded-lg border border-white/15">
                  <span className="text-blue-200 block text-[11px] font-medium">Projected CGPA (Spring):</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className={`text-2xl font-black ${
                      projectedCgpa >= 2.0 ? 'text-emerald-300' : 'text-amber-300'
                    }`}>
                      {projectedCgpa.toFixed(2)}
                    </span>
                    <span className={`text-[11px] font-bold ${cgpaDelta >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                      {cgpaDelta >= 0 ? `+${cgpaDelta.toFixed(2)}` : cgpaDelta.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-[10px] text-blue-200 block mt-0.5 truncate">
                    With 4 In-Progress Courses
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-Tabs Bar */}
            <div className="flex flex-wrap border-b border-gray-200 bg-gray-50 text-xs font-bold">
              <button
                type="button"
                onClick={() => setCalculatorTab('history')}
                className={`px-4 py-2.5 flex items-center gap-2 cursor-pointer transition-colors border-b-2 ${
                  calculatorTab === 'history'
                    ? 'border-[#0c4ca3] text-[#0c4ca3] bg-white'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Automatic Course History ({historicalCourses.length} Graded)</span>
              </button>

              <button
                type="button"
                onClick={() => setCalculatorTab('simulator')}
                className={`px-4 py-2.5 flex items-center gap-2 cursor-pointer transition-colors border-b-2 ${
                  calculatorTab === 'simulator'
                    ? 'border-[#0c4ca3] text-[#0c4ca3] bg-white'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>What-If Term Simulator ({registeredCourses.length} Registered)</span>
              </button>

              <button
                type="button"
                onClick={() => setCalculatorTab('target')}
                className={`px-4 py-2.5 flex items-center gap-2 cursor-pointer transition-colors border-b-2 ${
                  calculatorTab === 'target'
                    ? 'border-[#0c4ca3] text-[#0c4ca3] bg-white'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Target className="w-3.5 h-3.5 text-red-600" />
                <span>Target GPA Goal Seeker</span>
              </button>

              <button
                type="button"
                onClick={() => setCalculatorTab('scale')}
                className={`px-4 py-2.5 flex items-center gap-2 cursor-pointer transition-colors border-b-2 ${
                  calculatorTab === 'scale'
                    ? 'border-[#0c4ca3] text-[#0c4ca3] bg-white'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>SUT 4.0 Grading Scale</span>
              </button>
            </div>

            {/* TAB CONTENT 1: AUTOMATIC COURSE HISTORY BREAKDOWN */}
            {calculatorTab === 'history' && (
              <div className="p-4 sm:p-5 space-y-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50/60 p-3 rounded border border-blue-200">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                      <span>Formula Breakdown:</span>
                      <code className="bg-white px-2 py-0.5 rounded font-mono text-xs border border-blue-300 text-[#0c4ca3]">
                        Cumulative GPA = Total Quality Points ÷ Total Graded Credit Hours
                      </code>
                    </h4>
                    <p className="text-gray-600 mt-1 text-[11.5px]">
                      Calculation:{' '}
                      <strong className="text-gray-900">{totalHistoricalPoints.toFixed(2)} Quality Points</strong> ÷{' '}
                      <strong className="text-gray-900">{totalHistoricalGradedCH.toFixed(1)} Graded CH</strong> ={' '}
                      <strong className="text-[#0c4ca3] font-bold text-sm">{computedHistoricalCgpa.toFixed(2)} CGPA</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAllowGradeOverrides(!allowGradeOverrides)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer border transition-colors ${
                        allowGradeOverrides
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {allowGradeOverrides ? 'Disable Grade Revision Mode' : 'Simulate Course Retake / Revision'}
                    </button>
                    {allowGradeOverrides && (
                      <button
                        type="button"
                        onClick={resetOverrides}
                        className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-medium cursor-pointer"
                        title="Reset to official recorded grades"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {allowGradeOverrides && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-[11.5px] text-amber-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>Simulation Mode Active:</strong> You can modify individual course grades below to test how repeating a course or grade revision influences your cumulative GPA.
                    </span>
                  </div>
                )}

                {/* Semester by Semester Graded Breakdown */}
                <div className="space-y-4">
                  {semesterGroups.map((group) => (
                    <div key={group.label} className="border border-gray-200 rounded overflow-hidden">
                      <div className="bg-[#edf1f5] px-3.5 py-2 flex flex-wrap items-center justify-between border-b border-gray-300 font-bold text-gray-800">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#0c4ca3]"></span>
                          <span>{group.label}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-semibold">
                          <span>Term Load: <strong>{group.ch} CH</strong></span>
                          <span>Term Quality Points: <strong>{group.points.toFixed(1)}</strong></span>
                          <span className="bg-[#0c4ca3] text-white px-2 py-0.5 rounded text-[11px]">
                            Term GPA: {group.gpa.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                            <tr>
                              <th className="p-2 w-20">Code</th>
                              <th className="p-2">Course Title</th>
                              <th className="p-2 text-center w-16">CH</th>
                              <th className="p-2 text-center w-24">Letter Grade</th>
                              <th className="p-2 text-center w-20">Points</th>
                              <th className="p-2 text-right w-28">Quality Points</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {group.courses.map((course) => (
                              <tr key={course.id} className="hover:bg-blue-50/30">
                                <td className="p-2 font-mono font-bold text-[#0c4ca3]">{course.code}</td>
                                <td className="p-2 text-gray-800 font-medium">{course.title}</td>
                                <td className="p-2 text-center text-gray-700">{course.creditHours}</td>
                                <td className="p-2 text-center font-bold">
                                  {allowGradeOverrides ? (
                                    <select
                                      value={course.activeGrade}
                                      onChange={(e) => {
                                        setGradeOverrides(prev => ({
                                          ...prev,
                                          [course.id]: e.target.value,
                                        }));
                                      }}
                                      className="bg-white border border-gray-300 rounded px-1.5 py-0.5 text-xs font-bold text-gray-800"
                                    >
                                      {Object.keys(GRADE_POINTS).map(g => (
                                        <option key={g} value={g}>{g} ({GRADE_POINTS[g].toFixed(1)})</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <span className={`px-2 py-0.5 rounded text-xs ${
                                      course.activeGrade.startsWith('A') ? 'bg-emerald-100 text-emerald-800' :
                                      course.activeGrade.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                                      course.activeGrade.startsWith('C') ? 'bg-amber-100 text-amber-900' :
                                      'bg-red-100 text-red-900'
                                    }`}>
                                      {course.activeGrade}
                                    </span>
                                  )}
                                </td>
                                <td className="p-2 text-center text-gray-600 font-mono">
                                  {course.points.toFixed(1)}
                                </td>
                                <td className="p-2 text-right font-mono font-bold text-gray-900">
                                  {course.qualityPoints.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50 border-t border-gray-200 font-semibold text-gray-700">
                            <tr>
                              <td colSpan={2} className="p-2 text-right">Semester Total:</td>
                              <td className="p-2 text-center">{group.ch} CH</td>
                              <td></td>
                              <td></td>
                              <td className="p-2 text-right font-mono font-bold text-[#0c4ca3]">
                                {group.points.toFixed(2)} Pts
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: WHAT-IF TERM SIMULATOR */}
            {calculatorTab === 'simulator' && (
              <div className="p-4 sm:p-5 space-y-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-50/60 p-3 rounded border border-indigo-200">
                  <div>
                    <h4 className="font-bold text-indigo-950 text-sm">
                      Spring 2026 In-Progress Courses ({student?.registeredCH ?? registeredCourses.reduce((sum, c) => sum + c.creditHours, 0)} CH)
                    </h4>
                    <p className="text-indigo-800 text-[11.5px] mt-0.5">
                      Anticipate your final exam grades for the active registered courses to calculate projected cumulative GPA:
                    </p>
                  </div>

                  {/* Fast Presets */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-gray-500 mr-1">Presets:</span>
                    <button
                      type="button"
                      onClick={() => applyPresetToRegistered('A')}
                      className="px-2 py-0.5 rounded bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[11px] cursor-pointer"
                    >
                      Straight A's (4.0)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetToRegistered('B+')}
                      className="px-2 py-0.5 rounded bg-white hover:bg-blue-50 text-blue-800 border border-blue-300 font-bold text-[11px] cursor-pointer"
                    >
                      B+ Average (3.3)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetToRegistered('B')}
                      className="px-2 py-0.5 rounded bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 font-bold text-[11px] cursor-pointer"
                    >
                      B Average (3.0)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetToRegistered('C+')}
                      className="px-2 py-0.5 rounded bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 font-bold text-[11px] cursor-pointer"
                    >
                      C+ (2.3)
                    </button>
                  </div>
                </div>

                {/* Simulator Projected Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <span className="text-gray-500 block text-[11px]">Current Baseline CGPA:</span>
                    <span className="text-xl font-black text-gray-800">{computedHistoricalCgpa.toFixed(2)}</span>
                    <span className="text-[10.5px] text-gray-500 block">Based on {(student?.totalPassedCH ?? 0).toFixed(1)} Passed CH</span>
                  </div>

                  <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/70">
                    <span className="text-blue-700 block text-[11px] font-medium">Projected Spring Term GPA:</span>
                    <span className="text-xl font-black text-[#0c4ca3]">{simulatedTermGpa.toFixed(2)}</span>
                    <span className="text-[10.5px] text-blue-600 block">
                      {simulatedTermPoints.toFixed(1)} Points from {(student?.registeredCH ?? registeredCourses.reduce((sum, c) => sum + c.creditHours, 0))} Registered CH
                    </span>
                  </div>

                  <div className={`p-3 rounded-lg border ${
                    projectedCgpa >= 2.0 ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'
                  }`}>
                    <span className="block text-[11px] font-medium text-gray-700">Projected Cumulative GPA:</span>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl font-black ${
                        projectedCgpa >= 2.0 ? 'text-emerald-800' : 'text-red-800'
                      }`}>
                        {projectedCgpa.toFixed(2)}
                      </span>
                      <span className={`font-bold text-xs ${cgpaDelta >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        ({cgpaDelta >= 0 ? `+${cgpaDelta.toFixed(2)}` : cgpaDelta.toFixed(2)})
                      </span>
                    </div>
                    <span className={`text-[10.5px] font-bold block ${
                      projectedCgpa >= 2.0 ? 'text-emerald-700' : 'text-red-700'
                    }`}>
                      {projectedCgpa >= 2.0 ? '✓ Clears Academic Probation' : '✕ Warning: Remains below 2.00 threshold'}
                    </span>
                  </div>
                </div>

                {/* Courses Interactive Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {registeredCourses.map(course => {
                    const currentGrade = simulatedGrades[course.id] || 'B';
                    const pts = getGradePoint(currentGrade) ?? 3.0;

                    return (
                      <div key={course.id} className="p-3 bg-white border border-gray-300 rounded-md shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-[#0c4ca3] text-sm">{course.code}</span>
                          <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold text-[11px]">
                            {course.creditHours} CH
                          </span>
                        </div>
                        <p className="text-gray-800 font-medium text-xs line-clamp-1">{course.title}</p>
                        
                        <div>
                          <label className="block text-[11px] text-gray-500 font-semibold mb-1">Target Grade:</label>
                          <select
                            value={currentGrade}
                            onChange={(e) => {
                              setSimulatedGrades(prev => ({
                                ...prev,
                                [course.id]: e.target.value,
                              }));
                            }}
                            className="w-full bg-gray-50 border border-gray-300 rounded px-2 py-1 text-xs font-bold text-gray-800 focus:ring-2 focus:ring-[#0c4ca3]"
                          >
                            {Object.keys(GRADE_POINTS).map(g => (
                              <option key={g} value={g}>
                                {g} ({GRADE_POINTS[g].toFixed(1)})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="pt-2 border-t border-gray-100 flex justify-between text-[11px] text-gray-500">
                          <span>Quality Pts:</span>
                          <strong className="text-gray-800 font-mono">{(pts * course.creditHours).toFixed(1)} Pts</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: TARGET GPA GOAL SEEKER */}
            {calculatorTab === 'target' && (
              <div className="p-4 sm:p-5 space-y-4 text-xs">
                <div className="bg-amber-50/60 border border-amber-200 p-3.5 rounded">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-red-600" />
                    <span>Academic Goal Seeker: What average do I need this term?</span>
                  </h4>
                  <p className="text-gray-600 text-[11.5px] mt-0.5">
                    Select your desired cumulative GPA after this semester. The calculator computes the exact average grade point required across your 11 registered credit hours.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-gray-700">Quick Target Goals:</span>
                  {[
                    { label: '2.00 (Clear Probation)', value: 2.0 },
                    { label: '2.25 (Safe Margin)', value: 2.25 },
                    { label: '2.50 (Good Standing)', value: 2.50 },
                    { label: '3.00 (Very Good)', value: 3.0 },
                    { label: '3.40 (Honors Track)', value: 3.4 },
                  ].map(item => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setTargetCgpa(item.value)}
                      className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${
                        targetCgpa === item.value
                          ? 'bg-[#0c4ca3] text-white shadow-2xs'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}

                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="text-gray-500 font-medium">Custom Target:</span>
                    <input
                      type="number"
                      step="0.05"
                      min="1.0"
                      max="4.0"
                      value={targetCgpa}
                      onChange={(e) => setTargetCgpa(parseFloat(e.target.value) || 2.0)}
                      className="w-16 bg-white border border-gray-300 rounded px-2 py-0.5 font-bold text-xs"
                    />
                  </div>
                </div>

                {targetAnalysis && (
                  <div className="p-4 bg-white border border-gray-300 rounded-lg shadow-2xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between pb-3 border-b border-gray-200">
                      <div>
                        <span className="text-gray-500 text-[11px] block">Target Cumulative GPA:</span>
                        <span className="text-2xl font-black text-[#0c4ca3]">{targetCgpa.toFixed(2)}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-gray-500 text-[11px] block">Required Term GPA Average:</span>
                        <span className={`text-2xl font-black ${
                          targetAnalysis.isAchievable ? 'text-emerald-700' : 'text-red-700'
                        }`}>
                          {targetAnalysis.isAlreadyMet ? '0.00' : targetAnalysis.requiredAvgGpa.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs">
                      {targetAnalysis.isAlreadyMet ? (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 font-medium flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            You have already achieved this cumulative GPA! Even with minimum passing grades, your CGPA will remain above {targetCgpa.toFixed(2)}.
                          </span>
                        </div>
                      ) : targetAnalysis.isAchievable ? (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-900 font-medium space-y-1">
                          <p className="font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                            <span>Target is Achievable This Semester!</span>
                          </p>
                          <p className="text-[11.5px] text-blue-800">
                            You need an average of at least <strong>{targetAnalysis.requiredAvgGpa.toFixed(2)} Grade Points</strong> (approx.{' '}
                            <strong>
                              {targetAnalysis.requiredAvgGpa >= 3.7 ? 'A- / A' :
                               targetAnalysis.requiredAvgGpa >= 3.3 ? 'B+ / A-' :
                               targetAnalysis.requiredAvgGpa >= 3.0 ? 'B / B+' :
                               targetAnalysis.requiredAvgGpa >= 2.7 ? 'B- / B' :
                               targetAnalysis.requiredAvgGpa >= 2.3 ? 'C+ / B-' :
                               targetAnalysis.requiredAvgGpa >= 2.0 ? 'C / C+' : 'C-'}
                            </strong>
                            ) across all 4 registered courses (11 Credit Hours).
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-900 font-medium space-y-1">
                          <p className="font-bold flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span>Target Mathematically Unattainable in a Single Semester</span>
                          </p>
                          <p className="text-[11.5px] text-red-800">
                            Reaching a {targetCgpa.toFixed(2)} CGPA this term would require an average of <strong>{targetAnalysis.requiredAvgGpa.toFixed(2)}</strong> (higher than the 4.00 maximum).
                            The absolute maximum achievable CGPA with straight A+ grades across all 11 CH is <strong>{targetAnalysis.maxPossibleCgpa.toFixed(2)}</strong>.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 4: SUT 4.0 SCALE REFERENCE */}
            {calculatorTab === 'scale' && (
              <div className="p-4 sm:p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <h4 className="font-bold text-gray-900 text-sm">
                    Elsewedy University of Technology - Official Polytechnic Grading Scale
                  </h4>
                  <span className="text-[11px] text-gray-500">
                    Dual German Technical Accreditation Standards
                  </span>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#edf1f5] text-gray-700 font-bold border-b border-gray-300">
                      <tr>
                        <th className="p-2 w-20">Letter Grade</th>
                        <th className="p-2 text-center w-24">Quality Points</th>
                        <th className="p-2 text-center w-28">Percentage</th>
                        <th className="p-2">Academic Standing / Definition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {GRADE_SCALE_TABLE.map((row) => (
                        <tr key={row.grade} className="hover:bg-gray-50">
                          <td className="p-2 font-mono font-bold text-[#0c4ca3]">{row.grade}</td>
                          <td className="p-2 text-center font-bold text-gray-800 font-mono">{row.points.toFixed(1)}</td>
                          <td className="p-2 text-center text-gray-600">{row.range}</td>
                          <td className="p-2 font-medium text-gray-800">{row.label}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. Academic Plan Description Header Band */}
        <div className="bg-[#fcfdfd] border border-[#d2d7de] rounded-sm shadow-xs overflow-hidden">
          <div className="bg-[#d5d9df] text-gray-800 px-4 py-2 border-b border-[#cbd0d8] grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-bold">
            <div>
              <span className="text-[#333]">Description (EN)</span>
              <p className="font-semibold text-gray-900 mt-0.5 text-xs">
                {student.studentProgram} - 2023
              </p>
            </div>
            <div className="text-left md:text-right" dir="rtl">
              <span className="text-[#333]">Description (AR)</span>
              <p className="font-semibold text-gray-900 mt-0.5 text-xs font-arabic">
                {student.studentProgramAr}
              </p>
            </div>
          </div>

          {/* Interactive Filters Toolbar */}
          <div className="p-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-gray-600 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Level Filter:
              </span>
              {[
                { id: 'all', label: 'All Levels' },
                { id: 1, label: 'Level 1 (Current)' },
                { id: 2, label: 'Level 2' },
                { id: 3, label: 'Level 3' },
                { id: 4, label: 'Level 4' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setSelectedLevel(lvl.id as any)}
                  className={`px-2.5 py-1 rounded text-xs cursor-pointer transition-colors ${
                    selectedLevel === lvl.id
                      ? 'bg-[#6fa324] text-white font-bold'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-medium">Status Filter:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 font-medium"
              >
                <option value="all">All Courses ({courses.length})</option>
                <option value="passed">Passed ({courses.filter(c => c.status === 'passed').length})</option>
                <option value="registered">Registered ({courses.filter(c => c.status === 'registered').length})</option>
                <option value="available">Available ({courses.filter(c => c.status === 'available').length})</option>
                <option value="locked">Locked ({courses.filter(c => c.status === 'locked').length})</option>
              </select>
            </div>
          </div>

          {/* Academic Plan Courses Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#edf1f5] text-[#2c3239] border-b border-gray-300 font-bold">
                <tr>
                  <th className="p-2.5 w-12 text-center">Lvl</th>
                  <th className="p-2.5 w-12 text-center">Sem</th>
                  <th className="p-2.5 w-24">Code</th>
                  <th className="p-2.5 min-w-[220px]">Course Title</th>
                  <th className="p-2.5 w-16 text-center">CH</th>
                  <th className="p-2.5 w-28">Prerequisites</th>
                  <th className="p-2.5 w-28 text-center">Status</th>
                  <th className="p-2.5 w-20 text-center">Grade</th>
                  <th className="p-2.5 w-24 text-right">Quality Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCourses.map((course) => {
                  const isPassed = course.status === 'passed';
                  const isRegistered = course.status === 'registered';
                  const isAvailable = course.status === 'available';
                  const isLocked = course.status === 'locked';
                  const gradePoint = getGradePoint(course.grade);
                  const qualityPoints = gradePoint !== null ? (gradePoint * course.creditHours).toFixed(1) : null;

                  return (
                    <tr
                      key={course.id}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        isRegistered ? 'bg-amber-50/40 font-medium' : isPassed ? 'bg-white' : 'bg-gray-50/40'
                      }`}
                    >
                      <td className="p-2.5 text-center font-semibold text-gray-600">
                        {course.level}
                      </td>
                      <td className="p-2.5 text-center text-gray-500">
                        {course.semester}
                      </td>
                      <td className="p-2.5 font-bold font-mono text-[#0c4ca3]">
                        {course.code}
                      </td>
                      <td className="p-2.5 text-gray-800">
                        <div>
                          <span className="font-medium">{course.title}</span>
                          <span className="text-[10px] text-gray-500 ml-1.5">({course.department})</span>
                        </div>
                      </td>
                      <td className="p-2.5 text-center font-semibold text-gray-700">
                        {course.creditHours}
                      </td>
                      <td className="p-2.5 text-gray-500">
                        {course.prerequisites.length > 0 ? (
                          <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-mono text-[11px]">
                            {course.prerequisites.join(', ')}
                          </span>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </td>
                      <td className="p-2.5 text-center">
                        {isPassed && (
                          <span className="px-2 py-0.5 text-[10.5px] font-bold rounded bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Passed
                          </span>
                        )}
                        {isRegistered && (
                          <span className="px-2 py-0.5 text-[10.5px] font-bold rounded bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Registered
                          </span>
                        )}
                        {isAvailable && (
                          <span className="px-2 py-0.5 text-[10.5px] font-medium rounded bg-blue-100 text-blue-800 inline-flex items-center gap-1">
                            Available
                          </span>
                        )}
                        {isLocked && (
                          <span className="px-2 py-0.5 text-[10.5px] font-medium rounded bg-gray-200 text-gray-600 inline-flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            Locked
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-center font-bold">
                        {course.grade ? (
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            course.grade.startsWith('A') ? 'text-emerald-700 bg-emerald-50' :
                            course.grade.startsWith('B') ? 'text-blue-700 bg-blue-50' :
                            'text-amber-800 bg-amber-50'
                          }`}>
                            {course.grade}
                          </span>
                        ) : isRegistered ? (
                          <span className="text-gray-400 text-[11px] italic">In Progress</span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="p-2.5 text-right font-mono text-gray-700">
                        {qualityPoints !== null ? (
                          <span className="font-semibold">{qualityPoints}</span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Academic Plan Summary Footer */}
          <div className="bg-[#edf1f5] px-4 py-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-700 font-medium">
            <div className="flex flex-wrap items-center gap-4">
              <span>Required for Graduation: <strong>136 CH</strong></span>
              <span>Passed: <strong className="text-emerald-700">{totalPassedCH.toFixed(1)} CH</strong></span>
              <span>Registered Now: <strong className="text-amber-800">{registeredCH.toFixed(1)} CH</strong></span>
              <span>Total Points: <strong className="text-[#0c4ca3]">{totalHistoricalPoints.toFixed(1)} Pts</strong></span>
              <span>Computed CGPA: <strong className="text-[#0c4ca3] font-bold">{computedHistoricalCgpa.toFixed(2)}</strong></span>
            </div>
            <div className="text-gray-500 text-[11px]">
              Polytechnic Dual Engineering Accreditation • Egyptian Supreme Council of Universities
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
