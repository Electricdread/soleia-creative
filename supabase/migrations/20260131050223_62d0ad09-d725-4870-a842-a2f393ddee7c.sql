-- Add is_public column to client_links table
ALTER TABLE public.client_links 
ADD COLUMN is_public boolean NOT NULL DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.client_links.is_public IS 'When true, the session link is publicly accessible without authentication';