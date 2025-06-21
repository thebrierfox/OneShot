import { fetchRatesViaApi } from '../src/sunbelt_api_replay';

describe('Sunbelt fallback API', () => {
  it('returns pricing for SKU 0350110', async () => {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    const res: any = await fetchRatesViaApi({
      sku: '0350110',
      zipCode: '63701',
      startDate: fmt(today),
      endDate: fmt(tomorrow),
    });

    expect(res).toBeDefined();
    expect(res.pricing?.perDay).toBeGreaterThan(0);
  }, 30000);
}); 