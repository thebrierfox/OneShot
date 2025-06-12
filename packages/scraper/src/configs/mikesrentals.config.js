"use strict";
// @ts-nocheck
Object.defineProperty(exports, "__esModule", { value: true });
exports.mikesRentalsConfig = void 0;
exports.mikesRentalsConfig = {
    id: 'mikesrentals',
    displayName: "Mike's Rentals Inc.",
    baseUrl: 'http://www.mikerentalsinc.com',
    startUrls: [
        'http://www.mikerentalsinc.com/',
        'http://www.mikerentalsinc.com/rental-equipment/'
    ],
    productUrlDetectRegex: '/(?:rental-categories|equipment|item)/[\\w-]+(?:/[\\w-]+)?/?$',
    // ISPRODUCTPAGECHECKER_PLACEHOLDER
    selectors: {
        productName: 'h1.entry-title, .product-title', // Placeholder
        priceDay: '.price-daily, .rate-day', // Placeholder
        priceWeek: '.price-weekly, .rate-week', // Placeholder
        priceMonth: '.price-monthly, .rate-month', // Placeholder
        sku: '.sku, .product-id', // Placeholder
        description: '.product-description, .entry-content', // Placeholder
        imageUrl: 'img.main-product-img::attr(src), .wp-post-image::attr(src)', // Placeholder
        category: '.current-category, .breadcrumbs .last' // Placeholder for category
    },
    // NETWORKINTERCEPTS_PLACEHOLDER
    // CUSTOMPARSER_PLACEHOLDER
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
//# sourceMappingURL=mikesrentals.config.js.map