import {
  Navigation,
  Hero,
  Features,
  UseCases,
  FeatureHighlights,
  Testimonials,
  Comparison,
  Privacy,
  MobilePreview,
  FAQ,
  Footer,
} from "@/components";

export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <Features />
        <UseCases />
        <FeatureHighlights />
        <Testimonials />
        <Comparison />
        <Privacy />
        <MobilePreview />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
