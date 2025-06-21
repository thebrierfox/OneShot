import type { VendorConfig } from '@patriot-rentals/shared-types';

export const fabickRentsConfig: VendorConfig = {
  id: 'fabickrents',
  displayName: 'Fabick Rents (The Cat Rental Store)',
  baseUrl: 'https://www.fabickcat.com',
  startUrls: [
    'https://www.fabickcat.com/rental/',
    'https://www.fabickcat.com/rental/equipment-rental/aerial-work-platforms/',
    'https://www.fabickcat.com/rental/equipment-rental/earthmoving-equipment/',
    'https://www.fabickcat.com/rental/equipment-rental/light-towers/'
  ],
  productUrlDetectRegex: '/rental/equipment-rental/[\\w-]+/[\\w-]+(?:/[A-Z0-9-]+)?/?$',
  isProductPageChecker: (url: string) =>
    /\/rental\/equipment-rental\/[^/]+\/[^/]+(?:\/[A-Z0-9-]+)?\/?$/.test(url),
  selectors: {
    productName: 'h1',
    priceDay: '.daily-rate-value',
    priceWeek: '.weekly-rate-value',
    priceMonth: '.monthly-rate-value',
    sku: '[itemprop="sku"]',
    description: '#overview-tab-content',
    imageUrl: '.product-image-gallery img',
    category: '.breadcrumbs .active'
  },
  networkIntercepts: [],
  customParser: undefined,
  playwrightContextOptions: {},
  useFlaresolverr: true, // Might be useful if they have bot detection on category pages
  notes: "Part of the 'Cat Rental Store' network. May share platform similarities with other Cat dealers. Pricing information might not be directly listed and often requires a quote request. If prices are consistently not listed online, this vendor cannot be fully scraped for rates and may need to be excluded or handled differently. Verify if XML sitemaps are available.",
  crawlerOptions: {
    navigationTimeoutSecs: 120,
    maxRequestRetries: 3,
  },
  rateParsingConfig: {
    currencySymbol: '$',
    decimalSeparator: '.',
    thousandSeparator: ','
  }
}; 