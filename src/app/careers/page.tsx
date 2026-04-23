"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Building2,
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Globe,
  Loader2,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Users,
  Building,
  Calendar,
} from "lucide-react";
import { Job } from "@/lib/aws/dynamodb";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const departments = ["All Departments", "ERP Solutions", "Cloud Services", "Data & AI", "Salesforce", "IT Staffing", "Training", "PMO"];
const jobTypes = ["All Types", "full-time", "part-time", "contract", "contract-to-hire", "direct-hire", "managed-teams", "remote"];

// Format job type for display
const formatJobType = (type: string) => {
  const typeMap: Record<string, string> = {
    "full-time": "Full-time",
    "part-time": "Part-time",
    "contract": "Contract",
    "contract-to-hire": "Contract-to-Hire",
    "direct-hire": "Direct Hire",
    "managed-teams": "Managed Teams",
    "remote": "Remote",
  };
  return typeMap[type] || type;
};

// Format due date
const formatDueDate = (dueDate: string | undefined): { text: string; isUrgent: boolean } | null => {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: "Closed", isUrgent: true };
  if (diffDays === 0) return { text: "Due Today", isUrgent: true };
  if (diffDays === 1) return { text: "Due Tomorrow", isUrgent: true };
  if (diffDays <= 7) return { text: `${diffDays} days left`, isUrgent: true };
  return { text: `Due ${due.toLocaleDateString()}`, isUrgent: false };
};

const PER_PAGE_OPTIONS = [6, 12, 24] as const;

interface JobWithUI extends Job {
  postedAgo?: string;
}

export default function CareersPage() {
  
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pb-28 overflow-hidden">
        {/* Animated background orbs */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100 rounded-full blur-3xl opacity-40"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], x: [0, -20, 0], y: [0, 20, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-100 rounded-full blur-3xl opacity-40"
        />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block text-sm font-medium text-gray-400 uppercase tracking-[0.2em] mb-4"
            >
              Careers at Ocean Blue
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="heading-section text-gray-900 mb-6"
            >
              Build Your{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-medium">
                  Future
                </span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="absolute -bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-blue-200 to-cyan-200 opacity-50 -z-0 rounded-full"
                  style={{ originX: 0 }}
                />
              </span>{" "}
              With Us
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-gray-500 leading-relaxed mb-10 max-w-2xl mx-auto"
            >
              Join a team of innovators, problem-solvers, and technology experts who are shaping the future of enterprise IT.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap justify-center gap-6 text-gray-600"
            >
              {[
                { icon: Building2, label: "50+ Employees" },
                { icon: Globe, label: "3 Locations" },
                { icon: Briefcase, label: "Open Positions" },
              ].map((stat, index) => (
                <div key={stat.label} className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-medium">{stat.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
          <div className="flex justify-center align-center">
            <Link href="/careers/search" className="mt-12 inline-flex items-center gap-2 text-blue-600 bg-blue-100 hover:bg-blue-200 p-4 rounded-lg font-medium transition-colors">
              View Open Positions
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Additional sections like company culture, benefits, employee testimonials can be added here */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-sm font-medium text-gray-400 uppercase tracking-[0.2em] mb-4 block">Why Work With Us?</span>
            <h2 className="heading-subsection text-gray-900 mb-4">
              A Culture of{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Innovation</span> and{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Collaboration</span>
            </h2>
            <p className="text-gray-500">
              At Ocean Blue, we foster a supportive and inclusive environment where every voice is heard. We believe in continuous learning, professional growth, and making a positive impact on our clients and communities.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Professional Growth",
                description: "We invest in our employees' development through training, mentorship, and opportunities to work on cutting-edge projects.",
                icon: CalendarClock,
              },
              {
                title: "Work-Life Balance",
                description: "We understand the importance of maintaining a healthy work-life balance and provide flexible working arrangements to support our employees.",
                icon: Clock,
              },
              {
                title: "Inclusive Environment",
                description: "We are committed to creating an inclusive workplace where diversity is celebrated, and every employee feels valued and respected.",
                icon: Users,
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500">{feature.description}</p>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* Our Benefits Section as Equal employment opportunity,medical,401k */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-sm font-medium text-gray-400 uppercase tracking-[0.2em] mb-4 block">Our Benefits</span>
            <h2 className="heading-subsection text-gray-900 mb-4">
              Comprehensive Benefits for a{" "}<span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Healthy</span> and{" "}<span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Secure</span> Future
            </h2>
            <p className="text-gray-500"> We offer a competitive benefits package that includes health insurance, retirement plans, paid time off, and more to support the well-being and financial security of our employees.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Health Insurance",
                description: "Comprehensive medical, dental, and vision coverage to keep you and your family healthy.",
                icon: CheckCircle2,
              },
              {
                title: "Retirement Plans",
                description: "Robust retirement savings options to help you build a secure financial future.",
                icon: Building,
              },
              {
                title: "Paid Time Off",
                description: "Generous vacation and sick leave policies to ensure you have time to rest and recharge.",
                icon: Calendar,
              }
            ].map((benefit, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-500">{benefit.description}</p>
              </div>
            ))}
          </div>
          {/* 401k and other benefits can be added here in the future  */}
          <div className="flex justify-center align-center mt-12">
           <div className="text-center">
              <h2 className="heading-subsection text-gray-900 mb-4">
                We Are an{" "}
                <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Equal Opportunity Employer</span>
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                We celebrate diversity and are committed to creating an inclusive environment for all employees. We do not discriminate based on race, color, religion, sex, sexual orientation, gender
                identity, national origin, disability, or veteran status.
              </p>
          </div>
        </div>
        </div>
      </section>

    {/* Call to Action Section */}
    <section className="py-16 md:py-20 bg-gradient-to-r from-blue-600 to-cyan-600">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="heading-subsection text-white mb-4">Ready to Join Our Team?</h2>
          <p className="text-blue-100 max-w-2xl mx-auto mb-8">
            We're always looking for talented individuals to help us drive innovation and make a positive impact.
          </p>
          <Link href="/careers/search" className="inline-flex items-center gap-2 text-blue-600 bg-white hover:bg-gray-100 p-4 rounded-lg font-medium transition-colors">
            View Open Positions
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>

    </div>
  );
}
