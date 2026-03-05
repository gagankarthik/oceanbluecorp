"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    id: 1,
    quote: "Ocean Blue Solutions operates as a true strategic partner. Their team brings deep expertise, a disciplined approach to execution, and a consistent commitment to quality. Ocean Blue quickly understands business objectives, communicates clearly, and delivers with precision and reliability. The ease of partnering with their team, combined with their professionalism and results‑driven mindset, makes Ocean Blue Solutions a trusted and valued partner.",
    author: "Brian K.",
    role: "Co-Founder",
    company: "Pivotpoint",
    gradient: "from-indigo-600 to-purple-600",
  },
  {
    id: 2,
    quote: "OceanBlue resources demonstrated high levels of skill and professionalism, delivering quality results that met our expectations and deadlines.",
    author: "Damodar Buchi Reddy",
    role: "Project Director",
    company: "Diebold Nixdorf",
    gradient: "from-indigo-600 to-purple-600",
  },
  {
    id: 3,
    quote: "I have partnered with Ocean Blue for many years. They are trustworthy, honest, motivated and display a high degree of work ethic.",
    author: "Ken H.",
    role: "Senior Account Executive",
    company: "Mapsys, Inc.",
    gradient: "from-blue-600 to-cyan-600",
  },
];

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  return (
    <section className="py-16 md:py-20 bg-white relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-indigo-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-100/30 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-medium text-gray-400 uppercase tracking-[0.2em] mb-2 block"
          >
            Client testimonials
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-2xl md:text-3xl font-light text-gray-900 font-[family-name:var(--font-space-grotesk)]"
          >
            People seem to{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-medium">
              like us
            </span>
          </motion.h2>
        </div>

        {/* Testimonial card */}
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
                {/* Quote icon */}
                <div className={`absolute -top-3 -left-3 w-10 h-10 rounded-xl bg-gradient-to-br ${testimonials[currentIndex].gradient} flex items-center justify-center shadow-lg`}>
                  <Quote className="w-5 h-5 text-white" />
                </div>

                {/* Quote text */}
                <p className="text-gray-700 text-base md:text-lg leading-relaxed mb-5 pt-2">
                  "{testimonials[currentIndex].quote}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonials[currentIndex].gradient} flex items-center justify-center text-white font-semibold text-sm`}>
                    {testimonials[currentIndex].author.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{testimonials[currentIndex].author}</p>
                    <p className="text-gray-500 text-xs">{testimonials[currentIndex].role}, {testimonials[currentIndex].company}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={() => goToSlide((currentIndex - 1 + testimonials.length) % testimonials.length)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentIndex ? "w-6 bg-gradient-to-r from-indigo-600 to-purple-600" : "w-1.5 bg-gray-300"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => goToSlide((currentIndex + 1) % testimonials.length)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
