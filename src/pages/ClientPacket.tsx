import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import soleiaLogo from '@/assets/soleia-wide-logo.png';

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
}

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
        .select('title, client_name, event_date, intro, inclusions, scope')
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
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground/70">
        © {new Date().getFullYear()} Soleia Creative Team
      </footer>
    </div>
  );
}
