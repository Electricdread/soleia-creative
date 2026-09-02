/**
 * Where the intro email's Confirm button lands.
 *
 * This page exists on the app rather than inside the edge function because
 * Supabase's function gateway rewrites every response to `text/plain` and
 * serves it under `Content-Security-Policy: default-src 'none'; sandbox` —
 * so a page returned from a function is printed as source, and its script
 * never runs. Michelle saw exactly that.
 *
 * Confirming still happens only on a press, which POSTs the token. Corporate
 * mail scanners follow links before a person ever does; a GET therefore reads
 * the state and changes nothing.
 */

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Check } from 'lucide-react';

const FN = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pm-intro`;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface IntroStatus {
  display_name: string | null;
  job_count: number;
  confirmed: boolean;
}

type Phase = 'loading' | 'ready' | 'saving' | 'done' | 'missing' | 'error';

export default function PmConfirm() {
  const [params] = useSearchParams();
  const token = params.get('t') ?? params.get('confirm') ?? '';
  const [phase, setPhase] = useState<Phase>('loading');
  const [status, setStatus] = useState<IntroStatus | null>(null);

  useEffect(() => {
    if (!token) { setPhase('missing'); return; }
    let live = true;
    (async () => {
      try {
        const res = await fetch(`${FN}?confirm=${encodeURIComponent(token)}`, {
          headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
        });
        if (!live) return;
        if (!res.ok) { setPhase('missing'); return; }
        const body = (await res.json()) as IntroStatus;
        setStatus(body);
        setPhase(body.confirmed ? 'done' : 'ready');
      } catch {
        if (live) setPhase('error');
      }
    })();
    return () => { live = false; };
  }, [token]);

  const confirm = useCallback(async () => {
    setPhase('saving');
    try {
      const res = await fetch(FN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: KEY, Authorization: `Bearer ${KEY}` },
        body: JSON.stringify({ confirm: token }),
      });
      if (!res.ok) throw new Error('confirm failed');
      setPhase('done');
    } catch {
      setPhase('error');
    }
  }, [token]);

  const first = (status?.display_name ?? '').trim().split(/\s+/)[0] || null;
  const projects = status
    ? status.job_count === 1 ? 'project' : `${status.job_count} projects`
    : 'projects';

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-primary/15 bg-card/60 p-10 text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
          Soleia Creative
        </span>

        {phase === 'loading' && (
          <div className="mt-8 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}

        {(phase === 'ready' || phase === 'saving') && (
          <>
            <h1 className="mt-3 font-display text-2xl text-foreground">
              One press to confirm{first ? `, ${first}` : ''}
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
              This tells the studio the pipeline emails for your {projects} are reaching your inbox.
            </p>
            <button
              type="button"
              onClick={confirm}
              disabled={phase === 'saving'}
              className="glow-gold transition-luxury mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3 text-[15px] font-bold text-primary-foreground disabled:opacity-70"
            >
              {phase === 'saving' && <Loader2 className="h-4 w-4 animate-spin" />}
              {phase === 'saving' ? 'Confirming…' : "Confirm — I've got this"}
            </button>
          </>
        )}

        {phase === 'done' && (
          <>
            <div className="mt-6 flex justify-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/40 text-primary">
                <Check className="h-6 w-6" />
              </span>
            </div>
            <h1 className="mt-4 font-display text-2xl text-foreground">
              Confirmed — thank you{first ? `, ${first}` : ''}
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
              Pipeline notifications for your {projects} are reaching you at this address.
              Nothing else to do — you can close this tab.
            </p>
          </>
        )}

        {phase === 'missing' && (
          <>
            <h1 className="mt-3 font-display text-2xl text-foreground">This link has expired</h1>
            <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
              We could not find that confirmation. Ask the studio to send a fresh one.
            </p>
          </>
        )}

        {phase === 'error' && (
          <>
            <h1 className="mt-3 font-display text-2xl text-foreground">That did not go through</h1>
            <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
              Something went wrong on our side.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="transition-luxury mt-8 rounded-lg border border-primary/40 px-7 py-3 text-[15px] font-semibold text-primary"
            >
              Try again
            </button>
          </>
        )}
      </div>
    </main>
  );
}
