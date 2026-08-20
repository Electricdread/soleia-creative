import { supabase } from '@/integrations/supabase/client';
import { getPublicOrigin } from '@/lib/ogShare';
import { generateProposalPdf } from '@/lib/proposalPdfGenerator';

/**
 * Email the signed PDF for a proposal that is already signed.
 *
 * The signing flow builds and sends this PDF once, at the moment the client
 * signs. That leaves no way to get it to someone who was not on the list then —
 * a project manager assigned afterwards, or a copy that never arrived. This
 * rebuilds the same PDF from current data and sends it again, without touching
 * the signature.
 *
 * The PDF is built in the browser because the generator is a browser library;
 * there is no server-side equivalent.
 */

export interface SignedProposalTarget {
  token: string;
  event_name: string;
  client_name: string;
  venue_name?: string | null;
  event_date?: string | null;
  quote_date?: string;
  validity_days?: number;
  contact_email?: string | null;
  signed_at?: string | null;
  client_signature?: string | null;
  status?: string;
  proposal_scenario?: 'pre_call_packet' | 'pre_packet_no_call' | 'direct_quote' | null;
  is_pre_call_packet?: boolean | null;
  client_email?: string | null;
  assigned_pm_name?: string | null;
  assigned_pm_email?: string | null;
}

export interface SignedProposalDelivery {
  delivered: string[];
  failed: { to: string; error: string }[];
  /** True while Resend is on its sandbox sender, which only reaches the account owner. */
  sandbox: boolean;
}

export async function sendSignedProposalEmail(
  proposal: SignedProposalTarget,
): Promise<SignedProposalDelivery> {
  if (!proposal.signed_at) throw new Error('This proposal is not signed yet.');

  const [itemsRes, galleryRes, timelineRes] = await Promise.all([
    supabase.rpc('get_proposal_items_by_token', { p_token: proposal.token }),
    supabase.rpc('get_proposal_gallery_by_token', { p_token: proposal.token }),
    supabase.rpc('get_proposal_timeline_by_token', { p_token: proposal.token }),
  ]);

  const items = (itemsRes.data as any[]) || [];
  if (items.length === 0) {
    // The token RPCs only return a proposal that is active, so an empty list
    // here usually means the link is switched off rather than truly empty.
    throw new Error('Could not read the proposal line items — check the link is still active.');
  }

  const gallery = (galleryRes.data as any[]) || [];
  const timeline = (timelineRes.data as any[]) || [];

  const pdf = await generateProposalPdf(
    proposal as any,
    items as any,
    timeline as any,
    gallery?.[0]?.image_url || null,
    gallery as any,
    { returnBase64: true },
  );

  const { data, error } = await supabase.functions.invoke('send-signed-proposal', {
    body: {
      event_name: proposal.event_name,
      client_name: proposal.client_name,
      client_signature: proposal.client_signature,
      client_email: proposal.client_email || null,
      venue_name: proposal.venue_name,
      event_date: proposal.event_date,
      proposal_url: `${getPublicOrigin()}/proposal/${proposal.token}`,
      assigned_pm_name: proposal.assigned_pm_name || null,
      assigned_pm_email: proposal.assigned_pm_email || null,
      pdf_base64: (pdf as { base64: string }).base64,
      pdf_filename: (pdf as { filename: string }).filename,
    },
  });

  if (error) throw error;

  const report = (data || {}) as Partial<SignedProposalDelivery>;
  return {
    delivered: report.delivered || [],
    failed: report.failed || [],
    sandbox: Boolean(report.sandbox),
  };
}
