import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ArrowLeft } from 'lucide-react';
import ProposalView from '@/components/proposal/ProposalView';
import ClearCacheButton from '@/components/ClearCacheButton';
import { Button } from '@/components/ui/button';

export default function ClientProposal() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [proposal, setProposal] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = searchParams.get('edit') === 'true' && isAdmin;

  const load = async () => {
    if (!token) return;
    setLoading(true);
    const { data: pRows, error: pErr } = await supabase
      .rpc('get_proposal_by_token', { p_token: token });

    const p = Array.isArray(pRows) ? pRows[0] : pRows;
    if (pErr || !p) {
      setError('Proposal not found or has expired.');
      setLoading(false);
      return;
    }
    setProposal(p);

    const [itemsRes, galleryRes, timelineRes] = await Promise.all([
      supabase.from('proposal_items').select('*').eq('proposal_id', p.id).order('sort_order'),
      supabase.from('proposal_gallery').select('*').eq('proposal_id', p.id).order('sort_order'),
      supabase.from('proposal_timeline').select('*').eq('proposal_id', p.id).order('sort_order'),
    ]);

    setItems(itemsRes.data || []);
    setGallery(galleryRes.data || []);
    setTimeline(timelineRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h1 className="font-display text-2xl text-foreground mb-2">Proposal Not Found</h1>
          <p className="text-muted-foreground mb-6">{error || 'This proposal may have expired or been removed.'}</p>
          <p className="text-sm text-muted-foreground mb-4">If you have seen this page before, your browser may be showing an older version.</p>
          <ClearCacheButton label="Clear cache & reload" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
        className="fixed top-4 left-4 z-50 gap-2 bg-background/80 backdrop-blur-md border border-border text-foreground hover:bg-muted print:hidden min-h-[44px]"
        aria-label="Back"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Back</span>
      </Button>
      <ProposalView
        proposal={proposal}
        items={items}
        gallery={gallery}
        timeline={timeline}
        isAdmin={isEditMode}
        onRefresh={load}
      />
    </>
  );
}
