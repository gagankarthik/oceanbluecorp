"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Cloud, Brain, Users, Shield, TrendingUp, Briefcase, Code, Database, Sparkles } from "lucide-react";

const services = [
  {
    id: "01",
    title: "Cloud Infrastructure",
    description: "Scale seamlessly across AWS, Azure, and GCP with enterprise-grade architecture and 99.99% uptime.",
    icon: Cloud,
  },
  {
    id: "02",
    title: "AI & Machine Learning",
    description: "Transform data into intelligence with predictive analytics, NLP, and computer vision solutions.",
    icon: Brain,
  },
  {
    id: "03",
    title: "IT Talent Solutions",
    description: "Build exceptional teams with pre-vetted specialists who integrate seamlessly into your organization.",
    icon: Users,
  },
  {
    id: "04",
    title: "Enterprise Systems",
    description: "Modernize legacy systems with SAP, Oracle, and cloud-native platform migrations.",
    icon: Briefcase,
  },
  {
    id: "05",
    title: "Managed Services",
    description: "24/7 proactive monitoring, maintenance, and performance optimization for your infrastructure.",
    icon: Shield,
  },
  {
    id: "06",
    title: "Growth Strategy",
    description: "Strategic consulting that aligns technology roadmaps with business objectives.",
    icon: TrendingUp,
  },
  {
    id: "07",
    title: "DevOps Excellence",
    description: "Automated CI/CD pipelines, container orchestration, and infrastructure as code solutions.",
    icon: Code,
  },
  {
    id: "08",
    title: "Data Analytics",
    description: "Real-time analytics, data warehousing, and business intelligence for data-driven decisions.",
    icon: Database,
  },
  {
    id: "09",
    title: "Digital Transformation",
    description: "End-to-end digital transformation strategies that future-proof your business operations.",
    icon: Sparkles,
  },
];

export default function TerminalServices() {
  return (
    <section className="relative bg-[#eceafc]  py-24 md:py-32 overflow-hidden">
      <div className="px-6 md:px-12 lg:px-20 max-w-[1400px] mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16 text-center"
        >
          <span className="text-[#8d81f0] text-sm font-mono tracking-wider mb-4 block">
            WHAT WE DO
          </span>
          <h2 className="text-slate-900 text-5xl lg:text-6xl font-bold mb-4 leading-[1.2] tracking-tight">
            Comprehensive solutions
            <br />
            for modern enterprises
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            End-to-end technology services that drive innovation and business growth
          </p>
        </motion.div>

        {/* Services Grid with Lines */}
        <div className="bg-[#f0effc] relative hidden lg:block rounded-2xl">
          <div className="grid grid-cols-3">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="relative p-8 lg:p-10 flex flex-col min-h-[360px] group"
              >
                <Link href="/services" className="flex flex-col h-full">
                  {/* ID */}
                  <div className="text-gray-400 text-sm font-mono mb-6 group-hover:text-[#8d81f0] transition-colors">
                    {service.id}
                  </div>

                  {/* Icon */}
                  <div className="mb-6">
                    <service.icon className="w-12 h-12 text-[#8d81f0] group-hover:scale-110 transition-all duration-300" />
                  </div>

                  {/* Title */}
                  <h3 className="text-slate-900 text-2xl font-semibold mb-4 tracking-tight group-hover:text-[#8d81f0] transition-colors">
                    {service.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                    {service.description}
                  </p>

                  {/* Hover indicator */}
                  <div className="mt-6 h-px w-0 bg-[#8d81f0] group-hover:w-full transition-all duration-500" />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Vertical Lines */}
          <div className="absolute left-1/3 top-8 bottom-8 w-px bg-gray-300 transform -translate-x-1/2"></div>
          <div className="absolute left-2/3 top-8 bottom-8 w-px bg-gray-300 transform -translate-x-1/2"></div>
          
          {/* Horizontal Lines */}
          <div className="absolute top-1/3 left-8 right-8 h-px bg-gray-300 transform -translate-y-1/2"></div>
          <div className="absolute top-2/3 left-8 right-8 h-px bg-gray-300 transform -translate-y-1/2"></div>
        </div>

        {/* Mobile View - Grid Layout */}
        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
            >
              <Link
                href="/services"
                className="group block p-6 bg-white rounded-xl transition-all duration-300 shadow-sm hover:shadow-md border border-gray-200"
              >
                {/* ID */}
                <div className="text-gray-400 text-xs font-mono mb-4 group-hover:text-[#8d81f0] transition-colors">
                  {service.id}
                </div>

                {/* Icon */}
                <div className="mb-4">
                  <service.icon className="w-10 h-10 text-[#8d81f0]" />
                </div>

                {/* Title */}
                <h3 className="text-slate-900 text-xl font-semibold mb-2 tracking-tight">
                  {service.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-sm leading-relaxed">
                  {service.description}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 text-center"
        >
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-[#8d81f0] hover:text-[#a9a1ee] transition-colors text-lg font-medium group"
          >
            <span>View all services</span>
            <span className="text-2xl group-hover:translate-x-2 transition-transform">→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}