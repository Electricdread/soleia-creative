import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Check, X, Pencil } from 'lucide-react';

export interface LookbookCategory {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `cat-${Date.now()}`;

export function CategoryManagerDialog({ open, onOpenChange, onChanged }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<LookbookCategory[]>([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lookbook_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    setLoading(false);
    if (error) {
      toast({ title: 'Failed to load categories', description: error.message, variant: 'destructive' });
      return;
    }
    setItems((data || []) as LookbookCategory[]);
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const addCategory = async () => {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    const nextOrder = (items[items.length - 1]?.sort_order ?? 0) + 10;
    const { error } = await supabase
      .from('lookbook_categories')
      .insert({ name, slug: slugify(name), sort_order: nextOrder });
    setBusy(false);
    if (error) {
      toast({ title: 'Could not add category', description: error.message, variant: 'destructive' });
      return;
    }
    setNewName('');
    await load();
    onChanged?.();
  };

  const saveRename = async (id: string) => {
    const name = editingName.trim();
    if (!name) return;
    setBusy(true);
    const { error } = await supabase
      .from('lookbook_categories')
      .update({ name, slug: slugify(name) })
      .eq('id', id);
    setBusy(false);
    if (error) {
      toast({ title: 'Could not rename', description: error.message, variant: 'destructive' });
      return;
    }
    setEditingId(null);
    setEditingName('');
    await load();
    onChanged?.();
  };

  const removeCategory = async (id: string) => {
    if (!confirm('Delete this category? Clips assigned to it will become uncategorized.')) return;
    setBusy(true);
    const { error } = await supabase.from('lookbook_categories').delete().eq('id', id);
    setBusy(false);
    if (error) {
      toast({ title: 'Could not delete', description: error.message, variant: 'destructive' });
      return;
    }
    await load();
    onChanged?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-[#c49a3c]" style={{ fontFamily: 'DM Serif Display, serif' }}>
            Manage Categories
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Categories organize the Look Book. Deleting one keeps the clips but unassigns them.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New category name"
            className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
            onKeyDown={(e) => e.key === 'Enter' && addCategory()}
            style={{ fontSize: '16px' }}
          />
          <Button
            onClick={addCategory}
            disabled={busy || !newName.trim()}
            className="bg-[#c49a3c] hover:bg-[#b38a30] text-black"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="max-h-80 overflow-y-auto space-y-2 pt-2">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-sm text-zinc-500 py-6">No categories yet.</p>
          ) : (
            items.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-zinc-900/60 border border-zinc-800"
              >
                {editingId === cat.id ? (
                  <>
                    <Input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="bg-zinc-950 border-zinc-700 text-zinc-100 h-8"
                      style={{ fontSize: '16px' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRename(cat.id);
                        if (e.key === 'Escape') { setEditingId(null); setEditingName(''); }
                      }}
                    />
                    <Button size="icon" variant="ghost" onClick={() => saveRename(cat.id)} className="h-8 w-8 text-emerald-400">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => { setEditingId(null); setEditingName(''); }} className="h-8 w-8 text-zinc-400">
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-zinc-100">{cat.name}</span>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">{cat.slug}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => { setEditingId(cat.id); setEditingName(cat.name); }}
                      className="h-8 w-8 text-zinc-400 hover:text-[#c49a3c]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeCategory(cat.id)}
                      className="h-8 w-8 text-zinc-400 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
