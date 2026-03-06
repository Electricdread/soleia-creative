
-- Proposals table
CREATE TABLE public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  event_name text NOT NULL,
  client_name text NOT NULL,
  venue_name text,
  event_date date,
  quote_date date NOT NULL DEFAULT CURRENT_DATE,
  validity_days integer NOT NULL DEFAULT 7,
  contact_email text DEFAULT 'info@show-blox.com',
  status text NOT NULL DEFAULT 'draft',
  client_signature text,
  signed_at timestamptz,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

-- Proposal line items
CREATE TABLE public.proposal_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Proposal gallery images
CREATE TABLE public.proposal_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Proposal timeline phases
CREATE TABLE public.proposal_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  phase text NOT NULL,
  duration text NOT NULL,
  details text,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_timeline ENABLE ROW LEVEL SECURITY;

-- Public read for active proposals (clients access via token)
CREATE POLICY "Anyone can view active proposals" ON public.proposals FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage proposals" ON public.proposals FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Items/gallery/timeline readable if proposal is active
CREATE POLICY "Anyone can view proposal items" ON public.proposal_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.proposals WHERE proposals.id = proposal_items.proposal_id AND proposals.is_active = true));
CREATE POLICY "Admins can manage proposal items" ON public.proposal_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view proposal gallery" ON public.proposal_gallery FOR SELECT USING (EXISTS (SELECT 1 FROM public.proposals WHERE proposals.id = proposal_gallery.proposal_id AND proposals.is_active = true));
CREATE POLICY "Admins can manage proposal gallery" ON public.proposal_gallery FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view proposal timeline" ON public.proposal_timeline FOR SELECT USING (EXISTS (SELECT 1 FROM public.proposals WHERE proposals.id = proposal_timeline.proposal_id AND proposals.is_active = true));
CREATE POLICY "Admins can manage proposal timeline" ON public.proposal_timeline FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow anonymous updates for client signature
CREATE POLICY "Anyone can sign active proposals" ON public.proposals FOR UPDATE USING (is_active = true AND status = 'sent') WITH CHECK (is_active = true);
