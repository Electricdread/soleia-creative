import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Home, TreePine, Zap } from 'lucide-react';
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(selectedPlacements);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const interiorCount = selectedPlacements.filter(p => 
    !OUTDOOR_PLACEMENTS.includes(p as typeof OUTDOOR_PLACEMENTS[number])
  ).length;
  
  const outdoorCount = selectedPlacements.filter(p => 
    OUTDOOR_PLACEMENTS.includes(p as typeof OUTDOOR_PLACEMENTS[number])
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="p-4 sm:p-6 pb-0">
          <DialogTitle className="text-lg font-light tracking-wide">
            Edit Screen Assignments
          </DialogTitle>
        </DialogHeader>
        
        {/* Clip Preview */}
        <div className="px-4 sm:px-6 py-3 flex items-center gap-3 border-b border-border/50">
          {clipThumbnail && (
            <img 
              src={clipThumbnail} 
              alt={clipTitle}
              className="w-16 h-10 object-cover rounded-lg"
            />
          )}
          <span className="font-medium text-sm truncate flex-1">{clipTitle}</span>
        </div>
        
        <div className="p-4 sm:p-6 pt-4">
          <Tabs defaultValue="interior" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="interior" className="gap-2 text-sm">
                <Home className="w-4 h-4" />
                Interior ({interiorCount})
              </TabsTrigger>
              <TabsTrigger value="outdoor" className="gap-2 text-sm">
                <TreePine className="w-4 h-4" />
                Outdoor ({outdoorCount})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="interior" className="mt-0 space-y-4">
              {/* Quick select buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={`text-xs gap-1.5 ${
                    SCREEN_GROUPS.solRays.every(p => selectedPlacements.includes(p)) 
                      ? 'bg-primary/20 border-primary/50 text-primary' 
                      : ''
                  }`}
                  onClick={() => handleBulkSelect(SCREEN_GROUPS.solRays)}
                >
                  <Zap className="w-3 h-3" />
                  Sol Rays
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={`text-xs gap-1.5 ${
                    SCREEN_GROUPS.radials.every(p => selectedPlacements.includes(p)) 
                      ? 'bg-primary/20 border-primary/50 text-primary' 
                      : ''
                  }`}
                  onClick={() => handleBulkSelect(SCREEN_GROUPS.radials)}
                >
                  <Zap className="w-3 h-3" />
                  All Radials
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={`text-xs gap-1.5 ${
                    SCREEN_GROUPS.curves.every(p => selectedPlacements.includes(p)) 
                      ? 'bg-primary/20 border-primary/50 text-primary' 
                      : ''
                  }`}
                  onClick={() => handleBulkSelect(SCREEN_GROUPS.curves)}
                >
                  <Zap className="w-3 h-3" />
                  All Curves
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={`text-xs gap-1.5 ${
                    SCREEN_GROUPS.imag.every(p => selectedPlacements.includes(p)) 
                      ? 'bg-primary/20 border-primary/50 text-primary' 
                      : ''
                  }`}
                  onClick={() => handleBulkSelect(SCREEN_GROUPS.imag)}
                >
                  <Zap className="w-3 h-3" />
                  All IMAG
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={`text-xs gap-1.5 ${
                    [...SCREEN_GROUPS.center, ...SCREEN_GROUPS.djBooth].every(p => selectedPlacements.includes(p)) 
                      ? 'bg-primary/20 border-primary/50 text-primary' 
                      : ''
                  }`}
                  onClick={() => handleBulkSelect([...SCREEN_GROUPS.center, ...SCREEN_GROUPS.djBooth])}
                >
                  <Zap className="w-3 h-3" />
                  Center + DJ
                </Button>
              </div>
              
              <VenueScreenMap
                selectedPlacements={selectedPlacements}
                onToggle={handlePlacementToggle}
                interactive
              />
            </TabsContent>
            
            <TabsContent value="outdoor" className="mt-0">
              <OutdoorPlacementDiagram
                selectedPlacements={selectedPlacements}
                onToggle={handlePlacementToggle}
                interactive
              />
            </TabsContent>
          </Tabs>
          
          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Check className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlacementEditDialog;
