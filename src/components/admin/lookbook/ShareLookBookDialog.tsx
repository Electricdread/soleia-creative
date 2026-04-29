import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Copy, Check, Link2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getPublicOrigin } from '@/lib/ogShare';
import type { LookbookCategory } from './CategoryManagerDialog';


interface ShareableClip {
  id: string;
  title: string;
  thumbnail: string | null;
  category_id: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  categories: LookbookCategory[];
  clips: ShareableClip[];
}

function genToken() {
  return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
}

export function ShareLookBookDialog({ open, onOpenChange, categories, clips }: Props) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [intro, setIntro] = useState('');
  const [scope, setScope] = useState<string>('all'); // 'all' | category id
  const [pickMode, setPickMode] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [expiresIn, setExpiresIn] = useState<string>('never'); // never | 7 | 14 | 30
  const [saving, setSaving] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<'url' | 'html' | 'md' | null>(null);

  useEffect(() => {
    if (open) {
      setTitle('');
      setIntro('');
      setScope('all');
      setPickMode(false);
      setPicked(new Set());
      setExpiresIn('never');
      setCreatedUrl(null);
      setCopied(null);
    }
  }, [open]);

  const visibleClips = useMemo(() => {
    if (scope === 'all') return clips;
    return clips.filter((c) => c.category_id === scope);
  }, [scope, clips]);

  const togglePick = (id: string) => {
    setPicked((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const create = async () => {
    if (!title.trim()) {
      toast({ title: 'Add a title', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const token = genToken();
    const expires_at =
      expiresIn === 'never'
        ? null
        : new Date(Date.now() + parseInt(expiresIn, 10) * 86400000).toISOString();

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('lookbook_shares').insert({
      token,
      title: title.trim(),
      intro_note: intro.trim() || null,
      category_id: scope === 'all' ? null : scope,
      clip_ids: pickMode && picked.size > 0 ? Array.from(picked) : null,
      expires_at,
      created_by: user?.id ?? null,
    } as any);

    setSaving(false);

    if (error) {
      toast({ title: 'Could not create share', description: error.message, variant: 'destructive' });
      return;
    }

    const url = `${getPublicOrigin()}/looks/${token}`;
    setCreatedUrl(url);
    toast({ title: 'Share link created' });
  };

  const copyUrl = async () => {
    if (!createdUrl) return;
    await navigator.clipboard.writeText(createdUrl);
    setCopied('url');
    setTimeout(() => setCopied(null), 1500);
  };

  const copyHtml = async () => {
    if (!createdUrl) return;
    const html = buildEmailHtml({ title: title.trim(), intro: intro.trim(), url: createdUrl });
    try {
      const blob = new Blob([html], { type: 'text/html' });
      const item = new ClipboardItem({
        'text/html': blob,
        'text/plain': new Blob([`${title}\n${createdUrl}`], { type: 'text/plain' }),
      });
      await navigator.clipboard.write([item]);
    } catch {
      await navigator.clipboard.writeText(html);
    }
    setCopied('html');
    setTimeout(() => setCopied(null), 1500);
  };

  const copyMd = async () => {
    if (!createdUrl) return;
    const md = `**${title}**\n\n${intro ? intro + '\n\n' : ''}[View Look Book →](${createdUrl})`;
    await navigator.clipboard.writeText(md);
    setCopied('md');
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 text-zinc-100 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#c49a3c]" style={{ fontFamily: 'DM Serif Display, serif' }}>
            Share Look Book
          </DialogTitle>
        </DialogHeader>

        {!createdUrl ? (
          <div className="space-y-5">
            <Field label="Title (internal + shown to client)">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Spring Cinematic Selects"
                className="bg-zinc-900 border-zinc-800 text-zinc-100"
                style={{ fontSize: '16px' }}
              />
            </Field>

            <Field label="Intro note (optional)">
              <Textarea
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                placeholder="A short message shown above the gallery."
                className="bg-zinc-900 border-zinc-800 text-zinc-100 min-h-[80px]"
                style={{ fontSize: '16px' }}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Scope">
                <Select value={scope} onValueChange={setScope}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                    <SelectItem value="all">All looks</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Expires">
                <Select value={expiresIn} onValueChange={setExpiresIn}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="7">In 7 days</SelectItem>
                    <SelectItem value="14">In 14 days</SelectItem>
                    <SelectItem value="30">In 30 days</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
              <div>
                <p className="text-sm text-zinc-200">Hand-pick clips</p>
                <p className="text-xs text-zinc-500">Off = include every clip in the chosen scope.</p>
              </div>
              <Switch checked={pickMode} onCheckedChange={setPickMode} />
            </div>

            {pickMode && (
              <div className="rounded-lg border border-zinc-800 max-h-64 overflow-y-auto p-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
                {visibleClips.map((c) => {
                  const on = picked.has(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => togglePick(c.id)}
                      className={`relative aspect-video rounded-md overflow-hidden border transition-colors ${
                        on ? 'border-[#c49a3c]' : 'border-zinc-800 hover:border-zinc-600'
                      }`}
                      style={{ touchAction: 'manipulation' }}
                    >
                      {c.thumbnail ? (
                        <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-zinc-900" />
                      )}
                      {on && (
                        <div className="absolute inset-0 bg-[#c49a3c]/30 flex items-center justify-center">
                          <Check className="h-5 w-5 text-black bg-[#c49a3c] rounded-full p-0.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
                {visibleClips.length === 0 && (
                  <p className="col-span-full text-xs text-zinc-500 text-center py-6">No clips in this scope.</p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-300">
                Cancel
              </Button>
              <Button
                onClick={create}
                disabled={saving}
                className="bg-[#c49a3c] hover:bg-[#b38a30] text-black"
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create share link
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-[#c49a3c]/40 bg-[#c49a3c]/5 p-4">
              <p className="text-xs uppercase tracking-wider text-[#c49a3c] mb-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                Public link
              </p>
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-zinc-400 shrink-0" />
                <code className="flex-1 text-xs sm:text-sm text-zinc-100 break-all">{createdUrl}</code>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button onClick={copyUrl} variant="outline" className="border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-[#c49a3c] h-11">
                {copied === 'url' ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                Copy URL
              </Button>
              <Button onClick={copyHtml} variant="outline" className="border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-[#c49a3c] h-11">
                {copied === 'html' ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                Copy HTML email
              </Button>
              <Button onClick={copyMd} variant="outline" className="border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-[#c49a3c] h-11">
                {copied === 'md' ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                Copy Markdown
              </Button>
            </div>

            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Paste the HTML snippet directly into an email composer or rich-text editor in your proposal / creative guide.
              The plain URL works for messaging apps and Markdown for documents.
            </p>

            <div className="flex justify-end pt-2">
              <Button onClick={() => onOpenChange(false)} className="bg-[#c49a3c] hover:bg-[#b38a30] text-black">
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs uppercase tracking-wider text-zinc-400">{label}</label>
      {children}
    </div>
  );
}

function buildEmailHtml({ title, intro, url }: { title: string; intro: string; url: string }) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#0a0a0a;font-family:Inter,Arial,sans-serif;color:#e4e4e7;border-radius:12px;overflow:hidden;">
  <tr>
    <td style="padding:32px 24px;text-align:center;background-color:#0a0a0a;border-bottom:1px solid #27272a;">
      <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c49a3c;font-family:'JetBrains Mono',monospace;">Soleia · Look Book</p>
      <h1 style="margin:0;font-family:'DM Serif Display',Georgia,serif;font-size:26px;font-weight:400;color:#fafafa;">${escapeHtml(title)}</h1>
    </td>
  </tr>
  ${intro ? `<tr><td style="padding:20px 28px 0 28px;text-align:center;color:#a1a1aa;font-size:14px;line-height:1.6;">${escapeHtml(intro)}</td></tr>` : ''}
  <tr>
    <td style="padding:28px 24px 32px 24px;text-align:center;">
      <a href="${url}" style="display:inline-block;padding:14px 28px;background-color:#c49a3c;color:#0a0a0a;text-decoration:none;font-weight:600;font-size:14px;letter-spacing:1px;text-transform:uppercase;border-radius:6px;font-family:'JetBrains Mono',monospace;">View Look Book →</a>
      <p style="margin:16px 0 0 0;font-size:11px;color:#71717a;word-break:break-all;">${url}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:16px 24px;text-align:center;background-color:#09090b;border-top:1px solid #27272a;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#52525b;font-family:'JetBrains Mono',monospace;">Curated by Soleia Creative Team</td>
  </tr>
</table>`;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
