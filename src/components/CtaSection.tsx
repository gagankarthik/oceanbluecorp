"use client";

import { ArrowRight } from "lucide-react";

export default function Subtle3DCTA() {
  return (
    <div className="bg-[#faf9f8] relative overflow-hidden py-16 sm:py-20 md:py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Main Container - Like a sketch canvas */}
        <div className="relative">
          
          {/* GRID SYSTEM - Like UI design grid */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Vertical Grid Lines */}
            <div className="absolute inset-0">
              {[...Array(24)].map((_, i) => (
                <div
                  key={`v-grid-${i}`}
                  className="absolute top-0 bottom-0 w-px bg-gray-300/40"
                  style={{ left: `${i * 4.166}%` }}
                />
              ))}
            </div>
            
            {/* Horizontal Grid Lines */}
            <div className="absolute inset-0">
              {[...Array(16)].map((_, i) => (
                <div
                  key={`h-grid-${i}`}
                  className="absolute left-0 right-0 h-px bg-gray-300/40"
                  style={{ top: `${i * 6.25}%` }}
                />
              ))}
            </div>
          </div>

          {/* MEASUREMENT MARKERS - Top ruler */}
          <div className="absolute -top-6 left-0 right-0 h-6 hidden md:block pointer-events-none">
            <div className="relative h-full">
              {[...Array(25)].map((_, i) => (
                <div
                  key={`top-mark-${i}`}
                  className="absolute bottom-0 w-px bg-gray-400"
                  style={{ left: `${i * 4.166}%`, height: i % 5 === 0 ? '12px' : '6px' }}
                />
              ))}
              {[0, 25, 50, 75, 100].map((val, i) => (
                <div
                  key={`top-num-${i}`}
                  className="absolute -top-4 text-[8px] font-mono text-gray-500"
                  style={{ left: `${val}%`, transform: 'translateX(-50%)' }}
                >
                  {val}
                </div>
              ))}
            </div>
          </div>

          {/* MEASUREMENT MARKERS - Bottom ruler */}
          <div className="absolute -bottom-6 left-0 right-0 h-6 hidden md:block pointer-events-none">
            <div className="relative h-full">
              {[...Array(25)].map((_, i) => (
                <div
                  key={`bottom-mark-${i}`}
                  className="absolute top-0 w-px bg-gray-400"
                  style={{ left: `${i * 4.166}%`, height: i % 5 === 0 ? '12px' : '6px' }}
                />
              ))}
            </div>
          </div>

          {/* LEFT VERTICAL RULER */}
          <div className="absolute -left-6 top-0 bottom-0 w-6 hidden md:block pointer-events-none">
            <div className="relative h-full">
              {[...Array(20)].map((_, i) => (
                <div
                  key={`left-mark-${i}`}
                  className="absolute right-0 w-px bg-gray-400"
                  style={{ top: `${i * 5}%`, height: i % 5 === 0 ? '12px' : '6px' }}
                />
              ))}
              {[0, 25, 50, 75, 100].map((val, i) => (
                <div
                  key={`left-num-${i}`}
                  className="absolute -left-4 text-[8px] font-mono text-gray-500"
                  style={{ top: `${val}%`, transform: 'translateY(-50%)' }}
                >
                  {val}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT VERTICAL RULER */}
          <div className="absolute -right-6 top-0 bottom-0 w-6 hidden md:block pointer-events-none">
            <div className="relative h-full">
              {[...Array(20)].map((_, i) => (
                <div
                  key={`right-mark-${i}`}
                  className="absolute left-0 w-px bg-gray-400"
                  style={{ top: `${i * 5}%`, height: i % 5 === 0 ? '12px' : '6px' }}
                />
              ))}
            </div>
          </div>

          {/* MAIN CONTENT CARD - Sketch style with hand-drawn border */}
          <div className="relative bg-white rounded-lg border-2 border-gray-300 shadow-sm mx-0 md:mx-4 overflow-hidden"
               style={{ borderStyle: 'solid' }}>
            
            {/* HAND-DRAWN CORNER ACCENTS */}
            <div className="absolute -top-1 -left-1 w-8 h-8 border-t-2 border-l-2 border-gray-400 rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-8 h-8 border-t-2 border-r-2 border-gray-400 rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-2 border-l-2 border-gray-400 rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-gray-400 rounded-br-lg" />
            
            {/* SKETCHY CROSSHATCH PATTERN */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <svg className="w-full h-full" preserveAspectRatio="none">
                {[...Array(50)].map((_, i) => (
                  <line
                    key={`cross-${i}`}
                    x1={Math.random() * 100 + '%'}
                    y1="0"
                    x2={Math.random() * 100 + '%'}
                    y2="100%"
                    stroke="#000"
                    strokeWidth="0.3"
                    strokeDasharray="2 4"
                    opacity="0.3"
                  />
                ))}
                {[...Array(50)].map((_, i) => (
                  <line
                    key={`cross2-${i}`}
                    x1="0"
                    y1={Math.random() * 100 + '%'}
                    x2="100%"
                    y2={Math.random() * 100 + '%'}
                    stroke="#000"
                    strokeWidth="0.3"
                    strokeDasharray="2 4"
                    opacity="0.3"
                  />
                ))}
              </svg>
            </div>

            {/* CONTENT */}
            <div className="relative px-6 sm:px-8 py-12 sm:py-16 lg:px-12 xl:px-16 lg:py-20">
              <div className="max-w-3xl mx-auto text-center">
                
                {/* SKETCH BADGE */}
                <div className="inline-flex items-center gap-2 border border-gray-300 bg-gray-50 rounded px-3 py-1.5 mb-6 shadow-sm">
                  <div className="w-2 h-2 bg-gray-500 rounded-full" />
                  <span className="text-xs font-mono text-gray-600 tracking-wide">DRAFT v.03 / FINAL CONCEPT</span>
                  <div className="w-2 h-2 bg-gray-500 rounded-full" />
                </div>

                {/* MAIN HEADING - Hand-drawn style */}
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight tracking-tight">
                  Ready to strengthen
                  <span className="block mt-2 relative inline-block">
                    Your Team?
                    {/* Hand-drawn underline */}
                    <svg className="absolute -bottom-2 left-0 w-full" height="4" viewBox="0 0 200 4">
                      <path d="M0,2 Q50,0 100,2 T200,2" stroke="#9CA3AF" fill="none" strokeWidth="1.5" strokeDasharray="3 2" />
                    </svg>
                  </span>
                </h2>
                
                {/* SKETCHY DIVIDER */}
                <div className="flex justify-center items-center gap-1 my-6">
                  {[...Array(5)].map((_, i) => (
                    <div key={`dash-${i}`} className="w-2 h-px bg-gray-400 rotate-12" />
                  ))}
                  <span className="text-gray-400 text-xs mx-2">✕</span>
                  {[...Array(5)].map((_, i) => (
                    <div key={`dash2-${i}`} className="w-2 h-px bg-gray-400 -rotate-12" />
                  ))}
                </div>
                
                {/* DESCRIPTION */}
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto text-base sm:text-lg">
                  Let's talk about your goals — no jargon, no pressure. Just real solutions for real challenges.
                </p>
                
                {/* MEASUREMENT NOTES - Like sketch annotations */}
                <div className="flex justify-center gap-4 mb-8 text-xs font-mono text-gray-500">
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-3 h-px bg-gray-400" />
                    <span>width: 100%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 border border-gray-400" />
                    <span>padding: 48px</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-full border border-gray-400" />
                    <span>radius: 8px</span>
                  </div>
                </div>
                
                {/* CTA BUTTONS - Sketch style with dashed borders */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <a
                    href="/contact"
                    className="group w-full sm:w-auto px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg border-2 border-gray-400 transition-all flex items-center justify-center gap-2 min-w-[200px] hover:bg-gray-50 hover:shadow-md"
                    style={{ borderStyle: 'dashed' }}
                  >
                    <span>Start a conversation</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                  
                  <a
                    href="/services"
                    className="group w-full sm:w-auto px-8 py-4 bg-gray-50 text-gray-700 font-semibold rounded-lg border-2 border-gray-400 transition-all flex items-center justify-center gap-2 min-w-[200px] hover:bg-gray-100"
                    style={{ borderStyle: 'dashed' }}
                  >
                    <span>See how we work</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </a>
                </div>

                {/* SKETCH NOTES */}
                <div className="mt-8 pt-6 border-t border-dashed border-gray-300">
                  <div className="flex flex-wrap justify-center gap-4 text-[11px] font-mono text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full" />
                      approved
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-px bg-gray-400" />
                      iteration 04
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 border border-gray-400" />
                      ready for dev
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM MEASUREMENT STRIP */}
            <div className="absolute bottom-2 left-4 right-4 h-4 pointer-events-none">
              <div className="flex gap-[2px] justify-between h-full">
                {[...Array(40)].map((_, i) => (
                  <div
                    key={`strip-${i}`}
                    className="w-px bg-gray-300"
                    style={{ height: i % 5 === 0 ? '8px' : '4px' }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* FLOATING SKETCH ELEMENTS - Like draft notes */}
          <div className="absolute -top-8 -right-4 hidden lg:block pointer-events-none">
            <div className="bg-gray-100 border border-gray-300 rounded p-2 shadow-sm rotate-6">
              <div className="text-[10px] font-mono text-gray-600">✏️ note:</div>
              <div className="text-[10px] font-mono text-gray-500">final polish</div>
            </div>
          </div>
          
          <div className="absolute -bottom-8 -left-4 hidden lg:block pointer-events-none">
            <div className="bg-gray-100 border border-gray-300 rounded p-2 shadow-sm -rotate-3">
              <div className="text-[10px] font-mono text-gray-600">📐 dimensions:</div>
              <div className="text-[10px] font-mono text-gray-500">1200px × auto</div>
            </div>
          </div>

          {/* HAND-DRAWN ARROWS - Annotation style */}
          <svg className="absolute -left-8 top-1/2 hidden xl:block pointer-events-none" width="60" height="40" viewBox="0 0 60 40">
            <path d="M50,20 L58,20 M54,16 L58,20 L54,24" stroke="#9CA3AF" fill="none" strokeWidth="1.5" />
            <path d="M0,20 L45,20" stroke="#9CA3AF" fill="none" strokeWidth="1" strokeDasharray="3 2" />
            <text x="10" y="15" fontSize="8" fill="#9CA3AF" fontFamily="monospace">padding guide</text>
          </svg>
          
          <svg className="absolute -right-8 top-1/2 hidden xl:block pointer-events-none" width="60" height="40" viewBox="0 0 60 40">
            <path d="M10,20 L2,20 M6,16 L2,20 L6,24" stroke="#9CA3AF" fill="none" strokeWidth="1.5" />
            <path d="M15,20 L60,20" stroke="#9CA3AF" fill="none" strokeWidth="1" strokeDasharray="3 2" />
            <text x="30" y="15" fontSize="8" fill="#9CA3AF" fontFamily="monospace">margin: auto</text>
          </svg>
        </div>
      </div>

      <style jsx>{`
        @keyframes dash {
          to {
            stroke-dashoffset: 10;
          }
        }
        
        .animate-dash {
          animation: dash 20s linear infinite;
        }
        
        /* Hand-drawn hover effect */
        .group:hover {
          transform: translateY(-1px);
          transition: all 0.2s ease;
        }
      `}</style>
    </div>
  );
}