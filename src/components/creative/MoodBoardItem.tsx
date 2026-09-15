import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, ExternalLink, Send, MessageCircle, GripVertical, CheckCircle2, XCircle, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';

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
  onDelete?: (id: string) => void;
  onReactionChange: () => void;
  onCommentChange: () => void;
  onMediaClick: (id: string) => void;
  readOnly?: boolean;
}

export function MoodBoardItem({
  item,
  reactions,
  comments,
  userName,
  onDelete,
  onReactionChange,
  onCommentChange,
  onMediaClick,
  readOnly = false,
}: MoodBoardItemProps) {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [choosing, setChoosing] = useState(false);

  const handleDownload = async (url: string, title: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${title}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.success('Download started');
    } catch {
      toast.error('Download failed');
    }
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: readOnly });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : undefined,
  };

  const likeCount = reactions.filter((r) => r.reaction_type === 'love').length;
  const hasLiked = reactions.some((r) => r.reaction_type === 'love' && r.reactor_name === userName);
  const declineCount = reactions.filter((r) => r.reaction_type === 'decline').length;
  const hasDeclined = reactions.some((r) => r.reaction_type === 'decline' && r.reactor_name === userName);

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
      toast.error('Your comment was not saved. Please try again.');
    } else {
      setNewComment('');
      onCommentChange();
    }
    setSubmitting(false);
  };

  // Approve and Decline are one choice per person: saving one clears the other. The new choice is written first and
  // the old one removed only once it has landed, so a refused write can never leave the client with neither. Until
  // 2026-09-15 the old choice went first and no write was checked; the table refused 'decline' outright, so every
  // Decline since 2026-04-07 was lost and took the client's Approve with it.
  const choose = async (choice: 'love' | 'decline') => {
    if (!userName) {
      toast.error('Please enter your name first');
      return;
    }
    if (choosing) return;
    setChoosing(true);
    const mine = (type: string) => reactions.find((r) => r.reaction_type === type && r.reactor_name === userName);
    const current = mine(choice);
    const other = mine(choice === 'love' ? 'decline' : 'love');
    try {
      if (current) {
        const { error } = await supabase.from('mood_board_reactions').delete().eq('id', current.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('mood_board_reactions').insert({
          item_id: item.id,
          reaction_type: choice,
          reactor_name: userName,
        });
        // 23505: this exact choice is already saved (another tab, a double tap), which is what was asked for.
        if (error && error.code !== '23505') throw error;
        if (other) {
          const { error: clearError } = await supabase.from('mood_board_reactions').delete().eq('id', other.id);
          if (clearError) throw clearError;
        }
        // A note typed but not sent goes with the choice instead of staying behind in the box.
        if (newComment.trim()) await addComment();
      }
    } catch {
      toast.error(choice === 'love' ? 'Your approval was not saved. Please try again.' : 'Your decline was not saved. Please try again.');
    } finally {
      setChoosing(false);
      onReactionChange();
    }
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
      return (
        <div className="aspect-video bg-secondary/50 rounded-t-lg flex items-center justify-center">
          <div className="text-center p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            {item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-primary underline mt-2 inline-flex items-center gap-1">
                View <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      );
    }

    if (item.item_type === 'image' && (mediaUrl || thumbnailUrl)) {
      return (
        <div className="cursor-pointer" onClick={() => onMediaClick(item.id)}>
          <img
            src={mediaUrl || thumbnailUrl || ''}
            alt={item.title || 'Image'}
            className="w-full rounded-t-lg object-contain bg-secondary/30 max-h-[500px]"
          />
        </div>
      );
    }

    if (item.item_type === 'video' && mediaUrl) {
      return (
        <div className="cursor-pointer relative group/video" onClick={() => onMediaClick(item.id)}>
          <video
            src={mediaUrl}
            poster={thumbnailUrl || undefined}
            className="w-full rounded-t-lg bg-secondary/30"
            autoPlay
            loop
            muted
            playsInline
          />
          <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-2 right-2 h-8 w-8 opacity-0 group-hover/video:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm hover:bg-background"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(mediaUrl, item.title || 'video');
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    if (item.item_type === 'link') {
      return (
        <div className="aspect-video bg-secondary/30 rounded-t-lg flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground line-clamp-2">{item.title || 'Link'}</p>
            {item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-primary underline mt-2 inline-flex items-center gap-1">
                Open <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="aspect-video bg-secondary/30 rounded-t-lg flex items-center justify-center">
        <span className="text-muted-foreground/50 text-xs">No preview</span>
      </div>
    );
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`overflow-hidden group border-2 transition-shadow ${
        isDragging ? 'shadow-lg ring-2 ring-primary/50' : ''
      } ${hasDeclined ? 'border-destructive/50 bg-destructive/5' : hasLiked ? 'border-primary/50 bg-primary/5' : 'border-border/50 bg-card'}`}
    >
      <div className="relative">
        {renderMedia()}
        {/* Admin-only controls */}
        {!readOnly && (
          <>
            <button
              {...attributes}
              {...listeners}
              className="absolute top-2 left-2 p-1.5 rounded-md bg-background/70 backdrop-blur-sm text-muted-foreground hover:text-primary cursor-grab active:cursor-grabbing transition-colors touch-manipulation"
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            {onDelete && (
              <DeleteConfirmDialog
                trigger={
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                }
                title="Delete mood board item?"
                description={`This will permanently remove "${item.title || 'this item'}" from the mood board. This action cannot be undone.`}
                onConfirm={() => onDelete(item.id)}
              />
            )}
          </>
        )}
        {item.item_type && (
          <Badge variant="secondary" className={`absolute ${readOnly ? 'top-2' : 'top-10'} left-2 text-[8px] uppercase tracking-wider`}>
            {item.item_type}
          </Badge>
        )}
      </div>

      <CardContent className="p-3 space-y-2.5">
        {item.title && (
          <p className="text-base font-bold font-display text-foreground line-clamp-2">{item.title}</p>
        )}
        {item.description && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{item.description}</p>
        )}

        {/* Approve & Decline Buttons */}
        <div className="flex items-center gap-2 pt-1 border-t border-border/50 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 px-3 gap-1.5 ${hasLiked ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={() => void choose('love')}
            disabled={choosing}
          >
            <CheckCircle2 className={`h-4 w-4 ${hasLiked ? 'fill-primary text-primary-foreground' : ''}`} />
            <span className="text-xs">{hasLiked ? 'Approved' : 'Approve'}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 px-3 gap-1.5 ${hasDeclined ? 'text-destructive' : 'text-muted-foreground'}`}
            onClick={() => void choose('decline')}
            disabled={choosing}
          >
            <XCircle className={`h-4 w-4 ${hasDeclined ? 'fill-destructive text-destructive-foreground' : ''}`} />
            <span className="text-xs">{hasDeclined ? 'Declined' : 'Decline'}</span>
          </Button>
          {likeCount > 0 && (
            <span className="text-[10px] text-primary font-medium">{likeCount} approved</span>
          )}
          {declineCount > 0 && (
            <span className="text-[10px] text-destructive font-medium">{declineCount} declined</span>
          )}
          <span className="text-[10px] text-muted-foreground flex items-center gap-1 ml-auto">
            <MessageCircle className="h-3 w-3" />
            {comments.length > 0 ? `${comments.length}` : '0'}
          </span>
        </div>

        {/* Comments */}
        <div className="space-y-2">
          {comments.map((comment) => (
            <div key={comment.id} className="text-[10px] group/comment">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-medium text-primary">{comment.commenter_name}</span>
                  <span className="text-muted-foreground/60 ml-2">
                    {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                  </span>
                </div>
                {comment.commenter_name === userName && (
                  <DeleteConfirmDialog
                    trigger={
                      <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover/comment:opacity-100">
                        <Trash2 className="h-2.5 w-2.5" />
                      </Button>
                    }
                    title="Delete comment?"
                    description="This will permanently remove your comment. This action cannot be undone."
                    onConfirm={() => deleteComment(comment.id)}
                  />
                )}
              </div>
              <p className="text-muted-foreground mt-0.5">{comment.content}</p>
            </div>
          ))}

          {/* Comment Input */}
          <div className="flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="h-9 text-xs bg-secondary/30 border-border/50 focus:border-primary/50 placeholder:text-muted-foreground/50"
              onKeyDown={(e) => e.key === 'Enter' && addComment()}
            />
            <Button
              size="icon"
              variant="outline"
              className="h-9 w-9 shrink-0 border-primary/30 text-primary hover:bg-primary/10"
              onClick={addComment}
              disabled={submitting}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {item.added_by && (
          <p className="text-[8px] text-muted-foreground/60 uppercase tracking-widest pt-1">
            By {item.added_by}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
