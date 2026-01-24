import React, { useState } from 'react';
import { Play, Check, Send, X, Sparkles, Plus, Clock, Monitor, MessageSquare, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Clip {
  id: number;
  title: string;
  thumbnail: string;
  videoUrl: string;
  resolution: string;
  duration: string;
}

interface SelectedClip extends Clip {
  note: string;
}

type CategoryKey = 'particles' | 'events' | 'abstract' | 'nature';

// Direct sample video URLs - no ads, direct MP4 files
const sampleVideos = [
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
  'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4',
  'https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_1MB.mp4',
  'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
  'https://samplelib.com/lib/preview/mp4/sample-10s.mp4',
  'https://samplelib.com/lib/preview/mp4/sample-15s.mp4',
];

const getVideoUrl = (index: number) => sampleVideos[index % sampleVideos.length];

const initialCategories: Record<CategoryKey, Clip[]> = {
  particles: [
    { id: 1, title: 'Golden Particles Flow', thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=225&fit=crop', videoUrl: getVideoUrl(0), resolution: '3840x2160', duration: '0:15' },
    { id: 2, title: 'Digital Dust Overlay', thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=225&fit=crop', videoUrl: getVideoUrl(1), resolution: '3840x2160', duration: '0:20' },
    { id: 3, title: 'Cosmic Particle Storm', thumbnail: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=225&fit=crop', videoUrl: getVideoUrl(2), resolution: '3840x2160', duration: '0:12' },
    { id: 4, title: 'Bokeh Light Particles', thumbnail: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&h=225&fit=crop', videoUrl: getVideoUrl(3), resolution: '3840x2160', duration: '0:18' },
    { id: 5, title: 'Snow Particles Winter', thumbnail: 'https://images.unsplash.com/photo-1483086431886-3590a88317fe?w=400&h=225&fit=crop', videoUrl: getVideoUrl(4), resolution: '3840x2160', duration: '0:25' },
    { id: 6, title: 'Sparkle Glitter Rain', thumbnail: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400&h=225&fit=crop', videoUrl: getVideoUrl(5), resolution: '3840x2160', duration: '0:10' },
    { id: 7, title: 'Energy Trails Motion', thumbnail: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=225&fit=crop', videoUrl: getVideoUrl(0), resolution: '3840x2160', duration: '0:30' },
    { id: 8, title: 'Dust Motes Sunlight', thumbnail: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?w=400&h=225&fit=crop', videoUrl: getVideoUrl(1), resolution: '3840x2160', duration: '0:22' },
    { id: 9, title: 'Neon Particle Stream', thumbnail: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=225&fit=crop', videoUrl: getVideoUrl(2), resolution: '3840x2160', duration: '0:15' },
    { id: 10, title: 'Crystal Particle Field', thumbnail: 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=400&h=225&fit=crop', videoUrl: getVideoUrl(3), resolution: '3840x2160', duration: '0:28' },
    { id: 11, title: 'Ember Fire Particles', thumbnail: 'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=400&h=225&fit=crop', videoUrl: getVideoUrl(4), resolution: '3840x2160', duration: '0:16' },
    { id: 12, title: 'Quantum Light Dots', thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=225&fit=crop', videoUrl: getVideoUrl(5), resolution: '3840x2160', duration: '0:24' },
  ],
  events: [
    { id: 13, title: 'Wedding Floral Backdrop', thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=225&fit=crop', videoUrl: getVideoUrl(0), resolution: '3840x2160', duration: '0:20' },
    { id: 14, title: 'Corporate Event Stage', thumbnail: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=225&fit=crop', videoUrl: getVideoUrl(1), resolution: '3840x2160', duration: '0:18' },
    { id: 15, title: 'Gala Night Ambiance', thumbnail: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=225&fit=crop', videoUrl: getVideoUrl(2), resolution: '3840x2160', duration: '0:25' },
    { id: 16, title: 'Concert Light Show', thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=225&fit=crop', videoUrl: getVideoUrl(3), resolution: '3840x2160', duration: '0:30' },
    { id: 17, title: 'Festival Stage Design', thumbnail: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=225&fit=crop', videoUrl: getVideoUrl(4), resolution: '3840x2160', duration: '0:22' },
    { id: 18, title: 'Awards Ceremony Glow', thumbnail: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=225&fit=crop', videoUrl: getVideoUrl(5), resolution: '3840x2160', duration: '0:15' },
    { id: 19, title: 'Birthday Party Lights', thumbnail: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=225&fit=crop', videoUrl: getVideoUrl(0), resolution: '3840x2160', duration: '0:28' },
    { id: 20, title: 'Conference Backdrop', thumbnail: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&h=225&fit=crop', videoUrl: getVideoUrl(1), resolution: '3840x2160', duration: '0:20' },
    { id: 21, title: 'Night Club Atmosphere', thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=225&fit=crop', videoUrl: getVideoUrl(2), resolution: '3840x2160', duration: '0:24' },
    { id: 22, title: 'Red Carpet Premiere', thumbnail: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=225&fit=crop', videoUrl: getVideoUrl(3), resolution: '3840x2160', duration: '0:16' },
    { id: 23, title: 'DJ Set Visuals', thumbnail: 'https://images.unsplash.com/photo-1571266028243-d220c89a3955?w=400&h=225&fit=crop', videoUrl: getVideoUrl(4), resolution: '3840x2160', duration: '0:30' },
    { id: 24, title: 'Trade Show Booth', thumbnail: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=225&fit=crop', videoUrl: getVideoUrl(5), resolution: '3840x2160', duration: '0:18' },
  ],
  abstract: [
    { id: 25, title: 'Liquid Color Waves', thumbnail: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400&h=225&fit=crop', videoUrl: getVideoUrl(0), resolution: '3840x2160', duration: '0:20' },
    { id: 26, title: 'Geometric Transitions', thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=225&fit=crop', videoUrl: getVideoUrl(1), resolution: '3840x2160', duration: '0:12' },
    { id: 27, title: 'Neon Grid Motion', thumbnail: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=400&h=225&fit=crop', videoUrl: getVideoUrl(2), resolution: '3840x2160', duration: '0:25' },
    { id: 28, title: 'Fractal Dreams', thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=225&fit=crop', videoUrl: getVideoUrl(3), resolution: '3840x2160', duration: '0:30' },
    { id: 29, title: 'Cyberpunk Cityscape', thumbnail: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=400&h=225&fit=crop', videoUrl: getVideoUrl(4), resolution: '3840x2160', duration: '0:15' },
    { id: 30, title: 'Plasma Energy Flow', thumbnail: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=400&h=225&fit=crop', videoUrl: getVideoUrl(5), resolution: '3840x2160', duration: '0:22' },
    { id: 31, title: 'Holographic Texture', thumbnail: 'https://images.unsplash.com/photo-1618556450991-2f1af64e8191?w=400&h=225&fit=crop', videoUrl: getVideoUrl(0), resolution: '3840x2160', duration: '0:18' },
    { id: 32, title: 'Digital Glitch Art', thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=225&fit=crop', videoUrl: getVideoUrl(1), resolution: '3840x2160', duration: '0:10' },
    { id: 33, title: 'Smooth Gradient Flow', thumbnail: 'https://images.unsplash.com/photo-1506606401543-2e73709cebb4?w=400&h=225&fit=crop', videoUrl: getVideoUrl(2), resolution: '3840x2160', duration: '0:28' },
    { id: 34, title: 'Ink Swirl Dispersion', thumbnail: 'https://images.unsplash.com/photo-1557672199-6ff6c82b6c98?w=400&h=225&fit=crop', videoUrl: getVideoUrl(3), resolution: '3840x2160', duration: '0:24' },
    { id: 35, title: 'Chrome Reflection', thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&h=225&fit=crop', videoUrl: getVideoUrl(4), resolution: '3840x2160', duration: '0:16' },
    { id: 36, title: 'Kaleidoscope Pattern', thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=225&fit=crop', videoUrl: getVideoUrl(5), resolution: '3840x2160', duration: '0:20' },
  ],
  nature: [
    { id: 37, title: 'Aurora Sky Motion', thumbnail: 'https://images.unsplash.com/photo-1579033461380-adb47c3eb938?w=400&h=225&fit=crop', videoUrl: getVideoUrl(0), resolution: '3840x2160', duration: '0:30' },
    { id: 38, title: 'Ocean Waves Loop', thumbnail: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=225&fit=crop', videoUrl: getVideoUrl(1), resolution: '3840x2160', duration: '0:25' },
    { id: 39, title: 'Fire & Smoke Effect', thumbnail: 'https://images.unsplash.com/photo-1525185673812-626097f5e1ee?w=400&h=225&fit=crop', videoUrl: getVideoUrl(2), resolution: '3840x2160', duration: '0:18' },
    { id: 40, title: 'Thunderstorm Drama', thumbnail: 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=400&h=225&fit=crop', videoUrl: getVideoUrl(3), resolution: '3840x2160', duration: '0:22' },
    { id: 41, title: 'Waterfall Cascade', thumbnail: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=400&h=225&fit=crop', videoUrl: getVideoUrl(4), resolution: '3840x2160', duration: '0:28' },
    { id: 42, title: 'Sunset Time Lapse', thumbnail: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=400&h=225&fit=crop', videoUrl: getVideoUrl(5), resolution: '3840x2160', duration: '0:20' },
    { id: 43, title: 'Forest Wind Motion', thumbnail: 'https://images.unsplash.com/photo-1511497584788-876760111969?w=400&h=225&fit=crop', videoUrl: getVideoUrl(0), resolution: '3840x2160', duration: '0:15' },
    { id: 44, title: 'Desert Sand Storm', thumbnail: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&h=225&fit=crop', videoUrl: getVideoUrl(1), resolution: '3840x2160', duration: '0:24' },
    { id: 45, title: 'Cloud Formation', thumbnail: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=400&h=225&fit=crop', videoUrl: getVideoUrl(2), resolution: '3840x2160', duration: '0:30' },
    { id: 46, title: 'Rain on Glass', thumbnail: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=400&h=225&fit=crop', videoUrl: getVideoUrl(3), resolution: '3840x2160', duration: '0:12' },
    { id: 47, title: 'Mountain Fog Roll', thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=225&fit=crop', videoUrl: getVideoUrl(4), resolution: '3840x2160', duration: '0:26' },
    { id: 48, title: 'Starry Night Sky', thumbnail: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=225&fit=crop', videoUrl: getVideoUrl(5), resolution: '3840x2160', duration: '0:20' },
  ],
};

const categoryGradients: Record<CategoryKey, string> = {
  particles: 'gradient-particles',
  events: 'gradient-events',
  abstract: 'gradient-abstract',
  nature: 'gradient-nature',
};

const MotionGraphicsLookbook = () => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('particles');
  const [selectedClips, setSelectedClips] = useState<SelectedClip[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewClip, setPreviewClip] = useState<Clip | null>(null);
  const [previewNote, setPreviewNote] = useState('');
  const [categories, setCategories] = useState(initialCategories);
  const [newClipTitle, setNewClipTitle] = useState('');
  const [newThumbnail, setNewThumbnail] = useState('');
  const [newResolution, setNewResolution] = useState('3840x2160');
  const [newDuration, setNewDuration] = useState('0:20');
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const openPreview = (clip: Clip, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewClip(clip);
    const existingSelection = selectedClips.find(c => c.id === clip.id);
    setPreviewNote(existingSelection?.note || '');
    setShowPreviewModal(true);
  };

  const addToSelectionFromPreview = () => {
    if (!previewClip) return;
    
    setSelectedClips(prev => {
      const existing = prev.find(c => c.id === previewClip.id);
      if (existing) {
        return prev.map(c => c.id === previewClip.id ? { ...c, note: previewNote } : c);
      }
      return [...prev, { ...previewClip, note: previewNote }];
    });
    setShowPreviewModal(false);
    setPreviewClip(null);
    setPreviewNote('');
  };

  const toggleClipSelection = (clip: Clip) => {
    setSelectedClips(prev => {
      const isSelected = prev.some(c => c.id === clip.id);
      if (isSelected) {
        return prev.filter(c => c.id !== clip.id);
      } else {
        return [...prev, { ...clip, note: '' }];
      }
    });
  };

  const handleImageError = (clipId: number) => {
    setImageErrors(prev => new Set(prev).add(clipId));
  };

  const addNewClip = () => {
    if (!newClipTitle) {
      return;
    }

    const newClip: Clip = {
      id: Date.now(),
      title: newClipTitle,
      thumbnail: newThumbnail,
      videoUrl: getVideoUrl(Date.now()),
      resolution: newResolution,
      duration: newDuration
    };

    setCategories(prev => ({
      ...prev,
      [selectedCategory]: [...prev[selectedCategory], newClip]
    }));

    setShowAddModal(false);
    setNewClipTitle('');
    setNewThumbnail('');
    setNewResolution('3840x2160');
    setNewDuration('0:20');
  };

  const sendSelections = () => {
    console.log('Selected clips:', selectedClips);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20 glow-purple">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Premium Motion Graphics</h1>
              <p className="text-muted-foreground">4K Background Loops & Visual Effects</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Category Navigation */}
        <nav className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {(Object.keys(categories) as CategoryKey[]).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-3 rounded-full font-medium transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground glow-purple'
                  : 'glass hover:bg-secondary/80 text-foreground'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)} ({categories[cat].length})
            </button>
          ))}
        </nav>

        {/* Add Clip Button */}
        <div className="mb-6">
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-success hover:bg-success/90 text-success-foreground glow-green"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Clip to {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
          </Button>
        </div>

        {/* Clips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {categories[selectedCategory].map((clip) => {
            const isSelected = selectedClips.some(c => c.id === clip.id);
            const hasImageError = imageErrors.has(clip.id);
            return (
              <div
                key={clip.id}
                className={`group relative glass rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-primary/50 animate-fade-in ${
                  isSelected ? 'ring-2 ring-success ring-offset-2 ring-offset-background' : ''
                }`}
                onClick={() => toggleClipSelection(clip)}
              >
                <div className={`relative aspect-video overflow-hidden ${(!clip.thumbnail || hasImageError) ? categoryGradients[selectedCategory] : 'bg-card'}`}>
                  {clip.thumbnail && !hasImageError && (
                    <img 
                      src={clip.thumbnail} 
                      alt={clip.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={() => handleImageError(clip.id)}
                      loading="lazy"
                    />
                  )}
                  
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
                  
                  {/* Play icon - opens preview modal */}
                  <button
                    onClick={(e) => openPreview(clip, e)}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <div className="p-4 rounded-full glass animate-scale-in hover:bg-primary/30 transition-colors">
                      <Play className="w-8 h-8 text-foreground fill-foreground" />
                    </div>
                  </button>

                  {/* Top badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <div className="glass px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 text-foreground">
                      <Monitor className="w-3 h-3" />
                      4K
                    </div>
                    <div className="glass px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 text-foreground">
                      <Clock className="w-3 h-3" />
                      {clip.duration}
                    </div>
                  </div>

                  {/* Resolution badge */}
                  <div className="absolute bottom-3 left-3 bg-primary/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-primary-foreground">
                    {clip.resolution}
                  </div>

                  {/* Selection check with note indicator */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 flex gap-1">
                      {selectedClips.find(c => c.id === clip.id)?.note && (
                        <div className="bg-primary rounded-full p-2 shadow-lg animate-scale-in">
                          <MessageSquare className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                      <div className="bg-success rounded-full p-2 shadow-lg animate-scale-in">
                        <Check className="w-5 h-5 text-success-foreground" />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="text-foreground font-medium mb-1 truncate">{clip.title}</h3>
                  <p className="text-muted-foreground text-sm">Loop Ready • Premium</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selection Bar */}
        {selectedClips.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 glass-strong p-6 shadow-2xl z-40 animate-slide-up">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <span className="text-foreground font-medium whitespace-nowrap">
                  {selectedClips.length} clip{selectedClips.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2 overflow-x-auto">
                  {selectedClips.map((clip) => {
                    const hasError = imageErrors.has(clip.id);
                    return (
                      <div key={clip.id} className="relative group/thumb flex-shrink-0">
                        <div 
                          className={`w-20 h-12 rounded-lg border-2 ${clip.note ? 'border-primary' : 'border-border'} overflow-hidden cursor-pointer ${(!clip.thumbnail || hasError) ? categoryGradients[selectedCategory] : 'bg-card'}`}
                          onClick={(e) => openPreview(clip, e)}
                        >
                          {clip.thumbnail && !hasError ? (
                            <img src={clip.thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-4 h-4 text-foreground/80 fill-foreground/80" />
                            </div>
                          )}
                        </div>
                        {clip.note && (
                          <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5">
                            <FileText className="w-2.5 h-2.5 text-primary-foreground" />
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleClipSelection(clip);
                          }}
                          className="absolute -top-2 -right-2 bg-destructive rounded-full p-1 opacity-0 group-hover/thumb:opacity-100 transition-opacity shadow-lg"
                        >
                          <X className="w-3 h-3 text-destructive-foreground" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
              <Button
                onClick={sendSelections}
                className="bg-primary hover:bg-primary/90 text-primary-foreground glow-purple whitespace-nowrap"
              >
                <Send className="w-5 h-5 mr-2" />
                Send Selection
              </Button>
            </div>
          </div>
        )}

        {/* Video Preview Modal */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="glass-strong border-border max-w-3xl" aria-describedby="preview-dialog-description">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <Play className="w-5 h-5 text-primary" />
                {previewClip?.title}
              </DialogTitle>
              <DialogDescription id="preview-dialog-description" className="text-muted-foreground">
                Preview clip and add notes before selecting
              </DialogDescription>
            </DialogHeader>
            
            {previewClip && (
              <div className="space-y-4 mt-4">
                {/* Video Preview */}
                <div className="relative aspect-video rounded-lg overflow-hidden bg-card">
                  <video
                    key={previewClip.id}
                    src={previewClip.videoUrl}
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    poster={previewClip.thumbnail}
                  >
                    Your browser does not support the video tag.
                  </video>
                  
                  {/* Info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-card to-transparent pointer-events-none">
                    <div className="flex gap-3">
                      <span className="glass px-2 py-1 rounded text-xs font-bold flex items-center gap-1 text-foreground">
                        <Monitor className="w-3 h-3" />
                        {previewClip.resolution}
                      </span>
                      <span className="glass px-2 py-1 rounded text-xs font-medium flex items-center gap-1 text-foreground">
                        <Clock className="w-3 h-3" />
                        {previewClip.duration}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Note Input */}
                <div className="space-y-2">
                  <Label htmlFor="preview-note" className="text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Add a note for this selection
                  </Label>
                  <Textarea
                    id="preview-note"
                    value={previewNote}
                    onChange={(e) => setPreviewNote(e.target.value)}
                    placeholder="e.g. Use this for the intro sequence, apply color grading..."
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground min-h-[100px] resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={addToSelectionFromPreview}
                    className="flex-1 bg-success hover:bg-success/90 text-success-foreground glow-green"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    {selectedClips.some(c => c.id === previewClip.id) ? 'Update Selection' : 'Add to Selection'}
                  </Button>
                  <Button
                    onClick={() => setShowPreviewModal(false)}
                    variant="outline"
                    className="flex-1 border-border text-foreground hover:bg-secondary"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Clip Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="glass-strong border-border max-w-md" aria-describedby="add-dialog-description">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <Plus className="w-5 h-5 text-primary" />
                Add New Clip
              </DialogTitle>
              <DialogDescription id="add-dialog-description" className="text-muted-foreground">
                Add a new motion graphic clip to your collection
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-muted-foreground">Clip Title</Label>
                <Input
                  id="title"
                  value={newClipTitle}
                  onChange={(e) => setNewClipTitle(e.target.value)}
                  placeholder="e.g. Fire Wall Background"
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail" className="text-muted-foreground">Thumbnail URL (Optional)</Label>
                <Input
                  id="thumbnail"
                  value={newThumbnail}
                  onChange={(e) => setNewThumbnail(e.target.value)}
                  placeholder="https://..."
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Resolution</Label>
                  <Select value={newResolution} onValueChange={setNewResolution}>
                    <SelectTrigger className="bg-secondary border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="3840x2160">4K (3840x2160)</SelectItem>
                      <SelectItem value="1920x1080">Full HD</SelectItem>
                      <SelectItem value="2560x1440">2K</SelectItem>
                      <SelectItem value="7680x4320">8K</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-muted-foreground">Duration</Label>
                  <Input
                    id="duration"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    placeholder="0:20"
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              {newThumbnail && (
                <div className="mt-2">
                  <p className="text-muted-foreground text-sm mb-2">Preview:</p>
                  <img 
                    src={newThumbnail} 
                    alt="Preview" 
                    className="w-full rounded-lg border border-border"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={addNewClip}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={!newClipTitle}
                >
                  Add Clip
                </Button>
                <Button
                  onClick={() => setShowAddModal(false)}
                  variant="outline"
                  className="flex-1 border-border text-foreground hover:bg-secondary"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Notification */}
        {showNotification && (
          <div className="fixed top-6 right-6 bg-success text-success-foreground px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 z-50 animate-fade-in glow-green">
            <Check className="w-6 h-6" />
            <span className="font-medium">Selection sent successfully!</span>
          </div>
        )}
      </main>
    </div>
  );
};

export default MotionGraphicsLookbook;