/** Max message length for 100K scale - keep payloads small */
export const MAX_MESSAGE_LENGTH = 64 * 1024; // 64KB

/** Sanitize text: trim, normalize whitespace, remove control chars */
export function sanitizeText(input: string, maxLen = MAX_MESSAGE_LENGTH): string {
  if (typeof input !== 'string') return '';
  let s = input
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '') // control chars
    .trim();
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

/** Validate message content before send */
export function validateMessageContent(content: string): { valid: boolean; error?: string } {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Message content is required' };
  }
  const sanitized = sanitizeText(content);
  if (sanitized.length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  if (sanitized.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, error: `Message too long (max ${MAX_MESSAGE_LENGTH} chars)` };
  }
  return { valid: true };
}
