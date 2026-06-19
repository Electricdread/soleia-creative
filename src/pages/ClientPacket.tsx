import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, BookOpen, FolderOpen } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import soleiaLogo from '@/assets/soleia-wide-logo.png';
import { Button } from '@/components/ui/button';

interface Inclusion {
  heading: string;
  body: string;
}

interface Packet {
  title: string;
  client_name: string | null;
  event_date: string | null;
  intro: string | null;
  inclusions: Inclusion[];
  scope: string | null;
  creative_guide_url: string | null;
  drive_folder_url: string | null;
  kind: 'pre_call' | 'creative_pre_call' | null;
}

const DEFAULT_GUIDE_URL = 'https://soleiacreative.app/creative-guide';

export default function ClientPacket() {
  const { token } = useParams<{ token: string }>();
  const [packet, setPacket] = useState<Packet | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      if (!token) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('pre_call_packets')
        .select('title, client_name, event_date, intro, inclusions, scope, creative_guide_url, drive_folder_url, kind')
        .eq('token', token)
        .eq('is_active', true)
        .maybeSingle();
      if (error || !data) {
        setNotFound(true);
      } else {
        setPacket({
          ...data,
          inclusions: Array.isArray(data.inclusions) ? (data.inclusions as unknown as Inclusion[]) : [],
        });
      }
      setLoading(false);
    })();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !packet) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="font-display text-2xl text-foreground mb-2">Packet not available</h1>
          <p className="text-muted-foreground">This packet may have been unpublished or the link is invalid.</p>
        </div>
      </div>
    );
  }

  const guideUrl = packet.creative_guide_url?.trim() || DEFAULT_GUIDE_URL;

  return (
    <div className="panel-base min-h-screen bg-background">
      <header className="border-b border-border bg-card/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col items-center text-center">
          <img src={soleiaLogo} alt="Soleia" className="h-12 w-auto object-contain mb-4" />
          <h1 className="font-display text-3xl sm:text-4xl text-foreground">{packet.title}</h1>
          {(packet.client_name || packet.event_date) && (
            <p className="text-muted-foreground mt-2">
              {packet.client_name}
              {packet.client_name && packet.event_date && ' · '}
              {packet.event_date && format(parseISO(packet.event_date), 'MMMM d, yyyy')}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {packet.intro && (
          <section className="card-elevated bg-card border border-border rounded-lg p-6 shadow-card">
            <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{packet.intro}</p>
          </section>
        )}

        <section className="grid sm:grid-cols-2 gap-3">
          <a href={guideUrl} target="_blank" rel="noreferrer" className="block">
            <div className="card-elevated bg-card border border-primary/30 hover:border-primary/60 rounded-lg p-5 shadow-card transition-colors h-full">
              <div className="flex items-center gap-3 mb-1">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="font-display text-lg text-primary">Soleia Creative Guide</h3>
              </div>
              <p className="text-sm text-foreground/80">Open the living guide — venue, LED canvas and delivery specs.</p>
            </div>
          </a>
          {packet.drive_folder_url && (
            <a href={packet.drive_folder_url} target="_blank" rel="noreferrer" className="block">
              <div className="card-elevated bg-card border border-primary/30 hover:border-primary/60 rounded-lg p-5 shadow-card transition-colors h-full">
                <div className="flex items-center gap-3 mb-1">
                  <FolderOpen className="w-5 h-5 text-primary" />
                  <h3 className="font-display text-lg text-primary">Shared Drive Folder</h3>
                </div>
                <p className="text-sm text-foreground/80">Creative Guide files, Pixel Map and your Client Asset Collect.</p>
              </div>
            </a>
          )}
        </section>

        {packet.inclusions.length > 0 && (
          <section>
            <h2 className="font-display text-2xl text-foreground mb-4">Inclusions</h2>
            <div className="grid gap-3">
              {packet.inclusions.map((inc, i) => (
                <div
                  key={i}
                  className="card-elevated bg-card border border-border rounded-lg p-5 shadow-card"
                >
                  {inc.heading && (
                    <h3 className="font-display text-lg text-primary mb-2">{inc.heading}</h3>
                  )}
                  {inc.body && (
                    <p className="text-foreground/85 leading-relaxed whitespace-pre-wrap">{inc.body}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {packet.scope && (
          <section className="card-elevated bg-card border border-border rounded-lg p-6 shadow-card">
            <h2 className="font-display text-2xl text-foreground mb-3">Scope of Work</h2>
            <p className="text-foreground/85 leading-relaxed whitespace-pre-wrap">{packet.scope}</p>
          </section>
        )}

        {!packet.scope && (
          <div className="flex justify-center pt-2">
            <Button asChild>
              <a href={guideUrl} target="_blank" rel="noreferrer">Open Creative Guide</a>
            </Button>
          </div>
        )}
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground/70">
        © {new Date().getFullYear()} Soleia Creative Team
      </footer>
    </div>
  );
}
