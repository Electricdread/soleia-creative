import React from 'react';
import { Monitor, Sun, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Selection {
  clip_id: string;
  clip_title: string;
  clip_thumbnail: string | null;
  placements: string[];
}

interface PlacementSummaryByScreenProps {
  selections: Selection[];
}

const INTERIOR_PLACEMENTS = ['Curves SR', 'IMAG SR', 'Center', 'IMAG SL', 'SL Curves', 'DJ Booth'];
const OUTDOOR_PLACEMENTS = ['Outdoor SR', 'Outdoor Arch', 'Outdoor SL'];

const PlacementSummaryByScreen: React.FC<PlacementSummaryByScreenProps> = ({ selections }) => {
  // Group clips by placement
  const placementGroups: Record<string, Selection[]> = {};
  
  [...INTERIOR_PLACEMENTS, ...OUTDOOR_PLACEMENTS].forEach(placement => {
    placementGroups[placement] = selections.filter(s => s.placements?.includes(placement));
  });

  const interiorScreens = INTERIOR_PLACEMENTS.filter(p => placementGroups[p].length > 0);
  const outdoorScreens = OUTDOOR_PLACEMENTS.filter(p => placementGroups[p].length > 0);

  if (interiorScreens.length === 0 && outdoorScreens.length === 0) {
    return (
      <Card className="glass border-border/50">
        <CardContent className="p-6 text-center text-muted-foreground">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No screen placements assigned yet</p>
          <p className="text-sm mt-1">Configure clips to assign them to venue screens</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Interior Screens */}
      {interiorScreens.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Interior Screens</h3>
            <Badge variant="secondary" className="ml-auto">
              {interiorScreens.length} screens
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {interiorScreens.map(placement => (
              <ScreenCard 
                key={placement}
                placement={placement}
                clips={placementGroups[placement]}
                type="interior"
              />
            ))}
          </div>
        </div>
      )}

      {/* Outdoor Screens */}
      {outdoorScreens.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sun className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold text-foreground">Outdoor Screens</h3>
            <Badge variant="secondary" className="ml-auto">
              {outdoorScreens.length} screens
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {outdoorScreens.map(placement => (
              <ScreenCard 
                key={placement}
                placement={placement}
                clips={placementGroups[placement]}
                type="outdoor"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface ScreenCardProps {
  placement: string;
  clips: Selection[];
  type: 'interior' | 'outdoor';
}

const ScreenCard: React.FC<ScreenCardProps> = ({ placement, clips, type }) => {
  const Icon = type === 'interior' ? Monitor : Sun;
  const colorClass = type === 'interior' ? 'text-primary border-primary/30' : 'text-accent border-accent/30';
  const bgClass = type === 'interior' ? 'bg-primary/5' : 'bg-accent/5';

  return (
    <Card className={`glass border ${colorClass} ${bgClass}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className={`w-4 h-4 ${type === 'interior' ? 'text-primary' : 'text-accent'}`} />
          {placement}
          <Badge variant="outline" className="ml-auto text-[10px] h-5">
            {clips.length} clip{clips.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {clips.map(clip => (
            <div 
              key={clip.clip_id}
              className="flex items-center gap-2 p-2 rounded-lg bg-background/50"
            >
              {clip.clip_thumbnail && (
                <img 
                  src={clip.clip_thumbnail}
                  alt={clip.clip_title}
                  className="w-12 h-8 rounded object-cover flex-shrink-0"
                />
              )}
              <span className="text-xs font-medium text-foreground truncate flex-1">
                {clip.clip_title}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlacementSummaryByScreen;
