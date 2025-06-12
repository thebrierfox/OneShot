"use strict";
// @ts-nocheck
Object.defineProperty(exports, "__esModule", { value: true });
exports.patriotConfig = void 0;
exports.patriotConfig = {
    id: 'patriot',
    displayName: 'Patriot Equipment Rentals',
    baseUrl: 'https://www.rentwithpatriot.com',
    startUrls: [
        'https://www.rentwithpatriot.com/sitemap.xml', // Placeholder - Operator to verify/update
        'https://www.rentwithpatriot.com/equipment-rentals/' // Placeholder - Operator to verify/update
    ],
    productUrlDetectRegex: '/equipment/(?:[\\w-]+/)?([\\w-]+)/?$', // CRITICAL: Operator must verify/update
    // ISPRODUCTPAGECHECKER_PLACEHOLDER
    selectors: {
        productName: 'h1.product-name', // CRITICAL_PLACEHOLDER
        priceDay: '.price-per-day .amount', // CRITICAL_PLACEHOLDER
        priceWeek: '.price-per-week .amount', // CRITICAL_PLACEHOLDER
        priceMonth: '.price-per-month .amount', // CRITICAL_PLACEHOLDER
        sku: '.product-details .sku', // CRITICAL_PLACEHOLDER
        description: '.product-full-description', // CRITICAL_PLACEHOLDER
        imageUrl: 'img.product-main-image::attr(src)', // CRITICAL_PLACEHOLDER
        category: '.breadcrumbs .category-link-active' // CRITICAL_PLACEHOLDER
    },
    // NETWORKINTERCEPTS_PLACEHOLDER
    // CUSTOMPARSER_PLACEHOLDER
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
//# sourceMappingURL=patriot.config.js.map