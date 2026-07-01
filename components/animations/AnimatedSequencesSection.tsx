"use client";

/**
 * AnimatedSequencesSection
 *
 * Client-side wrapper that brings the three cinematic HeroScroll sequences
 * from mm-v2 into mm-merged's Home page.
 *
 * WHY A SEPARATE CLIENT COMPONENT?
 * - mm-merged's app/page.tsx is an async server component (it fetches from
 *   Supabase at build/request time).
 * - HeroScroll is "use client" and uses browser-only APIs (canvas, scroll
 *   events, window.devicePixelRatio).
 * - Next.js requires that client components be imported from within another
 *   client component (or via dynamic import with ssr:false). Wrapping them
 *   here lets the server page import this single boundary component cleanly.
 *
 * STICKY-STACK / OVERLAP SCROLL EFFECT
 * - Each HeroScroll occupies 400vh of scroll space internally (sticky top-0
 *   h-screen inner div).
 * - The `marginBottom: "-100vh"` on each wrapper div pulls the next section
 *   up by one viewport height, creating the "stacks over previous" overlap
 *   effect as the user scrolls into it.
 * - z-index increments (z-10 → z-20 → z-30) so each section correctly
 *   renders on top of the previous one during the overlap phase.
 * - A final transparent spacer (100vh) re-establishes normal document flow
 *   so the subsequent mm sections (Collection, Marquee, Story) appear below
 *   without being consumed by the negative-margin trick.
 */

import HeroScroll from "@/components/animations/HeroScroll";
import { H1, H2, Label } from '@/components/ui/Typography';

export default function AnimatedSequencesSection() {
  return (
    <div className="relative bg-background-dark">
      {/* SEQUENCE 1 — The Essential Tee (tatakae / Humanity's Strongest) */}
      <div className="relative z-10 w-full" style={{ marginBottom: "calc(-1 * var(--scroll-content-height, 100vh))" }}>
        <HeroScroll
          totalFrames={108}
          folderPath="/sequence"
          framePrefix="tatakae_"
          frameStep={1}
          padNumber={3}
          frameExtension=".jpg"
          objectFit="cover"
          topHeading="HUMANITY'S STRONGEST"
          leftHeading={<>240 GSM FRENCH TERRY COTTON FABRIC</>}
          rightHeading={<>SUPERIOR PRINT QUALITY</>}
          bottomHeading="LUXURY IN EVERY FIBER"
        />
      </div>

      {/* SEQUENCE 2 — The Goku Edition */}
      <div className="relative z-20 w-full" style={{ marginBottom: "calc(-1 * var(--scroll-content-height, 100vh))" }}>
        <HeroScroll
          totalFrames={97}
          folderPath="/sequence2"
          framePrefix="goku_"
          frameStep={1}
          padNumber={3}
          frameExtension=".jpg"
          objectFit="cover"
          topHeading="THE SPIRIT OF GOKU"
          leftHeading={<>PREMIUM EMBROIDERY WORK</>}
          rightHeading={<>SKIN FRIENDLY SOFT TOUCH FABRIC</>}
          bottomHeading="ELEVATED COMFORT"
        />
      </div>

      {/* SEQUENCE 3 — The Zenitsu Edition (Thunder Breathing) */}
      {/* <div className="relative z-30 w-full" style={{ marginBottom: "calc(-1 * var(--scroll-content-height, 100vh))" }}>
        <HeroScroll
          totalFrames={83}
          folderPath="/sequence3"
          framePrefix="zenitsu_"
          frameStep={1}
          padNumber={3}
          frameExtension=".jpg"
          reverse={false}
          objectFit="cover"
          topHeading="THUNDER BREATHING"
          leftHeading={<>ORIGINAL EXCLUSIVE DESIGNS</>}
          rightHeading={<>LIMITED DROPS ONLY</>}
          bottomHeading="LIMITLESS POSSIBILITIES"
        />
      </div> */}

      {/* Flow-restoration spacer:
          The three sections above have a combined negative margin.
          This spacer adds back enough space so the document flow
          beneath this component starts at the correct scroll position
          (after all three stacks have fully played). */}
      <div className="relative z-40 w-full bg-background-dark" style={{ minHeight: "var(--scroll-content-height, 100vh)" }}>
        <section className="max-w-[1600px] mx-auto py-32 px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center z-40">
          <div>
            <Label className="mb-6 block">Our Story</Label>
            <H2 className="text-4xl md:text-6xl mb-8 leading-tight">Born in the dark, forged in iron.</H2>
            <p className="text-lg text-white/60 leading-relaxed mb-10 max-w-xl">
              Musclemanga isn&apos;t just about t-shirts. It&apos;s about the intersection of aesthetics and discipline. Every piece in our &apos;Drop-01&apos; is crafted with heavyweight fabrics and high-contrast designs that reflect the grit of the street and the focus of the gym.
            </p>
          </div>
          <div className="relative">
            <div className="aspect-square border border-white/10 bg-card-dark overflow-hidden p-8">
              <div className="w-full h-full bg-cover bg-center grayscale contrast-150" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAdDZVsqBCGQ426VBQD0o9tc9zY9BEEpy7Eu_j3vw7SYd_ilm-e_p8DzXWx17mFu7K4BgRDjXTWs62lEO0Q4P_mYLd7GrViUZkDbbAa5hq-XLVl_Pl09K5CmXztXHeYv5aK_IIQdKYsEdVERWKqj5zsIZTPgLlMISHENl_OstAHdEmrgMtUkj4fPpQqJA4ubtvhiXiGM4qEReKSqrIE4MjlyFgeP1BqXytDvdfQzQzRi8DfvOirPFtGXMV0B748k3f4mLIymE2cZ4DP")' }}></div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white text-black p-8 hidden md:flex items-center justify-center text-center">
              <p className="text-[10px] font-black uppercase leading-tight tracking-widest">Ethically Crafted in India</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
