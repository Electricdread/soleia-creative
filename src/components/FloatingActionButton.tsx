import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus } from 'lucide-react';
import sunIcon from '@/assets/sun-icon.jpeg';

interface FloatingActionButtonProps {
  count: number;
  onClick: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ count, onClick }) => {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClick}
          className="fixed bottom-24 right-4 md:bottom-28 md:right-8 z-50 w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-primary via-accent to-primary shadow-2xl glow-gold flex items-center justify-center touch-manipulation border-2 border-primary-foreground/20"
          style={{
            boxShadow: '0 8px 32px -4px hsl(38 92% 50% / 0.5), 0 4px 16px -2px hsl(38 92% 50% / 0.3), inset 0 1px 0 hsl(45 90% 70% / 0.3)'
          }}
        >
          {/* Animated ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/50"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Inner content */}
          <div className="relative flex flex-col items-center justify-center">
            <img 
              src={sunIcon} 
              alt="" 
              className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-lg"
            />
            <span className="absolute -bottom-1 text-xs md:text-sm font-bold text-primary-foreground drop-shadow-md">
              {count}
            </span>
          </div>

          {/* Badge with count */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-7 h-7 md:w-8 md:h-8 rounded-full bg-success flex items-center justify-center shadow-lg border-2 border-background"
          >
            <Check className="w-4 h-4 md:w-5 md:h-5 text-success-foreground" />
          </motion.div>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default FloatingActionButton;
