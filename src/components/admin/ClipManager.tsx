import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { artlistCategories } from '@/lib/api/artlist';
import { Loader2, Search, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableClipCard } from './SortableClipCard';
import { ClipEditModal } from './ClipEditModal';

interface Clip {
  id: string;
  title: string;
  category: string;
  resolution: string;
  duration: string;
  created_at: string;
  video_url: string | null;
  source_url: string | null;
  thumbnail: string | null;
  sort_order?: number;
}

export function ClipManager({ onClipsUpdated }: { onClipsUpdated?: () => void }) {
  const { toast } = useToast();
  const [clips, setClips] = useState<Clip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Edit modal state
  const [editingClip, setEditingClip] = useState<Clip | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    video_url: '',
    source_url: '',
    thumbnail: '',
    resolution: '',
    duration: '',
    category: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isCapturingFrame, setIsCapturingFrame] = useState(false);

  // Touch-optimized sensors with better activation constraints
  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 8,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchClips = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('cached_clips')
        .select('id, title, category, resolution, duration, created_at, video_url, source_url, thumbnail, sort_order')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (selectedCategory && selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      setClips(data || []);
    } catch (error) {
      console.error('Error fetching clips:', error);
      toast({
        title: 'Error',
        description: 'Failed to load clips',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClips();
  }, [selectedCategory, searchQuery]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = clips.findIndex((c) => c.id === active.id);
    const newIndex = clips.findIndex((c) => c.id === over.id);

    const reorderedClips = arrayMove(clips, oldIndex, newIndex);
    setClips(reorderedClips);

    // Update sort_order in database
    try {
      const updates = reorderedClips.map((clip, index) => ({
        id: clip.id,
        sort_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from('cached_clips')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }

      toast({ title: 'Order saved' });
      onClipsUpdated?.();
    } catch (error) {
      console.error('Error saving order:', error);
      toast({
        title: 'Error',
        description: 'Failed to save order',
        variant: 'destructive',
      });
      fetchClips(); // Revert to original order
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from('cached_clips').delete().eq('id', id);

      if (error) throw error;

      setClips((prev) => prev.filter((c) => c.id !== id));
      toast({ title: 'Clip deleted' });
      onClipsUpdated?.();
    } catch (error) {
      console.error('Error deleting clip:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete clip',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const openEditModal = (clip: Clip) => {
    setEditingClip(clip);
    setEditForm({
      title: clip.title,
      video_url: clip.video_url || '',
      source_url: clip.source_url || '',
      thumbnail: clip.thumbnail || '',
      resolution: clip.resolution || '',
      duration: clip.duration || '',
      category: clip.category,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingClip) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('cached_clips')
        .update({
          title: editForm.title,
          video_url: editForm.video_url || null,
          source_url: editForm.source_url || null,
          thumbnail: editForm.thumbnail || null,
          resolution: editForm.resolution,
          duration: editForm.duration,
          category: editForm.category,
        })
        .eq('id', editingClip.id);

      if (error) throw error;

      // Update local state
      setClips((prev) =>
        prev.map((c) =>
          c.id === editingClip.id
            ? {
                ...c,
                ...editForm,
                video_url: editForm.video_url || null,
                source_url: editForm.source_url || null,
                thumbnail: editForm.thumbnail || null,
              }
            : c
        )
      );

      toast({ title: 'Clip updated' });
      setEditingClip(null);
      onClipsUpdated?.();
    } catch (error) {
      console.error('Error updating clip:', error);
      toast({
        title: 'Error',
        description: 'Failed to update clip',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryLabel = (key: string) => {
    return artlistCategories.find((c) => c.key === key)?.label || key;
  };

  const getCategoryColor = (key: string) => {
    return artlistCategories.find((c) => c.key === key)?.color || '#888888';
  };

  const handleFrameCaptured = async (blob: Blob) => {
    if (!editingClip) return;

    setIsCapturingFrame(true);
    try {
      // Upload thumbnail to storage
      const timestamp = Date.now();
      const thumbPath = `${timestamp}-thumb-${editingClip.id}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('clip-previews')
        .upload(thumbPath, blob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('clip-previews').getPublicUrl(thumbPath);

      // Update the database directly with the new thumbnail
      const { error: updateError } = await supabase
        .from('cached_clips')
        .update({ thumbnail: publicUrl })
        .eq('id', editingClip.id);

      if (updateError) throw updateError;

      // Update local form state
      setEditForm((prev) => ({ ...prev, thumbnail: publicUrl }));

      // Update clips list
      setClips((prev) =>
        prev.map((c) => (c.id === editingClip.id ? { ...c, thumbnail: publicUrl } : c))
      );

      toast({ title: 'Thumbnail saved' });
      onClipsUpdated?.();
    } catch (error) {
      console.error('Error capturing frame:', error);
      toast({
        title: 'Error',
        description: 'Failed to save thumbnail',
        variant: 'destructive',
      });
    } finally {
      setIsCapturingFrame(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and filter controls - stacked on mobile */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clips..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[180px] h-11">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {artlistCategories.map((cat) => (
              <SelectItem key={cat.key} value={cat.key}>
                <span className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Drag hint for touch devices */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
        <GripVertical className="h-3.5 w-3.5" />
        <span>Hold and drag to reorder clips</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : clips.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No clips found</div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={clips.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {clips.map((clip) => (
                <SortableClipCard
                  key={clip.id}
                  clip={clip}
                  getCategoryLabel={getCategoryLabel}
                  getCategoryColor={getCategoryColor}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  deletingId={deletingId}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <p className="text-xs text-muted-foreground text-center pt-2">
        Showing {clips.length} clips
      </p>

      {/* Edit Modal */}
      <ClipEditModal
        clip={editingClip}
        editForm={editForm}
        setEditForm={setEditForm}
        onClose={() => setEditingClip(null)}
        onSave={handleSaveEdit}
        onFrameCaptured={handleFrameCaptured}
        isSaving={isSaving}
        isCapturingFrame={isCapturingFrame}
      />
    </div>
  );
}
