import type { VendorConfig } from '@patriot-rentals/shared-types';

export const farmingtonRentalStoreConfig: VendorConfig = {
  id: 'farmingtonrentalstore',
  displayName: 'Farmington Rental Store (True Value)',
  baseUrl: 'https://www.truevaluerentalfarmington.com',
  startUrls: [
    'https://www.truevaluerentalfarmington.com/',
    'https://www.truevaluerentalfarmington.com/equipment-rentals/',
    'https://www.truevaluerentalfarmington.com/event-party-rentals/'
  ],
  productUrlDetectRegex: '/rentals/(?:equipment|tools|event-party)/[\\w-]+(?:/[\\w-]+)?/?$',
  // ISPRODUCTPAGECHECKER_PLACEHOLDER
  selectors: {
    productName: 'h1.page-title, .product_title', // Placeholder
    priceDay: '.price-daily .amount, .rental-rate-day', // Placeholder
    priceWeek: '.price-weekly .amount, .rental-rate-week', // Placeholder
    priceMonth: '.price-monthly .amount, .rental-rate-month', // Placeholder, check for '4 week'
    sku: '.sku, .product-meta .sku', // Placeholder
    description: '.product-description, .woocommerce-product-details__short-description', // Placeholder
    imageUrl: 'img.wp-post-image::attr(src), .product-image img::attr(src)', // Placeholder
    category: '.breadcrumbs .trail-end, .product_meta .posted_in a' // Placeholder for category
  },
  // NETWORKINTERCEPTS_PLACEHOLDER
  // CUSTOMPARSER_PLACEHOLDER
  playwrightContextOptions: {},
  useFlaresolverr: false,
  notes: "Affiliated with True Value, located in Farmington, MO. May use a True Value provided rental website platform. Pricing seems to be available. Site structure expected to be simpler than national chains.",
  crawlerOptions: {
    navigationTimeoutSecs: 90,
    maxRequestRetries: 2,
  },
  rateParsingConfig: {
    currencySymbol: '$',
    decimalSeparator: '.',
    thousandSeparator: ','
  }
}; 