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

/** Where notifications land unless ADMIN_NOTIFY_EMAILS says otherwise. */
const DEFAULT_ADMIN = 'luisdreamslv@gmail.com';

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
  /**
   * True when anything in this batch actually left over Resend's sandbox
   * sender — whether because EMAIL_FROM is unset or because the configured
   * domain was refused and the fallback caught it. Reported from what happened,
   * not from configuration, so it can be trusted on its own.
   */
  sandbox: boolean;
  /** Recipients reached only because the sandbox fallback fired. */
  sandboxFallback: string[];
}

/** Resend's wording when EMAIL_FROM points at a domain it has not verified yet. */
function isUnverifiedDomain(error: string): boolean {
  return /domain is not verified/i.test(error);
}

/** Send one message per recipient so a rejected address cannot take the others with it. */
export async function sendEach(msg: NotificationMessage): Promise<DeliveryReport> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) throw new Error('RESEND_API_KEY not configured');

  const configuredFrom = notifyFrom();
  const recipients = Array.from(new Set(msg.to.map((t) => t.trim()).filter(Boolean)));
  const report: DeliveryReport = {
    delivered: [],
    failed: [],
    sandbox: usingSandboxSender(),
    sandboxFallback: [],
  };

  const post = (from: string, to: string) =>
    fetch('https://api.resend.com/emails', {
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

  for (const to of recipients) {
    let viaFallback = false;
    try {
      let res = await post(configuredFrom, to);

      // Pointing EMAIL_FROM at a domain before Resend has verified it would
      // otherwise stop every notification. Fall back to the sandbox sender,
      // which reaches the Resend account owner if that address is among the
      // recipients; anything else fails either way and is reported.
      if (!res.ok && configuredFrom !== SANDBOX_FROM) {
        const firstError = await res.text();
        if (isUnverifiedDomain(firstError)) {
          console.warn('Sending domain not verified — falling back to the sandbox sender', { to });
          viaFallback = true;
          res = await post(SANDBOX_FROM, to);
          if (!res.ok) {
            const error = await res.text();
            console.error('Resend rejected a recipient', { to, from: SANDBOX_FROM, error });
            report.failed.push({ to, error });
            continue;
          }
        } else {
          console.error('Resend rejected a recipient', { to, from: configuredFrom, error: firstError });
          report.failed.push({ to, error: firstError });
          continue;
        }
      } else if (!res.ok) {
        const error = await res.text();
        console.error('Resend rejected a recipient', { to, from: configuredFrom, error });
        report.failed.push({ to, error });
        continue;
      }

      report.delivered.push(to);
      if (viaFallback) {
        report.sandboxFallback.push(to);
        report.sandbox = true;
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      console.error('Resend request failed', { to, from: configuredFrom, error });
      report.failed.push({ to, error });
    }
  }

  return report;
}
