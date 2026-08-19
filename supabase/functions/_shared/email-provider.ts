// Email delivery provider.
//
// The queue used to call Lovable's email service directly. This module keeps
// that path intact while adding a Resend path, so delivery can be moved off
// Lovable by flipping a single secret — and moved back the same way.
//
//   EMAIL_PROVIDER = "lovable"  (default; unchanged behaviour)
//   EMAIL_PROVIDER = "resend"   (send via Resend using RESEND_API_KEY)
//
// Both paths take and return the same shapes, so callers do not change.

import { sendLovableEmail } from 'npm:@lovable.dev/email-js'

export interface EmailPayload {
  run_id?: string
  to: string
  from?: string
  sender_domain?: string
  subject: string
  html?: string
  text?: string
  purpose?: string
  label?: string
  idempotency_key?: string
  unsubscribe_token?: string
  message_id?: string
}

/** Carries the provider's HTTP status so existing 429 retry logic keeps working. */
export class EmailSendError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'EmailSendError'
    this.status = status
  }
}

export function activeProvider(): 'lovable' | 'resend' {
  return Deno.env.get('EMAIL_PROVIDER')?.toLowerCase() === 'resend' ? 'resend' : 'lovable'
}

/**
 * Resolve the From header for either provider. The caller-supplied `from` wins;
 * EMAIL_FROM is the configured default. Resend additionally requires this
 * address to sit on a domain verified in the Resend dashboard.
 */
function resolveFrom(payload: EmailPayload): string {
  const explicit = payload.from?.trim()
  if (explicit) return explicit
  const configured = Deno.env.get('EMAIL_FROM')?.trim()
  if (configured) return configured
  throw new EmailSendError(
    'No sender address: set EMAIL_FROM (e.g. "Soleia <noreply@yourdomain.com>") or supply payload.from',
    500,
  )
}

async function sendViaResend(payload: EmailPayload & { from: string }): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) throw new EmailSendError('RESEND_API_KEY is not configured', 500)

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }
  // Resend de-duplicates on this header, preserving the queue's at-least-once
  // delivery semantics without sending twice on a retry.
  if (payload.idempotency_key) headers['Idempotency-Key'] = payload.idempotency_key

  const body: Record<string, unknown> = {
    from: payload.from,
    to: [payload.to],
    subject: payload.subject,
  }
  if (payload.html) body.html = payload.html
  if (payload.text) body.text = payload.text

  // Preserve one-click unsubscribe for non-transactional mail.
  const unsubBase = Deno.env.get('EMAIL_UNSUBSCRIBE_URL')
  if (payload.unsubscribe_token && unsubBase) {
    const url = `${unsubBase.replace(/\/$/, '')}/${payload.unsubscribe_token}`
    body.headers = {
      'List-Unsubscribe': `<${url}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new EmailSendError(
      `Resend send failed (${res.status}): ${detail.slice(0, 500)}`,
      res.status,
    )
  }
}

/** Send one message through the configured provider. */
export async function sendEmail(
  payload: EmailPayload,
  lovableOptions: { apiKey: string; sendUrl?: string },
): Promise<void> {
  const resolved = { ...payload, from: resolveFrom(payload) }
  if (activeProvider() === 'resend') {
    await sendViaResend(resolved)
    return
  }
  // The Lovable client declares html/text as required, but its runtime accepts
  // either one. Cast at the boundary so a text-only message still compiles —
  // this is the exact object shape the queue passed before the provider split.
  await sendLovableEmail(
    resolved as unknown as Parameters<typeof sendLovableEmail>[0],
    lovableOptions,
  )
}
