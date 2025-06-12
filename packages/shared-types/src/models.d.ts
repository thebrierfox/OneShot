export interface Price {
    amount: number;
    currency: string;
}
export interface RentalRates {
    perDay?: Price | null;
    perWeek?: Price | null;
    perMonth?: Price | null;
}
export interface RawScrapedProduct {
    vendorId: string;
    url: string;
    scrapedAt: string;
    productName?: string | null;
    rates?: RentalRates | null;
    sku?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    category?: string | null;
    rawHtmlContent?: string;
    networkJsonPayload?: any;
    error?: string | null;
    httpStatus?: number | null;
}
export interface NormalizedProduct {
    id?: number;
    vendorId: string;
    url: string;
    scrapedAt: string;
    productName?: string | null;
    dayRate?: number | null;
    weekRate?: number | null;
    monthRate?: number | null;
    currency?: string | null;
    sku?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    category?: string | null;
    patriotSku?: string | null;
    lastMatchedAt?: string | null;
}
export interface RateParsingConfig {
    currencySymbol?: string;
    decimalSeparator?: string;
    thousandSeparator?: string;
}
export declare const DEFAULT_RATE_PARSING_CONFIG: RateParsingConfig;
export interface VendorConfig {
    id: string;
    displayName: string;
    baseUrl: string;
    startUrls: string[];
    productUrlDetectRegex: string;
    selectors: Record<string, string>;
    rateParsingConfig?: RateParsingConfig;
    useFlaresolverr?: boolean;
    notes?: string;
}
export interface ReportGenerationOrchestratorInput {
    vendorIdsToProcess?: string[];
    forceRecrawlAll?: boolean;
    forceRescrapeFound?: boolean;
    skipCrawling?: boolean;
    skipMatching?: boolean;
}
export interface PatriotCatalogItem {
    patriotSku: string;
    productName?: string | null;
    description?: string | null;
    category?: string | null;
    dayRate?: number | null;
    weekRate?: number | null;
    monthRate?: number | null;
    currency?: string | null;
}
