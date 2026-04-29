import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Settings2, Search, Loader2, Pencil, Trash2, Play, Share2, Link2 } from 'lucide-react';
import { CategoryManagerDialog, type LookbookCategory } from './CategoryManagerDialog';
import { AddLookMediaDialog } from './AddLookMediaDialog';
import { ShareLookBookDialog } from './ShareLookBookDialog';
import { ManageLookBookSharesDialog } from './ManageLookBookSharesDialog';

interface LookClip {
  id: string;
  title: string;
  preview_url: string | null;
  video_url: string | null;
  thumbnail: string | null;
  category: string | null;
  category_id: string | null;
  duration: string | null;
  resolution: string | null;
  created_at: string;
}

export function LookBookView() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<LookbookCategory[]>([]);
  const [clips, setClips] = useState<LookClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showCats, setShowCats] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showManageShares, setShowManageShares] = useState(false);
  const [previewing, setPreviewing] = useState<LookClip | null>(null);
  const [editing, setEditing] = useState<LookClip | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [{ data: cats }, { data: cl }] = await Promise.all([
      supabase.from('lookbook_categories').select('*').order('sort_order', { ascending: true }),
      supabase.from('cached_clips').select('id,title,preview_url,video_url,thumbnail,category,category_id,duration,resolution,created_at').order('created_at', { ascending: false }).limit(500),
    ]);
    setCategories((cats || []) as LookbookCategory[]);
    setClips((cl || []) as LookClip[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clips.filter((c) => {
      if (activeCategory !== 'all') {
        if (activeCategory === 'uncategorized') {
          if (c.category_id) return false;
        } else if (c.category_id !== activeCategory) {
          return false;
        }
      }
      if (q && !(c.title || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [clips, activeCategory, search]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: clips.length, uncategorized: 0 };
    for (const c of clips) {
      if (!c.category_id) map.uncategorized += 1;
      else map[c.category_id] = (map[c.category_id] || 0) + 1;
    }
    return map;
  }, [clips]);

  const deleteClip = async (clip: LookClip) => {
    if (!confirm(`Delete "${clip.title}"? This removes it from the Look Book.`)) return;
    const { error } = await supabase.from('cached_clips').delete().eq('id', clip.id);
    if (error) {
      toast({ title: 'Could not delete', description: error.message, variant: 'destructive' });
      return;
    }
    setClips((prev) => prev.filter((c) => c.id !== clip.id));
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search looks…"
            className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
            style={{ fontSize: '16px' }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setShowManageShares(true)}
            className="border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-[#c49a3c]"
          >
            <Link2 className="h-4 w-4 mr-2" />
            Shares
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowShare(true)}
            className="border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-[#c49a3c]"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowCats(true)}
            className="border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-[#c49a3c]"
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Categories
          </Button>
          <Button
            onClick={() => setShowAdd(true)}
            className="bg-[#c49a3c] hover:bg-[#b38a30] text-black"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Media
          </Button>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        <CategoryPill
          label="All"
          count={counts.all || 0}
          active={activeCategory === 'all'}
          onClick={() => setActiveCategory('all')}
        />
        {categories.map((cat) => (
          <CategoryPill
            key={cat.id}
            label={cat.name}
            count={counts[cat.id] || 0}
            active={activeCategory === cat.id}
            onClick={() => setActiveCategory(cat.id)}
          />
        ))}
        {counts.uncategorized > 0 && (
          <CategoryPill
            label="Uncategorized"
            count={counts.uncategorized}
            active={activeCategory === 'uncategorized'}
            onClick={() => setActiveCategory('uncategorized')}
          />
        )}
      </div>

      {/* Gallery */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-zinc-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-zinc-800 rounded-xl text-zinc-500">
          <p className="text-sm">No looks here yet.</p>
          <Button variant="link" onClick={() => setShowAdd(true)} className="text-[#c49a3c]">
            Add the first one
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((clip) => (
            <LookCard
              key={clip.id}
              clip={clip}
              category={categories.find((c) => c.id === clip.category_id)}
              onPreview={() => setPreviewing(clip)}
              onEdit={() => setEditing(clip)}
              onDelete={() => deleteClip(clip)}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CategoryManagerDialog
        open={showCats}
        onOpenChange={setShowCats}
        onChanged={loadAll}
      />
      <AddLookMediaDialog
        open={showAdd}
        onOpenChange={(o) => { setShowAdd(o); if (!o) loadAll(); }}
        categories={categories}
        onUploaded={loadAll}
      />
      <PreviewDialog clip={previewing} onClose={() => setPreviewing(null)} />
      <EditDialog
        clip={editing}
        categories={categories}
        onClose={() => setEditing(null)}
        onSaved={loadAll}
      />
      <ShareLookBookDialog
        open={showShare}
        onOpenChange={setShowShare}
        categories={categories}
        clips={clips.map((c) => ({ id: c.id, title: c.title, thumbnail: c.thumbnail, category_id: c.category_id }))}
      />
      <ManageLookBookSharesDialog
        open={showManageShares}
        onOpenChange={setShowManageShares}
      />
    </div>
  );
}

/* ───────────────────────── pills + cards ───────────────────────── */

function CategoryPill({
  label, count, active, onClick,
}: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs uppercase tracking-wider transition-colors min-h-[44px] ${
        active
          ? 'bg-[#c49a3c] text-black'
          : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-[#c49a3c] hover:border-[#c49a3c]/40'
      }`}
      style={{ fontFamily: 'JetBrains Mono, monospace' }}
    >
      {label}
      <span className={`text-[10px] ${active ? 'text-black/70' : 'text-zinc-500'}`}>{count}</span>
    </button>
  );
}

function LookCard({
  clip, category, onPreview, onEdit, onDelete,
}: {
  clip: LookClip;
  category?: LookbookCategory;
  onPreview: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (hovering) {
      v.currentTime = 0;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [hovering]);

  return (
    <div
      className="group relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-[#c49a3c]/40 transition-colors"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={onPreview}
      role="button"
      style={{ touchAction: 'manipulation' }}
    >
      <div className="aspect-video bg-black relative">
        {clip.preview_url ? (
          <video
            ref={videoRef}
            src={clip.preview_url}
            poster={clip.thumbnail || undefined}
            muted
            playsInline
            loop
            preload="metadata"
            className="w-full h-full object-cover"
          />
        ) : clip.thumbnail ? (
          <img src={clip.thumbnail} alt={clip.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            <Play className="h-8 w-8" />
          </div>
        )}

        {/* meta overlay */}
        <div className="absolute top-2 left-2 flex gap-1">
          {clip.resolution && (
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-black/60 text-zinc-200 backdrop-blur-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {clip.resolution}
            </span>
          )}
          {clip.duration && (
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-black/60 text-zinc-200 backdrop-blur-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {clip.duration}
            </span>
          )}
        </div>

        {/* admin actions */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 bg-black/60 text-zinc-100 hover:bg-black/80 hover:text-[#c49a3c]"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 bg-black/60 text-zinc-100 hover:bg-black/80 hover:text-red-400"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="p-3 flex items-center justify-between gap-2">
        <p className="text-sm text-zinc-100 truncate">{clip.title || 'Untitled'}</p>
        {category ? (
          <span className="shrink-0 text-[10px] uppercase tracking-wider text-[#c49a3c]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {category.name}
          </span>
        ) : (
          <span className="shrink-0 text-[10px] uppercase tracking-wider text-zinc-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            Uncat.
          </span>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── dialogs ───────────────────────── */

function PreviewDialog({ clip, onClose }: { clip: LookClip | null; onClose: () => void }) {
  return (
    <Dialog open={!!clip} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl bg-black border-zinc-800 p-0">
        {clip && (
          <div className="relative">
            <video
              src={clip.preview_url || undefined}
              poster={clip.thumbnail || undefined}
              controls
              autoPlay
              playsInline
              className="w-full max-h-[80vh] bg-black"
            />
            <div className="p-4 text-zinc-100">
              <h3 className="text-lg" style={{ fontFamily: 'DM Serif Display, serif' }}>{clip.title}</h3>
              <p className="text-xs text-zinc-500 mt-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {clip.resolution} {clip.duration ? `· ${clip.duration}` : ''}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({
  clip, categories, onClose, onSaved,
}: {
  clip: LookClip | null;
  categories: LookbookCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<string>('none');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (clip) {
      setTitle(clip.title || '');
      setCategoryId(clip.category_id || 'none');
    }
  }, [clip]);

  const save = async () => {
    if (!clip) return;
    setSaving(true);
    const cat = categories.find((c) => c.id === categoryId);
    const { error } = await supabase
      .from('cached_clips')
      .update({
        title: title.trim() || 'Untitled',
        category_id: categoryId === 'none' ? null : categoryId,
        category: cat?.slug ?? clip.category ?? null,
      } as any)
      .eq('id', clip.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
      return;
    }
    onSaved();
    onClose();
  };

  return (
    <Dialog open={!!clip} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-[#c49a3c]" style={{ fontFamily: 'DM Serif Display, serif' }}>
            Edit Look
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-zinc-400">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-zinc-100"
              style={{ fontSize: '16px' }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-zinc-400">Category</label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                <SelectItem value="none">Uncategorized</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose} className="text-zinc-300">Cancel</Button>
            <Button onClick={save} disabled={saving} className="bg-[#c49a3c] hover:bg-[#b38a30] text-black">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
