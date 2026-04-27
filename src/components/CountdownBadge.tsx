import { differenceInCalendarDays } from 'date-fns';
import { AlertTriangle, Clock, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountdownBadgeProps {
  eventDate: string | null | undefined;
  prefix?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function getDaysUntil(eventDate: string | null | undefined): number | null {
  if (!eventDate) return null;
  try {
    // Treat plain YYYY-MM-DD as local midnight
    const d = eventDate.length <= 10 ? new Date(eventDate + 'T00:00:00') : new Date(eventDate);
    if (isNaN(d.getTime())) return null;
    return differenceInCalendarDays(d, new Date());
  } catch {
    return null;
  }
}

export function CountdownBadge({ eventDate, prefix, className, size = 'sm' }: CountdownBadgeProps) {
  const days = getDaysUntil(eventDate);
  if (days === null) return null;

  let Icon = CalendarClock;
  let label = '';
  let tone = '';

  if (days < 0) {
    Icon = AlertTriangle;
    label = `${Math.abs(days)}d overdue`;
    tone = 'bg-red-500/15 text-red-600 border-red-500/30 dark:text-red-400';
  } else if (days === 0) {
    Icon = AlertTriangle;
    label = 'Due today';
    tone = 'bg-red-500/15 text-red-600 border-red-500/30 dark:text-red-400';
  } else if (days <= 3) {
    Icon = Clock;
    label = `${days}d left`;
    tone = 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400';
  } else if (days <= 7) {
    Icon = Clock;
    label = `${days}d left`;
    tone = 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400';
  } else if (days <= 21) {
    Icon = CalendarClock;
    label = `${days}d left`;
    tone = 'bg-[#c49a3c]/15 text-[#c49a3c] border-[#c49a3c]/30';
  } else {
    Icon = CalendarClock;
    label = `${days}d left`;
    tone = 'bg-muted text-muted-foreground border-border';
  }

  const sizing = size === 'md' ? 'text-xs px-2.5 py-1 gap-1.5' : 'text-[10px] px-2 py-0.5 gap-1';
  const iconSize = size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';

  return (
    <span className={cn('inline-flex items-center rounded-full border font-semibold whitespace-nowrap', tone, sizing, className)}>
      <Icon className={iconSize} />
      {prefix ? `${prefix} ${label}` : label}
    </span>
  );
}
