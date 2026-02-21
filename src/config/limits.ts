/** Configuration for 100K concurrent user scale */

export const LIMITS = {
  /** Max message length in chars */
  MAX_MESSAGE_LENGTH: 64 * 1024,

  /** Max messages per request when fetching */
  MAX_MESSAGES_PER_PAGE: 100,

  /** Max rate: messages per user per minute (for future rate limiting) */
  MESSAGES_PER_MINUTE: 120,

  /** Socket rooms per server (for horizontal scaling) */
  MAX_ROOMS_PER_SERVER: 10000
} as const;
