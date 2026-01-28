import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon, Copy, Link2, Trash2, ExternalLink, Users, Loader2, Video, ChevronDown, ChevronUp, FolderOpen } from 'lucide-react';
import { ClipSelector } from './ClipSelector';
import { SessionUploadsViewer } from './SessionUploadsViewer';

interface ClientLink {
  id: string;
  token: string;
  client_name: string;
  event_name: string;
  event_date: string | null;
  is_active: boolean;
  created_at: string;
  clip_count?: number;
  upload_count?: number;
}

export function ClientLinkManager() {
  const { toast } = useToast();
  const [clientName, setClientName] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState<Date>();
  const [selectedClipIds, setSelectedClipIds] = useState<string[]>([]);
  const [isClipSelectorOpen, setIsClipSelectorOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [links, setLinks] = useState<ClientLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingUploadsFor, setViewingUploadsFor] = useState<{ id: string; name: string } | null>(null);

  // Generate a unique token
  const generateToken = () => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };

  // Fetch existing links with clip counts
  const fetchLinks = async () => {
    setIsLoading(true);
    try {
      const { data: linksData, error } = await supabase
        .from('client_links')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch clip counts and upload counts for each link
      const linksWithCounts = await Promise.all(
        (linksData || []).map(async (link) => {
          const [clipResult, uploadResult] = await Promise.all([
            supabase
              .from('link_clips')
              .select('*', { count: 'exact', head: true })
              .eq('link_id', link.id),
            supabase
              .from('session_uploads')
              .select('*', { count: 'exact', head: true })
              .eq('link_id', link.id)
          ]);
          return { 
            ...link, 
            clip_count: clipResult.count || 0,
            upload_count: uploadResult.count || 0
          };
        })
      );
      
      setLinks(linksWithCounts);
    } catch (error: any) {
      console.error('Error fetching links:', error);
      toast({
        title: 'Error loading links',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  // Create new link
  const createLink = async () => {
    if (!clientName.trim() || !eventName.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please enter both client name and event name',
        variant: 'destructive',
      });
      return;
    }

    if (selectedClipIds.length === 0) {
      toast({
        title: 'No clips selected',
        description: 'Please select at least one clip for this session',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      const token = generateToken();
      const { data, error } = await supabase
        .from('client_links')
        .insert({
          token,
          client_name: clientName.trim(),
          event_name: eventName.trim(),
          event_date: eventDate ? format(eventDate, 'yyyy-MM-dd') : null,
        })
        .select()
        .single();

      if (error) throw error;

      // Insert selected clips for this link
      const clipInserts = selectedClipIds.map(clipId => ({
        link_id: data.id,
        clip_id: clipId,
      }));

      const { error: clipError } = await supabase
        .from('link_clips')
        .insert(clipInserts);

      if (clipError) {
        console.error('Error inserting clips:', clipError);
      }

      setLinks(prev => [{ ...data, clip_count: selectedClipIds.length }, ...prev]);
      setClientName('');
      setEventName('');
      setEventDate(undefined);
      setSelectedClipIds([]);
      setIsClipSelectorOpen(false);

      toast({
        title: 'Session created!',
        description: `${selectedClipIds.length} clips ready for client review`,
      });
    } catch (error: any) {
      console.error('Error creating link:', error);
      toast({
        title: 'Failed to create link',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Copy link to clipboard
  const copyLink = async (token: string) => {
    const url = `${window.location.origin}/session/${token}`;
    await navigator.clipboard.writeText(url);
    toast({
      title: 'Link copied!',
      description: 'Share this link with your client',
    });
  };

  // Delete link
  const deleteLink = async (id: string) => {
    try {
      const { error } = await supabase
        .from('client_links')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setLinks(prev => prev.filter(l => l.id !== id));
      toast({
        title: 'Link deleted',
        description: 'The session link has been removed',
      });
    } catch (error: any) {
      console.error('Error deleting link:', error);
      toast({
        title: 'Failed to delete',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Create New Link Form */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link2 className="w-5 h-5 text-primary" />
            Create Client Session
          </CardTitle>
          <CardDescription>
            Generate a shareable link for your client to browse and select clips
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">Client Name</Label>
              <Input
                id="client-name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g., Smith Wedding"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-name">Event Name</Label>
              <Input
                id="event-name"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g., Grand Ballroom Reception"
              />
            </div>
            <div className="space-y-2">
              <Label>Event Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !eventDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {eventDate ? format(eventDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={eventDate}
                    onSelect={setEventDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Clip Selector */}
          <Collapsible open={isClipSelectorOpen} onOpenChange={setIsClipSelectorOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  <span>Select Clips for Session</span>
                  {selectedClipIds.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                      {selectedClipIds.length} selected
                    </span>
                  )}
                </div>
                {isClipSelectorOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <ClipSelector 
                selectedClipIds={selectedClipIds}
                onSelectionChange={setSelectedClipIds}
              />
            </CollapsibleContent>
          </Collapsible>
          
          <Button
            onClick={createLink}
            disabled={isCreating || !clientName.trim() || !eventName.trim() || selectedClipIds.length === 0}
            className="w-full gap-2"
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Link2 className="w-4 h-4" />
            )}
            Generate Session ({selectedClipIds.length} clips)
          </Button>
        </CardContent>
      </Card>

      {/* Existing Links */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-primary" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Manage your client gallery sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : links.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active sessions. Create one above to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">
                      {link.client_name}
                    </h4>
                    <p className="text-sm text-muted-foreground truncate">
                      {link.event_name}
                      {link.event_date && ` • ${format(new Date(link.event_date), 'MMM d, yyyy')}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground/70">
                        Created {format(new Date(link.created_at), 'MMM d, yyyy')}
                      </span>
                      {link.clip_count !== undefined && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          <Video className="w-3 h-3" />
                          {link.clip_count} clips
                        </span>
                      )}
                      {link.upload_count !== undefined && link.upload_count > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                          <FolderOpen className="w-3 h-3" />
                          {link.upload_count} uploads
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {link.upload_count !== undefined && link.upload_count > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewingUploadsFor({ id: link.id, name: link.client_name })}
                        className="gap-1.5 border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        Files
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyLink(link.token)}
                      className="gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/session/${link.token}`, '_blank')}
                      className="gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteLink(link.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Uploads Viewer Modal */}
      {viewingUploadsFor && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[80vh] overflow-auto">
            <SessionUploadsViewer
              linkId={viewingUploadsFor.id}
              clientName={viewingUploadsFor.name}
              onClose={() => setViewingUploadsFor(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
