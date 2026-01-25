import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { artlistCategories } from '@/lib/api/artlist';
import { Trash2, Loader2, Search, Pencil, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

interface SortableRowProps {
  clip: Clip;
  getCategoryLabel: (key: string) => string;
  onEdit: (clip: Clip) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}

function SortableRow({ clip, getCategoryLabel, onEdit, onDelete, deletingId }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: clip.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : undefined,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-border transition-colors hover:bg-muted/50 ${isDragging ? 'bg-muted' : ''}`}
    >
      <td className="p-3 w-10">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="p-3 font-medium max-w-[200px] truncate">
        {clip.title}
      </td>
      <td className="p-3">{getCategoryLabel(clip.category)}</td>
      <td className="p-3">{clip.resolution}</td>
      <td className="p-3">{clip.duration}</td>
      <td className="p-3">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(clip)}
            className="h-8 w-8"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(clip.id)}
            disabled={deletingId === clip.id}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            {deletingId === clip.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </td>
    </tr>
  );
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

  const sensors = useSensors(
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

    const oldIndex = clips.findIndex(c => c.id === active.id);
    const newIndex = clips.findIndex(c => c.id === over.id);

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
      const { error } = await supabase
        .from('cached_clips')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setClips(prev => prev.filter(c => c.id !== id));
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
      setClips(prev => prev.map(c => 
        c.id === editingClip.id 
          ? { ...c, ...editForm, video_url: editForm.video_url || null, source_url: editForm.source_url || null, thumbnail: editForm.thumbnail || null }
          : c
      ));
      
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
    return artlistCategories.find(c => c.key === key)?.label || key;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clips..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {artlistCategories.map((cat) => (
              <SelectItem key={cat.key} value={cat.key}>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : clips.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No clips found
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="border-b border-border">
                  <th className="p-3 text-left text-sm font-medium w-10"></th>
                  <th className="p-3 text-left text-sm font-medium">Title</th>
                  <th className="p-3 text-left text-sm font-medium">Category</th>
                  <th className="p-3 text-left text-sm font-medium">Resolution</th>
                  <th className="p-3 text-left text-sm font-medium">Duration</th>
                  <th className="p-3 text-left text-sm font-medium w-[100px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                <SortableContext
                  items={clips.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {clips.map((clip) => (
                    <SortableRow
                      key={clip.id}
                      clip={clip}
                      getCategoryLabel={getCategoryLabel}
                      onEdit={openEditModal}
                      onDelete={handleDelete}
                      deletingId={deletingId}
                    />
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </DndContext>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Showing {clips.length} clips • Drag to reorder
      </p>

      {/* Edit Modal */}
      <Dialog open={!!editingClip} onOpenChange={(open) => !open && setEditingClip(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Clip</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-video-url">Video URL</Label>
              <Input
                id="edit-video-url"
                value={editForm.video_url}
                onChange={(e) => setEditForm(prev => ({ ...prev, video_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-source-url">Source URL</Label>
              <Input
                id="edit-source-url"
                value={editForm.source_url}
                onChange={(e) => setEditForm(prev => ({ ...prev, source_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-thumbnail">Thumbnail URL</Label>
              <Input
                id="edit-thumbnail"
                value={editForm.thumbnail}
                onChange={(e) => setEditForm(prev => ({ ...prev, thumbnail: e.target.value }))}
                placeholder="https://..."
              />
              {editForm.thumbnail && (
                <img 
                  src={editForm.thumbnail} 
                  alt="Thumbnail preview" 
                  className="w-full max-w-[200px] rounded border border-border mt-2"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-resolution">Resolution</Label>
                <Input
                  id="edit-resolution"
                  value={editForm.resolution}
                  onChange={(e) => setEditForm(prev => ({ ...prev, resolution: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Duration</Label>
                <Input
                  id="edit-duration"
                  value={editForm.duration}
                  onChange={(e) => setEditForm(prev => ({ ...prev, duration: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select 
                value={editForm.category} 
                onValueChange={(value) => setEditForm(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {artlistCategories.map((cat) => (
                    <SelectItem key={cat.key} value={cat.key}>
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingClip(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
