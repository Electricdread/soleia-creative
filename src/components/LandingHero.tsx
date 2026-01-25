import { useState, useEffect } from 'react';
import { Play, Download, Mail, MapPin, Grid3X3, Sparkles, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import soleiaLogo from '@/assets/soleia-logo-new.png';

interface LandingHeroProps {
  onEnterGallery: () => void;
}

const LandingHero = ({ onEnterGallery }: LandingHeroProps) => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Grid3X3,
      title: 'Visual Gallery',
      description: 'Browse curated motion backgrounds with fullscreen previews',
      demo: 'gallery',
    },
    {
      icon: MapPin,
      title: 'Venue Mapping',
      description: 'Interactive diagram to select placement locations',
      demo: 'venue',
    },
    {
      icon: Download,
      title: 'Branded PDF Export',
      description: 'Generate elegant documents with your selections',
      demo: 'pdf',
    },
    {
      icon: Mail,
      title: 'Email Delivery',
      description: 'Send curated collections directly to clients',
      demo: 'email',
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background rays */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-0 w-full h-32 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-ray-slow" />
        <div className="absolute top-1/2 left-0 w-full h-24 bg-gradient-to-r from-transparent via-accent/5 to-transparent animate-ray-medium" />
        <div className="absolute top-3/4 left-0 w-full h-20 bg-gradient-to-r from-transparent via-primary/3 to-transparent animate-ray-fast" />
        
        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl animate-glow-pulse-slow" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 lg:py-20">
        {/* Hero Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-glow-pulse-slow" />
              <img 
                src={soleiaLogo} 
                alt="Soleia" 
                className="h-24 md:h-32 lg:h-40 w-auto relative z-10 drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-light tracking-[0.3em] uppercase mb-4 text-gradient-gold">
            Looks Collection
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground tracking-widest uppercase mb-8">
            Motion Backgrounds Curation Platform
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

        {/* Feature Showcase */}
        <div className={`max-w-6xl mx-auto transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Feature Tabs */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-8">
            {features.map((feature, index) => (
              <button
                key={index}
                onClick={() => setActiveFeature(index)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 ${
                  activeFeature === index 
                    ? 'bg-primary text-primary-foreground glow-gold scale-105' 
                    : 'glass hover:bg-card/80 text-foreground'
                }`}
              >
                <feature.icon className="h-4 w-4" />
                <span className="text-sm font-medium hidden md:inline">{feature.title}</span>
              </button>
            ))}
          </div>

          {/* Demo Area */}
          <div className="glass-strong rounded-2xl p-6 md:p-8 border border-border/50 glow-warm">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Feature Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    {(() => {
                      const Icon = features[activeFeature].icon;
                      return <Icon className="h-6 w-6" />;
                    })()}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-light text-foreground">
                    {features[activeFeature].title}
                  </h3>
                </div>
                <p className="text-muted-foreground text-lg">
                  {features[activeFeature].description}
                </p>

                {/* Feature Benefits */}
                <ul className="space-y-3 pt-4">
                  {activeFeature === 0 && (
                    <>
                      <FeatureBenefit text="Organized by curated categories" />
                      <FeatureBenefit text="Fullscreen video previews" />
                      <FeatureBenefit text="Real-time search filtering" />
                    </>
                  )}
                  {activeFeature === 1 && (
                    <>
                      <FeatureBenefit text="Click-to-select venue zones" />
                      <FeatureBenefit text="Multi-placement support" />
                      <FeatureBenefit text="Visual feedback with animations" />
                    </>
                  )}
                  {activeFeature === 2 && (
                    <>
                      <FeatureBenefit text="Luxury branded design" />
                      <FeatureBenefit text="Includes thumbnails & notes" />
                      <FeatureBenefit text="One-click download" />
                    </>
                  )}
                  {activeFeature === 3 && (
                    <>
                      <FeatureBenefit text="Secure cloud delivery" />
                      <FeatureBenefit text="PDF attachment included" />
                      <FeatureBenefit text="Professional presentation" />
                    </>
                  )}
                </ul>
              </div>

              {/* Animated Demo */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-card border border-border/30">
                <FeatureDemo activeFeature={activeFeature} />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className={`max-w-4xl mx-auto mt-16 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Motion Clips" value="500+" />
            <StatCard label="Venue Zones" value="6" />
            <StatCard label="Export Formats" value="PDF" />
            <StatCard label="Delivery" value="Instant" />
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureBenefit = ({ text }: { text: string }) => (
  <li className="flex items-center gap-2 text-foreground/80">
    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
    <span>{text}</span>
  </li>
);

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="glass rounded-xl p-4 text-center hover-lift">
    <div className="text-2xl md:text-3xl font-light text-gradient-gold mb-1">{value}</div>
    <div className="text-sm text-muted-foreground">{label}</div>
  </div>
);

const FeatureDemo = ({ activeFeature }: { activeFeature: number }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {activeFeature === 0 && <GalleryDemo />}
      {activeFeature === 1 && <VenueDemo />}
      {activeFeature === 2 && <PDFDemo />}
      {activeFeature === 3 && <EmailDemo />}
    </div>
  );
};

const GalleryDemo = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  return (
    <div className="p-4 w-full h-full">
      <div className="grid grid-cols-3 gap-2 h-full">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-border/30 transition-all duration-300 flex items-center justify-center ${
              hoveredIndex === i ? 'scale-110 glow-gold z-10' : ''
            }`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <Play className={`h-4 w-4 text-primary/50 transition-all ${hoveredIndex === i ? 'text-primary scale-125' : ''}`} />
          </div>
        ))}
      </div>
      <div className="absolute bottom-2 left-2 right-2 flex gap-1">
        {['Featured', 'Nature', 'Abstract'].map((cat, i) => (
          <div key={i} className={`text-xs px-2 py-1 rounded-full ${i === 0 ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'}`}>
            {cat}
          </div>
        ))}
      </div>
    </div>
  );
};

const VenueDemo = () => {
  const [selectedZones, setSelectedZones] = useState<number[]>([0, 2]);
  
  const zones = [
    { name: 'Full Room', x: 40, y: 30 },
    { name: 'Main Wall', x: 70, y: 20 },
    { name: 'Curve Wall', x: 20, y: 50 },
    { name: 'Sky Blades', x: 50, y: 60 },
    { name: 'Beach Club', x: 80, y: 70 },
    { name: 'Arch', x: 30, y: 80 },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedZones(prev => {
        const newZone = Math.floor(Math.random() * 6);
        if (prev.includes(newZone)) {
          return prev.filter(z => z !== newZone);
        }
        return [...prev, newZone].slice(-3);
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="relative w-full h-full p-4">
      {/* Venue outline */}
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <rect x="10" y="10" width="80" height="80" rx="4" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
        <rect x="15" y="15" width="70" height="70" rx="2" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.3" opacity="0.3" />
        
        {zones.map((zone, i) => (
          <g key={i}>
            <circle 
              cx={zone.x} 
              cy={zone.y} 
              r={selectedZones.includes(i) ? 8 : 5}
              fill={selectedZones.includes(i) ? 'hsl(var(--primary))' : 'hsl(var(--muted))'}
              opacity={selectedZones.includes(i) ? 1 : 0.5}
              className="transition-all duration-300"
            />
            {selectedZones.includes(i) && (
              <circle 
                cx={zone.x} 
                cy={zone.y} 
                r={12}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="0.5"
                opacity="0.5"
                className="animate-ping"
              />
            )}
          </g>
        ))}
      </svg>
      <div className="absolute bottom-2 left-2 text-xs text-muted-foreground">
        {selectedZones.length} zones selected
      </div>
    </div>
  );
};

const PDFDemo = () => {
  const [downloading, setDownloading] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDownloading(true);
      setTimeout(() => setDownloading(false), 1000);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="relative w-full h-full flex items-center justify-center p-4">
      {/* PDF Preview */}
      <div className={`w-24 h-32 bg-card rounded-lg border border-border/50 shadow-xl transition-all duration-500 ${downloading ? 'scale-95 translate-y-2' : ''}`}>
        {/* Header */}
        <div className="h-6 bg-primary rounded-t-lg flex items-center px-2">
          <div className="w-8 h-3 bg-primary-foreground/30 rounded" />
        </div>
        {/* Content lines */}
        <div className="p-2 space-y-1.5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-1">
              <div className="w-4 h-3 bg-muted rounded" />
              <div className="flex-1 h-3 bg-muted/50 rounded" />
            </div>
          ))}
        </div>
        {/* Footer */}
        <div className="absolute bottom-2 left-2 right-2 h-2 bg-primary/20 rounded" />
      </div>
      
      {/* Download animation */}
      {downloading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-primary/20 animate-ping" />
        </div>
      )}
      
      <div className="absolute bottom-2 left-2 right-2 text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
        <Download className="h-3 w-3" />
        <span>Branded PDF</span>
      </div>
    </div>
  );
};

const EmailDemo = () => {
  const [sent, setSent] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setSent(true);
      setTimeout(() => setSent(false), 2000);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="relative w-full h-full flex items-center justify-center p-4">
      {/* Email envelope */}
      <div className={`relative transition-all duration-700 ${sent ? 'scale-75 opacity-0 -translate-y-8' : 'scale-100 opacity-100'}`}>
        <div className="w-28 h-20 bg-card rounded-lg border border-border/50 shadow-lg relative overflow-hidden">
          {/* Envelope flap */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-primary/10 border-b border-border/30" 
               style={{ clipPath: 'polygon(0 0, 50% 100%, 100% 0)' }} />
          {/* Content */}
          <div className="absolute bottom-2 left-2 right-2">
            <div className="h-2 bg-primary/30 rounded mb-1" />
            <div className="h-1.5 bg-muted/50 rounded" />
          </div>
        </div>
      </div>
      
      {/* Success checkmark */}
      {sent && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center animate-scale-in">
            <CheckCircle className="h-6 w-6 text-primary" />
          </div>
        </div>
      )}
      
      <div className="absolute bottom-2 left-2 right-2 text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
        <Mail className="h-3 w-3" />
        <span>Cloud Delivery</span>
      </div>
    </div>
  );
};

export default LandingHero;
