// Temporary stub for higher-level ETL orchestration helpers.
// This prevents TypeScript build errors until real logic is implemented.

import type { RawScrapedProduct, NormalizedProduct, VendorConfig } from '@patriot-rentals/shared-types';
import { normalizeRawProductData } from './normalization.service';
import { saveNormalizedProduct } from '../db/postgres.service';
import { RawProduct, CleanProduct } from '@patriot-rentals/common/types/shared';
import { normalize } from '@patriot-rentals/common/utils/url.util';

export async function etlProcessAndInsert(raw: RawScrapedProduct, vendorConfig?: VendorConfig): Promise<NormalizedProduct> {
  const normalized = normalizeRawProductData(raw, vendorConfig);
  try {
    const idOrUndefined = await saveNormalizedProduct(normalized);
    if (typeof idOrUndefined === 'number') normalized.id = idOrUndefined;
  } catch (e) {
    // swallow for now
  }
  return normalized;
}

export function clean(raw: RawProduct[]): CleanProduct[] {
  return raw
    .filter(p => p && typeof p.price === 'number' && !Number.isNaN(p.price))
    .map<CleanProduct>(p => ({
      url: normalize(p.url),
      name: (p.name ?? '').trim(),
      price: p.price!,
      sku: (p.sku ?? '').trim(),
      vendor: p.vendor,
    }));
} 