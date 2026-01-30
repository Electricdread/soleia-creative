-- Create creative sessions table
CREATE TABLE public.creative_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  project_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  circleback_url TEXT,
  circleback_summary TEXT,
  technical_notes TEXT,
  creative_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create mood board items table (Pinterest, Instagram, uploaded files)
CREATE TABLE public.mood_board_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.creative_sessions(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('pinterest', 'instagram', 'image', 'video', 'pdf', 'link')),
  title TEXT,
  url TEXT,
  file_url TEXT,
  thumbnail_url TEXT,
  description TEXT,
  added_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sort_order INTEGER DEFAULT 0
);

-- Create reactions table for mood board items
CREATE TABLE public.mood_board_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.mood_board_items(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('love', 'fire', 'question', 'star')),
  reactor_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(item_id, reactor_name, reaction_type)
);

-- Create comments table for mood board items
CREATE TABLE public.mood_board_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.mood_board_items(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.mood_board_comments(id) ON DELETE CASCADE,
  commenter_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creative_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_board_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_board_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_board_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for creative_sessions (anyone with token can view)
CREATE POLICY "Anyone can view active creative sessions"
ON public.creative_sessions FOR SELECT
USING (is_active = true);

CREATE POLICY "Anyone can create creative sessions"
ON public.creative_sessions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update creative sessions"
ON public.creative_sessions FOR UPDATE
USING (is_active = true);

CREATE POLICY "Anyone can delete creative sessions"
ON public.creative_sessions FOR DELETE
USING (true);

-- RLS policies for mood_board_items
CREATE POLICY "Anyone can view mood board items for active sessions"
ON public.mood_board_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.creative_sessions
  WHERE creative_sessions.id = mood_board_items.session_id
  AND creative_sessions.is_active = true
));

CREATE POLICY "Anyone can insert mood board items for active sessions"
ON public.mood_board_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.creative_sessions
  WHERE creative_sessions.id = mood_board_items.session_id
  AND creative_sessions.is_active = true
));

CREATE POLICY "Anyone can update mood board items for active sessions"
ON public.mood_board_items FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.creative_sessions
  WHERE creative_sessions.id = mood_board_items.session_id
  AND creative_sessions.is_active = true
));

CREATE POLICY "Anyone can delete mood board items for active sessions"
ON public.mood_board_items FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.creative_sessions
  WHERE creative_sessions.id = mood_board_items.session_id
  AND creative_sessions.is_active = true
));

-- RLS policies for reactions
CREATE POLICY "Anyone can view reactions for active sessions"
ON public.mood_board_reactions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.mood_board_items
  JOIN public.creative_sessions ON creative_sessions.id = mood_board_items.session_id
  WHERE mood_board_items.id = mood_board_reactions.item_id
  AND creative_sessions.is_active = true
));

CREATE POLICY "Anyone can add reactions for active sessions"
ON public.mood_board_reactions FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.mood_board_items
  JOIN public.creative_sessions ON creative_sessions.id = mood_board_items.session_id
  WHERE mood_board_items.id = mood_board_reactions.item_id
  AND creative_sessions.is_active = true
));

CREATE POLICY "Anyone can remove reactions for active sessions"
ON public.mood_board_reactions FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.mood_board_items
  JOIN public.creative_sessions ON creative_sessions.id = mood_board_items.session_id
  WHERE mood_board_items.id = mood_board_reactions.item_id
  AND creative_sessions.is_active = true
));

-- RLS policies for comments
CREATE POLICY "Anyone can view comments for active sessions"
ON public.mood_board_comments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.mood_board_items
  JOIN public.creative_sessions ON creative_sessions.id = mood_board_items.session_id
  WHERE mood_board_items.id = mood_board_comments.item_id
  AND creative_sessions.is_active = true
));

CREATE POLICY "Anyone can add comments for active sessions"
ON public.mood_board_comments FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.mood_board_items
  JOIN public.creative_sessions ON creative_sessions.id = mood_board_items.session_id
  WHERE mood_board_items.id = mood_board_comments.item_id
  AND creative_sessions.is_active = true
));

CREATE POLICY "Anyone can update comments for active sessions"
ON public.mood_board_comments FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.mood_board_items
  JOIN public.creative_sessions ON creative_sessions.id = mood_board_items.session_id
  WHERE mood_board_items.id = mood_board_comments.item_id
  AND creative_sessions.is_active = true
));

CREATE POLICY "Anyone can delete comments for active sessions"
ON public.mood_board_comments FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.mood_board_items
  JOIN public.creative_sessions ON creative_sessions.id = mood_board_items.session_id
  WHERE mood_board_items.id = mood_board_comments.item_id
  AND creative_sessions.is_active = true
));

-- Create storage bucket for creative session uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('creative-uploads', 'creative-uploads', true);

-- Storage policies for creative uploads
CREATE POLICY "Anyone can view creative uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'creative-uploads');

CREATE POLICY "Anyone can upload to creative uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'creative-uploads');

CREATE POLICY "Anyone can delete creative uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'creative-uploads');

-- Enable realtime for collaborative features
ALTER PUBLICATION supabase_realtime ADD TABLE public.mood_board_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mood_board_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mood_board_comments;

-- Add updated_at trigger
CREATE TRIGGER update_creative_sessions_updated_at
BEFORE UPDATE ON public.creative_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mood_board_comments_updated_at
BEFORE UPDATE ON public.mood_board_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();