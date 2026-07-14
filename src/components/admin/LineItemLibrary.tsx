import { useEffect, useState } from 'react';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Pencil, Check, X, Search, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LineItemTemplate {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category: string | null;
  long_description: string | null;
  deliverables: string[] | null;
  ideal_for: string | null;
  sort_order: number | null;
  created_at: string;
}

interface CategoryIntro {
  name: string;
  intro: string | null;
  sort_order: number | null;
}

interface LineItemLibraryProps {
  onSelect?: (item: LineItemTemplate) => void;
  compact?: boolean;
}

export default function LineItemLibrary({ onSelect, compact }: LineItemLibraryProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<LineItemTemplate[]>([]);
  const [intros, setIntros] = useState<CategoryIntro[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showIntros, setShowIntros] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [idealFor, setIdealFor] = useState('');
  const [deliverablesText, setDeliverablesText] = useState('');
  const [sortOrder, setSortOrder] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    const [tplRes, catRes] = await Promise.all([
      supabase
        .from('line_item_templates')
        .select('*')
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('title', { ascending: true }),
      supabase.from('line_item_categories').select('*').order('sort_order', { ascending: true, nullsFirst: false }),
    ]);
    setTemplates((tplRes.data as LineItemTemplate[]) || []);
    setIntros((catRes.data as CategoryIntro[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setCategory('');
    setLongDescription('');
    setIdealFor('');
    setDeliverablesText('');
    setSortOrder('');
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      price: parseFloat(price) || 0,
      category: category.trim() || null,
      long_description: longDescription.trim() || null,
      ideal_for: idealFor.trim() || null,
      deliverables: deliverablesText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean),
      sort_order: sortOrder.trim() === '' ? null : parseInt(sortOrder, 10) || null,
    };
    try {
      if (editingId) {
        const { error } = await supabase.from('line_item_templates').update(payload).eq('id', editingId);
        if (error) throw error;
        toast({ title: 'Template updated' });
      } else {
        const { error } = await supabase.from('line_item_templates').insert(payload);
        if (error) throw error;
        toast({ title: 'Template saved' });
      }
      resetForm();
      fetchAll();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('line_item_templates').delete().eq('id', id);
    fetchAll();
    toast({ title: 'Template deleted' });
  };

  const startEdit = (t: LineItemTemplate) => {
    setTitle(t.title);
    setDescription(t.description || '');
    setPrice(String(t.price));
    setCategory(t.category || '');
    setLongDescription(t.long_description || '');
    setIdealFor(t.ideal_for || '');
    setDeliverablesText((t.deliverables || []).join('\n'));
    setSortOrder(t.sort_order != null ? String(t.sort_order) : '');
    setEditingId(t.id);
    setShowForm(true);
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

  const filtered = templates.filter(
    t =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(templates.map(t => t.category).filter(Boolean))] as string[];

  // Category intros editor state
  const introMap = new Map(intros.map(i => [i.name, i]));
  const [introDrafts, setIntroDrafts] = useState<Record<string, { intro: string; sort_order: string }>>({});

  useEffect(() => {
    const next: Record<string, { intro: string; sort_order: string }> = {};
    for (const cat of categories) {
      const existing = introMap.get(cat);
      next[cat] = {
        intro: existing?.intro || '',
        sort_order: existing?.sort_order != null ? String(existing.sort_order) : '',
      };
    }
    setIntroDrafts(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates, intros]);

  const saveIntro = async (name: string) => {
    const draft = introDrafts[name];
    if (!draft) return;
    const { error } = await supabase.from('line_item_categories').upsert(
      {
        name,
        intro: draft.intro.trim() || null,
        sort_order: draft.sort_order.trim() === '' ? null : parseInt(draft.sort_order, 10),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'name' }
    );
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: `Saved intro for ${name}` });
    fetchAll();
  };

  return (
    <div className={compact ? '' : 'space-y-4'}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input
          placeholder="Search templates..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={
            compact
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
          <div className="flex items-center gap-2 flex-wrap">
            {!showForm && (
              <Button
                onClick={() => setShowForm(true)}
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white gap-1"
              >
                <Plus className="w-3 h-3" /> Add Template
              </Button>
            )}
            <Button
              onClick={() => setShowIntros(v => !v)}
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-white gap-1"
            >
              <BookOpen className="w-3 h-3" />
              {showIntros ? 'Hide' : 'Edit'} Category Intros
            </Button>
          </div>

          {showForm && (
            <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700 space-y-2">
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Input
                  placeholder="Title *"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white text-sm"
                />
                <Input
                  placeholder="Price"
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white text-sm w-28"
                />
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Input
                  placeholder="Category (e.g. Production, Equipment)"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white text-sm"
                />
                <Input
                  placeholder="Order"
                  type="number"
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white text-sm w-20"
                />
              </div>
              <Textarea
                placeholder="Short description (line-item summary)"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white text-sm min-h-[36px] resize-none"
                rows={2}
              />
              <Input
                placeholder="Best for… (e.g. brand launches, cinematic hero pieces)"
                value={idealFor}
                onChange={e => setIdealFor(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white text-sm"
              />
              <Textarea
                placeholder="Long editorial description (renders in the Services guide)"
                value={longDescription}
                onChange={e => setLongDescription(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white text-sm min-h-[80px]"
                rows={4}
              />
              <Textarea
                placeholder={"What's included — one deliverable per line"}
                value={deliverablesText}
                onChange={e => setDeliverablesText(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white text-sm min-h-[80px]"
                rows={4}
              />
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

          {showIntros && (
            <div className="bg-zinc-800/40 rounded-lg p-4 border border-zinc-700 space-y-4">
              <p className="text-zinc-400 text-xs">
                These paragraphs open each chapter in the editorial Services guide.
              </p>
              {categories.length === 0 && (
                <p className="text-zinc-500 text-sm">Add templates with categories first.</p>
              )}
              {categories.map(cat => {
                const draft = introDrafts[cat] || { intro: '', sort_order: '' };
                return (
                  <div key={cat} className="space-y-2 border-b border-zinc-700 pb-4 last:border-b-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-white text-sm font-medium">{cat}</p>
                      <Input
                        placeholder="Order"
                        type="number"
                        value={draft.sort_order}
                        onChange={e =>
                          setIntroDrafts(d => ({ ...d, [cat]: { ...draft, sort_order: e.target.value } }))
                        }
                        className="bg-zinc-800 border-zinc-700 text-white text-sm w-20"
                      />
                    </div>
                    <Textarea
                      placeholder={`Intro paragraph for ${cat}`}
                      value={draft.intro}
                      onChange={e => setIntroDrafts(d => ({ ...d, [cat]: { ...draft, intro: e.target.value } }))}
                      className="bg-zinc-800 border-zinc-700 text-white text-sm min-h-[70px]"
                      rows={3}
                    />
                    <Button
                      size="sm"
                      onClick={() => saveIntro(cat)}
                      className="bg-white text-black hover:bg-zinc-200 gap-1"
                    >
                      <Check className="w-3 h-3" /> Save intro
                    </Button>
                  </div>
                );
              })}
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
                  {!compact && (t.long_description || (t.deliverables && t.deliverables.length > 0)) && (
                    <p className="text-[10px] text-[#c49a3c]/80 mt-1 uppercase tracking-wide">
                      Editorial ready
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
                  <span className="text-zinc-300 text-sm font-semibold">{formatCurrency(t.price)}</span>
                  {!compact && !onSelect && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(t)}
                        className="text-zinc-500 hover:text-white h-8 w-8"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <DeleteConfirmDialog
                        trigger={
                          <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-red-400 h-8 w-8">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        }
                        title="Delete Template?"
                        description={`This will permanently delete "${t.title}". This action cannot be undone.`}
                        onConfirm={() => handleDelete(t.id)}
                      />
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
