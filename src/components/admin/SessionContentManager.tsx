import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Trash2, Upload, Loader2, GripVertical, Image, Film, FileText, Pencil, Check, X, Plus, Layers } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ContentItem {
  id: string;
  item_type: string;
  title: string | null;
  description: string | null;
  file_url: string | null;
  thumbnail_url: string | null;
  url: string | null;
  sort_order: number | null;
  scene_id: string | null;
}

interface Scene {
  id: string;
  title: string;
  description: string | null;
  sort_order: number | null;
}

interface SessionContentManagerProps {
  sessionId: string;
}

function SortableContentRow({ item, onDelete, deleting, onEdit, scenes }: {
  item: ContentItem;
  onDelete: (id: string) => void;
  deleting: string | null;
  onEdit: (item: ContentItem) => void;
  scenes: Scene[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const typeIcon = item.item_type === 'video' ? <Film className="w-4 h-4 text-muted-foreground" /> :
    item.item_type === 'pdf' ? <FileText className="w-4 h-4 text-muted-foreground" /> :
    <Image className="w-4 h-4 text-muted-foreground" />;

  const thumbSrc = item.thumbnail_url || item.file_url || item.url;
  const scene = scenes.find(s => s.id === item.scene_id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30 border border-border/50 group"
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-manipulation p-1">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </button>

      {thumbSrc && /\.(jpg|jpeg|png|gif|webp|svg)/i.test(thumbSrc) ? (
        <img src={thumbSrc} alt="" className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
      ) : thumbSrc && item.item_type === 'video' ? (
        <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
          <Film className="w-5 h-5 text-muted-foreground" />
        </div>
      ) : (
        <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
          {typeIcon}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.title || 'Untitled'}</p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground capitalize">{item.item_type}</p>
          {scene && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
              {scene.title}
            </span>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation"
        onClick={() => onEdit(item)}
      >
        <Pencil className="w-3.5 h-3.5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation"
        onClick={() => onDelete(item.id)}
        disabled={deleting === item.id}
      >
        {deleting === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      </Button>
    </div>
  );
}

export function SessionContentManager({ sessionId }: SessionContentManagerProps) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSceneId, setEditSceneId] = useState<string | null>(null);
  const [showSceneForm, setShowSceneForm] = useState(false);
  const [newSceneTitle, setNewSceneTitle] = useState('');
  const [savingItem, setSavingItem] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchItems();
    fetchScenes();
  }, [sessionId]);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('mood_board_items')
      .select('id, item_type, title, description, file_url, thumbnail_url, url, sort_order, scene_id')
      .eq('session_id', sessionId)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });

    if (error) {
      toast.error('Failed to load content');
    } else {
      setItems((data as ContentItem[]) || []);
    }
    setLoading(false);
  };

  const fetchScenes = async () => {
    const { data } = await supabase
      .from('session_scenes')
      .select('*')
      .eq('session_id', sessionId)
      .order('sort_order', { ascending: true });
    setScenes((data as Scene[]) || []);
  };

  const startEdit = (item: ContentItem) => {
    setEditingItem(item);
    setEditTitle(item.title || '');
    setEditDescription(item.description || '');
    setEditSceneId(item.scene_id);
  };

  const saveEdit = async () => {
    if (!editingItem) return;
    setSavingItem(true);
    const { error } = await supabase.from('mood_board_items').update({
      title: editTitle.trim() || null,
      description: editDescription.trim() || null,
      scene_id: editSceneId,
    }).eq('id', editingItem.id);

    if (error) {
      toast.error('Failed to update');
    } else {
      toast.success('Item updated');
      setEditingItem(null);
      fetchItems();
    }
    setSavingItem(false);
  };

  const addScene = async () => {
    if (!newSceneTitle.trim()) return;
    const { error } = await supabase.from('session_scenes').insert({
      session_id: sessionId,
      title: newSceneTitle.trim(),
      sort_order: scenes.length,
    });
    if (error) {
      toast.error('Failed to create scene');
    } else {
      toast.success('Scene added');
      setNewSceneTitle('');
      setShowSceneForm(false);
      fetchScenes();
    }
  };

  const deleteScene = async (id: string) => {
    if (!confirm('Delete this scene? Items will be unassigned, not deleted.')) return;
    await supabase.from('session_scenes').delete().eq('id', id);
    fetchScenes();
    fetchItems();
    toast.success('Scene deleted');
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from('mood_board_items').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete item');
    } else {
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success('Item removed');
    }
    setDeleting(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    const updates = reordered.map((item, idx) =>
      supabase.from('mood_board_items').update({ sort_order: idx }).eq('id', item.id)
    );
    await Promise.all(updates);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const baseName = `${sessionId}/${Date.now()}-${Math.random().toString(36).substring(2)}`;
      const fileName = `${baseName}.${fileExt}`;

      let itemType: 'image' | 'video' | 'pdf' = 'image';
      if (file.type.startsWith('video/')) itemType = 'video';
      else if (file.type === 'application/pdf') itemType = 'pdf';

      const { error: uploadError } = await supabase.storage
        .from('creative-uploads')
        .upload(fileName, file);

      if (uploadError) {
        toast.error(`Failed to upload ${file.name}`);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('creative-uploads')
        .getPublicUrl(fileName);

      const nextOrder = items.length;

      const { error: insertError } = await supabase.from('mood_board_items').insert({
        session_id: sessionId,
        item_type: itemType,
        file_url: urlData.publicUrl,
        title: file.name,
        added_by: 'Admin',
        sort_order: nextOrder,
      });

      if (insertError) {
        toast.error(`Failed to save ${file.name}`);
      }
    }

    toast.success(`${files.length} file(s) uploaded`);
    await fetchItems();
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Scenes Manager */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" /> Scenes / Looks
          </h4>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setShowSceneForm(!showSceneForm)}
          >
            <Plus className="w-3 h-3" /> Add Scene
          </Button>
        </div>

        {showSceneForm && (
          <div className="flex gap-2">
            <Input
              value={newSceneTitle}
              onChange={e => setNewSceneTitle(e.target.value)}
              placeholder="Scene name (e.g. Opening, Main Stage, VIP)"
              className="h-9 text-sm"
              onKeyDown={e => e.key === 'Enter' && addScene()}
            />
            <Button size="sm" className="h-9" onClick={addScene}>
              <Check className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-9" onClick={() => { setShowSceneForm(false); setNewSceneTitle(''); }}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}

        {scenes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {scenes.map(scene => (
              <div key={scene.id} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium group">
                {scene.title}
                <button
                  onClick={() => deleteScene(scene.id)}
                  className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity touch-manipulation"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Item Panel */}
      {editingItem && (
        <div className="bg-secondary/50 border border-border rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-semibold">Edit Item</h4>
          <div>
            <label className="text-xs text-muted-foreground">Title</label>
            <Input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="mt-1 h-9 text-sm"
              placeholder="Enter title..."
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Description</label>
            <Textarea
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              className="mt-1 text-sm min-h-[60px] resize-none"
              placeholder="Add a description..."
              rows={2}
            />
          </div>
          {scenes.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground">Scene / Look</label>
              <Select value={editSceneId || 'none'} onValueChange={v => setEditSceneId(v === 'none' ? null : v)}>
                <SelectTrigger className="mt-1 h-9 text-sm">
                  <SelectValue placeholder="No scene" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No scene</SelectItem>
                  {scenes.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={saveEdit} disabled={savingItem} className="gap-1">
              {savingItem ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Upload button */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {uploading ? 'Uploading...' : 'Add Files'}
        </Button>
        <span className="text-xs text-muted-foreground">{items.length} item{items.length !== 1 ? 's' : ''}</span>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* Content list */}
      {items.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">
          No content yet. Upload files to get started.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
              {items.map(item => (
                <SortableContentRow
                  key={item.id}
                  item={item}
                  onDelete={handleDelete}
                  deleting={deleting}
                  onEdit={startEdit}
                  scenes={scenes}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
