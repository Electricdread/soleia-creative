import type { BarColor } from '@/components/calendar/EventStatusBadge';

/**
 * Indiglo (owner, 2026-09-14): a booking with a job assigned or a packet
 * deployed is drawn in DreamlinkX OS's accent glow, #5AA9FF, whatever its
 * Tripleseat status -- the work on it is live.
 */
export function getIndigloBarColor(): BarColor {
  return {
    bg: 'from-[#5aa9ff]/20',
    border: 'border-[#5aa9ff]/70',
    text: 'text-[#1d5a96] dark:text-[#9dccff]',
    glow: 'shadow-[0_0_14px_rgba(90,169,255,0.18)]',
  };
}
