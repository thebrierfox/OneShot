import { sunbeltConfig } from '../src/configs/sunbelt.config';

describe('Sunbelt selector sanity', () => {
  it('daily/weekly/monthly selectors are non-empty strings', () => {
    const { priceDay, priceWeek, priceMonth } = sunbeltConfig.selectors as any;
    expect(priceDay.length).toBeGreaterThan(0);
    expect(priceWeek.length).toBeGreaterThan(0);
    expect(priceMonth.length).toBeGreaterThan(0);
  });
}); 