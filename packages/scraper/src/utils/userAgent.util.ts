// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - no types available
import UserAgent from 'user-agents';

/**
 * Returns a random up-to-date desktop user-agent string.
 */
export function getRandomDesktopUA(): string {
  const ua = new UserAgent({ deviceCategory: 'desktop' });
  return ua.toString();
} 