// Sender and internal recipients for one-off notification emails.
//
// These functions post to Resend directly rather than going through the queue in
// ./email-provider.ts, because they carry attachments or fire on a single user
// action. What they do share is who the mail comes from and who internally needs
// to see it, and that belongs in configuration rather than in seven files.
//
//   EMAIL_FROM           "Soleia Creative <noreply@soleiacreative.app>"
//   ADMIN_NOTIFY_EMAILS  comma-separated internal recipients
//
// Resend will only deliver from a domain verified in its dashboard. With no
// EMAIL_FROM set we fall back to Resend's shared sandbox sender, and that sender
// can only deliver to the Resend account owner's own address — a request naming
// any other recipient is rejected outright with a 403, taking every recipient in
// it down, not just the offending one. That is why sendEach posts one request
// per recipient: an address Resend will not accept must never be able to
// suppress the copy that would otherwise have arrived.

const SANDBOX_FROM = 'Soleia Creative <onboarding@resend.dev>';

/** The address that owns the Resend account, and so the one the sandbox sender can always reach. */
const DEFAULT_ADMIN = 'ninemilelion@gmail.com';

export function notifyFrom(): string {
  return Deno.env.get('EMAIL_FROM')?.trim() || SANDBOX_FROM;
}

export function usingSandboxSender(): boolean {
  return notifyFrom() === SANDBOX_FROM;
}

export function adminRecipients(): string[] {
  const raw = Deno.env.get('ADMIN_NOTIFY_EMAILS')?.trim();
  const list = (raw || DEFAULT_ADMIN)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set(list));
}

export interface NotificationMessage {
  to: string[];
  subject: string;
  html: string;
  attachments?: { filename: string; content: string }[];
}

export interface DeliveryReport {
  delivered: string[];
  failed: { to: string; error: string }[];
  /** True when the sandbox sender is in use, which caps delivery at the account owner. */
  sandbox: boolean;
}

/** Send one message per recipient so a rejected address cannot take the others with it. */
export async function sendEach(msg: NotificationMessage): Promise<DeliveryReport> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) throw new Error('RESEND_API_KEY not configured');

  const from = notifyFrom();
  const recipients = Array.from(new Set(msg.to.map((t) => t.trim()).filter(Boolean)));
  const report: DeliveryReport = { delivered: [], failed: [], sandbox: usingSandboxSender() };

  for (const to of recipients) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject: msg.subject,
          html: msg.html,
          ...(msg.attachments ? { attachments: msg.attachments } : {}),
        }),
      });

      if (res.ok) {
        report.delivered.push(to);
      } else {
        const error = await res.text();
        console.error('Resend rejected a recipient', { to, from, error });
        report.failed.push({ to, error });
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      console.error('Resend request failed', { to, from, error });
      report.failed.push({ to, error });
    }
  }

  return report;
}
