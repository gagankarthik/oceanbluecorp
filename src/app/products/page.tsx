"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

// Products - Replace with actual product details
// logo: path to logo image in /public folder (e.g., "/products/product-logo.png")
// link: external URL or internal path to redirect on click
const products = [
  {
    id: "product-1",
    name: "Blue-IQ",
    logo: "/Blue-iq.png", 
    link: "http://blue-iq.ai/", 
  },
  {
    id: "product-2",
    name: "CMHIndia",
    logo: "https://www.cmhindia.com/logo.svg",
    link: "https://www.cmhindia.com/",
  },
  {
    id: "product-3",
    name: "Inytes",
    logo: "https://cdn.inytes.com/images/brand/inytes-logo.png",
    link: "https://www.inytes.com/",
  },
];

export default function ProductsPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#1e3a8a] overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 -right-20 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-20 -left-20 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl"
          />
        </div>

        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-6"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-white/90">Our Products</span>
            </motion.div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-light text-white mb-6 leading-tight">
              Products Built{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent font-medium">
                In-House
              </span>
            </h1>
            <p className="text-lg text-white/60 leading-relaxed">
              Explore our proprietary solutions designed to drive business impact.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-20 md:py-28 lg:py-32 bg-gray-50 min-h-[60vh]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 max-w-6xl mx-auto">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Link
                  href={product.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <div className="relative bg-white rounded-3xl border border-gray-100 p-8 md:p-10 lg:p-12 hover:border-gray-200 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 text-center overflow-hidden">
                    {/* Corner accent on hover */}
                    <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-[0.08] transition-opacity rounded-tr-3xl" />

                    {/* Logo */}
                    <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 mx-auto mb-6 md:mb-8 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 overflow-hidden p-4">
                      <Image
                        src={product.logo}
                        alt={product.name}
                        width={200}
                        height={200}
                        className="object-contain w-full h-full"
                      />
                    </div>

                    {/* Name */}
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>

                    {/* Hover gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500 pointer-events-none rounded-3xl" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
