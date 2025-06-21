import type { VendorConfig } from '@patriot-rentals/shared-types';
import { fetchRatesViaApi } from '../sunbelt_api_replay';
import { axiosProxy } from '../utils/axiosProxy';
import { getRandomDesktopUA } from '../utils/userAgent.util';
import axios from 'axios';

export const sunbeltConfig = {
  id: 'sunbelt',
  displayName: 'Sunbelt Rentals',
  baseUrl: 'https://www.sunbeltrentals.com',
  startUrls: [
    'https://www.sunbeltrentals.com/equipment/',
    'https://www.sunbeltrentals.com/us.sitemap.en-us-equipment-rental-category-page-sitemap.xml'
  ],
  // Matches both /equipment/… and /equipment-rental/… product pages
  productUrlDetectRegex: /\/equipment(?:-rental)?\/[\w\d-]+\/[\w\d-]+\/[\d]+\/?$/i,
  // Quick guard so crawler recognises individual product pages even if they
  // were discovered via in-page links instead of sitemap
  isProductPageChecker: (url: string) =>
    /\/equipment(?:-rental)?\/[\w\d-]+\/[\w\d-]+\/[\d]+\/?$/i.test(url),
  selectors: {
    productName : 'h1.pdp__title',
    priceDay    : '[data-testid="pdp_productOneDay_price"]',
    priceWeek   : '[data-testid="pdp_productOneWeek_price"]',
    priceMonth  : '[data-testid="pdp_productFourWeek_price"]',
    sku         : 'span[data-testid="pdp_sku"]',
    description : 'div[data-testid="pdp_productdescription"]',
    imageUrl    : '.pdp__image[data-testid="pdp_productImage"], .pdp__main-image img',
    category    : 'nav.breadcrumb li:last-child'
  },
  networkIntercepts: [
    {
      // Capture the JSON returned by the pricing endpoint once a location is supplied
      urlPattern: '/commerce/pricing/',
      // We are interested only in JSON payload – resourceType not specified to match both xhr and fetch
      pricePaths: {
        productName: 'displayName',
        sku: 'catClass',
        day: 'prices.ONE_DAY',
        week: 'prices.ONE_WEEK',
        month: 'prices.FOUR_WEEK',
        currency: 'currency',
      },
    },
  ],
  // CUSTOMPARSER_PLACEHOLDER
  playwrightContextOptions: (() => {
    const ua = getRandomDesktopUA();
    return {
      viewport: { width: 1920, height: 1080 },
      userAgent: ua,
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': ua,
      },
    };
  })(),
  useFlaresolverr: true,
  notes: 'Large national rental company. Sitemaps are available and crucial for discovery. Expect strong anti-bot measures. Pricing is generally available on product pages but may require careful handling of dynamic content or location settings. The sitemap URL should be verified for validity.',
  crawlerOptions: {
    navigationTimeoutSecs: 180, // Increased timeout due to potential anti-bot measures
    maxRequestRetries: 5,
  },
  /**
   * Fallback parser – if the dynamic page refuses to reveal prices via the usual
   * Playwright + network-intercept route, call Sunbelt's public pricing API
   * directly.  This removes the headless-browser hurdle entirely.
   *
   * The API does not require authentication.  We only need:
   *   • catClass  – obtainable from the URL (last numeric segment)
   *   • storeNumber – pick a deterministic default (00075 = Orlando-FL)
   *   • start / end dates – any valid future range works, we use tomorrow->day+1
   */
  customParser: async function fallbackSunbeltParser(initial: any) {
    const url: string = initial.url;
    const m = url.match(/\/(\d{5,})\/?$/);
    if (!m) return {};

    const catClass = m[1];

    // Cape Girardeau store first (00166) then others as fallback
    const storeNumbers = ['00166', '00075', '00032', '00015', '00067'];

    // --- First attempt: legacy /v2/pdp/rates endpoint that needs cookies ---
    try {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const end      = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
      const fmt = (d: Date) => d.toISOString().split('T')[0];

      const v2 = await fetchRatesViaApi({
        sku: catClass,
        zipCode: '63701',
        startDate: fmt(tomorrow),
        endDate: fmt(end)
      });

      if (v2 && v2.pricing) {
        const { pricing } = v2;
        const currency = 'USD';
        return {
          productName: v2.productName ?? null,
          sku: catClass,
          rates: {
            perDay:   { amount: pricing.perDay,   currency },
            perWeek:  { amount: pricing.perWeek,  currency },
            perMonth: { amount: pricing.perMonth, currency },
          },
        };
      }
    } catch (err) {
      // silent: fall through to v3 strategy
    }

    const today = new Date();
    const start = new Date(today.getTime() + 24 * 60 * 60 * 1000); // tomorrow
    const end   = new Date(start.getTime() + 24 * 60 * 60 * 1000); // +1 day
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    const buildApiUrl = (store: string) =>
      `https://api.sunbeltrentals.com/commerce/pricing/v3?catClass=${catClass}&storeNumber=${store}&startDate=${fmt(start)}&endDate=${fmt(end)}&quantity=1&delivery=false&pickup=false`;

    const maxAttemptsPerStore = 3;

    const usingScrapingBee =
      (process.env.HTTP_PROXY_STRING || '').includes('proxy.scrapingbee.com') &&
      !!process.env.SCRAPINGBEE_API_KEY;

    for (const store of storeNumbers) {
      for (let attempt = 1; attempt <= maxAttemptsPerStore; attempt++) {
        try {
          let json: any;
          let status: number;

          if (usingScrapingBee) {
            // Route the request through ScrapingBee HTML-API instead of direct pricing API
            const target = encodeURIComponent(buildApiUrl(store));
            const beeUrl = `https://app.scrapingbee.com/api/v1/?api_key=${process.env.SCRAPINGBEE_API_KEY}&url=${target}&render_js=False&premium_proxy=True`;

            const resp = await axios.get(beeUrl, {
              timeout: 30000,
              validateStatus: () => true,
              headers: { 'User-Agent': getRandomDesktopUA() },
            });
            status = resp.status;
            // The HTML API simply forwards the JSON body unchanged when render_js=false
            json = resp.data;
          } else {
            const resp = await axiosProxy({
              url: buildApiUrl(store),
              method: 'GET',
              headers: {
                'User-Agent': getRandomDesktopUA(),
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                'sec-ch-ua-platform': '"Windows"',
                'sec-ch-ua-mobile': '?0',
                'Referer': `https://www.sunbeltrentals.com/equipment-rental/earth-moving/2-000-lb-mini-excavator/${catClass}/`,
                'Origin': 'https://www.sunbeltrentals.com',
              },
              timeout: 30000,
              validateStatus: () => true,
            });
            status = resp.status;
            json = resp.data;
          }

          if (status >= 500) {
            // Gateway timeout or server error – retry
            await new Promise(res => setTimeout(res, attempt * 750));
            continue;
          }

          if (status >= 400) {
            // client error – break this store number
            break;
          }

          const currency = json.currency || 'USD';
          const rates: any = {};
          if (json.prices?.ONE_DAY  != null) rates.perDay   = { amount: json.prices.ONE_DAY,   currency };
          if (json.prices?.ONE_WEEK != null) rates.perWeek  = { amount: json.prices.ONE_WEEK,  currency };
          if (json.prices?.FOUR_WEEK!= null) rates.perMonth = { amount: json.prices.FOUR_WEEK, currency };

          return {
            productName: json.displayName ?? null,
            sku: json.catClass ?? null,
            rates,
          };
        } catch (err: any) {
          // network-level failure; retry same store
          if (attempt < maxAttemptsPerStore) {
            await new Promise(res => setTimeout(res, attempt * 750));
            continue;
          }
        }
      }
    }

    return { error: 'pricing api failed after retries' };
  },
  rateParsingConfig: {
    currencySymbol: '$',
    decimalSeparator: '.',
    thousandSeparator: ','
  }
} as unknown as VendorConfig; 