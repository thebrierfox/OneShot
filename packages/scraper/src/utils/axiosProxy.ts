import axios, { AxiosRequestConfig } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

/**
 * Thin wrapper around axios that automatically applies the proxy defined in
 * `process.env.HTTP_PROXY_STRING` to every request.  By centralising the logic
 * we guarantee that *all* HTTP/S calls made by the scraper respect the same
 * egress IP and we avoid repeating agent-plumbing code across files.
 */
export function axiosProxy<T = any>(config: AxiosRequestConfig) {
  const proxyUrl = process.env.HTTP_PROXY_STRING;
  let agent: any = undefined;
  if (proxyUrl) {
    if (proxyUrl.startsWith('socks')) {
      agent = new SocksProxyAgent(proxyUrl);
    } else {
      // Disable TLS verification for ScrapingBee proxy mode
      if (proxyUrl.includes('proxy.scrapingbee.com')) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      }
      agent = new HttpsProxyAgent(proxyUrl);
    }
  }

  return axios.request<T>({
    ...config,
    // Supply agents when we have a proxy; otherwise fall back to direct.
    httpAgent: agent,
    httpsAgent: agent,
    // Disable axios's built-in proxy feature so we rely solely on the agent.
    proxy: false,
    timeout: config.timeout ?? 10000,
  });
} 