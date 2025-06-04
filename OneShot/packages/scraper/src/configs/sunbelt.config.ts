import type { VendorConfig } from '@patriot-rentals/shared-types';

export const sunbeltConfig: VendorConfig = {
  id: 'sunbelt',
  displayName: 'Sunbelt Rentals',
  baseUrl: 'https://www.sunbeltrentals.com',
  startUrls: [
    'https://www.sunbeltrentals.com/equipment/',
    'https://www.sunbeltrentals.com/us.sitemap.en-us-equipment-rental-category-page-sitemap.xml'
  ],
  productUrlDetectRegex: '/equipment/[\\w\\d-]+/[\\w\\d-]+/[\\d]+/?$',
  // ISPRODUCTPAGECHECKER_PLACEHOLDER
  selectors: {
    productName: 'h1[data-testid="pdp-title"], h1.product-title', // Placeholder based on guidance
    priceDay: 'div[data-testid="daily-rate"] span[data-testid="price"], .price-daily .amount', // Placeholder
    priceWeek: 'div[data-testid="weekly-rate"] span[data-testid="price"], .price-weekly .amount', // Placeholder
    priceMonth: 'div[data-testid="monthly-rate"] span[data-testid="price"], .price-monthly .amount', // Placeholder
    sku: 'p[data-testid="product-sku"] span, .product-sku .value', // Placeholder
    description: 'div[data-testid="product-description-full"], .product-description', // Placeholder
    imageUrl: 'img.product-image, img[data-testid="main-product-image"]::attr(src)', // Placeholder
    category: '.breadcrumbs .category-link, nav[aria-label="breadcrumb"] li:last-child a' // Placeholder for category
  },
  // NETWORKINTERCEPTS_PLACEHOLDER
  // CUSTOMPARSER_PLACEHOLDER
  playwrightContextOptions: {
    // Viewport, userAgent, etc., can be specified here if needed for Sunbelt
    // Example: userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36'
  },
  useFlaresolverr: true,
  notes: 'Large national rental company. Sitemaps are available and crucial for discovery. Expect strong anti-bot measures. Pricing is generally available on product pages but may require careful handling of dynamic content or location settings. The sitemap URL should be verified for validity.',
  crawlerOptions: {
    navigationTimeoutSecs: 180, // Increased timeout due to potential anti-bot measures
    maxRequestRetries: 5,
  },
  rateParsingConfig: {
    currencySymbol: '$',
    decimalSeparator: '.',
    thousandSeparator: ','
  }
}; 