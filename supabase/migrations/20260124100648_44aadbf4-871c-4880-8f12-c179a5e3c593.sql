-- Drop restrictive policies
DROP POLICY IF EXISTS "Admins can delete clips" ON public.cached_clips;
DROP POLICY IF EXISTS "Admins can insert clips" ON public.cached_clips;
DROP POLICY IF EXISTS "Admins can update clips" ON public.cached_clips;

-- Create permissive policies for public access
CREATE POLICY "Anyone can insert clips"
ON public.cached_clips
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update clips"
ON public.cached_clips
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete clips"
ON public.cached_clips
FOR DELETE
USING (true);