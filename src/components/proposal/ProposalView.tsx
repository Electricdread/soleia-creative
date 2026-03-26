import { useState, useMemo, useEffect, type MouseEvent } from 'react';
import { format, addDays } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Pencil, Check, X, Plus, Trash2, Library, Printer } from 'lucide-react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import LineItemLibrary from '@/components/admin/LineItemLibrary';
import soleiaLogo from '@/assets/soleia-wide-logo.png';
import ProposalGallery from './ProposalGallery';
import ProposalTimeline from './ProposalTimeline';
import ProposalTerms from './ProposalTerms';
import ProposalApprovedClips from './ProposalApprovedClips';

interface ProposalViewProps {
  proposal: any;
  items: any[];
  gallery: any[];
  timeline: any[];
  isAdmin?: boolean;
  onRefresh?: () => void;
}

export default function ProposalView({ proposal, items, gallery, timeline, isAdmin, onRefresh }: ProposalViewProps) {
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [clientName, setClientName] = useState('');
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(!!proposal.signed_at);

  // Admin editing states
  const [editingHeader, setEditingHeader] = useState(false);
  const [editFields, setEditFields] = useState({
    event_name: proposal.event_name,
    client_name: proposal.client_name,
    venue_name: proposal.venue_name || '',
    event_date: proposal.event_date || '',
    validity_days: String(proposal.validity_days || 7),
    contact_email: proposal.contact_email || 'luisdreamslv@gmail.com',
    session_id: proposal.session_id || '',
  });
  const [editingItems, setEditingItems] = useState(false);
  const [editItems, setEditItems] = useState(items.map(i => ({ ...i, price: String(i.price), quantity: String(i.quantity || 1), category: i.category || '', unit: i.unit || '', is_flat_fee: !!i.is_flat_fee })));
  const [showLibraryPicker, setShowLibraryPicker] = useState(false);
  const [sessions, setSessions] = useState<{ id: string; project_name: string; client_name: string }[]>([]);

  // Fetch available creative sessions for admin linking
  useEffect(() => {
    if (!isAdmin) return;
    supabase.from('creative_sessions').select('id, project_name, client_name').eq('is_active', true).order('created_at', { ascending: false })
      .then(({ data }) => setSessions(data || []));
  }, [isAdmin]);

  const calcLineTotal = (i: any) => i.is_flat_fee ? Number(i.price) : Number(i.price) * Number(i.quantity || 1);

  const total = useMemo(() => {
    if (isAdmin && !editingItems) {
      return items.reduce((sum, i) => sum + calcLineTotal(i), 0);
    }
    return items
      .filter(i => selectedIds.has(i.id))
      .reduce((sum, i) => sum + calcLineTotal(i), 0);
  }, [selectedIds, items, isAdmin, editingItems]);

  const grandTotal = useMemo(() => {
    return items.reduce((sum, i) => sum + calcLineTotal(i), 0);
  }, [items]);

  const displayedTotal = isAdmin || signed ? grandTotal : total;

  const toggleItem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const setItemSelected = (id: string, isSelected: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (isSelected) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleItemRowClick = (event: MouseEvent<HTMLElement>, id: string) => {
    if (signed || isAdmin) return;

    const target = event.target as HTMLElement | null;
    if (target?.closest('button, a, input, textarea, select, label, [role="checkbox"]')) return;

    toggleItem(id);
  };

  const handleCheckboxClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  const quoteDate = proposal.quote_date ? new Date(proposal.quote_date) : new Date();
  const expiryDate = addDays(quoteDate, proposal.validity_days || 7);
  const eventDate = proposal.event_date ? new Date(proposal.event_date + 'T00:00:00') : null;

  const handleSign = async () => {
    if (!clientName.trim()) {
      toast({ title: 'Please enter your name to sign', variant: 'destructive' });
      return;
    }
    if (selectedIds.size === 0) {
      toast({ title: 'Please select at least one item', variant: 'destructive' });
      return;
    }
    setSigning(true);
    try {
      const { error } = await supabase
        .from('proposals')
        .update({
          client_signature: clientName,
          signed_at: new Date().toISOString(),
          status: 'accepted',
        })
        .eq('id', proposal.id);
      if (error) throw error;
      setSigned(true);
      toast({ title: 'Proposal accepted!', description: 'Thank you for signing.' });

      // Notify admin via email
      supabase.functions.invoke('notify-proposal-signed', {
        body: {
          event_name: proposal.event_name,
          client_name: proposal.client_name,
          client_signature: clientName,
          venue_name: proposal.venue_name,
          event_date: proposal.event_date,
          proposal_url: window.location.href,
        },
      }).catch(console.error);
    } catch (e: any) {
      toast({ title: 'Failed to sign', description: e.message, variant: 'destructive' });
    } finally {
      setSigning(false);
    }
  };

  const saveHeader = async () => {
    try {
      const { error } = await supabase
        .from('proposals')
        .update({
          event_name: editFields.event_name,
          client_name: editFields.client_name,
          venue_name: editFields.venue_name || null,
          event_date: editFields.event_date || null,
          validity_days: parseInt(editFields.validity_days) || 7,
          contact_email: editFields.contact_email,
          session_id: editFields.session_id || null,
        } as any)
        .eq('id', proposal.id);
      if (error) throw error;
      setEditingHeader(false);
      toast({ title: 'Proposal updated' });
      onRefresh?.();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const saveItems = async () => {
    try {
      // Delete removed items
      const editIds = new Set(editItems.filter(i => i.id && !i.id.startsWith('new-')).map(i => i.id));
      const toDelete = items.filter(i => !editIds.has(i.id));
      for (const d of toDelete) {
        await supabase.from('proposal_items').delete().eq('id', d.id);
      }

      // Upsert existing and insert new
      for (let idx = 0; idx < editItems.length; idx++) {
        const item = editItems[idx];
        if (item.id && !item.id.startsWith('new-')) {
          await supabase.from('proposal_items').update({
            title: item.title,
            description: item.description || null,
            price: parseFloat(item.price) || 0,
            quantity: parseInt(item.quantity) || 1,
            category: item.category || null,
            unit: item.unit || null,
            is_flat_fee: !!item.is_flat_fee,
            sort_order: idx,
          }).eq('id', item.id);
        } else {
          await supabase.from('proposal_items').insert({
            proposal_id: proposal.id,
            title: item.title,
            description: item.description || null,
            price: parseFloat(item.price) || 0,
            quantity: parseInt(item.quantity) || 1,
            category: item.category || null,
            unit: item.unit || null,
            is_flat_fee: !!item.is_flat_fee,
            sort_order: idx,
          });
        }
      }

      setEditingItems(false);
      toast({ title: 'Items updated' });
      onRefresh?.();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <img src={soleiaLogo} alt="Soleia" className="h-10 object-contain" />
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground tracking-wide uppercase print:hidden">
              Soleia Creative Team
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="print:hidden gap-2 text-[#7f8c8d] border-[#ecf0f1] hover:bg-[#f8f9fa]"
            >
              <Printer className="w-4 h-4" />
              Print PDF
            </Button>
          </div>
        </header>

        {/* Event Title & Info */}
        {editingHeader ? (
          <div className="bg-white rounded-lg p-5 border border-[#ecf0f1] mb-8 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#95a5a6] font-semibold">Event Name</label>
                <Input value={editFields.event_name} onChange={e => setEditFields({ ...editFields, event_name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-[#95a5a6] font-semibold">Client Name</label>
                <Input value={editFields.client_name} onChange={e => setEditFields({ ...editFields, client_name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-[#95a5a6] font-semibold">Venue Name</label>
                <Input value={editFields.venue_name} onChange={e => setEditFields({ ...editFields, venue_name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-[#95a5a6] font-semibold">Event Date</label>
                <Input type="date" value={editFields.event_date} onChange={e => setEditFields({ ...editFields, event_date: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-[#95a5a6] font-semibold">Validity (days)</label>
                <Input type="number" value={editFields.validity_days} onChange={e => setEditFields({ ...editFields, validity_days: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-[#95a5a6] font-semibold">Contact Email</label>
                <Input value={editFields.contact_email} onChange={e => setEditFields({ ...editFields, contact_email: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-[#95a5a6] font-semibold">Link Creative Session</label>
                <select
                  value={editFields.session_id}
                  onChange={e => setEditFields({ ...editFields, session_id: e.target.value })}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">— None —</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>{s.project_name} ({s.client_name})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={saveHeader} className="bg-[#2c3e50] text-white hover:bg-[#34495e]">
                <Check className="w-3 h-3 mr-1" /> Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingHeader(false)}>
                <X className="w-3 h-3 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-4xl font-light text-[#2c3e50] mb-1">{proposal.event_name}</h1>
                {isAdmin && (
                  <button onClick={() => setEditingHeader(true)} className="text-[#95a5a6] hover:text-[#2c3e50] transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-[#7f8c8d]">
                Prepared for <span className="font-medium text-[#2c3e50]">{proposal.client_name}</span>
              </p>
              {proposal.venue_name && (
                <p className="text-[#95a5a6] text-sm">at {proposal.venue_name}</p>
              )}
            </div>
            <div className="text-right text-sm space-y-1">
              {eventDate && (
                <div>
                  <span className="block text-[10px] tracking-[0.15em] uppercase text-[#95a5a6] font-semibold">Event Date</span>
                  <span className="text-[#2c3e50] font-medium">{format(eventDate, 'EEE, MMM d, yyyy')}</span>
                </div>
              )}
              <div className="mt-2">
                <span className="block text-[10px] tracking-[0.15em] uppercase text-[#95a5a6] font-semibold">Quote Date</span>
                <span className="text-[#2c3e50] font-medium">{format(quoteDate, 'M/d/yyyy')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Validity Notice */}
        <div className="bg-white border-l-4 border-[#3498db] rounded-r-lg p-5 mb-10 shadow-sm">
          <p className="text-[#34495e] text-sm">
            This proposal is valid for <strong>{proposal.validity_days || 7} days</strong>, please respond until{' '}
            <strong>{format(expiryDate, 'MMMM d, yyyy')}</strong>.
          </p>
          <p className="text-[#7f8c8d] text-sm mt-1">
            Confirmation within this period allows us to reserve production time.
          </p>
        </div>

        {/* Line Items */}
        {editingItems ? (
          <div className="space-y-2 mb-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[#2c3e50]">Edit Items</h3>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveItems} className="bg-[#2c3e50] text-white hover:bg-[#34495e]">
                  <Check className="w-3 h-3 mr-1" /> Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditingItems(false); setEditItems(items.map(i => ({ ...i, price: String(i.price), quantity: String(i.quantity || 1), category: i.category || '', unit: i.unit || '', is_flat_fee: !!i.is_flat_fee }))); }}>
                  <X className="w-3 h-3 mr-1" /> Cancel
                </Button>
              </div>
            </div>
            {editItems.map((item, idx) => (
              <div key={item.id || idx} className="bg-white rounded-lg p-4 border border-[#ecf0f1] space-y-2">
                <div className="grid grid-cols-[1fr_1fr] gap-2">
                  <Input
                    placeholder="Category (e.g. Immersive LED Environments)"
                    value={item.category}
                    onChange={e => { const n = [...editItems]; n[idx] = { ...n[idx], category: e.target.value }; setEditItems(n); }}
                    className="text-sm"
                  />
                  <Input
                    placeholder="Line Item Title"
                    value={item.title}
                    onChange={e => { const n = [...editItems]; n[idx] = { ...n[idx], title: e.target.value }; setEditItems(n); }}
                    className="text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <Checkbox
                    id={`flat-${idx}`}
                    checked={item.is_flat_fee}
                    onCheckedChange={(v) => { const n = [...editItems]; n[idx] = { ...n[idx], is_flat_fee: !!v }; setEditItems(n); }}
                  />
                  <label htmlFor={`flat-${idx}`} className="text-xs text-[#7f8c8d] cursor-pointer">Flat Fee</label>
                </div>
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center">
                  <Textarea
                    placeholder="Description"
                    value={item.description || ''}
                    onChange={e => { const n = [...editItems]; n[idx] = { ...n[idx], description: e.target.value }; setEditItems(n); }}
                    className="text-sm min-h-[36px] resize-none"
                    rows={1}
                  />
                  {!item.is_flat_fee && (
                    <>
                      <Input
                        placeholder="Qty"
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => { const n = [...editItems]; n[idx] = { ...n[idx], quantity: e.target.value }; setEditItems(n); }}
                        className="text-sm w-16"
                      />
                      <Input
                        placeholder="Unit (e.g. Project, Locations)"
                        value={item.unit}
                        onChange={e => { const n = [...editItems]; n[idx] = { ...n[idx], unit: e.target.value }; setEditItems(n); }}
                        className="text-sm w-32"
                      />
                    </>
                  )}
                  <Input
                    placeholder={item.is_flat_fee ? "Flat Fee Amount" : "Rate"}
                    type="number"
                    value={item.price}
                    onChange={e => { const n = [...editItems]; n[idx] = { ...n[idx], price: e.target.value }; setEditItems(n); }}
                    className="text-sm w-28"
                  />
                  <Button variant="ghost" size="icon" onClick={() => setEditItems(editItems.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 h-8 w-8">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditItems([...editItems, { id: `new-${Date.now()}`, title: '', description: '', price: '0', quantity: '1', category: '', unit: '', is_flat_fee: false, proposal_id: proposal.id, sort_order: editItems.length }])}
                className="text-[#3498db]"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Item
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLibraryPicker(!showLibraryPicker)}
                className="text-[#3498db]"
              >
                <Library className="w-3 h-3 mr-1" /> From Library
              </Button>
            </div>
            {showLibraryPicker && (
              <div className="bg-[#f0f3f5] border border-[#dce1e6] rounded-lg p-4 mt-2">
                <h4 className="text-[#2c3e50] text-sm font-medium mb-3">Pick from Library</h4>
                <LineItemLibrary
                  compact
                  onSelect={(t) => {
                    setEditItems([...editItems, {
                      id: `new-${Date.now()}`,
                      title: t.title,
                      description: t.description || '',
                      price: String(t.price),
                      quantity: '1',
                      category: t.category || '',
                      unit: '',
                      is_flat_fee: false,
                      proposal_id: proposal.id,
                      sort_order: editItems.length,
                    }]);
                    setShowLibraryPicker(false);
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="mb-10">
            {isAdmin && (
              <div className="flex justify-end mb-2">
                <button onClick={() => setEditingItems(true)} className="text-[#95a5a6] hover:text-[#2c3e50] transition-colors flex items-center gap-1 text-xs">
                  <Pencil className="w-3 h-3" /> Edit Items
                </button>
              </div>
            )}
            {/* Desktop Table - hidden on mobile */}
            <div className="hidden sm:block bg-white rounded-lg border border-[#ecf0f1] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f8f9fa] border-b border-[#ecf0f1]">
                    {!signed && !isAdmin && <TableHead className="w-10" />}
                    <TableHead className="text-[10px] tracking-[0.15em] uppercase text-[#95a5a6] font-semibold">Category</TableHead>
                    <TableHead className="text-[10px] tracking-[0.15em] uppercase text-[#95a5a6] font-semibold">Line Item</TableHead>
                    <TableHead className="text-[10px] tracking-[0.15em] uppercase text-[#95a5a6] font-semibold text-center w-16">Qty</TableHead>
                    <TableHead className="text-[10px] tracking-[0.15em] uppercase text-[#95a5a6] font-semibold w-24">Unit</TableHead>
                    <TableHead className="text-[10px] tracking-[0.15em] uppercase text-[#95a5a6] font-semibold text-right w-24">Rate</TableHead>
                    <TableHead className="text-[10px] tracking-[0.15em] uppercase text-[#95a5a6] font-semibold text-right w-28">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    let lastCategory = '';
                    return items.map(item => {
                      const showCategory = item.category && item.category !== lastCategory;
                      if (item.category) lastCategory = item.category;
                      const lineTotal = calcLineTotal(item);
                      const isFlatFee = !!item.is_flat_fee;
                      return (
                        <TableRow
                          key={item.id}
                          className="border-b border-[#f0f3f5] hover:bg-[#fafbfc] cursor-pointer transition-colors"
                          onClick={(event) => handleItemRowClick(event, item.id)}
                        >
                          {!signed && !isAdmin && (
                            <TableCell className="pr-0" onClick={e => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedIds.has(item.id)}
                                aria-label={`Select ${item.title}`}
                                onCheckedChange={(checked) => setItemSelected(item.id, checked === true)}
                                onClick={handleCheckboxClick}
                                onPointerDown={(event) => event.stopPropagation()}
                              />
                            </TableCell>
                          )}
                          <TableCell className="text-sm text-[#7f8c8d] font-medium align-top">
                            {showCategory ? item.category : ''}
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="text-sm font-semibold text-[#2c3e50]">{item.title}</div>
                            {item.description && (
                              <p className="text-xs text-[#95a5a6] mt-0.5 whitespace-pre-line">{item.description}</p>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-[#2c3e50] text-center align-top">
                            {isFlatFee ? '—' : (item.quantity || 1)}
                          </TableCell>
                          <TableCell className="text-sm text-[#7f8c8d] align-top">
                            {isFlatFee ? 'Flat Fee' : (item.unit || '—')}
                          </TableCell>
                          <TableCell className="text-sm text-[#2c3e50] text-right align-top">
                            {isFlatFee ? '—' : formatCurrency(Number(item.price))}
                          </TableCell>
                          <TableCell className="text-sm font-semibold text-[#2c3e50] text-right align-top">{formatCurrency(lineTotal)}</TableCell>
                        </TableRow>
                      );
                    });
                  })()}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card Layout - shown only on mobile */}
            <div className="sm:hidden space-y-3">
              {(() => {
                let lastCategory = '';
                return items.map(item => {
                  const showCategory = item.category && item.category !== lastCategory;
                  if (item.category) lastCategory = item.category;
                  const lineTotal = calcLineTotal(item);
                  const isFlatFee = !!item.is_flat_fee;
                  return (
                    <div key={item.id}>
                      {showCategory && (
                        <div className="text-[10px] tracking-[0.15em] uppercase text-[#95a5a6] font-semibold mt-4 mb-2 px-1">
                          {item.category}
                        </div>
                      )}
                      <div
                        className={`bg-white rounded-xl border p-4 transition-colors touch-manipulation active:scale-[0.98] ${
                          selectedIds.has(item.id) ? 'border-[#c49a3c] bg-[#c49a3c]/5' : 'border-[#ecf0f1]'
                        }`}
                        onClick={(event) => handleItemRowClick(event, item.id)}
                      >
                        <div className="flex items-start gap-3">
                          {!signed && !isAdmin && (
                            <div className="pt-0.5" onClick={e => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedIds.has(item.id)}
                                aria-label={`Select ${item.title}`}
                                onCheckedChange={(checked) => setItemSelected(item.id, checked === true)}
                                onClick={handleCheckboxClick}
                                onPointerDown={(event) => event.stopPropagation()}
                                className="w-5 h-5"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[15px] font-semibold text-[#2c3e50] leading-snug">{item.title}</h3>
                            {item.description && (
                              <p className="text-[13px] text-[#95a5a6] mt-1.5 whitespace-pre-line leading-relaxed">{item.description}</p>
                            )}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#f0f3f5]">
                              <div className="flex items-center gap-3 text-[12px] text-[#7f8c8d]">
                                {!isFlatFee && (
                                  <>
                                    <span>Qty: <span className="text-[#2c3e50] font-medium">{item.quantity || 1}</span></span>
                                    {item.unit && <span>• {item.unit}</span>}
                                    <span>@ {formatCurrency(Number(item.price))}</span>
                                  </>
                                )}
                                {isFlatFee && <span className="text-[#7f8c8d]">Flat Fee</span>}
                              </div>
                              <span className="text-[15px] font-bold text-[#2c3e50]">{formatCurrency(lineTotal)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* Total */}
        <div className="bg-white rounded-lg p-5 border border-[#ecf0f1] mb-4 flex items-center justify-between">
          <span className="text-[#7f8c8d] font-medium">{isAdmin ? 'Total' : 'Quote Total'}</span>
          <span className="text-2xl font-bold text-[#2c3e50]">{formatCurrency(displayedTotal)}</span>
        </div>

        {/* Sign Section */}
        {!isAdmin && !signed ? (
          <div className="bg-white rounded-lg p-6 border border-[#ecf0f1] mb-12">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Your full name"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleSign}
                disabled={signing || selectedIds.size === 0}
                className="bg-[#2c3e50] hover:bg-[#34495e] text-white px-8"
              >
                {signing ? 'Signing...' : 'Accept & Sign Proposal'}
              </Button>
            </div>
          </div>
        ) : signed ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-5 mb-12 text-center">
            <p className="text-green-700 font-medium">
              ✓ Proposal accepted by {proposal.client_signature}
            </p>
            {proposal.signed_at && (
              <p className="text-green-600 text-sm mt-1">
                Signed on {format(new Date(proposal.signed_at), 'MMMM d, yyyy')}
              </p>
            )}
          </div>
        ) : null}

        {/* Approved Creative Selections */}
        {proposal.session_id && (
          <ProposalApprovedClips sessionId={proposal.session_id} />
        )}

        {/* Gallery */}
        <ProposalGallery gallery={gallery} />

        {/* Timeline */}
        <ProposalTimeline timeline={timeline} />

        {/* Asset Deadline */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-[#2c3e50] mb-4 border-b border-[#ecf0f1] pb-2">Asset Deadline</h2>
          <div className="bg-white rounded-lg p-5 border border-[#ecf0f1]">
            <p className="text-sm text-[#34495e]">
              All branding assets must be delivered from the client <strong>21 days</strong> prior to the event date.
            </p>
            <p className="text-sm text-[#7f8c8d] mt-2">
              Timely submission allows for proper testing, quality control, and creative development.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-[#2c3e50] mb-4 border-b border-[#ecf0f1] pb-2">Contact</h2>
          <p className="text-sm text-[#34495e]">
            For any questions, please contact us at{' '}
            <a href={`mailto:${proposal.contact_email || 'luisdreamslv@gmail.com'}`} className="text-[#3498db] underline">
              {proposal.contact_email || 'luisdreamslv@gmail.com'}
            </a>
          </p>
        </section>

        {/* Terms */}
        <ProposalTerms />

        {/* Footer */}
        <footer className="text-center pt-8 pb-12 border-t border-[#ecf0f1]">
          <img src={soleiaLogo} alt="Soleia" className="h-8 mx-auto opacity-40" />
        </footer>
      </div>
    </div>
  );
}
