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

interface CreativeSessionData {
  id: string;
  project_name: string;
  client_name: string;
  circleback_url: string | null;
  circleback_summary: string | null;
  technical_notes: string | null;
  creative_notes: string | null;
  created_at: string;
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
    if (token) {
      fetchSession();
    }
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
    if (userName) {
      localStorage.setItem('creative_session_name', userName);
    }
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

    setSession(data);
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
      id: r.id,
      item_id: r.item_id,
      reaction_type: r.reaction_type,
      reactor_name: r.reactor_name,
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
      id: c.id,
      item_id: c.item_id,
      commenter_name: c.commenter_name,
      content: c.content,
      created_at: c.created_at,
      parent_id: c.parent_id,
    })) || []);
  };

  const setupRealtime = () => {
    const channel = supabase
      .channel(`creative-session-${session?.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mood_board_items' }, () => {
        fetchItems();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mood_board_reactions' }, () => {
        fetchReactions();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mood_board_comments' }, () => {
        fetchComments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const deleteItem = async (itemId: string) => {
    const { error } = await supabase
      .from('mood_board_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      toast.error('Failed to delete item');
    } else {
      fetchItems();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-bold mb-2">Session Not Found</h2>
            <p className="text-muted-foreground">
              This creative session doesn't exist or has been deactivated.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Cover Page */}
        <CreativeSessionCover session={session} />

        {/* User Name Input + Add Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="userName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Your Name
            </Label>
            <Input
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name to react & comment..."
              className="max-w-xs"
            />
          </div>
          <AddMoodBoardItem
            sessionId={session.id}
            userName={userName}
            onItemAdded={fetchItems}
          />
        </div>

        {/* Mood Board Grid */}
        {items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No items on the mood board yet. Add Pinterest pins, Instagram posts, or upload files to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
