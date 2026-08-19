import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Loader2, ArrowUp, ArrowDown, Repeat } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CreativeTimeline } from './CreativeTimeline';

/**
 * The creative brief a client fills in inside their session.
 *
 * Designed to feel like a conversation rather than a form: every answer saves
 * itself as it is typed, so there is no submit button to fear and nothing to
 * lose by closing the tab. Questions are grouped the way the night runs —
 * the feel of the room, the palette, the arrival moment, then the pacing.
 */

const AUTOSAVE_DELAY_MS = 900;


type ElevatorMode = 'messages' | 'branding_loop' | 'undecided';
type PartyAnswer = 'yes' | 'no' | 'unsure';

interface BriefState {
  mood: string;
  vibe: string;
  color_scheme: string;
  avoid: string;
  elevator_mode: ElevatorMode | '';
  elevator_up: string;
  elevator_down: string;
  transforms_to_party: PartyAnswer | '';
  looks_count: number | null;
  notes: string;
}

const EMPTY: BriefState = {
  mood: '',
  vibe: '',
  color_scheme: '',
  avoid: '',
  elevator_mode: '',
  elevator_up: '',
  elevator_down: '',
  transforms_to_party: '',
  looks_count: null,
  notes: '',
};

function Section({
  step,
  title,
  blurb,
  children,
}: {
  step: string;
  title: string;
  blurb?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-primary/15 py-8 first:border-t-0 first:pt-0">
      <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">{step}</span>
      <h3 className="mt-2 font-display text-2xl leading-tight text-foreground">{title}</h3>
      {blurb && <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">{blurb}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function ChoiceCard({
  selected,
  onClick,
  icon,
  title,
  body,
}: {
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex h-full w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
        selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
      }`}
    >
      {icon && <span className="mt-0.5 shrink-0 text-primary">{icon}</span>}
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{body}</span>
      </span>
    </button>
  );
}

export interface CreativeBriefProps {
  token: string;
  eventName?: string | null;
  /**
   * Fold the questions behind a summary row. A client who has already sent
   * their brief gets it closed; anyone who has not gets it open, so the
   * questions are never something they have to go looking for.
   */
  collapsible?: boolean;
}

export function CreativeBrief({ token, eventName, collapsible = false }: CreativeBriefProps) {
  const [state, setState] = useState<BriefState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null);
  const [open, setOpen] = useState(false);
  const timer = useRef<number | null>(null);
  const dirty = useRef(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc('get_creative_brief_by_token', { p_token: token });
      const row = data?.[0];
      if (row) {
        setState({
          mood: row.mood ?? '',
          vibe: row.vibe ?? '',
          color_scheme: row.color_scheme ?? '',
          avoid: row.avoid ?? '',
          elevator_mode: (row.elevator_mode as ElevatorMode) ?? '',
          elevator_up: row.elevator_up ?? '',
          elevator_down: row.elevator_down ?? '',
          transforms_to_party: (row.transforms_to_party as PartyAnswer) ?? '',
          looks_count: row.looks_count ?? null,
          notes: row.notes ?? '',
        });
        if (row.updated_at) setSavedAt(new Date(row.updated_at));
        if (row.submitted_at) setSubmittedAt(new Date(row.submitted_at));
      }
      setOpen(!row?.submitted_at);
      setLoading(false);
    })();
  }, [token]);

  const persist = useCallback(
    async (next: BriefState, submit = false) => {
      setSaving(true);
      const { error } = await supabase.rpc('save_creative_brief_by_token', {
        p_token: token,
        p_mood: next.mood || undefined,
        p_vibe: next.vibe || undefined,
        p_color_scheme: next.color_scheme || undefined,
        p_avoid: next.avoid || undefined,
        p_elevator_mode: next.elevator_mode || undefined,
        p_elevator_up: next.elevator_up || undefined,
        p_elevator_down: next.elevator_down || undefined,
        p_transforms_to_party: next.transforms_to_party || undefined,
        p_looks_count: next.looks_count ?? undefined,
        p_notes: next.notes || undefined,
        p_submit: submit,
      });
      setSaving(false);
      if (!error) {
        dirty.current = false;
        setSavedAt(new Date());
        if (submit) setSubmittedAt((prev) => prev ?? new Date());
      }
    },
    [token],
  );

  // Debounced autosave: typing should never require a deliberate save.
  const update = <K extends keyof BriefState>(key: K, value: BriefState[K]) => {
    setState((prev) => {
      const next = { ...prev, [key]: value };
      dirty.current = true;
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => persist(next), AUTOSAVE_DELAY_MS);
      return next;
    });
  };

  // A closing tab should not drop the last few keystrokes.
  useEffect(() => {
    const onHide = () => {
      if (dirty.current && timer.current) {
        window.clearTimeout(timer.current);
        void persist(state);
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [state, persist]);

  const answered = useMemo(
    () =>
      [
        state.mood,
        state.vibe,
        state.color_scheme,
        state.avoid,
        state.elevator_mode,
        state.transforms_to_party,
        state.looks_count ? String(state.looks_count) : '',
      ].filter((v) => String(v ?? '').trim().length > 0).length,
    [state],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading your creative brief…
      </div>
    );
  }

  if (collapsible && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-4 rounded-2xl border border-primary/15 bg-card/40 px-6 py-5 text-left transition-colors hover:border-primary/40"
      >
        <span className="min-w-0 flex-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Creative Brief</span>
          <span className="mt-1.5 block font-display text-lg text-foreground">
            Tell us how the night should feel.
          </span>
          <span className="mt-1 block text-[13px] text-muted-foreground">
            {submittedAt
              ? 'Sent to our team — open it to change anything.'
              : `A few short questions · ${answered} of 7 answered`}
          </span>
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 text-primary" />
      </button>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <header className="mb-8">
        <span className="font-mono text-[11px] uppercase tracking-[0.34em] text-primary">Creative Brief</span>
        <h2 className="mt-3 font-display text-3xl leading-tight text-foreground sm:text-4xl">
          Tell us how the night should feel.
        </h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          A few questions so the content we build belongs to {eventName || 'your event'} rather than to a
          template. There is nothing to submit — everything saves as you go, and you can come back and
          change any of it.
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
          {saving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
            </>
          ) : savedAt ? (
            <>
              <Check className="h-3.5 w-3.5 text-primary" /> Saved · {answered} of 7 answered
            </>
          ) : (
            <>{answered} of 7 answered</>
          )}
        </div>
      </header>

      <Section
        step="01"
        title="The feel of the room"
        blurb="However you would describe it to a friend is exactly right — we translate it from there."
      >
        <div>
          <Label htmlFor="mood" className="text-sm text-foreground">Mood of the event</Label>
          <Textarea
            id="mood"
            value={state.mood}
            onChange={(e) => update('mood', e.target.value)}
            placeholder="Warm and intimate · high energy · polished and corporate · celebratory…"
            className="mt-2 min-h-[80px]"
          />
        </div>
        <div>
          <Label htmlFor="vibe" className="text-sm text-foreground">Overall vibe</Label>
          <Textarea
            id="vibe"
            value={state.vibe}
            onChange={(e) => update('vibe', e.target.value)}
            placeholder="A networking speakeasy? An awards night? A product launch that turns into a party?"
            className="mt-2 min-h-[80px]"
          />
        </div>
      </Section>

      <Section
        step="02"
        title="Colour and brand"
        blurb="Your palette drives everything on the wall, so it helps to know both what to lean into and what to stay away from."
      >
        <div>
          <Label htmlFor="colors" className="text-sm text-foreground">Colour scheme</Label>
          <Textarea
            id="colors"
            value={state.color_scheme}
            onChange={(e) => update('color_scheme', e.target.value)}
            placeholder="Brand colours, hex codes if you have them, or simply the feeling — deep golds, cool blues…"
            className="mt-2 min-h-[80px]"
          />
        </div>
        <div>
          <Label htmlFor="avoid" className="text-sm text-foreground">Anything to avoid</Label>
          <Textarea
            id="avoid"
            value={state.avoid}
            onChange={(e) => update('avoid', e.target.value)}
            placeholder="Colours that clash with your brand, a competitor's palette, imagery or motifs to keep off the screens…"
            className="mt-2 min-h-[80px]"
          />
        </div>
      </Section>

      <Section
        step="03"
        title="The arrival moment"
        blurb="Your elevator animation is included in the Creative Package Upgrade. It is the first branded surface your guests see, so we encourage using it to greet them."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <ChoiceCard
            selected={state.elevator_mode === 'messages'}
            onClick={() => update('elevator_mode', 'messages')}
            icon={<ArrowUp className="h-4 w-4" />}
            title="Greet your guests"
            body="A message on the ride up, and another on the ride down."
          />
          <ChoiceCard
            selected={state.elevator_mode === 'branding_loop'}
            onClick={() => update('elevator_mode', 'branding_loop')}
            icon={<Repeat className="h-4 w-4" />}
            title="Branding loop"
            body="Keep it simple — your mark, running throughout."
          />
          <ChoiceCard
            selected={state.elevator_mode === 'undecided'}
            onClick={() => update('elevator_mode', 'undecided')}
            title="Not sure yet"
            body="We will bring a recommendation to your creative call."
          />
        </div>

        {state.elevator_mode === 'messages' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="ride-up" className="flex items-center gap-1.5 text-sm text-foreground">
                <ArrowUp className="h-3.5 w-3.5 text-primary" /> Ride up
              </Label>
              <Input
                id="ride-up"
                value={state.elevator_up}
                onChange={(e) => update('elevator_up', e.target.value)}
                placeholder="Welcome to the 2026 Partner Summit"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="ride-down" className="flex items-center gap-1.5 text-sm text-foreground">
                <ArrowDown className="h-3.5 w-3.5 text-primary" /> Ride down
              </Label>
              <Input
                id="ride-down"
                value={state.elevator_down}
                onChange={(e) => update('elevator_down', e.target.value)}
                placeholder="Thank you for joining us tonight"
                className="mt-2"
              />
            </div>
          </div>
        )}
      </Section>

      <Section
        step="04"
        title="How the night moves"
        blurb="Rooms rarely hold one energy all evening. Knowing where it goes lets us pace the content to match."
      >
        <div>
          <p className="mb-2 text-sm text-foreground">Does the event turn over to a nightclub or party vibe?</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {([
              ['yes', 'Yes', 'It shifts into a party later in the night.'],
              ['no', 'No', 'One consistent tone throughout.'],
              ['unsure', 'Not sure yet', 'Still shaping the run of show.'],
            ] as [PartyAnswer, string, string][]).map(([value, title, body]) => (
              <ChoiceCard
                key={value}
                selected={state.transforms_to_party === value}
                onClick={() => update('transforms_to_party', value)}
                title={title}
                body={body}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-sm text-foreground">How many looks?</p>
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
            We usually suggest 1–3 looks to set the pace across the night — for example an arrival look, a
            dinner or programme look, and a late-night look.
          </p>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => update('looks_count', state.looks_count === n ? null : n)}
                aria-pressed={state.looks_count === n}
                className={`rounded-full border px-5 py-2 text-sm transition-colors ${
                  state.looks_count === n
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40'
                }`}
              >
                {n} {n === 1 ? 'look' : 'looks'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="notes" className="text-sm text-foreground">Anything else we should know</Label>
          <Textarea
            id="notes"
            value={state.notes}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="Key moments to hit, speakers, sponsor obligations, a reference you love…"
            className="mt-2 min-h-[90px]"
          />
        </div>
      </Section>

      {/* Creative timeline — what happens next, so the brief ends with clarity
          rather than a dead end. */}
      <footer className="mt-4 rounded-2xl border border-primary/15 bg-card/40 p-7">
        <CreativeTimeline />
        <p className="mt-6 border-t border-primary/15 pt-4 text-[13px] leading-relaxed text-muted-foreground">
          Your answers reach the Soleia creative team as you write them. We will bring a direction to your
          creative call — you do not need to have it all figured out here.
        </p>
        {/* Autosave means nothing is ever lost, but a client still wants a
            moment where they have handed it over. This is that moment — and it
            is what tells us the brief is ready to work from. */}
        <div className="mt-4">
          {submittedAt ? (
            <p className="flex items-center gap-2 text-[13px] text-primary">
              <Check className="h-4 w-4" />
              Sent to our team on {submittedAt.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} —
              anything you change from here still reaches us.
            </p>
          ) : (
            <Button size="sm" onClick={() => persist(state, true)} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {saving ? 'Sending' : 'Send to our creative team'}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

export default CreativeBrief;
