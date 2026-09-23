import React, { useState } from 'react';
import { CampusNews } from '../../types';
import { campusNewsList } from '../../data/mockData';
import { Calendar, Clock, ArrowRight, Share2, Tag, BookOpen } from 'lucide-react';

export const CampusNewsSection: React.FC = () => {
  const [selectedArticle, setSelectedArticle] = useState<CampusNews | null>(null);

  return (
    <div className="py-8 px-4 sm:px-6 max-w-7xl mx-auto space-y-8">
      {/* Banner */}
      <div className="bg-linear-to-r from-[#202738] via-[#1f3864] to-[#0db3c8] text-white p-6 sm:p-8 rounded-xl shadow-md">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Official University Press & Media Room</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Elsewedy University News & Announcements
          </h1>
          <p className="text-gray-200 text-sm leading-relaxed">
            Latest technological breakthroughs, student academic guidelines, faculty appointments, and industrial workforce partnerships.
          </p>
        </div>
      </div>

      {/* Featured Lead News Article */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          <div className="lg:col-span-7 h-64 lg:h-auto relative overflow-hidden bg-gray-100">
            <img
              src={campusNewsList[0].image}
              alt={campusNewsList[0].title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#842646] text-white shadow-md">
                Featured Innovation
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {campusNewsList[0].date}
                </span>
                <span>•</span>
                <span>{campusNewsList[0].readTime}</span>
              </div>

              <h2
                onClick={() => setSelectedArticle(campusNewsList[0])}
                className="text-xl sm:text-2xl font-black text-gray-900 hover:text-[#0c4ca3] cursor-pointer transition-colors leading-tight"
              >
                {campusNewsList[0].title}
              </h2>

              <p className="text-sm text-gray-600 leading-relaxed">
                {campusNewsList[0].summary}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedArticle(campusNewsList[0])}
              className="inline-flex items-center gap-2 text-sm font-bold text-[#0c4ca3] hover:text-[#093d84] cursor-pointer"
            >
              Read Full Story <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Other News */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campusNewsList.slice(1).map((news) => (
          <div
            key={news.id}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs hover:border-[#0c4ca3] hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="h-48 overflow-hidden bg-gray-100 relative">
              <img
                src={news.image}
                alt={news.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded text-[11px] font-bold bg-white/90 backdrop-blur-xs text-gray-800">
                {news.category}
              </span>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>{news.date}</span>
                  <span>•</span>
                  <span>{news.readTime}</span>
                </div>
                <h3
                  onClick={() => setSelectedArticle(news)}
                  className="font-bold text-gray-900 text-base hover:text-[#0c4ca3] cursor-pointer transition-colors"
                >
                  {news.title}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                  {news.summary}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedArticle(news)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0c4ca3] hover:underline pt-2 cursor-pointer"
              >
                Read Announcement <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Article Full View Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full border border-gray-200 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-blue-100 text-[#0c4ca3]">
                {selectedArticle.category}
              </span>
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="text-gray-500 hover:text-gray-800 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-gray-700">
              <div className="space-y-1">
                <p className="text-gray-400 text-xs">{selectedArticle.date} • {selectedArticle.readTime}</p>
                <h2 className="text-xl font-black text-gray-900">{selectedArticle.title}</h2>
              </div>

              <div className="h-56 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={selectedArticle.image}
                  alt={selectedArticle.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="text-sm leading-relaxed text-gray-800 space-y-3 font-normal">
                <p className="font-semibold text-gray-900">{selectedArticle.summary}</p>
                <p>{selectedArticle.content}</p>
                <p>
                  Elsewedy University of Technology continues to champion applied technical education in the Arab Republic of Egypt, empowering students with dual credentials aligned with international polytechnic benchmarks.
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedArticle(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
