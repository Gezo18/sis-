import React, { useState } from 'react';
import { CampusEvent } from '../../types';
import { campusEvents } from '../../data/mockData';
import { Calendar, Clock, MapPin, Tag, Users, CheckCircle2, Download, Share2, ChevronLeft, ChevronRight } from 'lucide-react';

export const EventCalendar: React.FC = () => {
  const [events, setEvents] = useState<CampusEvent[]>(campusEvents);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedEventModal, setSelectedEventModal] = useState<CampusEvent | null>(null);
  const [rsvpEvents, setRsvpEvents] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState<string>('October 2026');

  const categories = ['All', 'Academic', 'Workshop', 'Career', 'Sports'];

  const filteredEvents = events.filter(e => {
    if (selectedCategory === 'All') return true;
    return e.category === selectedCategory;
  });

  const toggleRsvp = (eventId: string) => {
    setRsvpEvents(prev =>
      prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]
    );
  };

  const handleDownloadIcs = (event: CampusEvent) => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Elsewedy University of Technology//Campus Events//EN
BEGIN:VEVENT
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location}
DTSTART:${event.date.replace(/-/g, '')}T090000Z
DTEND:${event.date.replace(/-/g, '')}T170000Z
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Days in calendar month (October 2026: Oct 1 is Thursday)
  const daysInOctober = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="py-8 px-4 sm:px-6 max-w-7xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-linear-to-r from-[#202738] via-[#2b3b75] to-[#842646] text-white p-6 sm:p-8 rounded-xl shadow-md">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30 text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            <span>Campus News & Events Schedule • 2026/2027</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Elsewedy Polytechnic Event Calendar
          </h1>
          <p className="text-gray-200 text-sm leading-relaxed">
            Stay up to date with Elsewedy Electric industrial fairs, hackathons, academic milestone deadlines, guest lectures, and student union athletic competitions.
          </p>
        </div>
      </div>

      {/* Control bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Category filters */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-semibold text-gray-500 mr-1 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" /> Category:
          </span>
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#0c4ca3] text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="bg-gray-100 p-1 rounded-lg flex gap-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 rounded-md cursor-pointer transition-colors ${
                viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600'
              }`}
            >
              Month Calendar
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md cursor-pointer transition-colors ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600'
              }`}
            >
              List View
            </button>
          </div>
        </div>
      </div>

      {/* View 1: Calendar Grid View */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-gray-800">{currentMonth}</h3>
              <span className="text-xs text-gray-500">Academic Term 1</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <button
                type="button"
                onClick={() => setCurrentMonth('September 2026')}
                className="p-1.5 hover:bg-gray-100 rounded-md cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentMonth('October 2026')}
                className="p-1.5 hover:bg-gray-100 rounded-md cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-gray-500 py-1">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* 4 offset days for October 2026 */}
            <div className="h-24 sm:h-28 p-1.5 bg-gray-50/50 rounded-lg text-gray-300 text-xs">27</div>
            <div className="h-24 sm:h-28 p-1.5 bg-gray-50/50 rounded-lg text-gray-300 text-xs">28</div>
            <div className="h-24 sm:h-28 p-1.5 bg-gray-50/50 rounded-lg text-gray-300 text-xs">29</div>
            <div className="h-24 sm:h-28 p-1.5 bg-gray-50/50 rounded-lg text-gray-300 text-xs">30</div>

            {daysInOctober.map(day => {
              const dayStr = `2026-10-${day < 10 ? '0' + day : day}`;
              const dayEvents = filteredEvents.filter(e => e.date === dayStr);

              return (
                <div
                  key={day}
                  className={`h-24 sm:h-28 p-1.5 border rounded-lg flex flex-col justify-between transition-colors ${
                    dayEvents.length > 0 ? 'bg-blue-50/20 border-blue-200 hover:border-blue-400' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <span className="font-semibold text-xs text-gray-700">{day}</span>
                  <div className="space-y-1 overflow-y-auto max-h-16">
                    {dayEvents.map(evt => (
                      <div
                        key={evt.id}
                        onClick={() => setSelectedEventModal(evt)}
                        className={`text-[10px] p-1 rounded font-medium truncate cursor-pointer transition-transform hover:scale-[1.02] ${
                          evt.category === 'Career' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                          evt.category === 'Workshop' ? 'bg-cyan-100 text-cyan-900 border border-cyan-300' :
                          evt.category === 'Sports' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                          'bg-purple-100 text-purple-900 border border-purple-300'
                        }`}
                        title={evt.title}
                      >
                        {evt.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View 2: List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filteredEvents.map(event => {
            const hasRsvp = rsvpEvents.includes(event.id);

            return (
              <div
                key={event.id}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs hover:border-[#0c4ca3] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-[#0c4ca3]">
                      {event.category}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {event.date}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {event.time}
                    </span>
                  </div>

                  <h3
                    onClick={() => setSelectedEventModal(event)}
                    className="text-base font-bold text-gray-900 hover:text-[#0c4ca3] cursor-pointer transition-colors"
                  >
                    {event.title}
                  </h3>

                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>

                  <div className="text-[11.5px] text-gray-500 flex items-center gap-1.5 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span>{event.location}</span>
                    <span className="text-gray-300">•</span>
                    <span>Organizer: <strong>{event.organizer}</strong></span>
                  </div>
                </div>

                <div className="flex sm:flex-col gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleRsvp(event.id)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                      hasRsvp
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-[#0c4ca3] hover:bg-[#093d84] text-white'
                    }`}
                  >
                    {hasRsvp ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        RSVP Confirmed
                      </>
                    ) : (
                      'RSVP / Attend'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadIcs(event)}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Add to Calendar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEventModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-gray-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#202738] text-white p-5 flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-400 text-gray-950">
                  {selectedEventModal.category}
                </span>
                <h3 className="font-bold text-lg mt-2 text-white">{selectedEventModal.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEventModal(null)}
                className="text-white/70 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-gray-700">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div>
                  <span className="text-gray-400 text-[11px] block">Date:</span>
                  <strong className="text-gray-800 font-semibold">{selectedEventModal.date}</strong>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block">Time:</span>
                  <strong className="text-gray-800 font-semibold">{selectedEventModal.time}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400 text-[11px] block">Location:</span>
                  <strong className="text-gray-800 font-semibold flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    {selectedEventModal.location}
                  </strong>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] mb-1">Event Summary:</h4>
                <p className="leading-relaxed text-gray-600">{selectedEventModal.description}</p>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] mb-1">Organizing Body:</h4>
                <p className="text-gray-600">{selectedEventModal.organizer}</p>
              </div>

              <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => handleDownloadIcs(selectedEventModal)}
                  className="text-[#0c4ca3] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Save Event (.ics)
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => toggleRsvp(selectedEventModal.id)}
                    className={`px-4 py-2 rounded-lg font-semibold cursor-pointer transition-colors ${
                      rsvpEvents.includes(selectedEventModal.id)
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-[#0c4ca3] text-white hover:bg-[#093d84]'
                    }`}
                  >
                    {rsvpEvents.includes(selectedEventModal.id) ? 'Attending' : 'RSVP Now'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedEventModal(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
