import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserMenu } from '@/components/auth/UserMenu';
import { artlistCategories, type ArtlistCategoryKey } from '@/lib/api/artlist';
import sunIcon from '@/assets/sun-icon.jpeg';

interface MobileMenuProps {
  selectedCategory: ArtlistCategoryKey;
  onCategoryChange: (category: ArtlistCategoryKey) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: () => void;
  isSearching: boolean;
}

export function MobileMenu({
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  onSearch,
  isSearching,
}: MobileMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleCategorySelect = (category: ArtlistCategoryKey) => {
    onCategoryChange(category);
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="lg:hidden w-12 h-12 rounded-xl touch-manipulation border-primary/30 bg-background/50 hover:bg-primary/10"
        aria-label="Open menu"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="w-6 h-6 text-primary" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '-100%', opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0.5 }}
              transition={{ 
                type: 'spring', 
                stiffness: 300, 
                damping: 30,
                opacity: { duration: 0.2 }
              }}
              className="fixed left-0 top-0 bottom-0 z-50 w-[85vw] max-w-sm glass-strong border-r border-primary/20 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <h2 className="text-gradient-gold text-xl tracking-wide font-medium">
                  Looks Collection
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 rounded-xl"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto h-[calc(100%-80px)]">
                {/* Search */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="relative"
                >
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search collection..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onSearch();
                        setIsOpen(false);
                      }
                    }}
                    className="pl-12 h-14 text-base bg-background/40 border-border/50 focus:border-primary/50 rounded-xl touch-manipulation"
                  />
                </motion.div>

                {/* Categories */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="space-y-2"
                >
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-2">
                    Categories
                  </p>
                  <div className="space-y-1 max-h-[45vh] overflow-y-auto">
                    {artlistCategories.map((cat, index) => (
                      <motion.button
                        key={cat.key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.03 }}
                        onClick={() => handleCategorySelect(cat.key)}
                        className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-left transition-all touch-manipulation active:scale-[0.98] ${
                          selectedCategory === cat.key
                            ? 'bg-gradient-to-r from-primary/20 to-accent/10 text-primary border border-primary/30'
                            : 'hover:bg-primary/5 text-foreground'
                        }`}
                      >
                        <img src={sunIcon} alt="" className="w-6 h-6 object-contain" />
                        <span className="font-medium text-base">{cat.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* User Menu / Sign In */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="pt-6 border-t border-border/50"
                >
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-2 mb-3">
                    Account
                  </p>
                  <div className="px-2">
                    <UserMenu />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
