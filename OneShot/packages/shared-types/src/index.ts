// JSDoc comments for all types and interfaces are mandatory.

/** Represents a monetary value with currency. */
export interface Price {
  /** The numerical amount of the price. */
  amount: number;
  /** The ISO 4217 currency code (e.g., "USD"). */
  currency: string;
}

/** Defines rental rates for different periods. */
export interface RentalRates {
  /** Price for daily rental. */
  perDay?: Price | null;
  /** Price for weekly rental. */
  perWeek?: Price | null;
  /** Price for monthly (typically 4-week or 28-day) rental. */
  perMonth?: Price | null;
}

/** Raw data structure directly from scraping a product page. */
export interface RawScrapedProduct {
  /** Unique identifier for the competitor, e.g., "sunbelt". */
  vendorId: string;
  /** Full URL of the scraped product page. */
  url: string;
  /** ISO 8601 timestamp of when scraping occurred. */
  scrapedAt: string;
  /** Product name as extracted from the page. */
  productName?: string | null;
  /** Parsed rental rates from the page. */
  rates?: RentalRates | null;
  /** Vendor's Stock Keeping Unit (SKU) or product ID. */
  sku?: string | null;
  /** Product description text. */
  description?: string | null;
  /** URL of the primary product image. */
  imageUrl?: string | null;
  /** Product category as identified on the page. */
  category?: string | null;
  /** Full HTML content of the page, stored mainly for debugging failed extractions. */
  rawHtmlContent?: string;
  /** Any intercepted JSON payload that might contain price or product data. */
  networkJsonPayload?: any;
  /** Error message if scraping this specific item failed. */
  error?: string | null;
  /** HTTP status code of the page response during scrape attempt. */
  httpStatus?: number | null;
}

/** Normalized product data after ETL, ready for storage and analysis. */
export interface NormalizedProduct {
  /** Auto-generated Postgres ID after insertion. */
  id?: number;
  /** Unique identifier for the competitor. */
  vendorId: string;
  /** Full URL of the scraped product page. */
  url: string;
  /** ISO 8601 timestamp of when scraping occurred. */
  scrapedAt: string;
  /** Product name. */
  productName?: string | null;
  /** Numeric daily rental rate. */
  dayRate?: number | null;
  /** Numeric weekly rental rate. */
  weekRate?: number | null;
  /** Numeric monthly rental rate. */
  monthRate?: number | null;
  /** Normalized ISO 4217 currency code (e.g., "USD"). */
  currency?: string | null;
  /** Vendor's SKU. */
  sku?: string | null;
  /** Product description. */
  description?: string | null;
  /** URL of the primary product image. */
  imageUrl?: string | null;
  /** Product category. */
  category?: string | null;
  /** Matched Patriot Equipment Rentals SKU, if any. */
  patriotSku?: string | null;
  /** ISO 8601 timestamp of the last successful SKU match. */
  lastMatchedAt?: string | null;
  /** Optional: Embedding vector for the product, if stored directly in Postgres. */
  // embeddingVector?: number[];
}

/** Configuration for a specific competitor vendor, used by crawler and scraper. */
export interface VendorConfig {
  /** Unique lowercase identifier for the vendor (e.g., "sunbelt", "unitedrentals"). Must match filename. */
  id: string;
  /** Human-readable name for display in reports and logs. */
  displayName: string;
  /** Base URL of the competitor's website. */
  baseUrl: string;
  /** Array of initial URLs to start crawling from (e.g., category pages, sitemaps, search result pages). */
  startUrls: string[];
  /** RegExp string to identify product page URLs relative to the baseUrl or full URLs. */
  productUrlDetectRegex: string;
  /** Optional stringified JavaScript function `(url: string, pageContent: string) => boolean` to perform complex checks if a page is a product page. 
   *  `pageContent` is the full HTML of the page. This is evaluated dynamically via `eval` or `new Function()`, use with caution. */
  isProductPageChecker?: string;
  /** CSS selectors to extract data from product pages. */
  selectors: {
    productName: string;
    priceDay?: string;      // Selector for text containing daily price
    priceWeek?: string;     // Selector for text containing weekly price
    priceMonth?: string;    // Selector for text containing monthly price
    sku?: string;
    description?: string;
    imageUrl?: string;
    category?: string;
    // Example: 'meta[name="description"]::attr(content)' to get attribute value
  };
  /** Optional configurations for intercepting network requests (e.g., XHR/fetch) that might contain pricing JSON. */
  networkIntercepts?: Array<{
    /** RegExp string for the URL of the network request. */
    urlPattern: string;
    /** Optional Playwright resource type filter. */
    resourceType?: 'fetch' | 'xhr' | 'document' | 'script' | 'image' | 'stylesheet' | 'font' | 'media' | 'websocket' | 'other';
    /** Paths within the intercepted JSON payload to find pricing data. Uses dot-notation (e.g., 'data.pricingInfo.daily.amount'). */
    pricePaths: {
      day?: string;
      week?: string;
      month?: string;
      currency?: string;   // e.g., 'data.currency' or a fixed value if not in payload
      sku?: string;
      productName?: string;
    };
  }>;
  /** Optional stringified JavaScript function `(initialData: Partial<RawScrapedProduct>, page: import('playwright').Page, cheerioPage: import('cheerio').CheerioAPI) => Promise<Partial<RawScrapedProduct>>` 
   *  for custom data parsing logic AFTER initial selector/network extraction. Evaluated dynamically. */
  customParser?: string;
  /** Playwright-specific context options (e.g., viewport, userAgent, extraHTTPHeaders, locale, timezoneId). */
  playwrightContextOptions?: Record<string, any>;
  /** If true, attempts to route requests for this vendor through a FlareSolverr instance. */
  useFlaresolverr?: boolean;
  /** Human-readable notes for the operator regarding this vendor's site behavior or specific scraping strategy. */
  notes?: string;
  /** Crawlee specific options for this vendor, e.g., navigationTimeoutSecs, maxRequestRetries. */
  crawlerOptions?: {
    navigationTimeoutSecs?: number;
    maxRequestRetries?: number;
    [key: string]: any;
  };
  /** Optional: Define how to extract individual rate components if prices are not in dedicated fields. */
  rateParsingConfig?: {
    currencySymbol?: string; // e.g., '$'
    decimalSeparator?: string; // e.g., '.'
    thousandSeparator?: string; // e.g., ','
  };
}

/** Input for the main report generation orchestrator. */
export interface ReportGenerationOrchestratorInput {
  /** Optional array of specific vendor IDs (from VendorConfig.id) to process. If undefined or empty, process all configured vendors. */
  vendorIdsToProcess?: string[];
  /** If true, forces re-crawling and re-scraping of all target URLs, ignoring recently scraped data. */
  forceRecrawlAll?: boolean;
  /** If true, forces re-scraping of URLs found by crawler, even if recently scraped. */
  forceRescrapeFound?: boolean;
  /** If true, skips the crawling phase and attempts to re-process/re-match existing data. */
  skipCrawling?: boolean;
  /** If true, skips the matching phase. */
  skipMatching?: boolean;
}

/** Represents a Patriot catalog item. */
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