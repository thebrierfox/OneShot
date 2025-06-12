import { RawScrapedProduct, NormalizedProduct, VendorConfig, RentalRates, DEFAULT_RATE_PARSING_CONFIG } from '@patriot-rentals/shared-types';

const DEFAULT_CURRENCY = 'USD';

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

  const rates: RentalRates = rawProduct.rates || {};

  return {
    id: undefined, // Will be set by Postgres
    vendorId: rawProduct.vendorId,
    url: rawProduct.url,
    scrapedAt: rawProduct.scrapedAt || new Date().toISOString(),
    productName: rawProduct.productName || null,
    dayRate: rates?.perDay?.amount || null,
    weekRate: rates?.perWeek?.amount || null,
    monthRate: rates?.perMonth?.amount || null,
    currency: rates?.perDay?.currency || rates?.perWeek?.currency || rates?.perMonth?.currency || null,
    sku: rawProduct.sku || null,
    description: rawProduct.description || null,
    imageUrl: rawProduct.imageUrl || null,
    category: rawProduct.category || null,
    patriotSku: null,
    lastMatchedAt: null,
  };
}

// Backwards-compat: some legacy code imports { normalize } from this module.
// Re-export alias until callers are updated.
export const normalize = normalizeRawProductData; 