import type { RawScrapedProduct, NormalizedProduct, VendorConfig, RateParsingConfig } from '@patriot-rentals/shared-types';

const DEFAULT_CURRENCY = 'USD';
const DEFAULT_RATE_PARSING_CONFIG: RateParsingConfig = {
  currencySymbol: '$',
  decimalSeparator: '.',
  thousandSeparator: ',',
};

/**
 * Parses a raw price string into a numeric value based on the provided parsing configuration.
 * Handles currency symbols, thousand separators, and different decimal separators.
 * Returns null if the price string is invalid, empty, or indicates a non-numeric value (e.g., "Call for Price").
 *
 * @param priceString The raw price string to parse.
 * @param config The rate parsing configuration.
 * @returns The parsed numeric price or null.
 */
function parsePriceString(priceString: string | null | undefined, config: RateParsingConfig): number | null {
  if (!priceString || typeof priceString !== 'string') {
    return null;
  }

  let cleanedString = priceString.trim();

  // Handle common non-numeric price indications
  if (cleanedString.toLowerCase().includes('call for price') || cleanedString.toLowerCase().includes('contact us')) {
    return null;
  }

  // Remove currency symbol
  if (config.currencySymbol) {
    cleanedString = cleanedString.replace(new RegExp('\\\\' + config.currencySymbol, 'g'), '');
  }

  // Remove thousand separators
  if (config.thousandSeparator) {
    cleanedString = cleanedString.replace(new RegExp('\\\\' + config.thousandSeparator, 'g'), '');
  }

  // Replace decimal separator with a period if it's different
  if (config.decimalSeparator && config.decimalSeparator !== '.') {
    cleanedString = cleanedString.replace(new RegExp('\\\\' + config.decimalSeparator, 'g'), '.');
  }

  // Remove any remaining non-numeric characters except for the decimal point and negative sign
  cleanedString = cleanedString.replace(/[^\\d.-]/g, '');

  const numericValue = parseFloat(cleanedString);

  if (isNaN(numericValue)) {
    console.warn(`[NormalizationService] Could not parse price string: "${priceString}" to a valid number after cleaning to "${cleanedString}".`);
    return null;
  }

  return numericValue;
}

/**
 * Normalizes raw scraped product data into a standardized NormalizedProduct object.
 * It applies price parsing and basic data validation.
 *
 * @param rawProduct The raw scraped product data.
 * @param vendorConfig Optional vendor-specific configuration, including rate parsing rules.
 * @returns A NormalizedProduct object.
 */
export function normalizeRawProductData(
  rawProduct: RawScrapedProduct,
  vendorConfig?: VendorConfig,
): NormalizedProduct {
  const parsingConfig = vendorConfig?.rateParsingConfig || DEFAULT_RATE_PARSING_CONFIG;
  const currency = (vendorConfig?.rateParsingConfig?.currencySymbol && parsingConfig.currencySymbol)
    ? parsingConfig.currencySymbol 
    : DEFAULT_CURRENCY;

  if (!rawProduct.url) {
    console.warn('[NormalizationService] Raw product data is missing URL. This is highly problematic.', rawProduct);
  }
  if (!rawProduct.productName) {
    console.warn(`[NormalizationService] Raw product data for URL ${rawProduct.url} is missing productName.`);
  }

  const normalized: NormalizedProduct = {
    id: undefined, // Will be set by Postgres
    vendorId: rawProduct.vendorId,
    url: rawProduct.url,
    scrapedAt: rawProduct.scrapedAt || new Date().toISOString(),
    productName: rawProduct.productName || null,
    dayRate: parsePriceString(rawProduct.rawPriceDay, parsingConfig),
    weekRate: parsePriceString(rawProduct.rawPriceWeek, parsingConfig),
    monthRate: parsePriceString(rawProduct.rawPriceMonth, parsingConfig),
    currency: currency,
    sku: rawProduct.sku || null,
    description: rawProduct.description || null,
    imageUrl: rawProduct.imageUrl || null,
    category: rawProduct.category || null,
    breadcrumbs: rawProduct.breadcrumbs || null,
    features: rawProduct.features || null,
    specifications: rawProduct.specifications || null,
    options: rawProduct.options || null,
    metadata: rawProduct.metadata || {},
    rawJson: rawProduct.rawJson || {},
    patriotSku: null,
    lastMatchedAt: null,
  };

  return normalized;
} 