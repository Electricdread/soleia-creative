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
import soleiaIcon from '@/assets/sol-icon.png';

interface CoverImage {
  url: string;
  theme: string;
  prompt: string;
}

interface CreativeSessionData {
  id: string;
  project_name: string;
  client_name: string;
  created_at: string;
  cover_images?: CoverImage[] | null;
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
      const cleanup = setupRealtime();
      return cleanup;
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

    setSession({
      id: data.id,
      project_name: data.project_name,
      client_name: data.client_name,
      created_at: data.created_at,
      cover_images: data.cover_images as unknown as CoverImage[] | null,
    });
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
      id: r.id, item_id: r.item_id, reaction_type: r.reaction_type, reactor_name: r.reactor_name,
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
            <h2 className="text-xl font-tech font-bold mb-2 text-white">Session Not Found</h2>
            <p className="text-zinc-400 font-tech text-sm">
              This creative session doesn't exist or has been deactivated.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black font-tech">
      {/* Header */}
      <div className="relative h-28 overflow-hidden bg-gradient-to-b from-zinc-900 to-black">
        <div className="absolute inset-0 flex items-center justify-center">
          <img src={soleiaIcon} alt="Soleia" className="h-14 w-auto object-contain opacity-80" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
        <div className="absolute bottom-3 left-4">
          <span className="text-[10px] font-tech uppercase tracking-[0.3em] text-cyan-400">
            Soleia Creative
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 space-y-5">
        <CreativeSessionCover session={session} />

        {/* User Name + Add */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="userName" className="flex items-center gap-1.5 text-[10px] font-tech uppercase tracking-widest text-cyan-400">
              <User className="h-3 w-3" />
              Your Name
            </Label>
            <Input
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name..."
              className="h-11 font-tech bg-zinc-900/80 border-zinc-700 focus:border-cyan-500/50 placeholder:text-zinc-600"
            />
          </div>
          <AddMoodBoardItem sessionId={session.id} userName={userName} onItemAdded={fetchItems} />
        </div>

        {/* Content Gallery */}
        {items.length === 0 ? (
          <Card className="bg-zinc-900/60 border-zinc-800 border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-zinc-500 font-tech text-sm uppercase tracking-wider">
                No items yet
              </p>
              <p className="text-zinc-600 font-tech text-xs mt-1">
                Add images, videos, or links to start collaborating
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
