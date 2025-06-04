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
  // ISPRODUCTPAGECHECKER_PLACEHOLDER
  selectors: {
    productName: 'h1.pdp-title, h1.product-name', // Placeholder based on guidance
    priceDay: '.price-daily .amount, [data-price-type="daily"] .price', // Placeholder
    priceWeek: '.price-weekly .amount, [data-price-type="weekly"] .price', // Placeholder
    priceMonth: '.price-monthly .amount, [data-price-type="monthly"] .price', // Placeholder
    sku: '.product-sku .value, [data-testid="product-sku"]', // Placeholder
    description: '.product-description-full, [data-testid="product-description"]', // Placeholder
    imageUrl: 'img.product-main-image::attr(src), .pdp-image-gallery img::attr(src)', // Placeholder
    category: '.breadcrumb-item:last-child a, .current-category-breadcrumb' // Placeholder for category
  },
  // NETWORKINTERCEPTS_PLACEHOLDER
  // CUSTOMPARSER_PLACEHOLDER
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