import { clean } from '../src/services/etl.service';
import type { RawProduct } from '@patriot-rentals/common/types/shared';

describe('etl.clean()', () => {
  const raw: RawProduct[] = [
    { url: 'https://EXAMPLE.com/a?x=1', name: ' A ', price: 10, sku: 'SKU1 ', vendor: 'demo' },
    { url: 'invalid', name: null, price: NaN, sku: null, vendor: 'demo' },
  ];

  it('filters invalid price rows and normalizes remaining', () => {
    const cleaned = clean(raw);
    expect(cleaned).toHaveLength(1);
    expect(cleaned[0]).toMatchObject({
      url: 'https://example.com/a',
      name: 'A',
      price: 10,
      sku: 'SKU1',
      vendor: 'demo',
    });
  });
}); 