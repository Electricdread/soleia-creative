import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Heart, Trash2, ExternalLink, Send, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Reaction {
  id: string;
  reaction_type: string;
  reactor_name: string;
}

interface Comment {
  id: string;
  commenter_name: string;
  content: string;
  created_at: string;
  parent_id: string | null;
}

interface MoodBoardItemProps {
  item: {
    id: string;
    item_type: string;
    title: string | null;
    url: string | null;
    file_url: string | null;
    thumbnail_url: string | null;
    description: string | null;
    added_by: string | null;
    created_at: string;
  };
  reactions: Reaction[];
  comments: Comment[];
  userName: string;
  onDelete: (id: string) => void;
  onReactionChange: () => void;
  onCommentChange: () => void;
}

export function MoodBoardItem({
  item,
  reactions,
  comments,
  userName,
  onDelete,
  onReactionChange,
  onCommentChange,
}: MoodBoardItemProps) {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const likeCount = reactions.filter((r) => r.reaction_type === 'love').length;
  const hasLiked = reactions.some((r) => r.reaction_type === 'love' && r.reactor_name === userName);

  const toggleLike = async () => {
    if (!userName) {
      toast.error('Please enter your name first');
      return;
    }
    const existing = reactions.find(
      (r) => r.reaction_type === 'love' && r.reactor_name === userName
    );
    if (existing) {
      await supabase.from('mood_board_reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('mood_board_reactions').insert({
        item_id: item.id,
        reaction_type: 'love',
        reactor_name: userName,
      });
    }
    onReactionChange();
  };

  const addComment = async () => {
    if (!newComment.trim() || !userName) {
      toast.error(!userName ? 'Please enter your name first' : 'Comment cannot be empty');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('mood_board_comments').insert({
      item_id: item.id,
      commenter_name: userName,
      content: newComment.trim(),
    });
    if (error) {
      toast.error('Failed to add comment');
    } else {
      setNewComment('');
      onCommentChange();
    }
    setSubmitting(false);
  };

  const deleteComment = async (commentId: string) => {
    await supabase.from('mood_board_comments').delete().eq('id', commentId);
    onCommentChange();
  };

  const renderMedia = () => {
    const mediaUrl = item.file_url || item.url;
    const thumbnailUrl = item.thumbnail_url;

    if (item.item_type === 'instagram' || item.item_type === 'pinterest') {
      const label = item.item_type === 'instagram' ? '📸 Instagram' : '📌 Pinterest';
      const gradient = item.item_type === 'instagram'
        ? 'from-purple-500 via-pink-500 to-orange-500'
        : 'from-red-500 to-red-700';
      return (
        <div className={`aspect-video bg-gradient-to-br ${gradient} rounded-t-lg flex items-center justify-center`}>
          <div className="text-center text-white p-4">
            <p className="text-sm font-tech uppercase tracking-wider">{label}</p>
            {item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer"
                className="text-[10px] underline mt-2 inline-flex items-center gap-1 font-tech uppercase">
                View <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      );
    }

    if (item.item_type === 'image' && (mediaUrl || thumbnailUrl)) {
      return (
        <img
          src={mediaUrl || thumbnailUrl || ''}
          alt={item.title || 'Image'}
          className="w-full rounded-t-lg object-contain bg-black max-h-[500px]"
        />
      );
    }

    if (item.item_type === 'video' && mediaUrl) {
      return (
        <video
          src={mediaUrl}
          poster={thumbnailUrl || undefined}
          className="w-full rounded-t-lg bg-black"
          controls
          muted
          playsInline
        />
      );
    }

    if (item.item_type === 'link') {
      return (
        <div className="aspect-video bg-zinc-800/50 rounded-t-lg flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-xs font-tech uppercase text-zinc-300 line-clamp-2">{item.title || 'Link'}</p>
            {item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-cyan-400 underline mt-2 inline-flex items-center gap-1 font-tech uppercase">
                Open <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="aspect-video bg-zinc-800/50 rounded-t-lg flex items-center justify-center">
        <span className="text-zinc-600 font-tech text-xs uppercase">No preview</span>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden group bg-zinc-900/80 border-zinc-800 font-tech">
      <div className="relative">
        {renderMedia()}
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
        {item.item_type && (
          <Badge className="absolute top-2 left-2 text-[8px] uppercase tracking-wider bg-zinc-900/80 text-zinc-300 border-zinc-700 font-tech">
            {item.item_type}
          </Badge>
        )}
      </div>

      <CardContent className="p-3 space-y-2.5">
        {item.title && (
          <p className="text-xs font-tech text-zinc-200 line-clamp-1 uppercase tracking-wide">{item.title}</p>
        )}
        {item.description && (
          <p className="text-[10px] text-zinc-500 line-clamp-2 font-tech">{item.description}</p>
        )}

        {/* Like Button - always visible */}
        <div className="flex items-center gap-3 pt-1 border-t border-zinc-800">
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 px-3 gap-1.5 ${hasLiked ? 'text-red-400' : 'text-zinc-500'}`}
            onClick={toggleLike}
          >
            <Heart className={`h-4 w-4 ${hasLiked ? 'fill-current' : ''}`} />
            <span className="text-xs font-tech">{likeCount > 0 ? likeCount : 'Like'}</span>
          </Button>
          <span className="text-[10px] text-zinc-600 font-tech flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            {comments.length > 0 ? `${comments.length}` : '0'}
          </span>
        </div>

        {/* Comments - always visible */}
        <div className="space-y-2">
          {comments.map((comment) => (
            <div key={comment.id} className="text-[10px] group/comment">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-tech text-cyan-400 uppercase tracking-wider">{comment.commenter_name}</span>
                  <span className="text-zinc-600 ml-2 font-tech">
                    {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                  </span>
                </div>
                {comment.commenter_name === userName && (
                  <Button variant="ghost" size="icon"
                    className="h-5 w-5 opacity-0 group-hover/comment:opacity-100"
                    onClick={() => deleteComment(comment.id)}>
                    <Trash2 className="h-2.5 w-2.5" />
                  </Button>
                )}
              </div>
              <p className="text-zinc-400 mt-0.5 font-tech">{comment.content}</p>
            </div>
          ))}

          {/* Comment Input - always visible */}
          <div className="flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="h-9 text-xs font-tech bg-zinc-800/50 border-zinc-700 focus:border-cyan-500/50 placeholder:text-zinc-600"
              onKeyDown={(e) => e.key === 'Enter' && addComment()}
            />
            <Button
              size="icon"
              className="h-9 w-9 shrink-0 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30"
              onClick={addComment}
              disabled={submitting}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {item.added_by && (
          <p className="text-[8px] text-zinc-600 font-tech uppercase tracking-widest pt-1">
            By {item.added_by}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
