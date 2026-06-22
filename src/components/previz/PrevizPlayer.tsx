import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface PrevizCue {
  id: string;
  time_seconds: number;
  label: string;
  color?: string | null;
  sort_order?: number;
}

interface Props {
  videoUrl: string;
  cues: PrevizCue[];
  editable?: boolean;
  onAddCue?: (timeSeconds: number) => void;
  onUpdateCue?: (id: string, patch: Partial<Pick<PrevizCue, 'time_seconds' | 'label'>>) => void;
  onDeleteCue?: (id: string) => void;
  className?: string;
}

export function formatMMSS(t: number): string {
  if (!isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const GOLD = '#c49a3c';

export function PrevizPlayer({
  videoUrl,
  cues,
  editable = false,
  onAddCue,
  onUpdateCue,
  onDeleteCue,
  className,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftLabel, setDraftLabel] = useState('');

  const sortedCues = useMemo(
    () => [...cues].sort((a, b) => a.time_seconds - b.time_seconds),
    [cues],
  );

  // rAF-driven currentTime updates so highlight feels smooth while playing
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    let raf = 0;
    const tick = () => {
      setCurrentTime(v.currentTime);
      if (!v.paused && !v.ended) raf = requestAnimationFrame(tick);
    };
    const onPlay = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    const onPause = () => {
      cancelAnimationFrame(raf);
      setCurrentTime(v.currentTime);
    };
    const onLoaded = () => setDuration(v.duration || 0);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('ended', onPause);
    v.addEventListener('loadedmetadata', onLoaded);
    v.addEventListener('timeupdate', onPause);
    return () => {
      cancelAnimationFrame(raf);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('ended', onPause);
      v.removeEventListener('loadedmetadata', onLoaded);
      v.removeEventListener('timeupdate', onPause);
    };
  }, [videoUrl]);

  const activeCueId = useMemo(() => {
    let id: string | null = null;
    for (const c of sortedCues) {
      if (c.time_seconds <= currentTime + 0.05) id = c.id;
      else break;
    }
    return id;
  }, [sortedCues, currentTime]);

  const seekTo = (t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(duration || t, t));
  };

  const handleAddAtPlayhead = () => {
    if (!onAddCue) return;
    const v = videoRef.current;
    onAddCue(v?.currentTime ?? 0);
  };

  // Keyboard 'M' drops a marker when player is focused
  useEffect(() => {
    if (!editable) return;
    const v = videoRef.current;
    if (!v) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') {
        handleAddAtPlayhead();
      }
    };
    v.addEventListener('keydown', onKey);
    return () => v.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editable, onAddCue]);

  const pct = (t: number) => (duration > 0 ? Math.min(100, Math.max(0, (t / duration) * 100)) : 0);

  return (
    <div className={cn('space-y-3', className)}>
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        playsInline
        preload="metadata"
        tabIndex={0}
        className="w-full rounded-md bg-black"
      />

      {/* Timeline strip */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
          <span>{formatMMSS(currentTime)}</span>
          <span>{formatMMSS(duration)}</span>
        </div>
        <div
          ref={stripRef}
          className="relative h-10 cursor-pointer rounded-md border border-border bg-surface-elevated"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            seekTo(ratio * duration);
          }}
        >
          {/* progress fill */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 rounded-l-md bg-foreground/5"
            style={{ width: `${pct(currentTime)}%` }}
          />
          {/* playhead */}
          <div
            className="pointer-events-none absolute top-0 bottom-0 w-px"
            style={{ left: `${pct(currentTime)}%`, background: GOLD }}
          />
          {/* cue markers */}
          {sortedCues.map((c) => {
            const left = pct(c.time_seconds);
            const isActive = c.id === activeCueId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  seekTo(c.time_seconds);
                }}
                className="group absolute -translate-x-1/2 top-0 bottom-0 flex flex-col items-center"
                style={{ left: `${left}%` }}
                title={`${formatMMSS(c.time_seconds)} — ${c.label}`}
                aria-label={`Jump to ${c.label}`}
              >
                <div
                  className={cn(
                    'mt-1 h-2 w-2 rounded-full border transition-all',
                    isActive
                      ? 'scale-150 border-transparent shadow-[0_0_10px_rgba(196,154,60,0.7)]'
                      : 'border-foreground/30 bg-background',
                  )}
                  style={isActive ? { background: c.color || GOLD } : {}}
                />
                <div className="h-3 w-px bg-foreground/20" />
                <span
                  className={cn(
                    'mt-0.5 max-w-[100px] truncate rounded px-1 text-[9px] font-medium leading-tight',
                    isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground group-hover:text-foreground',
                  )}
                  style={isActive ? { color: c.color || GOLD } : {}}
                >
                  {c.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Authoring panel */}
      {editable && (
        <div className="space-y-2 rounded-md border border-border bg-card/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Run of Show Cues
            </h4>
            <Button size="sm" variant="outline" className="h-7 gap-1.5" onClick={handleAddAtPlayhead}>
              <Plus className="h-3.5 w-3.5" />
              Add cue at {formatMMSS(currentTime)}
            </Button>
          </div>

          {sortedCues.length === 0 ? (
            <p className="py-2 text-center text-[11px] text-muted-foreground">
              Play the clip, pause at a moment, then press <span className="font-mono">M</span> or
              the button above.
            </p>
          ) : (
            <ul className="space-y-1">
              {sortedCues.map((c) => {
                const isEditing = editingId === c.id;
                return (
                  <li
                    key={c.id}
                    className={cn(
                      'flex items-center gap-2 rounded border border-border/60 bg-background/60 px-2 py-1.5',
                      c.id === activeCueId && 'border-[color:var(--gold,#c49a3c)]',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => seekTo(c.time_seconds)}
                      className="font-mono text-[11px] tabular-nums text-muted-foreground hover:text-foreground"
                      title="Jump to this cue"
                    >
                      {formatMMSS(c.time_seconds)}
                    </button>
                    {isEditing ? (
                      <>
                        <Input
                          value={draftLabel}
                          autoFocus
                          onChange={(e) => setDraftLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onUpdateCue?.(c.id, { label: draftLabel.trim() || c.label });
                              setEditingId(null);
                            } else if (e.key === 'Escape') {
                              setEditingId(null);
                            }
                          }}
                          className="h-7 flex-1 text-sm"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => {
                            onUpdateCue?.(c.id, { label: draftLabel.trim() || c.label });
                            setEditingId(null);
                          }}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 truncate text-sm text-foreground">{c.label}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => {
                            const v = videoRef.current;
                            onUpdateCue?.(c.id, { time_seconds: v?.currentTime ?? c.time_seconds });
                          }}
                          title="Retime to playhead"
                        >
                          <span className="text-[9px] font-mono">⇤</span>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditingId(c.id);
                            setDraftLabel(c.label);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => onDeleteCue?.(c.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
