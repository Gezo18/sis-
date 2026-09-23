import React, { useState, useMemo } from 'react';
import { Course } from '../../types';
import { academicPlanCourses } from '../../data/mockData';
import { Search, Filter, BookOpen, Clock, Award, CheckCircle2, ChevronRight, X, Sparkles, Layers, User } from 'lucide-react';

interface Props {
  onOpenSisToRegister?: (courseCode: string) => void;
}

export const CourseCatalog: React.FC<Props> = ({ onOpenSisToRegister }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');
  const [selectedCourseModal, setSelectedCourseModal] = useState<Course | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);

  const departments = [
    { id: 'all', label: 'All Departments' },
    { id: 'Computer Science Technology', label: 'Computer Science Technology' },
    { id: 'Engineering Technology', label: 'Engineering Technology & Microcontrollers' },
    { id: 'Basic Sciences', label: 'Basic Sciences & Mathematics' },
    { id: 'Humanities', label: 'Humanities & Industrial Management' },
  ];

  const filteredCourses = useMemo(() => {
    return academicPlanCourses.filter((course) => {
      const matchesSearch =
        course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept =
        selectedDept === 'all' || course.department === selectedDept;

      const matchesLevel =
        selectedLevel === 'all' || course.level === selectedLevel;

      return matchesSearch && matchesDept && matchesLevel;
    });
  }, [searchQuery, selectedDept, selectedLevel]);

  const toggleWishlist = (courseCode: string) => {
    setWishlist(prev =>
      prev.includes(courseCode)
        ? prev.filter(c => c !== courseCode)
        : [...prev, courseCode]
    );
  };

  return (
    <div className="py-8 px-4 sm:px-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-[#202738] via-[#2b3b75] to-[#125875] text-white p-6 sm:p-8 rounded-xl shadow-md">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Undergraduate Academic Bulletin 2025/2026</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Elsewedy Polytechnic Course Catalog
          </h1>
          <p className="text-gray-200 text-sm leading-relaxed">
            Explore industrial-accredited courses designed in partnership with European polytechnic institutes and regional industrial leaders. Filter by level, department, prerequisites, and laboratory components.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search course title, code (e.g. CS102, MATH102, HUM231), or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Department dropdown */}
          <div className="w-full md:w-64">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full py-2 px-3 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 focus:ring-2 focus:ring-blue-500"
            >
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Level filter tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Levels' },
              { id: 1, label: 'Lvl 1' },
              { id: 2, label: 'Lvl 2' },
              { id: 3, label: 'Lvl 3' },
              { id: 4, label: 'Lvl 4' },
            ].map(lvl => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => setSelectedLevel(lvl.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                  selectedLevel === lvl.id
                    ? 'bg-[#0c4ca3] text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results count & Active filters info */}
        <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-100">
          <span>Showing <strong>{filteredCourses.length}</strong> courses</span>
          {wishlist.length > 0 && (
            <span className="text-[#0c4ca3] font-semibold">
              ★ {wishlist.length} courses in your saved list
            </span>
          )}
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCourses.map((course) => {
          const isWishlisted = wishlist.includes(course.code);

          return (
            <div
              key={course.id}
              className="bg-white border border-gray-200 hover:border-[#0c4ca3] hover:shadow-md transition-all rounded-xl p-5 flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-blue-50 text-[#0c4ca3] border border-blue-200">
                    {course.code}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                      Level {course.level} • Sem {course.semester}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleWishlist(course.code)}
                      className={`text-sm cursor-pointer p-1 transition-colors ${
                        isWishlisted ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'
                      }`}
                      title="Save to wishlist"
                    >
                      ★
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 text-base group-hover:text-[#0c4ca3] transition-colors leading-snug">
                  {course.title}
                </h3>
                <p className="text-[11.5px] text-gray-500 mt-0.5">{course.department}</p>

                <p className="text-gray-600 text-xs mt-3 line-clamp-3 leading-relaxed">
                  {course.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {course.creditHours} Credit Hours
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Lec: {course.lectureHours}h | Lab: {course.labHours}h
                  </span>
                </div>

                {course.prerequisites.length > 0 ? (
                  <div className="text-[11px] text-gray-500 truncate">
                    Prereq: <span className="font-mono text-gray-700 font-medium">{course.prerequisites.join(', ')}</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-gray-400">No prerequisites</div>
                )}

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCourseModal(course)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs py-1.5 px-3 rounded-lg font-semibold transition-colors cursor-pointer"
                  >
                    View Syllabus
                  </button>

                  {onOpenSisToRegister && (
                    <button
                      type="button"
                      onClick={() => onOpenSisToRegister(course.code)}
                      className="bg-[#6fa324] hover:bg-[#5f8e1e] text-white text-xs py-1.5 px-3 rounded-lg font-semibold transition-colors cursor-pointer"
                    >
                      Register in SIS
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Course Detail / Syllabus Modal */}
      {selectedCourseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full border border-gray-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#202738] text-white p-5 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-2 py-0.5 rounded">
                    {selectedCourseModal.code}
                  </span>
                  <span className="text-xs text-gray-400">
                    Level {selectedCourseModal.level} • Semester {selectedCourseModal.semester}
                  </span>
                </div>
                <h3 className="font-bold text-lg mt-1 text-white">{selectedCourseModal.title}</h3>
                <p className="text-xs text-cyan-200">{selectedCourseModal.department}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCourseModal(null)}
                className="text-white/70 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-gray-700 max-h-[70vh] overflow-y-auto">
              <div>
                <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-1">Course Description:</h4>
                <p className="leading-relaxed text-gray-600">{selectedCourseModal.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
                <div>
                  <span className="block text-gray-400 text-[10.5px]">Credit Hours</span>
                  <strong className="text-sm font-bold text-gray-800">{selectedCourseModal.creditHours} CH</strong>
                </div>
                <div>
                  <span className="block text-gray-400 text-[10.5px]">Lecture Hours</span>
                  <strong className="text-sm font-bold text-gray-800">{selectedCourseModal.lectureHours} hrs/wk</strong>
                </div>
                <div>
                  <span className="block text-gray-400 text-[10.5px]">Practical Lab</span>
                  <strong className="text-sm font-bold text-gray-800">{selectedCourseModal.labHours} hrs/wk</strong>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-1">Prerequisites:</h4>
                <p className="text-gray-600">
                  {selectedCourseModal.prerequisites.length > 0 ? (
                    <span className="font-mono font-semibold text-[#0c4ca3]">
                      {selectedCourseModal.prerequisites.join(' and ')}
                    </span>
                  ) : (
                    'None. Open for direct registration according to academic standing.'
                  )}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-2">Polytechnic Learning Modules:</h4>
                <ul className="space-y-1.5 list-disc pl-5 text-gray-600">
                  <li>Theoretical foundations and mathematical modeling principles.</li>
                  <li>Hands-on laboratory implementation on Elsewedy University testbenches.</li>
                  <li>Industrial standards compliance (IEEE / DIN / OSHA protocols).</li>
                  <li>Group project development and technical report presentation.</li>
                </ul>
              </div>

              <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCourseModal(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
