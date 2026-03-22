import { useState, useEffect } from 'react';
import { Building2, Users, UserCircle, DollarSign, FileCheck, Activity, ExternalLink, RefreshCw, Loader2, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ScrapedEventData {
  event_name: string;
  event_date: string;
  event_time: string;
  guaranteed_guests: string;
  expected_guests: string;
  venue: string;
  venue_address: string;
  venue_phone: string;
  managers: { name: string; email: string }[];
  recent_activity: { description: string; time_ago: string; by: string }[];
  signed_documents: { title: string; signed_on: string }[];
  payments: { amount: string; due: string; status: string; method: string; title: string }[];
  grand_total: string;
  total_outstanding: string;
}

function extractTripleseatUrl(description: string): string | null {
  if (!description) return null;
  const match = description.match(/https?:\/\/[^\s]*tripleseat\.com[^\s]*/i);
  return match ? match[0] : null;
}

export function EventTripleseatDetails({ description, eventUid }: { description: string; eventUid: string }) {
  const tripleseatUrl = extractTripleseatUrl(description);
  const [data, setData] = useState<ScrapedEventData | null>(null);
  const [loading, setLoading] = useState(false);
  const [cached, setCached] = useState(false);

  const fetchDetails = async (forceRefresh = false) => {
    if (!tripleseatUrl) return;
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('scrape-tripleseat-event', {
        body: { tripleseat_url: tripleseatUrl, event_uid: eventUid, force_refresh: forceRefresh },
      });
      if (error) throw error;
      if (result?.success && result.data) {
        setData(result.data);
        setCached(result.cached);
      }
    } catch (e) {
      console.error('Failed to fetch Triple Seat details:', e);
      if (forceRefresh) toast.error('Failed to refresh event details');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (tripleseatUrl) fetchDetails();
  }, [tripleseatUrl, eventUid]);

  if (!tripleseatUrl) {
    return (
      <p className="text-xs text-[#8a7d6b] italic">No Triple Seat link found in event description.</p>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-[#c49a3c]" />
        <span className="ml-2 text-xs text-[#8a7d6b]">Loading event details...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-6 space-y-2">
        <p className="text-xs text-[#8a7d6b]">Could not load event details.</p>
        <Button variant="outline" size="sm" onClick={() => fetchDetails(true)} className="text-xs border-[#d6cfc3]">
          Try Again
        </Button>
      </div>
    );
  }

  const hasGuests = data.guaranteed_guests || data.expected_guests;
  const hasManagers = data.managers && data.managers.length > 0;
  const hasPayments = data.payments && data.payments.length > 0;
  const hasDocuments = data.signed_documents && data.signed_documents.length > 0;
  const hasActivity = data.recent_activity && data.recent_activity.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-[#5a4f3f] uppercase tracking-wider flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-[#c49a3c]" />
          Event Details
        </h4>
        <div className="flex items-center gap-1.5">
          {cached && <span className="text-[9px] text-[#b5ab9a]">cached</span>}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-[#8a7d6b] hover:text-[#5a4f3f]"
            onClick={() => fetchDetails(true)}
            disabled={loading}
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[10px] gap-1 border-[#d6cfc3] text-[#5a4f3f] hover:bg-[#f0ece4]"
            onClick={() => window.open(tripleseatUrl, '_blank')}
          >
            <ExternalLink className="w-3 h-3" />
            Open
          </Button>
        </div>
      </div>

      {/* Guest Counts */}
      {hasGuests && (
        <div className="bg-[#faf8f5] rounded-lg p-3 border border-[#e8e2d8]">
          <div className="flex items-center gap-1.5 mb-2">
            <Users className="w-3.5 h-3.5 text-[#c49a3c]" />
            <span className="text-[10px] font-semibold text-[#5a4f3f] uppercase tracking-wider">Guests</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {data.guaranteed_guests && (
              <div>
                <span className="text-lg font-bold text-[#3d3629]">{data.guaranteed_guests}</span>
                <span className="text-[10px] text-[#8a7d6b] block">Guaranteed</span>
              </div>
            )}
            {data.expected_guests && (
              <div>
                <span className="text-lg font-bold text-[#3d3629]">{data.expected_guests}</span>
                <span className="text-[10px] text-[#8a7d6b] block">Expected</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Event Managers */}
      {hasManagers && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <UserCircle className="w-3.5 h-3.5 text-[#c49a3c]" />
            <span className="text-[10px] font-semibold text-[#5a4f3f] uppercase tracking-wider">Event Managers</span>
          </div>
          <div className="space-y-2">
            {data.managers.map((m, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-[#faf8f5] border border-[#e8e2d8]">
                <div className="w-7 h-7 rounded-full bg-[#c49a3c]/10 flex items-center justify-center text-[10px] font-semibold text-[#c49a3c]">
                  {m.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium text-[#3d3629] block truncate">{m.name}</span>
                  <a href={`mailto:${m.email}`} className="text-[10px] text-[#c49a3c] hover:underline flex items-center gap-0.5 truncate">
                    <Mail className="w-2.5 h-2.5 shrink-0" /> {m.email}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Venue Info */}
      {(data.venue_address || data.venue_phone) && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <MapPin className="w-3.5 h-3.5 text-[#c49a3c]" />
            <span className="text-[10px] font-semibold text-[#5a4f3f] uppercase tracking-wider">Venue</span>
          </div>
          <div className="space-y-1 text-xs text-[#3d3629]">
            {data.venue_address && <p>{data.venue_address}</p>}
            {data.venue_phone && (
              <a href={`tel:${data.venue_phone}`} className="flex items-center gap-1 text-[#8a7d6b] hover:text-[#c49a3c]">
                <Phone className="w-3 h-3" /> {data.venue_phone}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Financials */}
      {(data.grand_total || hasPayments) && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <DollarSign className="w-3.5 h-3.5 text-[#c49a3c]" />
            <span className="text-[10px] font-semibold text-[#5a4f3f] uppercase tracking-wider">Financials</span>
          </div>
          {data.grand_total && (
            <div className="bg-[#faf8f5] rounded-lg p-3 border border-[#e8e2d8] mb-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#8a7d6b]">Grand Total</span>
                <span className="text-sm font-bold text-[#3d3629]">{data.grand_total}</span>
              </div>
              {data.total_outstanding && (
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-[#8a7d6b]">Outstanding</span>
                  <span className={`text-sm font-bold ${data.total_outstanding === '$0.00' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {data.total_outstanding}
                  </span>
                </div>
              )}
            </div>
          )}
          {hasPayments && (
            <div className="space-y-1">
              {data.payments.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] py-1 border-b border-[#f0ebe3] last:border-b-0">
                  <span className="text-[#3d3629] truncate flex-1 mr-2">{p.title || p.method || 'Payment'}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`font-medium ${p.status === 'Paid' ? 'text-emerald-600' : 'text-[#3d3629]'}`}>{p.amount}</span>
                    {p.status && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                        p.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>{p.status}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Signed Documents */}
      {hasDocuments && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <FileCheck className="w-3.5 h-3.5 text-[#c49a3c]" />
            <span className="text-[10px] font-semibold text-[#5a4f3f] uppercase tracking-wider">Signed Documents</span>
          </div>
          <div className="space-y-1.5">
            {data.signed_documents.map((doc, i) => (
              <div key={i} className="py-1.5 px-2 rounded-md bg-emerald-50 border border-emerald-100">
                <span className="text-xs font-medium text-emerald-800 block">{doc.title}</span>
                <span className="text-[10px] text-emerald-600">{doc.signed_on}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {hasActivity && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Activity className="w-3.5 h-3.5 text-[#c49a3c]" />
            <span className="text-[10px] font-semibold text-[#5a4f3f] uppercase tracking-wider">Recent Activity</span>
          </div>
          <div className="space-y-2">
            {data.recent_activity.slice(0, 5).map((a, i) => (
              <div key={i} className="flex gap-2 py-1 border-b border-[#f0ebe3] last:border-b-0">
                <div className="w-1.5 h-1.5 rounded-full bg-[#c49a3c] mt-1.5 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[11px] text-[#3d3629] block">{a.description}</span>
                  <span className="text-[10px] text-[#8a7d6b]">{a.time_ago} · {a.by}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
