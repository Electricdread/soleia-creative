import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Sun, Monitor, Zap, Trash2 } from 'lucide-react';
import VenueScreenMap, { SCREEN_GROUPS } from '@/components/VenueScreenMap';
import OutdoorPlacementDiagram from '@/components/OutdoorPlacementDiagram';

const OUTDOOR_PLACEMENTS = [
  'Outdoor SR',
  'Outdoor Arch',
  'Outdoor SL'
] as const;

interface PlacementEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clipTitle: string;
  clipThumbnail: string | null;
  currentPlacements: string[];
  onSave: (placements: string[]) => Promise<void>;
}

const PlacementEditDialog: React.FC<PlacementEditDialogProps> = ({
  open,
  onOpenChange,
  clipTitle,
  clipThumbnail,
  currentPlacements,
  onSave,
}) => {
  const [selectedPlacements, setSelectedPlacements] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedPlacements([...currentPlacements]);
    }
  }, [open, currentPlacements]);

  const handlePlacementToggle = (placement: string) => {
    setSelectedPlacements(prev =>
      prev.includes(placement)
        ? prev.filter(p => p !== placement)
        : [...prev, placement]
    );
  };

  const handleBulkSelect = (group: string[]) => {
    setSelectedPlacements(prev => {
      const allSelected = group.every(p => prev.includes(p));
      if (allSelected) {
        return prev.filter(p => !group.includes(p));
      } else {
        return [...new Set([...prev, ...group])];
      }
    });
  };

  const handleSelectAllOutdoor = () => {
    handleBulkSelect([...OUTDOOR_PLACEMENTS]);
  };

  const handleSelectAllIndoor = () => {
    const allIndoor = Object.values(SCREEN_GROUPS).flat();
    handleBulkSelect(allIndoor);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(selectedPlacements);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePlacement = (placement: string) => {
    setSelectedPlacements(prev => prev.filter(p => p !== placement));
  };

  const interiorPlacements = selectedPlacements.filter(p => 
    !OUTDOOR_PLACEMENTS.includes(p as typeof OUTDOOR_PLACEMENTS[number])
  );
  
  const outdoorPlacements = selectedPlacements.filter(p => 
    OUTDOOR_PLACEMENTS.includes(p as typeof OUTDOOR_PLACEMENTS[number])
  );

  const interiorCount = interiorPlacements.length;
  const outdoorCount = outdoorPlacements.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-hidden p-0 gap-0 flex flex-col">
        <DialogHeader className="p-4 pb-2 shrink-0">
          <DialogTitle className="text-base font-light tracking-wide flex items-center gap-2">
            {clipThumbnail && (
              <img 
                src={clipThumbnail} 
                alt={clipTitle}
                className="w-10 h-6 object-cover rounded"
              />
            )}
            <span className="truncate text-sm">{clipTitle}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {/* Quick Select Buttons */}
          <div className="flex gap-2 mb-4 p-3 bg-muted/30 rounded-lg border border-border/30">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
              <Zap className="w-3 h-3 text-amber-500" />
              <span className="font-medium">Quick Select</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAllOutdoor}
              className={`text-xs gap-1.5 h-8 px-3 ${
                outdoorCount === OUTDOOR_PLACEMENTS.length
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                  : 'border-amber-500/30 text-amber-500/70 hover:bg-amber-500/10'
              }`}
            >
              <Sun className="w-3 h-3" />
              All Outdoor
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAllIndoor}
              className={`text-xs gap-1.5 h-8 px-3 ${
                interiorCount === Object.values(SCREEN_GROUPS).flat().length
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                  : 'border-amber-500/30 text-amber-500/70 hover:bg-amber-500/10'
              }`}
            >
              <Monitor className="w-3 h-3" />
              All Indoor
            </Button>
          </div>

          <Tabs defaultValue="outdoor" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-3 h-10">
              <TabsTrigger value="outdoor" className="gap-1.5 text-xs">
                <Sun className="w-3.5 h-3.5" />
                Outdoor ({outdoorCount}/3)
              </TabsTrigger>
              <TabsTrigger value="indoor" className="gap-1.5 text-xs">
                <Monitor className="w-3.5 h-3.5" />
                Indoor ({interiorCount}/9)
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="outdoor" className="mt-0">
              <OutdoorPlacementDiagram
                selectedPlacements={selectedPlacements}
                onToggle={handlePlacementToggle}
                interactive
              />
            </TabsContent>
            
            <TabsContent value="indoor" className="mt-0 space-y-3">
              <VenueScreenMap
                selectedPlacements={selectedPlacements}
                onToggle={handlePlacementToggle}
                interactive
              />
            </TabsContent>
          </Tabs>

          {/* Selected Zones Summary - Compact List */}
          {selectedPlacements.length > 0 && (
            <div className="mt-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <span className="text-sm font-medium text-amber-400">
                    {selectedPlacements.length} Zones Selected
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPlacements([])}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-1.5">
                {selectedPlacements.map(placement => (
                  <button
                    key={placement}
                    onClick={() => handleRemovePlacement(placement)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-background/50 rounded-md text-xs border border-border/50 hover:border-destructive/50 hover:bg-destructive/10 transition-colors group"
                  >
                    {OUTDOOR_PLACEMENTS.includes(placement as typeof OUTDOOR_PLACEMENTS[number]) ? (
                      <Sun className="w-3 h-3 text-amber-500" />
                    ) : (
                      <Monitor className="w-3 h-3 text-amber-500" />
                    )}
                    <span>{placement}</span>
                    <X className="w-3 h-3 opacity-50 group-hover:opacity-100 group-hover:text-destructive" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Sticky Action Buttons */}
        <div className="flex gap-3 p-4 border-t border-border/50 bg-background shrink-0">
          <Button
            variant="outline"
            className="flex-1 gap-2 h-11"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
          <Button
            className="flex-1 gap-2 h-11"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Check className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlacementEditDialog;
