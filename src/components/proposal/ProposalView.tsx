import { useState, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import soleiaLogo from '@/assets/soleia-wide-logo.png';

interface ProposalViewProps {
  proposal: any;
  items: any[];
  gallery: any[];
  timeline: any[];
}

export default function ProposalView({ proposal, items, gallery, timeline }: ProposalViewProps) {
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [clientName, setClientName] = useState('');
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(!!proposal.signed_at);

  const total = useMemo(() => {
    return items
      .filter(i => selectedIds.has(i.id))
      .reduce((sum, i) => sum + Number(i.price), 0);
  }, [selectedIds, items]);

  const toggleItem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
    } catch (e: any) {
      toast({ title: 'Failed to sign', description: e.message, variant: 'destructive' });
    } finally {
      setSigning(false);
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
          {proposal.venue_name && (
            <span className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
              {proposal.venue_name}
            </span>
          )}
        </header>

        {/* Event Title & Info */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-light text-[#2c3e50] mb-1">{proposal.event_name}</h1>
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
        <div className="space-y-1 mb-10">
          {items.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-lg p-5 flex items-start gap-4 border border-[#ecf0f1] hover:border-[#bdc3c7] transition-colors cursor-pointer"
              onClick={() => !signed && toggleItem(item.id)}
            >
              {!signed && (
                <Checkbox
                  checked={selectedIds.has(item.id)}
                  onCheckedChange={() => toggleItem(item.id)}
                  className="mt-1"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[#2c3e50] mb-1">{item.title}</h3>
                {item.description && (
                  <p className="text-sm text-[#7f8c8d] whitespace-pre-line">{item.description}</p>
                )}
              </div>
              <span className="text-lg font-semibold text-[#2c3e50] flex-shrink-0">
                {formatCurrency(Number(item.price))}
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="bg-white rounded-lg p-5 border border-[#ecf0f1] mb-4 flex items-center justify-between">
          <span className="text-[#7f8c8d] font-medium">Quote Total</span>
          <span className="text-2xl font-bold text-[#2c3e50]">{formatCurrency(total)}</span>
        </div>

        {/* Sign Section */}
        {!signed ? (
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
        ) : (
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
        )}

        {/* Gallery */}
        {gallery.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-[#2c3e50] mb-6 border-b border-[#ecf0f1] pb-2">Gallery</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gallery.map(img => (
                <div key={img.id} className="bg-white rounded-lg overflow-hidden border border-[#ecf0f1] shadow-sm">
                  <img
                    src={img.image_url}
                    alt={img.caption || ''}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />
                  {img.caption && (
                    <p className="p-3 text-sm text-[#7f8c8d]">{img.caption}</p>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-[#95a5a6] mt-4 italic">
              These mockups are references for creative direction. The final design is rebuilt and realized for production.
            </p>
          </section>
        )}

        {/* Timeline */}
        {timeline.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-[#2c3e50] mb-4 border-b border-[#ecf0f1] pb-2">Project Timeline</h2>
            <div className="bg-white rounded-lg border border-[#ecf0f1] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-[#ecf0f1]">
                    <th className="text-left p-3 font-semibold text-[#7f8c8d]">Phase</th>
                    <th className="text-left p-3 font-semibold text-[#7f8c8d]">Duration</th>
                    <th className="text-left p-3 font-semibold text-[#7f8c8d]">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {timeline.map(phase => (
                    <tr key={phase.id} className="border-b border-[#ecf0f1] last:border-0">
                      <td className="p-3 font-medium text-[#2c3e50]">{phase.phase}</td>
                      <td className="p-3 text-[#7f8c8d]">{phase.duration}</td>
                      <td className="p-3 text-[#7f8c8d]">{phase.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

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
            <a href={`mailto:${proposal.contact_email || 'info@soleia-creative.com'}`} className="text-[#3498db] underline">
              {proposal.contact_email || 'info@soleia-creative.com'}
            </a>
          </p>
        </section>

        {/* Terms */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-[#2c3e50] mb-4 border-b border-[#ecf0f1] pb-2">Terms</h2>
          <div className="bg-white rounded-lg p-5 border border-[#ecf0f1] text-sm text-[#34495e] space-y-4">
            <div>
              <h4 className="font-semibold mb-1">New Assets</h4>
              <p className="text-[#7f8c8d]">New assets provided by the client will require a new estimate.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Scope Changes</h4>
              <ul className="text-[#7f8c8d] list-disc pl-5 space-y-1">
                <li>Items not explicitly defined in this proposal are outside the current scope.</li>
                <li>Additional requests will require a separate estimate and written approval.</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Revisions</h4>
              <ul className="text-[#7f8c8d] list-disc pl-5 space-y-1">
                <li>Includes <strong>one</strong> revision round within the approved creative direction and existing elements.</li>
                <li>Revision requests must be submitted in writing.</li>
                <li>Requests must be received no later than <strong>7 days prior to the event date</strong>.</li>
                <li>Changes affecting the concept, direction, or new components require a new quote.</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Third-Party Assets</h4>
              <ul className="text-[#7f8c8d] list-disc pl-5 space-y-1">
                <li>Fonts, stock media, music, plugins, or other licensed materials are not included unless stated.</li>
                <li>Required purchases will be billed to the client.</li>
                <li>Usage rights follow the original supplier's license terms.</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Usage Rights</h4>
              <p className="text-[#7f8c8d]">Upon full payment, the client receives the rights to use the final approved deliverables.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Promotional Use</h4>
              <ul className="text-[#7f8c8d] list-disc pl-5 space-y-1">
                <li>Photo or video documentation of the production may be used for portfolio, website, and social media.</li>
                <li>If usage is not permitted, written notice must be sent upon proposal approval.</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Cancellation</h4>
              <p className="text-[#7f8c8d]">If the project is canceled after work has started, time and work completed up to the cancellation date will be invoiced.</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pt-8 pb-12 border-t border-[#ecf0f1]">
          <img src={soleiaLogo} alt="Soleia" className="h-8 mx-auto opacity-40" />
        </footer>
      </div>
    </div>
  );
}
