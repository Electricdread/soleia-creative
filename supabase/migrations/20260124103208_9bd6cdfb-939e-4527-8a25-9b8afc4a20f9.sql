-- Create storage bucket for video clips
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('clips', 'clips', true, 524288000)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for preview videos (compressed)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('clip-previews', 'clip-previews', true, 104857600)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to clips bucket
CREATE POLICY "Public read access for clips"
ON storage.objects
FOR SELECT
USING (bucket_id = 'clips');

-- Allow anyone to upload clips
CREATE POLICY "Anyone can upload clips"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'clips');

-- Allow anyone to delete their clips
CREATE POLICY "Anyone can delete clips from storage"
ON storage.objects
FOR DELETE
USING (bucket_id = 'clips');

-- Allow public read access to clip previews bucket
CREATE POLICY "Public read access for clip previews"
ON storage.objects
FOR SELECT
USING (bucket_id = 'clip-previews');

-- Allow anyone to upload clip previews
CREATE POLICY "Anyone can upload clip previews"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'clip-previews');

-- Allow anyone to delete clip previews
CREATE POLICY "Anyone can delete clip previews"
ON storage.objects
FOR DELETE
USING (bucket_id = 'clip-previews');