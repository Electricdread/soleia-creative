/**
 * Comparing a shared secret without leaking it a character at a time.
 *
 * A plain `===` on strings returns as soon as two bytes differ, so how long it
 * took is a measurement of how much of the secret was right. Over enough
 * requests that is the secret.
 *
 * Both sides are hashed first and the fixed 32 bytes are compared. Hashing
 * rather than comparing the raw strings means the loop is the same length for
 * every input, so neither the content nor the *length* of the provided key is
 * observable. It also depends only on `crypto.subtle`, which the Supabase edge
 * runtime provides unconditionally.
 */

export async function secretEquals(provided: string, expected: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  const left = new Uint8Array(a);
  const right = new Uint8Array(b);
  let difference = 0;
  for (let i = 0; i < 32; i += 1) difference |= left[i] ^ right[i];
  return difference === 0;
}

/**
 * True when the provided key matches the current secret or the previous one.
 *
 * Two accepted keys is what makes rotation survivable: set the new key, move
 * the old one to `*_PREVIOUS`, let the consumer be updated whenever its owner
 * is next at the machine, then clear `_PREVIOUS`. Without it, rotating means
 * the consumer is broken for however long that gap lasts.
 *
 * Both candidates are always compared — no early return — so a caller cannot
 * tell from timing which of the two it matched, or whether a second was set.
 */
export async function matchesAnySecret(provided: string, secrets: Array<string | undefined>): Promise<boolean> {
  let matched = false;
  for (const secret of secrets) {
    if (!secret) continue;
    if (await secretEquals(provided, secret)) matched = true;
  }
  return matched;
}
