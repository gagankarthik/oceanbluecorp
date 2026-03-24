"use client";

import { motion } from "framer-motion";
import { Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

const testimonials = [
  {
    id: 1,
    quote: "Ocean Blue Solutions operates as a true strategic partner. Their team brings deep expertise, a disciplined approach to execution, and a consistent commitment to quality.",
    author: "Brian K.",
    role: "Co-Founder",
    company: "Pivotpoint",
  },
  {
    id: 2,
    quote: "OceanBlue resources demonstrated high levels of skill and professionalism, delivering quality results that met our expectations and deadlines.",
    author: "Damodar Buchi Reddy",
    role: "Project Director",
    company: "Diebold Nixdorf",
  },
  {
    id: 3,
    quote: "I have partnered with Ocean Blue for many years. They are trustworthy, honest, motivated and display a high degree of work ethic.",
    author: "Ken H.",
    role: "Senior Account Executive",
    company: "Mapsys, Inc.",
  },
];

export default function TestimonialsShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    if (!isAutoScrolling) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoScrolling, currentIndex]);

  return (
    <section className="relative bg-white py-24 md:py-32 overflow-hidden">
      <div className="relative px-6 md:px-12 lg:px-20 max-w-[1440px] mx-auto">
        
        {/* Desktop View - 2x2 Grid with plus sign lines */}
        <div className="hidden lg:block relative">
          <div className="grid grid-cols-2 relative">
            {/* First Box - Header/Intro Box */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative bg-white p-10 lg:p-14 flex flex-col justify-center items-center text-center min-h-[420px] lg:min-h-[460px]"
            >
              <div className="relative z-10">
                <h2 className="text-gray-900 text-5xl lg:text-6xl font-bold mb-4 leading-[1.2] tracking-tight">
                  What our
                  <br />
                  clients say
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed max-w-sm">
                  Real stories from real partnerships that drive exceptional results
                </p>
              </div>
            </motion.div>

            {/* Testimonial 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative bg-white p-10 lg:p-14 flex flex-col justify-center items-center text-center min-h-[420px] lg:min-h-[460px]"
            >
              <div>
                <Quote className="w-12 h-12 text-[#8d81f0] mb-6 opacity-70 mx-auto" />
                <p className="text-gray-700 text-lg lg:text-xl leading-relaxed mb-8 max-w-md">
                  "{testimonials[0].quote}"
                </p>
              </div>
              <div className="w-full">
                <div className="text-gray-900 font-semibold text-xl lg:text-2xl mb-1">
                  {testimonials[0].author}
                </div>
                <div className="text-gray-500 text-base lg:text-lg">
                  {testimonials[0].role}, {testimonials[0].company}
                </div>
              </div>
            </motion.div>

            {/* Testimonial 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative bg-white p-10 lg:p-14 flex flex-col justify-center items-center text-center min-h-[420px] lg:min-h-[460px]"
            >
              <div>
                <Quote className="w-12 h-12 text-[#8d81f0] mb-6 opacity-70 mx-auto" />
                <p className="text-gray-700 text-lg lg:text-xl leading-relaxed mb-8 max-w-md">
                  "{testimonials[1].quote}"
                </p>
              </div>
              <div className="w-full">
                <div className="text-gray-900 font-semibold text-xl lg:text-2xl mb-1">
                  {testimonials[1].author}
                </div>
                <div className="text-gray-500 text-base lg:text-lg">
                  {testimonials[1].role}, {testimonials[1].company}
                </div>
              </div>
            </motion.div>

            {/* Testimonial 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative bg-white p-10 lg:p-14 flex flex-col justify-center items-center text-center min-h-[420px] lg:min-h-[460px]"
            >
              <div className="relative z-10">
                <Quote className="w-12 h-12 text-[#8d81f0] mb-6 opacity-70 mx-auto" />
                <p className="text-gray-700 text-lg lg:text-xl leading-relaxed mb-8 max-w-md">
                  "{testimonials[2].quote}"
                </p>
              </div>
              <div className="relative z-10 w-full">
                <div className="text-gray-900 font-semibold text-xl lg:text-2xl mb-1">
                  {testimonials[2].author}
                </div>
                <div className="text-gray-500 text-base lg:text-lg">
                  {testimonials[2].role}, {testimonials[2].company}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Vertical Line - Center */}
          <div className="absolute left-1/2 top-8 bottom-8 w-px bg-gray-300 transform -translate-x-1/2"></div>
          
          {/* Horizontal Line - Center */}
          <div className="absolute top-1/2 left-8 right-8 h-px bg-gray-300 transform -translate-y-1/2"></div>
        </div>

        {/* Mobile View - Carousel with Auto-scroll */}
        <div className="lg:hidden">
          <div className="text-center mb-12">
            <h2 className="text-gray-900 text-4xl font-bold mb-4 leading-[1.2] tracking-tight">
              What our
              <br />
              clients say
            </h2>
            <p className="text-gray-600 text-base leading-relaxed max-w-sm mx-auto">
              Real stories from real partnerships that drive exceptional results
            </p>
          </div>

          <div className="relative">
            {/* Carousel Container */}
            <div className="overflow-hidden">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="bg-white p-8 rounded-2xl border-2 border-gray-300 shadow-lg"
              >
                <Quote className="w-12 h-12 text-[#8d81f0] mb-6 opacity-70 mx-auto" />
                <p className="text-gray-700 text-lg leading-relaxed mb-8">
                  "{testimonials[currentIndex].quote}"
                </p>
                <div className="w-full">
                  <div className="text-gray-900 font-semibold text-xl mb-1">
                    {testimonials[currentIndex].author}
                  </div>
                  <div className="text-gray-500 text-base">
                    {testimonials[currentIndex].role}, {testimonials[currentIndex].company}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 bg-white border-2 border-gray-300 rounded-full p-2 shadow-lg hover:bg-gray-50 transition-all z-10"
              aria-label="Previous testimonial"
              onMouseEnter={() => setIsAutoScrolling(false)}
              onMouseLeave={() => setIsAutoScrolling(true)}
            >
              <ChevronLeft className="w-6 h-6 text-[#8d81f0]" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 bg-white border-2 border-gray-300 rounded-full p-2 shadow-lg hover:bg-gray-50 transition-all z-10"
              aria-label="Next testimonial"
              onMouseEnter={() => setIsAutoScrolling(false)}
              onMouseLeave={() => setIsAutoScrolling(true)}
            >
              <ChevronRight className="w-6 h-6 text-[#8d81f0]" />
            </button>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                    setIsAutoScrolling(false);
                    setTimeout(() => setIsAutoScrolling(true), 5000);
                  }}
                  className={`transition-all duration-300 ${
                    currentIndex === index
                      ? "w-8 h-2 bg-[#8d81f0] rounded-full"
                      : "w-2 h-2 bg-gray-300 rounded-full hover:bg-gray-400"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}