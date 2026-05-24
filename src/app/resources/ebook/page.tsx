import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Download,
  FileText,
  CheckCircle2,
  Clock,
  Users,
} from "lucide-react";

const ebooks = [
  {
    title: "Digital Transformation Playbook 2024",
    description: "A comprehensive guide to modernizing your enterprise with cloud, AI, and ERP solutions.",
    pages: 45,
    readTime: "25 min",
    category: "Digital Strategy",
    featured: true,
    topics: ["Cloud Migration", "AI Integration", "Change Management", "ROI Optimization"],
  },
  {
    title: "SAP S/4HANA Migration Guide",
    description: "Step-by-step roadmap for successful SAP S/4HANA implementation and migration.",
    pages: 32,
    readTime: "18 min",
    category: "ERP Solutions",
    featured: false,
    topics: ["Assessment", "Planning", "Migration", "Testing"],
  },
  {
    title: "Salesforce Best Practices",
    description: "Maximize your CRM investment with proven strategies and implementation tips.",
    pages: 28,
    readTime: "15 min",
    category: "CRM",
    featured: false,
    topics: ["Sales Cloud", "Service Cloud", "Analytics", "Automation"],
  },
  {
    title: "Cloud Security Essentials",
    description: "Protect your cloud infrastructure with enterprise-grade security frameworks.",
    pages: 38,
    readTime: "20 min",
    category: "Security",
    featured: false,
    topics: ["Compliance", "Data Protection", "Access Control", "Monitoring"],
  },
  {
    title: "AI in Enterprise: A Practical Guide",
    description: "Learn how to leverage AI and machine learning for business outcomes.",
    pages: 40,
    readTime: "22 min",
    category: "AI & Analytics",
    featured: false,
    topics: ["Machine Learning", "Predictive Analytics", "NLP", "Computer Vision"],
  },
  {
    title: "IT Staffing Strategy Guide",
    description: "Build and scale high-performing IT teams with proven staffing strategies.",
    pages: 24,
    readTime: "12 min",
    category: "Staffing",
    featured: false,
    topics: ["Talent Acquisition", "Team Scaling", "Retention", "Remote Teams"],
  },
];

export default function EbookPage() {
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
              <BookOpen className="w-6 h-6 text-[var(--hz-cyan-400)]" />
              <span className="text-[var(--hz-cyan-400)] font-semibold">Resources</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Free Ebooks & Guides
            </h1>
            <p className="text-xl text-white/70 leading-relaxed">
              Download our comprehensive guides and whitepapers to accelerate your
              digital transformation journey. Expert insights, practical strategies.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Ebook */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="bg-gradient-to-br from-[var(--hz-cobalt-100)] to-[var(--hz-cobalt-100)] rounded-3xl p-8 md:p-12 border border-[var(--hz-cobalt-100)]">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block px-4 py-1.5 bg-[var(--hz-cobalt)] text-white text-sm font-semibold rounded-full mb-4">
                  Featured Resource
                </span>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">
                  {ebooks[0].title}
                </h2>
                <p className="text-lg text-slate-600 mb-6">
                  {ebooks[0].description}
                </p>

                <div className="flex flex-wrap gap-4 mb-8">
                  <div className="flex items-center gap-2 text-slate-600">
                    <FileText className="w-5 h-5 text-[var(--hz-cobalt)]" />
                    <span>{ebooks[0].pages} pages</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-5 h-5 text-[var(--hz-cobalt)]" />
                    <span>{ebooks[0].readTime} read</span>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  {ebooks[0].topics.map((topic) => (
                    <div key={topic} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="text-slate-700">{topic}</span>
                    </div>
                  ))}
                </div>

                <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--hz-cobalt)] to-[var(--hz-cobalt)] text-white font-semibold rounded-xl hover:from-[var(--hz-cobalt)] hover:to-[var(--hz-cobalt-600)] transition-all shadow-lg shadow-[rgba(29,78,216,0.25)]">
                  <Download className="w-5 h-5" />
                  Download Free Ebook
                </button>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 bg-[var(--hz-cobalt-100)] rounded-3xl blur-2xl" />
                <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
                  <div className="aspect-[3/4] bg-gradient-to-br from-[var(--hz-cobalt)] to-[var(--hz-cobalt-600)] rounded-xl flex items-center justify-center">
                    <BookOpen className="w-24 h-24 text-white/80" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All Ebooks */}
      <section className="py-16 bg-slate-50">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">All Ebooks & Guides</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ebooks.slice(1).map((ebook, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:border-[var(--hz-cobalt-100)] transition-all duration-300 group"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-[var(--hz-cobalt)] to-[var(--hz-cobalt)] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-7 h-7 text-white" />
                </div>

                <span className="inline-block px-3 py-1 bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)] text-xs font-semibold rounded-full mb-3">
                  {ebook.category}
                </span>

                <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-[var(--hz-cobalt)] transition-colors">
                  {ebook.title}
                </h3>

                <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                  {ebook.description}
                </p>

                <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                  <span>{ebook.pages} pages</span>
                  <span>{ebook.readTime}</span>
                </div>

                <button className="flex items-center gap-2 text-[var(--hz-cobalt)] font-medium hover:gap-3 transition-all">
                  Download Free
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-[var(--hz-cobalt)] to-[var(--hz-cobalt-600)] text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold mb-4">Need Custom Solutions?</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Our experts can help you implement the strategies from our guides.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[var(--hz-cobalt)] font-semibold rounded-xl hover:bg-[var(--hz-cobalt-100)] transition-colors"
          >
            Schedule a Consultation
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
