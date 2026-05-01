import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  BookOpen,
  BarChart3,
  Download,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Explore Ocean Blue Corporation's resource library — in-depth blog articles, enterprise case studies, and free ebooks on ERP, cloud, AI, IT staffing, and digital transformation.",
  openGraph: {
    title: "Resources | Ocean Blue Corporation",
    description:
      "Blog, case studies, and ebooks on enterprise IT, ERP, cloud, AI, and staffing.",
    url: "https://oceanbluecorp.com/resources",
  },
  alternates: { canonical: "https://oceanbluecorp.com/resources" },
};

const resourceTypes = [
  {
    title: "Blog",
    description:
      "Expert perspectives on enterprise technology, digital transformation, and industry best practices from our thought leaders.",
    icon: FileText,
    href: "/resources/blog",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
  },
  {
    title: "Case Studies",
    description:
      "Real-world success stories showcasing how we've helped organizations achieve their digital transformation goals.",
    icon: BarChart3,
    href: "/resources/case-studies",
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50",
    textColor: "text-purple-600",
  },
  {
    title: "eBooks & Guides",
    description:
      "In-depth guides and comprehensive resources to help you navigate complex technology decisions.",
    icon: BookOpen,
    href: "/resources/ebook",
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-600",
  },
];

export default function ResourcesPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-3xl" />

        <div className="container-custom relative z-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Download className="w-6 h-6 text-cyan-400" />
              <span className="text-cyan-400 font-semibold">Resources</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Knowledge Hub
            </h1>
            <p className="text-xl text-white/70 leading-relaxed">
              Explore our collection of insights, case studies, and guides
              designed to help you make informed technology decisions and drive
              business success.
            </p>
          </div>
        </div>
      </section>

      {/* Resource Types */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="grid md:grid-cols-3 gap-8">
            {resourceTypes.map((resource) => (
              <Link
                key={resource.title}
                href={resource.href}
                className="group bg-white rounded-2xl border border-slate-200 p-8 hover:shadow-xl hover:border-blue-200 transition-all duration-300"
              >
                <div
                  className={`w-14 h-14 ${resource.bgColor} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                >
                  <resource.icon className={`w-7 h-7 ${resource.textColor}`} />
                </div>

                <h2 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-blue-700 transition-colors">
                  {resource.title}
                </h2>

                <p className="text-slate-600 mb-6 leading-relaxed">
                  {resource.description}
                </p>

                <span className="inline-flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition-all">
                  Explore {resource.title}
                  <ArrowRight className="w-5 h-5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Resources */}
      <section className="py-20 bg-slate-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Featured Resources
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Start with our most popular content to accelerate your digital
              transformation journey.
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl" />

            <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block px-3 py-1 bg-cyan-500/20 text-cyan-400 text-sm font-semibold rounded-full mb-4">
                  Latest
                </span>

                <h3 className="text-3xl md:text-4xl font-bold mb-4">
                  The Future of Enterprise Technology
                </h3>

                <p className="text-lg text-white/70 mb-6 leading-relaxed">
                  Discover how leading organizations are leveraging AI, cloud
                  computing, and modern architectures to stay ahead of the
                  competition.
                </p>

                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/resources/blog"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-900 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
                  >
                    Read Articles
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/resources/ebook"
                    className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
                  >
                    Download Guides
                    <Download className="w-5 h-5" />
                  </Link>
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="aspect-[4/3] bg-gradient-to-br from-blue-600/50 to-cyan-600/50 rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-24 h-24 text-white/40" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
            <p className="text-xl text-white/80 mb-8">
              Get the latest insights and industry trends delivered to your
              inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
              <button className="px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
