import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Settings, Plus, Trash2, Copy, ExternalLink, Loader2, ArrowLeft, Pencil, Library } from 'lucide-react';
import soleiaLogo from '@/assets/soleia-wide-logo.png';
import LineItemLibrary from '@/components/admin/LineItemLibrary';
import { format } from 'date-fns';

type ViewTab = 'proposals' | 'library';

function generateToken() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

interface ProposalRow {
  id: string;
  token: string;
  event_name: string;
  client_name: string;
  venue_name: string | null;
  event_date: string | null;
  quote_date: string;
  validity_days: number;
  status: string;
  signed_at: string | null;
  client_signature: string | null;
  created_at: string;
}

export default function AdminProposals() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading } = useAuth();
  const { toast } = useToast();
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewTab>('proposals');
  const [showLibraryPicker, setShowLibraryPicker] = useState(false);
  // Form state
  const [eventName, setEventName] = useState('');
  const [clientName, setClientName] = useState('');
  const [venueName, setVenueName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [validityDays, setValidityDays] = useState('7');
  const [contactEmail, setContactEmail] = useState('info@soleia-creative.com');
  const [itemsList, setItemsList] = useState([{ title: '', description: '', price: '', quantity: '1', category: '', unit: '', is_flat_fee: false }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) navigate('/admin/login');
    if (!isLoading && user && !isAdmin) navigate('/');
  }, [user, isAdmin, isLoading, navigate]);

  const fetchProposals = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('proposals')
      .select('*')
      .order('created_at', { ascending: false });
    setProposals((data as ProposalRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) fetchProposals(); }, [isAdmin]);

  const handleCreate = async () => {
    if (!eventName.trim() || !clientName.trim()) {
      toast({ title: 'Event name and client name are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const token = generateToken();
      const { data: proposal, error } = await supabase
        .from('proposals')
        .insert({
          token,
          event_name: eventName,
          client_name: clientName,
          venue_name: venueName || null,
          event_date: eventDate || null,
          validity_days: parseInt(validityDays) || 7,
          contact_email: contactEmail,
          status: 'draft',
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;

      // Insert items
      const validItems = itemsList.filter(i => i.title.trim());
      if (validItems.length > 0) {
        const { error: itemsErr } = await supabase.from('proposal_items').insert(
          validItems.map((item, idx) => ({
            proposal_id: proposal.id,
            title: item.title,
            description: item.description || null,
            price: parseFloat(item.price) || 0,
            quantity: parseInt(item.quantity) || 1,
            category: item.category || null,
            unit: item.unit || null,
            is_flat_fee: item.is_flat_fee,
            sort_order: idx,
          }))
        );
        if (itemsErr) throw itemsErr;
      }

      // Insert default timeline
      await supabase.from('proposal_timeline').insert([
        { proposal_id: proposal.id, phase: 'Creative Direction', duration: '2 Days', details: 'After receiving the assets, mockups are sent', sort_order: 0 },
        { proposal_id: proposal.id, phase: 'Content Creation', duration: '2 Weeks', details: 'Begins only after the creative direction has been mutually agreed upon and the proposal has been signed.', sort_order: 1 },
        { proposal_id: proposal.id, phase: 'Review and Revisions', duration: '1 x Revision', details: 'One round of fixes within the agreed-upon visual direction.', sort_order: 2 },
        { proposal_id: proposal.id, phase: 'Applying Fixes & Delivery', duration: '2 Business Days', details: 'Time allocated to implement the approved revisions. Final results sent.', sort_order: 3 },
      ]);

      toast({ title: 'Proposal created!' });
      setShowForm(false);
      resetForm();
      fetchProposals();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEventName('');
    setClientName('');
    setVenueName('');
    setEventDate('');
    setValidityDays('7');
    setContactEmail('info@soleia-creative.com');
    setItemsList([{ title: '', description: '', price: '', quantity: '1', category: '', unit: '', is_flat_fee: false }]);
  };

  const deleteProposal = async (id: string) => {
    if (!confirm('Delete this proposal?')) return;
    await supabase.from('proposals').delete().eq('id', id);
    fetchProposals();
    toast({ title: 'Proposal deleted' });
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/proposal/${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copied!' });
  };

  const markSent = async (id: string) => {
    await supabase.from('proposals').update({ status: 'sent' }).eq('id', id);
    fetchProposals();
    toast({ title: 'Proposal marked as sent' });
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'draft': return 'bg-zinc-500';
      case 'sent': return 'bg-blue-500';
      case 'accepted': return 'bg-green-500';
      default: return 'bg-zinc-500';
    }
  };

  if (isLoading || !isAdmin) return null;

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-black via-zinc-900 to-black z-0" />
      <div className="fixed inset-0 z-[1] opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

      <header className="relative z-10 border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={soleiaLogo} alt="Soleia" className="h-8 object-contain" />
            <h1 className="text-white text-lg font-semibold">Client Proposals</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('proposals')}
              className={`text-sm ${activeTab === 'proposals' ? 'text-white bg-zinc-800' : 'text-zinc-500 hover:text-white'}`}
            >
              Proposals
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('library')}
              className={`text-sm gap-1.5 ${activeTab === 'library' ? 'text-white bg-zinc-800' : 'text-zinc-500 hover:text-white'}`}
            >
              <Library className="w-3.5 h-3.5" /> Item Library
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="text-zinc-400 hover:text-white hover:bg-zinc-800">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'library' ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-white text-lg font-semibold mb-4">Line Item Templates</h2>
            <p className="text-zinc-500 text-sm mb-6">Save reusable services and items here, then quickly add them when creating proposals.</p>
            <LineItemLibrary />
          </div>
        ) : (
          <>
        {/* Create New */}
        {!showForm ? (
          <Button onClick={() => setShowForm(true)} className="mb-8 gap-2 bg-white text-black hover:bg-zinc-200">
            <Plus className="w-4 h-4" /> New Proposal
          </Button>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
            <h2 className="text-white text-lg font-semibold mb-4">Create Proposal</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <Label className="text-zinc-400 text-xs">Event Name *</Label>
                <Input value={eventName} onChange={e => setEventName(e.target.value)} className="bg-zinc-800 border-zinc-700 text-white mt-1" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Client Name *</Label>
                <Input value={clientName} onChange={e => setClientName(e.target.value)} className="bg-zinc-800 border-zinc-700 text-white mt-1" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Venue Name</Label>
                <Input value={venueName} onChange={e => setVenueName(e.target.value)} className="bg-zinc-800 border-zinc-700 text-white mt-1" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Event Date</Label>
                <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="bg-zinc-800 border-zinc-700 text-white mt-1" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Validity (days)</Label>
                <Input type="number" value={validityDays} onChange={e => setValidityDays(e.target.value)} className="bg-zinc-800 border-zinc-700 text-white mt-1" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Contact Email</Label>
                <Input value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="bg-zinc-800 border-zinc-700 text-white mt-1" />
              </div>
            </div>

            {/* Line Items */}
            <h3 className="text-white font-medium mb-3">Line Items</h3>
            {itemsList.map((item, idx) => (
              <div key={idx} className="bg-zinc-800/50 rounded-lg p-3 mb-2 space-y-2">
                <div className="grid grid-cols-[1fr_1fr] gap-2">
                  <Input
                    placeholder="Category (e.g. Immersive LED Environments)"
                    value={item.category}
                    onChange={e => {
                      const n = [...itemsList];
                      n[idx].category = e.target.value;
                      setItemsList(n);
                    }}
                    className="bg-zinc-800 border-zinc-700 text-white text-sm"
                  />
                  <Input
                    placeholder="Line Item Title"
                    value={item.title}
                    onChange={e => {
                      const n = [...itemsList];
                      n[idx].title = e.target.value;
                      setItemsList(n);
                    }}
                    className="bg-zinc-800 border-zinc-700 text-white text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <Checkbox
                    id={`create-flat-${idx}`}
                    checked={item.is_flat_fee}
                    onCheckedChange={(v) => {
                      const n = [...itemsList];
                      n[idx].is_flat_fee = !!v;
                      setItemsList(n);
                    }}
                  />
                  <label htmlFor={`create-flat-${idx}`} className="text-xs text-zinc-400 cursor-pointer">Flat Fee</label>
                </div>
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center">
                  <Textarea
                    placeholder="Description"
                    value={item.description}
                    onChange={e => {
                      const n = [...itemsList];
                      n[idx].description = e.target.value;
                      setItemsList(n);
                    }}
                    className="bg-zinc-800 border-zinc-700 text-white text-sm min-h-[38px] resize-none"
                    rows={1}
                  />
                  {!item.is_flat_fee && (
                    <>
                      <Input
                        placeholder="Qty"
                        type="number"
                        value={item.quantity}
                        onChange={e => {
                          const n = [...itemsList];
                          n[idx].quantity = e.target.value;
                          setItemsList(n);
                        }}
                        className="bg-zinc-800 border-zinc-700 text-white text-sm w-16"
                        min="1"
                      />
                      <Input
                        placeholder="Unit"
                        value={item.unit}
                        onChange={e => {
                          const n = [...itemsList];
                          n[idx].unit = e.target.value;
                          setItemsList(n);
                        }}
                        className="bg-zinc-800 border-zinc-700 text-white text-sm w-28"
                      />
                    </>
                  )}
                  <Input
                    placeholder={item.is_flat_fee ? "Flat Fee Amount" : "Rate"}
                    type="number"
                    value={item.price}
                    onChange={e => {
                      const n = [...itemsList];
                      n[idx].price = e.target.value;
                      setItemsList(n);
                    }}
                    className="bg-zinc-800 border-zinc-700 text-white text-sm w-28"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setItemsList(itemsList.filter((_, i) => i !== idx))}
                    className="text-zinc-500 hover:text-red-400 h-9 w-9"
                    disabled={itemsList.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex gap-2 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setItemsList([...itemsList, { title: '', description: '', price: '', quantity: '1', category: '', unit: '', is_flat_fee: false }])}
                className="text-zinc-400 hover:text-white"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Item
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLibraryPicker(!showLibraryPicker)}
                className="text-zinc-400 hover:text-white"
              >
                <Library className="w-3 h-3 mr-1" /> From Library
              </Button>
            </div>

            {showLibraryPicker && (
              <div className="mb-6 bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                <h4 className="text-zinc-300 text-sm font-medium mb-3">Pick from Library</h4>
                <LineItemLibrary
                  compact
                  onSelect={(t) => {
                    setItemsList([...itemsList, {
                      title: t.title,
                      description: t.description || '',
                      price: String(t.price),
                      quantity: '1',
                      category: t.category || '',
                      unit: '',
                      is_flat_fee: false,
                    }]);
                    setShowLibraryPicker(false);
                    toast({ title: `Added "${t.title}"` });
                  }}
                />
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={handleCreate} disabled={saving} className="bg-white text-black hover:bg-zinc-200">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Proposal
              </Button>
              <Button variant="ghost" onClick={() => { setShowForm(false); resetForm(); }} className="text-zinc-400">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Proposals List */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500 mx-auto" />
          </div>
        ) : proposals.length === 0 ? (
          <p className="text-zinc-500 text-center py-12">No proposals yet. Create your first one above.</p>
        ) : (
          <div className="space-y-3">
            {proposals.map(p => (
              <div key={p.id} className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-medium truncate">{p.event_name}</h3>
                    <Badge className={`${statusColor(p.status)} text-white text-[10px] px-2`}>
                      {p.status}
                    </Badge>
                  </div>
                  <p className="text-zinc-500 text-sm truncate">
                    {p.client_name}
                    {p.venue_name && ` · ${p.venue_name}`}
                    {p.event_date && ` · ${format(new Date(p.event_date + 'T00:00:00'), 'MMM d, yyyy')}`}
                  </p>
                  {p.signed_at && (
                    <p className="text-green-400 text-xs mt-1">
                      Signed by {p.client_signature} on {format(new Date(p.signed_at), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {p.status === 'draft' && (
                    <Button variant="ghost" size="sm" onClick={() => markSent(p.id)} className="text-blue-400 hover:text-blue-300 text-xs">
                      Mark Sent
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => navigate(`/proposal/${p.token}?edit=true`)} className="text-zinc-400 hover:text-white">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => copyLink(p.token)} className="text-zinc-400 hover:text-white">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => window.open(`/proposal/${p.token}`, '_blank')} className="text-zinc-400 hover:text-white">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteProposal(p.id)} className="text-zinc-400 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        </>
        )}
      </main>
    </div>
  );
}
