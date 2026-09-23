import React from 'react';

export const SisFooter: React.FC = () => {
  return (
    <footer className="bg-[#4e555e] text-gray-300 text-[11px] px-6 py-2.5 border-t border-[#3e444b] flex flex-wrap items-center justify-between gap-2 select-none">
      <div>
        <span>© Copyright 2023 . </span>
        <span className="text-[#8ee624] font-medium hover:underline cursor-pointer">Informatique Education</span>
        <span> . All Rights Reserved</span>
      </div>
      <div className="text-gray-400">
        Elsewedy University of Technology (SUT) • Polytechnic of Egypt
      </div>
    </footer>
  );
};
