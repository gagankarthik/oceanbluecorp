import VideoBackdrop from "@/components/landing/VideoBackdrop";

/* Home hero ground: a looping film of a team at work under a navy tint.
   VideoBackdrop defers the film until after load and shows its poster until
   frames arrive (the headline stays the LCP element); reduced motion gets the
   poster only. Source: Pexels 3251737 (fauxels), 960x540, 2.3MB. */

export function HeroBackdrop() {
  return (
    <>
      <VideoBackdrop src="/videos/hero-team.mp4" poster="/videos/hero-team-poster.webp" className="-z-20" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(70%_60%_at_50%_0%,rgb(29_78_216/0.35),transparent_70%),linear-gradient(to_bottom,rgb(11_26_51/0.8),rgb(14_33_89/0.86))]"
      />
    </>
  );
}
