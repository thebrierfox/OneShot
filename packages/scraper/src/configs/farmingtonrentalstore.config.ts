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
  productUrlDetectRegex: '/products/[\\w-]+/?$',
  isProductPageChecker: (url: string) => /\/products\/[^/]+\/?$/.test(url),
  selectors: {
    productName: 'h1[itemprop="name"]',
    priceDay: 'div.option[data-title*="1 Day"]',
    priceWeek: 'div.option[data-title*="1 Week"]',
    priceMonth: 'div.option[data-title*="4 Week"], div.option[data-title*="1 Month"]',
    sku: 'meta[itemprop="sku"]',
    description: '.product-single__description',
    imageUrl: 'meta[property="og:image"]',
    category: '.breadcrumb .is-active'
  },
  networkIntercepts: [],
  customParser: undefined,
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