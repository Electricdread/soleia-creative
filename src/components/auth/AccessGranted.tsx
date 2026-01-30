import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import showbloxIcon from '@/assets/showblox-icon.png';

interface AccessGrantedProps {
  onEnterPortal: () => void;
}

export function AccessGranted({ onEnterPortal }: AccessGrantedProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleEnterPortal = () => {
    onEnterPortal();
    navigate('/admin');
  };
  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />
      
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* ShowBlox Logo */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center mb-10"
        >
          <img 
            src={showbloxIcon} 
            alt="ShowBlox" 
            className="h-20 w-20 sm:h-24 sm:w-24 object-contain mb-4"
          />
          <span className="text-xl sm:text-2xl font-bold tracking-[4px] text-white">SHOWBLOX</span>
        </motion.div>

        {/* Card */}
        <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
          {/* Top Bar */}
          <div className="h-1 bg-zinc-700" />
          
          <div className="p-6 sm:p-8 text-center">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-6"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.4)]">
                <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl sm:text-2xl font-bold text-white mb-3"
            >
              Access Granted
            </motion.h1>

            {/* Email Badge */}
            {user?.email && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="inline-block px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg mb-4"
              >
                <span className="text-sm text-zinc-300">{user.email}</span>
              </motion.div>
            )}

            {/* Message */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-zinc-500 leading-relaxed mb-8"
            >
              Your admin access has been approved. You now have full access to the ShowBlox portal.
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                onClick={handleEnterPortal}
                className="w-full h-12 bg-white hover:bg-zinc-200 text-black font-semibold text-sm uppercase tracking-wider transition-all"
              >
                Enter Portal
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-zinc-800 text-center">
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest">
              ShowBlox Creative Management System
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
