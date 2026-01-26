import React from 'react';
import { Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden w-12 h-12 rounded-xl touch-manipulation border-primary/30 bg-background/50 hover:bg-primary/10"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6 text-primary" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[85vw] max-w-sm glass-strong border-r border-primary/20 p-0">
        <SheetHeader className="p-6 border-b border-border/50">
          <SheetTitle className="text-gradient-gold text-xl tracking-wide font-medium text-left">
            Looks Collection
          </SheetTitle>
        </SheetHeader>

        <div className="p-6 space-y-6 overflow-y-auto h-[calc(100%-80px)]">
          {/* Search */}
          <div className="relative">
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
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-2">
              Categories
            </p>
            <div className="space-y-1 max-h-[45vh] overflow-y-auto">
              {artlistCategories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => handleCategorySelect(cat.key)}
                  className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-left transition-all touch-manipulation active:scale-[0.98] ${
                    selectedCategory === cat.key
                      ? 'bg-gradient-to-r from-primary/20 to-accent/10 text-primary border border-primary/30'
                      : 'hover:bg-primary/5 text-foreground'
                  }`}
                >
                  <img src={sunIcon} alt="" className="w-6 h-6 object-contain" />
                  <span className="font-medium text-base">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* User Menu / Sign In */}
          <div className="pt-6 border-t border-border/50">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-2 mb-3">
              Account
            </p>
            <div className="px-2">
              <UserMenu />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
