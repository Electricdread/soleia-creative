import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, ArrowLeft, ExternalLink, Copy, Download, Mail, Smartphone, Monitor, Check } from 'lucide-react';
import { toast } from 'sonner';
import soleiaLogo from '@/assets/soleia-wide-logo.png';

type EmailType = 'signup' | 'magiclink' | 'recovery' | 'invite' | 'email_change' | 'reauthentication';

interface TemplateMeta {
  type: EmailType;
  label: string;
  description: string;
  sampleData: Record<string, string>;
}

const TEMPLATES: TemplateMeta[] = [
  {
    type: 'signup',
    label: 'Signup confirmation',
    description: 'Sent after a new user registers — they click to verify their email.',
    sampleData: { recipient: 'user@example.test', confirmationUrl: '(verification link)' },
  },
  {
    type: 'magiclink',
    label: 'Magic link',
    description: 'Passwordless login link sent on demand.',
    sampleData: { confirmationUrl: '(magic login link)' },
  },
  {
    type: 'recovery',
    label: 'Password recovery',
    description: 'Sent when a user requests a password reset.',
    sampleData: { confirmationUrl: '(password reset link)' },
  },
  {
    type: 'invite',
    label: 'Invitation',
    description: 'Sent when an admin invites a user to join.',
    sampleData: { confirmationUrl: '(accept invitation link)' },
  },
  {
    type: 'email_change',
    label: 'Email change',
    description: 'Sent to confirm an email address change request.',
    sampleData: { email: 'old@example.test', newEmail: 'new@example.test', confirmationUrl: '(confirm link)' },
  },
  {
    type: 'reauthentication',
    label: 'Reauthentication (OTP)',
    description: 'One-time code sent for sensitive actions like password changes.',
    sampleData: { token: '123456' },
  },
];

type ViewportMode = 'desktop' | 'mobile';

export default function AdminEmailPreviews() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading } = useAuth();

  const [selectedType, setSelectedType] = useState<EmailType>('signup');
  const [html, setHtml] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) navigate('/admin/login');
    if (!isLoading && user && !isAdmin) navigate('/');
  }, [user, isAdmin, isLoading, navigate]);

  const selectedMeta = useMemo(
    () => TEMPLATES.find((t) => t.type === selectedType)!,
    [selectedType],
  );

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    const fetchPreview = async () => {
      setLoading(true);
      setError(null);
      setHtml('');
      try {
        const { data, error: fnErr } = await supabase.functions.invoke('preview-auth-email', {
          body: { type: selectedType },
        });
        if (cancelled) return;
        if (fnErr) throw fnErr;
        if (data?.error) throw new Error(data.error);
        setHtml(data?.html || '');
        setSubject(data?.subject || '');
      } catch (e: any) {
        if (cancelled) return;
        console.error('Preview fetch failed', e);
        setError(e?.message || 'Failed to load preview');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchPreview();
    return () => {
      cancelled = true;
    };
  }, [selectedType, isAdmin]);

  const copyHtml = async () => {
    if (!html) return;
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      toast.success('HTML copied to clipboard');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const downloadHtml = () => {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soleia-${selectedType}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openInNewTab = () => {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  if (isLoading || !isAdmin) return null;

  const iframeWidth = viewport === 'mobile' ? 375 : 600;

  return (
    <div className="relative min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin')}
              className="text-muted-foreground hover:text-foreground gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Admin
            </Button>
            <div className="w-px h-6 bg-border" />
            <img src={soleiaLogo} alt="Soleia" className="h-7 object-contain" />
            <div className="hidden sm:flex items-center gap-2 ml-2">
              <Mail className="w-4 h-4 text-primary" />
              <h1 className="text-sm font-semibold text-foreground">Auth Email Previews</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Sidebar */}
        <aside>
          <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3 px-1">
            Templates
          </div>
          <div className="space-y-1">
            {TEMPLATES.map((tpl) => {
              const active = tpl.type === selectedType;
              return (
                <button
                  key={tpl.type}
                  onClick={() => setSelectedType(tpl.type)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                    active
                      ? 'bg-primary/10 border-primary/40 text-foreground'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="text-sm font-medium">{tpl.label}</div>
                  <div className="text-[11px] text-muted-foreground/70 mt-0.5 line-clamp-2">
                    {tpl.description}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Preview panel */}
        <section className="min-w-0 space-y-4">
          {/* Subject + sample data */}
          <Card className="p-4 bg-card border-border">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary mb-1">
                  Subject
                </div>
                <div className="text-base font-semibold text-foreground truncate">
                  {loading ? '…' : subject || '—'}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  From: <span className="font-mono">soleia-creative &lt;noreply@notify.dsxcreativelab.com&gt;</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="flex items-center rounded-md border border-border bg-background p-0.5">
                  <button
                    onClick={() => setViewport('desktop')}
                    className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition ${
                      viewport === 'desktop'
                        ? 'bg-primary/15 text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Desktop width (600px)"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    600
                  </button>
                  <button
                    onClick={() => setViewport('mobile')}
                    className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition ${
                      viewport === 'mobile'
                        ? 'bg-primary/15 text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Mobile width (375px)"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    375
                  </button>
                </div>
              </div>
            </div>

            {/* Sample data chips */}
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2">
                Sample data injected
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(selectedMeta.sampleData).map(([k, v]) => (
                  <span
                    key={k}
                    className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-muted border border-border text-muted-foreground"
                  >
                    <span className="text-primary">{k}</span>
                    <span className="opacity-50">=</span>
                    <span className="truncate max-w-[200px]">{v}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={openInNewTab}
                disabled={!html}
                className="gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open in new tab
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyHtml}
                disabled={!html}
                className="gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                Copy HTML
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadHtml}
                disabled={!html}
                className="gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download .html
              </Button>
            </div>
          </Card>

          {/* Preview iframe */}
          <Card className="p-0 bg-muted/30 border-border overflow-hidden">
            <div className="px-4 py-2 border-b border-border bg-card/60 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Live preview
              </span>
              <span className="text-[10px] text-muted-foreground/70">
                {iframeWidth}px wide
              </span>
            </div>
            <div className="flex justify-center p-6 min-h-[600px]">
              {loading ? (
                <div className="flex items-center justify-center h-[400px] w-full">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-[400px] w-full">
                  <div className="text-center max-w-md">
                    <p className="text-sm font-medium text-destructive mb-1">Preview failed</p>
                    <p className="text-xs text-muted-foreground">{error}</p>
                  </div>
                </div>
              ) : (
                <iframe
                  key={`${selectedType}-${viewport}`}
                  title={`${selectedMeta.label} preview`}
                  srcDoc={html}
                  sandbox=""
                  className="bg-background border border-border shadow-sm rounded transition-all"
                  style={{ width: iframeWidth, height: 720 }}
                />
              )}
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
