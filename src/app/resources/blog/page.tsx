import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  FileText,
  Calendar,
  Clock,
  User,
  Tag,
  TrendingUp,
} from "lucide-react";

const featuredPost = {
  title: "The Future of ERP: AI-Powered Enterprise Solutions in 2024",
  excerpt: "Discover how artificial intelligence is revolutionizing enterprise resource planning, from predictive analytics to automated workflows. Learn what leading organizations are doing to stay ahead.",
  author: "Dr. Sarah Mitchell",
  role: "Chief Technology Advisor",
  date: "Jan 15, 2024",
  readTime: "8 min read",
  category: "AI & Innovation",
  image: "/blog/featured.jpg",
};

const posts = [
  {
    title: "Cloud Migration: 5 Critical Success Factors",
    excerpt: "Essential strategies for seamless cloud transitions that minimize downtime and maximize ROI.",
    author: "Michael Chen",
    date: "Jan 10, 2024",
    readTime: "6 min read",
    category: "Cloud",
  },
  {
    title: "Salesforce vs Traditional CRM: A 2024 Comparison",
    excerpt: "An in-depth analysis of why enterprises are choosing Salesforce for customer management.",
    author: "Jennifer Walsh",
    date: "Jan 8, 2024",
    readTime: "5 min read",
    category: "CRM",
  },
  {
    title: "Building High-Performance IT Teams",
    excerpt: "Proven strategies for attracting, developing, and retaining top technical talent.",
    author: "David Kumar",
    date: "Jan 5, 2024",
    readTime: "7 min read",
    category: "Leadership",
  },
  {
    title: "SAP S/4HANA: Implementation Best Practices",
    excerpt: "Learn from real-world deployments and avoid common pitfalls in your SAP journey.",
    author: "Lisa Anderson",
    date: "Jan 3, 2024",
    readTime: "9 min read",
    category: "ERP",
  },
  {
    title: "Data Analytics: From Insights to Action",
    excerpt: "Transform your data strategy with actionable analytics frameworks.",
    author: "Robert Garcia",
    date: "Dec 28, 2023",
    readTime: "6 min read",
    category: "Analytics",
  },
  {
    title: "Cybersecurity Trends for Enterprises",
    excerpt: "Stay protected with the latest security strategies and compliance requirements.",
    author: "Emily Thompson",
    date: "Dec 22, 2023",
    readTime: "8 min read",
    category: "Security",
  },
];

const categories = ["All", "AI & Innovation", "Cloud", "ERP", "CRM", "Analytics", "Security", "Leadership"];

export default function BlogPage() {
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
              <FileText className="w-6 h-6 text-[var(--hz-cyan-400)]" />
              <span className="text-[var(--hz-cyan-400)] font-semibold">Resources</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Insights & Articles
            </h1>
            <p className="text-xl text-white/70 leading-relaxed">
              Expert perspectives on enterprise technology, digital transformation,
              and industry best practices from our thought leaders.
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-white border-b border-slate-200 sticky top-[72px] lg:top-[80px] z-40">
        <div className="container-custom">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  category === "All"
                    ? "bg-[var(--hz-cobalt)] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-[var(--hz-cobalt-100)] hover:text-[var(--hz-cobalt)]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="rounded-3xl p-8 md:p-12 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, #07142b 0%, #0e2147 100%)" }}>
            <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(55% 75% at 90% 8%, rgba(29,78,216,0.4), transparent 60%)" }} />

            <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-white/10 text-[var(--hz-cyan-400)] text-sm font-semibold rounded-full">
                    {featuredPost.category}
                  </span>
                  <span className="flex items-center gap-1 text-white/60 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    Trending
                  </span>
                </div>

                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {featuredPost.title}
                </h2>

                <p className="text-lg text-white/70 mb-6 leading-relaxed">
                  {featuredPost.excerpt}
                </p>

                <div className="flex items-center gap-6 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--hz-cyan-400)] to-[var(--hz-cobalt)] flex items-center justify-center text-white font-bold">
                      {featuredPost.author.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-white">{featuredPost.author}</p>
                      <p className="text-sm text-white/60">{featuredPost.role}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-white/60 mb-8">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {featuredPost.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {featuredPost.readTime}
                  </span>
                </div>

                <button className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[var(--hz-cobalt)] font-semibold rounded-xl hover:bg-[var(--hz-cobalt-100)] transition-colors">
                  Read Article
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <div className="hidden lg:block">
                <div className="aspect-[4/3] bg-gradient-to-br from-[var(--hz-cobalt)] to-[#07142b] rounded-2xl flex items-center justify-center">
                  <FileText className="w-24 h-24 text-white/40" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All Posts */}
      <section className="py-16 bg-slate-50">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Latest Articles</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, index) => (
              <article
                key={index}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-[var(--hz-cobalt-100)] transition-all duration-300 group"
              >
                <div className="aspect-[16/9] bg-[var(--hz-cobalt-100)] flex items-center justify-center">
                  <FileText className="w-12 h-12 text-[var(--hz-cobalt)] opacity-30" />
                </div>

                <div className="p-6">
                  <span className="inline-block px-3 py-1 bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)] text-xs font-semibold rounded-full mb-3">
                    {post.category}
                  </span>

                  <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-[var(--hz-cobalt)] transition-colors line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--hz-cobalt)] to-[var(--hz-cyan-400)] flex items-center justify-center text-white text-xs font-bold">
                        {post.author.charAt(0)}
                      </div>
                      <span>{post.author}</span>
                    </div>
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="text-center mt-12">
            <button className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[var(--hz-cobalt)] text-[var(--hz-cobalt)] font-semibold rounded-xl hover:bg-[var(--hz-cobalt)] hover:text-white transition-all">
              Load More Articles
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 bg-gradient-to-r from-[var(--hz-cobalt)] to-[var(--hz-cobalt-600)] text-white">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
            <p className="text-xl text-white/80 mb-8">
              Get the latest insights and industry trends delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--hz-cyan-400)]"
              />
              <button className="px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
