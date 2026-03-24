"use client";

import { ArrowRight, Sparkles, MoveRight, Pencil, Ruler, Hash } from "lucide-react";

export default function Subtle3DCTA() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#fefcf7] via-[#fef9ef] to-[#fdf7ed] py-20 sm:py-24 md:py-32 lg:py-40">
      {/* abstract organic blobs - adds creative depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-stone-200/50 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-orange-50/30 rounded-full blur-2xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main container - like a modern sketch canvas with depth */}
        <div className="relative group">

          {/* subtle grid pattern — softer, creative grid */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute inset-0" style={{ backgroundImage: `repeating-linear-gradient(to right, #d4d4d4 0px, #d4d4d4 1px, transparent 1px, transparent 5%)`, backgroundSize: '5% 100%' }} />
            <div className="absolute inset-0" style={{ backgroundImage: `repeating-linear-gradient(to bottom, #d4d4d4 0px, #d4d4d4 1px, transparent 1px, transparent 5%)`, backgroundSize: '100% 8%' }} />
          </div>

          {/* measurement markers — minimal, stylish ruler accents */}
          <div className="absolute -top-5 left-0 right-0 h-4 hidden md:block pointer-events-none opacity-40">
            <div className="relative h-full flex justify-between px-4">
              {[0, 25, 50, 75, 100].map((val) => (
                <div key={`top-ruler-${val}`} className="relative">
                  <div className="absolute top-0 w-px h-3 bg-stone-400" style={{ left: '50%' }} />
                  <span className="absolute -top-4 text-[9px] font-mono text-stone-400 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    {val}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute -bottom-5 left-0 right-0 h-3 hidden md:block pointer-events-none opacity-40">
            <div className="relative h-full flex justify-between px-4">
              {[0, 25, 50, 75, 100].map((val) => (
                <div key={`bottom-ruler-${val}`} className="w-px h-2 bg-stone-400" />
              ))}
            </div>
          </div>

          {/* Main card — elegant, subtle 3D effect with creative border */}
          <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-stone-200 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.02)] transition-all duration-500 hover:shadow-[0_30px_50px_-18px_rgba(0,0,0,0.15)] mx-0 md:mx-6 overflow-hidden">
            
            {/* hand-drawn corner accents — modernized with ink touch */}
            <div className="absolute -top-1.5 -left-1.5 w-10 h-10 border-t-2 border-l-2 border-amber-300/70 rounded-tl-xl" />
            <div className="absolute -top-1.5 -right-1.5 w-10 h-10 border-t-2 border-r-2 border-amber-300/70 rounded-tr-xl" />
            <div className="absolute -bottom-1.5 -left-1.5 w-10 h-10 border-b-2 border-l-2 border-amber-300/70 rounded-bl-xl" />
            <div className="absolute -bottom-1.5 -right-1.5 w-10 h-10 border-b-2 border-r-2 border-amber-300/70 rounded-br-xl" />
            
            {/* sketchy crosshatch — light texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
              <svg className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <pattern id="tinyCross" patternUnits="userSpaceOnUse" width="20" height="20">
                    <path d="M10,0 L10,20 M0,10 L20,10" stroke="black" strokeWidth="0.5" strokeDasharray="2 3" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#tinyCross)" />
              </svg>
            </div>

            {/* content area */}
            <div className="relative px-6 sm:px-10 py-12 sm:py-16 lg:px-14 xl:px-20 lg:py-20">
              <div className="max-w-3xl mx-auto text-center">
                
                {/* creative badge — hand-crafted style */}
                <div className="inline-flex items-center gap-2 bg-amber-50/80 border border-amber-200/70 rounded-full px-4 py-1.5 mb-8 shadow-sm backdrop-blur-sm">
                  <Pencil className="w-3.5 h-3.5 text-amber-600" strokeWidth={1.8} />
                  <span className="text-xs font-mono text-stone-600 tracking-wide">DESIGN DRAFT · FINAL POLISH</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.5} />
                </div>

                {/* main heading — modern hand-drawn elegance */}
                <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-stone-900 leading-[1.2] mb-5">
                  Ready to strengthen
                  <span className="block mt-2 relative inline-block">
                    Your Team?
                    {/* artistic underline — sketch wave */}
                    <svg className="absolute -bottom-3 left-0 w-full" height="8" viewBox="0 0 300 8" preserveAspectRatio="none">
                      <path d="M5,4 C40,2 80,7 120,4 C160,1 200,6 240,4 C270,2 290,5 295,4" stroke="#f59e0b" fill="none" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3" />
                    </svg>
                  </span>
                </h2>
                
                {/* stylish creative divider */}
                <div className="flex justify-center items-center gap-2 my-6">
                  <div className="h-px w-8 bg-gradient-to-r from-transparent to-amber-300" />
                  <span className="text-amber-400 text-sm rotate-12">✦</span>
                  <div className="h-px w-8 bg-gradient-to-l from-transparent to-amber-300" />
                  <span className="text-stone-400 text-xs font-mono mx-1">//</span>
                  <div className="h-px w-8 bg-gradient-to-r from-transparent to-stone-300" />
                  <span className="text-stone-500 text-sm -rotate-6">✧</span>
                  <div className="h-px w-8 bg-gradient-to-l from-transparent to-stone-300" />
                </div>
                
                {/* description — warm, inviting */}
                <p className="text-stone-600 mb-8 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
                  Let's talk about your goals — no jargon, no pressure. Just real solutions for real challenges, crafted with intention and creative precision.
                </p>
                
                {/* measurement notes — like studio annotations */}
                <div className="flex flex-wrap justify-center gap-5 mb-10 text-[11px] font-mono text-stone-400">
                  <div className="flex items-center gap-1.5 bg-stone-50/60 px-2 py-1 rounded-full">
                    <Ruler className="w-3 h-3" />
                    <span>width: fluid · max 1280px</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-stone-50/60 px-2 py-1 rounded-full">
                    <Hash className="w-3 h-3" />
                    <span>padding: 48px → 80px</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-stone-50/60 px-2 py-1 rounded-full">
                    <div className="w-2.5 h-2.5 rounded-full border border-stone-400" />
                    <span>radius: 24px</span>
                  </div>
                </div>
                
                {/* CTA Buttons — elevated, creative with sketchy outline on hover */}
                <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
                  <a
                    href="#"
                    className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-br from-stone-900 to-stone-800 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 min-w-[210px] hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] overflow-hidden border border-stone-700"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Start a conversation
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                  
                  <a
                    href="#"
                    className="group w-full sm:w-auto px-8 py-4 bg-white/90 backdrop-blur-sm text-stone-800 font-semibold rounded-xl border border-stone-200 transition-all duration-300 flex items-center justify-center gap-2 min-w-[210px] hover:border-amber-300 hover:shadow-md hover:bg-stone-50/90 hover:-translate-y-0.5"
                  >
                    <span>See how we work</span>
                    <MoveRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>

                {/* sketch notes — approval & iteration marks */}
                <div className="mt-10 pt-6 border-t border-dashed border-stone-200/80">
                  <div className="flex flex-wrap justify-center gap-5 text-[10px] font-mono text-stone-500">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      approved · final
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-4 h-px bg-stone-400" />
                      iteration v.04
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3 h-3 border border-stone-400 rounded-sm" />
                      ready for dev
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3 h-3 border-2 border-amber-300 rounded-full" />
                      creative direction
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* bottom micro ruler */}
            <div className="absolute bottom-3 left-6 right-6 h-2 pointer-events-none opacity-40">
              <div className="flex gap-[3px] justify-between h-full">
                {[...Array(30)].map((_, i) => (
                  <div
                    key={`micro-${i}`}
                    className="w-px bg-stone-400"
                    style={{ height: i % 5 === 0 ? '6px' : '3px' }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* floating sketch notes — creative 3D pop */}
          <div className="absolute -top-10 -right-3 hidden lg:block pointer-events-none z-20 transition-transform duration-500 group-hover:rotate-1">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 shadow-md rotate-3 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-stone-700">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>✏️ final touch:</span>
                <span className="text-stone-500">smooth motion</span>
              </div>
            </div>
          </div>
          
          <div className="absolute -bottom-10 -left-3 hidden lg:block pointer-events-none z-20 transition-all duration-500 group-hover:-rotate-1">
            <div className="bg-white/90 border border-stone-200 rounded-xl p-2.5 shadow-md -rotate-2 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-stone-600">
                <Ruler className="w-3 h-3 text-stone-500" />
                <span>📐 scale:</span>
                <span className="text-stone-500">responsive · fluid</span>
              </div>
            </div>
          </div>

          {/* hand-drawn annotation arrows — creative directional cues */}
          <svg className="absolute -left-12 top-1/2 hidden xl:block pointer-events-none -translate-y-1/2" width="70" height="48" viewBox="0 0 70 48">
            <path d="M58,24 L66,24 M62,20 L66,24 L62,28" stroke="#d6b17e" fill="none" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M4,24 L52,24" stroke="#d6b17e" fill="none" strokeWidth="1.2" strokeDasharray="5 3" />
            <text x="12" y="18" fontSize="8" fill="#b77e3c" fontFamily="monospace" fontWeight="400">spacing guide</text>
          </svg>
          
          <svg className="absolute -right-12 top-1/2 hidden xl:block pointer-events-none -translate-y-1/2" width="70" height="48" viewBox="0 0 70 48">
            <path d="M12,24 L4,24 M8,20 L4,24 L8,28" stroke="#d6b17e" fill="none" strokeWidth="1.8" />
            <path d="M18,24 L66,24" stroke="#d6b17e" fill="none" strokeWidth="1.2" strokeDasharray="5 3" />
            <text x="32" y="18" fontSize="8" fill="#b77e3c" fontFamily="monospace">auto margin</text>
          </svg>

          {/* additional creative element: 3D floating dot grid */}
          <div className="absolute -bottom-16 right-12 hidden md:block pointer-events-none">
            <div className="grid grid-cols-3 gap-1.5">
              {[...Array(9)].map((_, idx) => (
                <div key={`dot-${idx}`} className="w-1 h-1 rounded-full bg-amber-300/40" />
              ))}
            </div>
          </div>
        </div>

        {/* subtle brand mark at bottom */}
        <div className="text-center mt-12 opacity-30 text-[10px] font-mono text-stone-400 tracking-wider">
          ✦ SKETCH-FLOW SYSTEM v2 — designed with intention ✦
        </div>
      </div>

      <style jsx>{`
        @keyframes floatSoft {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-3px); }
        }
        .group:hover {
          animation: floatSoft 0.3s ease-in-out forwards;
        }
        /* organic hover for main card */
        .group:hover .relative.bg-white\\/90 {
          transition: all 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1);
        }
        .group:hover .shadow-\\[0_20px_40px_-12px_rgba\\(0\\,0\\,0\\,0\\.08\\)\\] {
          box-shadow: 0 30px 50px -18px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}