import { ProxyConfiguration } from 'crawlee';
import { anonymizeProxy } from 'proxy-chain';

/**
 * Generates a Crawlee ProxyConfiguration object from a proxy string.
 * Anonymizes the proxy URL using proxy-chain.
 * @param proxyString The proxy string (e.g., http://user:pass@host:port).
 * @returns A Promise resolving to a ProxyConfiguration object or undefined.
 */
export async function getProxyConfiguration(
  proxyString?: string,
): Promise<ProxyConfiguration | undefined> {
  if (!proxyString) {
    return undefined;
  }

  try {
    const anonymizedProxyUrl = await anonymizeProxy(proxyString);
    if (!anonymizedProxyUrl) {
      console.warn(`Failed to anonymize proxy: ${proxyString}`);
      return undefined;
    }
    return new ProxyConfiguration({
      proxyUrls: [anonymizedProxyUrl],
    });
  } catch (error) {
    console.error(`Error configuring proxy with string "${proxyString}":`, error);
    return undefined;
  }
} 