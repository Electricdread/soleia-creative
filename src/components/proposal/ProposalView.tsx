import { useState, useMemo, useEffect, type MouseEvent } from 'react';
import { format, addDays } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Pencil, Check, X, Plus, Trash2, Library, Printer, FileDown, Minus, ListChecks, BookOpen, FolderOpen, Calendar, Loader2 } from 'lucide-react';
import { generateProposalPdf } from '@/lib/proposalPdfGenerator';
import LineItemLibrary from '@/components/admin/LineItemLibrary';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import soleiaLogo from '@/assets/soleia-wide-logo.png';
import ProposalGallery from './ProposalGallery';
import ProposalTimeline from './ProposalTimeline';
import ProposalTerms from './ProposalTerms';
import ProposalApprovedClips from './ProposalApprovedClips';
import { CountdownBadge } from '@/components/CountdownBadge';
import { isProposalClosed } from '@/lib/proposalStatus';
import { calcProposalTotal, calcLineTotal as calcLineTotalShared } from '@/lib/proposalTotals';
import ProposalServiceRow, {
  RC_IVORY, RC_GOLD, RC_GOLD_DEEP, RC_GOLD_TINT, RC_INK, RC_SOFT_INK,
} from './ProposalServiceRow';

// Section eyebrow used across the ivory sheet — mirrors the rate card.
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mt-10 mb-4">
      <span className="text-[10px] tracking-[0.35em] uppercase" style={{ color: RC_GOLD_DEEP }}>
        {children}
      </span>
      <span className="flex-1" style={{ height: 1, backgroundColor: `${RC_GOLD}55` }} />
    </div>
  );
}


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
  const isProposalSigned = !!proposal.signed_at;
  const isPersistedSelected = (item: any) => item.client_selected === true;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(isProposalSigned ? items.filter(isPersistedSelected).map(i => i.id) : [])
  );
  const [clientName, setClientName] = useState('');
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(!!proposal.signed_at);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [clientQty, setClientQty] = useState<Record<string, number>>(
    Object.fromEntries(items.map(i => [i.id, Number(i.quantity) || 1]))
  );
  const isSignedItem = (item: any) => isProposalSigned ? isPersistedSelected(item) : selectedIds.has(item.id);

  // Re-sync when items prop changes (e.g. after admin edit / refresh)
  useEffect(() => {
    setClientQty(Object.fromEntries(items.map(i => [i.id, Number(i.quantity) || 1])));
    setSelectedIds(new Set(isProposalSigned ? items.filter(isPersistedSelected).map(i => i.id) : []));
  }, [items, isProposalSigned]);


  const isClientEditable = !isAdmin && !signed;
  const getEffectiveQty = (i: any) =>
    isClientEditable ? (clientQty[i.id] ?? (Number(i.quantity) || 1)) : (Number(i.quantity) || 1);
  const adjustQty = (id: string, delta: number) => {
    setClientQty(prev => {
      const current = prev[id] ?? 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [id]: next };
    });
  };

  // Admin editing states
  const [editingHeader, setEditingHeader] = useState(false);
  const [editFields, setEditFields] = useState({
    event_name: proposal.event_name,
    client_name: proposal.client_name,
    venue_name: proposal.venue_name || '',
    event_date: proposal.event_date || '',
    validity_days: String(proposal.validity_days || 7),
    contact_email: proposal.contact_email || 'luisdreamslv@gmail.com',
    client_email: proposal.client_email || '',
    creative_call_url: proposal.creative_call_url || '',
    linked_session_id: '',
    assigned_pm_id: proposal.assigned_pm_id || '',
  });
  const [adminUsers, setAdminUsers] = useState<{ user_id: string; email: string; display_name: string }[]>([]);
  useEffect(() => {
    if (!isAdmin) return;
    supabase.rpc('list_admin_users').then(({ data }) => setAdminUsers((data as any[]) || []));
  }, [isAdmin]);
  const [linkedSessionId, setLinkedSessionId] = useState<string | null>(null);
  const [editingItems, setEditingItems] = useState(false);
  const seedEditItems = (src: any[]) => src.map(i => ({ ...i, price: String(i.price), quantity: String(i.quantity || 1), category: i.category || '', unit: i.unit || '', is_flat_fee: !!i.is_flat_fee }));
  const [editItems, setEditItems] = useState(() => seedEditItems(items));
  // Keep edit buffer in sync with latest items prop whenever we're not actively editing.
  useEffect(() => {
    if (!editingItems) setEditItems(seedEditItems(items));
  }, [items, editingItems]);
  const [showLibraryPicker, setShowLibraryPicker] = useState(false);
  const [sessions, setSessions] = useState<{ id: string; project_name: string; client_name: string; cover_images: any }[]>([]);

  // Fetch available creative sessions for admin linking + find currently linked session
  useEffect(() => {
    if (!isAdmin) return;
    supabase.from('creative_sessions').select('id, project_name, client_name, cover_images, proposal_id').eq('is_active', true).order('created_at', { ascending: false })
      .then(({ data }) => {
        setSessions(data || []);
        const linked = (data || []).find((s: any) => s.proposal_id === proposal.id);
        setLinkedSessionId(linked?.id || null);
        setEditFields(prev => ({ ...prev, linked_session_id: linked?.id || '' }));
      });
  }, [isAdmin, proposal.id]);

  // Use shared total helpers so live view, signed view, and PDF stay in lockstep.
  const calcLineTotal = (i: any) =>
    calcLineTotalShared(i, isClientEditable ? clientQty : undefined);

  const total = useMemo(
    () => calcProposalTotal(items, { signed: false, selectedIds, qtyOverrides: isClientEditable ? clientQty : undefined }),
    [selectedIds, items, clientQty, isClientEditable]
  );

  const acceptedTotal = useMemo(
    () => calcProposalTotal(items, { signed: true }),
    [items]
  );

  const displayedTotal = signed ? acceptedTotal : total;

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
      // Persist client-adjusted quantities for selected items before signing.
      const qtyUpdates = items
        .filter(i => selectedIds.has(i.id) && !i.is_flat_fee)
        .map(i => ({ id: i.id, qty: clientQty[i.id] ?? (Number(i.quantity) || 1) }))
        .filter(u => u.qty !== Number(items.find(i => i.id === u.id)?.quantity || 1));

      // Sign via security-definer RPC so visitors can only set signature/status
      // and adjust quantities on items belonging to this proposal.
      const { error } = await supabase.rpc('sign_proposal_by_token', {
        p_token: proposal.token,
        p_signature: clientName,
        p_item_quantities: qtyUpdates as any,
        p_selected_ids: Array.from(selectedIds) as any,
      });
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

      // Build a signed-state PDF and email it to client + PM + Luis
      (async () => {
        try {
          const [itemsRes, galleryRes, timelineRes] = await Promise.all([
            supabase.from('proposal_items').select('*').eq('proposal_id', proposal.id).order('sort_order', { ascending: true, nullsFirst: false }),
            supabase.from('proposal_gallery').select('*').eq('proposal_id', proposal.id).order('sort_order', { ascending: true, nullsFirst: false }),
            supabase.from('proposal_timeline').select('*').eq('proposal_id', proposal.id).order('sort_order', { ascending: true, nullsFirst: false }),
          ]);
          const freshItems = itemsRes.data || items;
          const freshGallery = galleryRes.data || gallery;
          const freshTimeline = timelineRes.data || timeline;
          const coverImageUrl = freshGallery?.[0]?.image_url || null;
          const signedProposal = { ...proposal, signed_at: new Date().toISOString(), client_signature: clientName };
          const itemsForPdf = freshItems.map((i: any) => ({
            ...i,
            quantity: clientQty[i.id] ?? i.quantity ?? 1,
            client_selected: selectedIds.has(i.id),
          }));
          const pdf = await generateProposalPdf(
            signedProposal,
            itemsForPdf,
            freshTimeline,
            coverImageUrl,
            freshGallery,
            { returnBase64: true }
          );
          await supabase.functions.invoke('send-signed-proposal', {
            body: {
              event_name: proposal.event_name,
              client_name: proposal.client_name,
              client_signature: clientName,
              client_email: proposal.client_email || null,
              venue_name: proposal.venue_name,
              event_date: proposal.event_date,
              proposal_url: window.location.href,
              assigned_pm_name: proposal.assigned_pm_name || null,
              assigned_pm_email: proposal.assigned_pm_email || null,
              pdf_base64: pdf.base64,
              pdf_filename: pdf.filename,
            },
          });
        } catch (err) {
          console.error('send-signed-proposal failed', err);
        }
      })();

      // Auto-create client Google Drive folder (idempotent on backend)
      supabase.functions.invoke('create-client-drive-folder', {
        body: { proposal_id: proposal.id },
      }).catch(console.error);
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (/not available for signing/i.test(msg)) {
        toast({
          title: 'This proposal is closed for signing',
          description: 'It may have been archived or withdrawn. Please contact Soleia to have it reopened, then refresh this page.',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Failed to sign', description: msg, variant: 'destructive' });
      }
    } finally {
      setSigning(false);
    }
  };

  const saveHeader = async () => {
    try {
      const newSessionId = editFields.linked_session_id || null;
      const oldSessionId = linkedSessionId;

      // Defensive whitelist: only these columns exist on `proposals`.
      // Session linkage lives on creative_sessions.proposal_id (NOT proposals.session_id).
      // Never spread editFields here — it contains linked_session_id which is not a proposals column.
      const pickedPm = adminUsers.find(u => u.user_id === editFields.assigned_pm_id);
      const proposalPayload = {
        event_name: editFields.event_name,
        client_name: editFields.client_name,
        venue_name: editFields.venue_name || null,
        event_date: editFields.event_date || null,
        validity_days: parseInt(editFields.validity_days) || 7,
        contact_email: editFields.contact_email,
        client_email: editFields.client_email?.trim() || null,
        creative_call_url: editFields.creative_call_url?.trim() || null,
        assigned_pm_id: editFields.assigned_pm_id || null,
        assigned_pm_email: pickedPm?.email || null,
        assigned_pm_name: pickedPm?.display_name || pickedPm?.email || null,
      };

      if (import.meta.env.DEV) {
        const allowed = new Set(Object.keys(proposalPayload));
        const stray = Object.keys(proposalPayload).filter(k => !allowed.has(k));
        if (stray.length) console.warn('[saveHeader] stray keys in proposals payload:', stray);
      }

      const { error } = await supabase
        .from('proposals')
        .update(proposalPayload)
        .eq('id', proposal.id);
      if (error) throw error;

      // Update session linkage via creative_sessions.proposal_id
      if (newSessionId !== oldSessionId) {
        // Unlink old session
        if (oldSessionId) {
          await supabase.from('creative_sessions').update({ proposal_id: null } as any).eq('id', oldSessionId);
        }
        // Link new session
        if (newSessionId) {
          await supabase.from('creative_sessions').update({ proposal_id: proposal.id } as any).eq('id', newSessionId);
        }
        setLinkedSessionId(newSessionId);
      }

      // Auto-pull cover image when linking a new session
      if (newSessionId && newSessionId !== oldSessionId) {
        const session = sessions.find(s => s.id === newSessionId);
        const coverImages = session?.cover_images as any[] | null;
        if (coverImages?.length) {
          const coverUrl = coverImages[0]?.url || coverImages[0];
          if (typeof coverUrl === 'string' && coverUrl.startsWith('http')) {
            const { data: existing } = await supabase
              .from('proposal_gallery')
              .select('id')
              .eq('proposal_id', proposal.id)
              .eq('image_url', coverUrl)
              .maybeSingle();

            if (!existing) {
              await supabase.from('proposal_gallery').insert({
                proposal_id: proposal.id,
                image_url: coverUrl,
                caption: 'Session Cover',
                sort_order: 0,
              });
              toast({ title: 'Cover image added to gallery' });
            }
          }
        }
      }

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
            client_selected: false,
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

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const [proposalRes, itemsRes, galleryRes, timelineRes] = await Promise.all([
        supabase.from('proposals').select('*').eq('id', proposal.id).maybeSingle(),
        supabase.from('proposal_items').select('*').eq('proposal_id', proposal.id).order('sort_order', { ascending: true, nullsFirst: false }),
        supabase.from('proposal_gallery').select('*').eq('proposal_id', proposal.id).order('sort_order', { ascending: true, nullsFirst: false }),
        supabase.from('proposal_timeline').select('*').eq('proposal_id', proposal.id).order('sort_order', { ascending: true, nullsFirst: false }),
      ]);

      if (proposalRes.error) throw proposalRes.error;
      if (itemsRes.error) throw itemsRes.error;
      if (galleryRes.error) throw galleryRes.error;
      if (timelineRes.error) throw timelineRes.error;

      const freshProposal = proposalRes.data || proposal;
      const freshItemsAll = itemsRes.data?.length ? itemsRes.data : items;
      const freshGallery = galleryRes.data || gallery;
      const freshTimeline = timelineRes.data || timeline;
      const coverImageUrl = freshGallery?.[0]?.image_url || null;

      // Keep unsigned proposal PDFs showing the line-item menu, but only total client-selected rows.
      const freshItems = freshProposal.signed_at
        ? freshItemsAll.filter(isPersistedSelected)
        : freshItemsAll;

      // Apply client-adjusted quantities so PDF total matches what's displayed
      const itemsForPdf = freshItems.map((i: any) => ({
        ...i,
        quantity: clientQty[i.id] ?? i.quantity ?? 1,
        client_selected: freshProposal.signed_at ? i.client_selected === true : selectedIds.has(i.id),
      }));

      await generateProposalPdf(freshProposal, itemsForPdf, freshTimeline, coverImageUrl, freshGallery);
    } catch (e: any) {
      toast({ title: 'PDF download failed', description: e.message, variant: 'destructive' });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

  const visibleItems = signed ? items.filter(isSignedItem) : items;
  const tableItems = visibleItems;
  const additionalServicesLabel = 'Services';

  return (
    <div className="min-h-screen w-full py-6 sm:py-10 px-3 sm:px-6" style={{ backgroundColor: RC_IVORY }}>
      <div
        className="max-w-3xl mx-auto relative p-5 sm:p-10"
        style={{ backgroundColor: RC_IVORY, border: `1px solid ${RC_GOLD}` }}
      >
        <div
          className="absolute inset-2 pointer-events-none hidden sm:block"
          style={{ border: `1px solid ${RC_GOLD}`, opacity: 0.45 }}
        />
        {/* Header */}
        <header className="flex items-center justify-between mb-8 relative">
          <img src={soleiaLogo} alt="Soleia" className="h-10 object-contain" style={{ filter: 'brightness(0.15) sepia(1) saturate(6) hue-rotate(5deg)' }} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="print:hidden gap-2 bg-transparent"
            style={{ borderColor: RC_GOLD, color: RC_GOLD_DEEP }}
          >
            {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            {downloadingPdf ? 'Preparing PDF' : 'Download PDF'}
          </Button>
        </header>

        {/* Event Title & Info */}
        {editingHeader ? (
          <div className="bg-card rounded-lg p-5 border border-border shadow-card hover:shadow-card-hover transition-shadow duration-300 mb-8 space-y-3 card-elevated">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground/80 font-semibold">Event Name</label>
                <Input value={editFields.event_name} onChange={e => setEditFields({ ...editFields, event_name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground/80 font-semibold">Client Name</label>
                <Input value={editFields.client_name} onChange={e => setEditFields({ ...editFields, client_name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground/80 font-semibold">Venue Name</label>
                <Input value={editFields.venue_name} onChange={e => setEditFields({ ...editFields, venue_name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground/80 font-semibold">Event Date</label>
                <Input type="date" value={editFields.event_date} onChange={e => setEditFields({ ...editFields, event_date: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground/80 font-semibold">Validity (days)</label>
                <Input type="number" value={editFields.validity_days} onChange={e => setEditFields({ ...editFields, validity_days: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground/80 font-semibold">Contact Email</label>
                <Input value={editFields.contact_email} onChange={e => setEditFields({ ...editFields, contact_email: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground/80 font-semibold">Client Email (for signed PDF)</label>
                <Input
                  type="email"
                  value={editFields.client_email}
                  onChange={e => setEditFields({ ...editFields, client_email: e.target.value })}
                  placeholder="client@company.com"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground/80 font-semibold">Assigned Project Manager</label>
                <select
                  value={editFields.assigned_pm_id}
                  onChange={e => setEditFields({ ...editFields, assigned_pm_id: e.target.value })}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">— Unassigned —</option>
                  {adminUsers.map(u => (
                    <option key={u.user_id} value={u.user_id}>{u.display_name || u.email}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground/80 font-semibold">Creative Call Scheduling Link (optional)</label>
                <Input
                  value={editFields.creative_call_url}
                  onChange={e => setEditFields({ ...editFields, creative_call_url: e.target.value })}
                  placeholder="https://calendly.com/..."
                />
                <p className="text-[11px] text-muted-foreground/80 mt-1">When set, adds a "Schedule Our Creative Call" button to the proposal email.</p>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground/80 font-semibold">Link Creative Session</label>
                <select
                  value={editFields.linked_session_id}
                  onChange={e => setEditFields({ ...editFields, linked_session_id: e.target.value })}
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
              <Button size="sm" onClick={saveHeader} className="bg-primary text-foreground hover:bg-primary/90">
                <Check className="w-3 h-3 mr-1" /> Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingHeader(false)}>
                <X className="w-3 h-3 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] tracking-[0.35em] uppercase font-semibold mb-3" style={{ color: RC_GOLD_DEEP }}>
                Proposal
              </p>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-light" style={{ color: RC_INK, fontSize: 36, lineHeight: 1.1 }}>
                  {proposal.event_name}
                </h1>
                {isAdmin && (
                  <button onClick={() => setEditingHeader(true)} className="transition-colors" style={{ color: RC_SOFT_INK }}>
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="mt-2" style={{ color: RC_SOFT_INK }}>
                Prepared for <span className="font-medium" style={{ color: RC_INK }}>{proposal.client_name}</span>
              </p>
              {proposal.venue_name && (
                <p className="text-sm" style={{ color: RC_SOFT_INK }}>at {proposal.venue_name}</p>
              )}
              {eventDate && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {(signed || isProposalClosed(proposal)) ? (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{ backgroundColor: '#e6f4ea', color: '#276a3a', border: '1px solid #b9dcc4' }}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Signed · Ready for invoice
                    </span>
                  ) : (
                    <CountdownBadge eventDate={proposal.event_date} prefix="Event:" size="md" />
                  )}
                </div>
              )}
            </div>
            <div className="text-left sm:text-right text-sm space-y-1 shrink-0">
              {eventDate && (
                <div>
                  <span className="block text-[10px] tracking-[0.3em] uppercase font-semibold" style={{ color: RC_GOLD_DEEP }}>Event Date</span>
                  <span className="font-medium" style={{ color: RC_INK }}>{format(eventDate, 'EEE, MMM d, yyyy')}</span>
                </div>
              )}
            </div>
          </div>
        )}


        {/* Venue contract inclusions disclaimer */}
        {!editingItems && (
          <div
            className="mb-2 rounded-sm px-4 py-3.5"
            style={{
              backgroundColor: `${RC_GOLD_TINT}88`,
              border: `1px solid ${RC_GOLD}66`,
              borderLeft: `3px solid ${RC_GOLD}`,
            }}
          >
            <p className="text-[10px] tracking-[0.3em] uppercase font-semibold mb-2" style={{ color: RC_GOLD_DEEP }}>
              Included in your venue contract
            </p>
            <ul className="text-[12.5px] space-y-1" style={{ color: RC_INK }}>
              <li>• Up to 10 static logos — LED screens</li>
              <li>• 1 static logo — all TVs, Cabanas &amp; Bungalows</li>
            </ul>
          </div>
        )}

        {/* Section label for the menu of optional services */}
        {!editingItems && tableItems.length > 0 && (
          <SectionLabel>{additionalServicesLabel}</SectionLabel>
        )}


        {/* Line Items */}
        {editingItems ? (
          <div className="space-y-2 mb-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">Edit Items</h3>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveItems} className="bg-primary text-foreground hover:bg-primary/90">
                  <Check className="w-3 h-3 mr-1" /> Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditingItems(false); setEditItems(seedEditItems(items)); }}>
                  <X className="w-3 h-3 mr-1" /> Cancel
                </Button>
              </div>
            </div>
            {editItems.map((item, idx) => (
              <div key={item.id || idx} className="bg-card rounded-lg p-4 border border-border shadow-card hover:shadow-card-hover transition-shadow duration-300 space-y-2 card-elevated">
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
                  <label htmlFor={`flat-${idx}`} className="text-xs text-muted-foreground cursor-pointer">Flat Fee</label>
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
                  <DeleteConfirmDialog
                    trigger={
                      <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 h-8 w-8">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    }
                    title="Delete line item?"
                    description={`This will permanently remove "${item.title || 'this item'}". This action cannot be undone.`}
                    onConfirm={() => setEditItems(editItems.filter((_, i) => i !== idx))}
                  />
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditItems([...editItems, { id: `new-${Date.now()}`, title: '', description: '', price: '0', quantity: '1', category: '', unit: '', is_flat_fee: false, proposal_id: proposal.id, sort_order: editItems.length }])}
                className="text-primary"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Item
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLibraryPicker(!showLibraryPicker)}
                className="text-primary"
              >
                <Library className="w-3 h-3 mr-1" /> From Library
              </Button>
            </div>
            {showLibraryPicker && (
              <div className="bg-muted border border-border rounded-lg p-4 mt-2">
                <h4 className="text-foreground text-sm font-medium mb-3">Pick from Library</h4>
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
          <div id="line-items" className="mb-10 scroll-mt-20">
            {isAdmin && (
              <div className="flex justify-end mb-2">
                <button onClick={() => { setEditItems(seedEditItems(items)); setEditingItems(true); }} className="text-muted-foreground/80 hover:text-foreground transition-colors flex items-center gap-1 text-xs">
                  <Pencil className="w-3 h-3" /> Edit Items
                </button>
              </div>
            )}
            {items.length === 0 ? (
              isAdmin ? (
                <div className="bg-background border-2 border-dashed border-border rounded-lg p-10 text-center">
                  <ListChecks className="w-8 h-8 text-primary mx-auto mb-3" />
                  <p className="text-foreground font-semibold mb-1">No line items yet</p>
                  <p className="text-muted-foreground text-sm mb-4">Add items so your client can see the menu and pricing.</p>
                  <Button size="sm" onClick={() => { setEditItems(seedEditItems(items)); setEditingItems(true); }} className="bg-primary text-foreground hover:bg-primary/90 gap-1.5">
                    <Plus className="w-3 h-3" /> Add items
                  </Button>
                </div>
              ) : (
                <div className="bg-muted/40 border border-border rounded-lg p-8 text-center">
                  <p className="text-muted-foreground text-sm italic">
                    Line items will be finalized together on our creative call.
                  </p>
                </div>
              )
            ) : tableItems.length === 0 ? null : (
              <div>
                {(() => {
                  let lastCategory = '';
                  const nodes: React.ReactNode[] = [];
                  tableItems.forEach((item) => {
                    const showCategory = item.category && item.category !== lastCategory;
                    if (item.category) lastCategory = item.category;
                    if (showCategory) {
                      nodes.push(
                        <SectionLabel key={`cat-${item.category}`}>{item.category}</SectionLabel>
                      );
                    }
                    nodes.push(
                      <ProposalServiceRow
                        key={item.id}
                        item={item}
                        lineTotal={calcLineTotal(item)}
                        qty={getEffectiveQty(item)}
                        selected={selectedIds.has(item.id)}
                        signed={signed}
                        isAdmin={isAdmin}
                        clientEditable={isClientEditable}
                        onToggle={toggleItem}
                        onAdjustQty={adjustQty}
                        onRowClick={handleItemRowClick}
                      />
                    );
                  });
                  return nodes;
                })()}
              </div>
            )}
          </div>
        )}

        {/* Total */}
        <div
          className="rounded-sm p-5 mb-6 flex items-center justify-between"
          style={{ backgroundColor: RC_GOLD_TINT, border: `1px solid ${RC_GOLD}`, borderLeft: `4px solid ${RC_GOLD}` }}
        >
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: RC_GOLD_DEEP }}>
              {signed ? 'Accepted Total' : 'Proposal Total'}
            </div>
          </div>
          <span className="font-display text-[28px]" style={{ color: RC_INK, lineHeight: 1 }}>
            {formatCurrency(displayedTotal)}
          </span>
        </div>

        {/* Sign Section */}
        {!isAdmin && !signed && proposal.status !== 'sent' && proposal.status !== 'draft' ? (
          <div
            className="rounded-sm p-6 mb-12"
            style={{ backgroundColor: '#fdf6e3', border: `1px solid #d4a24c` }}
          >
            <p className="font-semibold mb-2" style={{ color: '#8a5a12' }}>
              This proposal is currently closed for signing
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#7a5c2c' }}>
              It has been archived or withdrawn and can't be accepted in its current state.
              Please reply to your Soleia contact (or email{' '}
              <a href="mailto:luisdreamslv@gmail.com" className="underline font-medium">
                luisdreamslv@gmail.com
              </a>
              ) and ask us to reopen it. Once reopened, refresh this page (Cmd/Ctrl + Shift + R)
              and the signature field will reappear here.
            </p>
          </div>
        ) : !isAdmin && !signed ? (
          <div
            className="rounded-sm p-6 mb-12"
            style={{ backgroundColor: '#ffffff', border: `1px solid ${RC_GOLD}66` }}
          >
            <div className="text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: RC_GOLD_DEEP }}>
              Accept &amp; Sign
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Your full name"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                className="flex-1 bg-white"
                style={{ borderColor: `${RC_GOLD}66`, color: RC_INK }}
              />
              <Button
                onClick={handleSign}
                disabled={signing || selectedIds.size === 0}
                className="px-8 tracking-[0.15em] uppercase text-xs"
                style={{ backgroundColor: RC_GOLD, color: '#fff' }}
              >
                {signing ? 'Signing…' : 'Accept & Sign Proposal'}
              </Button>
            </div>
            {selectedIds.size === 0 && (
              <p className="text-xs mt-3" style={{ color: RC_SOFT_INK }}>
                Select at least one line item above to enable signing.
              </p>
            )}
          </div>
        ) : signed ? (
          <div
            className="rounded-sm p-5 mb-12 text-center"
            style={{ backgroundColor: '#f0f8f2', border: '1px solid #b9dcc4' }}
          >
            <p className="font-medium" style={{ color: '#276a3a' }}>
              ✓ Proposal accepted by {proposal.client_signature}
            </p>
            {proposal.signed_at && (
              <p className="text-sm mt-1" style={{ color: '#4f8a63' }}>
                Signed on {format(new Date(proposal.signed_at), 'MMMM d, yyyy')}
              </p>
            )}
          </div>
        ) : null}




        {/* Approved Creative Selections */}
        {linkedSessionId && (
          <ProposalApprovedClips sessionId={linkedSessionId} />
        )}

        {/* Gallery */}
        <ProposalGallery gallery={gallery} isAdmin={isAdmin} proposalId={proposal.id} onRefresh={onRefresh} />

        {/* Timeline */}
        <ProposalTimeline timeline={timeline} />

        {/* Kickoff Conditions */}
        <section className="mb-12">
          <SectionLabel>Kickoff Conditions</SectionLabel>
          <div
            className="rounded-sm p-5"
            style={{ backgroundColor: `${RC_GOLD_TINT}66`, border: `1px solid ${RC_GOLD}55`, borderLeft: `3px solid ${RC_GOLD}` }}
          >
            <p className="text-[13px]" style={{ color: RC_INK }}>
              Production begins only once <strong>both</strong> conditions are met: the proposal is signed off and all client brand assets have been delivered.
            </p>
            <p className="text-[12.5px] mt-2" style={{ color: RC_SOFT_INK }}>
              From kickoff: <strong style={{ color: RC_INK }}>14 days</strong> to deliver the first review &middot; <strong style={{ color: RC_INK }}>3 days</strong> for client review &middot; <strong style={{ color: RC_INK }}>1</strong> included revision &middot; final notes due <strong style={{ color: RC_INK }}>no later than 4 days before the event</strong>.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <SectionLabel>Contact</SectionLabel>
          <p className="text-[13px]" style={{ color: RC_INK }}>
            For any questions, please contact us at{' '}
            <a href={`mailto:${proposal.contact_email || 'luisdreamslv@gmail.com'}`} className="underline" style={{ color: RC_GOLD_DEEP }}>
              {proposal.contact_email || 'luisdreamslv@gmail.com'}
            </a>
          </p>
        </section>

        {/* Terms */}
        <ProposalTerms />

        {/* Footer */}
        <footer className="text-center pt-8 pb-4 mt-6" style={{ borderTop: `1px solid ${RC_GOLD}44` }}>
          <div className="text-[10px] tracking-[0.45em]" style={{ color: RC_GOLD_DEEP }}>
            SOLEIA LAS VEGAS
          </div>
        </footer>
      </div>
    </div>
  );
}

