import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Heart, Flame, HelpCircle, Star, MessageCircle, Trash2, ExternalLink, Send } from 'lucide-react';
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

const REACTION_ICONS = {
  love: Heart,
  fire: Flame,
  question: HelpCircle,
  star: Star,
} as const;

const REACTION_COLORS = {
  love: 'text-red-400',
  fire: 'text-orange-400',
  question: 'text-cyan-400',
  star: 'text-yellow-400',
} as const;

export function MoodBoardItem({
  item,
  reactions,
  comments,
  userName,
  onDelete,
  onReactionChange,
  onCommentChange,
}: MoodBoardItemProps) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getReactionCount = (type: string) => 
    reactions.filter((r) => r.reaction_type === type).length;

  const hasUserReacted = (type: string) =>
    reactions.some((r) => r.reaction_type === type && r.reactor_name === userName);

  const toggleReaction = async (type: string) => {
    if (!userName) {
      toast.error('Please enter your name first');
      return;
    }

    const existing = reactions.find(
      (r) => r.reaction_type === type && r.reactor_name === userName
    );

    if (existing) {
      await supabase.from('mood_board_reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('mood_board_reactions').insert({
        item_id: item.id,
        reaction_type: type,
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

    if (item.item_type === 'instagram') {
      return (
        <div className="aspect-square bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-lg flex items-center justify-center">
          <div className="text-center text-white p-4">
            <div className="text-2xl mb-2">📸</div>
            <p className="text-xs font-tech uppercase tracking-wider">Instagram</p>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] underline mt-2 inline-flex items-center gap-1 font-tech uppercase tracking-wider"
              >
                View Post <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      );
    }

    if (item.item_type === 'pinterest') {
      return (
        <div className="aspect-square bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
          <div className="text-center text-white p-4">
            <div className="text-2xl mb-2">📌</div>
            <p className="text-xs font-tech uppercase tracking-wider">Pinterest</p>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] underline mt-2 inline-flex items-center gap-1 font-tech uppercase tracking-wider"
              >
                View Pin <ExternalLink className="h-3 w-3" />
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
          alt={item.title || 'Mood board image'}
          className="w-full aspect-square object-cover rounded-lg"
        />
      );
    }

    if (item.item_type === 'video' && mediaUrl) {
      return (
        <video
          src={mediaUrl}
          poster={thumbnailUrl || undefined}
          className="w-full aspect-square object-cover rounded-lg"
          controls
          muted
          playsInline
        />
      );
    }

    if (item.item_type === 'link') {
      return (
        <div className="aspect-square bg-zinc-800/50 rounded-lg flex items-center justify-center p-4">
          <div className="text-center">
            <div className="text-2xl mb-2">🔗</div>
            <p className="text-xs font-tech uppercase tracking-wider text-zinc-300 line-clamp-2">{item.title || 'Link'}</p>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-cyan-400 underline mt-2 inline-flex items-center gap-1 font-tech uppercase tracking-wider"
              >
                Open <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="aspect-square bg-zinc-800/50 rounded-lg flex items-center justify-center">
        <span className="text-zinc-600 font-tech text-xs uppercase tracking-wider">No preview</span>
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
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 sm:transition-opacity h-8 w-8 touch-manipulation"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        {item.item_type && (
          <Badge
            className="absolute top-2 left-2 text-[8px] uppercase tracking-wider bg-zinc-900/80 text-zinc-300 border-zinc-700 font-tech"
          >
            {item.item_type}
          </Badge>
        )}
      </div>

      <CardContent className="p-2.5 sm:p-3 space-y-2">
        {item.title && (
          <p className="text-xs font-tech text-zinc-200 line-clamp-1 uppercase tracking-wide">{item.title}</p>
        )}
        {item.description && (
          <p className="text-[10px] text-zinc-500 line-clamp-2 font-tech">{item.description}</p>
        )}

        {/* Reactions - Touch Optimized */}
        <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
          {(Object.keys(REACTION_ICONS) as Array<keyof typeof REACTION_ICONS>).map((type) => {
            const Icon = REACTION_ICONS[type];
            const count = getReactionCount(type);
            const isActive = hasUserReacted(type);
            return (
              <Button
                key={type}
                variant="ghost"
                size="sm"
                className={`h-9 sm:h-7 px-2 sm:px-2 gap-1 touch-manipulation active:scale-90 ${isActive ? REACTION_COLORS[type] : 'text-zinc-500'}`}
                onClick={() => toggleReaction(type)}
              >
                <Icon className={`h-4 w-4 sm:h-3.5 sm:w-3.5 ${isActive ? 'fill-current' : ''}`} />
                {count > 0 && <span className="text-[10px] font-tech">{count}</span>}
              </Button>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 sm:h-7 px-2 gap-1 ml-auto text-zinc-500 touch-manipulation active:scale-90"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            {comments.length > 0 && <span className="text-[10px] font-tech">{comments.length}</span>}
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="space-y-2 pt-2 border-t border-zinc-800">
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover/comment:opacity-100 touch-manipulation"
                      onClick={() => deleteComment(comment.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <p className="text-zinc-400 mt-0.5 font-tech">{comment.content}</p>
              </div>
            ))}

            <div className="flex gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a note..."
                className="h-10 sm:h-8 text-sm sm:text-xs font-tech bg-zinc-800/50 border-zinc-700 focus:border-cyan-500/50 placeholder:text-zinc-600"
                onKeyDown={(e) => e.key === 'Enter' && addComment()}
              />
              <Button
                size="icon"
                className="h-10 w-10 sm:h-8 sm:w-8 shrink-0 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 touch-manipulation active:scale-90"
                onClick={addComment}
                disabled={submitting}
              >
                <Send className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {item.added_by && (
          <p className="text-[8px] text-zinc-600 font-tech uppercase tracking-widest">
            By {item.added_by}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
