import type { VendorConfig } from '@patriot-rentals/shared-types';

export const mikesRentalsConfig: VendorConfig = {
  id: 'mikesrentals',
  displayName: "Mike's Rentals Inc.",
  baseUrl: 'http://www.mikerentalsinc.com',
  startUrls: [
    'http://www.mikerentalsinc.com/',
    'http://www.mikerentalsinc.com/rental-equipment/'
  ],
  productUrlDetectRegex: '/equipment\.asp\?action=category&category=\\d+&key=[^/]+$',
  isProductPageChecker: (url: string) =>
    /equipment\.asp\?action=category&category=\d+&key=[^/]+$/.test(url),
  selectors: {
    productName: 'h1',
    priceDay: 'input[name="intDaily1"]',
    priceWeek: 'input[name="intWeekly1"]',
    priceMonth: 'input[name="intMonthly1"]',
    sku: '.por-item-detail-model',
    description: '.por-item-detail-comments',
    imageUrl: '.por-item-detail-image',
    category: '.por-item-detail-name'
  },
  networkIntercepts: [],
  customParser: undefined,
  playwrightContextOptions: {},
  useFlaresolverr: false, // Not expected to be needed for a simpler site
  notes: "Local business in Sikeston, MO. Website is stated to have prices and availability. Expected to be a simpler site structure with less aggressive anti-bot measures compared to national chains.",
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