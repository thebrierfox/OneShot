import type { VendorConfig } from '@patriot-rentals/shared-types';

export const unitedRentalsConfig: VendorConfig = {
  id: 'unitedrentals',
  displayName: 'United Rentals',
  baseUrl: 'https://www.unitedrentals.com',
  startUrls: [
    'https://www.unitedrentals.com/equipment-rentals/'
    // Operator Action Item: Investigate and add the primary equipment sitemap URL for United Rentals if available.
  ],
  productUrlDetectRegex: '/equipment-rentals/[\\w-]+(?:/[\\w-]+)?/[\\w\\d-]+(?:/\\d+)?/?$',
  isProductPageChecker: (url: string) =>
    /\/equipment-rentals\/[\w-]+(?:\/[\w-]+)?\/[\w\d-]+(?:\/\d+)?\/?$/.test(url),
  selectors: {
    productName: 'h1.pdp-title',
    priceDay: '[data-testid="pdp_productOneDay_price"]',
    priceWeek: '[data-testid="pdp_productOneWeek_price"]',
    priceMonth: '[data-testid="pdp_productFourWeek_price"]',
    sku: '[data-testid="product-sku"]',
    description: '[data-testid="product-description"]',
    imageUrl: '.pdp-image-gallery img',
    category: '.breadcrumb-item:last-child a'
  },
  networkIntercepts: [],
  customParser: undefined,
  playwrightContextOptions: {
    // geolocation: { latitude: 40.7128, longitude: -74.0060 }, // Example: New York, NY
    // locale: 'en-US',
  },
  useFlaresolverr: true,
  notes: "World's largest equipment rental company. Pricing may be dynamic based on user's ZIP code set via site interaction (e.g., modal or initial redirect). Scraping might need to simulate location selection if prices aren't default or use a fixed service ZIP code. Sophisticated tech stack and anti-bot measures expected.",
  crawlerOptions: {
    navigationTimeoutSecs: 180, 
    maxRequestRetries: 5,
  },
  rateParsingConfig: {
    currencySymbol: '$',
    decimalSeparator: '.',
    thousandSeparator: ','
  }
}; 