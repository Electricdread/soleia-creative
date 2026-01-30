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
  love: 'text-red-500',
  fire: 'text-orange-500',
  question: 'text-blue-500',
  star: 'text-yellow-500',
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
      // Instagram embed placeholder
      return (
        <div className="aspect-square bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-lg flex items-center justify-center">
          <div className="text-center text-white p-4">
            <div className="text-2xl mb-2">📸</div>
            <p className="text-sm font-medium">Instagram</p>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline mt-2 inline-flex items-center gap-1"
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
            <p className="text-sm font-medium">Pinterest</p>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline mt-2 inline-flex items-center gap-1"
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
        <div className="aspect-square bg-muted rounded-lg flex items-center justify-center p-4">
          <div className="text-center">
            <div className="text-2xl mb-2">🔗</div>
            <p className="text-sm font-medium line-clamp-2">{item.title || 'Link'}</p>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary underline mt-2 inline-flex items-center gap-1"
              >
                Open <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
        <span className="text-muted-foreground">No preview</span>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden group">
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
          <Badge
            variant="secondary"
            className="absolute top-2 left-2 text-[10px] capitalize"
          >
            {item.item_type}
          </Badge>
        )}
      </div>

      <CardContent className="p-3 space-y-2">
        {item.title && (
          <p className="text-sm font-medium line-clamp-1">{item.title}</p>
        )}
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
        )}

        {/* Reactions */}
        <div className="flex items-center gap-1 flex-wrap">
          {(Object.keys(REACTION_ICONS) as Array<keyof typeof REACTION_ICONS>).map((type) => {
            const Icon = REACTION_ICONS[type];
            const count = getReactionCount(type);
            const isActive = hasUserReacted(type);
            return (
              <Button
                key={type}
                variant="ghost"
                size="sm"
                className={`h-7 px-2 gap-1 ${isActive ? REACTION_COLORS[type] : ''}`}
                onClick={() => toggleReaction(type)}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'fill-current' : ''}`} />
                {count > 0 && <span className="text-xs">{count}</span>}
              </Button>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 gap-1 ml-auto"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {comments.length > 0 && <span className="text-xs">{comments.length}</span>}
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="space-y-2 pt-2 border-t">
            {comments.map((comment) => (
              <div key={comment.id} className="text-xs group/comment">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-medium">{comment.commenter_name}</span>
                    <span className="text-muted-foreground ml-2">
                      {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  {comment.commenter_name === userName && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-0 group-hover/comment:opacity-100"
                      onClick={() => deleteComment(comment.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <p className="text-muted-foreground mt-0.5">{comment.content}</p>
              </div>
            ))}

            <div className="flex gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a note..."
                className="h-8 text-xs"
                onKeyDown={(e) => e.key === 'Enter' && addComment()}
              />
              <Button
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={addComment}
                disabled={submitting}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {item.added_by && (
          <p className="text-[10px] text-muted-foreground">
            Added by {item.added_by}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
