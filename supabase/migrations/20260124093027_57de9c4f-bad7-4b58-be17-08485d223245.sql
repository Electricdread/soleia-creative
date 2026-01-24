-- Allow anyone to insert clips (for admin functionality)
-- In production, this should be restricted to authenticated admin users
CREATE POLICY "Anyone can insert clips" 
ON public.cached_clips 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to delete clips (for admin functionality)
-- In production, this should be restricted to authenticated admin users
CREATE POLICY "Anyone can delete clips" 
ON public.cached_clips 
FOR DELETE 
USING (true);