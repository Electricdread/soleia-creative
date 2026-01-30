import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import portalHeroVideo from '@/assets/showblox-portal-hero.mp4';

export function AccessGranted() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Video */}
      <video
        src={portalHeroVideo}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full"
        >
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Gradient Bar */}
            <div className="h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500" />
            
            <div className="p-8 text-center">
              {/* Logo */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ delay: 0.2 }}
                className="font-tech text-lg font-bold tracking-[4px] text-white mb-8"
              >
                SHOWBLOX
              </motion.div>

              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="relative mx-auto mb-6"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.4),0_0_80px_rgba(34,197,94,0.2)]">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                
                {/* Sparkle effects */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0"
                >
                  <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-cyan-400" />
                  <Sparkles className="absolute -bottom-1 -left-3 w-4 h-4 text-purple-400" />
                </motion.div>
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-tech font-bold text-white mb-3"
              >
                Access Granted
              </motion.h1>

              {/* Email Badge */}
              {user?.email && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="inline-block px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg mb-4"
                >
                  <span className="font-tech text-sm text-emerald-400">{user.email}</span>
                </motion.div>
              )}

              {/* Message */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="font-tech text-sm text-zinc-400 leading-relaxed mb-8"
              >
                Your admin access has been approved. You now have full access to all ShowBlox portal features.
              </motion.p>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Button
                  onClick={() => navigate('/admin')}
                  className="w-full h-12 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-tech text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all hover:shadow-[0_0_50px_rgba(6,182,212,0.4)]"
                >
                  Enter Portal
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 border-t border-zinc-800 text-center">
              <p className="font-tech text-[10px] text-zinc-600 uppercase tracking-wider">
                ShowBlox Creative Management System
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
