import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Heart,
  GraduationCap,
  Plane,
  Laptop,
  Coffee,
  Users,
  TrendingUp,
  Globe,
  Star,
  Building2,
  Zap,
  Target,
  Award,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Careers - Join Our Team | Open Positions",
  description:
    "Join Ocean Blue Corporation and build your career in enterprise technology. Explore open positions in ERP, Cloud, AI, Salesforce, and more. Competitive benefits and growth opportunities.",
  openGraph: {
    title: "Careers at Ocean Blue Corporation",
    description:
      "Build your career in enterprise technology. Join our team of 2,500+ professionals worldwide.",
  },
};

const benefits = [
  {
    icon: Heart,
    title: "Health & Wellness",
    description: "Comprehensive medical, dental, and vision coverage for you and your family",
  },
  {
    icon: GraduationCap,
    title: "Learning & Development",
    description: "Annual learning budget and access to certification programs",
  },
  {
    icon: DollarSign,
    title: "Competitive Compensation",
    description: "Industry-leading salaries with performance bonuses and equity",
  },
  {
    icon: Plane,
    title: "Flexible PTO",
    description: "Generous paid time off plus company holidays and wellness days",
  },
  {
    icon: Laptop,
    title: "Remote-First Culture",
    description: "Work from anywhere with flexible hybrid arrangements",
  },
  {
    icon: Coffee,
    title: "Work-Life Balance",
    description: "Flexible hours and support for your personal commitments",
  },
];

const openings = [
  {
    title: "Senior SAP S/4HANA Consultant",
    department: "ERP Solutions",
    location: "San Francisco, CA",
    type: "Full-time",
    level: "Senior",
    remote: true,
  },
  {
    title: "Cloud Solutions Architect",
    department: "Cloud Services",
    location: "New York, NY",
    type: "Full-time",
    level: "Senior",
    remote: true,
  },
  {
    title: "Machine Learning Engineer",
    department: "Data & AI",
    location: "Remote",
    type: "Full-time",
    level: "Mid-Senior",
    remote: true,
  },
  {
    title: "Salesforce Developer",
    department: "Salesforce",
    location: "Austin, TX",
    type: "Full-time",
    level: "Mid",
    remote: true,
  },
  {
    title: "Technical Recruiter",
    department: "IT Staffing",
    location: "Chicago, IL",
    type: "Full-time",
    level: "Mid",
    remote: false,
  },
  {
    title: "Corporate Trainer - Cloud Technologies",
    department: "Training",
    location: "Remote",
    type: "Full-time",
    level: "Senior",
    remote: true,
  },
  {
    title: "DevOps Engineer",
    department: "Cloud Services",
    location: "Seattle, WA",
    type: "Full-time",
    level: "Mid-Senior",
    remote: true,
  },
  {
    title: "Data Engineer",
    department: "Data & AI",
    location: "Boston, MA",
    type: "Full-time",
    level: "Mid",
    remote: true,
  },
  {
    title: "Project Manager - Enterprise Solutions",
    department: "PMO",
    location: "Denver, CO",
    type: "Full-time",
    level: "Senior",
    remote: true,
  },
];

const values = [
  {
    icon: Zap,
    title: "Innovation",
    description: "Push boundaries and embrace new technologies",
  },
  {
    icon: Users,
    title: "Collaboration",
    description: "Work together to achieve extraordinary results",
  },
  {
    icon: Target,
    title: "Excellence",
    description: "Maintain the highest standards in everything we do",
  },
  {
    icon: Award,
    title: "Integrity",
    description: "Build trust through transparency and ethical practices",
  },
];


export default function CareersPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 gradient-hero overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="container-custom relative z-10">
          <div className="max-w-3xl">
            <p className="text-cyan-300 font-semibold mb-4">Careers</p>
            <h1 className="heading-xl text-white mb-6">
              Build Your Future With Us
            </h1>
            <p className="text-xl text-white/80 leading-relaxed mb-8">
              Join a team of innovators, problem-solvers, and technology experts
              who are shaping the future of enterprise IT. Discover your potential
              at Ocean Blue Corporation.
            </p>
            <a
              href="#openings"
              className="btn-primary bg-white text-primary hover:bg-white/90 inline-flex items-center gap-2"
            >
              View Open Positions
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Culture Section */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-primary font-semibold mb-4">Our Culture</p>
              <h2 className="heading-lg mb-6">
                Where Innovation Meets Opportunity
              </h2>
              <p className="text-body mb-8">
                At Ocean Blue, we believe that our people are our greatest asset.
                We foster a culture of continuous learning, collaboration, and
                innovation where every team member can thrive and make an impact.
              </p>

              <div className="grid sm:grid-cols-2 gap-6">
                {values.map((value) => (
                  <div key={value.title} className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <value.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{value.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {value.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square bg-muted rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <Building2 className="w-24 h-24 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Team collaboration image</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="section-padding bg-muted">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-primary font-semibold mb-4">Benefits & Perks</p>
            <h2 className="heading-lg mb-6">We Take Care of Our Team</h2>
            <p className="text-body">
              We offer comprehensive benefits designed to support your health,
              wealth, and well-being so you can focus on doing your best work.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="bg-card rounded-2xl border border-border p-8 card-hover"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <benefit.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="section-padding bg-background" id="openings">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-primary font-semibold mb-4">Open Positions</p>
            <h2 className="heading-lg mb-6">Find Your Next Opportunity</h2>
            <p className="text-body">
              We&apos;re always looking for talented individuals to join our team.
              Explore our current openings and find your perfect role.
            </p>
          </div>

          <div className="space-y-4">
            {openings.map((job, index) => (
              <div
                key={index}
                className="bg-card rounded-xl border border-border p-6 card-hover flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {job.department}
                    </span>
                    {job.remote && (
                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                        Remote Eligible
                      </span>
                    )}
                    <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                      {job.level}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {job.type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Posted 2 days ago
                    </span>
                  </div>
                </div>
                <Link
                  href={`/careers/${job.title.toLowerCase().replace(/\s+/g, "-")}`}
                  className="btn-primary inline-flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  Apply Now
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Don&apos;t see a position that fits? We&apos;re always looking for talented
              individuals.
            </p>
            <Link href="/contact" className="btn-secondary inline-flex items-center gap-2">
              Send Your Resume
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Hiring Process */}
      <section className="section-padding gradient-ocean text-white">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-cyan-300 font-semibold mb-4">Hiring Process</p>
            <h2 className="heading-lg mb-6">What to Expect</h2>
            <p className="text-white/80 text-lg">
              Our hiring process is designed to be transparent, efficient, and
              respectful of your time.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Apply",
                description: "Submit your application online. We review every resume within 48 hours.",
              },
              {
                step: "02",
                title: "Screen",
                description: "Initial phone screen with our recruiting team to discuss your background.",
              },
              {
                step: "03",
                title: "Interview",
                description: "Technical and behavioral interviews with the hiring team.",
              },
              {
                step: "04",
                title: "Offer",
                description: "Receive a competitive offer and join the Ocean Blue family.",
              },
            ].map((phase) => (
              <div key={phase.step} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6 text-white text-xl font-bold">
                  {phase.step}
                </div>
                <h3 className="text-xl font-semibold mb-3">{phase.title}</h3>
                <p className="text-white/70">{phase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-muted">
        <div className="container-custom">
          <div className="bg-card rounded-3xl border border-border p-8 md:p-16 text-center">
            <h2 className="heading-lg mb-4">Ready to Make an Impact?</h2>
            <p className="text-body max-w-2xl mx-auto mb-8">
              Join us in transforming how enterprises leverage technology. Your
              next career adventure starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#openings"
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                Browse All Positions
                <ArrowRight className="w-5 h-5" />
              </a>
              <Link href="/about" className="btn-secondary inline-flex items-center justify-center">
                Learn About Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
