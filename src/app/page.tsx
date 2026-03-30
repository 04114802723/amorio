import { Navbar, Footer } from "@/components/shared";
import {
  HeroSection,
  FeaturesSection,
  HowItWorksSection,
  TestimonialsSection,
  CTASection,
} from "@/components/landing";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-dark-950">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  );
}
