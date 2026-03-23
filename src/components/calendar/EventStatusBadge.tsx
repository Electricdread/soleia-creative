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
    definite:  { bg: 'from-[#7b8a3e]/15', border: 'border-[#7b8a3e]/40', text: 'text-[#4a4b2e] dark:text-[#b8c470]' },
    prospect:  { bg: 'from-[#c49a3c]/15', border: 'border-[#c49a3c]/40', text: 'text-[#7a6420] dark:text-[#e0c070]' },
    tentative: { bg: 'from-[#5a8fb4]/15', border: 'border-[#5a8fb4]/40', text: 'text-[#2e5f7f] dark:text-[#8ec0e0]' },
    cancelled: { bg: 'from-[#b05a5a]/15', border: 'border-[#b05a5a]/40', text: 'text-[#7a2020] dark:text-[#e09090]' },
    closed:    { bg: 'from-[#8a7d6b]/15', border: 'border-[#8a7d6b]/40', text: 'text-[#5a4f3f] dark:text-[#b0a898]' },
  };
  return map[status] || map.prospect;
}
