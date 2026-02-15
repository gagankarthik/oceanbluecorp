"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Target,
  Eye,
  Heart,
  Award,
  Globe,
  Users,
  Building2,
  TrendingUp,
  CheckCircle2,
  Lightbulb,
  Shield,
  Zap,
  Sparkles,
} from "lucide-react";

const values = [
  {
    icon: Lightbulb,
    title: "Innovation",
    description:
      "We continuously push boundaries, embracing new technologies and methodologies to deliver cutting-edge solutions.",
  },
  {
    icon: Shield,
    title: "Integrity",
    description:
      "We build trust through transparency, ethical practices, and unwavering commitment to our clients' success.",
  },
  {
    icon: Heart,
    title: "Client Focus",
    description:
      "Our clients' goals are our goals. We partner closely to understand needs and deliver exceptional outcomes.",
  },
  {
    icon: Zap,
    title: "Excellence",
    description:
      "We maintain the highest standards in everything we do, from project delivery to customer service.",
  },
];

const milestones = [
  {
    year: "2013",
    title: "Foundation",
    description: "Ocean Blue Corporation founded with a vision to transform enterprise IT",
  },
  {
    year: "2015",
    title: "First 100 Clients",
    description: "Reached milestone of 100 enterprise clients across North America",
  },
  {
    year: "2016",
    title: "Global Expansion",
    description: "Opened offices in Europe and Asia Pacific regions",
  },
  {
    year: "2019",
    title: "AI Practice Launch",
    description: "Established dedicated AI and Machine Learning practice",
  },
  {
    year: "2022",
    title: "500+ Clients",
    description: "Serving over 500 enterprise clients globally",
  },
  {
    year: "2024",
    title: "Industry Leadership",
    description: "Recognized as a leader in enterprise digital transformation",
  },
];

const leadership = [
  {
    name: "Sarojini Gude",
    role: "President",
    bio: "25+ years in enterprise technology. Former SVP at a Fortune 100 tech company.",
    initials: "SG",
  },
  {
    name: "Brent Wallace",
    role: "SVP, Workforce Solutions",
    bio: "Cloud architecture expert with patents in distributed systems.",
    initials: "SC",
  },
  {
    name: "Sushma Moturu",
    role: "Human Resource Manager",
    bio: "Operations leader with expertise in scaling global teams.",
    initials: "RW",
  },
  {
    name: "Emily Torres",
    role: "Chief Revenue Officer",
    bio: "Enterprise sales veteran with track record of 300% growth.",
    initials: "ET",
  },
];

const stats = [
  { value: "500+", label: "Enterprise Clients", icon: Building2 },
  { value: "2,500+", label: "Team Members", icon: Users },
  { value: "25+", label: "Global Offices", icon: Globe },
  { value: "98%", label: "Client Retention", icon: TrendingUp },
];

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  initial: {},
  whileInView: {
    transition: {
      staggerChildren: 0.1,
    },
  },
  viewport: { once: true },
};

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#1e3a8a] overflow-hidden">
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

        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-6"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-white/90">About Us</span>
            </motion.div>
            <h1 className="heading-xl text-white mb-6">
              Transforming Enterprises Through Technology Since 2010
            </h1>
            <p className="text-xl text-white/70 leading-relaxed">
              We are a global technology company dedicated to helping enterprises
              navigate digital transformation with confidence. Our mission is to
              deliver innovative solutions that drive measurable business outcomes.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="container-custom">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0a192f] to-[#1e3a8a] flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <p className="text-4xl font-bold text-[#0a192f] mb-1">{stat.value}</p>
                <p className="text-gray-500">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-8">
            <motion.div
              {...fadeInUp}
              className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12 shadow-sm hover:shadow-lg transition-shadow duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0a192f] to-[#1e3a8a] flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-cyan-400" />
              </div>
              <h2 className="heading-md text-[#0a192f] mb-4">Our Mission</h2>
              <p className="text-gray-600 leading-relaxed">
                To empower enterprises worldwide with innovative technology solutions
                that accelerate growth, enhance efficiency, and create lasting
                competitive advantages. We are committed to being the trusted partner
                that guides organizations through their digital transformation journey.
              </p>
            </motion.div>

            <motion.div
              {...fadeInUp}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12 shadow-sm hover:shadow-lg transition-shadow duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0a192f] to-[#1e3a8a] flex items-center justify-center mb-6">
                <Eye className="w-7 h-7 text-cyan-400" />
              </div>
              <h2 className="heading-md text-[#0a192f] mb-4">Our Vision</h2>
              <p className="text-gray-600 leading-relaxed">
                To be the global leader in enterprise digital transformation,
                recognized for our innovative solutions, exceptional talent, and
                unwavering commitment to client success. We envision a world where
                every enterprise can harness the full potential of technology.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            {...fadeInUp}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#0a192f]/5 rounded-full text-[#0a192f] font-medium text-sm mb-4">
              Our Values
            </span>
            <h2 className="heading-lg text-[#0a192f] mb-6">The Principles That Guide Us</h2>
            <p className="text-gray-600 text-lg">
              Our core values shape every interaction, decision, and solution we deliver.
              They are the foundation of our culture and our commitment to excellence.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-gray-50 rounded-2xl border border-gray-100 p-8 text-center hover:shadow-lg transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0a192f] to-[#1e3a8a] flex items-center justify-center mx-auto mb-6">
                  <value.icon className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold text-[#0a192f] mb-3">{value.title}</h3>
                <p className="text-gray-500 leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <motion.div
            {...fadeInUp}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#0a192f]/5 rounded-full text-[#0a192f] font-medium text-sm mb-4">
              Our Journey
            </span>
            <h2 className="heading-lg text-[#0a192f] mb-6">Milestones That Define Us</h2>
            <p className="text-gray-600 text-lg">
              From our humble beginnings to becoming a global leader, every milestone
              represents our commitment to growth and excellence.
            </p>
          </motion.div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-400 to-blue-600 hidden lg:block" />

            <div className="space-y-8 lg:space-y-0">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.year}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`lg:flex items-center ${
                    index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                  }`}
                >
                  <div className="lg:w-1/2 lg:px-12">
                    <div
                      className={`bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-all duration-300 ${
                        index % 2 === 0 ? "lg:text-right" : "lg:text-left"
                      }`}
                    >
                      <span className="text-cyan-500 font-bold text-lg">
                        {milestone.year}
                      </span>
                      <h3 className="text-xl font-semibold text-[#0a192f] mt-2 mb-2">
                        {milestone.title}
                      </h3>
                      <p className="text-gray-500">
                        {milestone.description}
                      </p>
                    </div>
                  </div>

                  {/* Timeline dot */}
                  <div className="hidden lg:flex w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 items-center justify-center z-10 mx-auto shadow-lg">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>

                  <div className="lg:w-1/2" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            {...fadeInUp}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#0a192f]/5 rounded-full text-[#0a192f] font-medium text-sm mb-4">
              Leadership
            </span>
            <h2 className="heading-lg text-[#0a192f] mb-6">Meet Our Executive Team</h2>
            <p className="text-gray-600 text-lg">
              Our leadership team brings decades of combined experience in enterprise
              technology, driving innovation and growth across the organization.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {leadership.map((leader, index) => (
              <motion.div
                key={leader.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-gray-50 rounded-2xl border border-gray-100 p-8 text-center hover:shadow-lg transition-all duration-300"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#0a192f] to-[#1e3a8a] flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold shadow-lg">
                  {leader.initials}
                </div>
                <h3 className="text-xl font-semibold text-[#0a192f] mb-1">{leader.name}</h3>
                <p className="text-cyan-600 font-medium mb-4">{leader.role}</p>
                <p className="text-sm text-gray-500">{leader.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Presence */}
      <section className="section-padding bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#1e3a8a] text-white relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute -top-20 -right-20 w-[500px] h-[500px] bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl"
          />
        </div>

        <div className="container-custom relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeInUp}>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/20 text-white/90 font-medium text-sm mb-6">
                Global Presence
              </span>
              <h2 className="heading-lg mb-6">Serving Enterprises Worldwide</h2>
              <p className="text-white/70 text-lg leading-relaxed mb-8">
                With offices across North America, Europe, and Asia Pacific, we
                provide local expertise with global capabilities. Our distributed
                teams work around the clock to ensure seamless service delivery.
              </p>
              <div className="grid grid-cols-3 gap-8">
                {[
                  { value: "12", label: "Americas" },
                  { value: "8", label: "Europe" },
                  { value: "5", label: "Asia Pacific" },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <p className="text-4xl font-bold mb-2 text-cyan-400">{item.value}</p>
                    <p className="text-white/60">{item.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="aspect-video bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-sm">
                <Globe className="w-32 h-32 text-cyan-400/50" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <motion.div
            {...fadeInUp}
            className="bg-white rounded-3xl border border-gray-200 p-8 md:p-16 text-center shadow-sm"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0a192f] to-[#1e3a8a] flex items-center justify-center mx-auto mb-6">
              <Award className="w-8 h-8 text-cyan-400" />
            </div>
            <h2 className="heading-lg text-[#0a192f] mb-4">Join Our Journey</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
              Whether you&apos;re looking for a technology partner or an exciting career
              opportunity, we&apos;d love to connect with you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25 group"
              >
                Partner With Us
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/careers"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#0a192f]/5 text-[#0a192f] font-semibold rounded-xl hover:bg-[#0a192f]/10 transition-all border border-[#0a192f]/10"
              >
                View Careers
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
