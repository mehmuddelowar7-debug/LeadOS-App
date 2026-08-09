import { createHmac } from 'node:crypto'

/**
 * Verifies the X-Hub-Signature-256 header sent by Meta.
 * @param rawBody The raw request text body
 * @param signature The X-Hub-Signature-256 header value
 * @param appSecret The Meta App Secret
 * @returns boolean indicating if the signature is valid
 */
export function verifyMetaSignature(rawBody: string, signature: string | null, appSecret: string): boolean {
  if (!signature || !appSecret) return false

  const expectedSignature = `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`
  
  return expectedSignature === signature
}
