// Core shared domain models used across OneShot packages.
// This file consolidates the larger interface set referenced by crawler, scraper, ETL
// and report packages.  Keep this aligned with the original OneShotRef.jsonc spec.

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

export const DEFAULT_RATE_PARSING_CONFIG: RateParsingConfig = {
  currencySymbol: '$',
  decimalSeparator: '.',
  thousandSeparator: ',',
};

export interface VendorConfig {
  id: string;
  displayName: string;
  baseUrl: string;
  startUrls: string[];
  productUrlDetectRegex: string;
  selectors: Record<string, string>;
  rateParsingConfig?: RateParsingConfig;
  useFlaresolverr?: boolean;
  /** Additional Playwright context launch options (e.g., userAgent, viewport) */
  playwrightContextOptions?: Record<string, any>;

  /** Additional crawler-level tuning such as navigationTimeoutSecs etc. */
  crawlerOptions?: Record<string, any>;

  /** Network interception rules used by scraper to parse JSON responses for pricing. */
  networkIntercepts?: Array<{
    urlPattern: string;
    resourceType?: string;
    pricePaths: Record<string, string>; // path within JSON payload
  }>;

  /** Optional custom parser for sites that require bespoke logic. */
  customParser?: (html: string, initialData?: any) => Promise<Partial<RawScrapedProduct>> | Partial<RawScrapedProduct>;

  /** Function that determines if a URL is in fact a product page (used during crawl). */
  isProductPageChecker?: (url: string, html: string) => boolean;

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