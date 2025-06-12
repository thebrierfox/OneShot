"use strict";
// @ts-nocheck
Object.defineProperty(exports, "__esModule", { value: true });
exports.fabickRentsConfig = void 0;
exports.fabickRentsConfig = {
    id: 'fabickrents',
    displayName: 'Fabick Rents (The Cat Rental Store)',
    baseUrl: 'https://www.fabickcat.com',
    startUrls: [
        'https://www.fabickcat.com/rental/',
        'https://www.fabickcat.com/rental/equipment-rental/aerial-work-platforms/',
        'https://www.fabickcat.com/rental/equipment-rental/earthmoving-equipment/',
        'https://www.fabickcat.com/rental/equipment-rental/light-towers/'
    ],
    productUrlDetectRegex: '/rental/equipment/[\\w-]+/[\\w-]+(?:/[A-Z0-9]+)?/?$',
    // ISPRODUCTPAGECHECKER_PLACEHOLDER
    selectors: {
        productName: 'h1.product-title, .product-detail-header h1', // Placeholder
        priceDay: '.daily-rate-value, .price-info .day-price', // Placeholder, may not exist
        priceWeek: '.weekly-rate-value, .price-info .week-price', // Placeholder, may not exist
        priceMonth: '.monthly-rate-value, .price-info .month-price', // Placeholder, may not exist
        sku: '.product-sku, [itemprop="sku"]', // Placeholder for CAT Model or SKU
        description: '.product-description, #overview-tab-content', // Placeholder
        imageUrl: 'img.product-main-image::attr(src), .product-image-gallery img::attr(src)', // Placeholder
        category: '.breadcrumbs .active, .product-category-link' // Placeholder for category
    },
    // NETWORKINTERCEPTS_PLACEHOLDER
    // CUSTOMPARSER_PLACEHOLDER
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
//# sourceMappingURL=fabickrents.config.js.map