import { ArrowRight } from "lucide-react";

export default function Subtle3DCTA() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="relative isolate overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-3xl shadow-2xl">
          
          {/* 3D Depth Lines */}
          <div className="absolute inset-0 opacity-30">
            <svg className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4F46E5" />
                  <stop offset="50%" stopColor="#A855F7" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
              </defs>
              
              {/* Perspective Grid */}
              {[...Array(20)].map((_, i) => (
                <line
                  key={i}
                  x1={i * 80}
                  y1="0"
                  x2={i * 120}
                  y2="100%"
                  stroke="url(#line-gradient)"
                  strokeWidth="0.5"
                  strokeDasharray="6 6"
                  opacity="0.2"
                />
              ))}
              
              {[...Array(10)].map((_, i) => (
                <line
                  key={`h-${i}`}
                  x1="0"
                  y1={i * 120}
                  x2="100%"
                  y2={i * 180}
                  stroke="url(#line-gradient)"
                  strokeWidth="0.5"
                  strokeDasharray="6 6"
                  opacity="0.2"
                />
              ))}
            </svg>
          </div>

          {/* Floating 3D Elements */}
          <div className="absolute inset-0">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute w-24 h-24 bg-gradient-to-br from-white/10 to-transparent border border-white/20"
                style={{
                  left: `${5 + i * 20}%`,
                  top: `${10 + i * 15}%`,
                  transform: `rotateX(${30 + i * 10}deg) rotateY(${20 + i * 5}deg)`,
                  animation: `float-3d ${8 + i}s ease-in-out infinite`,
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="relative px-8 py-16 lg:px-16 lg:py-24">
  <div className="max-w-3xl mx-auto text-center">
    
    
    {/* Main Heading */}
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
      Ready to strengthen
      <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-300 to-purple-300">
        Your Team?
      </span>
    </h2>
    
    {/* Description */}
    <p className="text-gray-300 mb-8 max-w-2xl mx-auto text-base md:text-lg">
      Let's talk about your goals — no jargon, no pressure. Just real solutions for real challenges.
    </p>
    
    {/* CTA Buttons */}
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
      <a
        href="/contact"
        className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 min-w-[200px] group"
      >
        Start a conversation
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </a>
      
      <a
        href="/services"
        className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center gap-2 min-w-[200px] group"
      >
        See how we work
        <span className="group-hover:translate-x-1 transition-transform">→</span>
      </a>
    </div>
            
  </div>
</div>
        </div>
      </div>

      <style jsx>{`
        .preserve-3d {
          transform-style: preserve-3d;
        }
        
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .transform-z-16 {
          transform: translateZ(16px);
        }
        
        .-translate-z-16 {
          transform: translateZ(-16px);
        }
        
        @keyframes float-3d {
          0%, 100% { transform: translateY(0px) rotateY(5deg); }
          50% { transform: translateY(-15px) rotateY(10deg); }
        }
        
        .animate-float-3d {
          animation: float-3d 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}