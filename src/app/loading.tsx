"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface CinematicOpeningProps {
  logoUrl?: string;
  title?: string;
  onComplete?: () => void;
  duration?: number;
}

const CinematicOpening: React.FC<CinematicOpeningProps> = ({
  logoUrl = "/Loading.png",
  title = "Ocean Blue",
  onComplete,
  duration = 4
}) => {
  const [stage, setStage] = useState<'intro' | 'curtains' | 'logo' | 'exit'>('intro');
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Sequence timeline
    const timeline = [
      setTimeout(() => setStage('curtains'), 200), // Start curtains after slight delay
      setTimeout(() => setStage('logo'), duration * 500), // Logo emphasis mid-way
      setTimeout(() => {
        setStage('exit');
        setTimeout(() => {
          setShow(false);
          onComplete?.();
        }, 1000);
      }, duration * 1000)
    ];

    return () => timeline.forEach(t => clearTimeout(t));
  }, [duration, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      {/* Film grain effect */}
      <div className="absolute inset-0 opacity-20 pointer-events-none"
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.5\'/%3E%3C/svg%3E")' }} />

      {/* Cinema screen frame */}
      <div className="absolute inset-8 border-4 border-white/10 rounded-2xl shadow-2xl shadow-white/5" />
      
      {/* Main content */}
      <div className="relative h-full flex items-center justify-center">
        {/* Logo with cinematic reveal */}
        <div className={`
          text-center transition-all duration-1000 z-20
          ${stage === 'intro' ? 'scale-50 opacity-0 blur-xl' : ''}
          ${stage === 'curtains' ? 'scale-100 opacity-100 blur-0' : ''}
          ${stage === 'logo' ? 'scale-110 drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]' : ''}
          ${stage === 'exit' ? 'scale-150 opacity-0 blur-2xl' : ''}
        `}>
          <div className="relative w-[380px] h-[380px] mx-auto mb-6">
            <Image
              src={logoUrl}
              alt={title}
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-white text-5xl font-black tracking-[0.3em] 
                       font-montserrat bg-clip-text text-transparent 
                       bg-gradient-to-r from-white via-yellow-200 to-white
                       animate-[shimmer_3s_infinite]">
            {title}
          </h1>
        </div>

        {/* Curtains with 3D effect */}
        <div className="absolute inset-0 flex pointer-events-none">
          {/* Left curtain assembly */}
          <div className={`
            relative h-full w-1/2 transition-transform duration-[2000ms] 
            ease-[cubic-bezier(0.7,0,0.3,1)] origin-left
            ${stage !== 'intro' ? '-translate-x-full' : 'translate-x-0'}
          `}>
            <div className="absolute inset-0 bg-gradient-to-r from-red-900 via-red-600 to-red-700 
                          shadow-2xl overflow-hidden">
              {/* Curtain folds */}
              <div className="absolute inset-0 flex">
                {[...Array(12)].map((_, i) => (
                  <div key={i} 
                       className="relative h-full flex-1 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r 
                                  from-transparent via-white/10 to-transparent 
                                  skew-x-12" />
                    <div className="absolute top-0 bottom-0 left-1/2 w-px 
                                  bg-white/20 transform -skew-x-12" />
                  </div>
                ))}
              </div>
              {/* Golden edges */}
              <div className="absolute right-0 top-0 bottom-0 w-4 
                            bg-gradient-to-l from-yellow-400/80 to-transparent" />
            </div>
          </div>

          {/* Right curtain assembly */}
          <div className={`
            relative h-full w-1/2 transition-transform duration-[2000ms]
            ease-[cubic-bezier(0.7,0,0.3,1)] origin-right
            ${stage !== 'intro' ? 'translate-x-full' : 'translate-x-0'}
          `}>
            <div className="absolute inset-0 bg-gradient-to-l from-red-900 via-red-600 to-red-700 
                          shadow-2xl overflow-hidden">
              {/* Curtain folds */}
              <div className="absolute inset-0 flex flex-row-reverse">
                {[...Array(12)].map((_, i) => (
                  <div key={i} 
                       className="relative h-full flex-1 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-l 
                                  from-transparent via-white/10 to-transparent 
                                  -skew-x-12" />
                    <div className="absolute top-0 bottom-0 right-1/2 w-px 
                                  bg-white/20 transform skew-x-12" />
                  </div>
                ))}
              </div>
              {/* Golden edges */}
              <div className="absolute left-0 top-0 bottom-0 w-4 
                            bg-gradient-to-r from-yellow-400/80 to-transparent" />
            </div>
          </div>
        </div>

        {/* Bottom curtain tie-backs (optional) */}
        <div className={`
          absolute bottom-0 left-1/4 right-1/4 h-32 
          bg-gradient-to-t from-red-900/80 via-red-800/50 to-transparent
          backdrop-blur-sm transition-all duration-1000
          ${stage !== 'intro' ? 'translate-y-32' : 'translate-y-0'}
        `} />
      </div>

      {/* Cinema lights effect */}
      <div className="absolute top-0 left-0 right-0 h-32 
                    bg-gradient-to-b from-yellow-300/20 via-transparent to-transparent
                    mix-blend-overlay pointer-events-none" />
    </div>
  );
};

export default CinematicOpening;