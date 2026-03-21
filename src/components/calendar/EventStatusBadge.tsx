export type EventStatus = 'definite' | 'prospect' | 'tentative' | 'cancelled' | 'closed';

const statusConfig: Record<EventStatus, { label: string; bg: string; text: string; dot: string }> = {
  definite:  { label: 'DEFINITE',  bg: 'bg-[#7b8a3e]', text: 'text-white',    dot: 'bg-[#7b8a3e]' },
  prospect:  { label: 'PROSPECT',  bg: 'bg-[#c49a3c]', text: 'text-white',    dot: 'bg-[#c49a3c]' },
  tentative: { label: 'TENTATIVE', bg: 'bg-[#5a8fb4]', text: 'text-white',    dot: 'bg-[#5a8fb4]' },
  cancelled: { label: 'CANCELLED', bg: 'bg-[#b05a5a]', text: 'text-white',    dot: 'bg-[#b05a5a]' },
  closed:    { label: 'CLOSED',    bg: 'bg-[#8a7d6b]', text: 'text-white',    dot: 'bg-[#8a7d6b]' },
};

export function EventStatusBadge({ status, size = 'md' }: { status: EventStatus; size?: 'sm' | 'md' }) {
  const cfg = statusConfig[status] || statusConfig.prospect;
  return (
    <span className={`inline-flex items-center rounded font-semibold uppercase tracking-wide ${cfg.bg} ${cfg.text} ${size === 'sm' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'}`}>
      {cfg.label}
    </span>
  );
}

export function getStatusDotColor(status: EventStatus): string {
  return statusConfig[status]?.dot || statusConfig.prospect.dot;
}

export function getStatusBarColor(status: EventStatus): { bg: string; border: string; text: string } {
  const map: Record<EventStatus, { bg: string; border: string; text: string }> = {
    definite:  { bg: 'bg-[#d5d6a8]/60', border: 'border-[#c4c590]/50', text: 'text-[#4a4b2e]' },
    prospect:  { bg: 'bg-[#f0ddb0]/60', border: 'border-[#dcc88a]/50', text: 'text-[#7a6420]' },
    tentative: { bg: 'bg-[#b8d4e8]/60', border: 'border-[#9cc0d8]/50', text: 'text-[#2e5f7f]' },
    cancelled: { bg: 'bg-[#e8c0c0]/60', border: 'border-[#d8a0a0]/50', text: 'text-[#7a2020]' },
    closed:    { bg: 'bg-[#d6cfc3]/60', border: 'border-[#c4bba8]/50', text: 'text-[#5a4f3f]' },
  };
  return map[status] || map.prospect;
}
