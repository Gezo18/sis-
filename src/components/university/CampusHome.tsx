import React from 'react';
import { StudentProfile } from '../../types';
import { campusEvents, campusNewsList } from '../../data/mockData';
import { BookOpen, Calendar, Newspaper, UserCheck, ChevronRight, Award, ShieldAlert, Sparkles, MapPin, ArrowRight, Factory } from 'lucide-react';

interface Props {
  student: StudentProfile;
  onOpenSis: () => void;
  onSelectTab: (tab: 'home' | 'catalog' | 'events' | 'news' | 'about') => void;
}

export const CampusHome: React.FC<Props> = ({ student, onOpenSis, onSelectTab }) => {
  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-b from-[#1b212f] via-[#202738] to-[#1a2333] text-white py-12 sm:py-20 px-4 sm:px-6">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#0db3c8_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#0db3c8] animate-pulse"></span>
              <span>Polytechnic of Egypt • Dual Technological Education</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              ELSEWEDY UNIVERSITY <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-blue-200 to-amber-300">
                OF TECHNOLOGY
              </span>
            </h1>

            <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              Egypt's foremost pioneer in applied technological engineering, preparing students for the Fourth Industrial Revolution in partnership with Elsewedy Electric and leading European technical education centers.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={onOpenSis}
                className="bg-[#6fa324] hover:bg-[#5f8e1e] text-white px-6 py-3 rounded-lg font-bold text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                Open Student Portal (SIS)
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('catalog')}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer backdrop-blur-xs"
              >
                <BookOpen className="w-4 h-4 text-cyan-300" />
                Browse Course Catalog
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('events')}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer backdrop-blur-xs"
              >
                <Calendar className="w-4 h-4 text-amber-300" />
                Campus Events
              </button>
            </div>
          </div>

          {/* Connected Student Active Card */}
          <div className="lg:col-span-5">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 text-gray-900 border border-white/40 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-[#0c4ca3] flex items-center justify-center font-bold text-sm">
                    {(student?.studentName || 'S').charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 line-clamp-1">{student?.studentName || 'Student Account'}</h3>
                    <p className="text-xs text-gray-500 font-mono">ID: {student?.studentId || '250103180'}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-amber-600" />
                  Warning ({student?.academicWarnings ?? 0})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-xl">
                <div>
                  <span className="text-gray-400 block text-[11px]">Program:</span>
                  <span className="font-semibold text-gray-800 line-clamp-1">{student?.studentProgram || 'Computer Science Technology'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Academic Level:</span>
                  <span className="font-semibold text-gray-800">{student?.level || 'Level 1'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Passed Credit Hours:</span>
                  <span className="font-bold text-gray-800">{(student?.totalPassedCH ?? 0).toFixed(1)} CH</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Cumulative GPA:</span>
                  <span className="font-bold text-red-700">{(student?.cgpa ?? 0).toFixed(2)} / 4.0</span>
                </div>
              </div>

              {/* Action alert */}
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                <div className="font-bold flex items-center gap-1.5">
                  <span>Action Required:</span>
                </div>
                <p className="text-[11.5px] mt-0.5">
                  1 course absence logged in HUM231 on Apr 22, 2026. Review and appeal in SIS.
                </p>
              </div>

              <button
                type="button"
                onClick={onOpenSis}
                className="w-full bg-[#202738] hover:bg-[#2b3b75] text-white py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
              >
                <span>Access Student Information System (SIS)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights: Quick Services Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={onOpenSis}
            className="p-5 bg-white border border-gray-200 rounded-xl shadow-xs hover:border-[#6fa324] hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#6fa324] flex items-center justify-center mb-3">
              <UserCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-gray-900 group-hover:text-[#6fa324]">SIS Student Portal</h4>
            <p className="text-xs text-gray-500 mt-1">
              Access your Academic Plan, grades, attendance logs, and online payment.
            </p>
          </div>

          <div
            onClick={() => onSelectTab('catalog')}
            className="p-5 bg-white border border-gray-200 rounded-xl shadow-xs hover:border-[#0c4ca3] hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0c4ca3] flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-gray-900 group-hover:text-[#0c4ca3]">Course Catalog</h4>
            <p className="text-xs text-gray-500 mt-1">
              Explore syllabus requirements, prerequisites, and laboratory hours.
            </p>
          </div>

          <div
            onClick={() => onSelectTab('events')}
            className="p-5 bg-white border border-gray-200 rounded-xl shadow-xs hover:border-amber-600 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Calendar className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-gray-900 group-hover:text-amber-600">Event Calendar</h4>
            <p className="text-xs text-gray-500 mt-1">
              Industrial fairs, hackathons, advising deadlines, and campus events.
            </p>
          </div>

          <div
            onClick={() => onSelectTab('news')}
            className="p-5 bg-white border border-gray-200 rounded-xl shadow-xs hover:border-purple-600 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <Newspaper className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-gray-900 group-hover:text-purple-600">Campus News</h4>
            <p className="text-xs text-gray-500 mt-1">
              Latest news, technical centers, and partnerships from Elsewedy SUT.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Events Calendar Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-end mb-6">
          <div>
            <span className="text-xs font-bold text-[#0c4ca3] uppercase tracking-wider">Campus Happenings</span>
            <h2 className="text-2xl font-black text-gray-900">Upcoming Events & Deadlines</h2>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('events')}
            className="text-xs font-bold text-[#0c4ca3] hover:underline flex items-center gap-1 cursor-pointer"
          >
            View All Events <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {campusEvents.slice(0, 3).map((evt) => (
            <div
              key={evt.id}
              onClick={() => onSelectTab('events')}
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs hover:border-[#0c4ca3] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="px-2 py-0.5 rounded font-bold bg-blue-100 text-[#0c4ca3]">
                    {evt.category}
                  </span>
                  <span className="text-gray-500 font-medium">{evt.date}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-sm line-clamp-2">{evt.title}</h3>
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{evt.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11.5px] text-gray-500">
                <span className="truncate">{evt.location}</span>
                <span className="text-[#0c4ca3] font-bold">Details →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Campus News Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-end mb-6">
          <div>
            <span className="text-xs font-bold text-[#0c4ca3] uppercase tracking-wider">Press & Bulletins</span>
            <h2 className="text-2xl font-black text-gray-900">University Announcements</h2>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('news')}
            className="text-xs font-bold text-[#0c4ca3] hover:underline flex items-center gap-1 cursor-pointer"
          >
            View News Archive <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {campusNewsList.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectTab('news')}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs hover:border-[#0c4ca3] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="h-44 overflow-hidden bg-gray-100">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <span className="text-[10.5px] font-bold text-gray-400">{item.date}</span>
                  <h3 className="font-bold text-gray-900 text-sm mt-1 line-clamp-2 hover:text-[#0c4ca3]">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                    {item.summary}
                  </p>
                </div>

                <div className="pt-3 text-[11px] font-bold text-[#0c4ca3] flex items-center gap-1">
                  Read More <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
