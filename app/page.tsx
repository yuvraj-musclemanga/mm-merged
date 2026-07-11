import { Button } from '@/components/ui/Button';
import { H1, Label } from '@/components/ui/Typography';
import AnimatedSequencesSection from '@/components/animations/AnimatedSequencesSection';
import { Marquee } from '@/components/ui/Marquee';

export default async function Home() {
  return (
    <main>
      {/* ... (Notice Banners) */}
      <Marquee className="bg-white text-black py-2">
        <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mx-12">✨Style is influence • Join our influence programme✨</p>
        <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mx-12">💸 10% off your first purchase with &apos;MM10&apos;</p>
        <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mx-12">🚚 Free shipping on every order</p>
      </Marquee>

      {/* ... (Hero Section) */}
      <section className="relative w-full min-h-[80vh] flex items-center px-6 lg:px-12 py-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-linear-to-r from-black via-black/80 to-transparent z-10"></div>
          <div className="w-full h-full bg-cover bg-center grayscale contrast-125 brightness-75 scale-105" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAJEUzCGNYJSdcXzegNZkckF_EsNGGohap_3uXK9ST-oyN1hu_gDvmdpwXCGXUqLIzyiedDqmidxS2kwIecWSYnju5qz7JXJKFp71OxYmDeZzSplihN0l4xCt3y96bRC-gnFDKayp9cI3MzSeLUdtRqSWZRPBE7JIp1eQw7pNJixsTaONksEXFZKpHqOVjpW6e03_dWpK2rZ5xNNUnR0nv1xzkY_mdpFxS3xv84Xjd9tIkaYEf8UUX8_La1XxqeDg4cb2syDiyRTy6r")' }}></div>
        </div>
        <div className="max-w-[1600px] mx-auto w-full relative z-30">
          <div>
            <div className="inline-flex items-center gap-3 mb-8">
              <span className="h-px w-12 bg-white"></span>
              <Label className="text-xs">Drop-01</Label>
            </div>
            <H1 className="text-5xl xxs:text-6xl md:text-8xl lg:text-[10rem] mb-10 w-full">
              Be<br />
              <span className="text-red-500">UNBREAKABLE</span>
              {/* <ConditionalMarquee className="text-outline">Unbreakable</ConditionalMarquee> */}
            </H1>
            <div className="flex flex-col sm:flex-row gap-6 mt-12">
              <Button href="/explore" variant="primary">Shop The Drop</Button>
              <Button href="#our-story" variant="secondary">Our Philosophy</Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Cinematic Scroll Animation Sequences (from mm-v2) ───────────────
          Three HeroScroll sections with the "sticky-stack / overlap scroll"
          effect, each featuring a canvas image sequence of a product tee
          with glassmorphism overlay text. Placed immediately after the Hero,
          before the product Collection section below.
          ──────────────────────────────────────────────────────────────────── */}
      <AnimatedSequencesSection />

      {/* Collection Section */}
      {/* <section className="max-w-[1600px] mx-auto py-32 px-6 lg:px-12" id="collection">
        <div className="flex flex-col mb-20">
          <H2 className="text-4xl md:text-6xl mb-4">Core Pieces</H2>
          <div className="h-1 w-24 bg-white"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-8">
          {displayProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              {...product}
              fullWidth={index === 1 || index === 4} // Apply margin to 2nd and 5th items as per original design staggered grid
            />
          ))} */}

      {/* Explore All Card */}
      {/* <Link href="/explore" className="flex items-center justify-center aspect-3/4 border border-dashed border-white/20 hover:border-white transition-colors cursor-pointer group">
            <div className="text-center">
              <span className="material-symbols-outlined text-4xl mb-4 group-hover:scale-125 transition-transform">add_circle</span>
              <p className="font-black uppercase tracking-[0.3em] text-xs">Explore All</p>
            </div>
          </Link>
        </div>
      </section> */}

      {/* Marquee */}
      <Marquee className="bg-white text-black py-4 z-40">
        <p className="text-2xl font-display font-bold uppercase tracking-tighter mx-4">Musclemanga // Drop-01 // Pure Strength // Limited Runs //</p>
      </Marquee>

      {/* Story Section */}
      {/* <section className="max-w-[1600px] mx-auto py-32 px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center z-40">
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
      </section> */}
    </main>
  );
}
