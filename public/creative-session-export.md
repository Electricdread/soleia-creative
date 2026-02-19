# Creative Session Module — Full Export
> Copy-paste ready for new projects. Stack: React + TypeScript + Supabase + Tailwind + shadcn/ui + framer-motion

---

## 1. DATABASE SCHEMA (run in Supabase SQL Editor)

```sql
-- Creative Sessions table
CREATE TABLE public.creative_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  project_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  circleback_url TEXT NULL,
  circleback_summary TEXT NULL,
  technical_notes TEXT NULL,
  creative_notes TEXT NULL,
  cover_images JSONB NULL,
  cover_themes TEXT[] NULL,
  cover_generated_at TIMESTAMPTZ NULL,
  featured_images JSONB NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.creative_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public sessions are viewable by everyone"
  ON public.creative_sessions FOR SELECT
  USING (is_public = true OR is_active = true);

CREATE POLICY "Admins can manage sessions"
  ON public.creative_sessions FOR ALL
  USING (true);

-- Mood Board Items
CREATE TABLE public.mood_board_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.creative_sessions(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- 'image' | 'video' | 'pdf' | 'pinterest' | 'instagram' | 'link'
  title TEXT NULL,
  url TEXT NULL,
  file_url TEXT NULL,
  thumbnail_url TEXT NULL,
  description TEXT NULL,
  added_by TEXT NULL,
  sort_order INT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mood_board_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view mood board items" ON public.mood_board_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert mood board items" ON public.mood_board_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete mood board items" ON public.mood_board_items FOR DELETE USING (true);

-- Mood Board Reactions
CREATE TABLE public.mood_board_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.mood_board_items(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL, -- 'love' | 'fire' | 'question' | 'star'
  reactor_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mood_board_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage reactions" ON public.mood_board_reactions FOR ALL USING (true);

-- Mood Board Comments
CREATE TABLE public.mood_board_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.mood_board_items(id) ON DELETE CASCADE,
  commenter_name TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID NULL REFERENCES public.mood_board_comments(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mood_board_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage comments" ON public.mood_board_comments FOR ALL USING (true);

-- Storage bucket for uploaded files
INSERT INTO storage.buckets (id, name, public) VALUES ('creative-uploads', 'creative-uploads', true);
CREATE POLICY "Anyone can upload to creative-uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'creative-uploads');
CREATE POLICY "Anyone can view creative-uploads" ON storage.objects FOR SELECT USING (bucket_id = 'creative-uploads');
```

---

## 2. ROUTES TO ADD (in your router)

```tsx
import CreativeSession from '@/pages/CreativeSession';

// Add these routes:
<Route path="/creative/:token" element={<CreativeSession />} />
```

---

## 3. PAGE: src/pages/CreativeSession.tsx

```tsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, User } from 'lucide-react';
import { CreativeSessionCover } from '@/components/creative/CreativeSessionCover';
import { MoodBoardItem } from '@/components/creative/MoodBoardItem';
import { AddMoodBoardItem } from '@/components/creative/AddMoodBoardItem';
// Replace with your own logo:
// import yourLogo from '@/assets/your-logo.png';

interface CoverImage {
  url: string;
  theme: string;
  prompt: string;
}

interface CreativeSessionData {
  id: string;
  project_name: string;
  client_name: string;
  circleback_url: string | null;
  circleback_summary: string | null;
  technical_notes: string | null;
  creative_notes: string | null;
  created_at: string;
  cover_images?: CoverImage[] | null;
  featured_images?: CoverImage[] | null;
}

interface MoodBoardItemData {
  id: string;
  item_type: string;
  title: string | null;
  url: string | null;
  file_url: string | null;
  thumbnail_url: string | null;
  description: string | null;
  added_by: string | null;
  created_at: string;
}

interface Reaction {
  id: string;
  item_id: string;
  reaction_type: string;
  reactor_name: string;
}

interface Comment {
  id: string;
  item_id: string;
  commenter_name: string;
  content: string;
  created_at: string;
  parent_id: string | null;
}

export default function CreativeSession() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<CreativeSessionData | null>(null);
  const [items, setItems] = useState<MoodBoardItemData[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [userName, setUserName] = useState(() =>
    localStorage.getItem('creative_session_name') || ''
  );

  useEffect(() => {
    if (token) fetchSession();
  }, [token]);

  useEffect(() => {
    if (session?.id) {
      fetchItems();
      fetchReactions();
      fetchComments();
      setupRealtime();
    }
  }, [session?.id]);

  useEffect(() => {
    if (userName) localStorage.setItem('creative_session_name', userName);
  }, [userName]);

  const fetchSession = async () => {
    const { data, error } = await supabase
      .from('creative_sessions')
      .select('*')
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      toast.error('Session not found or has expired');
      setLoading(false);
      return;
    }

    const sessionData: CreativeSessionData = {
      ...data,
      cover_images: data.cover_images as unknown as CoverImage[] | null,
      featured_images: data.featured_images as unknown as CoverImage[] | null,
    };

    setSession(sessionData);
    setLoading(false);
  };

  const fetchItems = async () => {
    if (!session?.id) return;
    const { data } = await supabase
      .from('mood_board_items')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: false });
    setItems(data || []);
  };

  const fetchReactions = async () => {
    if (!session?.id) return;
    const { data } = await supabase
      .from('mood_board_reactions')
      .select('*, mood_board_items!inner(session_id)')
      .eq('mood_board_items.session_id', session.id);
    setReactions(data?.map(r => ({
      id: r.id, item_id: r.item_id,
      reaction_type: r.reaction_type, reactor_name: r.reactor_name,
    })) || []);
  };

  const fetchComments = async () => {
    if (!session?.id) return;
    const { data } = await supabase
      .from('mood_board_comments')
      .select('*, mood_board_items!inner(session_id)')
      .eq('mood_board_items.session_id', session.id)
      .order('created_at', { ascending: true });
    setComments(data?.map(c => ({
      id: c.id, item_id: c.item_id, commenter_name: c.commenter_name,
      content: c.content, created_at: c.created_at, parent_id: c.parent_id,
    })) || []);
  };

  const setupRealtime = () => {
    const channel = supabase
      .channel(`creative-session-${session?.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mood_board_items' }, fetchItems)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mood_board_reactions' }, fetchReactions)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mood_board_comments' }, fetchComments)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  };

  const deleteItem = async (itemId: string) => {
    const { error } = await supabase.from('mood_board_items').delete().eq('id', itemId);
    if (error) toast.error('Failed to delete item');
    else fetchItems();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black">
        <Card className="max-w-md w-full bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-bold mb-2 text-white">SESSION NOT FOUND</h2>
            <p className="text-zinc-400 text-sm">
              This creative session doesn't exist or has been deactivated.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black font-mono">
      {/* Header — replace logo src with your own */}
      <div className="relative h-32 sm:h-40 overflow-hidden bg-gradient-to-b from-zinc-900 to-black">
        <div className="absolute inset-0 flex items-center justify-center">
          {/* <img src={yourLogo} alt="Logo" className="h-16 sm:h-20 w-auto object-contain opacity-80" /> */}
          <span className="text-2xl font-bold text-white opacity-80">YOUR BRAND</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black" />
        <div className="absolute bottom-4 left-4 sm:left-6">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-cyan-400">
            Creative Sessions
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <CreativeSessionCover session={session} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="userName" className="flex items-center gap-2 text-xs uppercase tracking-wider text-cyan-400">
              <User className="h-3.5 w-3.5" />
              Your Identifier
            </Label>
            <Input
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter name to collaborate..."
              className="h-12 sm:h-10 text-base sm:text-sm bg-zinc-900/80 border-zinc-700 focus:border-cyan-500/50 placeholder:text-zinc-600"
            />
          </div>
          <AddMoodBoardItem sessionId={session.id} userName={userName} onItemAdded={fetchItems} />
        </div>

        {items.length === 0 ? (
          <Card className="bg-zinc-900/60 border-zinc-800 border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-zinc-500 text-sm uppercase tracking-wider">No items yet</p>
              <p className="text-zinc-600 text-xs mt-2">Add Pinterest pins, Instagram posts, or upload files</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {items.map((item) => (
              <MoodBoardItem
                key={item.id}
                item={item}
                reactions={reactions.filter((r) => r.item_id === item.id)}
                comments={comments.filter((c) => c.item_id === item.id)}
                userName={userName}
                onDelete={deleteItem}
                onReactionChange={fetchReactions}
                onCommentChange={fetchComments}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 4. COMPONENT: src/components/creative/AddMoodBoardItem.tsx

```tsx
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
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const detectUrlType = (url: string): 'pinterest' | 'instagram' | 'link' => {
    if (url.includes('pinterest.com') || url.includes('pin.it')) return 'pinterest';
    if (url.includes('instagram.com') || url.includes('instagr.am')) return 'instagram';
    return 'link';
  };

  const handleUrlSubmit = async () => {
    if (!url.trim()) { toast.error('Please enter a URL'); return; }
    if (!userName) { toast.error('Please enter your name first'); return; }
    setLoading(true);
    const { error } = await supabase.from('mood_board_items').insert({
      session_id: sessionId,
      item_type: detectUrlType(url),
      url: url.trim(),
      title: title.trim() || null,
      description: description.trim() || null,
      added_by: userName,
    });
    if (error) toast.error('Failed to add item');
    else { toast.success('Item added!'); resetForm(); onItemAdded(); }
    setLoading(false);
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) { toast.error('Please select files'); return; }
    if (!userName) { toast.error('Please enter your name first'); return; }
    setLoading(true);
    for (const file of selectedFiles) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${sessionId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
      let itemType: 'image' | 'video' | 'pdf' = 'image';
      if (file.type.startsWith('video/')) itemType = 'video';
      else if (file.type === 'application/pdf') itemType = 'pdf';
      const { error: uploadError } = await supabase.storage.from('creative-uploads').upload(fileName, file);
      if (uploadError) { toast.error(`Failed to upload ${file.name}`); continue; }
      const { data: urlData } = supabase.storage.from('creative-uploads').getPublicUrl(fileName);
      await supabase.from('mood_board_items').insert({
        session_id: sessionId, item_type: itemType,
        file_url: urlData.publicUrl, title: file.name, added_by: userName,
      });
    }
    toast.success(`${selectedFiles.length} file(s) uploaded!`);
    resetForm(); onItemAdded(); setLoading(false);
  };

  const resetForm = () => {
    setUrl(''); setTitle(''); setDescription(''); setSelectedFiles([]); setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 h-12 sm:h-10 px-4 sm:px-6 uppercase tracking-wider text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30">
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-cyan-400 uppercase tracking-widest text-sm">Add To Board</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-zinc-800/50">
            <TabsTrigger value="url" className="gap-2 uppercase text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Link2 className="h-4 w-4" /> URL
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2 uppercase text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Upload className="h-4 w-4" /> Upload
            </TabsTrigger>
          </TabsList>
          <TabsContent value="url" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-zinc-400">URL *</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste Pinterest, Instagram, or any URL..."
                className="h-12 sm:h-10 bg-zinc-800/50 border-zinc-700 focus:border-cyan-500/50 placeholder:text-zinc-600" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-zinc-400">Title (optional)</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Give it a name..."
                className="h-12 sm:h-10 bg-zinc-800/50 border-zinc-700 focus:border-cyan-500/50 placeholder:text-zinc-600" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-zinc-400">Notes (optional)</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Why does this inspire you?" rows={3}
                className="bg-zinc-800/50 border-zinc-700 focus:border-cyan-500/50 placeholder:text-zinc-600 resize-none" />
            </div>
            <Button onClick={handleUrlSubmit} disabled={loading}
              className="w-full h-12 sm:h-10 uppercase tracking-widest text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30">
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Add URL
            </Button>
          </TabsContent>
          <TabsContent value="upload" className="space-y-4 mt-4">
            <div
              className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center cursor-pointer hover:border-cyan-500/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf"
                className="hidden" onChange={(e) => e.target.files && setSelectedFiles(Array.from(e.target.files))} />
              <Image className="h-8 w-8 mx-auto mb-2 text-zinc-600" />
              <p className="text-xs uppercase tracking-wider text-zinc-400">Tap to select files</p>
              <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-wider">Images, videos, and PDFs</p>
            </div>
            {selectedFiles.length > 0 && (
              <div className="space-y-1 p-3 bg-zinc-800/30 rounded-lg">
                <p className="text-[10px] uppercase tracking-widest text-cyan-400">Selected:</p>
                {selectedFiles.map((f, i) => <p key={i} className="text-xs text-zinc-400 truncate">• {f.name}</p>)}
              </div>
            )}
            <Button onClick={handleFileUpload} disabled={loading || selectedFiles.length === 0}
              className="w-full h-12 sm:h-10 uppercase tracking-widest text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 disabled:opacity-50">
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 5. COMPONENT: src/components/creative/MoodBoardItem.tsx

```tsx
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Heart, Flame, HelpCircle, Star, MessageCircle, Trash2, ExternalLink, Send } from 'lucide-react';
import { format } from 'date-fns';

interface Reaction { id: string; reaction_type: string; reactor_name: string; }
interface Comment { id: string; commenter_name: string; content: string; created_at: string; parent_id: string | null; }

interface MoodBoardItemProps {
  item: {
    id: string; item_type: string; title: string | null; url: string | null;
    file_url: string | null; thumbnail_url: string | null; description: string | null;
    added_by: string | null; created_at: string;
  };
  reactions: Reaction[];
  comments: Comment[];
  userName: string;
  onDelete: (id: string) => void;
  onReactionChange: () => void;
  onCommentChange: () => void;
}

const REACTION_ICONS = { love: Heart, fire: Flame, question: HelpCircle, star: Star } as const;
const REACTION_COLORS = { love: 'text-red-400', fire: 'text-orange-400', question: 'text-cyan-400', star: 'text-yellow-400' } as const;

export function MoodBoardItem({ item, reactions, comments, userName, onDelete, onReactionChange, onCommentChange }: MoodBoardItemProps) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getReactionCount = (type: string) => reactions.filter(r => r.reaction_type === type).length;
  const hasUserReacted = (type: string) => reactions.some(r => r.reaction_type === type && r.reactor_name === userName);

  const toggleReaction = async (type: string) => {
    if (!userName) { toast.error('Please enter your name first'); return; }
    const existing = reactions.find(r => r.reaction_type === type && r.reactor_name === userName);
    if (existing) await supabase.from('mood_board_reactions').delete().eq('id', existing.id);
    else await supabase.from('mood_board_reactions').insert({ item_id: item.id, reaction_type: type, reactor_name: userName });
    onReactionChange();
  };

  const addComment = async () => {
    if (!newComment.trim() || !userName) { toast.error(!userName ? 'Enter your name first' : 'Comment cannot be empty'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('mood_board_comments').insert({ item_id: item.id, commenter_name: userName, content: newComment.trim() });
    if (error) toast.error('Failed to add comment');
    else { setNewComment(''); onCommentChange(); }
    setSubmitting(false);
  };

  const renderMedia = () => {
    const mediaUrl = item.file_url || item.url;
    if (item.item_type === 'instagram') return (
      <div className="aspect-square bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-lg flex items-center justify-center">
        <div className="text-center text-white p-4">
          <div className="text-2xl mb-2">📸</div>
          <p className="text-xs uppercase tracking-wider">Instagram</p>
          {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[10px] underline mt-2 inline-flex items-center gap-1 uppercase tracking-wider">View Post <ExternalLink className="h-3 w-3" /></a>}
        </div>
      </div>
    );
    if (item.item_type === 'pinterest') return (
      <div className="aspect-square bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
        <div className="text-center text-white p-4">
          <div className="text-2xl mb-2">📌</div>
          <p className="text-xs uppercase tracking-wider">Pinterest</p>
          {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[10px] underline mt-2 inline-flex items-center gap-1 uppercase tracking-wider">View Pin <ExternalLink className="h-3 w-3" /></a>}
        </div>
      </div>
    );
    if (item.item_type === 'image' && (mediaUrl || item.thumbnail_url)) return (
      <img src={mediaUrl || item.thumbnail_url || ''} alt={item.title || 'Mood board image'} className="w-full aspect-square object-cover rounded-lg" />
    );
    if (item.item_type === 'video' && mediaUrl) return (
      <video src={mediaUrl} poster={item.thumbnail_url || undefined} className="w-full aspect-square object-cover rounded-lg" controls muted playsInline />
    );
    return (
      <div className="aspect-square bg-zinc-800/50 rounded-lg flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-2xl mb-2">🔗</div>
          <p className="text-xs uppercase tracking-wider text-zinc-300 line-clamp-2">{item.title || 'Link'}</p>
          {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-cyan-400 underline mt-2 inline-flex items-center gap-1 uppercase tracking-wider">Open <ExternalLink className="h-3 w-3" /></a>}
        </div>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden group bg-zinc-900/80 border-zinc-800">
      <div className="relative">
        {renderMedia()}
        <Button variant="destructive" size="icon"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
          onClick={() => onDelete(item.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
        {item.item_type && (
          <Badge className="absolute top-2 left-2 text-[8px] uppercase tracking-wider bg-zinc-900/80 text-zinc-300 border-zinc-700">
            {item.item_type}
          </Badge>
        )}
      </div>
      <CardContent className="p-2.5 sm:p-3 space-y-2">
        {item.title && <p className="text-xs text-zinc-200 line-clamp-1 uppercase tracking-wide">{item.title}</p>}
        {item.description && <p className="text-[10px] text-zinc-500 line-clamp-2">{item.description}</p>}
        <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
          {(Object.keys(REACTION_ICONS) as Array<keyof typeof REACTION_ICONS>).map((type) => {
            const Icon = REACTION_ICONS[type];
            const count = getReactionCount(type);
            const isActive = hasUserReacted(type);
            return (
              <Button key={type} variant="ghost" size="sm"
                className={`h-9 sm:h-7 px-2 gap-1 ${isActive ? REACTION_COLORS[type] : 'text-zinc-500'}`}
                onClick={() => toggleReaction(type)}>
                <Icon className={`h-4 w-4 sm:h-3.5 sm:w-3.5 ${isActive ? 'fill-current' : ''}`} />
                {count > 0 && <span className="text-[10px]">{count}</span>}
              </Button>
            );
          })}
          <Button variant="ghost" size="sm"
            className="h-9 sm:h-7 px-2 gap-1 ml-auto text-zinc-500"
            onClick={() => setShowComments(!showComments)}>
            <MessageCircle className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            {comments.length > 0 && <span className="text-[10px]">{comments.length}</span>}
          </Button>
        </div>
        {showComments && (
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            {comments.map((comment) => (
              <div key={comment.id} className="text-[10px] group/comment">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-cyan-400 uppercase tracking-wider">{comment.commenter_name}</span>
                    <span className="text-zinc-600 ml-2">{format(new Date(comment.created_at), 'MMM d, h:mm a')}</span>
                  </div>
                  {comment.commenter_name === userName && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/comment:opacity-100"
                      onClick={() => supabase.from('mood_board_comments').delete().eq('id', comment.id).then(onCommentChange)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <p className="text-zinc-400 mt-0.5">{comment.content}</p>
              </div>
            ))}
            <div className="flex gap-2">
              <Input value={newComment} onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a note..."
                className="h-10 sm:h-8 text-xs bg-zinc-800/50 border-zinc-700 focus:border-cyan-500/50 placeholder:text-zinc-600"
                onKeyDown={(e) => e.key === 'Enter' && addComment()} />
              <Button size="icon" className="h-10 w-10 sm:h-8 sm:w-8 shrink-0 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30"
                onClick={addComment} disabled={submitting}>
                <Send className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              </Button>
            </div>
          </div>
        )}
        {item.added_by && <p className="text-[8px] text-zinc-600 uppercase tracking-widest">By {item.added_by}</p>}
      </CardContent>
    </Card>
  );
}
```

---

## 6. COMPONENT: src/components/creative/CreativeSessionCover.tsx

> Full file — see the original at `src/components/creative/CreativeSessionCover.tsx` in this project.
> It depends on `EditorialBriefingModal` and `date-fns`.
> Replace the `soleiaLogo` import with your own logo asset.

Key interfaces:
```ts
interface CoverImage { url: string; theme: string; prompt: string; }
interface CreativeSessionCoverProps {
  session: {
    project_name: string; client_name: string; circleback_url: string | null;
    circleback_summary: string | null; technical_notes: string | null;
    creative_notes: string | null; created_at: string;
    cover_images?: CoverImage[] | null; featured_images?: CoverImage[] | null;
  };
}
```

---

## 7. COMPONENT: src/components/creative/EditorialBriefingModal.tsx

> Full file — see the original at `src/components/creative/EditorialBriefingModal.tsx` in this project.
> Displays AI-generated strategic brief in a full-screen dialog.
> No external dependencies beyond shadcn/ui and lucide-react.

---

## 8. ADMIN: CreativeSessionManager + CreativeSessionCard

> See originals at:
> - `src/components/admin/CreativeSessionManager.tsx`
> - `src/components/admin/CreativeSessionCard.tsx`
> - `src/components/admin/NewSessionForm.tsx`
> - `src/components/admin/CoverPageGenerator.tsx`
> - `src/components/admin/TechnicalBriefingArticle.tsx`
> - `src/components/admin/CoverImageSelector.tsx`
> - `src/components/admin/FeaturedImageSelector.tsx`

---

## 9. DEPENDENCIES REQUIRED

```json
{
  "@supabase/supabase-js": "^2.x",
  "react-router-dom": "^6.x",
  "date-fns": "^3.x",
  "lucide-react": "^0.4x",
  "sonner": "^1.x",
  "framer-motion": "^12.x"
}
```

shadcn/ui components needed:
- Button, Input, Label, Textarea, Badge, Card, CardContent, CardHeader
- Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
- Tabs, TabsContent, TabsList, TabsTrigger
- Collapsible, CollapsibleContent, CollapsibleTrigger
- Switch, ScrollArea

---

## 10. DESIGN TOKENS (add to tailwind.config.ts / index.css)

```css
/* index.css — add inside :root */
--font-tech: 'JetBrains Mono', monospace;

/* Tailwind font-tech class */
.font-tech { font-family: 'JetBrains Mono', monospace; }
```

```ts
// tailwind.config.ts
fontFamily: {
  tech: ['JetBrains Mono', 'monospace'],
}
```

Add Google Font in index.html:
```html
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

---

## 11. EDGE FUNCTION: generate-cover-images (optional, for AI cover art)

Lives at `supabase/functions/generate-cover-images/index.ts` in this project.
Calls an AI image generation API with session context to produce themed cover images.
Requires a secret: `OPENAI_API_KEY` or similar.

---

*End of Creative Session Module Export*
