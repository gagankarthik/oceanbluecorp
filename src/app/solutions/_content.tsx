import Link from "next/link";
import PageHero from "@/components/landing/PageHero";
import Photo from "@/components/landing/Photo";
import { IMG } from "@/components/landing/media";
import { LinkButton } from "@/components/site/button";
import { Section, ClosingCta } from "@/components/site/sections";
import { IconArrowRight } from "@/components/site/icons";

/* An INDEX, not an essay. Someone here is looking for the practice that
   matches their problem, so the page is a directory: five practices, each
   with every sub-service on the surface as a link, then the method. */

const SERVICE_TITLES: Record<string, string> = {
  staffing: "IT Staffing & Talent",
  cloud: "Cloud Engineering",
  cybersecurity: "Cybersecurity",
  erp: "ERP Solutions",
  salesforce: "Salesforce Services",
  ai: "AI & Data Intelligence",
  managed: "Managed Services",
  transformation: "Digital Transformation",
  training: "Training & Upskilling",
};

type Practice = {
  no: string;
  name: string;
  desc: string;
  image: string;
  services: { title: string; href: string }[];
};

const link = (s: string) => ({ title: SERVICE_TITLES[s], href: `/solutions/${s}` });

const practices: Practice[] = [
  {
    no: "01",
    name: "Talent",
    desc: "The specialists who join your team and own the work, on flexible or permanent terms, or as a fully managed team.",
    image: IMG.serviceTalent,
    services: [link("staffing")],
  },
  {
    no: "02",
    name: "Engineering",
    desc: "Mechanical, electrical, structural, aerospace, controls and manufacturing engineers for the industries that build things.",
    image: IMG.serviceEngineering,
    services: [{ title: "Engineering Talent & Services", href: "/solutions/engineering" }],
  },
  {
    no: "03",
    name: "Solutions",
    desc: "Platform and product work, delivered securely and without stopping the business.",
    image: IMG.serviceSolutions,
    services: ["cloud", "cybersecurity", "erp", "salesforce", "ai", "transformation"].map(link),
  },
  {
    no: "04",
    name: "Managed",
    desc: "We operate and improve your systems around the clock, on one accountable SLA.",
    image: IMG.serviceManaged,
    services: [link("managed")],
  },
  {
    no: "05",
    name: "Training",
    desc: "Instructor-led training on the platforms your teams run, taught by the practitioners who deliver them.",
    image: IMG.serviceTraining,
    services: [link("training")],
  },
];

const steps = [
  { no: "01", title: "Discovery", desc: "We learn the business, the constraints, and the outcome that matters, before proposing anything." },
  { no: "02", title: "Strategy", desc: "We design the solution and the roadmap together, with success metrics agreed up front." },
  { no: "03", title: "Implementation", desc: "We execute in agile increments, shipping working software and integrated talent." },
  { no: "04", title: "Optimization", desc: "We monitor, review, and improve continuously against the SLA, in quarterly reviews." },
];

function PracticeRow({ p, flip }: { p: Practice; flip: boolean }) {
  return (
    <li className="reveal grid overflow-hidden rounded-2xl border border-line bg-white lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
      <div className={`relative aspect-[16/10] w-full bg-paper-deep lg:aspect-auto lg:min-h-[300px] ${flip ? "lg:order-2" : ""}`}>
        <Photo src={p.image} sizes="(min-width: 1024px) 500px, 100vw" />
      </div>
      <div className="flex flex-col p-7 sm:p-10">
        <h3 className="type-headline-sm text-ink">{p.name}</h3>
        <p className="mt-3 max-w-[52ch] type-body text-ink-muted">{p.desc}</p>
        <ul className={`mt-7 border-t border-line ${p.services.length > 3 ? "grid gap-x-8 sm:grid-cols-2" : ""}`}>
          {p.services.map((s) => (
            <li key={s.href}>
              <Link href={s.href} className="group flex items-center justify-between gap-4 border-b border-line py-3.5 text-[15.5px] font-semibold text-ink transition-colors hover:text-cobalt">
                {s.title}
                <IconArrowRight size={16} className="flex-none text-ink-subtle transition-all group-hover:translate-x-1 group-hover:text-cobalt" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

export default function ServicesPage({ content = {} }: { content?: Record<string, string> }) {
  return (
    <>
      <PageHero
        eyebrow="Solutions"
        title={content.servicesTitle || "Talent, engineering, technology, managed services and training."}
        subtitle={
          content.servicesSubtitle ||
          "Five connected practices under one accountable team, serving enterprises and state government agencies across North America."
        }
        image={IMG.servicesHero}
        actions={
          <>
            <LinkButton href="/contact" variant="primary" size="lg">
              Talk to us
            </LinkButton>
            <LinkButton href="#practices" variant="outline" size="lg">
              Browse practices
            </LinkButton>
          </>
        }
      />

      <Section
        id="practices"
        tone="paper"
        title="Five practices, one team"
        sub="Pick the practice that matches the problem. Every service below has its own page with scope, approach and outcomes."
      >
        <ol className="space-y-5">
          {practices.map((p, i) => (
            <PracticeRow key={p.no} p={p} flip={i % 2 === 1} />
          ))}
        </ol>
      </Section>

      <Section tone="white" title="A method you can hold us to" sub="The same four steps on every engagement, whichever practice leads it.">
        <ol className="grid gap-[3px] bg-line sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((st) => (
            <li key={st.no} className="bg-white p-7 sm:p-8">
              <h3 className="type-title-lg text-ink">{st.title}</h3>
              <p className="mt-2 type-body-sm text-ink-muted">{st.desc}</p>
            </li>
          ))}
        </ol>
      </Section>

      <ClosingCta
        title="Tell us what you are building"
        sub="We will put the right specialists on it and stand behind the result."
        primary={{ href: "/contact", label: "Talk to us" }}
        secondary={{ href: "/about", label: "About Oceanblue" }}
      />
    </>
  );
}
