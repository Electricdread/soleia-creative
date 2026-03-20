
-- Scenes/looks table for organizing mood board items
CREATE TABLE public.session_scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.creative_sessions(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.session_scenes ENABLE ROW LEVEL SECURITY;

-- Public read for active sessions
CREATE POLICY "Anyone can view scenes for active sessions"
  ON public.session_scenes FOR SELECT
  TO public
  USING (EXISTS (
    SELECT 1 FROM creative_sessions
    WHERE creative_sessions.id = session_scenes.session_id
    AND creative_sessions.is_active = true
  ));

-- Admins can manage
CREATE POLICY "Admins can manage scenes"
  ON public.session_scenes FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add scene_id column to mood_board_items
ALTER TABLE public.mood_board_items
  ADD COLUMN scene_id uuid REFERENCES public.session_scenes(id) ON DELETE SET NULL;
