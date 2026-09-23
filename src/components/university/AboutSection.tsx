import React from 'react';
import { Award, ShieldCheck, Factory, Cpu, Globe, Users } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <div className="py-8 px-4 sm:px-6 max-w-7xl mx-auto space-y-8">
      <div className="bg-linear-to-r from-[#202738] via-[#2b3b75] to-[#842646] text-white p-8 rounded-xl shadow-md">
        <div className="max-w-3xl space-y-3">
          <span className="text-cyan-300 text-xs font-bold uppercase tracking-wider">
            Egypt's Pioneering Polytechnic Model
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">
            About Elsewedy University of Technology (SUT)
          </h1>
          <p className="text-gray-200 text-sm leading-relaxed">
            Established under Presidential Decree No. 418 of 2022, Elsewedy University of Technology is Egypt’s leading polytechnic institution, developed in direct collaboration with Elsewedy Electric and renowned European educational institutes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0c4ca3] flex items-center justify-center">
            <Factory className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">Industrial Dual-Study</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            60% of curriculum time is invested in hands-on workshops, factory training rotations at Elsewedy Electric industrial facilities, and technical laboratories.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">Dual International Credentials</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Graduates earn a Bachelor of Technology (B.Tech) accredited by Egypt's Supreme Council of Universities alongside European technical competencies.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">Next-Generation Engineering</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Specialized B.Tech programs in Computer Science Technology, Artificial Intelligence, Digital Electronics, and Industrial Automation.
          </p>
        </div>
      </div>
    </div>
  );
};
