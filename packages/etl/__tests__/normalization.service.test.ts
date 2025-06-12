import { normalizeRawProductData } from '../src/services/normalization.service';
import { RawScrapedProduct } from '@patriot-rentals/shared-types';

const raw: RawScrapedProduct = {
  vendorId: 'sunbelt',
  url: 'https://example.com/product',
  scrapedAt: '2024-01-01T00:00:00.000Z',
  productName: 'Mini Excavator',
  rates: {
    perDay: { amount: 250, currency: 'USD' },
  },
  sku: 'EXC-123',
  description: 'Desc',
  imageUrl: 'https://img',
  category: 'Excavators',
};

describe('normalizeRawProductData', () => {
  it('converts raw product to normalized form', () => {
    const norm = normalizeRawProductData(raw);
    expect(norm.vendorId).toBe(raw.vendorId);
    expect(norm.url).toBe(raw.url);
    expect(norm.dayRate).toBe(250);
    expect(norm.currency).toBe('USD');
  });

  it('handles missing rates gracefully', () => {
    const withoutRates = { ...raw, rates: undefined } as any;
    const norm = normalizeRawProductData(withoutRates);
    expect(norm.dayRate).toBeNull();
    expect(norm.currency).toBeNull();
  });
}); 