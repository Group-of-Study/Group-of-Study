import PublicNavbar from "@/frontend/components/layout/PublicNavbar";
import Hero from "@/frontend/components/sections/hero";
import HowItWorks from "@/frontend/components/sections/how-it-works";
import Features from "@/frontend/components/sections/features";
import Philosophy from "@/frontend/components/sections/philosophy";
import Values from "@/frontend/components/sections/values";
import CTA from "@/frontend/components/sections/cta";
import Footer from "@/frontend/components/sections/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 overflow-x-hidden">
      <PublicNavbar />
      
      <main className="w-full">
        {/* Secções com margem padrão em container */}
        <div className="mx-auto max-w-7xl px-5 pt-4 pb-12 sm:px-6 md:px-12 sm:pt-6 lg:pt-8">
          <Hero />
          <HowItWorks />
          <Features />
        </div>

  
        <Philosophy />

        <div className="mx-auto max-w-7xl px-5 pb-12 sm:px-6 md:px-12">
          <Values />
          <CTA />
        </div>
      </main>

      <Footer />
    </div>
  );
}