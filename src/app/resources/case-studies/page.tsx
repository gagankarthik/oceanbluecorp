import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Briefcase,
  TrendingUp,
  Clock,
  Users,
  CheckCircle2,
  Building2,
  BarChart3,
  Zap,
} from "lucide-react";

const featuredCase = {
  title: "Global Manufacturing Leader Achieves 40% Efficiency Gain",
  client: "Fortune 500 Manufacturing Company",
  industry: "Manufacturing",
  challenge: "Legacy ERP systems causing operational inefficiencies and data silos across 25+ global facilities.",
  solution: "Complete SAP S/4HANA implementation with cloud migration and AI-powered analytics.",
  results: [
    { metric: "40%", label: "Efficiency Improvement" },
    { metric: "60%", label: "Faster Reporting" },
    { metric: "$12M", label: "Annual Savings" },
    { metric: "99.9%", label: "System Uptime" },
  ],
  testimonial: "Ocean Blue transformed our entire operation. Their expertise in SAP and change management was instrumental in our success.",
  author: "VP of Operations",
};

const caseStudies = [
  {
    title: "Retail Chain Transforms Customer Experience with Salesforce",
    client: "National Retail Corporation",
    industry: "Retail",
    results: ["300% ROI in 18 months", "45% increase in customer satisfaction", "2x faster service resolution"],
    services: ["Salesforce", "CRM Implementation"],
  },
  {
    title: "Government Agency Modernizes IT Infrastructure",
    client: "State Government Department",
    industry: "Government",
    results: ["$5M annual cost reduction", "Zero downtime migration", "Enhanced security compliance"],
    services: ["Cloud Migration", "Managed Services"],
  },
  {
    title: "Healthcare Provider Implements AI Diagnostics",
    client: "Regional Healthcare Network",
    industry: "Healthcare",
    results: ["35% faster diagnosis", "90% accuracy improvement", "Reduced wait times by 50%"],
    services: ["AI & Analytics", "Data Integration"],
  },
  {
    title: "Financial Services Firm Scales with Cloud",
    client: "Investment Management Company",
    industry: "Financial Services",
    results: ["5x compute capacity", "70% infrastructure cost savings", "Real-time risk analytics"],
    services: ["Cloud Services", "Data Analytics"],
  },
  {
    title: "Tech Startup Builds World-Class Engineering Team",
    client: "Series B SaaS Startup",
    industry: "Technology",
    results: ["50+ engineers hired in 6 months", "30% reduction in time-to-hire", "95% retention rate"],
    services: ["Staffing Services", "Team Building"],
  },
  {
    title: "Enterprise Training Program Drives Digital Adoption",
    client: "Global Consulting Firm",
    industry: "Professional Services",
    results: ["5,000+ employees trained", "85% certification rate", "40% productivity increase"],
    services: ["Training Services", "Change Management"],
  },
];

const industries = [
  { name: "All Industries", count: 24 },
  { name: "Manufacturing", count: 8 },
  { name: "Retail", count: 5 },
  { name: "Healthcare", count: 4 },
  { name: "Financial Services", count: 4 },
  { name: "Government", count: 3 },
];

export default function CaseStudiesPage() {
  return (
    <div className="horizon">
      {/* Hero Section */}
      <section className="pt-32 pb-20 text-white relative overflow-hidden" style={{ background: "#07142b" }}>
        <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(60% 85% at 82% 0%, rgba(29,78,216,0.32), transparent 62%)" }} />

        <div className="container-custom relative z-10">
          <div className="max-w-3xl">
            <Link
              href="/resources"
              className="group mb-6 inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Back to Resources
            </Link>
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-6 h-6 text-[var(--hz-cyan-400)]" />
              <span className="text-[var(--hz-cyan-400)] font-semibold">Resources</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Client Success Stories
            </h1>
            <p className="text-xl text-white/70 leading-relaxed">
              Discover how we have helped enterprises across industries achieve
              transformational results through technology excellence.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-8 bg-white border-b border-slate-200">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-[var(--hz-cobalt)]">500+</p>
              <p className="text-sm text-slate-600">Projects Delivered</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[var(--hz-cobalt)]">98%</p>
              <p className="text-sm text-slate-600">Client Satisfaction</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[var(--hz-cobalt)]">$100M+</p>
              <p className="text-sm text-slate-600">Client Savings</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[var(--hz-cobalt)]">15+</p>
              <p className="text-sm text-slate-600">Years Experience</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Case Study */}
      <section className="py-16 bg-slate-50">
        <div className="container-custom">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="grid lg:grid-cols-2">
              <div className="bg-gradient-to-br from-[var(--hz-cobalt)] to-[var(--hz-cobalt-600)] p-8 md:p-12 text-white">
                <span className="inline-block px-4 py-1.5 bg-white/20 text-white text-sm font-semibold rounded-full mb-6">
                  Featured Case Study
                </span>

                <h2 className="text-3xl font-bold mb-4">
                  {featuredCase.title}
                </h2>

                <div className="flex items-center gap-3 mb-6">
                  <Building2 className="w-5 h-5 text-[var(--hz-cyan-400)]" />
                  <span className="text-white/80">{featuredCase.client}</span>
                </div>

                <div className="space-y-4 mb-8">
                  <div>
                    <h4 className="font-semibold text-[var(--hz-cyan-400)] mb-2">Challenge</h4>
                    <p className="text-white/70">{featuredCase.challenge}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--hz-cyan-400)] mb-2">Solution</h4>
                    <p className="text-white/70">{featuredCase.solution}</p>
                  </div>
                </div>

                <blockquote className="border-l-4 border-[var(--hz-cyan-400)] pl-4 italic text-white/80 mb-2">
                  &ldquo;{featuredCase.testimonial}&rdquo;
                </blockquote>
                <p className="text-sm text-white/60">— {featuredCase.author}</p>
              </div>

              <div className="p-8 md:p-12">
                <h3 className="text-xl font-bold text-slate-900 mb-8">Results Achieved</h3>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  {featuredCase.results.map((result, index) => (
                    <div key={index} className="text-center p-6 bg-gradient-to-br from-[var(--hz-cobalt-100)] to-[var(--hz-cobalt-100)] rounded-2xl">
                      <p className="text-3xl font-bold text-[var(--hz-cobalt)] mb-1">{result.metric}</p>
                      <p className="text-sm text-slate-600">{result.label}</p>
                    </div>
                  ))}
                </div>

                <button className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--hz-cobalt)] to-[var(--hz-cobalt)] text-white font-semibold rounded-xl hover:from-[var(--hz-cobalt)] hover:to-[var(--hz-cobalt-600)] transition-all shadow-lg shadow-[rgba(29,78,216,0.25)]">
                  Read Full Case Study
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industry Filter */}
      <section className="py-8 bg-white border-b border-slate-200">
        <div className="container-custom">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {industries.map((industry) => (
              <button
                key={industry.name}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  industry.name === "All Industries"
                    ? "bg-[var(--hz-cobalt)] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-[var(--hz-cobalt-100)] hover:text-[var(--hz-cobalt)]"
                }`}
              >
                {industry.name}
                <span className={`text-xs ${industry.name === "All Industries" ? "text-white/70" : "text-slate-400"}`}>
                  ({industry.count})
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* All Case Studies */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {caseStudies.map((study, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:border-[var(--hz-cobalt-100)] transition-all duration-300 group"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)] text-xs font-semibold rounded-full">
                    {study.industry}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-slate-900 mb-3 group-hover:text-[var(--hz-cobalt)] transition-colors line-clamp-2">
                  {study.title}
                </h3>

                <p className="text-sm text-slate-500 mb-4 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {study.client}
                </p>

                <div className="space-y-2 mb-6">
                  {study.results.map((result, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-slate-600">{result}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {study.services.map((service) => (
                    <span key={service} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg">
                      {service}
                    </span>
                  ))}
                </div>

                <button className="flex items-center gap-2 text-[var(--hz-cobalt)] font-medium hover:gap-3 transition-all">
                  View Case Study
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-[var(--hz-cobalt)] to-[var(--hz-cobalt-600)] text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Write Your Success Story?</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Join 500+ enterprises that have transformed their business with Ocean Blue.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[var(--hz-cobalt)] font-semibold rounded-xl hover:bg-[var(--hz-cobalt-100)] transition-colors"
          >
            Start Your Journey
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
