export function SutLogo({ className = "h-14", variant = "full" }: { className?: string; variant?: "full" | "icon" | "white" }) {
  const isWhite = variant === "white";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Exact geometric shapes from Elsewedy University of Technology brand */}
      <svg
        viewBox="0 0 120 120"
        className="h-full aspect-square flex-shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Top left maroon/purple shape */}
        <path
          d="M38 18 C26 18 18 26 18 38 C18 50 26 58 38 58 C50 58 58 50 58 38 C58 26 50 18 38 18 Z"
          fill="#842646"
        />
        {/* Bottom left cyan pill shape */}
        <path
          d="M38 64 C26 64 18 72 18 84 C18 96 26 104 38 104 C50 104 58 96 58 84 L58 64 Z"
          fill="#0db3c8"
        />
        {/* Right navy/purple pill shape */}
        <rect
          x="66"
          y="28"
          width="36"
          height="66"
          rx="18"
          fill="#2b3b75"
        />
        {/* Central dynamic accent connector */}
        <circle cx="58" cy="62" r="7" fill="#0db3c8" />
      </svg>

      {variant !== "icon" && (
        <div className="flex flex-col justify-center leading-none select-none">
          <span className={`text-[17px] font-black tracking-tight ${isWhite ? 'text-white' : 'text-[#202738]'}`}>
            ELSEWEDY
          </span>
          <span className={`text-[12px] font-bold tracking-widest ${isWhite ? 'text-gray-200' : 'text-[#35435a]'}`}>
            UNIVERSITY
          </span>
          <span className={`text-[13px] font-black tracking-normal ${isWhite ? 'text-white' : 'text-[#202738]'}`}>
            OF TECHNOLOGY
          </span>
          <span className={`text-[8.5px] font-semibold tracking-wider uppercase mt-0.5 ${isWhite ? 'text-cyan-200' : 'text-[#5d6b82]'}`}>
            • Polytechnic of Egypt •
          </span>
        </div>
      )}
    </div>
  );
}
