import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Pencil, Check, X, Library, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LineItemTemplate {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category: string | null;
  created_at: string;
}

interface LineItemLibraryProps {
  /** If provided, renders in "picker" mode with an onSelect callback */
  onSelect?: (item: LineItemTemplate) => void;
  /** Compact mode hides CRUD, shows only search + pick */
  compact?: boolean;
}

export default function LineItemLibrary({ onSelect, compact }: LineItemLibraryProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<LineItemTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('line_item_templates')
      .select('*')
      .order('category', { ascending: true })
      .order('title', { ascending: true });
    setTemplates((data as LineItemTemplate[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setCategory('');
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    try {
      if (editingId) {
        const { error } = await supabase.from('line_item_templates').update({
          title: title.trim(),
          description: description.trim() || null,
          price: parseFloat(price) || 0,
          category: category.trim() || null,
        }).eq('id', editingId);
        if (error) throw error;
        toast({ title: 'Template updated' });
      } else {
        const { error } = await supabase.from('line_item_templates').insert({
          title: title.trim(),
          description: description.trim() || null,
          price: parseFloat(price) || 0,
          category: category.trim() || null,
        });
        if (error) throw error;
        toast({ title: 'Template saved' });
      }
      resetForm();
      fetch();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    await supabase.from('line_item_templates').delete().eq('id', id);
    fetch();
    toast({ title: 'Template deleted' });
  };

  const startEdit = (t: LineItemTemplate) => {
    setTitle(t.title);
    setDescription(t.description || '');
    setPrice(String(t.price));
    setCategory(t.category || '');
    setEditingId(t.id);
    setShowForm(true);
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

  const filtered = templates.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    (t.category || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(templates.map(t => t.category).filter(Boolean))] as string[];

  return (
    <div className={compact ? '' : 'space-y-4'}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input
          placeholder="Search templates..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={compact
            ? 'pl-9 bg-zinc-800 border-zinc-700 text-white text-sm'
            : 'pl-9 bg-zinc-800 border-zinc-700 text-white'
          }
        />
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {categories.map(cat => (
            <Badge
              key={cat}
              variant="outline"
              className="text-[10px] border-zinc-700 text-zinc-400 cursor-pointer hover:bg-zinc-800 hover:text-white"
              onClick={() => setSearch(search === cat ? '' : cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      )}

      {/* Add / Edit form */}
      {!compact && (
        <>
          {!showForm ? (
            <Button onClick={() => setShowForm(true)} variant="ghost" size="sm" className="text-zinc-400 hover:text-white gap-1">
              <Plus className="w-3 h-3" /> Add Template
            </Button>
          ) : (
            <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700 space-y-2">
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Input placeholder="Title *" value={title} onChange={e => setTitle(e.target.value)} className="bg-zinc-800 border-zinc-700 text-white text-sm" />
                <Input placeholder="Price" type="number" value={price} onChange={e => setPrice(e.target.value)} className="bg-zinc-800 border-zinc-700 text-white text-sm w-28" />
              </div>
              <Input placeholder="Category (e.g. Production, Equipment)" value={category} onChange={e => setCategory(e.target.value)} className="bg-zinc-800 border-zinc-700 text-white text-sm" />
              <Textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="bg-zinc-800 border-zinc-700 text-white text-sm min-h-[36px] resize-none" rows={2} />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} className="bg-white text-black hover:bg-zinc-200 gap-1">
                  <Check className="w-3 h-3" /> {editingId ? 'Update' : 'Save'}
                </Button>
                <Button size="sm" variant="ghost" onClick={resetForm} className="text-zinc-400">
                  <X className="w-3 h-3 mr-1" /> Cancel
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* List */}
      <div className={`space-y-1 ${compact ? 'mt-2 max-h-60 overflow-y-auto' : 'mt-3'}`}>
        {loading ? (
          <p className="text-zinc-500 text-sm py-4 text-center">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-zinc-500 text-sm py-4 text-center">
            {search ? 'No templates match your search' : 'No templates yet'}
          </p>
        ) : (
          filtered.map(t => (
            <div
              key={t.id}
              className={`rounded-lg p-3 border transition-colors touch-manipulation active:scale-[0.98] ${
                onSelect
                  ? 'border-zinc-700 hover:border-zinc-500 cursor-pointer bg-zinc-800/40 hover:bg-zinc-800'
                  : 'border-zinc-800 bg-zinc-900/60'
              }`}
              onClick={() => onSelect?.(t)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {t.category && (
                    <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500 mb-1">
                      {t.category}
                    </Badge>
                  )}
                  <p className="text-white text-sm font-medium leading-snug">{t.title}</p>
                  {t.description && (
                    <p className="text-zinc-500 text-xs mt-0.5 line-clamp-2">{t.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
                  <span className="text-zinc-300 text-sm font-semibold">{formatCurrency(t.price)}</span>
                  {!compact && !onSelect && (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => startEdit(t)} className="text-zinc-500 hover:text-white h-8 w-8">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} className="text-zinc-500 hover:text-red-400 h-8 w-8">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
