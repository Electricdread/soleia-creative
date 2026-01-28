import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Target, Volume2, VolumeX, Maximize } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VideoModal } from '@/components/creative-guide/VideoModal';

// High-quality hero video from Supabase storage
const soleiaIntroVideo = 'https://rszawchsbpsmtrtvljta.supabase.co/storage/v1/object/public/clips/events/Soleia_hero_event(1).webm';

interface IntroductionViewProps {
  onNavigate?: (category: string) => void;
}

export function IntroductionView({ onNavigate }: IntroductionViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const openFullscreen = () => {
    // Pause inline video when opening modal
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Resume inline video when closing modal
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  // Auto-play muted on mount (browsers require muted for autoplay)
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      setIsMuted(true);
      video.play().catch(() => {
        // Autoplay failed, user will need to interact
        console.log('Autoplay blocked by browser');
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
        <Card className="glass border-primary/20 overflow-hidden">
          <div className="relative">
            <video 
              ref={videoRef}
              src={soleiaIntroVideo}
              autoPlay
              loop
              playsInline
              muted
              className="w-full h-auto"
            />
            
            {/* Video control buttons */}
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="bg-background/80 backdrop-blur-sm hover:bg-background/90 border border-primary/30 shadow-lg"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-primary" />
                ) : (
                  <Volume2 className="w-5 h-5 text-primary" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={openFullscreen}
                className="bg-background/80 backdrop-blur-sm hover:bg-background/90 border border-primary/30 shadow-lg"
              >
                <Maximize className="w-5 h-5 text-primary" />
              </Button>
            </div>
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

      {/* Fullscreen Video Modal */}
      <VideoModal
        isOpen={isModalOpen}
        onClose={closeModal}
        videoSrc={soleiaIntroVideo}
        title="Soleia Experience"
      />
    </div>
  );
}

export default IntroductionView;
