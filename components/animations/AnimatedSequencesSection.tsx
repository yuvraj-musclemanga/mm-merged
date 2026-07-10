/**
 * AnimatedSequencesSection
 *
 * Three full-screen sections, each with a static image from /public/pictures/
 * and the exact same overlay UI that was previously animated by OverlayText:
 *  - Widescreen (≥ 4:3): Heading + "VIEW PRODUCT" on the left, 3 glassmorphism
 *    feature cards stacked on the right.
 *  - Portrait / mobile (< 4:3): Heading + "VIEW PRODUCT" centred at the top,
 *    3 feature cards in a horizontal row at the bottom.
 *
 * Animations removed — all overlay content is always visible (opacity:1).
 * The canvas image-sequence, framer-motion, and device-detection hooks are
 * gone; this is now a plain server component.
 */

import Image from "next/image";
import Link from "next/link";

const SEQUENCES = [
  {
    image: "/pictures/tatakae.jpg",
    alt: "Humanity's Strongest — Tatakae Tee",
    topHeading1: "HUMANITY'S",
    topHeading2: "STRONGEST",
    leftCard: "240 GSM FRENCH TERRY COTTON FABRIC",
    rightCard: "SUPERIOR PRINT QUALITY",
    bottomCard: "LUXURY IN EVERY FIBER",
    productId: "49121966-277f-4a9f-9570-917aaed467e3"
  },
  {
    image: "/pictures/goku.jpg",
    alt: "The Spirit of Goku — Goku Edition Tee",
    topHeading1: "SPIRIT OF",
    topHeading2: "GOKU",
    leftCard: "PREMIUM EMBROIDERY WORK",
    rightCard: "SKIN FRIENDLY SOFT TOUCH FABRIC",
    bottomCard: "ELEVATED COMFORT",
    productId: "d2459881-2351-4820-9ff2-e8d79078c620"
  },
  {
    image: "/pictures/zenitsu.jpg",
    alt: "Thunder Breathing — Zenitsu Edition Tee",
    topHeading1: "THUNDER",
    topHeading2: "BREATHING",
    leftCard: "ORIGINAL EXCLUSIVE DESIGNS",
    rightCard: "LIMITED DROPS ONLY",
    bottomCard: "LIMITLESS POSSIBILITIES",
    productId: "ec9daecd-9cc5-4ac5-b40b-8c89b32e4d2f"
  },
  {
    image: "/pictures/skinny_bitch1.jpg",
    alt: "Don't be a Skinny B*tch",
    topHeading1: "SKINNY",
    topHeading2: "B*TCH",
    leftCard: "PREMIUM PUFF PRINT",
    rightCard: "BOXY FIT OVERSIZED",
    bottomCard: "BOLD DEMEANOUR",
    productId: "63815de1-dbfa-472f-9101-1cd3469538c0"
  },
] as const;

export default function AnimatedSequencesSection() {
  return (
    <div className="relative bg-background-dark">
      {SEQUENCES.map((seq, i) => (
        <div
          key={i}
          className="relative w-full snap-start snap-always overflow-hidden uppercase"
          style={{ height: "100svh" }}
        >
          {/* ── Static background image (replaces canvas sequence) ──────── */}
          <Image
            src={seq.image}
            alt={seq.alt}
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority={i === 0}
          />

          {/* Top + bottom gradient blends — matches original OverlayText */}
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-background-dark to-transparent z-10 pointer-events-none" />
          <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-background-dark to-transparent z-10 pointer-events-none" />

          {/* ═══════════════════════════════════════════════════════════════
              WIDESCREEN LAYOUT (≥ 4:3 aspect ratio) — left heading + right cards
              ═══════════════════════════════════════════════════════════════ */}
          <div className="hidden [@media(min-aspect-ratio:4/3)]:block">
            {/* LEFT — Heading & Button */}
            <div className="absolute inset-y-0 left-0 p-8 md:pl-16 lg:pl-24 flex flex-col items-start justify-center w-full md:w-5/12 z-20">
              <h2
                className="text-4xl lg:text-6xl text-white tracking-wide text-left drop-shadow-2xl font-bold leading-tight mb-4"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {seq.topHeading1}
                <br />
                {seq.topHeading2}
              </h2>
              <p className="text-white/60 tracking-widest text-sm md:text-base font-medium mb-8">
                UNISEX OVERSIZED TEE
              </p>
              <Link
                href={`/product/${seq.productId}`}
                className="px-8 py-3.5 bg-white/5 hover:bg-white text-white hover:text-black border border-white/20 hover:border-white transition-all duration-300 rounded-full tracking-widest text-xs lg:text-sm font-semibold backdrop-blur-md shadow-lg hover:shadow-white/20 cursor-pointer pointer-events-auto text-center"
              >
                VIEW PRODUCT
              </Link>
            </div>

            {/* RIGHT — Feature Cards */}
            <div className="absolute inset-y-0 right-0 p-8 md:pr-16 lg:pr-24 flex flex-col items-end justify-center gap-5 w-full md:w-1/3 z-20">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl w-full max-w-[280px]">
                <p className="text-sm lg:text-base text-white tracking-wider font-light leading-snug text-center">
                  {seq.leftCard}
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl w-full max-w-[280px]">
                <p className="text-sm lg:text-base text-white tracking-wider font-light leading-snug text-center">
                  {seq.rightCard}
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl w-full max-w-[280px]">
                <p className="text-sm lg:text-base text-white tracking-wider font-light leading-snug text-center">
                  {seq.bottomCard}
                </p>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              PORTRAIT / SQUARE LAYOUT (< 4:3) — top heading + bottom cards
              ═══════════════════════════════════════════════════════════════ */}
          <div className="block [@media(min-aspect-ratio:4/3)]:hidden">
            {/* TOP — Heading & Button */}
            <div className="absolute top-8 md:top-12 inset-x-0 p-4 flex flex-col items-center justify-start w-full z-20">
              <h2
                className="text-3xl md:text-5xl text-white tracking-wide text-center drop-shadow-2xl font-bold leading-tight mb-4"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {seq.topHeading1}
                <br />
                {seq.topHeading2}
              </h2>
              <Link
                href={`/product/${seq.productId}`}
                className="px-6 py-2.5 bg-white/5 hover:bg-white text-white hover:text-black border border-white/20 hover:border-white transition-all duration-300 rounded-full tracking-widest text-[10px] md:text-xs font-semibold backdrop-blur-md shadow-lg hover:shadow-white/20 cursor-pointer pointer-events-auto text-center"
              >
                VIEW PRODUCT
              </Link>
            </div>

            {/* BOTTOM — Horizontal Feature Cards */}
            <div className="absolute bottom-8 md:bottom-12 inset-x-0 p-4 flex flex-row items-stretch justify-center gap-2 md:gap-4 w-full z-20">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-xl flex-1 max-w-[140px] flex items-center justify-center">
                <p className="text-[9px] md:text-xs text-white tracking-wider font-light leading-snug text-center break-words">
                  {seq.leftCard}
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-xl flex-1 max-w-[140px] flex items-center justify-center">
                <p className="text-[9px] md:text-xs text-white tracking-wider font-light leading-snug text-center break-words">
                  {seq.rightCard}
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-xl flex-1 max-w-[140px] flex items-center justify-center">
                <p className="text-[9px] md:text-xs text-white tracking-wider font-light leading-snug text-center break-words">
                  {seq.bottomCard}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* ─── Our Story section ─────────────────────────────────────────────── */}
      <div id="our-story" className="relative z-40 w-full bg-background-dark">
        <section className="max-w-[1600px] mx-auto py-32 px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <p className="mb-6 block text-xs font-black uppercase tracking-[0.3em] text-white/50">
              Our Story
            </p>
            <h2
              className="text-4xl md:text-6xl mb-8 leading-tight font-bold text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Born in the dark, forged in iron.
            </h2>
            <p className="text-lg text-white/60 leading-relaxed mb-10 max-w-xl">
              Musclemanga isn&apos;t just about t-shirts. It&apos;s about the
              intersection of aesthetics and discipline. Every piece in our
              &apos;Drop-01&apos; is crafted with heavyweight fabrics and
              high-contrast designs that reflect the grit of the street and the
              focus of the gym.
            </p>
          </div>
          <div className="relative">
            <div className="aspect-square border border-white/10 bg-card-dark overflow-hidden p-8">
              <div
                className="w-full h-full bg-cover bg-center"
                style={{
                  backgroundImage:
                    'url("https://bbglnzpzdihtdcuxfoma.supabase.co/storage/v1/object/public/products/assets/studio-setup-t-shirt-mockup-female-model-standing-with-backdrop-frame-clean-lighting-03932.jpg")',
                }}
              />
            </div>
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white text-black p-8 hidden md:flex items-center justify-center text-center">
              <p className="text-[10px] font-black uppercase leading-tight tracking-widest">
                Ethically Crafted in India
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
