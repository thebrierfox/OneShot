export function normalize(url: string): string {
  try {
    const parsed = new URL(url.trim());
    parsed.hash = '';
    parsed.search = '';
    // Lowercase hostname and protocol but keep path case as-is (some sites are case sensitive)
    parsed.protocol = parsed.protocol.toLowerCase();
    parsed.hostname = parsed.hostname.toLowerCase();
    // Remove trailing slash if not root
    const pathname = parsed.pathname.endsWith('/') && parsed.pathname !== '/' ? parsed.pathname.slice(0, -1) : parsed.pathname;
    parsed.pathname = pathname;
    return parsed.toString();
  } catch {
    return url.trim().toLowerCase();
  }
} 