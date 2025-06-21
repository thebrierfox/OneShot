import type { VendorConfig } from '@patriot-rentals/shared-types';

export const patriotConfig: VendorConfig = {
  id: 'patriot',
  displayName: 'Patriot Equipment Rentals',
  baseUrl: 'https://www.rentwithpatriot.com',
  startUrls: [
    'https://www.rentwithpatriot.com/sitemap.xml',
    'https://www.rentwithpatriot.com/equipment-rentals/'
  ],
  productUrlDetectRegex: '/equipment-rentals/[\\w-]+(?:/[\\w-]+)?/?$',
  isProductPageChecker: (url: string) =>
    /\/equipment-rentals\/[\w-]+(?:\/[\w-]+)?\/?$/.test(url),
  selectors: {
    productName: 'h1.product_title',
    priceDay: '.rates-table .per-day',
    priceWeek: '.rates-table .per-week',
    priceMonth: '.rates-table .per-month',
    sku: 'span.sku',
    description: '.product-description',
    imageUrl: '.woocommerce-product-gallery__image img',
    category: '.woocommerce-breadcrumb li:last-child'
  },
  networkIntercepts: [],
  customParser: undefined,
  playwrightContextOptions: {},
  useFlaresolverr: false, // Not expected to be needed for own site
  notes: "This is Patriot's own website. The primary goal is to accurately extract its full catalog and pricing for comparison. No anti-scraping measures are expected from this site, facilitating straightforward scraping. Selectors and product URL detection are of UTMOST IMPORTANCE and MUST be meticulously defined by the operator.",
  crawlerOptions: {
    navigationTimeoutSecs: 60,
    maxRequestRetries: 2,
  },
  rateParsingConfig: {
    currencySymbol: '$',
    decimalSeparator: '.',
    thousandSeparator: ','
  }
}; 