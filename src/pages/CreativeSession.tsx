import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, User, ArrowRight, FileText } from 'lucide-react';
import { CreativeSessionCover } from '@/components/creative/CreativeSessionCover';
import { MoodBoardItem } from '@/components/creative/MoodBoardItem';
import { FullscreenMediaViewer } from '@/components/creative/FullscreenMediaViewer';
import { ApprovalCart } from '@/components/creative/ApprovalCart';
import { ApprovalSummary } from '@/components/creative/ApprovalSummary';
import soleiaLogo from '@/assets/soleia-logo-new.png';
import { HomeButton } from '@/components/HomeButton';
import VenueVideoMappingView, { type PrevizClipOption } from '@/components/VenueVideoMappingView';

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
  creative_notes?: string | null;
  proposal_id?: string | null;
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
  scene_id: string | null;
}

interface SceneData {
  id: string;
  title: string;
  description: string | null;
  sort_order: number | null;
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
  const [scenes, setScenes] = useState<SceneData[]>([]);
  const [previzClips, setPrevizClips] = useState<PrevizClipOption[]>([]);
  const [proposalToken, setProposalToken] = useState<string | null>(null);
  const [userName, setUserName] = useState(() =>
    localStorage.getItem('creative_session_name') || ''
  );
  const [nameConfirmed, setNameConfirmed] = useState(() =>
    !!localStorage.getItem('creative_session_name')
  );
  const [fullscreenItemId, setFullscreenItemId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (token) fetchSession();
  }, [token]);

  useEffect(() => {
    if (session?.id) {
      fetchItems();
      fetchReactions();
      fetchComments();
      fetchScenes();
      fetchPrevizClips();
      const cleanup = setupRealtime();
      return cleanup;
    }
  }, [session?.id]);

  useEffect(() => {
    if (userName && nameConfirmed) localStorage.setItem('creative_session_name', userName);
  }, [userName, nameConfirmed]);

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
      creative_notes: data.creative_notes,
      proposal_id: (data as any).proposal_id,
    });

    // Fetch linked proposal token
    if ((data as any).proposal_id) {
      const { data: prop } = await supabase
        .from('proposals')
        .select('token')
        .eq('id', (data as any).proposal_id)
        .eq('is_active', true)
        .maybeSingle();
      if (prop) setProposalToken(prop.token);
    }

    setLoading(false);
  };

  const fetchItems = async () => {
    if (!session?.id) return;
    const { data } = await supabase
      .from('mood_board_items')
      .select('*')
      .eq('session_id', session.id)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });
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

  const fetchScenes = async () => {
    if (!session?.id) return;
    const { data } = await supabase
      .from('session_scenes')
      .select('*')
      .eq('session_id', session.id)
      .order('sort_order', { ascending: true });
    setScenes((data as SceneData[]) || []);
  };

  const fetchPrevizClips = async () => {
    if (!session?.id) return;
    const { data } = await supabase
      .from('session_previz_clips')
      .select('id, title, url, sort_order, is_default')
      .eq('session_id', session.id)
      .order('is_default', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    setPrevizClips(
      ((data as Array<{ id: string; title: string; url: string }>) || []).map((r) => ({
        id: r.id,
        title: r.title,
        url: r.url,
      })),
    );
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <img src={soleiaLogo} alt="Soleia" className="h-24 object-contain mb-8 opacity-50" />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your session...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <img src={soleiaLogo} alt="Soleia" className="h-24 object-contain mb-8 opacity-50" />
        <Card className="max-w-md w-full border border-border/50">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-bold font-display mb-2 text-foreground">Session Not Found</h2>
            <p className="text-muted-foreground text-sm">
              This creative session doesn't exist or has been deactivated.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Name entry gate
  if (!nameConfirmed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <img src={soleiaLogo} alt="Soleia" className="h-16 object-contain mb-6 opacity-60" />
        <Card className="max-w-sm w-full border border-border/50">
          <CardContent className="pt-8 pb-6 px-6 space-y-5">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold font-display text-foreground">{session.project_name}</h2>
              <p className="text-xs text-muted-foreground">Enter your name to review and approve content</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                <User className="h-3 w-3" />
                Your Name
              </div>
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your full name..."
                className="h-12 bg-secondary/30 border-border/50 focus:border-primary/50 text-center"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && userName.trim()) setNameConfirmed(true);
                }}
              />
            </div>
            <Button
              onClick={() => setNameConfirmed(true)}
              disabled={!userName.trim()}
              className="w-full h-11 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Enter Session
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const approvedItems = items.filter((item) =>
    reactions.some((r) => r.item_id === item.id && r.reaction_type === 'love' && r.reactor_name === userName)
  );

  if (showSummary && session) {
    return (
      <ApprovalSummary
        items={approvedItems}
        comments={comments}
        clientName={userName || 'Guest'}
        projectName={session.project_name}
        sessionDate={session.created_at}
        onBack={() => setShowSummary(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <HomeButton />
            <img src={soleiaLogo} alt="Soleia" className="h-8 sm:h-10 object-contain" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground">
              Reviewing as <span className="text-foreground font-medium">{userName}</span>
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <CreativeSessionCover session={session} />

        {previzClips.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-xl text-foreground">Venue Previz</h2>
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Run-of-show cues sync to the playback
              </span>
            </div>
            <VenueVideoMappingView clips={previzClips} />
          </section>
        )}



        {/* Content Gallery — Read Only */}
        {items.length === 0 ? (
          <Card className="border border-dashed border-border/50">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-sm">
                Content is being prepared
              </p>
              <p className="text-muted-foreground/60 text-xs mt-1">
                Check back soon — the creative team is uploading content for your review.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-6 max-w-2xl mx-auto">
            {/* Render scenes with their items */}
            {scenes.length > 0 && (() => {
              const sceneItems = scenes.map(scene => ({
                scene,
                items: items.filter(i => i.scene_id === scene.id),
              })).filter(g => g.items.length > 0);

              const unsorted = items.filter(i => !i.scene_id);

              return (
                <>
                  {sceneItems.map(({ scene, items: sItems }) => (
                    <div key={scene.id} className="space-y-3">
                      <div className="border-b border-border/50 pb-2">
                        <h3 className="text-lg font-display font-bold text-foreground">{scene.title}</h3>
                        {scene.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">{scene.description}</p>
                        )}
                      </div>
                      {sItems.map(item => (
                        <MoodBoardItem
                          key={item.id}
                          item={item}
                          reactions={reactions.filter(r => r.item_id === item.id)}
                          comments={comments.filter(c => c.item_id === item.id)}
                          userName={userName}
                          onReactionChange={fetchReactions}
                          onCommentChange={fetchComments}
                          onMediaClick={setFullscreenItemId}
                          readOnly
                        />
                      ))}
                    </div>
                  ))}
                  {unsorted.length > 0 && sceneItems.length > 0 && (
                    <div className="space-y-3">
                      <div className="border-b border-border/50 pb-2">
                        <h3 className="text-lg font-display font-bold text-foreground">General</h3>
                      </div>
                      {unsorted.map(item => (
                        <MoodBoardItem
                          key={item.id}
                          item={item}
                          reactions={reactions.filter(r => r.item_id === item.id)}
                          comments={comments.filter(c => c.item_id === item.id)}
                          userName={userName}
                          onReactionChange={fetchReactions}
                          onCommentChange={fetchComments}
                          onMediaClick={setFullscreenItemId}
                          readOnly
                        />
                      ))}
                    </div>
                  )}
                  {unsorted.length > 0 && sceneItems.length === 0 && unsorted.map(item => (
                    <MoodBoardItem
                      key={item.id}
                      item={item}
                      reactions={reactions.filter(r => r.item_id === item.id)}
                      comments={comments.filter(c => c.item_id === item.id)}
                      userName={userName}
                      onReactionChange={fetchReactions}
                      onCommentChange={fetchComments}
                      onMediaClick={setFullscreenItemId}
                      readOnly
                    />
                  ))}
                </>
              );
            })()}
            {/* No scenes — flat list */}
            {scenes.length === 0 && items.map(item => (
              <MoodBoardItem
                key={item.id}
                item={item}
                reactions={reactions.filter(r => r.item_id === item.id)}
                comments={comments.filter(c => c.item_id === item.id)}
                userName={userName}
                onReactionChange={fetchReactions}
                onCommentChange={fetchComments}
                onMediaClick={setFullscreenItemId}
                readOnly
              />
            ))}
          </div>
        )}

        {/* View Proposal Card */}
        {proposalToken && (
          <a
            href={`/proposal/${proposalToken}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Card className="border border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
              <CardContent className="py-4 px-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">View Proposal</p>
                  <p className="text-xs text-muted-foreground">Review and sign the project proposal</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
              </CardContent>
            </Card>
          </a>
        )}

        {/* Approval Cart */}
        <ApprovalCart
          items={approvedItems}
          clientName={userName || 'Guest'}
          onViewSummary={() => setShowSummary(true)}
        />
      </div>

      {/* Fullscreen Viewer */}
      {fullscreenItemId && (
        <FullscreenMediaViewer
          items={items.filter((i) => i.item_type === 'image' || i.item_type === 'video')}
          currentId={fullscreenItemId}
          onClose={() => setFullscreenItemId(null)}
          onNavigate={setFullscreenItemId}
        />
      )}
    </div>
  );
}
