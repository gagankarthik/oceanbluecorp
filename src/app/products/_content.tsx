"use client";

import Image from "next/image";
import { ArrowUpRight, ArrowRight, Cpu, ShieldCheck, LifeBuoy, type LucideIcon } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/landing/motion/Primitives";
import { Eyebrow, Cta } from "@/components/landing/ui";
import Photo from "@/components/landing/Photo";
import { IMG } from "@/components/landing/media";

/* Real Ocean Blue products. Refine `category` / `desc` with final copy. */
type Product = { id: string; name: string; category: string; desc: string; logo: string; remote?: boolean; link: string };

const products: Product[] = [
  {
    id: "blue-iq",
    name: "Blue-IQ",
    category: "AI & Intelligence",
    desc: "Our AI platform for turning enterprise data into faster, clearer decisions — built and operated in-house.",
    logo: "/logos/products/Blue-iq.png",
    link: "http://blue-iq.ai/",
  },
  {
    id: "inytes",
    name: "Inytes",
    category: "Digital Platform",
    desc: "A consumer platform from the Ocean Blue portfolio — designed, shipped, and supported by our own teams.",
    logo: "https://cdn.inytes.com/images/brand/inytes-logo.png",
    remote: true,
    link: "https://www.inytes.com/",
  },
];

const principles: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Cpu, title: "Engineered in-house", desc: "Built by the same teams that deliver for our enterprise clients." },
  { icon: ShieldCheck, title: "Production-grade", desc: "Shipped to real users, secured, monitored, and improved continuously." },
  { icon: LifeBuoy, title: "Backed long-term", desc: "We operate and support everything we build — not just launch it." },
];

export default function ProductsPage() {
  return (
    <div className="horizon w-full bg-[var(--hz-canvas)]">
      {/* Hero */}
      <section className="relative isolate flex min-h-[60vh] w-full items-center overflow-hidden" style={{ background: "#07142b" }}>
        <Photo src={IMG.productsHero} className="z-0" fallback="linear-gradient(135deg, #0e2147 0%, #07142b 100%)" />
        <div aria-hidden className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(100deg, rgba(5,12,28,0.95) 0%, rgba(7,20,43,0.86) 40%, rgba(7,20,43,0.5) 74%, rgba(7,20,43,0.3) 100%)" }} />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-32 pb-20 sm:px-8">
          <Reveal>
            <Eyebrow tone="dark">Our products</Eyebrow>
            <h1 className="hz-display mt-7 max-w-[16ch] text-[2.5rem] text-white sm:text-[3.25rem] lg:text-[4rem]">
              Products we build, ship, and stand behind.
            </h1>
            <p className="mt-7 max-w-xl text-[16px] leading-relaxed text-white/75 sm:text-[18px]">
              Beyond client delivery, we invest in our own platforms — the same
              engineering rigor, applied to products we own end to end.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Principles */}
      <section className="relative w-full py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <Reveal className="max-w-2xl">
            <Eyebrow>How we build</Eyebrow>
            <h2 className="hz-display mt-6 text-[2.25rem] text-[var(--hz-text)] sm:text-[3rem]">Owned end to end.</h2>
          </Reveal>
          <Stagger className="mt-14 grid gap-6 md:grid-cols-3" gap={0.1}>
            {principles.map((p) => {
              const Icon = p.icon;
              return (
                <StaggerItem key={p.title} className="h-full">
                  <div className="hz-card h-full p-8">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]">
                      <Icon className="h-6 w-6" strokeWidth={1.5} />
                    </div>
                    <h3 className="hz-display mt-6 text-[1.25rem] text-[var(--hz-text)]">{p.title}</h3>
                    <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--hz-text-mute)]">{p.desc}</p>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* Products */}
      <section className="relative w-full bg-[var(--hz-surface-2)] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <Reveal className="max-w-2xl">
            <Eyebrow>The portfolio</Eyebrow>
            <h2 className="hz-display mt-6 text-[2.25rem] text-[var(--hz-text)] sm:text-[3rem]">Platforms in production.</h2>
          </Reveal>
          <Stagger className="mt-14 grid gap-6 md:grid-cols-2" gap={0.1}>
            {products.map((product) => (
              <StaggerItem key={product.id} className="h-full">
                <a href={product.link} target="_blank" rel="noopener noreferrer" className="hz-card group flex h-full flex-col p-8 sm:p-10">
                  <div className="flex items-start justify-between">
                    <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-3.5">
                      {product.remote ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.logo} alt={product.name} className="h-full w-full object-contain" />
                      ) : (
                        <Image src={product.logo} alt={product.name} width={120} height={120} className="h-full w-full object-contain" />
                      )}
                    </div>
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-black/[0.04] text-[var(--hz-text-subtle)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:bg-[var(--hz-cobalt)] group-hover:text-white">
                      <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
                    </span>
                  </div>
                  <span className="hz-eyebrow mt-7 text-[var(--hz-cobalt)]">{product.category}</span>
                  <h3 className="hz-display mt-2 text-[1.6rem] text-[var(--hz-text)]">{product.name}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-[var(--hz-text-mute)]">{product.desc}</p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-8 text-[14px] font-semibold text-[var(--hz-cobalt)]">
                    Visit site
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.75} />
                  </span>
                </a>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* CTA */}
      <section className="relative isolate w-full overflow-hidden" style={{ background: "#07142b" }}>
        <Photo src={IMG.cta} className="z-0" fallback="linear-gradient(135deg, #0e2147 0%, #07142b 100%)" />
        <div aria-hidden className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(180deg, rgba(5,12,28,0.9) 0%, rgba(7,20,43,0.84) 100%), radial-gradient(60% 80% at 50% 0%, rgba(29,78,216,0.4), transparent 60%)" }} />
        <div className="relative z-10 mx-auto max-w-3xl px-6 py-24 text-center sm:px-8 sm:py-32">
          <Reveal className="flex flex-col items-center">
            <Eyebrow tone="dark">Build with us</Eyebrow>
            <h2 className="hz-display mt-7 max-w-[18ch] text-[2.25rem] text-white sm:text-[3rem]">Have a product to build or scale?</h2>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-white/70 sm:text-[17px]">
              We bring the team that designs, ships, and runs software in production.
            </p>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
              <Cta href="/contact" variant="primary" icon={ArrowRight}>Start a conversation</Cta>
              <Cta href="/services" variant="ghostDark">Explore services</Cta>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
