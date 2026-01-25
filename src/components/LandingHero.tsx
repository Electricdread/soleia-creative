import { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Target, Trophy, Grid3X3, Search, MapPin, Layers, FileText, Download, Mail, CheckCircle } from 'lucide-react';
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
    { icon: Grid3X3, title: 'Visual Gallery', description: 'Browse curated motion backgrounds organized by categories with silky-smooth animations and fullscreen previews' },
    { icon: Search, title: 'Smart Search', description: 'Instantly filter clips with real-time search functionality' },
    { icon: MapPin, title: 'Interactive Venue Mapping', description: 'Click-to-select SVG venue diagram lets clients visually choose placement zones (Main Wall, Sky Blades, Beach Club, etc.)' },
    { icon: Layers, title: 'Multi-Placement Selection', description: 'Assign a single clip to multiple venue locations simultaneously' },
    { icon: FileText, title: 'Custom Notes & Event Details', description: 'Add event name, date, and personalized notes per clip' },
    { icon: Download, title: 'Branded PDF Export', description: 'Generate elegant A4 documents featuring the Soleia logo, gold accents, thumbnails, and full selection details' },
    { icon: CheckCircle, title: 'One-Click Download', description: 'Save PDFs directly to device—no email required' },
    { icon: Mail, title: 'Backend Email Delivery', description: 'Seamlessly send branded PDF selections to clients via secure cloud infrastructure' },
  ];

  const highlights = [
    { title: 'Luxury Aesthetic', description: 'Gold gradients, glassmorphism, and sun goddess branding create a premium feel' },
    { title: 'No Technical Friction', description: 'Clients click, select, and receive—zero learning curve' },
    { title: 'Professional Output', description: 'PDFs look like they came from a design agency, not a web app' },
    { title: 'Reliable Backend', description: 'Cloud-powered email ensures deliverability with Resend integration' },
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

        {/* Main Tagline */}
        <div className={`max-w-4xl mx-auto text-center mb-12 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-primary" />
            <h2 className="text-xl md:text-2xl font-light text-foreground">The Ultimate Motion Graphics Curation Platform</h2>
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            <span className="text-foreground font-medium">Soleia Looks Collection</span> is a luxury, white-glove digital experience designed for high-end venues to curate and communicate their visual atmosphere selections with elegance and precision.
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

        {/* Why It Stands Out Section */}
        <div className={`max-w-4xl mx-auto transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="flex items-center justify-center gap-2 mb-8">
            <Trophy className="h-6 w-6 text-primary" />
            <h3 className="text-xl md:text-2xl font-light text-foreground tracking-wide">Why It Stands Out</h3>
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
