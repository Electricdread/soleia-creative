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
  /** What this is, for the send log. Defaults to the subject if omitted. */
  template?: string;
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

/**
 * Record every attempt, delivered or not.
 *
 * email_send_log existed and this path never wrote to it, so there was no way
 * to answer "did that address get it?" except by asking the person. A PM went
 * months without proposal mail and nothing anywhere said so. Logging is
 * best-effort by design: a failure to record must never fail a send.
 */
async function logAttempt(entry: {
  template: string;
  to: string;
  // The table's own vocabulary, enforced by a CHECK constraint:
  // pending | sent | suppressed | failed | bounced | complained | dlq.
  status: 'sent' | 'failed';
  error?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return;
    const res = await fetch(`${url}/rest/v1/email_send_log`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        template_name: entry.template,
        recipient_email: entry.to,
        status: entry.status,
        error_message: entry.error ?? null,
        metadata: entry.meta ?? {},
      }),
    });
    // fetch does not throw on a 4xx, so without this a rejected insert is
    // silent — which is how the first version of this logged nothing at all
    // while reporting success.
    if (!res.ok) {
      console.error('email_send_log rejected a row', {
        status: res.status, body: (await res.text()).slice(0, 300), entry,
      });
    }
  } catch (e) {
    console.error('Could not write to email_send_log', e);
  }
}

/** Send one message per recipient so a rejected address cannot take the others with it. */
export async function sendEach(msg: NotificationMessage): Promise<DeliveryReport> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) throw new Error('RESEND_API_KEY not configured');

  const configuredFrom = notifyFrom();
  const template = msg.template ?? msg.subject;
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
            await logAttempt({ template, to, status: 'failed', error, meta: { from: SANDBOX_FROM } });
            continue;
          }
        } else {
          console.error('Resend rejected a recipient', { to, from: configuredFrom, error: firstError });
          report.failed.push({ to, error: firstError });
          await logAttempt({ template, to, status: 'failed', error: firstError, meta: { from: configuredFrom } });
          continue;
        }
      } else if (!res.ok) {
        const error = await res.text();
        console.error('Resend rejected a recipient', { to, from: configuredFrom, error });
        report.failed.push({ to, error });
        await logAttempt({ template, to, status: 'failed', error, meta: { from: configuredFrom } });
        continue;
      }

      report.delivered.push(to);
      if (viaFallback) {
        report.sandboxFallback.push(to);
        report.sandbox = true;
      }
      await logAttempt({
        template, to, status: 'sent',
        meta: { from: viaFallback ? SANDBOX_FROM : configuredFrom, sandbox_fallback: viaFallback },
      });
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      console.error('Resend request failed', { to, from: configuredFrom, error });
      report.failed.push({ to, error });
      await logAttempt({ template, to, status: 'failed', error, meta: { from: configuredFrom } });
    }
  }

  return report;
}
