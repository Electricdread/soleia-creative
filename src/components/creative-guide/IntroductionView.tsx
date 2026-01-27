import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Target, Volume2, VolumeX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import soleiaIntroVideo from '@/assets/soleia-intro-video.webm';

interface IntroductionViewProps {
  onNavigate?: (category: string) => void;
}

export function IntroductionView({ onNavigate }: IntroductionViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  const handleWhatsInsideClick = () => {
    if (onNavigate) {
      onNavigate('venue-overview');
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  // Auto-play with audio on mount (browsers may block unmuted autoplay)
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // Start muted to ensure autoplay works, then try to unmute
      video.muted = true;
      video.play().then(() => {
        // Try to unmute after successful play
        video.muted = false;
        setIsMuted(false);
      }).catch(() => {
        // If unmuted autoplay fails, keep it muted
        video.muted = true;
        setIsMuted(true);
        video.play().catch(() => {});
      });
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-gradient-gold">ShowBlox × Soleia</h2>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Immersive entertainment and branded experiences brought to life through cutting-edge technology, thoughtful design, and seamless execution.
        </p>
      </div>

      {/* Hero Video */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="glass border-primary/20 overflow-hidden group hover:border-primary/40 transition-all duration-500 hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.3)]">
          <div className="relative">
            {/* Elegant frame with gold accent borders */}
            <div className="absolute inset-0 z-10 pointer-events-none border-4 border-primary/10 dark:border-primary/20" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent z-10" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent z-10" />
            
            <video 
              ref={videoRef}
              src={soleiaIntroVideo}
              autoPlay
              loop
              playsInline
              muted
              className="w-full h-auto transition-transform duration-700 group-hover:scale-[1.02]"
            />
            
            {/* Audio mute toggle button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="absolute bottom-4 right-4 z-20 bg-background/80 backdrop-blur-sm hover:bg-background/90 border border-primary/30 shadow-lg"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-primary" />
              ) : (
                <Volume2 className="w-5 h-5 text-primary" />
              )}
            </Button>
            
            {/* Theme-aware gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent pointer-events-none dark:from-background/70" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-transparent pointer-events-none dark:from-background/40" />
            
            {/* Corner accents */}
            <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-primary/40 rounded-tl-sm z-10" />
            <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-primary/40 rounded-tr-sm z-10" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-primary/40 rounded-bl-sm z-10" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-primary/40 rounded-br-sm z-10" />
          </div>
        </Card>
      </motion.div>

      {/* Main Partnership Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass border-primary/30 overflow-hidden group hover:border-primary/50 transition-all duration-500 hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.3)]">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 shrink-0">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gradient-gold">The Platform</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Together, ShowBlox's modular interactive systems and Soleia's visually iconic environment create a platform where brands don't just appear—they are <strong className="text-foreground">experienced</strong>. From interactive photo and video activations to custom gaming, LED branding, and real-time content, every touchpoint is designed to engage guests, amplify social sharing, and elevate the overall event atmosphere.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Our Approach */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="glass border-primary/30 overflow-hidden group hover:border-primary/50 transition-all duration-500 hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.3)]">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 shrink-0">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gradient-gold">Our Approach</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Our approach blends creativity with reliability. Each activation is custom-tailored to align with your brand goals, audience, and event flow, while remaining scalable, efficient, and production-ready. Whether the objective is awareness, engagement, or memorability, we focus on experiences that feel intentional, immersive, and effortless for guests.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Document Purpose */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card 
          className="glass border-primary/40 bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden cursor-pointer hover:border-primary/60 hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.4)] transition-all duration-300 active:scale-[0.98]"
          onClick={handleWhatsInsideClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleWhatsInsideClick()}
        >
          <CardContent className="p-6 sm:p-8 text-center space-y-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 shadow-lg shadow-primary/10 w-fit mx-auto">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gradient-gold">What's Inside</h3>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
              This guide outlines the available interactive experiences, content development options, pricing guidelines, and operational terms to help you build a successful activation at Soleia.
            </p>
            <div className="text-xs text-primary/70 font-medium">
              Tap to explore →
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default IntroductionView;
