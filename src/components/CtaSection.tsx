"use client";

export default function DeskNoteCTA() {
  return (
    <div className="relative max-w-2xl mx-auto px-6 py-32">

      
      
      {/* Single elegant flowing line */}
      <svg 
        className="absolute -left-8 top-1/2 -translate-y-1/2 w-16 h-64 pointer-events-none opacity-30"
        viewBox="0 0 50 300"
        fill="none"
      >
        <path 
          d="M25,0 C35,50 15,100 25,150 C35,200 15,250 25,300" 
          stroke="#f59e0b" 
          strokeWidth="1.5"
          strokeDasharray="4 8"
          fill="none"
        >
          <animate 
            attributeName="stroke-dashoffset" 
            from="24" 
            to="0" 
            dur="2s" 
            repeatCount="indefinite" 
          />
        </path>
        <circle cx="25" cy="0" r="2.5" fill="#f59e0b">
          <animate 
            attributeName="cy" 
            values="0;300" 
            dur="3s" 
            repeatCount="indefinite" 
          />
          <animate 
            attributeName="opacity" 
            values="1;0.3;1" 
            dur="3s" 
            repeatCount="indefinite" 
          />
        </circle>
      </svg>

      {/* Right side subtle dots */}
      <svg 
        className="absolute -right-8 top-1/2 -translate-y-1/2 w-16 h-64 pointer-events-none opacity-20"
        viewBox="0 0 50 300"
      >
        {[30, 90, 150, 210, 270].map((y, i) => (
          <circle key={i} cx="25" cy={y} r="1.5" fill="#d4d4d4">
            <animate 
              attributeName="opacity" 
              values="0.2;0.8;0.2" 
              dur={`${2 + i * 0.5}s`} 
              repeatCount="indefinite" 
            />
          </circle>
        ))}
      </svg>

      <div className="border-l-4 border-amber-400 pl-8">
        <p className="text-stone-400 text-sm font-mono mb-4">HIRING CONSULTANTS?</p>
        <h2 className="text-5xl sm:text-6xl font-bold text-stone-900 tracking-tight">
          Let's talk.
        </h2>
        <p className="text-stone-500 text-lg mt-4 mb-8">
          Send us what you need. We'll reply with 3 matches within 48 hours.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="mailto:hr@oceanbluecorp.com"
            className="bg-stone-900 text-white px-8 py-4 font-medium text-center hover:bg-stone-800 transition"
          >
            hr@oceanbluecorp.com
          </a>
          <a
            href="tel:+16148446925"
            className="border border-stone-300 px-8 py-4 font-medium text-stone-700 text-center hover:border-stone-900 hover:text-stone-900 transition bg-white"
          >
            +1 (614) 844-6925
          </a>
        </div>
        
        <p className="text-stone-400 text-sm mt-6">
          Or Get in Touch → 
          <a href="/contact" className="text-stone-900 underline underline-offset-4 ml-1 hover:text-amber-600 transition">
            Feel free to reach out
          </a>
        </p>
      </div>
    </div>
  );
}