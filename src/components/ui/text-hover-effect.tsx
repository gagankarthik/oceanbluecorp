"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";

export const TextHoverEffect = ({
  text,
  duration = 0.3,
  automatic = false,
  autoSpeed = 2,
  gradientColors = ["#eab308", "#ef4444", "#3b82f6", "#06b6d4", "#8b5cf6"],
}: {
  text: string;
  duration?: number;
  automatic?: boolean;
  autoSpeed?: number;
  gradientColors?: string[];
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [maskPosition, setMaskPosition] = useState({ cx: "50%", cy: "50%" });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const animationRef = useRef<number | undefined>(undefined);
  const timeRef = useRef(0);

  // Update mask position based on cursor
  useEffect(() => {
    if (svgRef.current && cursor.x !== null && cursor.y !== null) {
      const svgRect = svgRef.current.getBoundingClientRect();
      const cxPercentage = ((cursor.x - svgRect.left) / svgRect.width) * 100;
      const cyPercentage = ((cursor.y - svgRect.top) / svgRect.height) * 100;
      setMaskPosition({
        cx: `${Math.min(Math.max(cxPercentage, 0), 100)}%`,
        cy: `${Math.min(Math.max(cyPercentage, 0), 100)}%`,
      });
    }
  }, [cursor]);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Automatic circling animation
  useEffect(() => {
    if (!automatic || hovered) return;

    const animate = () => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const radius = Math.min(rect.width, rect.height) * 0.35;

      timeRef.current += 0.01 * autoSpeed;
      const cx = centerX + Math.cos(timeRef.current) * radius;
      const cy = centerY + Math.sin(timeRef.current) * radius;
      const cxPercentage = (cx / rect.width) * 100;
      const cyPercentage = (cy / rect.height) * 100;

      setMaskPosition({
        cx: `${Math.min(Math.max(cxPercentage, 0), 100)}%`,
        cy: `${Math.min(Math.max(cyPercentage, 0), 100)}%`,
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [automatic, hovered, autoSpeed]);

  // Calculate text dimensions to minimize vertical space
  const getTextMetrics = () => {
    const length = text.length;
    let fontSize = 48; // default
    
    if (length <= 5) fontSize = 72;
    else if (length <= 10) fontSize = 60;
    else if (length <= 15) fontSize = 48;
    else fontSize = 36;
    
    // Calculate approximate height needed (fontSize * 1.2 for line height)
    const height = fontSize * 1.2;
    const width = length * fontSize * 0.6;
    
    return { fontSize, height, width };
  };
  
  const { fontSize, height, width } = getTextMetrics();
  const svgHeight = Math.ceil(height) + 10; // Minimal padding just for the text
  const svgWidth = Math.ceil(width) + 20;

  return (
    <div className="relative w-full h-full flex items-center justify-center" style={{ lineHeight: 0 }}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setCursor({ 
            x: e.clientX, 
            y: e.clientY 
          });
        }}
        className="select-none cursor-default"
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient
            id="textGradient"
            gradientUnits="userSpaceOnUse"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            {gradientColors.map((color, index) => (
              <stop
                key={index}
                offset={`${(index / (gradientColors.length - 1)) * 100}%`}
                stopColor={color}
              />
            ))}
          </linearGradient>

          <radialGradient
            id="revealMask"
            gradientUnits="userSpaceOnUse"
            r="25%"
            cx={maskPosition.cx}
            cy={maskPosition.cy}
          >
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="40%" stopColor="white" stopOpacity="0.8" />
            <stop offset="100%" stopColor="black" stopOpacity="0" />
          </radialGradient>

          <mask id="textMask">
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="url(#revealMask)"
            />
          </mask>

          {/* Glow filter */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background text (subtle outline) */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          strokeWidth="0.5"
          fontSize={fontSize}
          fontWeight="bold"
          className="fill-transparent stroke-neutral-300 dark:stroke-neutral-700"
          style={{ opacity: hovered ? 0.4 : 0.2, transition: "opacity 0.3s" }}
        >
          {text}
        </text>

        {/* Animated stroke text */}
        <motion.text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          strokeWidth="0.5"
          fontSize={fontSize}
          fontWeight="bold"
          className="fill-transparent stroke-neutral-400 dark:stroke-neutral-600"
          initial={{ strokeDashoffset: 1500, strokeDasharray: 1500 }}
          animate={{
            strokeDashoffset: hovered ? 1500 : 0,
            strokeDasharray: 1500,
          }}
          transition={{
            duration: 2,
            ease: "easeInOut",
          }}
        >
          {text}
        </motion.text>

        {/* Animated fill text with mask */}
        <motion.text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          stroke="url(#textGradient)"
          strokeWidth="0.8"
          fontSize={fontSize}
          fontWeight="bold"
          mask="url(#textMask)"
          className="fill-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: hovered ? 1 : 0.6 }}
          transition={{ duration: 0.3 }}
          filter="url(#glow)"
        >
          {text}
        </motion.text>

        {/* Solid gradient text (appears on hover) */}
        <motion.text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={fontSize}
          fontWeight="bold"
          fill="url(#textGradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: hovered ? 0.3 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {text}
        </motion.text>
      </svg>
    </div>
  );
};