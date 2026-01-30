import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Link2, Image, Upload, Loader2 } from 'lucide-react';

interface AddMoodBoardItemProps {
  sessionId: string;
  userName: string;
  onItemAdded: () => void;
}

export function AddMoodBoardItem({ sessionId, userName, onItemAdded }: AddMoodBoardItemProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('url');
  
  // URL form
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // File upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const detectUrlType = (url: string): 'pinterest' | 'instagram' | 'link' => {
    if (url.includes('pinterest.com') || url.includes('pin.it')) return 'pinterest';
    if (url.includes('instagram.com') || url.includes('instagr.am')) return 'instagram';
    return 'link';
  };

  const handleUrlSubmit = async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    if (!userName) {
      toast.error('Please enter your name first');
      return;
    }

    setLoading(true);
    const itemType = detectUrlType(url);

    const { error } = await supabase.from('mood_board_items').insert({
      session_id: sessionId,
      item_type: itemType,
      url: url.trim(),
      title: title.trim() || null,
      description: description.trim() || null,
      added_by: userName,
    });

    if (error) {
      toast.error('Failed to add item');
      console.error(error);
    } else {
      toast.success('Item added to mood board!');
      resetForm();
      onItemAdded();
    }
    setLoading(false);
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    if (!userName) {
      toast.error('Please enter your name first');
      return;
    }

    setLoading(true);

    for (const file of selectedFiles) {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${sessionId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Determine file type
      let itemType: 'image' | 'video' | 'pdf' = 'image';
      if (file.type.startsWith('video/')) itemType = 'video';
      else if (file.type === 'application/pdf') itemType = 'pdf';

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('creative-uploads')
        .upload(fileName, file);

      if (uploadError) {
        toast.error(`Failed to upload ${file.name}`);
        console.error(uploadError);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('creative-uploads')
        .getPublicUrl(fileName);

      // Create mood board item
      const { error: insertError } = await supabase.from('mood_board_items').insert({
        session_id: sessionId,
        item_type: itemType,
        file_url: urlData.publicUrl,
        title: file.name,
        added_by: userName,
      });

      if (insertError) {
        toast.error(`Failed to save ${file.name}`);
        console.error(insertError);
      }
    }

    toast.success(`${selectedFiles.length} file(s) uploaded!`);
    resetForm();
    onItemAdded();
    setLoading(false);
  };

  const resetForm = () => {
    setUrl('');
    setTitle('');
    setDescription('');
    setSelectedFiles([]);
    setOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add to Board
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Mood Board</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url" className="gap-2">
              <Link2 className="h-4 w-4" />
              URL
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste Pinterest, Instagram, or any URL..."
              />
              <p className="text-xs text-muted-foreground">
                Supports Pinterest pins, Instagram posts, and general links
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give it a name..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Notes (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Why does this inspire you?"
                rows={2}
              />
            </div>

            <Button 
              onClick={handleUrlSubmit} 
              disabled={loading} 
              className="w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add URL
            </Button>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4 mt-4">
            <div 
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,.pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Click to select files</p>
              <p className="text-xs text-muted-foreground mt-1">
                Images, videos, and PDFs
              </p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Selected files:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {selectedFiles.map((file, i) => (
                    <li key={i}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button 
              onClick={handleFileUpload} 
              disabled={loading || selectedFiles.length === 0} 
              className="w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
