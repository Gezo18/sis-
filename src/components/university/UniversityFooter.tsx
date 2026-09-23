import React from 'react';
import { SutLogo } from '../common/SutLogo';
import { Phone, Mail, MapPin, Globe } from 'lucide-react';

interface Props {
  onOpenSis: () => void;
  onNavigateTab: (tab: 'home' | 'catalog' | 'events' | 'news' | 'about') => void;
}

export const UniversityFooter: React.FC<Props> = ({ onOpenSis, onNavigateTab }) => {
  return (
    <footer className="bg-[#1b212f] text-gray-300 text-xs border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3 md:col-span-1">
          <SutLogo variant="white" className="h-14" />
          <p className="text-gray-400 text-[11.5px] leading-relaxed pt-2">
            Elsewedy University of Technology - Polytechnic of Egypt. Egypt's premier polytechnic institution for dual technological engineering.
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="font-bold text-white text-xs uppercase tracking-wider">Quick Navigation</h4>
          <ul className="space-y-2 text-gray-400">
            <li>
              <button type="button" onClick={() => onNavigateTab('catalog')} className="hover:text-white cursor-pointer">
                Course Catalog 2025/2026
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigateTab('events')} className="hover:text-white cursor-pointer">
                Campus Events & Calendar
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigateTab('news')} className="hover:text-white cursor-pointer">
                University News & Press
              </button>
            </li>
            <li>
              <button type="button" onClick={onOpenSis} className="text-[#8ee624] font-semibold hover:underline cursor-pointer">
                SIS Student Information System
              </button>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="font-bold text-white text-xs uppercase tracking-wider">Undergraduate Programs</h4>
          <ul className="space-y-2 text-gray-400">
            <li>Computer Science Technology Program</li>
            <li>Network & Cybersecurity Technology</li>
            <li>Electrical Engineering Technology</li>
            <li>Industrial Automation & Mechatronics</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="font-bold text-white text-xs uppercase tracking-wider">Campus Location</h4>
          <div className="space-y-2 text-gray-400 text-[11.5px]">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>Cairo-Ismailia Desert Road, Km 55, Tenth of Ramadan City, Egypt</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Hotline: 19788 / +20 102 999 4440</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>admissions@sut.edu.eg</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2 text-gray-500 text-[11px]">
          <span>© 2026 Elsewedy University of Technology (SUT). All Rights Reserved.</span>
          <span>Powered by Informatique Education SIS Platform</span>
        </div>
      </div>
    </footer>
  );
};
