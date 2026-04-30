import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import ProposalView from '@/components/proposal/ProposalView';
import { HomeButton } from '@/components/HomeButton';

export default function ClientProposal() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
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
    const { data: p, error: pErr } = await supabase
      .from('proposals')
      .select('*')
      .eq('token', token)
      .eq('is_active', true)
      .maybeSingle();

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Proposal Not Found</h1>
          <p className="text-muted-foreground">{error || 'This proposal may have expired or been removed.'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <HomeButton variant="floating" />
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
