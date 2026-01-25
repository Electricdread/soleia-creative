import { useState, useEffect } from 'react';
import { ArrowRight, Target, Grid3X3, Search, MapPin, Layers, FileText, Download, Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import soleiaLogo from '@/assets/soleia-logo-new.png';

interface LandingHeroProps {
  onEnterGallery: () => void;
}

const LandingHero = ({ onEnterGallery }: LandingHeroProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    { icon: Grid3X3, title: 'Category-Based Gallery', description: 'Motion backgrounds organized by category with lazy-loaded video previews and native fullscreen playback' },
    { icon: Search, title: 'Real-Time Filtering', description: 'Client-side search with debounced input across titles and categories' },
    { icon: MapPin, title: 'SVG Venue Diagram', description: 'Interactive click-to-select venue zones rendered as SVG paths with visual state feedback' },
    { icon: Layers, title: 'Multi-Zone Assignment', description: 'Single clip can be assigned to multiple venue placements in one selection' },
    { icon: FileText, title: 'Metadata Fields', description: 'Event name, date, and per-clip notes stored with each selection' },
    { icon: Download, title: 'PDF Generation', description: 'Client-side A4 PDF export using jsPDF with embedded thumbnails and structured layout' },
    { icon: CheckCircle, title: 'Direct Download', description: 'PDF saved to device without server roundtrip' },
    { icon: Mail, title: 'Email Delivery', description: 'Supabase Edge Function with Resend API for PDF attachment delivery' },
  ];

  const highlights = [
    { title: 'Consistent Theming', description: 'CSS variables and Tailwind tokens for colors, spacing, and typography' },
    { title: 'Zero Configuration', description: 'No login required for clients to browse, select, and export' },
    { title: 'Structured Output', description: 'PDF includes thumbnails, venue placements, notes, and event details in formatted layout' },
    { title: 'Cloud Infrastructure', description: 'Edge functions handle email delivery with proper CORS and error handling' },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background rays */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-0 w-full h-32 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-ray-slow" />
        <div className="absolute top-1/2 left-0 w-full h-24 bg-gradient-to-r from-transparent via-accent/5 to-transparent animate-ray-medium" />
        <div className="absolute top-3/4 left-0 w-full h-20 bg-gradient-to-r from-transparent via-primary/3 to-transparent animate-ray-fast" />
        
        {/* Radial glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl animate-glow-pulse-slow" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 lg:py-16">
        {/* Hero Header */}
        <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-glow-pulse-slow" />
              <img 
                src={soleiaLogo} 
                alt="Soleia" 
                className="h-20 md:h-28 lg:h-36 w-auto relative z-10 drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-light tracking-[0.2em] uppercase mb-3 text-gradient-gold">
            Looks Collection
          </h1>
          <p className="text-base md:text-lg text-muted-foreground tracking-widest uppercase mb-6">
            Sales Pitch
          </p>

          {/* CTA Button */}
          <Button 
            onClick={onEnterGallery}
            size="lg"
            className="group px-8 py-6 text-lg font-medium bg-primary hover:bg-primary/90 text-primary-foreground glow-gold pulse-gold transition-all duration-300"
          >
            Enter Gallery
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Main Description */}
        <div className={`max-w-4xl mx-auto text-center mb-12 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-xl md:text-2xl font-light text-foreground mb-4">Motion Graphics Curation Tool</h2>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            A web application for venues to browse, select, and export motion background choices. Clients select clips, assign venue placements via an interactive diagram, add metadata, and generate branded PDFs for download or email delivery.
          </p>
        </div>

        {/* Features Section */}
        <div className={`max-w-6xl mx-auto mb-16 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="flex items-center justify-center gap-2 mb-8">
            <Target className="h-6 w-6 text-primary" />
            <h3 className="text-xl md:text-2xl font-light text-foreground tracking-wide">Intuitive Features</h3>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="glass rounded-xl p-5 hover-lift border border-border/30 group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <feature.icon className="h-4 w-4" />
                  </div>
                  <h4 className="font-medium text-foreground text-sm">{feature.title}</h4>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Highlights Section */}
        <div className={`max-w-4xl mx-auto transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="flex items-center justify-center gap-2 mb-8">
            <Layers className="h-6 w-6 text-primary" />
            <h3 className="text-xl md:text-2xl font-light text-foreground tracking-wide">Technical Highlights</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {highlights.map((highlight, index) => (
              <div 
                key={index}
                className="glass-strong rounded-xl p-6 border border-primary/20 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground mb-1">{highlight.title}</h4>
                    <p className="text-muted-foreground text-sm">{highlight.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Quote */}
        <div className={`text-center mt-16 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <p className="text-lg md:text-xl italic text-muted-foreground">
            "From browse to boardroom-ready in under a minute."
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingHero;
